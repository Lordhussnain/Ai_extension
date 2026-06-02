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

// API ROUTES
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Post chat proxy (optional stream)
app.post("/api/chat", async (req: any, res: any) => {
  const { contents, systemInstruction, tools, toolConfig, stream } = req.body;

  try {
    const ai = getGenAI();

    // Set model to gemini-3.5-flash as default, or use user's override if compatible
    const model = "gemini-3.5-flash";

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          tools,
          toolConfig,
        },
      });

      for await (const chunk of responseStream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          tools,
          toolConfig,
        },
      });
      res.json(response);
    }
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    // Respond cleanly
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "An error occurred with the Gemini API call." });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "An streaming error occurred." })}\n\n`);
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/png",
            data: cleanBase64,
          },
        },
        {
          text: "Perform optical character recognition (OCR). Transcribe all text currently visible in this image or screenshot. Be accurate and preserve the general visual layout where simple. Do not write any explanations, greetings, or side commentary, just output the raw transcribed text.",
        }
      ],
    });

    res.json({ text: response.text || "No legible text found in image." });
  } catch (error: any) {
    console.error("Gemini OCR Error in backend:", error);
    res.status(500).json({ error: error.message || "OCR service failed." });
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
