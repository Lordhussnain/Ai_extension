/**
 * Aether Agent Chrome Extension - content.js
 * Injected script that listens for messages from the sidebar chatbot
 * to interact directly with the active webpage DOM (extraction, reading, action).
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "extract_page_content") {
    try {
      const pageTitle = document.title;
      const pageUrl = window.location.href;

      // Start with metadata header
      let structuredText = `# Page Title: ${pageTitle}\n# Source URL: ${pageUrl}\n\n`;

      // Search for major semantic structure containers first, fallback to standard tags
      const mainContent = document.querySelector("article, main, #content, .content") || document.body;

      // Select meaningful text nodes
      const nodes = mainContent.querySelectorAll("h1, h2, h3, h4, p, li, table");
      let extractedLength = 0;

      if (nodes.length > 0) {
        nodes.forEach((node) => {
          const text = node.textContent.trim().replace(/\s+/g, " ");
          if (text.length < 3) return; // Skip trivial noise

          const tag = node.tagName.toLowerCase();
          if (tag === "h1") {
            structuredText += `\n# ${text}\n\n`;
          } else if (tag === "h2") {
            structuredText += `\n## ${text}\n\n`;
          } else if (tag === "h3" || tag === "h4") {
            structuredText += `\n### ${text}\n\n`;
          } else if (tag === "p") {
            structuredText += `${text}\n\n`;
          } else if (tag === "li") {
            structuredText += `* ${text}\n`;
          } else if (tag === "table") {
            // Include tables if any text is found
            structuredText += `[TABLE DATA]\n${text}\n\n`;
          }
          extractedLength += text.length;
        });
      }

      // Fallback if structured queries produced close to nothing
      if (extractedLength < 150) {
        // Collect visible inner text
        const bodyText = document.body.innerText || "";
        const cleanBodyText = bodyText
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join("\n\n");
        structuredText += cleanBodyText;
      }

      sendResponse({
        success: true,
        text: structuredText,
        title: pageTitle,
        url: pageUrl
      });
    } catch (error) {
      console.error("DOM content extraction failed:", error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // async marker
  }
});
