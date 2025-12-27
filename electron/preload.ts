import { contextBridge, ipcRenderer } from 'electron';

/**
 * Electron API exposed to renderer process
 * Accessible via window.electronAPI
 */
const electronAPI = {
  // Flag to detect Electron environment
  isElectron: true,

  // Always on top control
  setAlwaysOnTop: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('set-always-on-top', enabled),

  // Click-through control for transparent areas
  setClickThrough: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('set-click-through', enabled),

  // Get current window state
  getWindowState: (): Promise<{ alwaysOnTop: boolean; clickThroughEnabled: boolean }> =>
    ipcRenderer.invoke('get-window-state'),

  // Window position control (for frameless window dragging)
  setWindowPosition: (x: number, y: number): Promise<boolean> =>
    ipcRenderer.invoke('set-window-position', x, y),

  getWindowPosition: (): Promise<{ x: number; y: number }> =>
    ipcRenderer.invoke('get-window-position'),

  // Window controls
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('minimize-window'),

  closeWindow: (): Promise<void> => ipcRenderer.invoke('close-window'),
};

// Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript declaration for the exposed API
export type ElectronAPI = typeof electronAPI;
