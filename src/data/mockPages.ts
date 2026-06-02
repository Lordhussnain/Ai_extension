import { MockWebPage } from "../types";

export const MOCK_PAGES: MockWebPage[] = [
  {
    id: "hacker-news",
    title: "Aether Agent MV3 launches on Web Store",
    url: "https://news.ycombinator.com/item?id=aether-agent",
    content: `# Aether Agent MV3 launches on Web Store (news.ycombinator.com)
  
## Comments & Threads:
* [muhammad_asghar]: This is highly premium. The ReAct autonomous loop inside the sidebar functions perfectly. I was able to scraping a massive wiki documentation and compile an immediate 5-page PDF with it in 15 seconds.
* [browser_native_99]: Chrome side panel APIs are heavily underutilized. Loving the obsidian obsidian styling and complete lack of CSP-blocking external CDN links. Smooth execution!
* [cyber_ninja]: Does this support Google keep or sheets syncing?
* [aether_dev]: Yes! The extension has built-in boilerplate and REST tools to interact with Google Sheets, Keep, and Drive using background Chrome Identity OAuth tokens.
  
## Main Article Summary:
Developers have released a complete browser side-panel agent equipped with file generators, OCR, and short-term cognitive memory banks. The extension runs natively off local storage and securely proxies model requests without leaking individual credentials.`,
    visualHtml: `
      <div class="space-y-4 font-sans text-stone-300">
        <div class="flex items-center justify-between border-b border-stone-800 pb-2">
          <span class="text-orange-500 font-bold text-sm">Hacker News</span>
          <span class="text-xs text-stone-500">HN Sandbox Simulator</span>
        </div>
        <div class="space-y-3">
          <h2 class="text-base font-bold text-stone-100 flex items-center">
            <span class="text-stone-400 mr-2">1.</span>
            Aether Agent launches: An autonomous browser side panel chatbot (aetheragent.dev)
          </h2>
          <p class="text-xs text-stone-500">142 points by aether_creator 4 hours ago | hide | 38 comments</p>
          
          <div class="border-t border-stone-800 pt-3 space-y-3 text-[11.5px]">
            <div class="p-2.5 bg-stone-900/60 rounded">
              <span class="font-bold text-stone-400 block mb-1">muhammad_asghar</span>
              <p>This is highly premium! The ReAct autonomous loop inside the sidebar functions perfectly. I was able to scrape a massive wiki documentation and compile an immediate 5-page PDF with it in 15 seconds.</p>
            </div>
            <div class="p-2.5 bg-stone-900/60 rounded">
              <span class="font-bold text-stone-400 block mb-1">browser_native_99</span>
              <p>Chrome side panel APIs are heavily underutilized. Loving the obsidian block design and complete lack of CSP-blocking external CDN links. Smooth execution!</p>
            </div>
            <div class="p-2.5 bg-stone-900/60 rounded">
              <span class="font-bold text-stone-400 block mb-1">cyber_ninja</span>
              <p>Does this support Google keep or sheets syncing?</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "wikipedia-ai",
    title: "Artificial Intelligence - Wikipedia",
    url: "https://en.wikipedia.org/wiki/Artificial_Intelligence",
    content: `# Artificial Intelligence (Wikipedia)

Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. 

## Major Historical Milestones:
* 1950: Alan Turing publishes "Computing Machinery and Intelligence" proposing the Turing Test.
* 1956: John McCarthy coins the term "Artificial Intelligence" at the Dartmouth Workshop.
* 1997: Deep Blue defeats Garry Kasparov in chess.
* 2012: Deep learning breakthrough via AlexNet in ImageNet classification.
* 2022: LLM hyper-expansion transforms general intelligence expectation.

## Research Areas:
1. Deep Neural Logic Models
2. Visual Processing & OCR Capture
3. Robotic Locomotion and Manipulation
4. Cognitive Memory Storage and Retrieval Modules`,
    visualHtml: `
      <div class="space-y-4 font-sans text-stone-300 select-text">
        <div class="flex items-center space-x-2 border-b border-stone-800 pb-2">
          <span class="text-xl font-serif text-white">W</span>
          <span class="text-xs text-stone-500 uppercase font-mono">Wikipedia Sandbox</span>
        </div>
        <h1 class="text-xl font-serif text-white font-bold">Artificial Intelligence</h1>
        <p class="text-xs leading-relaxed text-stone-300">
          Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI applications include advanced web search engines (e.g., Google Search), recommendation systems, understanding human speech (e.g., Siri), and self-driving cars.
        </p>
        <div>
          <h2 class="text-sm font-bold text-stone-100 mb-1.5 border-b border-stone-800 pb-1">Major Historical Milestones</h2>
          <ul class="list-disc pl-5 text-xs space-y-1.5 text-stone-400">
            <li><strong>1950:</strong> Alan Turing publishes "Computing Machinery and Intelligence" proposing the Turing Test.</li>
            <li><strong>1956:</strong> John McCarthy coins the term "Artificial Intelligence" at the Dartmouth Workshop.</li>
            <li><strong>1997:</strong> Deep Blue defeats world chess champion Garry Kasparov.</li>
            <li><strong>2024+</strong> LLM hyper-expansion transforms multi-modal computing paradigms.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: "product-inventory",
    title: "Product Inventory Spread - CSV Portal",
    url: "https://portal.internal/inventory.csv",
    content: `# Product Inventory Spread - CSV Portal
  
ID,ProductName,SKU,Price,InStock,Location
101,Aether Nexus Headset,AE-NEX-01,299.99,42,Stock-A3
102,Stellar Quantum Mouse,ST-MOU-99,89.50,118,Stock-B1
103,Obsidian Obsidian Keyboard,OB-KEY-24,149.00,65,Stock-C2
104,Nebula Glass Screen,NEB-GLS-04,45.00,310,Stock-A1
105,Spring Sensor Core,SPR-SEN-12,12.99,15,Stock-B5`,
    visualHtml: `
      <div class="space-y-4 font-sans text-stone-300">
        <div class="flex items-center justify-between border-b border-stone-800 pb-2">
          <span class="text-emerald-500 font-mono text-xs font-bold leading-none">[CSV INVENTORY DATABASE]</span>
          <span class="text-[10px] text-stone-500 font-mono">FILE: inventory.csv</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-[11px] text-left border-collapse border border-stone-800 font-mono">
            <thead>
              <tr class="bg-stone-900 text-stone-300 font-bold border-b border-stone-800">
                <th class="p-1 px-2 border-r border-stone-800">ID</th>
                <th class="p-1 px-2 border-r border-stone-800">ProductName</th>
                <th class="p-1 px-2 border-r border-stone-800">SKU</th>
                <th class="p-1 px-2 border-r border-stone-800">Price</th>
                <th class="p-1 px-2 border-r border-stone-800">InStock</th>
                <th class="p-1 px-2">Location</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-800 bg-stone-950/40">
              <tr>
                <td class="p-1 px-2 border-r border-stone-800">101</td>
                <td class="p-1 px-2 border-r border-stone-800 text-white font-sans">Aether Nexus Headset</td>
                <td class="p-1 px-2 border-r border-stone-800">AE-NEX-01</td>
                <td class="p-1 px-2 border-r border-stone-800 text-emerald-400">$299.99</td>
                <td class="p-1 px-2 border-r border-stone-800 text-amber-500">42</td>
                <td class="p-1 px-2">Stock-A3</td>
              </tr>
              <tr>
                <td class="p-1 px-2 border-r border-stone-800">102</td>
                <td class="p-1 px-2 border-r border-stone-800 text-white font-sans">Stellar Quantum Mouse</td>
                <td class="p-1 px-2 border-r border-stone-800">ST-MOU-99</td>
                <td class="p-1 px-2 border-r border-stone-800 text-emerald-400">$89.50</td>
                <td class="p-1 px-2 border-r border-stone-800">118</td>
                <td class="p-1 px-2">Stock-B1</td>
              </tr>
              <tr>
                <td class="p-1 px-2 border-r border-stone-800">103</td>
                <td class="p-1 px-2 border-r border-stone-800 text-white font-sans">Obsidian Keyboard</td>
                <td class="p-1 px-2 border-r border-stone-800">OB-KEY-24</td>
                <td class="p-1 px-2 border-r border-stone-800 text-emerald-400">$149.00</td>
                <td class="p-1 px-2 border-r border-stone-800 text-amber-500">65</td>
                <td class="p-1 px-2">Stock-C2</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-[10px] text-stone-500 font-mono italic">Prompt: "Scrape inventory.csv and make an executive styled PDF report of my total inventory valuation."</p>
      </div>
    `
  }
];
