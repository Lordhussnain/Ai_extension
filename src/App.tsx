/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserSimulator } from "./components/BrowserSimulator";
import { AetherSidebarSimulator } from "./components/AetherSidebarSimulator";
import { CodeExporter } from "./components/CodeExporter";
import { MOCK_PAGES } from "./data/mockPages";
import { MockWebPage } from "./types";
import { 
  Play, FileCode, CheckSquare, Shield, HelpCircle, 
  Cpu, Github, BookOpen, AlertCircle, RefreshCw 
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"sandbox" | "exporter" | "guide">("sandbox");
  const [activePage, setActivePage] = useState<MockWebPage>(MOCK_PAGES[0]);
  const [screenshotFlashing, setScreenshotFlashing] = useState(false);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);

  // Ping backend health to ensure the node server is fully functional
  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (res.ok) setServerHealthy(true);
        else setServerHealthy(false);
      })
      .catch(() => setServerHealthy(false));
  }, []);

  const handlePageContentChange = (newContent: string) => {
    setActivePage((prev) => ({
      ...prev,
      content: newContent,
      // Clear visualHtml if custom edits occur to fall back to clean text preview
      visualHtml: undefined
    }));
  };

  const handleTriggerScreenshotFlash = () => {
    setScreenshotFlashing(true);
    setTimeout(() => setScreenshotFlashing(false), 900);
  };

  return (
    <div className="min-h-screen bg-[#08070b] text-zinc-100 font-sans flex flex-col antialiased">
      
      {/* HEADER BANNER DESIGN */}
      <header className="bg-zinc-950/40 border-b border-zinc-900/60 backdrop-blur px-6 py-4.5 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & title details */}
          <div className="flex items-center space-x-3 select-none">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 shadow-lg shadow-purple-500/10 flex items-center justify-center text-white font-mono font-bold text-lg">
              <Cpu className="w-5.5 h-5.5 animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold tracking-wider uppercase bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent font-mono">
                  Aether Agent Hub
                </h1>
                <span className="text-[9px] bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-full font-bold uppercase font-mono tracking-wide select-none">
                  MV3 Release
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-400 leading-none mt-1">Autonomous Developer Side Panel & Sandbox workstation</p>
            </div>
          </div>

          {/* Connection states & navigation anchors */}
          <div className="flex items-center space-x-2.5 text-xs select-none">
            
            {/* Health indicators */}
            <div className="flex items-center space-x-1.5 bg-zinc-900/50 border border-zinc-850 p-1.5 px-3 rounded-full">
              <span className={`w-2 h-2 rounded-full ${
                serverHealthy === true 
                  ? "bg-emerald-400 animate-pulse shadow-glow shadow-emerald-500/50" 
                  : serverHealthy === false 
                    ? "bg-rose-400" 
                    : "bg-amber-400 animate-bounce"
              }`} />
              <span className="font-mono text-[10px] text-zinc-400">
                {serverHealthy === true 
                  ? "SYSTEM CONNECTED" 
                  : serverHealthy === false 
                    ? "BACKEND HEALTHY" 
                    : "CHECKING SYSTEM PING"
                }
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* TABS NAVIGATION CONTROLLER */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-5 flex-shrink-0">
        <div className="flex border-b border-zinc-900 pb-px gap-1 overflow-x-auto select-none font-mono text-[11px] font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`py-3 px-5 transition-all cursor-pointer border-b-2 flex items-center space-x-2 ${
              activeTab === "sandbox"
                ? "border-purple-600 text-purple-400 bg-purple-950/5"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Play className="w-4 h-4 text-purple-400" />
            <span>Sandbox Playground</span>
          </button>
          
          <button
            onClick={() => setActiveTab("exporter")}
            className={`py-3 px-5 transition-all cursor-pointer border-b-2 flex items-center space-x-2 ${
              activeTab === "exporter"
                ? "border-purple-600 text-purple-400 bg-purple-950/5"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>Extension Source Files</span>
          </button>
          
          <button
            onClick={() => setActiveTab("guide")}
            className={`py-3 px-5 transition-all cursor-pointer border-b-2 flex items-center space-x-2 ${
              activeTab === "guide"
                ? "border-purple-600 text-purple-400 bg-purple-950/5"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Setup user Manual</span>
          </button>
        </div>
      </div>

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-6 overflow-hidden">
        
        {/* VIEW 1: SANDBOX PLAYGROUND */}
        {activeTab === "sandbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-8">
            <div className="lg:col-span-7 h-[450px] lg:h-[620px]">
              <BrowserSimulator
                activePage={activePage}
                setActivePage={setActivePage}
                onPageContentChange={handlePageContentChange}
                isScreenshotFlashing={screenshotFlashing}
              />
            </div>
            <div className="lg:col-span-5 h-[450px] lg:h-[620px]">
              <AetherSidebarSimulator
                activePage={activePage}
                onTriggerScreenshotFlash={handleTriggerScreenshotFlash}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: CODE EXPORTER HUB */}
        {activeTab === "exporter" && (
          <div className="h-full pb-8">
            <CodeExporter />
          </div>
        )}

        {/* VIEW 3: SETUP INSTRUCTION MANUAL */}
        {activeTab === "guide" && (
          <div className="max-w-4xl mx-auto h-full pb-10 font-sans leading-relaxed text-zinc-300 space-y-6">
            
            <div className="p-6 border border-zinc-800 bg-zinc-900/40 rounded-2xl flex items-start space-x-4">
              <Shield className="w-8 h-8 text-purple-400 flex-shrink-0" />
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono text-[13px]">Unpackaged Developer Installation</h2>
                <p className="text-xs text-zinc-400">
                  Chrome Extensions running on the local filesystem must be declared inside Chrome's Developer Mode. Follow these steps to load Aether Agent directly in Chrome:
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center">1</span>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white font-mono tracking-wide mb-1 leading-none">Compile and download folder ZIP</h4>
                  <p className="text-xs text-zinc-400 leading-normal">
                    Navigate to the <strong>Extension Source Files</strong> tab, click the glowing <strong>Download Extension ZIP</strong> button, and unpack the resulting `.zip` folder on your local machine.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center">2</span>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white font-mono tracking-wide mb-1 leading-none">Open Chrome Extension Manager</h4>
                  <p className="text-xs text-zinc-400 leading-normal">
                    Open a new browser window inside Google Chrome and go to the path <code className="text-purple-300 bg-zinc-900 p-0.5 rounded px-1.5 font-mono">chrome://extensions</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center">3</span>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white font-mono tracking-wide mb-1 leading-none">Activate Developer Mode</h4>
                  <p className="text-xs text-zinc-400 leading-normal">
                    Locate the toggle switch labelled <strong>Developer Mode</strong> in the top right-hand corner of the page and turn it <strong>ON</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center">4</span>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white font-mono tracking-wide mb-1 leading-none">Load unpacked developer package</h4>
                  <p className="text-xs text-zinc-400 leading-normal">
                    Click the <strong>Load unpacked</strong> button that slides into view on the top-left margin, attach your extracted source package folder, and hit confirm.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center">5</span>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white font-mono tracking-wide mb-1 leading-none">Pin Sidebar Action</h4>
                  <p className="text-xs text-zinc-400 leading-normal">
                    Click the jigsaw piece icon in your toolbar, scroll down to identify <strong>Aether Agent</strong>, and toggle the pin button.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-zinc-800/60 bg-zinc-900/20 rounded-xl space-y-1 text-xs select-none leading-relaxed">
              <h4 className="font-bold text-zinc-300 font-mono tracking-wide pr-1 flex items-center space-x-1.5 uppercase text-[10.5px]">
                <AlertCircle className="w-4.5 h-4.5 text-zinc-500" />
                <span>API Key & Credentials Security Notice</span>
              </h4>
              <p className="text-zinc-500">
                Aether values personal visual and tabular data privacy. Your config credentials (such as API keys and endpoint domains) inputted inside the extension's gear panel are saved exclusively inside local secure browser containers (<code className="text-zinc-600 bg-black/10 p-0.5 rounded font-mono">chrome.storage.local</code>). They never transmit across external remote networks other than standard direct requests dispatching to generative providers.
              </p>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
