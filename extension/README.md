# Aether Agent — Chrome WebExtension Sidebar Agent

Aether Agent is a powerful, production-grade Chrome WebExtension (Manifest V3) that functions as an autonomous personal chatbot in your browser sidebar. It is designed with complete context-awareness to read, analyze, and automate document workflows directly from active webpage DOM viewports.

---

## 🚀 Core Capabilities
1. **Interactive Chat Interface**: Dark modern glassmorphic chat sidebar equipped with an offline-compatible markdown parser, typing animations, and full conversation storage.
2. **Tab Scraping & Scouring (`extract_page_content`)**: Grabs active page title, URL, headings, paragraphs, bullet points, and table structures, compiles them into clean markdown tables, and injects them as immediate situational prompt context.
3. **Multimodal Action Snapshotting (`take_screenshot`)**: Calls background service workers to capture full-layout viewport snapshots, automatically processing them within Gemini to perform native visual interpretation.
4. **Visual Page OCR Scans (`ocr_image`)**: Allows selecting files or taking local screenshots, extracting printed/handwritten text flawlessly using native Gemini multimodal OCR engines.
5. **Dynamic Document Generators (`create_file`, `create_pdf`)**: Packages text directly into downloaded logs, CSV spreads, markdown journals, or compiles beautiful multi-page PDF documents formatted with custom headings and page indicators.
6. **Workspace Integrations**: Skeletons and authentication boilerplate to sync outputs directly to Google Sheets (`google_sheets_create`), Google Keep (`google_keep_create_note`), and Google Drive backups (`google_drive_upload`) using privileged Chrome Identity OAuth tokens.
7. **Interactive Memory Bank (`save_memory`, `get_memory`)**: Read/write storage keywaves saved locally inside `chrome.storage.local` to memorize personal user settings, code styles, or key details that persist across tabs.

---

## 📂 Architecture Layout
* `manifest.json`: Standard Manifest V3 setup denoting high-permissions (`sidePanel`, `scripting`, `tabs`, `activeTab`, `downloads`, `storage`, and `clipboardWrite`), background service worker, and active content injection triggers.
* `background.js`: Highly responsive background event hub opening the sidebar when the action icon is clicked and executing privileged visible screen capture.
* `content.js`: Non-blocking DOM parser operating in active page isolation, structured to parse paragraphs, lists, and tables.
* `sidepanel.html`: Core HTML structure of the glassmorphism dashboard, styled with inline SVG icons for secure Chrome CSP compliance.
* `sidepanel.css`: High-fidelity Obsidian dark theme containing custom responsive styles, scrollbars, dynamic status icons, and code structures.
* `sidepanel.js`: Main orchestration core featuring the re-entrant autonomous ReAct agent loop, local Chrome actions, storage, and custom file triggers.

---

## 🛠️ Complete Installation Guide (Load Unpacked)

To install Aether Agent into Google Chrome manually as a developer package:
1. **Download files**: Click **Download Extension ZIP** from the Aether Dashboard to package and export the folder directly, or compress the `/extension/` directory.
2. **Unpack**: Extract the zip archive locally.
3. **Open Extensions Dashboard**: In Google Chrome, navigate to `chrome://extensions/` (or click `Settings` > `Extensions`).
4. **Developer Mode**: Toggle the **Developer Mode** slider in the top right corner to **ON**.
5. **Load Unpacked**: Click the **Load unpacked** button in the top left corner.
6. **Attach Folder**: Select the extracted folder containing the `manifest.json` file.
7. **Pin Action**: Click the Extensions jigsaw puzzle icon in the Chrome browser bar, find **Aether Agent**, and click the pin icon.

---

## ⚙️ Configuration & Key Setup

1. Click the **Aether Agent** extension icon in your toolbar to slide open the side panel.
2. Click the setting gear icon (⚙️) at the top of the pane to open the settings panel.
3. Select your AI provider (Google Gemini is native; OpenAI, Anthropic Claude, and Grok xAI are also supported).
4. Paste your **API Key** credentials, input your model alias (e.g. `gemini-3.5-flash`), and click **Save Config**.
5. The status light will transition to **SYSTEM READY**. You can now instruct, query, scrape, and download documents right from your screen!
