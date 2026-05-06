// content.js
const domain = location.hostname;
let targetGain = 1.0;
const gainNodes = new WeakMap();

// Load saved settings for this site
chrome.storage.local.get(domain, (res) => {
  let settings = res[domain];
  if (typeof settings === 'number') {
    targetGain = settings;
  } else if (settings && settings.gain !== undefined) {
    targetGain = settings.gain;
  }
  // Default is 1.0 if nothing saved
  boostAllMediaNow();
});

function boostMedia(el) {
  if (gainNodes.has(el)) {
    gainNodes.get(el).gain.value = targetGain;
    return;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(targetGain, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    gainNodes.set(el, gain);
  } catch (e) {
    // Graceful fallback
  }
}

function boostAllMediaNow() {
  document.querySelectorAll('video, audio').forEach(boostMedia);
}

// Observe new media elements
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
        boostMedia(node);
      }
      if (node.querySelectorAll) {
        node.querySelectorAll('video, audio').forEach(boostMedia);
      }
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

// Messages from background/popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "setVolume") {
    targetGain = msg.value;
    // Save the new gain (keep existing enabled state)
    chrome.storage.local.get(domain, (res) => {
      let settings = res[domain];
      if (typeof settings === 'number') settings = { gain: settings, enabled: true };
      if (!settings) settings = { gain: 1.0, enabled: true };
      settings.gain = targetGain;
      chrome.storage.local.set({ [domain]: settings });
    });
    boostAllMediaNow();
  }
  if (msg.action === "mute") {
    document.querySelectorAll('video, audio').forEach(el => {
      el._wasPlaying = !el.paused;
      el.pause();
      el.muted = true;
    });
  }
  if (msg.action === "unmute") {
    document.querySelectorAll('video, audio').forEach(el => {
      el.muted = false;
      if (el._wasPlaying) el.play().catch(() => {});
    });
  }
});

// Handle YouTube SPA navigation
new MutationObserver(() => {
  if (location.href !== document._lastUrl) {
    document._lastUrl = location.href;
    setTimeout(boostAllMediaNow, 800);
  }
}).observe(document, { subtree: true, childList: true });