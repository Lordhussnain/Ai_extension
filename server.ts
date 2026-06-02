import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up JSON parsing with generous limits for image/screenshot uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy init of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing (set in Settings > Secrets).");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ensure .env.example exists with needed variables (handled below)

// Helper to transform any mix of custom user messages, string messages, and incomplete fields
// into strictly matching Content objects required by the modern @google/genai SDK.
function normalizeContents(contents: any): any[] {
  if (!contents) return [];
  const list = Array.isArray(contents) ? contents : [contents];
  
  return list.map((item: any) => {
    if (typeof item === "string") {
      return {
        role: "user",
        parts: [{ text: item }]
      };
    }
    
    const role = item.role === "model" ? "model" : "user";
    const parts: any[] = [];
    
    // 1. If text is present, push a text part
    if (typeof item.text === "string" && item.text) {
      parts.push({ text: item.text });
    }
    
    // 2. If client-side top-level functionCalls array is present, map them to individual functionCall parts
    if (Array.isArray(item.functionCalls)) {
      item.functionCalls.forEach((fc: any) => {
        if (fc && fc.name) {
          parts.push({
            functionCall: {
              name: fc.name,
              args: fc.args || {},
              id: fc.id
            }
          });
        }
      });
    }
    
    // 3. If parts array is present, process and include them
    if (Array.isArray(item.parts)) {
      item.parts.forEach((p: any) => {
        if (typeof p === "string") {
          parts.push({ text: p });
        } else if (p && typeof p === "object") {
          if (p.text !== undefined) {
            parts.push({ text: p.text });
          } else if (p.functionCall) {
            parts.push({
              functionCall: {
                name: p.functionCall.name,
                args: p.functionCall.args || {},
                id: p.functionCall.id
              }
            });
          } else if (p.functionResponse) {
            parts.push({
              functionResponse: {
                name: p.functionResponse.name,
                response: p.functionResponse.response || {}
              }
            });
          } else if (p.inlineData) {
            parts.push({
              inlineData: p.inlineData
            });
          }
        }
      });
    }

    // Fallback: if parts is empty, push an empty text part to make it valid
    if (parts.length === 0) {
      parts.push({ text: "" });
    }
    
    return { role, parts };
  });
}

// API ROUTES
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Post chat proxy (optional stream)
app.post("/api/chat", async (req: any, res: any) => {
  const { contents, systemInstruction, tools, toolConfig, stream, api_key, model_override } = req.body;

  try {
    const key = api_key || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing (set in Settings > Secrets).");
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const normalized = normalizeContents(contents);

    // Set model to gemini-3.5-flash as default, or use user's override if compatible
    const model = model_override || "gemini-3.5-flash";

    // Define fallback sequence if the primary model gets overloaded (503 status/UNAVAILABLE)
    const modelsToTry = [
      model,
      ...(model !== "gemini-3.1-flash-lite" ? ["gemini-3.1-flash-lite"] : []),
      ...(model !== "gemini-flash-latest" && model !== "gemini-3.5-flash" ? ["gemini-flash-latest"] : [])
    ];

    let success = false;
    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      try {
        if (stream) {
          const responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents: normalized,
            config: {
              systemInstruction,
              tools,
              toolConfig,
            },
          });

          if (!res.headersSent) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
          }

          for await (const chunk of responseStream) {
            // Append target fallback information inside stream chunk if needed
            const chunkData = {
              ...chunk,
              actualModel: currentModel,
              fallbackTriggered: currentModel !== model
            };
            res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
          }
          res.write("data: [DONE]\n\n");
          res.end();
          success = true;
          break;
        } else {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: normalized,
            config: {
              systemInstruction,
              tools,
              toolConfig,
            },
          });

          const augmentedResponse = {
            ...response,
            actualModel: currentModel,
            fallbackTriggered: currentModel !== model
          };
          res.json(augmentedResponse);
          success = true;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err);
        console.warn(`[CHAT FALLBACK] Call with model "${currentModel}" failed. Error:`, errStr);
        // Only retry on transient/capacity/unavailable errors
        const isTransient = errStr.includes("503") || 
                            errStr.includes("UNAVAILABLE") || 
                            errStr.includes("high demand") || 
                            errStr.includes("capacity") ||
                            errStr.includes("overloaded");
        if (!isTransient) {
          break;
        }
      }
    }

    if (!success) {
      throw lastError || new Error("All Gemini model fallbacks exhausted.");
    }
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    // Respond cleanly
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "An error occurred with the Gemini API call." });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "A streaming error occurred." })}\n\n`);
      res.end();
    }
  }
});

// OCR Image proxy using multimodal Gemini model
app.post("/api/ocr", async (req: any, res: any) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64 data in request body." });
  }

  try {
    const ai = getGenAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const ocrModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let success = false;
    let lastError: any = null;

    for (const currentModel of ocrModels) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: cleanBase64,
                },
              },
              {
                text: "Perform optical character recognition (OCR). Transcribe all text currently visible in this image or screenshot. Be accurate and preserve the general visual layout where simple. Do not write any explanations, greetings, or side commentary, just output the raw transcribed text.",
              }
            ]
          },
        });

        res.json({ text: response.text || "No legible text found in image.", actualModel: currentModel });
        success = true;
        break;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err);
        console.warn(`[OCR FALLBACK] Call with model "${currentModel}" failed. Error:`, errStr);
        const isTransient = errStr.includes("503") || 
                            errStr.includes("UNAVAILABLE") || 
                            errStr.includes("high demand") || 
                            errStr.includes("capacity") ||
                            errStr.includes("overloaded");
        if (!isTransient) {
          break;
        }
      }
    }

    if (!success) {
      throw lastError || new Error("All Gemini OCR fallbacks exhausted.");
    }
  } catch (error: any) {
    console.error("Gemini OCR Error in backend:", error);
    res.status(500).json({ error: error.message || "OCR service failed." });
  }
});

// WEB SEARCH PROXY ROUTE supporting Tavily, Firecrawl, Google Custom Search and fallbacks
app.post("/api/search", async (req: any, res: any) => {
  const { query, engine, tavily_api_key, firecrawl_api_key, google_search_api_key, google_cse_id } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing search 'query' parameter." });
  }

  const useTavilyKey = tavily_api_key || process.env.TAVILY_API_KEY;
  const useFirecrawlKey = firecrawl_api_key || process.env.FIRECRAWL_API_KEY;
  const useGoogleKey = google_search_api_key || process.env.GOOGLE_SEARCH_API_KEY;
  const useGoogleCx = google_cse_id || process.env.GOOGLE_CSE_ID;

  const logs: string[] = [];
  let chosenEngine = engine || "auto";

  // Auto-engine selection
  if (chosenEngine === "auto") {
    if (useTavilyKey) {
      chosenEngine = "tavily";
    } else if (useGoogleKey && useGoogleCx) {
      chosenEngine = "google";
    } else if (useFirecrawlKey) {
      chosenEngine = "firecrawl";
    } else {
      chosenEngine = "mock";
    }
  }

  logs.push(`Initiated search using engine [${chosenEngine}]`);

  try {
    if (chosenEngine === "tavily") {
      if (!useTavilyKey) {
        throw new Error("Tavily API Key is missing. Configure it in Settings.");
      }
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: useTavilyKey,
          query,
          search_depth: "basic",
          include_answer: true,
          max_results: 5
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Tavily API error (${response.status}): ${text}`);
      }

      const data: any = await response.json();
      return res.json({
        engine: "tavily",
        results: (data.results || []).map((r: any) => ({
          title: r.title || "Untitled Search Result",
          url: r.url || "",
          snippet: r.content || ""
        })),
        answer: data.answer || null,
        logs
      });
    }

    if (chosenEngine === "firecrawl") {
      if (!useFirecrawlKey) {
        throw new Error("Firecrawl API Key is missing. Configure it in Settings.");
      }
      const response = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${useFirecrawlKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, limit: 5 })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Firecrawl API search error (${response.status}): ${text}`);
      }

      const data: any = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Firecrawl search was marked unsuccessful.");
      }

      return res.json({
        engine: "firecrawl",
        results: (data.data || []).map((r: any) => ({
          title: r.title || r.description || "Untitled search result",
          url: r.url || "",
          snippet: r.markdown || r.description || ""
        })),
        logs
      });
    }

    if (chosenEngine === "google") {
      if (!useGoogleKey || !useGoogleCx) {
        throw new Error("Google Search API Key or CX custom search ID is missing. Configure them in Settings.");
      }
      
      const url = `https://customsearch.googleapis.com/customsearch/v1?key=${encodeURIComponent(useGoogleKey)}&cx=${encodeURIComponent(useGoogleCx)}&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Custom Search API error (${response.status || 500}): ${text}`);
      }

      const data: any = await response.json();
      const results = (data.items || []).map((r: any) => ({
        title: r.title || "Untitled Google Search Result",
        url: r.link || "",
        snippet: r.snippet || ""
      }));

      return res.json({
        engine: "google",
        results,
        logs
      });
    }

    // Default: local mock simulated search engine
    logs.push("Falling back to simulated Aether Web index lookup.");
    const queryLower = query.toLowerCase();
    
    // Create rich simulated responses based on the query to feel highly functional even in mock mode
    const simulatedResults = [
      {
        title: `Aether Agent - The ultimate browser productivity assistant`,
        url: "https://aetheragent.dev/about",
        snippet: "Aether Agent is a full-featured browser-integrated tool using state of the art models to search, scan documents, scrape pages, compile clean markdown PDFs, and automate workflow tasks."
      },
      {
        title: `Google API & Search Technologies Official Release`,
        url: "https://google.com/search/docs",
        snippet: "Google Custom Search JSON API lets you retrieve search results from Google programmatically. Perfect for custom search engines and indexing applications."
      },
      {
        title: `Firecrawl - Turn any website into clean LLM-ready markdown`,
        url: "https://firecrawl.dev",
        snippet: "Firecrawl is an open-source tool that crawls and scrapes any landing page, article or nested subdirectory, providing optimal clean text data for generative AI memory."
      },
      {
        title: `Tavily Search API - Built for AI Agents`,
        url: "https://tavily.com",
        snippet: "Tavily yields lightning-fast web searches engineered exclusively for LLM retrieval. Get grounded search summaries, answer key facts, and verified links instantly."
      }
    ];

    // Filter or adjust slightly based on the query to simulate real search behavior
    const matched = simulatedResults.filter(
      r => r.title.toLowerCase().includes(queryLower) || r.snippet.toLowerCase().includes(queryLower)
    );
    
    const results = matched.length > 0 ? matched : [
      {
        title: `Search Overview: "${query}"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Real-time search index lookup for "${query}". To enable authentic live web queries, please set your Tavily API Key, Firecrawl API Key, or Google Search Credentials in the Sidebar's settings button. Currently simulating results.`
      },
      ...simulatedResults
    ];

    return res.json({
      engine: "mock_simulator",
      results,
      answer: `This is a simulated response for query "${query}". Please configure live API credentials in Settings for live web queries.`,
      logs
    });

  } catch (err: any) {
    console.error("Web Search Proxy Error:", err);
    res.status(500).json({ error: err.message || "Search execution failed.", engine: chosenEngine, logs });
  }
});

// URL WEBPAGE SCRAPER PROXY ROUTE using Firecrawl or standard fetch fallback
app.post("/api/scrape", async (req: any, res: any) => {
  const { url, firecrawl_api_key } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing target 'url' parameter to scrape." });
  }

  const useFirecrawlKey = firecrawl_api_key || process.env.FIRECRAWL_API_KEY;
  const logs: string[] = [`Requesting scrape for URL: "${url}"`];

  try {
    if (useFirecrawlKey) {
      logs.push("Executing scrape via Firecrawl REST endpoint.");
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${useFirecrawlKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Firecrawl Scrape API error (${response.status}): ${text}`);
      }

      const data: any = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Firecrawl scrape was marked unsuccessful.");
      }

      return res.json({
        url,
        content: data.data?.markdown || data.data?.html || "No content extracted by Firecrawl.",
        success: true,
        method: "firecrawl",
        logs
      });
    }

    // Standard proxy fallback for scraping (try simple fetch or mock simulation)
    logs.push("Firecrawl key missing. Attempting standard public fetch fallback...");
    try {
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (response.ok) {
        const text = await response.text();
        // Extract basic body text or send HTML
        const cleanText = text
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return res.json({
          url,
          content: cleanText.slice(0, 10000) || "Empty content scraped.",
          success: true,
          method: "direct_fetch",
          logs
        });
      }
    } catch (e: any) {
      logs.push(`Direct fetch failed: ${e.message}. Using layout simulation.`);
    }

    // Simulation response
    return res.json({
      url,
      content: `# Simulated Landing Page Scrape for ${url}\n\nThis is a simulation because no Firecrawl API Key is preconfigured on this app instance or in the Settings.\n\n## Page Header Details\n- Target Host: **${new URL(url).hostname || "external-url"}**\n- Scrape Status: **Success** (Sandbox Mode)\n- Metadata tags: \`theme-color: #1a1a1a\`\n\n### Document Body Content\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sed eros dictum, vehicula eros id, posuere neque. Aliquam elementum tortor at nulla elementum, sit amet accumsan.\n\nConfigure your Firecrawl Key in Settings for live extraction of any external web link.`,
      success: true,
      method: "mock_simulator",
      logs
    });

  } catch (err: any) {
    console.error("Scrape Proxy Error:", err);
    res.status(500).json({ error: err.message || "Scrape execution failed.", logs });
  }
});

// START VITE AND EXPRESS CORE INTERACTION
async function init() {
  if (process.env.NODE_ENV !== "production") {
    // Development server with Vite middleware integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware.");
  } else {
    // Serve static client assets from the dist directory in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static client assets for production.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

init();
