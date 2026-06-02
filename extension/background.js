/**
 * Aether Agent Chrome Extension - background.js (Service Worker)
 * Handles extension lifecycle actions, side panel opening trigger,
 * and background API calls (e.g., privileged screenshot capture).
 */

// Configure the extension to open the side panel when the action button (icon) is clicked
chrome.runtime.onInstalled.addListener(() => {
  console.log("Aether Agent extension installed successfully.");
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("Error setting panel behavior:", error));
});

// Listener for runtime messages coming from the sidepanel or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.action === "capture_screenshot") {
    // Privilege requirement: tabs permission allows capturing the visible tab in high quality png format
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error("Screenshot capture error:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, screenshot: dataUrl });
      }
    });
    return true; // Keeps the sendResponse channel open for async execution
  }

  if (message.action === "get_active_tab_info") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        sendResponse({ success: false, error: "Unable to retrieve active tab info." });
      } else {
        const activeTab = tabs[0];
        sendResponse({
          success: true,
          tabId: activeTab.id,
          title: activeTab.title,
          url: activeTab.url
        });
      }
    });
    return true;
  }
});
