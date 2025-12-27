import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// State for window options
let isAlwaysOnTop = true;
let isClickThroughEnabled = true;

function createWindow(): void {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Calculate window size (maintain 16:9 aspect ratio, fit to screen)
  const gameWidth = 1920;
  const gameHeight = 1080;
  const scaleFactor = Math.min(
    (screenWidth * 0.8) / gameWidth,
    (screenHeight * 0.9) / gameHeight,
    1 // Don't scale up beyond native size
  );

  const windowWidth = Math.floor(gameWidth * scaleFactor);
  const windowHeight = Math.floor(gameHeight * scaleFactor);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: Math.floor((screenWidth - windowWidth) / 2),
    y: Math.floor((screenHeight - windowHeight) / 2),

    // Transparent window configuration (always enabled)
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,

    // Desktop mode defaults
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: false,

    // Web preferences
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },

    // Appearance
    backgroundColor: '#00000000', // Fully transparent
    show: false, // Show when ready to prevent flash
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open DevTools detached (transparency breaks with attached devtools)
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers

/**
 * Toggle always-on-top state
 */
ipcMain.handle('set-always-on-top', (_event, enabled: boolean) => {
  if (!mainWindow) return false;

  isAlwaysOnTop = enabled;
  mainWindow.setAlwaysOnTop(enabled, 'screen-saver');

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Electron] Always on top: ${enabled}`);
  }

  return true;
});

/**
 * Toggle click-through for transparent areas
 * When enabled, transparent areas pass clicks to windows behind
 */
ipcMain.handle('set-click-through', (_event, enabled: boolean) => {
  if (!mainWindow) return false;

  isClickThroughEnabled = enabled;

  if (enabled) {
    // Enable click-through with forwarding for hover detection
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    // Disable click-through - window receives all mouse events
    mainWindow.setIgnoreMouseEvents(false);
  }

  return true;
});

/**
 * Get current window state
 */
ipcMain.handle('get-window-state', () => {
  return {
    alwaysOnTop: isAlwaysOnTop,
    clickThroughEnabled: isClickThroughEnabled,
  };
});

/**
 * Set window position (for dragging frameless window)
 */
ipcMain.handle('set-window-position', (_event, x: number, y: number) => {
  if (!mainWindow) return false;

  mainWindow.setPosition(Math.floor(x), Math.floor(y));
  return true;
});

/**
 * Get window position
 */
ipcMain.handle('get-window-position', () => {
  if (!mainWindow) return { x: 0, y: 0 };

  const [x, y] = mainWindow.getPosition();
  return { x, y };
});

/**
 * Minimize window
 */
ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize();
});

/**
 * Close window
 */
ipcMain.handle('close-window', () => {
  mainWindow?.close();
});

// App lifecycle

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Disable hardware acceleration issues with transparency (optional)
// app.disableHardwareAcceleration();
