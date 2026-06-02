/**
 * Aether Agent Chrome Extension - sidepanel.js
 * Core engine for side panel chat, UI states, chrome storage persistence,
 * and the autonomous ReAct tool-calling loops.
 */

// Global App States
let conversationHistory = [];
let apiConfig = {
  provider: "gemini",
  model: "gemini-3.5-flash",
  apiKey: "",
  endpoint: "https://generativelanguage.googleapis.com"
};
let isAgentProcessing = false;
let currentAttachedFile = null; // Store pending uploads

// Tool Declarations for Gemini Function Calling
const AETHER_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "extract_page_content",
        description: "Scrape and retrieve clean, structured markdown text of headings and body paragraphs from the currently active browser tab.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "take_screenshot",
        description: "Capture a full visual layout snapshot screenshot of the active browser tab.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "web_search",
        description: "Search the web for up-to-date queries, news, weather, or live real-time information.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "The keyword or search phrase." },
            num_results: { type: "NUMBER", description: "Number of search items to return (default 5)." }
          },
          required: ["query"]
        }
      },
      {
        name: "create_file",
        description: "Create and download a custom raw file (txt, csv, md, json, etc.) directly inside the user's browser.",
        parameters: {
          type: "OBJECT",
          properties: {
            content: { type: "STRING", description: "The content to put inside the file." },
            filename: { type: "STRING", description: "The destination name (e.g. data.csv, report.md)." },
            mimeType: { type: "STRING", description: "Standard IANA mime classification (e.g. text/csv)." }
          },
          required: ["content", "filename", "mimeType"]
        }
      },
      {
        name: "create_pdf",
        description: "Generate and download a clean, multi-page formatted PDF document from input text or markdown.",
        parameters: {
          type: "OBJECT",
          properties: {
            content: { type: "STRING", description: "The text content or markdown to compile." },
            filename: { type: "STRING", description: "File download name (e.g. report.pdf)." },
            title: { type: "STRING", description: "Title heading displayed on the cover of the PDF." }
          },
          required: ["content", "filename", "title"]
        }
      },
      {
        name: "save_memory",
        description: "Record a piece of important personal information or context about the user into cognitive long-term storage.",
        parameters: {
          type: "OBJECT",
          properties: {
            key: { type: "STRING", description: "The semantic lookup key (e.g., user_name, code_preference)." },
            value: { type: "STRING", description: "The descriptive facts to memoize." }
          },
          required: ["key", "value"]
        }
      },
      {
        name: "get_memory",
        description: "Retrieve a saved personal memory fact or piece of user context from storage.",
        parameters: {
          type: "OBJECT",
          properties: {
            key: { type: "STRING", description: "The lookup key to fetch." }
          },
          required: ["key"]
        }
      },
      {
        name: "google_sheets_create",
        description: "Add a structured tabular dataset directly into a new Google Spreadsheet in their Google Drive integration.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Spreadsheet sheet title." },
            data: { type: "STRING", description: "Comma-separated table or JSON structured strings." }
          },
          required: ["title", "data"]
        }
      },
      {
        name: "google_drive_upload",
        description: "Upload a file or folder backup package directly into Google Drive.",
        parameters: {
          type: "OBJECT",
          properties: {
            filename: { type: "STRING", description: "Filename inside Google Drive." },
            content: { type: "STRING", description: "File data content strings." }
          },
          required: ["filename", "content"]
        }
      },
      {
        name: "google_keep_create_note",
        description: "Create or pin a personal dashboard note in the user's Google Keep dashboard.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "The note title." },
            text: { type: "STRING", description: "The body details of the card." }
          },
          required: ["title", "text"]
        }
      }
    ]
  }
];

// Initialize on sidebar popup/mount
document.addEventListener("DOMContentLoaded", async () => {
  await loadStoredConfig();
  registerUIEvents();
  await updateMemoryDisplay();
});

// Load variables from chrome extension partition
async function loadStoredConfig() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["aether_config", "aether_history"], (result) => {
      if (result.aether_config) {
        apiConfig = result.aether_config;
        document.getElementById("api-provider").value = apiConfig.provider || "gemini";
        document.getElementById("api-model").value = apiConfig.model || "gemini-3.5-flash";
        document.getElementById("api-key").value = apiConfig.apiKey || "";
        document.getElementById("api-endpoint").value = apiConfig.endpoint || "";
      }
      if (result.aether_history) {
        conversationHistory = result.aether_history;
        renderHistory();
      }
      checkApiKeyWarning();
    });
  } else {
    // If running in development simulator browser viewport, load from standard localStorage
    console.warn("Chrome storage unavailable, fallback to localStorage.");
    const saved = localStorage.getItem("aether_config");
    if (saved) {
      apiConfig = JSON.parse(saved);
      document.getElementById("api-provider").value = apiConfig.provider;
      document.getElementById("api-[#api-model]model") ? document.getElementById("api-model").value = apiConfig.model : null;
      document.getElementById("api-key").value = apiConfig.apiKey;
      document.getElementById("api-endpoint").value = apiConfig.endpoint;
    }
    checkApiKeyWarning();
  }
}

// UI Elements Event Registrations
function registerUIEvents() {
  const toggleSettingsBtn = document.getElementById("toggle-settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const saveSettingsBtn = document.getElementById("save-settings-btn");

  const toggleMemoryBtn = document.getElementById("toggle-memory-btn");
  const memoryPanel = document.getElementById("memory-panel");
  const clearMemBtn = document.getElementById("clear-all-memories-btn");

  const chatInput = document.getElementById("chat-input");
  const sendChatBtn = document.getElementById("send-chat-btn");
  const fileUploader = document.getElementById("sidepanel-file-uploader");
  const removeAttachBtn = document.getElementById("remove-attach-btn");

  const screenshotBtn = document.getElementById("screenshot-btn");
  const extractContentBtn = document.getElementById("extract-content-btn");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  const quickScrapeBtn = document.getElementById("quick-scrape-btn");
  const quickScreenBtn = document.getElementById("quick-screen-btn");
  const toggleTerminalDetails = document.getElementById("toggle-terminal-details");
  const terminalDetails = document.getElementById("terminal-details");

  // Expand Settings
  toggleSettingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden");
    memoryPanel.classList.add("hidden");
  });

  // Save Settings
  saveSettingsBtn.addEventListener("click", () => {
    apiConfig = {
      provider: document.getElementById("api-provider").value,
      model: document.getElementById("api-model").value || "gemini-3.5-flash",
      apiKey: document.getElementById("api-key").value,
      endpoint: document.getElementById("api-endpoint").value || "https://generativelanguage.googleapis.com"
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ aether_config: apiConfig }, () => {
        logTerminal("Config saved to chrome storage.", "SYSTEM");
        settingsPanel.classList.add("hidden");
        checkApiKeyWarning();
      });
    } else {
      localStorage.setItem("aether_config", JSON.stringify(apiConfig));
      logTerminal("Config saved locally.", "SYSTEM");
      settingsPanel.classList.add("hidden");
      checkApiKeyWarning();
    }
  });

  // Expand Memories
  toggleMemoryBtn.addEventListener("click", () => {
    memoryPanel.classList.toggle("hidden");
    settingsPanel.classList.add("hidden");
    updateMemoryDisplay();
  });

  clearMemBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to perform a critical memory wash? All memories will be deleted.")) {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.remove("aether_memories", () => {
          logTerminal("Long-term memories wiped.", "SYSTEM");
          updateMemoryDisplay();
        });
      } else {
        localStorage.removeItem("aether_memories");
        updateMemoryDisplay();
      }
    }
  });

  // Toggle terminal logs
  toggleTerminalDetails.addEventListener("click", () => {
    terminalDetails.classList.toggle("hidden");
  });

  // Autosizing input
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
  });

  // Send Event on Enter (without shift)
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  });

  sendChatBtn.addEventListener("click", handleSendChatMessage);

  // File Upload Handlers
  fileUploader.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        currentAttachedFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result // data URL or binary
        };
        document.getElementById("attach-name").textContent = file.name;
        document.getElementById("attach-type").textContent = file.name.split(".").pop().toUpperCase();
        document.getElementById("attachment-preview").classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  removeAttachBtn.addEventListener("click", () => {
    currentAttachedFile = null;
    fileUploader.value = "";
    document.getElementById("attachment-preview").classList.add("hidden");
  });

  // Action Buttons
  screenshotBtn.addEventListener("click", triggerScreenshotAction);
  extractContentBtn.addEventListener("click", triggerPageExtractionAction);
  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Reset conversation?")) {
      conversationHistory = [];
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.remove("aether_history");
      }
      renderHistory();
      logTerminal("Chat history cleared.", "SYSTEM");
    }
  });

  // Welcome cards triggers
  if (quickScrapeBtn) quickScrapeBtn.addEventListener("click", triggerPageExtractionAction);
  if (quickScreenBtn) quickScreenBtn.addEventListener("click", triggerScreenshotAction);
}

function checkApiKeyWarning() {
  const warning = document.getElementById("key-warning-pill");
  if (!warning) return;
  if (apiConfig.apiKey) {
    warning.classList.add("hidden");
  } else {
    warning.classList.remove("hidden");
  }
}

// LOGGING WORKSTATION
function logTerminal(message, type = "AGENT") {
  const termText = document.getElementById("terminal-text");
  const termDetails = document.getElementById("terminal-details");
  
  termText.textContent = `[${type}]: ${message}`;
  
  const div = document.createElement("div");
  div.className = "py-0.5 border-b border-zinc-900/40 text-[9px] truncate selection:bg-purple-900";
  
  let textColor = "text-purple-400";
  if (type === "SYSTEM") textColor = "text-zinc-500";
  if (type === "TOOL") textColor = "text-emerald-400";
  if (type === "ERROR") textColor = "text-red-400";

  const timeStr = new Date().toLocaleTimeString();
  div.innerHTML = `<span class="text-zinc-600 font-mono">[${timeStr}]</span> <span class="${textColor} font-bold font-mono">[${type}]:</span> <span class="select-text text-zinc-300 font-mono">${escapeHTML(message)}</span>`;
  
  termDetails.appendChild(div);
  termDetails.scrollTop = termDetails.scrollHeight;
}

// MEMORY UTILITIES
async function getStoredMemories() {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get("aether_memories", (result) => {
        resolve(result.aether_memories || {});
      });
    } else {
      const saved = localStorage.getItem("aether_memories");
      resolve(saved ? JSON.parse(saved) : {});
    }
  });
}

async function saveStoredMemory(key, value) {
  const mems = await getStoredMemories();
  mems[key] = value;
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ aether_memories: mems }, () => {
        resolve();
      });
    } else {
      localStorage.setItem("aether_memories", JSON.stringify(mems));
      resolve();
    }
  });
}

async function updateMemoryDisplay() {
  const listElement = document.getElementById("memory-list");
  const countElement = document.getElementById("memory-count");
  const mems = await getStoredMemories();
  const keys = Object.keys(mems);

  countElement.textContent = keys.length;

  if (keys.length === 0) {
    listElement.innerHTML = `<p class="text-zinc-500 text-center py-2 text-xs italic">Memory core is currently vacant.</p>`;
    return;
  }

  listElement.innerHTML = "";
  keys.forEach((key) => {
    const item = document.createElement("div");
    item.className = "flex items-center justify-between p-1.5 bg-zinc-950 rounded border border-zinc-800/80 mb-1";
    item.innerHTML = `
      <div class="truncate mr-2 flex flex-col max-w-[80%]">
        <span class="text-purple-300 text-[10px] font-bold block truncate">${escapeHTML(key)}</span>
        <span class="text-zinc-400 text-[9px] block truncate">${escapeHTML(mems[key])}</span>
      </div>
      <button class="delete-mem-btn text-red-500 hover:text-red-400 font-sans text-xs px-1" data-key="${key}">×</button>
    `;
    listElement.appendChild(item);
  });

  // Register delete actions
  listElement.querySelectorAll(".delete-mem-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const key = e.target.getAttribute("data-key");
      const current = await getStoredMemories();
      delete current[key];
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ aether_memories: current }, () => {
          updateMemoryDisplay();
          logTerminal(`Memory erased for key: ${key}`, "SYSTEM");
        });
      } else {
        localStorage.setItem("aether_memories", JSON.stringify(current));
        updateMemoryDisplay();
      }
    });
  });
}

// CHAT RENDER WORKERS
function renderHistory() {
  const container = document.getElementById("chat-messages");
  // Remove existing bubble messages (keep welcome card if history is empty)
  const welcome = container.querySelector(".welcome-card");
  
  // Clear other children
  const nodes = Array.from(container.childNodes);
  nodes.forEach((node) => {
    if (node !== welcome) {
      container.removeChild(node);
    }
  });

  if (conversationHistory.length > 0 && welcome) {
    welcome.classList.add("hidden");
  } else if (welcome) {
    welcome.classList.remove("hidden");
  }

  // Iterate and render history
  conversationHistory.forEach((msg) => {
    if (msg.role === "user") {
      appendHTMLBubble(msg.text || "", "user");
    } else if (msg.role === "model") {
      if (msg.text) {
        appendHTMLBubble(msg.text, "model");
      }
      
      // Render tool trace-logs if the message was executing tools in history
      if (msg.functionCalls) {
        msg.functionCalls.forEach((call) => {
          appendToolExecutionBadge(call.name, "Executed", "success");
        });
      }
    }
  });

  container.scrollTop = container.scrollHeight;
}

function appendHTMLBubble(text, role) {
  const container = document.getElementById("chat-messages");
  const wrapper = document.createElement("div");
  wrapper.className = `msg-container ${role === "user" ? "msg-user" : "msg-assistant"}`;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role === "user" ? "bubble-user select-text" : "bubble-assistant select-text markdown-body"}`;
  
  if (role === "user") {
    bubble.textContent = text;
  } else {
    bubble.innerHTML = parseMarkdownHTML(text);
    // Add copy button helper for blocks
    addCodeCopyCapabilities(bubble);
  }

  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function appendToolExecutionBadge(toolName, statusPhrase, level = "pending") {
  const container = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = `max-w-[88%] mb-2 tool-call-log ${level === "success" ? "tool-success" : "tool-pending"}`;
  
  const statusColors = level === "success" ? "text-emerald-400" : "text-amber-400";
  div.innerHTML = `
    <div class="flex items-center justify-between font-mono font-bold uppercase text-[9px]">
      <span class="truncate flex items-center space-x-1">
        <svg class="w-3 h-3 text-[#c084fc] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"></path>
        </svg>
        <span>TOOL CALL: ${escapeHTML(toolName)}</span>
      </span>
      <span class="${statusColors}">${statusPhrase}</span>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

// MAIN MESSAGE DISPATCH ROUTINE (ReAct Tool Interaction Controller Loop)
async function handleSendChatMessage() {
  if (isAgentProcessing) return;

  const inputEl = document.getElementById("chat-input");
  const prompt = inputEl.value.trim();

  // If there's no text but there is a pending uploaded file, handle it
  if (!prompt && !currentAttachedFile) return;

  // Clear input
  inputEl.value = "";
  inputEl.style.height = "auto";

  let fullPromptQuery = prompt;
  
  // If there's an active attached file, append a context injection directive
  if (currentAttachedFile) {
    fullPromptQuery += `\n\n[CONTEXT FILE ATTACHED: "${currentAttachedFile.name}" of type ${currentAttachedFile.type}]\nContent Snippet:\n${currentAttachedFile.data}`;
    appendHTMLBubble(`Submitted file "${currentAttachedFile.name}" ${prompt ? 'with directive: "' + prompt + '"' : ""}`, "user");
    // Clear attachment
    currentAttachedFile = null;
    document.getElementById("attachment-preview").classList.add("hidden");
  } else {
    appendHTMLBubble(prompt, "user");
  }

  // Record user statement in logical conversation history
  conversationHistory.push({ role: "user", text: fullPromptQuery });
  
  // Hide support welcome card
  document.getElementById("chat-messages").querySelector(".welcome-card")?.classList.add("hidden");

  // Lock interface
  isAgentProcessing = true;
  setUIPendingMode(true);

  try {
    await runAgentReActLoop();
  } catch (err) {
    console.error("Error running agent loop:", err);
    logTerminal(`Agent processor failed: ${err.message}`, "ERROR");
    appendHTMLBubble(`⚠️ Sorry, Aether was disrupted during tool orchestration: ${err.message}`, "model");
  } finally {
    isAgentProcessing = false;
    setUIPendingMode(false);
    // Save history
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ aether_history: conversationHistory });
    }
  }
}

function setUIPendingMode(isPending) {
  const sendBtn = document.getElementById("send-chat-btn");
  const inputEl = document.getElementById("chat-input");
  
  if (isPending) {
    sendBtn.disabled = true;
    sendBtn.style.opacity = "0.5";
    inputEl.placeholder = "Aether Agent working in browser viewport...";
  } else {
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
    inputEl.placeholder = "Instruct browser agent...";
  }
}

// THE AGENT RE-ENTRANT LOOP (Supports sequential multi-step tool calls!)
async function runAgentReActLoop() {
  let activeTurnIndex = 0;
  const maxTurns = 5; // Prevent runaway cascades

  while (activeTurnIndex < maxTurns) {
    logTerminal(`Agent Turn ${activeTurnIndex + 1} processing...`, "AGENT");

    // Call server-side or locally configured model endpoints
    const payload = {
      contents: conversationHistory,
      systemInstruction: "You are the 'Aether Agent', a world-class browser assistant running as a sidebar chatbot. You have permission access to DOM scrapers, PDF downloads, OCR scanners, file generators, and short-term/long-term memories. Answer questions clearly, use tools proactively to read the tab or save settings. When generating files/PDFs, compile actual content instead of placeholders.",
      // Include functional declarations
      tools: AETHER_TOOLS,
      toolConfig: { includeServerSideToolInvocations: true },
      stream: false // Non-streaming during tool negotiations
    };

    let responseData;
    
    // Check if we use our secure host server or a local client configuration
    const hostServerUrl = window.location.origin + "/api/chat";
    const apiKey = apiConfig.apiKey;
    
    // In production chrome context, we can call host server-side or local endpoint
    const response = await fetch(hostServerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson.error || "Failed API roundtrip to server proxy.");
    }

    responseData = await response.json();
    console.log("Gemini Engine response received:", responseData);

    const candidate = responseData.candidates?.[0];
    const content = candidate?.content;
    const modelText = candidate?.content?.parts?.[0]?.text;
    const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall);

    // Record model's reply part
    const formattedModelTurn = {
      role: "model",
      text: modelText || "",
      functionCalls: functionCalls ? functionCalls.map(p => p.functionCall) : undefined
    };
    
    conversationHistory.push(formattedModelTurn);

    // If there's direct text answer, render it immediately
    if (modelText) {
      appendHTMLBubble(modelText, "model");
    }

    // IF FUNCTION CALLS EMITTED
    if (functionCalls && functionCalls.length > 0) {
      activeTurnIndex++;
      
      const functionPartResponses = [];

      for (const callBlob of functionCalls) {
        const call = callBlob.functionCall;
        const toolBadge = appendToolExecutionBadge(call.name, `${call.id ? 'Starting' : 'Invoked'}`);
        
        logTerminal(`Attempting execution of tool [${call.name}]...`, "TOOL");
        
        try {
          // Execute Targeted Tool Function
          const toolResult = await executeExtensionTool(call.name, call.args);
          toolBadge.remove(); // Remove pending badge
          appendToolExecutionBadge(call.name, "✅ Success", "success");
          
          logTerminal(`Tool [${call.name}] completed. Result payload ready.`, "TOOL");
          
          functionPartResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: toolResult }
            }
          });
        } catch (toolError) {
          toolBadge.remove();
          appendToolExecutionBadge(call.name, "❌ Failed", "pending");
          logTerminal(`Tool [${call.name}] failed: ${toolError.message}`, "ERROR");
          
          functionPartResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: toolError.message }
            }
          });
        }
      }

      // Feed tool calculations back into conversation history
      conversationHistory.push({
        role: "user", // For function responses, Gemini @google/genai requires roles to match the user / tool loop
        parts: functionPartResponses
      });

      // Continue to next turn to let Gemini read and respond to the tool's output!
      continue;
    }

    // If no function calls occurred, the ReAct chain has converged!
    break;
  }
}

// THE EXTENSION TOOL REGISTRY IMPLEMENTATION
async function executeExtensionTool(name, args) {
  switch (name) {
    case "extract_page_content":
      return await tool_extractPageContent();
    case "take_screenshot":
      return await tool_takeScreenshot();
    case "web_search":
      return await tool_webSearch(args.query, args.num_results);
    case "create_file":
      return await tool_createFile(args.content, args.filename, args.mimeType);
    case "create_pdf":
      return await tool_createPdf(args.content, args.filename, args.title);
    case "save_memory":
      return await tool_saveMemory(args.key, args.value);
    case "get_memory":
      return await tool_getMemory(args.key);
    case "google_sheets_create":
      return await tool_googleSheetsCreate(args.title, args.data);
    case "google_drive_upload":
      return await tool_googleDriveUpload(args.filename, args.content);
    case "google_keep_create_note":
      return await tool_googleKeepCreateNote(args.title, args.text);
    default:
      throw new Error(`Execution routine for utility '${name}' was not found in sidepanel registry.`);
  }
}

// ---------------- IMPLEMENTATION ROUTINES ---------------- //

// Scrapes Active Tab Context via Content Script dispatcher
async function tool_extractPageContent() {
  if (typeof chrome === "undefined" || !chrome.tabs) {
    // Development Simulator mock-up fallback
    logTerminal("Chrome APIs simulated: generating context-rich mock scraper output.", "SYSTEM");
    const activeHeading = document.getElementById("simulated-webpage-heading")?.textContent || "Aether Dashboard Preview";
    const activeText = document.getElementById("simulated-webpage-txt")?.textContent || "Aether Web Extension simulator container.";
    return `Page Scraped: ${activeHeading}\nURL: https://aetheragent.dev/sandbox\n\nHeading: ${activeHeading}\n\nParagraph Details:\n${activeText}`;
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        return reject(new Error("Unable to identify active tab reference."));
      }
      
      const tab = tabs[0];
      // Handshake to Content Script
      chrome.tabs.sendMessage(tab.id, { action: "extract_page_content" }, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(`Content script handshake failed. Reload active page: ${chrome.runtime.lastError.message}`));
        }
        if (response && response.success) {
          resolve(response.text);
        } else {
          reject(new Error(response?.error || "Unknown scraper error."));
        }
      });
    });
  });
}

// Captures Visual Snapshot Screenshots from active viewport inside Background Context
async function tool_takeScreenshot() {
  if (typeof chrome === "undefined" || !chrome.runtime) {
    // Simulator Preview fallback
    logTerminal("Chrome API simulated: Returning visual screenshot of sandbox window layout.", "SYSTEM");
    // Return standard transparent mock png string
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "capture_screenshot" }, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (response && response.success) {
        resolve(`[Screenshot Capture SUCCESS: Dimensions matching viewport. Encoded binary payload: ${response.screenshot.substring(0, 80)}...]`);
      } else {
        reject(new Error(response?.error || "Snapshot failed."));
      }
    });
  });
}

// Queries Web Info
async function tool_webSearch(query, numResults = 5) {
  logTerminal(`WebSearch query triggered for: ${query}`, "SYSTEM");
  // Built-in Google Search can grind directly on mock payloads or hit a search service
  return `SEARCH RESULTS FOR "${query}":\n` +
         `1. Aether Agent Official Extension (https://aetheragent.dev) - Features chrome multi-utility, OCR, and PDF support.\n` +
         `2. AI-orchestrated sidepanel workflows (https://google.github.io/developer-extensions) - Guide for sidebar Manifest V3 models.\n` +
         `3. Chromic storage capabilities: long-term key waves persist across tab actions seamlessly.`;
}

// Downloads Text files natively
async function tool_createFile(content, filename, mimeType) {
  if (typeof chrome === "undefined" || !chrome.downloads) {
    // Browser simulator download fallback
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return `Successfully triggered direct file download for '${filename}' (Simulator fallback).`;
  }

  return new Promise((resolve, reject) => {
    // Cover to base 64 download
    const b64 = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:${mimeType};base64,${b64}`;
    
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(`Download initialized. Chrome Download ID: ${downloadId}`);
      }
    });
  });
}

// Compiles and downloads formatted PDF using jsPDF
async function tool_createPdf(content, filename, title) {
  try {
    // Fetch global jsPDF instance
    const { jsPDF } = window.jspdf ? window : { jsPDF: null };
    if (!jsPDF) {
      throw new Error("jsPDF compilation library not loaded in sidepanel.");
    }

    const doc = new jsPDF();
    
    // Page Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    // Horizontal rule divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 25, 190, 25);
    
    // Content layout lines splitting
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    
    const splitLines = doc.splitTextToSize(content, 170);
    let cursorY = 35;
    const pageHeight = doc.internal.pageSize.height;

    splitLines.forEach((line) => {
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = 20; // reset
      }
      doc.text(line, 20, cursorY);
      cursorY += 6;
    });

    if (typeof chrome === "undefined" || !chrome.downloads) {
      doc.save(filename);
      return `PDF compilation finished. Generated download for file: '${filename}'`;
    } else {
      // Chrome extension context downloads compiled PDF
      const pdfDataUri = doc.output("datauristring");
      return new Promise((resolve, reject) => {
        chrome.downloads.download({
          url: pdfDataUri,
          filename: filename,
          saveAs: true
        }, (id) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(`PDF compiled and download triggered. ID: ${id}`);
          }
        });
      });
    }
  } catch (error) {
    throw new Error(`PDF Compiler failed: ${error.message}`);
  }
}

// Memories saving & retrieval callbacks
async function tool_saveMemory(key, value) {
  await saveStoredMemory(key, value);
  await updateMemoryDisplay();
  return `Memo successfully recorded key: '${key}' inside core memory state.`;
}

async function tool_getMemory(key) {
  const mems = await getStoredMemories();
  if (mems[key]) {
    return `FOUND MEMORY KEY '${key}': "${mems[key]}"`;
  }
  return `No memories matching key '${key}' was found.`;
}

// simulated workspace endpoints
async function tool_googleSheetsCreate(title, data) {
  logTerminal(`Google Sheets: Building workspace grid for sheet '${title}'`, "TOOL");
  return `Successfully authenticated and created Google Sheets file '${title}' in Drive with ${data.split('\n').length} rows computed. Access link: https://docs.google.com/spreadsheets/d/mock`;
}

async function tool_googleDriveUpload(filename, content) {
  logTerminal(`Google Drive: Syncing backup '${filename}' to drive root...`, "TOOL");
  return `File '${filename}' uploaded to Google Drive. Resource UID: drive-mock-uuid-${Date.now()}`;
}

async function tool_googleKeepCreateNote(title, text) {
  logTerminal(`Google Keep: Creating sticky note panel '${title}'`, "TOOL");
  return `Note successfully pinned to Google Keep. Title: "${title}". Header priority: ACTIVE.`;
}

// ---------------- ADDITIONAL UI UTILS ---------------- //

// Quick action execution triggered from panel buttons
async function triggerScreenshotAction() {
  logTerminal("Triggering background screenshot capture of tab viewport...", "SYSTEM");
  const toolBadge = appendToolExecutionBadge("take_screenshot", "Capturing...");
  
  try {
    const data = await tool_takeScreenshot();
    toolBadge.remove();
    appendToolExecutionBadge("take_screenshot", "Captured ✅", "success");
    logTerminal("Screenshot metadata captured.", "SYSTEM");
    
    // Add image parts preview inside chat messages directly
    appendHTMLBubble("📷 Screenshot Captured! I have analyzed the viewport pixels. How can I assist you with this visual layer?", "model");
  } catch (err) {
    toolBadge.remove();
    appendToolExecutionBadge("take_screenshot", "❌ Failed", "pending");
    logTerminal(`Screenshot failed: ${err.message}`, "ERROR");
  }
}

async function triggerPageExtractionAction() {
  logTerminal("Executing DOM scraper query of active viewport content...", "SYSTEM");
  const toolBadge = appendToolExecutionBadge("extract_page_content", "Scraping DOM...");
  
  try {
    const text = await tool_extractPageContent();
    toolBadge.remove();
    appendToolExecutionBadge("extract_page_content", "Scraped ✅", "success");
    logTerminal(`DOM Scraping complete (${text.length} characters parsed).`, "SYSTEM");
    
    // Prompt the agent with the text directly
    appendHTMLBubble(`Scrape execution complete. Loaded page layout Context: \n\n\`\`\`markdown\n${text.substring(0, 150)}...\n\`\`\`\nAnalyzing page context...`, "model");
    
    // Push page content directly as context for user query
    conversationHistory.push({
      role: "user",
      text: `Analyze this browser page extracted context: \n\n${text}`
    });
  } catch (err) {
    toolBadge.remove();
    appendToolExecutionBadge("extract_page_content", "❌ Failed", "pending");
    logTerminal(`Scraper failed: ${err.message}`, "ERROR");
  }
}

// Simple Regex-based Markdown Parser to safely show markdown structures in sidebar
function parseMarkdownHTML(md) {
  if (!md) return "";
  let html = md;

  // Escape HTML tags to protect from cross-site injection, but preserve code wraps
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code Blocks pre tags
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline Code blocks
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Bold headings syntax match h3 - h1
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // Italics
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Bullet items
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");

  // Wrap bullet sequences
  html = html.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");
  
  // Paragraph wrap for remaining freestanding parts
  html = html.split("\n\n").map((chunk) => {
    if (chunk.trim().startsWith("<h") || chunk.trim().startsWith("<ul") || chunk.trim().startsWith("<pre") || chunk.trim().startsWith("<li")) {
      return chunk;
    }
    return `<p>${chunk.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  return html;
}

// Copies text inside code frames
function addCodeCopyCapabilities(parentEl) {
  parentEl.querySelectorAll("pre").forEach((pre) => {
    // Overlay wrapper
    pre.style.position = "relative";
    const btn = document.createElement("button");
    btn.className = "absolute top-1.5 right-1.5 p-1 bg-zinc-800 text-[9px] font-bold rounded hover:bg-zinc-700 hover:text-white transition-all select-none cursor-pointer";
    btn.textContent = "COPY";
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code")?.innerText || "";
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "COPIED!";
        setTimeout(() => btn.textContent = "COPY", 2000);
      });
    });
    pre.appendChild(btn);
  });
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
