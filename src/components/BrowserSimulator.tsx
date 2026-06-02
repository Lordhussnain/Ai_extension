import React, { useState } from "react";
import { MockWebPage } from "../types";
import { MOCK_PAGES } from "../data/mockPages";
import { Globe, RefreshCw, FileText, Edit3, Check, HelpCircle } from "lucide-react";

interface BrowserSimulatorProps {
  activePage: MockWebPage;
  setActivePage: (page: MockWebPage) => void;
  onPageContentChange: (newContent: string) => void;
  isScreenshotFlashing: boolean;
}

export const BrowserSimulator: React.FC<BrowserSimulatorProps> = ({
  activePage,
  setActivePage,
  onPageContentChange,
  isScreenshotFlashing,
}) => {
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [rawText, setRawText] = useState(activePage.content);

  const handlePageSelect = (page: MockWebPage) => {
    setActivePage(page);
    setRawText(page.content);
    setIsEditingRaw(false);
  };

  const handleSaveEdit = () => {
    onPageContentChange(rawText);
    setIsEditingRaw(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden relative shadow-2xl">
      
      {/* SCREENSHOT FLASH OVERLAY */}
      {isScreenshotFlashing && (
        <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center animate-ping-once transition-all">
          <div className="p-4 bg-zinc-900 border border-zinc-700/60 rounded-xl text-white font-mono text-xs flex items-center space-x-2 shadow-2xl">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span>📷 Visual Viewport Screenshot Captured!</span>
          </div>
        </div>
      )}

      {/* WINDOW CHROME TITLEBAR */}
      <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 bg-red-500/80 rounded-full"></span>
          <span className="w-3 h-3 bg-yellow-500/80 rounded-full"></span>
          <span className="w-3 h-3 bg-green-500/80 rounded-full"></span>
        </div>
        <div className="text-zinc-500 font-mono text-[10px] tracking-wider uppercase">TAB SANDBOX VIEWPORT</div>
        <div className="w-12"></div>
      </div>

      {/* ADDRESS URL NAVIGATION BAR */}
      <div className="bg-zinc-900/40 p-2.5 px-4 border-b border-zinc-800 flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-2 text-zinc-500">
          <Globe className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex-grow bg-zinc-950 text-zinc-300 font-mono text-[11px] px-3.5 py-1.5 rounded-lg border border-zinc-800 flex items-center truncate">
          <span className="text-zinc-600 mr-1 select-none">secure |</span>
          <span className="truncate">{activePage.url}</span>
        </div>
        <button 
          onClick={() => {
            setRawText(activePage.content);
            setIsEditingRaw(false);
          }}
          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer" 
          title="Reset page"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* WEB PAGE PREVIEW PANEL */}
      <div className="flex-grow overflow-y-auto p-5 pb-6 scroller-dark select-text bg-[#16151a]">
        
        {/* Swapping indicators */}
        <div className="mb-4 flex items-center space-x-1.5 select-none text-[11px] overflow-x-auto pb-1">
          <span className="text-zinc-500 text-[10px] font-mono tracking-wide">SCENARIOS:</span>
          {MOCK_PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePageSelect(p)}
              className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-all ${
                activePage.id === p.id 
                  ? "bg-purple-950/80 border border-purple-800/40 text-purple-300 shadow-lg" 
                  : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/50 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {p.id === "hacker-news" ? "Hacker News (Scraper)" : p.id === "wikipedia-ai" ? "Wikipedia (PDF, Markdown)" : "Inventory spreadsheet (CSV)"}
            </button>
          ))}
        </div>

        {/* ACTIVE WEBPAGE CONTAINER */}
        <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800/60 shadow-inner relative group min-h-[220px]">
          
          {/* Quick Edit Tag Overlay */}
          <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-100 transition-all select-none">
            {isEditingRaw ? (
              <button 
                onClick={handleSaveEdit}
                className="flex items-center space-x-1 bg-emerald-950/90 border border-emerald-800/40 px-2 py-1 text-[10px] text-emerald-300 font-bold rounded-md hover:bg-emerald-900 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>SAVE</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsEditingRaw(true)}
                className="flex items-center space-x-1 bg-zinc-800 border border-zinc-700/60 px-2 py-1 text-[10px] text-zinc-300 font-bold rounded-md hover:bg-zinc-700 cursor-pointer"
                title="Edit webpage text"
              >
                <Edit3 className="w-3 h-3 text-purple-400" />
                <span>EDIT DOM CODE</span>
              </button>
            )}
          </div>

          {isEditingRaw ? (
            <div className="space-y-2 select-text font-mono text-xs">
              <div className="text-[10px] text-purple-400 select-none">// Edit the page contents directly to test scraper tools!</div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={12}
                className="w-full bg-zinc-950 text-stone-200 border border-zinc-850 rounded p-3 focus:outline-none focus:border-purple-600 resize-none font-mono"
              />
              <div className="flex items-center justify-end space-x-2 pb-1.5">
                <button 
                  onClick={() => setIsEditingRaw(false)} 
                  className="px-2.5 py-1 text-[10px] text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  className="px-3 py-1 bg-purple-700 rounded text-[10px] text-white hover:bg-purple-600"
                >
                  Apply Content
                </button>
              </div>
            </div>
          ) : (
            <div className="transition-all duration-300">
              {activePage.visualHtml ? (
                <div dangerouslySetInnerHTML={{ __html: activePage.visualHtml }} />
              ) : (
                <div className="whitespace-pre-line font-mono text-xs text-stone-300">
                  {activePage.content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* EXPLAINER NOTEPAD */}
        <div className="mt-5 p-4 border border-zinc-850 bg-zinc-900/20 rounded-xl leading-relaxed text-zinc-400 text-[11px] font-sans flex items-start space-x-2.5 select-none">
          <HelpCircle className="w-4.5 h-4.5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11.5px] font-bold text-zinc-300 uppercase leading-none font-mono tracking-wide">Developer Sandbox Notice</h4>
            <p>
              In the real extension, Aether reads text nodes directly from whichever Chrome tab is physically active. Here in this AI Studio Hub, the agent reads its webpage context directly out of this editable simulated window. Try typing your own text nodes using <strong>Edit DOM Code</strong> or type chat commands like <span className="font-mono text-purple-300 font-bold">"Read this screen page and download a PDF"</span>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
