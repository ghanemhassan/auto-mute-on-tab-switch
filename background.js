// background.js
let lastActiveTabId = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const newTabId = activeInfo.tabId;

  // Mute previous tab only if AutoMute is enabled for its site
  if (lastActiveTabId && lastActiveTabId !== newTabId) {
    try {
      const prevTab = await chrome.tabs.get(lastActiveTabId);
      if (prevTab.url) {
        const url = new URL(prevTab.url);
        const domain = url.hostname;
        const res = await chrome.storage.local.get(domain);
        let settings = res[domain];
        let enabled = true;

        if (typeof settings === 'number') {
          enabled = true; // old data → assume enabled
        } else if (settings && settings.enabled !== undefined) {
          enabled = settings.enabled;
        }

        if (enabled) {
          await chrome.tabs.sendMessage(lastActiveTabId, { action: "mute" });
        }
      }
    } catch (e) {
      // Tab probably closed or inaccessible
    }
  }

  // Always unmute the new active tab
  try {
    await chrome.tabs.sendMessage(newTabId, { action: "unmute" });
  } catch (e) {}

  lastActiveTabId = newTabId;
});

// Clean up if active tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === lastActiveTabId) {
    lastActiveTabId = null;
  }
});