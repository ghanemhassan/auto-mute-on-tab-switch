// popup.js
const slider = document.getElementById('slider');
const display = document.getElementById('volumeDisplay');
const domainEl = document.getElementById('domain');
const enableCheckbox = document.getElementById('enable');

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function applyVolume(gain) {
  const tab = await getCurrentTab();
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { action: "setVolume", value: gain });
}

async function loadSettings() {
  const tab = await getCurrentTab();
  if (!tab?.url) return;
  const url = new URL(tab.url);
  const domain = url.hostname;
  domainEl.textContent = `Site: ${domain}`;

  chrome.storage.local.get(domain, (res) => {
    let settings = res[domain];
    // Backward compatibility: old data was just a number (gain)
    if (typeof settings === 'number') {
      settings = { gain: settings, enabled: true };
    } else if (!settings) {
      settings = { gain: 1.0, enabled: true };
    }

    const percent = Math.round(settings.gain * 100);
    slider.value = percent;
    display.textContent = percent + '%';
    display.style.color = percent > 100 ? '#e74c3c' : '#18A999';
    enableCheckbox.checked = settings.enabled;
  });
}

function saveSettings(domain, newSettings) {
  chrome.storage.local.set({ [domain]: newSettings });
}

// Volume slider change
slider.addEventListener('input', (e) => {
  const percent = parseInt(e.target.value);
  const gain = percent / 100;
  display.textContent = percent + '%';
  display.style.color = percent > 100 ? '#e74c3c' : '#18A999';

  getCurrentTab().then(tab => {
    if (!tab?.url) return;
    const domain = new URL(tab.url).hostname;
    chrome.storage.local.get(domain, (res) => {
      let settings = res[domain];
      if (typeof settings === 'number') settings = { gain: settings, enabled: true };
      if (!settings) settings = { gain: 1.0, enabled: true };
      settings.gain = gain;
      saveSettings(domain, settings);
    });
  });

  applyVolume(gain);
});

// Toggle change
enableCheckbox.addEventListener('change', () => {
  const enabled = enableCheckbox.checked;

  getCurrentTab().then(tab => {
    if (!tab?.url) return;
    const domain = new URL(tab.url).hostname;
    chrome.storage.local.get(domain, (res) => {
      let settings = res[domain];
      if (typeof settings === 'number') settings = { gain: settings, enabled: true };
      if (!settings) settings = { gain: 1.0, enabled: true };
      settings.enabled = enabled;
      saveSettings(domain, settings);
    });
  });
});

// Initial load + react to tab changes
loadSettings();
chrome.tabs.onActivated.addListener(loadSettings);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') loadSettings();
});