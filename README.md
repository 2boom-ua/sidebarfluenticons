<div align="center">  
    <img src="https://github.com/2boom-ua/sidebarfluenticons/blob/main/icons/icon_128.png?raw=true" alt="" width="128" height="128">
</div>

# Fluent System Icons Viewer

![Version](https://img.shields.io/badge/version-1.3-green.svg)

A lightweight Chrome/Edge extension that lets you browse, search, copy, and download [Fluent System Icons](https://github.com/microsoft/fluentui-system-icons) directly from a browser side panel.

## Features

- **Search** — filter icons by name in real time
- **Style filter** — switch between **Regular** and **Filled** icon sets
- **Grid preview** — browse the full icon set in a responsive grid
- **Detail view** — click an icon to open a modal with all available sizes
- **Copy SVG** — copy the raw SVG markup straight to your clipboard
- **Download** — save the SVG file for the selected size
- **Export** — as CSS background
- **Webfont snippet** — copy an `<i class="...">` webfont-style tag
- **Light / dark theme** — automatically follows your system color scheme
- **Localization-ready** — UI strings are pulled through `chrome.i18n`
- **Side panel integration** — opens in Chrome's native side panel via `chrome.sidePanel`

## How it works

- Icon metadata (name, size, style) is pre-generated into `data/icons.json` by `tools/generate-icons.js`, which scans the installed `@fluentui/svg-icons` npm package.
- At runtime, the side panel (`sidepanel.js`) loads this local index and streams the actual SVG assets on demand from the [jsDelivr CDN](https://www.jsdelivr.com/) (`cdn.jsdelivr.net/npm/@fluentui/svg-icons`), keeping the extension itself small.
- Clicking an icon opens a modal where you can pick a size, then copy, download, or grab a webfont-style snippet for it.

## From Chrome Web Store or Edge Add-ons

Comming soon

## Manual Installation (Developer Mode)

1. Clone or download this repository.
2. Generate the icon index (requires the `@fluentui/svg-icons` package to be installed in `node_modules`):
   ```bash
   npm install @fluentui/svg-icons@1.1.339 or @x.x.xxx
   node tools/generate-icons.js
   ```
   This produces `data/icons.json`.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode** (top right).
5. Click **Load unpacked** and select the project folder.
6. Click the extension icon in the toolbar to open the side panel.

## Project structure

```
.
├── manifest.json          # Chrome extension manifest (MV3)
├── background.js          # Registers the side panel behavior
├── sidepanel.html          # Side panel UI markup
├── sidepanel.css           # Light/dark themed styles
├── sidepanel.js             # Search, filter, grid rendering, modal logic
├── data/icons.json          # Generated icon index (name, size, style)
└── tools/generate-icons.js  # Builds data/icons.json from @fluentui/svg-icons
```

## Permissions

- `sidePanel` — to render the extension UI in Chrome's/Edge's side panel
- `clipboardWrite` — to support the copy-SVG / copy-webfont-snippet actions
- Host permission for `cdn.jsdelivr.net` — to fetch icon SVGs at runtime

## Browser compatibility

- Chrome
- Edge
- Brave

## Privacy

- No analytics
- No tracking
- No external servers
- All processing is performed locally

## Credits

- Icons: [Fluent System Icons](https://github.com/microsoft/fluentui-system-icons) by Microsoft, served via [jsDelivr](https://www.jsdelivr.com/).

## License

Copyright © 2boom, 2026.
