import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, MockWebPage, StorageMemory, FunctionCallNode, PartNode } from "../types";
import { 
  Send, Trash2, Shield, Settings, Database, Terminal, 
  Check, FileText, Camera, RefreshCw, AlertTriangle, Cpu, Paperclip,
  ChevronDown, ChevronRight, Braces, Layers, Edit2, XCircle
} from "lucide-react";

// Try to parse a string value into realistic structured JSON if appropriate
const parseMemoryValue = (val: any): any => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) || 
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        return val;
      }
    }
  }
  return val;
};

// Interactive, beautiful JSON syntax highlighting component
const ColorizedJson: React.FC<{ data: any }> = ({ data }) => {
  const str = JSON.stringify(data, null, 2);
  if (!str) return null;

  const parts: React.ReactNode[] = [];
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],])/g;
  
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(str)) !== null) {
    const matchStr = match[0];
    const index = match.index;

    if (index > lastIndex) {
      parts.push(str.substring(lastIndex, index));
    }

    if (matchStr.endsWith(":")) {
      parts.push(
        <span key={index} className="text-purple-400 font-bold">
          {matchStr.slice(0, -1)}
        </span>
      );
      parts.push(<span key={index + "-colon"} className="text-zinc-400">:</span>);
    } else if (matchStr.startsWith('"')) {
      parts.push(
        <span key={index} className="text-emerald-400 font-mono">
          {matchStr}
        </span>
      );
    } else if (/true|false/.test(matchStr)) {
      parts.push(
        <span key={index} className="text-amber-400 font-semibold font-mono">
          {matchStr}
        </span>
      );
    } else if (/null/.test(matchStr)) {
      parts.push(
        <span key={index} className="text-zinc-550 italic font-mono">
          {matchStr}
        </span>
      );
    } else if (/\d+/.test(matchStr)) {
      parts.push(
        <span key={index} className="text-sky-400 font-mono">
          {matchStr}
        </span>
      );
    } else {
      parts.push(
        <span key={index} className="text-zinc-500 font-mono">
          {matchStr}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return (
    <pre className="text-[9.5px] leading-relaxed bg-zinc-950 p-2 rounded-lg border border-zinc-900/60 overflow-x-auto font-mono text-zinc-300 break-words whitespace-pre-wrap max-h-48 scrollbar-thin select-text">
      <code>{parts}</code>
    </pre>
  );
};

interface MemoryRowItemProps {
  memory: StorageMemory;
  onDelete: (key: string) => void;
  onUpdate: (key: string, newValue: any) => void;
}

const MemoryRowItem: React.FC<MemoryRowItemProps> = ({ memory, onDelete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState("");

  const isStructured = typeof memory.value === "object" && memory.value !== null;
  const isArray = Array.isArray(memory.value);

  const startEditing = () => {
    setEditVal(isStructured ? JSON.stringify(memory.value, null, 2) : String(memory.value));
    setIsEditing(true);
  };

  const saveEdit = () => {
    const parsed = parseMemoryValue(editVal);
    onUpdate(memory.key, parsed);
    setIsEditing(false);
    setIsExpanded(true);
  };

  const isEditJsonValid = (() => {
    const trimmed = editVal.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        JSON.parse(trimmed);
        return true;
      } catch (e) {
        return false;
      }
    }
    return null;
  })();

  return (
    <div className="bg-zinc-950/85 border border-zinc-900 rounded-xl p-2.5 space-y-2 relative transition-all hover:bg-zinc-950 hover:border-zinc-800">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-1.5 select-text">
          <div className="flex items-center space-x-1.5 select-none">
            {isStructured && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={isExpanded ? "Collapse node" : "Expand structured JSON node"}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
              </button>
            )}
            <strong className="text-indigo-400 font-mono tracking-wide text-[10px] truncate block" title={memory.key}>
              {memory.key}
            </strong>
            {isStructured && (
              <span className="text-[8px] px-1.5 py-0.2 rounded-full border border-indigo-900/60 bg-indigo-950/40 text-indigo-300 font-bold uppercase tracking-wider font-mono">
                {isArray ? "Array" : "Object"}
              </span>
            )}
          </div>

          {!isEditing && !isStructured && (
            <p className="text-zinc-350 text-[10px] mt-1.5 break-all leading-relaxed whitespace-pre-wrap">
              {String(memory.value)}
            </p>
          )}

          {!isEditing && isStructured && !isExpanded && (
            <div 
              className="flex items-center space-x-1 text-zinc-500 text-[9px] mt-1.5 italic cursor-pointer font-sans select-none hover:text-zinc-400" 
              onClick={() => setIsExpanded(true)}
            >
              <Braces className="w-3.5 h-3.5 text-zinc-650" />
              <span>Click to view {isArray ? `array (${(memory.value as any[]).length} items)` : "nested object properties"}...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 flex-shrink-0 select-none">
          {!isEditing ? (
            <>
              <button 
                onClick={startEditing}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-450 hover:text-indigo-455 transition-colors cursor-pointer"
                title="Edit Memory Node"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button 
                onClick={() => onDelete(memory.key)}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Wipe Memory Node"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={saveEdit}
                className="p-1 rounded hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1 rounded hover:bg-red-950 text-red-500 hover:text-red-300 transition-colors cursor-pointer"
                title="Cancel"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="space-y-1.5 !mt-1.5 select-none">
          <textarea
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            rows={3}
            placeholder={
              isStructured 
                ? '{\n  "property": "value"\n}' 
                : "Type factual information..."
            }
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded p-1.5 text-[10px] text-zinc-200 font-mono outline-none resize-y"
          />
          <div className="flex items-center justify-between text-[8px] font-mono leading-none">
            {isEditJsonValid === true && (
              <span className="text-emerald-400">✔️ Valid structured JSON metadata</span>
            )}
            {isEditJsonValid === false && (
              <span className="text-amber-500">⚠️ Invalid JSON format (will store as plain string)</span>
            )}
            {isEditJsonValid === null && (
              <span className="text-zinc-500">Storing as simple string</span>
            )}
          </div>
        </div>
      )}

      {/* Show Colorized expanded JSON */}
      {!isEditing && isStructured && isExpanded && (
        <div className="!mt-1.5 bg-zinc-950/40 rounded-lg">
          <ColorizedJson data={memory.value} />
        </div>
      )}
    </div>
  );
};

interface AetherSidebarSimulatorProps {
  activePage: MockWebPage;
  onTriggerScreenshotFlash: () => void;
}

export const AetherSidebarSimulator: React.FC<AetherSidebarSimulatorProps> = ({
  activePage,
  onTriggerScreenshotFlash,
}) => {
  // App states matching extension panel JavaScript
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Manual Creation form value states
  const [formKey, setFormKey] = useState("");
  const [formValue, setFormValue] = useState("");

  // Configuration settings (simulated)
  const [provider, setProvider] = useState("gemini");
  const [modelName, setModelName] = useState("gemini-3.5-flash");
  const [customKey, setCustomKey] = useState("");
  const [customEndpoint, setCustomEndpoint] = useState("");

  // Live Web Search & Scraping API Key States
  const [tavilyKey, setTavilyKey] = useState(() => localStorage.getItem("aether_tavily_key") || "");
  const [firecrawlKey, setFirecrawlKey] = useState(() => localStorage.getItem("aether_firecrawl_key") || "");
  const [googleSearchKey, setGoogleSearchKey] = useState(() => localStorage.getItem("aether_google_search_key") || "");
  const [googleCseId, setGoogleCseId] = useState(() => localStorage.getItem("aether_google_cse_id") || "");

  const handleSaveTavilyKey = (val: string) => {
    setTavilyKey(val);
    localStorage.setItem("aether_tavily_key", val);
  };
  const handleSaveFirecrawlKey = (val: string) => {
    setFirecrawlKey(val);
    localStorage.setItem("aether_firecrawl_key", val);
  };
  const handleSaveGoogleSearchKey = (val: string) => {
    setGoogleSearchKey(val);
    localStorage.setItem("aether_google_search_key", val);
  };
  const handleSaveGoogleCseId = (val: string) => {
    setGoogleCseId(val);
    localStorage.setItem("aether_google_cse_id", val);
  };

  // Memories & logs with initial structured keys and values
  const [memories, setMemories] = useState<StorageMemory[]>([
    { key: "user_name", value: "muhammad_asghar" },
    { key: "code_preference", value: "strict typescript, clean layout density" },
    { key: "session_preferences", value: { theme: "dark", fontSize: "12px", autoRun: true, tags: ["typescript", "react", "vite"] } },
    { key: "search_history", value: ["how to use @google/genai", "tsx dev server configs", "tailwindcss theme configuration"] }
  ]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM]: Simulator Core initialized safely.",
    "[SYSTEM]: Agent sandbox linked with tab viewport."
  ]);

  // File Upload State
  const [attachedFile, setAttachedFile] = useState<{name: string, type: string, data: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Helper log terminal messages
  const putLog = (msg: string, type: "SYS" | "TOOL" | "ERROR" | "AGENT" = "SYS") => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${time}] [${type}]: ${msg}`]);
  };

  const handleClearHistory = () => {
    if (window.confirm("Flush active chat history?")) {
      setMessages([]);
      putLog("Conversation reset.", "SYS");
    }
  };

  const handleDeleteMemory = (keyToDelete: string) => {
    setMemories((m) => m.filter((item) => item.key !== keyToDelete));
    putLog(`Erased memory key: '${keyToDelete}'`, "SYS");
  };

  const handleUpdateMemory = (key: string, newValue: any) => {
    setMemories((prev) => {
      const filtered = prev.filter(m => m.key !== key);
      return [...filtered, { key, value: newValue }];
    });
    putLog(`Upgraded memory fact [${key}] with new configuration metadata.`, "SYS");
  };

  const handleClearAllMemories = () => {
    if (window.confirm("Confirm permanent memory wipe?")) {
      setMemories([]);
      putLog("Cognitive memory state emptied.", "SYS");
    }
  };

  // Attach files handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          data: reader.result as string
        });
        putLog(`Attached file data: "${file.name}"`, "SYS");
      };
      reader.readAsDataURL(file);
    }
  };

  // SEND CHAT HANDLER
  const handleSend = async () => {
    if (isProcessing) return;
    if (!inputVal.trim() && !attachedFile) return;

    let userPromptText = inputVal.trim();
    let displayPrompt = userPromptText;

    if (attachedFile) {
      displayPrompt = `Attached "${attachedFile.name}" ${userPromptText ? 'with prompt: "' + userPromptText + '"' : ""}`;
      userPromptText += `\n\n[CONTEXT ATTACHED FILE "${attachedFile.name}" of type ${attachedFile.type}]\nBase64 File Data Contents:\n${attachedFile.data}`;
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const newUserMessage: ChatMessage = { role: "user", text: userPromptText };
    const updatedHistory = [...messages, newUserMessage];
    
    // Optimistically update visual UI display lists
    setMessages(prev => [...prev, { ...newUserMessage, text: displayPrompt }]);
    setInputVal("");
    setIsProcessing(true);
    putLog(`Starting agentic reasoning roundtrip...`, "AGENT");

    try {
      await runAgentLoop(updatedHistory);
    } catch (err: any) {
      console.error(err);
      putLog(`Agent process failure: ${err.message}`, "ERROR");
      setMessages(prev => [...prev, {
        role: "model",
        text: `⚠️ Aether core was disrupted during execution: ${err.message}. Please verify Settings > Secrets configuration.`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // THE RE-ENTRANT LOOP
  const runAgentLoop = async (currentHistory: ChatMessage[]) => {
    let activeTurn = 0;
    const maxTurns = 5;
    let localHistory = [...currentHistory];

    while (activeTurn < maxTurns) {
      putLog(`Turn ${activeTurn + 1}: Querying secure Gemini proxy model...`, "AGENT");

      const memoriesSnippet = memories.length > 0
        ? memories.map(m => {
            const valStr = typeof m.value === "object" 
              ? JSON.stringify(m.value) 
              : String(m.value);
            return `- [${m.key}]: ${valStr.substring(0, 300)}${valStr.length > 300 ? "..." : ""}`;
          }).join("\n")
        : "No currently memoized context records.";

      const dynamicSystemInstruction = `You are the 'Aether Agent', a world-class browser assistant running as a sidebar chatbot. You have permission access to DOM scrapers, PDF downloads, OCR scanners, file generators, and short-term/long-term memories. You also have Tavily, Firecrawl, and Google Search API capabilities enabled dynamically. Proactively use 'web_search' to run live searches if asked about current events, code structures, or factual data, and use 'scrape_url' to scrape/extract external URLs. Use 'extract_page_content' to read the active tab layout on the left. Choose engines wisely when calling search.

All search queries you perform are automatically classified and organized under your sidebar memory block (e.g., in structured records like 'recent_web_searches' and category-specific keys like 'latest_search_Software_Technical').

CURRENT COGNITIVE MEMORIES STORE:
These are items currently stored in long-term memory. You can retrieve them or use get_memory with their key corresponding names:
${memoriesSnippet}`;

      // Set up function calling payloads
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: localHistory,
          systemInstruction: dynamicSystemInstruction,
          api_key: customKey,
          model_override: modelName,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "extract_page_content",
                  description: "Scrape and retrieve clean structured titles, sources, headings, and paragraph details from the current active page browser tab.",
                  parameters: { type: "OBJECT", properties: {} }
                },
                {
                  name: "web_search",
                  description: "Search the web to find up-to-date facts, news, references, and answers. Choose 'tavily', 'google', 'firecrawl', or let 'auto' decide.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      query: { type: "STRING", description: "Search terms or phrase (e.g., 'who won the 2026 super bowl' or 'gemini api updates')." },
                      engine: { 
                        type: "STRING", 
                        description: "Which engine to prioritize: 'tavily', 'google', 'firecrawl', or 'auto' (detects configured keys).",
                        enum: ["tavily", "google", "firecrawl", "auto"]
                      }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "scrape_url",
                  description: "Crawl or extract the full content of a specific external URL using Firecrawl (or fallback scraper if keys are missing).",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      url: { type: "STRING", description: "The direct URL link to scrape (e.g., 'https://wikipedia.org/wiki/Artificial_intelligence')." }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "take_screenshot",
                  description: "Capture a full layout visual viewport snapshot of the active tab.",
                  parameters: { type: "OBJECT", properties: {} }
                },
                {
                  name: "create_file",
                  description: "Download a newly created text-based file (txt, csv, json, md) inside their browser download folder.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      content: { type: "STRING", description: "The content of the file." },
                      filename: { type: "STRING", description: "File name (e.g. data.csv, guide.md)." },
                      mimeType: { type: "STRING", description: "Mime-type classification (e.g. text/csv)." }
                    },
                    required: ["content", "filename", "mimeType"]
                  }
                },
                {
                  name: "create_pdf",
                  description: "Generate and download a clean multi-page formatted PDF document from input text or markdown.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      content: { type: "STRING", description: "The text content or markdown to compile." },
                      filename: { type: "STRING", description: "File download name (e.g. list.pdf)." },
                      title: { type: "STRING", description: "Title displayed on the PDF header." }
                    },
                    required: ["content", "filename", "title"]
                  }
                },
                {
                  name: "save_memory",
                  description: "Record a crucial contextual fact about the user into cognitive storage.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      key: { type: "STRING", description: "The lookup key." },
                      value: { type: "STRING", description: "Detailed value strings." }
                    },
                    required: ["key", "value"]
                  }
                },
                {
                  name: "get_memory",
                  description: "Recall a saved memory from local storage.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      key: { type: "STRING" }
                    },
                    required: ["key"]
                  }
                }
              ]
            }
          ],
          toolConfig: { includeServerSideToolInvocations: true },
          stream: false
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed roundtrip to model.");
      }

      const resData = await response.json();
      if (resData.fallbackTriggered) {
        putLog(`⚠️ High demand: '${modelName}' overloaded, fell back to '${resData.actualModel}'.`, "SYS");
      }
      const candidate = resData.candidates?.[0];
      const partOne = candidate?.content?.parts?.[0];
      const modelText = partOne?.text;
      const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

      // Record Turn
      const newModelTurn: ChatMessage = {
        role: "model",
        text: modelText || "",
        functionCalls: functionCalls ? functionCalls.map((p: any) => p.functionCall) : undefined
      };
      
      localHistory = [...localHistory, newModelTurn];
      setMessages(p => [...p, newModelTurn]);

      // If tools emitted
      if (functionCalls && functionCalls.length > 0) {
        activeTurn++;
        const toolResponses: PartNode[] = [];

        for (const callBlob of functionCalls) {
          const call: FunctionCallNode = callBlob.functionCall;
          putLog(`Intercepted function trigger: ${call.name}`, "TOOL");

          try {
            const toolResult = await processNativeTool(call.name, call.args);
            putLog(`Functional execute success: ${call.name}`, "TOOL");
            
            toolResponses.push({
              functionResponse: {
                name: call.name,
                response: { result: toolResult }
              }
            });
          } catch (tErr: any) {
            putLog(`Tool error: ${tErr.message}`, "ERROR");
            toolResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: tErr.message }
              }
            });
          }
        }

        // Feed responses back to continue loop
        localHistory = [...localHistory, {
          role: "user", // For function responses, Gemini @google/genai requires roles to match the user / tool loop
          parts: toolResponses
        }];
        continue;
      }

      break; // Consumed, exit loop
    }
  };

  // NATIVE TOOL COMPILATIONS inside React simulation container
  const processNativeTool = async (name: string, args: any): Promise<string> => {
    switch (name) {
      case "extract_page_content": {
        putLog(`Retrieving DOM nodes from simulated Tab: "${activePage.title}"`, "SYS");
        return activePage.content;
      }
      case "web_search": {
        putLog(`Connecting to search proxy: query="${args.query}"`, "SYS");
        try {
          const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: args.query,
              engine: args.engine || "auto",
              tavily_api_key: tavilyKey,
              firecrawl_api_key: firecrawlKey,
              google_search_api_key: googleSearchKey,
              google_cse_id: googleCseId
            })
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || "Search proxy failed.");
          }
          const data = await res.json();
          putLog(`Search completed via [${data.engine}]. Found ${data.results?.length || 0} results.`, "SYS");

          // Auto-categorize and store in memory
          const qL = (args.query || "").toLowerCase();
          let category = "General Knowledge";
          if (/\b(weather|forecast|rain|temp|snow|storm|deg|climate)\b/.test(qL)) {
            category = "Weather & Climate";
          } else if (/\b(javascript|typescript|react|api|const|import|code|function|npm|error|bug|install|package|node|server|python|rust|css|html|github|git|dev|tsconfig|vite|npm|yarn|pnpm|sql|postgres|mongodb|query|database)\b/.test(qL)) {
            category = "Software & Technical";
          } else if (/\b(news|politics|election|senate|court|prime minister|president|war|battle|announced|treaty|breaking|protest|riot|summit)\b/.test(qL)) {
            category = "Current Events";
          } else if (/\b(price|stock|market|crypto|bitcoin|ethereum|nasdaq|finance|economic|dollar|euro|invoice|currency|trading|bank|interest|invest|portfolio)\b/.test(qL)) {
            category = "Finance & Economics";
          } else if (/\b(recipe|food|restaurant|cook|bake|chef|cuisine|dinner|lunch|ingredient|taste|dish|meal|restaurant)\b/.test(qL)) {
            category = "Food & Culinary";
          } else if (/\b(movie|music|song|actor|singer|theater|cinema|series|episode|game|esports|play|score|league|match|sport|football|soccer|basketball|cricket|tennis|olympic)\b/.test(qL)) {
            category = "Entertainment & Sports";
          } else if (/\b(science|space|nasa|mars|planet|physics|biology|chemistry|history|ancient|century|dynasty|study|research|academic|thesis|experiment)\b/.test(qL)) {
            category = "Academic & Research";
          }

          const topResults = (data.results || []).slice(0, 3).map((r: any) => ({
            title: r.title || "Untitled Result",
            url: r.url || "",
            snippet: (r.snippet || "").substring(0, 150) + "..."
          }));

          const timestamp = new Date().toISOString();
          const searchNode = {
            query: args.query,
            category,
            timestamp,
            engine: data.engine,
            topResults
          };

          setMemories((prev) => {
            const existingNode = prev.find(m => m.key === "recent_web_searches");
            let list: any[] = [];
            if (existingNode && Array.isArray(existingNode.value)) {
              list = [...existingNode.value];
            } else if (existingNode && typeof existingNode.value === "string") {
              try {
                const parsed = JSON.parse(existingNode.value);
                if (Array.isArray(parsed)) list = parsed;
              } catch (e) {}
            }
            // Limit search history records
            list = [searchNode, ...list].slice(0, 8);
            
            const categoryKey = `latest_search_${category.replace(/\s+/g, "").replace(/&/g, "_")}`;
            const categoryObj = {
              latestQuery: args.query,
              timestamp,
              engine: data.engine,
              resultsCount: data.results?.length || 0,
              topResults
            };

            const filteredList = prev.filter(m => m.key !== "recent_web_searches" && m.key !== categoryKey);
            return [
              ...filteredList,
              { key: "recent_web_searches", value: list },
              { key: categoryKey, value: categoryObj }
            ];
          });

          putLog(`Automatically cached search results under Category: [${category}]`, "SYS");

          return JSON.stringify({
            engine: data.engine,
            results: data.results,
            answer: data.answer
          });
        } catch (sErr: any) {
          putLog(`Search Failed: ${sErr.message}`, "ERROR");
          throw sErr;
        }
      }
      case "scrape_url": {
        putLog(`Connecting to scrape proxy: url="${args.url}"`, "SYS");
        try {
          const res = await fetch("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: args.url,
              firecrawl_api_key: firecrawlKey
            })
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || "Scrape proxy failed.");
          }
          const data = await res.json();
          putLog(`Scraped successfully via [${data.method}]. Content length: ${data.content?.length || 0}`, "SYS");
          return JSON.stringify({
            url: data.url,
            content: data.content,
            method: data.method
          });
        } catch (crErr: any) {
          putLog(`Scraper Failed: ${crErr.message}`, "ERROR");
          throw crErr;
        }
      }
      case "take_screenshot": {
        putLog("Triggering visually simulated tab screenshot aperture...", "SYS");
        onTriggerScreenshotFlash(); // Flash!
        return `[Captured Snapshot of viewport https://aetheragent.dev: Base64 data encoded png bytes size=4095]`;
      }
      case "create_file": {
        putLog(`Compiling raw downloaded file matching name: ${args.filename}...`, "SYS");
        const blob = new Blob([args.content], { type: args.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = args.filename;
        a.click();
        URL.revokeObjectURL(url);
        return `File download created and downloaded in browser: ${args.filename}`;
      }
      case "create_pdf": {
        putLog(`Compiling document layout via jsPDF inside browser canvas...`, "SYS");
        const { jsPDF } = window as any;
        if (!jsPDF) {
          throw new Error("Local jsPDF bundle not attached globally.");
        }
        const doc = new jsPDF();
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(20);
        doc.text(args.title, 20, 20);
        doc.line(20, 25, 190, 25);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(11);
        
        const split = doc.splitTextToSize(args.content, 170);
        doc.text(split, 20, 35);
        doc.save(args.filename);
        return `Successfully drafted PDF report locally inside user browser: ${args.filename}`;
      }
      case "save_memory": {
        putLog(`Memoizing memory fact [${args.key}] → "${args.value}"`, "SYS");
        setMemories((prev) => {
          const filtered = prev.filter(m => m.key !== args.key);
          return [...filtered, { key: args.key, value: args.value }];
        });
        return `Successfully cataloged memory context fact for key: ${args.key}`;
      }
      case "get_memory": {
        putLog(`Recalling memory key: ${args.key}`, "SYS");
        const f = memories.find(m => m.key === args.key);
        if (f) return `Stored memory values for [${args.key}]: "${f.value}"`;
        return `No memory match found for key: ${args.key}`;
      }
      default:
        throw new Error(`Tool execution for '${name}' was not implemented in simulator.`);
    }
  };

  // Custom Quick Actions Button Triggers click direct simulator tools
  const handleDirectScrape = async () => {
    putLog("Analyzing Page DOM context content...", "SYS");
    onTriggerScreenshotFlash(); // Simulates instant visual layout
    setMessages(prev => [...prev, {
      role: "model",
      text: `📊 Successfully analyzed text content from active tab! Found **${activePage.content.length}** parsed characters. Loaded page heading layout:\n\n\`\`\`markdown\n${activePage.content.substring(0, 160)}...\n\`\`\`\nWhat analysis reports would you like me to construct from this DOM?`
    }]);
    
    // Register background history sync
    setMessages(prev => {
      return prev;
    });
  };

  const handleDirectScreenshot = () => {
    putLog("Capturing visual snapshot matrix...", "SYS");
    onTriggerScreenshotFlash();
    setMessages(prev => [...prev, {
      role: "model",
      text: `📷 **Screenshot captured safely!** Viewport PNG footprint registered inside active agent variables. I've scanned the document structure. Ask me to transcribe text blocks or compile lists from it.`
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-purple-800/20 rounded-2xl overflow-hidden shadow-2xl font-sans text-stone-100 select-none max-w-md mx-auto">
      
      {/* SIDEBAR HEADER */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-purple-950/40 flex-shrink-0 z-10 select-none">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg text-white">
            <Cpu className="w-5 h-5" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900"></span>
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AETHER CHATBOT</h1>
            <p className="text-[9.5px] text-zinc-500 font-mono tracking-wide leading-none">AGENT SIMULATOR</p>
          </div>
        </div>

        {/* TOP QUICK ACTIONS */}
        <div className="flex items-center space-x-1.5">
          <button 
            onClick={() => { setShowMemories(!showMemories); setShowSettings(false); }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${showMemories ? "bg-purple-900/40 text-purple-300" : "hover:bg-zinc-800 text-zinc-400"}`}
            title="Aether Memory Bank"
          >
            <Database className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => { setShowSettings(!showSettings); setShowMemories(false); }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${showSettings ? "bg-purple-900/40 text-purple-300" : "hover:bg-zinc-800 text-zinc-400 animate-spin-slow-hover"}`}
            title="SettingsPanel"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* COMPONENT: EXPANDABLE API CONFIG SETTINGS */}
      {showSettings && (
        <section className="bg-zinc-900 border-b border-zinc-800 p-4 text-xs space-y-2.5 animate-slide-down shadow-xl flex-shrink-0">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 SELECT-NONE">
            <h3 className="font-bold tracking-wider text-purple-400 uppercase font-mono text-[10.5px]">Simulation settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="px-2 py-0.5 font-bold bg-purple-700 hover:bg-purple-600 rounded text-[10px] text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9.5px] text-zinc-500 font-bold uppercase mb-1">Select AI Model</label>
              <select 
                value={modelName} 
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setModelName(e.target.value);
                    putLog(`Model preset changed to: ${e.target.value}`, "SYS");
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-305 focus:outline-none font-mono text-[10px]"
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Reasoner)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Alias)</option>
                <option value="custom">-- Custom Specified --</option>
              </select>
            </div>
            <div>
              <label className="block text-[9.5px] text-zinc-500 font-bold uppercase mb-1">Model Name / Alias</label>
              <input 
                type="text" 
                value={modelName} 
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Enter model string..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 focus:outline-none font-mono text-[10.5px]" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[9.5px] text-zinc-500 font-bold uppercase">Custom Gemini API Key</label>
            <input 
              type="password" 
              value={customKey} 
              onChange={(e) => {
                setCustomKey(e.target.value);
                if (e.target.value) {
                  putLog("Custom API Key linked for simulated requests.", "SYS");
                } else {
                  putLog("Custom API Key cleared. Default proxy active.", "SYS");
                }
              }}
              placeholder="Paste custom Gemini API key (e.g. AIzaSy...)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-indigo-500 font-mono text-[10.5px]" 
            />
            <p className="text-[9px] text-zinc-500">
              {customKey ? "✔️ Custom credential key is loaded and secure." : "💡 Optional. Fallback is the preconfigured server environment secret."}
            </p>
          </div>

          <div className="border-t border-zinc-800/60 pt-2.5 space-y-2">
            <h4 className="font-bold tracking-wider text-purple-400 uppercase font-mono text-[9px]">Autonomous Search & Scraping Credentials</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8.5px] text-zinc-500 font-bold uppercase mb-0.5">Tavily API Key</label>
                <input 
                  type="password" 
                  value={tavilyKey} 
                  onChange={(e) => {
                    handleSaveTavilyKey(e.target.value);
                    putLog(e.target.value ? "Tavily API Key synchronized." : "Tavily API Key removed.", "SYS");
                  }}
                  placeholder="tvly-..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-350 focus:outline-none focus:border-purple-500 font-mono text-[10px]" 
                />
              </div>
              
              <div>
                <label className="block text-[8.5px] text-zinc-500 font-bold uppercase mb-0.5">Firecrawl API Key</label>
                <input 
                  type="password" 
                  value={firecrawlKey} 
                  onChange={(e) => {
                    handleSaveFirecrawlKey(e.target.value);
                    putLog(e.target.value ? "Firecrawl API Key synchronized." : "Firecrawl API Key removed.", "SYS");
                  }}
                  placeholder="fc_..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-350 focus:outline-none focus:border-purple-500 font-mono text-[10px]" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8.5px] text-zinc-500 font-bold uppercase mb-0.5">Google API Key</label>
                <input 
                  type="password" 
                  value={googleSearchKey} 
                  onChange={(e) => {
                    handleSaveGoogleSearchKey(e.target.value);
                    putLog(e.target.value ? "Google Search API Key synchronized." : "Google API Key removed.", "SYS");
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-350 focus:outline-none focus:border-purple-500 font-mono text-[10px]" 
                />
              </div>

              <div>
                <label className="block text-[8.5px] text-zinc-500 font-bold uppercase mb-0.5">Google CSE CX ID</label>
                <input 
                  type="text" 
                  value={googleCseId} 
                  onChange={(e) => {
                    handleSaveGoogleCseId(e.target.value);
                    putLog(e.target.value ? "Google CSE ID synchronized." : "Google CSE ID removed.", "SYS");
                  }}
                  placeholder="01234..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-350 focus:outline-none focus:border-purple-500 font-mono text-[10px]" 
                />
              </div>
            </div>
            
            <p className="text-[8.5px] leading-snug text-zinc-500 select-none">
              💡 Leaving keys blank enables <strong>secure sandbox modes</strong> with beautiful simulated search engine and web crawl outputs.
            </p>
          </div>

          <div className="p-2 border border-zinc-800/40 bg-zinc-950/50 rounded text-[10px] leading-relaxed text-zinc-500 select-none">
            🟢 <strong>Server Auth Linked:</strong> Secure routing is preconfigured. Key configurations are stored locally inside state contexts and sent only to your server instance.
          </div>
        </section>
      )}

      {/* COMPONENT: EXPANDABLE MEMORIES BANK */}
      {showMemories && (
        <section className="bg-zinc-900 border-b border-zinc-800 p-4 text-xs space-y-2 animate-slide-down shadow-xl flex-shrink-0">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <h3 className="font-bold tracking-wider text-indigo-400 uppercase font-mono text-[10.5px] flex items-center space-x-1">
              <span>Memory Bank</span>
              <span className="bg-zinc-800 text-purple-400 font-mono text-[9.5px] px-1.5 py-0.2 rounded-full">{memories.length}</span>
            </h3>
            <button 
              onClick={handleClearAllMemories}
              className="text-[9.5px] text-zinc-500 hover:text-red-400 font-mono cursor-pointer"
            >
              WIPE ALL
            </button>
          </div>

          {/* Add custom memory interface */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (formKey.trim() && formValue.trim()) {
                const parsed = parseMemoryValue(formValue);
                setMemories(prev => {
                  const filtered = prev.filter(m => m.key !== formKey.trim());
                  return [...filtered, { key: formKey.trim(), value: parsed }];
                });
                putLog(`Manually saved memory context fact: [${formKey.trim()}]`, "SYS");
                setFormKey("");
                setFormValue("");
              }
            }}
            className="p-3 bg-zinc-950 border border-zinc-850/60 rounded-xl space-y-2 !my-1.5 select-none"
          >
            <div className="flex items-center justify-between text-[9px] uppercase font-bold text-indigo-400 tracking-wider font-mono">
              <span>Create Cognitive Memory Node</span>
              <span className="text-[8px] text-zinc-500 lowercase font-normal italic">supports JSON setting metadata</span>
            </div>
            
            <div className="space-y-1.5">
              <input 
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                placeholder="Key Name (e.g. settings_profile)" 
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[10.5px] text-zinc-200 outline-none focus:border-indigo-500 font-mono"
              />
              <textarea 
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                rows={2}
                placeholder='Value string, array: ["tag1"] or JSON block: {"theme":"dark"}' 
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[10.5px] text-zinc-200 outline-none focus:border-indigo-500 font-sans resize-none"
              />
            </div>

            <div className="flex items-center justify-between text-[8px] font-mono leading-none py-0.5">
              {(() => {
                const trimmed = formValue.trim();
                const isFormValJson = (() => {
                  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                    try {
                      JSON.parse(trimmed);
                      return true;
                    } catch (e) {
                      return false;
                    }
                  }
                  return null;
                })();

                if (isFormValJson === true) {
                  return <span className="text-emerald-400">✨ Structured JSON Object/Array detected</span>;
                }
                if (isFormValJson === false) {
                  return <span className="text-amber-500">⏳ Invalid JSON tag (will store as plain text)</span>;
                }
                if (trimmed !== "") {
                  return <span className="text-zinc-400">Storing as simple text string</span>;
                }
                return <span className="text-zinc-650">Enter simple string or JSON objects</span>;
              })()}
            </div>

            <button 
              type="submit"
              className="w-full py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-[10px] text-indigo-200 font-bold font-mono rounded cursor-pointer transition-all uppercase tracking-wider"
            >
              + Store Memory Node
            </button>
          </form>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 font-mono text-[10px] scrollbar-thin">
            {memories.length === 0 ? (
              <p className="text-zinc-500 text-center py-2 italic font-sans">History card storage is blank.</p>
            ) : (
              memories.map((m) => (
                <MemoryRowItem 
                  key={m.key} 
                  memory={m} 
                  onDelete={handleDeleteMemory} 
                  onUpdate={handleUpdateMemory} 
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* QUICK LOG TERMINAL BAR */}
      <div className="bg-zinc-950 border-b border-zinc-900/60 px-3 py-1 flex items-center justify-between select-none">
        <div className="flex items-center space-x-1.5 truncate max-w-[80%] font-mono text-[9px]">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></span>
          <span className="truncate text-zinc-500">{terminalLogs[terminalLogs.length - 1]}</span>
        </div>
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className={`flex items-center space-x-1 font-mono text-[9px] cursor-pointer px-1.5 py-0.5 rounded transition-all ${
            showLogs ? "bg-purple-950 text-purple-400" : "text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Terminal className="w-3 h-3" />
          <span>LOGS</span>
        </button>
      </div>

      {showLogs && (
        <div className="bg-zinc-950 px-4 py-2 text-[9px] max-h-24 overflow-y-auto font-mono text-purple-400 border-b border-zinc-800 break-all select-text flex-shrink-0">
          {terminalLogs.map((log, i) => (
            <div key={i} className="py-0.5 border-b border-zinc-900/40">{log}</div>
          ))}
        </div>
      )}

      {/* SCRIPTS BULK MESSAGES FRAME */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 scroller-dark select-text">
        {messages.length === 0 ? (
          <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/40 space-y-3 mt-1.5 leading-relaxed text-zinc-300 font-sans max-w-[95%] mx-auto shadow-inner">
            <div className="text-center">
              <h3 className="font-bold text-gradient leading-none text-sm uppercase font-mono tracking-wider">Aether Simulator Sandbox</h3>
              <p className="text-[9.5px] text-zinc-500 uppercase tracking-widest font-mono">Linked with Left Tab Dashboard</p>
            </div>
            
            <p className="text-xs text-zinc-350 leading-relaxed text-center">
              Submit prompt commands exactly like a real Side panel. Chat with me regarding design layouts, scrape active files, or trigger downloads.
            </p>

            <div className="grid grid-cols-2 gap-1.5 font-mono text-[9.5px] font-bold">
              <button 
                onClick={handleDirectScrape}
                className="p-1 px-2.5 bg-zinc-800 border border-zinc-750 rounded text-zinc-200 hover:bg-zinc-700 text-left truncate flex items-center space-x-1 cursor-pointer"
              >
                <Database className="w-3 h-3 text-purple-400" />
                <span className="truncate">Scrape page content</span>
              </button>
              <button 
                onClick={handleDirectScreenshot}
                className="p-1 px-2.5 bg-zinc-800 border border-zinc-750 rounded text-zinc-200 hover:bg-zinc-700 text-left truncate flex items-center space-x-1 cursor-pointer"
              >
                <Camera className="w-3 h-3 text-blue-400" />
                <span className="truncate">Snapshot screen</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              
              {/* If text block exists */}
              {msg.text && (
                <div className={`max-w-[85%] p-3 rounded-xl shadow-md text-[12px] leading-relaxed select-text ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-zinc-900 border border-purple-950/30 text-stone-200 rounded-bl-none whitespace-pre-line"
                }`}>
                  {msg.text}
                </div>
              )}

              {/* If tools logs registered */}
              {msg.functionCalls && msg.functionCalls.map((call, idx) => (
                <div key={idx} className="mt-1.5 w-[85%] p-2 rounded-lg border border-emerald-950/20 bg-zinc-950 font-mono text-[9.5px] text-emerald-400 border-l-[3.5px] border-l-emerald-500 shadow-sm">
                  <div className="flex items-center space-x-1 font-bold uppercase">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>TOOL INVOCATION: {call.name}</span>
                  </div>
                  {call.args && Object.keys(call.args).length > 0 && (
                    <pre className="text-[8.5px] text-zinc-500 font-mono mt-0.5 overflow-hidden">
                      {JSON.stringify(call.args, null, 1)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ))
        )}

        {/* LOADING STATE ANIMATOR */}
        {isProcessing && (
          <div className="flex items-center space-x-2 p-3 bg-zinc-900/40 rounded-xl max-w-[50%] border border-zinc-805/40 text-xs font-mono text-zinc-400">
            <Cpu className="w-4.5 h-4.5 text-purple-400 animate-spin" />
            <span>Agent thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT CONTROLS BAR */}
      <footer className="p-3.5 bg-zinc-900 border-t border-purple-950/30 w-full flex-shrink-0 z-10">
        
        {/* Attachment Pill row */}
        <div className="flex items-center space-x-1.5 overflow-x-auto select-none scroller-hidden pr-2 mb-2">
          
          {/* File input */}
          <label htmlFor="simulator-uploader" className="flex items-center space-x-1 p-1 px-2 border border-zinc-800 bg-zinc-950 rounded-full text-[9px] hover:bg-zinc-850 hover:text-white transition-all cursor-pointer text-zinc-400">
            <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
            <span>Link File</span>
          </label>
          <input 
            type="file" 
            id="simulator-uploader" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
            className="hidden" 
          />

          <button 
            onClick={handleDirectScreenshot}
            className="flex items-center space-x-1 p-1 px-2 border border-zinc-800 bg-zinc-950 rounded-full text-[9px] hover:bg-zinc-850 hover:text-white transition-all cursor-pointer text-zinc-400"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Screen Snapshot</span>
          </button>

          <button 
            onClick={handleClearHistory}
            className="flex items-center space-x-1 p-1 px-2 border border-zinc-800/40 hover:border-red-950/30 bg-zinc-950 rounded-full text-[9px] text-zinc-500 hover:text-red-300 transition-all cursor-pointer ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Attached preview bar */}
        {attachedFile && (
          <div className="p-1 px-2 w-full border border-emerald-900 bg-emerald-950/10 rounded-lg text-[9px] flex items-center justify-between text-emerald-400 mb-2 font-mono">
            <span className="truncate">Attached document: {attachedFile.name} ({attachedFile.type})</span>
            <button 
              onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="px-1 text-[11px] font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* INPUT SEND MATRIX */}
        <div className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:shadow-cyan-900/10 rounded-xl px-3.5 py-2.5 flex items-end shadow-inner transition-all w-full">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Instruct agent..."
            className="w-full bg-transparent text-xs text-stone-200 outline-none resize-none max-h-24 py-1 font-sans"
          />
          <button
            onClick={handleSend}
            disabled={isProcessing}
            className={`p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:opacity-90 leading-none text-white transition-all active:scale-90 ml-1.5 cursor-pointer ${
              isProcessing ? "opacity-40" : ""
            }`}
          >
            <Send className="w-3.5 h-3.5 transform" />
          </button>
        </div>
      </footer>
    </div>
  );
};
