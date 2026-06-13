// content.js
const domain = location.hostname;
let targetGain = 1.0;
const gainNodes = new WeakMap();

// Detect direct media file tabs (e.g. https://example.com/video.mp4)
const RAW_MEDIA_EXTENSIONS = /\.(mp4|webm|ogg|ogv|mp3|wav|flac|aac|m3u8|ts|mov|avi|mkv)(\?.*)?$/i;
const isDirectMediaTab = RAW_MEDIA_EXTENSIONS.test(location.pathname + location.search);

// ─── Load saved settings ───────────────────────────────────────────────────
chrome.storage.local.get(domain, (res) => {
  let settings = res[domain];
  if (typeof settings === 'number') {
    targetGain = settings;
  } else if (settings && settings.gain !== undefined) {
    targetGain = settings.gain;
  }
  boostAllMediaNow();
});

// ─── Audio boosting ────────────────────────────────────────────────────────

/**
 * For NORMAL pages: use Web Audio API (supports >100% gain).
 * For DIRECT MEDIA TABS: only scale el.volume (capped at 1.0 by browser),
 * and defer any AudioContext creation until after a user gesture so Chrome
 * never sees an early AudioContext during its URL-routing phase.
 */
function boostMedia(el) {
  if (!el.isConnected) return;

  if (isDirectMediaTab) {
    // ── Safe path for raw media tabs ──────────────────────────────────────
    // Step 1: Apply native volume immediately (works without AudioContext).
    //         Browser caps el.volume at 1.0, so this only helps 0–100%.
    applyNativeVolume(el);

    // Step 2: If gain > 1.0, wait for a real user interaction before
    //         touching AudioContext — this prevents the tab-split bug.
    if (targetGain > 1.0 && !gainNodes.has(el)) {
      const attachOnInteraction = () => {
        attachAudioContext(el);
        // Clean up listeners after first interaction
        ['click', 'keydown', 'pointerdown'].forEach(evt =>
          document.removeEventListener(evt, attachOnInteraction)
        );
      };
      ['click', 'keydown', 'pointerdown'].forEach(evt =>
        document.addEventListener(evt, attachOnInteraction, { once: true })
      );
    }
    return;
  }

  // ── Normal path for regular web pages ────────────────────────────────────
  attachAudioContext(el);
}

function applyNativeVolume(el) {
  // Clamp to [0, 1] — browser hard-limits el.volume to this range.
  el.volume = Math.min(1.0, Math.max(0, targetGain));
}

function attachAudioContext(el) {
  if (!el.isConnected) return;
  if (gainNodes.has(el)) {
    // Already attached — just update gain value
    gainNodes.get(el).gain.value = targetGain;
    return;
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(targetGain, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    gainNodes.set(el, gain);
  } catch (e) {
    // Already captured by another AudioContext — safe to ignore
  }
}

function boostAllMediaNow() {
  document.querySelectorAll('video, audio').forEach(boostMedia);
}

// ─── Observe dynamically added media elements ──────────────────────────────
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

// ─── Messages from background / popup ─────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "setVolume") {
    targetGain = msg.value;
    chrome.storage.local.get(domain, (res) => {
      let settings = res[domain];
      if (typeof settings === 'number') settings = { gain: settings, enabled: true };
      if (!settings) settings = { gain: 1.0, enabled: true };
      settings.gain = targetGain;
      chrome.storage.local.set({ [domain]: settings });
    });
    // Re-apply to all current media
    document.querySelectorAll('video, audio').forEach(el => {
      if (isDirectMediaTab) {
        applyNativeVolume(el);
        // If user has already interacted, AudioContext may exist — update it
        if (gainNodes.has(el)) gainNodes.get(el).gain.value = targetGain;
      } else {
        boostMedia(el);
      }
    });
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

// ─── YouTube / SPA navigation ──────────────────────────────────────────────
new MutationObserver(() => {
  if (location.href !== document._lastUrl) {
    document._lastUrl = location.href;
    setTimeout(boostAllMediaNow, 800);
  }
}).observe(document, { subtree: true, childList: true });
