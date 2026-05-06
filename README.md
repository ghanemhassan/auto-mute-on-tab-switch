# AutoMute + Volume Booster

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue.svg)]()
[![Manifest Version](https://img.shields.io/badge/manifest-v3-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)]()

A powerful Chrome extension that automatically mutes media when you switch tabs and boosts volume up to 600% on a per‑site basis.

##  Features

- **Smart Tab Management** – Automatically pauses and mutes media when you leave a tab, then resumes playback when you return
- **Volume Boost** – Increase audio volume up to 600% (6× normal level)
- **Per‑Site Settings** – Volume levels and AutoMute preferences are saved independently for each website
- **YouTube & SPA Support** – Works seamlessly on YouTube and other Single Page Applications (SPAs)
- **Dynamic Content Detection** – Automatically handles dynamically loaded video/audio elements (infinite scroll, modals, etc.)
- **Zero Tracking** – No analytics, no telemetry, complete privacy

##  Screenshots

| Settings Popup |
|:---:|
| *Clean, intuitive popup interface* |

##  Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](#) *(link coming soon)*
2. Click **"Add to Chrome"**
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Clone or download this repository
```bash
   git clone https://github.com/yourusername/automute-volume-booster.git
```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top‑right corner)
4. Click **"Load unpacked"**
5. Select the extension folder

## 🎮 How to Use

### Basic Controls

1. Click the extension icon in your Chrome toolbar
2. Use the **Volume Boost** slider (0% – 600%)
3. Toggle **AutoMute on Tab Switch** on/off per site

### How AutoMute Works

- When you switch away from a tab, all media is **paused and muted**
- When you return, media **resumes playback** automatically
- Perfect for music streaming, podcasts, video courses, and background audio

### Volume Boost

- Boost audio beyond your system's maximum volume
- Settings are saved per website (e.g., 200% for YouTube, 150% for Spotify Web)
- Uses Web Audio API for clean, distortion‑free amplification

## Technical Details

### Architecture

| Component | Description |
|-----------|-------------|
| **Background Service Worker** | Tracks active tabs and manages mute/unmute events |
| **Content Script** | Injects audio controls into web pages, monitors DOM changes |
| **Popup UI** | Provides user controls and per‑site settings storage |
| **Storage API** | Persists volume levels and AutoMute preferences |

### Permissions Explained

```json
{
  "permissions": ["tabs", "activeTab", "scripting", "storage"],
  "host_permissions": ["<all_urls>"]
}
```

- `tabs` / `activeTab` – Track tab switching and inject content scripts
- `scripting` – Dynamically control media elements
- `storage` – Save per‑site volume preferences
- `<all_urls>` – Work on every website (required for media detection)

### Compatibility

- Chrome 88+ (Manifest V3)
- Chromium‑based browsers (Edge, Brave, Opera, Vivaldi)
- YouTube, Netflix, Spotify Web, SoundCloud, Vimeo, and most HTML5 media players

## Development

### Project Structure

```
automute-volume-booster/
├── manifest.json          # Extension manifest (V3)
├── background.js          # Service worker for tab tracking
├── content.js             # Injected script for media control
├── popup.html             # UI popup structure
├── popup.css              # Popup styling
├── popup.js               # Popup logic & settings UI
└── icons/                 # Extension icons (24px, 48px, 128px)
```

### Build & Test

No build step required – it's vanilla JavaScript!

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the **refresh** icon on the extension card
4. Test your changes on any media‑containing website

### Key Code Examples

**Boosting volume via Web Audio API:**
```javascript
const ctx = new AudioContext();
const source = ctx.createMediaElementSource(videoElement);
const gain = ctx.createGain();
gain.gain.value = targetGain; // 0.0 – 6.0
source.connect(gain).connect(ctx.destination);
```

**Tab switching handler:**
```javascript
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Mute previous tab, unmute new tab
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **No volume boost on certain sites** | Some sites (e.g., Spotify Web) use DRM or custom audio pipelines. Try refreshing the page after adjusting the slider. |
| **Audio doesn't resume after switching back** | Some sites (like YouTube) require user interaction to play audio. Click anywhere on the page to enable playback. |
| **Extension stops working after browser update** | Reload the extension at `chrome://extensions/` or reinstall from the Web Store. |
| **Volume slider resets unexpectedly** | Ensure Chrome has write permissions to its storage. Check for conflicting extensions. |

## Roadmap

- [ ] Keyboard shortcuts for volume boost
- [ ] Global volume limit setting
- [ ] Blacklist/whitelist for AutoMute
- [ ] Export/import settings
- [ ] Firefox port (Manifest V2)

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

Please ensure your code follows existing style conventions and passes basic functionality tests.

## License

Distributed under the MIT License. See `LICENSE` file for more information.

## Acknowledgements

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) – For clean audio amplification
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/) – For Manifest V3 guidance
- All open‑source contributors and testers

## Contact

Project Link: [https://github.com/yourusername/automute-volume-booster](https://github.com/yourusername/automute-volume-booster)

---

**Made with ❤️ for tab hoarders and audiophiles**
