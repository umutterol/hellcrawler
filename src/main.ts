import Phaser from 'phaser';
import { createPhaserConfig, isElectronEnvironment } from './config/GameConfig';

/**
 * Hellcrawler - 16-bit pixel art idle RPG auto-battler
 * Entry point
 */

// Detect Electron environment and enable transparency
const isElectron = isElectronEnvironment();

if (isElectron) {
  // Add transparent class to body for CSS styling
  document.body.classList.add('electron-transparent');

  if (import.meta.env.DEV) {
    console.log('[Main] Running in Electron - transparent mode enabled');
  }
}

// Create game with appropriate configuration
const config = createPhaserConfig(isElectron);
const game = new Phaser.Game(config);

// Expose game instance for debugging in development
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}

export { game };
