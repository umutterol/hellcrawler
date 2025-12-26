import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';

/**
 * Core game configuration constants
 * Based on GDD specifications
 */
export const GAME_CONFIG = {
  // Display
  WIDTH: 1920,
  HEIGHT: 1080,
  FPS: 60,

  // Combat
  BASE_CRIT_MULTIPLIER: 2.0,
  DAMAGE_VARIANCE: 0.1,
  NEAR_DEATH_ATTACK_SPEED_MULTIPLIER: 0.5,
  NEAR_DEATH_REVIVE_TIME: 60,

  // Progression
  MAX_TANK_LEVEL: 160,
  XP_BASE: 100,
  XP_EXPONENT: 1.15,

  // Economy
  SLOT_COSTS: [0, 10_000, 50_000, 500_000, 2_000_000],
  STAT_UPGRADE_BASE_COST: 100,

  // Modules
  RARITY_STAT_COUNTS: {
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
  },
  RARITY_STAT_RANGES: {
    uncommon: [1, 5] as const,
    rare: [3, 8] as const,
    epic: [5, 12] as const,
    legendary: [8, 15] as const,
  },

  // Waves
  WAVES_PER_ZONE: 7,
  ZONES_PER_ACT: 2,
  TOTAL_ACTS: 8,
  WAVE_PAUSE_DURATION: 2000,

  // Performance limits
  MAX_ENEMIES_ON_SCREEN: 30,
  MAX_PROJECTILES_ON_SCREEN: 100,

  // Pool sizes
  POOL_SIZES: {
    ENEMIES_PER_TYPE: 50,
    PROJECTILES: 200,
    DAMAGE_NUMBERS: 100,
    LOOT_DROPS: 30,
  },

  // Module slot firing positions (offset from tank position)
  // Each slot has a specific mount point on the tank
  // Format: { x: horizontal offset, y: vertical offset from tank.y }
  // Positive X = forward (right), Negative Y = up
  MODULE_SLOT_POSITIONS: [
    { x: 60, y: -70 },   // Slot 0: Top front turret
    { x: 45, y: -45 },   // Slot 1: Upper mid turret
    { x: 30, y: -25 },   // Slot 2: Lower mid turret
    { x: 50, y: -60 },   // Slot 3: Top rear turret
    { x: 35, y: -35 },   // Slot 4: Lower rear turret
  ] as const,
} as const;

/**
 * Phaser game configuration
 */
export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [BootScene, GameScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
};
