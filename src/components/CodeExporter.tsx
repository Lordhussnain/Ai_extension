import React, { useState } from "react";
import JSZip from "jszip";
import { Copy, Download, FileCode, Check, BookOpen, AlertCircle, Sparkles } from "lucide-react";

// Raw file imports to bind static workspace content to live dashboard preview
// @ts-ignore
import manifestRaw from "../../extension/manifest.json?raw";
// @ts-ignore
import backgroundRaw from "../../extension/background.js?raw";
// @ts-ignore
import contentRaw from "../../extension/content.js?raw";
// @ts-ignore
import sidepanelHtmlRaw from "../../extension/sidepanel.html?raw";
// @ts-ignore
import sidepanelCssRaw from "../../extension/sidepanel.css?raw";
// @ts-ignore
import sidepanelJsRaw from "../../extension/sidepanel.js?raw";
// @ts-ignore
import readmeRaw from "../../extension/README.md?raw";

interface CodeExporterProps {}

const FILES_REGISTRY = [
  {
    name: "manifest.json",
    path: "manifest.json",
    description: "Manifest V3 configuration outlining high permissions (tabs, downloads, storage) and sidebar UI triggers.",
    language: "json",
    content: manifestRaw,
  },
  {
    name: "background.js",
    path: "background.js",
    description: "Service worker intercepting actions to trigger sidebar entry and operating privileged capture visible tab.",
    language: "javascript",
    content: backgroundRaw,
  },
  {
    name: "content.js",
    path: "content.js",
    description: "DOM context scraper reading heading levels and paragraph text layers, formatted directly into markdown blocks.",
    language: "javascript",
    content: contentRaw,
  },
  {
    name: "sidepanel.html",
    path: "sidepanel.html",
    description: "Glassmorphic dashboard structure using inline SVGs to comply with strict extension security guidelines.",
    language: "html",
    content: sidepanelHtmlRaw,
  },
  {
    name: "sidepanel.css",
    path: "sidepanel.css",
    description: "Obsidian dark styles for custom scrollbars, glowing logs, and markdown layouts.",
    language: "css",
    content: sidepanelCssRaw,
  },
  {
    name: "sidepanel.js",
    path: "sidepanel.js",
    description: "Agent mastermind running autonomous ReAct Loops, standard chrome actions, and Google workspace configurations.",
    language: "javascript",
    content: sidepanelJsRaw,
  },
  {
    name: "README.md",
    path: "README.md",
    description: "Install, load unpacked, and security configuration credentials user guide.",
    language: "markdown",
    content: readmeRaw,
  }
];

export const CodeExporter: React.FC<CodeExporterProps> = () => {
  const [selectedFile, setSelectedFile] = useState(FILES_REGISTRY[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [isPacking, setIsPacking] = useState(false);
  const [packStatus, setPackStatus] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleZipDownload = async () => {
    if (isPacking) return;
    setIsPacking(true);
    setPackStatus("Initializing JSZip compilation...");

    try {
      const zip = new JSZip();

      // Write code index
      FILES_REGISTRY.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Inject standard lib placeholders
      const libFolder = zip.folder("lib");

      // Attempt to load live copies of jsPDF and html2canvas from unpkg
      setPackStatus("Fetching live PDF compiler packages (jsPDF)...");
      try {
        const jsPdfRes = await fetch("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
        if (jsPdfRes.ok) {
          const content = await jsPdfRes.text();
          libFolder?.file("jspdf.umd.min.js", content);
        } else {
          throw new Error("HTTP Fail");
        }
      } catch (err) {
        console.warn("Unable to fetch complete jsPDF from unpkg, writing standalone bootstrap helper.");
        libFolder?.file("jspdf.umd.min.js", "/** jsPDF Placeholder loader **/ window.jspdf = {};");
      }

      setPackStatus("Fetching html2canvas canvas captures...");
      try {
        const h2cRes = await fetch("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
        if (h2cRes.ok) {
          const content = await h2cRes.text();
          libFolder?.file("html2canvas.min.js", content);
        } else {
          throw new Error("HTTP Fail");
        }
      } catch (err) {
        console.warn("Unable to fetch html2canvas from unpkg, writing bootstrap helper.");
        libFolder?.file("html2canvas.min.js", "/** html2canvas Placeholder loader **/ window.html2canvas = {};");
      }

      setPackStatus("Compressing Aether Agent bundle...");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = "aether-agent-extension.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setPackStatus("Success! Package downloaded.");
    } catch (error: any) {
      console.error(error);
      setPackStatus(`Failed compilation: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsPacking(false);
        setPackStatus("");
      }, 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full select-none text-zinc-100">
      
      {/* LEFT SIDEBAR: FILE LISTING INDICES */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        
        {/* COMPILATION DOWNLOAD BLOCK */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl space-y-4 shadow-xl">
          <div className="space-y-1.5">
            <h3 className="font-bold font-mono text-[11.5px] text-purple-400 uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>Compilation Station</span>
            </h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Export and download the fully functional Chrome WebExtension package. Load unpacked into Chrome and start testing directly inside your browser tabs!
            </p>
          </div>

          <button
            onClick={handleZipDownload}
            disabled={isPacking}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2.5 font-bold transition-all shadow-lg active:scale-97 cursor-pointer ${
              isPacking 
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700/60" 
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white shadow-purple-900/10 hover:shadow-purple-900/35 border border-purple-500/10"
            }`}
          >
            <Download className="w-4.5 h-4.5" />
            <span className="text-xs uppercase tracking-wider">
              {isPacking ? "Packing Files..." : "Download Extension ZIP"}
            </span>
          </button>
          
          {packStatus && (
            <div className="p-2 border border-zinc-800 bg-zinc-950 rounded-lg text-center font-mono text-[9.5px] text-purple-400">
              {packStatus}
            </div>
          )}
        </div>

        {/* FILE EXPANDER INDEX */}
        <div className="flex-grow bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl overflow-y-auto max-h-[380px] lg:max-h-full space-y-1.5 scroller-dark shadow-xl text-xs">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest px-1 pb-1">Extension Manifest Registry</div>
          {FILES_REGISTRY.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 group ${
                selectedFile.name === file.name
                  ? "bg-purple-950/40 border-purple-800/40 text-purple-300"
                  : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileCode className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedFile.name === file.name ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
              <div className="space-y-0.5 truncate w-full">
                <span className="font-bold text-[11.5px] block truncate font-mono">{file.name}</span>
                <span className="text-[10px] text-zinc-500 block truncate group-hover:text-zinc-400 font-sans leading-normal">{file.description}</span>
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* RIGHT EDITOR PANEL */}
      <div className="lg:col-span-8 flex flex-col h-full bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* HEADER CONTROL ACTIONS */}
        <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-850 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="p-1 rounded bg-zinc-800 font-mono font-bold text-[9px] text-purple-400 uppercase tracking-wider">
              {selectedFile.language}
            </span>
            <span className="text-zinc-300 font-bold font-mono tracking-wide text-[11.5px]">{selectedFile.name}</span>
          </div>
          
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 hover:text-white px-3 py-1.5 text-[10.5px] font-bold text-zinc-400 rounded-lg border border-zinc-800 transition-all active:scale-95 cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY CODE</span>
              </>
            )}
          </button>
        </div>

        {/* CODE CONTAINER */}
        <div className="flex-grow overflow-auto p-4 bg-zinc-950 text-stone-300 select-text font-mono text-[11px] leading-relaxed relative">
          <pre className="p-1 pr-4 whitespace-pre antialiased rounded scroller-dark font-mono">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>

    </div>
  );
};
