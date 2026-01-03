/**
 * Electron API type declarations
 * Available when running in Electron environment via window.electronAPI
 */

export interface ElectronAPI {
  isElectron: boolean;
  setAlwaysOnTop: (enabled: boolean) => Promise<boolean>;
  setClickThrough: (enabled: boolean) => Promise<boolean>;
  getWindowState: () => Promise<{ alwaysOnTop: boolean; clickThroughEnabled: boolean }>;
  setWindowPosition: (x: number, y: number) => Promise<boolean>;
  getWindowPosition: () => Promise<{ x: number; y: number }>;
  minimizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
