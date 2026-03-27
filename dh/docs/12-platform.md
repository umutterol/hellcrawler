# Platform Integration

This document covers Electron configuration, Steam integration, Twitch chat, and multi-platform support.

## Electron Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELECTRON ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │                    MAIN PROCESS                              │
    │                 (electron-loader.js)                         │
    │                                                              │
    │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
    │  │ BrowserWindow │  │ Steam SDK     │  │ IPC Handler   │   │
    │  │ Management    │  │ Integration   │  │               │   │
    │  └───────────────┘  └───────────────┘  └───────────────┘   │
    │                                                              │
    └─────────────────────────────────────────────────────────────┘
                              │
                              │ IPC Communication
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                   RENDERER PROCESS                           │
    │                   (Phaser Game)                              │
    │                                                              │
    │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
    │  │ Game Canvas   │  │ DOM UI        │  │ Web APIs      │   │
    │  │               │  │               │  │               │   │
    │  └───────────────┘  └───────────────┘  └───────────────┘   │
    │                                                              │
    └─────────────────────────────────────────────────────────────┘
```

## Electron Entry Point

### electron-loader.js

```javascript
// Load environment variables
require('dotenv').config();

// Override JSON to handle BigInt
require('@telazer/json-bigint').override();

// Development vs Production
if (process.env.PLATFORM === 'dev') {
  // Use ts-node for hot reload
  require('ts-node').register();
  require('./src/electron/electron.ts');
} else {
  // Use compiled JavaScript
  require('./build/electron/electron.js');
}
```

## Window Configuration

### BrowserWindow Settings

```javascript
// Window creation (conceptual from electron.ts)
const createWindow = () => {
  const win = new BrowserWindow({
    // Frameless transparent window
    frame: false,
    transparent: true,
    resizable: false,

    // Size based on step multiplier
    width: calculateWidth(sizeStep),
    height: BASE_CANVAS_HEIGHT * sizeStep, // 104 * sizeStep

    // Always on top (desktop widget style)
    alwaysOnTop: true,

    // Web preferences
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  // Load game
  if (process.env.PLATFORM === 'dev') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile('build/index.html');
  }

  return win;
};
```

### Window Size Steps

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIZE STEP SYSTEM                              │
│                                                                  │
│  Base Height: 104 pixels                                         │
│                                                                  │
│  Step │ Height │ Approximate Use                                │
│  ─────┼────────┼────────────────────────────────────────────    │
│   2   │  208px │ Minimal/compact                                │
│   4   │  416px │ Small                                          │
│   6   │  624px │ Default                                        │
│   8   │  832px │ Large                                          │
│  10   │ 1040px │ Maximum                                        │
│                                                                  │
│  Width calculated from display aspect ratio                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## GPU Acceleration

### Platform-Specific Flags

```javascript
// GPU acceleration flags
const setGPUFlags = () => {
  if (process.platform === 'darwin') {
    // macOS: Use Metal for best performance
    app.commandLine.appendSwitch('use-angle', 'metal');
  } else if (process.platform === 'win32') {
    // Windows: Use Vulkan or D3D11
    app.commandLine.appendSwitch('use-angle', 'd3d11');
    // Or for Vulkan:
    // app.commandLine.appendSwitch('use-vulkan');
  } else {
    // Linux: Use OpenGL or Vulkan
    app.commandLine.appendSwitch('use-gl', 'desktop');
  }

  // Disable GPU sandbox for compatibility
  app.commandLine.appendSwitch('disable-gpu-sandbox');
};
```

## Multi-Monitor Support

### Display Detection

```javascript
const { screen } = require('electron');

// Get all displays
const displays = screen.getAllDisplays();

// Find primary display
const primaryDisplay = screen.getPrimaryDisplay();

// Get display at cursor position
const cursorDisplay = screen.getDisplayNearestPoint(
  screen.getCursorScreenPoint()
);

// Position window on specific display
const positionOnDisplay = (win, displayIndex) => {
  const display = displays[displayIndex] || primaryDisplay;
  const { x, y, width, height } = display.workArea;

  win.setPosition(x + (width - win.getSize()[0]) / 2, y);
};
```

### Display Cycling

```javascript
// Cycle window between displays
let currentDisplayIndex = 0;

const cycleDisplay = () => {
  currentDisplayIndex = (currentDisplayIndex + 1) % displays.length;
  positionOnDisplay(mainWindow, currentDisplayIndex);
  store.set('display', currentDisplayIndex);
};
```

## Click-Through Mode

### Transparent Window Passthrough

```javascript
// Enable click-through (mouse passes to windows behind)
const setClickThrough = (enabled) => {
  mainWindow.setIgnoreMouseEvents(enabled, { forward: true });
  store.set('clickThrough', enabled);
};

// Toggle via IPC
ipcMain.on('toggle-click-through', () => {
  const current = store.get('clickThrough', false);
  setClickThrough(!current);
});
```

## Steam Integration

### @telazer/steamworks

```javascript
import { steamworks } from '@telazer/steamworks';

// Initialize Steam
const initSteam = async () => {
  try {
    const client = await steamworks.init(APP_ID);

    if (!client) {
      console.log('Steam not running');
      return false;
    }

    // Get Steam user info
    const steamId = client.localplayer.getSteamId();
    const playerName = client.localplayer.getName();

    console.log(`Steam user: ${playerName} (${steamId})`);

    return true;
  } catch (error) {
    console.error('Steam init failed:', error);
    return false;
  }
};
```

### Achievements

```javascript
// Unlock achievement
const unlockAchievement = (achievementId) => {
  if (!steamClient) return;

  steamClient.achievement.activate(achievementId);
};

// Achievement examples
const ACHIEVEMENTS = {
  FIRST_KILL: 'ACH_FIRST_KILL',
  LEVEL_10: 'ACH_LEVEL_10',
  LEVEL_50: 'ACH_LEVEL_50',
  BOSS_SLAYER: 'ACH_BOSS_SLAYER',
  GOLD_HOARDER: 'ACH_1M_GOLD',
  COMPLETIONIST: 'ACH_ALL_MAPS'
};

// Track progress
events.on('levelUp', (level) => {
  if (level === 10) unlockAchievement(ACHIEVEMENTS.LEVEL_10);
  if (level === 50) unlockAchievement(ACHIEVEMENTS.LEVEL_50);
});
```

### Steam Overlay

```javascript
// Detect Steam overlay
steamClient.callback.on('GameOverlayActivated', (active) => {
  if (active) {
    // Pause game when overlay opens
    game.pause();
  } else {
    // Resume when overlay closes
    game.resume();
  }
});
```

## Twitch Integration

### tmi.js Chat Client

```javascript
import tmi from 'tmi.js';

// Connect to Twitch chat
const connectTwitch = (channel, oauth) => {
  const client = new tmi.Client({
    connection: {
      secure: true,
      reconnect: true
    },
    identity: {
      username: channel,
      password: oauth
    },
    channels: [channel]
  });

  client.connect();

  return client;
};

// Handle chat messages
twitchClient.on('message', (channel, tags, message, self) => {
  if (self) return; // Ignore own messages

  // Parse commands
  if (message.startsWith('!')) {
    handleTwitchCommand(tags, message);
  }
});
```

### Twitch Commands

```javascript
// Example Twitch chat commands
const handleTwitchCommand = (tags, message) => {
  const [command, ...args] = message.slice(1).split(' ');

  switch (command.toLowerCase()) {
    case 'stats':
      sendStats(tags.username);
      break;

    case 'level':
      sendLevel(tags.username);
      break;

    case 'help':
      sendHelp(tags.username);
      break;
  }
};
```

## Analytics (GameAnalytics)

### Event Tracking

```javascript
import GameAnalytics from 'gameanalytics';

// Initialize
GameAnalytics.configureBuild('2.4.13');
GameAnalytics.initialize(GAME_KEY, SECRET_KEY);

// Track progression
GameAnalytics.addProgressionEvent(
  GameAnalytics.EGAProgressionStatus.Complete,
  'map',
  mapId,
  `difficulty_${difficulty}`
);

// Track resources
GameAnalytics.addResourceEvent(
  GameAnalytics.EGAResourceFlowType.Source,
  'gold',
  amount,
  'kill',
  enemyType
);

// Track design events
GameAnalytics.addDesignEvent('levelup', level);
GameAnalytics.addDesignEvent('boss_kill', bossId);
```

## IPC Communication

### Main ↔ Renderer Communication

```javascript
// Main process
const { ipcMain } = require('electron');

ipcMain.handle('get-steam-id', async () => {
  return steamClient?.localplayer.getSteamId() || null;
});

ipcMain.on('resize-window', (event, sizeStep) => {
  resizeWindow(sizeStep);
});

// Renderer process
const { ipcRenderer } = require('electron');

const steamId = await ipcRenderer.invoke('get-steam-id');
ipcRenderer.send('resize-window', 8);
```

## Build Configuration

### Electron Forge

```javascript
// forge.config.js
module.exports = {
  packagerConfig: {
    icon: 'build/assets/icons/icon',
    appBundleId: 'com.example.idlegame',
    asar: true
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux']
    }
  ]
};
```

### Platform Builds

```bash
# Build for current platform
npm run make

# Build for specific platforms
npm run make:mac    # macOS
npm run make:win    # Windows
npm run make:linux  # Linux

# Build all platforms
npm run make:all
```

## Environment Variables

### .env Configuration

```env
# Platform mode
PLATFORM=dev

# Steam configuration
STEAM_APP_ID=123456

# Twitch configuration
TWITCH_CLIENT_ID=xxx
TWITCH_REDIRECT_URI=xxx

# Analytics
GA_GAME_KEY=xxx
GA_SECRET_KEY=xxx

# Build mode
BUILD_MODE=prod  # prod, demo, prototype, dev
```

## Persistence

### electron-store

```javascript
const Store = require('electron-store');

const store = new Store({
  name: 'idle-game-settings',
  defaults: {
    sizeStep: 6,
    display: 0,
    clickThrough: false,
    windowPosition: null
  }
});

// Usage
store.get('sizeStep');          // Get value
store.set('sizeStep', 8);       // Set value
store.delete('sizeStep');       // Delete key
store.clear();                  // Clear all
```

## Platform Differences

### Feature Matrix

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Steam | Yes | Yes | Yes |
| Twitch | Yes | Yes | Yes |
| GPU Accel | D3D11/Vulkan | Metal | GL/Vulkan |
| Tray Icon | Yes | Yes | Yes |
| Auto-update | Yes | Yes | Partial |
| Notifications | Yes | Yes | Yes |

### Platform-Specific Code

```javascript
// Platform checks
if (process.platform === 'darwin') {
  // macOS specific
  app.dock.setIcon('icon.png');
}

if (process.platform === 'win32') {
  // Windows specific
  app.setAppUserModelId('com.example.idlegame');
}

if (process.platform === 'linux') {
  // Linux specific
  // Handle different desktop environments
}
```

## Related Documentation

- [01-architecture.md](./01-architecture.md) - Overall architecture
- [03-state-management.md](./03-state-management.md) - Settings persistence
- [11-audio.md](./11-audio.md) - Platform audio
