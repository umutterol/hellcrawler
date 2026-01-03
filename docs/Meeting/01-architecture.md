# Architecture Overview

This document covers the project architecture, tech stack, and build pipeline for this Phaser 4 idle game.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ELECTRON SHELL                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                     electron-loader.js                          ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ ││
│  │  │  Environment    │  │  JSON BigInt    │  │  ts-node (dev)  │ ││
│  │  │  (.env config)  │  │  Override       │  │  or build/      │ ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                  │                                   │
│                                  ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   Electron Main Process                         ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐││
│  │  │ BrowserWindow│  │ Steam SDK    │  │ Window Management      │││
│  │  │ (Frameless)  │  │ Integration  │  │ (Multi-monitor, size)  │││
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                  │                                   │
│                                  ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      RENDERER PROCESS                           ││
│  │  ┌─────────────────────────────────────────────────────────────┐││
│  │  │                    Phaser 4 Game                            │││
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│││
│  │  │  │ Upgrade   │  │  Menu     │  │  Battle   │  │  Other    ││││
│  │  │  │ Scene     │  │  Scene    │  │  Scene    │  │  Scenes   ││││
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘│││
│  │  └─────────────────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────────────────┐││
│  │  │                   DOM UI Overlay                            │││
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐│││
│  │  │  │ Buttons │  │ Sliders │  │ Modals  │  │ Notifications   ││││
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘│││
│  │  └─────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Project Directory Structure

```
project-root/
├── src/                          # TypeScript source code
│   ├── main.ts                   # Game entry point
│   ├── electron/
│   │   └── electron.ts           # Electron main process
│   └── assets/                   # Source assets
│       ├── sheets/               # Raw sprite sheets
│       └── tilemaps/             # Tilemap JSON files
│
├── build/                        # Production build output
│   ├── index.*.js                # Vite-bundled game (4.1MB)
│   ├── index.html                # Entry HTML
│   ├── electron/
│   │   └── electron.js           # Compiled Electron code
│   └── assets/
│       ├── animations/           # 42 animation sprite sheets
│       ├── sheets/               # 61 tile sprite sheets
│       ├── sheets_extruded/      # 61 extruded versions
│       ├── tilemaps/             # 61+ tilemap JSON files
│       ├── images/               # UI, avatars, particles
│       ├── sounds/               # 44 sound effects
│       ├── music/                # 23 music tracks
│       ├── shaders/              # 4 GLSL fragment shaders
│       ├── fonts/                # 4 custom fonts
│       └── cursor/               # Custom cursor assets
│
├── node_modules/
│   └── @telazer/                 # Custom helper libraries
│       ├── game-ui-kit/          # UI components
│       ├── phaser-anim-helper/   # Animation utilities
│       ├── phaser-audio-helper/  # Audio management
│       ├── phaser-image-helper/  # Image/texture handling
│       ├── phaser-text-helper/   # Text rendering
│       ├── event-helper/         # Event system
│       ├── font-loader/          # Font loading
│       ├── number-formatter/     # Number formatting
│       ├── json-bigint/          # BigInt JSON handling
│       ├── steamworks/           # Steam SDK bindings
│       └── version-check/        # Version utilities
│
├── save/                         # Game save files (.pxt)
├── scripts/                      # Build/utility scripts
├── .github/workflows/            # CI/CD pipelines
│
├── electron-loader.js            # Electron entry point
├── package.json                  # Project configuration
├── tsconfig.json                 # TypeScript config
├── tsconfig.electron.json        # Electron-specific TS config
├── vite.config.ts                # Vite build config
└── forge.config.js               # Electron Forge config
```

## Entry Points

### Web Entry (`index.html` → `src/main.ts`)

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="/src/main.ts"></script>
  </head>
  <body>
    <!-- Phaser canvas is injected here -->
  </body>
</html>
```

### Electron Entry (`electron-loader.js`)

```javascript
// electron-loader.js
require('dotenv').config();
require('@telazer/json-bigint').override();

if (process.env.PLATFORM === 'dev') {
  // Development: Use ts-node for hot reload
  require('ts-node').register();
  require('./src/electron/electron.ts');
} else {
  // Production: Use compiled JavaScript
  require('./build/electron/electron.js');
}
```

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME APPLICATION                          │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Phaser 4     │      │  Electron 36  │      │  i18next      │
│  (Game Engine)│      │  (Desktop)    │      │  (i18n)       │
└───────────────┘      └───────────────┘      └───────────────┘
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    @telazer HELPER LIBRARIES                     │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ game-ui-kit    │ phaser-anim-    │ phaser-audio-helper         │
│ (UI Components)│ helper          │ (Audio management)          │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ phaser-image-  │ phaser-text-    │ event-helper                │
│ helper         │ helper          │ (Event system)              │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ font-loader    │ number-formatter│ json-bigint                 │
├─────────────────┴─────────────────┴─────────────────────────────┤
│ steamworks (Steam SDK)  │  version-check                        │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
├─────────────────────────┬───────────────────────────────────────┤
│ tmi.js (Twitch Chat)    │ gameanalytics (Analytics)             │
├─────────────────────────┼───────────────────────────────────────┤
│ electron-store (State)  │ uuid, lodash, moment (Utilities)      │
└─────────────────────────┴───────────────────────────────────────┘
```

## Build Pipeline

### Development Mode

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  npm start       │ -> │  tsc (Electron)  │ -> │  vite dev server │
│                  │    │  tsconfig.electron│    │  (port 5173)     │
└──────────────────┘    └──────────────────┘    └──────────────────┘
                                                         │
                                                         ▼
                        ┌──────────────────┐    ┌──────────────────┐
                        │  electron        │ <- │  Loads localhost │
                        │  (window)        │    │  (HMR enabled)   │
                        └──────────────────┘    └──────────────────┘
```

### Production Build

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  npm run build   │ -> │  vite build      │ -> │  build/index.js  │
│                  │    │  (bundle + minify)│    │  (4.1MB)         │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │
         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  npm run make    │ -> │  electron-forge  │ -> │  Platform builds │
│                  │    │  (package)       │    │  (.zip, .dmg)    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

## Key Configuration Files

### package.json (Scripts)

```json
{
  "name": "idle-game",
  "version": "2.4.13",
  "main": "electron-loader.js",
  "scripts": {
    "start": "tsc --project tsconfig.electron.json && npm run start:web & sleep 5 && electron ./electron-loader.js",
    "start:web": "vite",
    "build": "vite build",
    "make:win": "npm run build && electron-forge make --platform win32",
    "make:mac": "npm run build && electron-forge make --platform darwin",
    "make:linux": "npm run build && electron-forge make --platform linux"
  }
}
```

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `phaser` | 4.0.0-rc.4 | Game engine |
| `electron` | 36.5.0 | Desktop shell |
| `electron-store` | 8.1.0 | Persistent state |
| `i18next` | 24.2.2 | Internationalization |
| `tmi.js` | 1.8.5 | Twitch chat |
| `gameanalytics` | 4.4.7 | Analytics |
| `vite` | 5.4.8 | Build tool |
| `typescript` | 5.0.3 | Type system |

## Asset Processing Scripts

```bash
# Extrude tile sprites (adds 1px border to prevent bleeding)
npm run extrude
# → Processes src/assets/sheets/*.png → build/assets/sheets_extruded/

# Parse tilemap JSON for tile data
npm run tilesetData
# → Extracts tile metadata from Tiled JSON files

# Auto-watch for changes during development
npm run watch
# → Runs extrude + tilesetData on file changes
```

## Platform-Specific Optimizations

The Electron main process applies GPU-specific flags:

| Platform | GPU Acceleration |
|----------|-----------------|
| macOS | Metal (`--use-angle=metal`) |
| Windows | Vulkan or D3D11 |
| Linux | GL or Vulkan |

```javascript
// Electron GPU flags (simplified)
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('use-angle', 'metal');
}
```

## Related Documentation

- [02-game-loop.md](./02-game-loop.md) - Scene management
- [12-platform.md](./12-platform.md) - Electron configuration
- [13-assets.md](./13-assets.md) - Asset pipeline details
