import Phaser from 'phaser';
import { phaserConfig } from './config/GameConfig';

/**
 * Hellcrawler - 16-bit pixel art idle RPG auto-battler
 * Entry point
 */
const game = new Phaser.Game(phaserConfig);

// Expose game instance for debugging in development
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}

export { game };
