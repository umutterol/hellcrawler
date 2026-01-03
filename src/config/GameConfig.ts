import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';

/**
 * Core game configuration constants
 * Based on GDD specifications
 */
export const GAME_CONFIG = {
  // Display - Desktop Heroes style (short strip at bottom of screen)
  WIDTH: 1920,
  HEIGHT: 350,
  GROUND_HEIGHT: 60, // Height of ground area from bottom
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

  // Depth layers for rendering order (higher = on top)
  DEPTH: {
    BACKGROUND: 0,
    PARALLAX_FAR: 10,
    PARALLAX_MID: 20,
    PARALLAX_NEAR: 30,
    GROUND: 50,
    LOOT: 100,
    ENEMIES: 200,
    TANK: 300,
    PROJECTILES: 400,
    EFFECTS: 500,
    DAMAGE_NUMBERS: 600,
    UI_WORLD: 700,        // World-space UI (health bars, etc.)
    UI_OVERLAY: 800,      // Screen-space UI
    PANELS: 900,
    DEBUG: 1000,
  },

  // Effect timing constants (in milliseconds)
  EFFECT_TIMING: {
    // Damage numbers
    DAMAGE_NUMBER_POP_DURATION: 150,      // Initial pop-in scale
    DAMAGE_NUMBER_FLOAT_DURATION: 800,    // Float up and fade
    DAMAGE_NUMBER_FLOAT_DISTANCE: 60,     // Pixels to float up
    DAMAGE_NUMBER_RANDOM_OFFSET_X: 20,    // Random horizontal spread

    // Hit effects
    HIT_FLASH_DURATION: 100,              // White flash on hit
    HIT_SHAKE_DURATION: 50,               // Micro-shake on hit

    // Death effects
    DEATH_FLASH_DURATION: 150,            // Flash before fade
    DEATH_FADE_DURATION: 300,             // Fade out after flash

    // Crit effects
    CRIT_SCALE_PEAK: 1.5,                 // Max scale for crit pop
    CRIT_SCALE_SETTLE: 1.2,               // Final scale for crit

    // General
    SCREEN_SHAKE_DURATION: 100,
    BOSS_INTRO_DURATION: 1500,
  },
} as const;

/**
 * Balance constants for enemy scaling, drops, and progression
 * Based on BalanceGuide.md - Desktop Heroes patterns
 */
export const BALANCE = {
  // ============================================
  // BASE ENEMY STATS (Act 1, Zone 1, Wave 1)
  // ============================================

  // Fodder base stats
  ENEMY_BASE: {
    imp: { hp: 50, damage: 5, speed: 80, xp: 5, gold: 2 },
    hellhound: { hp: 40, damage: 8, speed: 120, xp: 7, gold: 3 },
    possessedSoldier: { hp: 60, damage: 10, speed: 60, xp: 8, gold: 4 },
    fireSkull: { hp: 300, damage: 15, speed: 50, xp: 35, gold: 25 }, // Elite
  },

  // Super Elite / Boss base stats
  SUPER_ELITE_BASE: {
    hp: 1500,
    damage: 25,
    speed: 60,
    xp: 150,
    gold: 300,
  },

  BOSS_BASE: {
    hp: 10000,
    damage: 40,
    xp: 500,
    gold: 5000,
  },

  // ============================================
  // SCALING MULTIPLIERS
  // ============================================

  // Per-act scaling (exponential growth)
  ACT_SCALE: {
    HP: 1.8,       // Enemy HP multiplies by 1.8^(act-1)
    DAMAGE: 1.4,   // Enemy damage multiplies by 1.4^(act-1)
    GOLD: 1.6,     // Gold reward multiplies by 1.6^(act-1)
    XP: 1.5,       // XP reward multiplies by 1.5^(act-1)
  },

  // Per-zone scaling (zone 2 is harder)
  ZONE_SCALE: {
    1: 1.0,   // First zone of act
    2: 1.25,  // Second zone (boss zone) +25%
  } as Record<number, number>,

  // Per-wave scaling (gradual increase within zone)
  WAVE_SCALE_PER_WAVE: 0.05, // +5% per wave (wave 1 = 1.0, wave 6 = 1.25)

  // ============================================
  // DROP RATES
  // ============================================

  MODULE_DROP_CHANCE: {
    fodder: 0.01,       // 1% base
    elite: 0.05,        // 5% base (effectively 2x because elite is special)
    superElite: 1.0,    // 100% guaranteed
    boss: 1.0,          // 100% guaranteed
  },

  // Level bonus to drop chance: +0.1% per 10 levels
  DROP_LEVEL_BONUS_PER_10: 0.001,
  DROP_CHANCE_CAP: 0.25, // Max 25% for fodder/elite

  // Elite drop multiplier (for rarity rolls, not just drop chance)
  ELITE_RARITY_BOOST: 1.5, // 50% better rarity rolls

  // Rarity distribution (cumulative, rolled as percentage)
  RARITY_THRESHOLDS: {
    // Base rates at level 1
    legendary: 0.05,  // 0.05%
    epic: 0.5,        // 0.5%
    rare: 3.0,        // 3%
    uncommon: 10.0,   // 10%
  },

  // Rarity scaling per 10 levels
  RARITY_LEVEL_SCALE: {
    legendary: 0.05,  // +0.05% per 10 levels
    epic: 0.2,        // +0.2% per 10 levels
    rare: 0.5,        // +0.5% per 10 levels
    uncommon: 1.0,    // +1% per 10 levels
  },

  // Boss guaranteed minimum rarity
  BOSS_MIN_RARITY: 'rare' as const,

  // ============================================
  // SLOT & MODULE SCALING (Desktop Heroes pattern: meaningful per-level growth)
  // ============================================

  // Slot stat scaling per level - these are MULTIPLIERS not tiny percentages
  // At level 50: damage = 1 + 50*0.05 = 3.5x, speed = 1 + 50*0.03 = 2.5x
  // This matches enemy scaling roughly (enemies get 1.8x HP per act)
  SLOT_DAMAGE_PER_LEVEL: 0.05,    // +5% damage per slot damage level
  SLOT_SPEED_PER_LEVEL: 0.03,     // +3% attack speed per slot speed level
  SLOT_CDR_PER_LEVEL: 0.02,       // +2% CDR per slot CDR level
  SLOT_CDR_CAP: 0.75,             // Max 75% CDR (don't want 0 cooldowns)

  // ============================================
  // TANK STAT SCALING (per upgrade level)
  // ============================================

  // Tank stat bonuses per level
  TANK_MAX_HP_BASE: 200,          // Base tank HP
  TANK_MAX_HP_PER_LEVEL: 25,      // +25 HP per Vitality level
  TANK_DEFENSE_PER_LEVEL: 1.0,    // +1 defense per Barrier level
  TANK_REGEN_PER_LEVEL: 1.0,      // +1 HP/s per Regen level

  // ============================================
  // BUILT-IN CANNON
  // ============================================

  CANNON_BASE_DAMAGE: 80,
  CANNON_DAMAGE_PER_LEVEL: 5,
  CANNON_FIRE_RATE: 2500, // ms

  // ============================================
  // MILESTONE REWARDS
  // ============================================

  MILESTONE_LEVELS: {
    INVENTORY_SLOT: 5,    // +1 inventory slot every 5 levels
    FREE_MODULE: 25,      // Free random module every 25 levels
    STAT_POINT: 10,       // +1 free stat point every 10 levels
  },
} as const;

/**
 * Calculate act multiplier for a given stat
 */
export function getActMultiplier(act: number, stat: 'hp' | 'damage' | 'gold' | 'xp'): number {
  const scale = {
    hp: BALANCE.ACT_SCALE.HP,
    damage: BALANCE.ACT_SCALE.DAMAGE,
    gold: BALANCE.ACT_SCALE.GOLD,
    xp: BALANCE.ACT_SCALE.XP,
  };
  return Math.pow(scale[stat], act - 1);
}

/**
 * Calculate zone multiplier
 */
export function getZoneMultiplier(zone: number): number {
  return BALANCE.ZONE_SCALE[zone] || 1.0;
}

/**
 * Calculate wave multiplier
 */
export function getWaveMultiplier(wave: number): number {
  return 1 + (wave - 1) * BALANCE.WAVE_SCALE_PER_WAVE;
}

/**
 * Calculate total enemy stat multiplier for a given act/zone/wave
 */
export function getEnemyStatMultiplier(
  act: number,
  zone: number,
  wave: number,
  stat: 'hp' | 'damage' | 'gold' | 'xp'
): number {
  return getActMultiplier(act, stat) * getZoneMultiplier(zone) * getWaveMultiplier(wave);
}

/**
 * Check if running in Electron environment
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}

/**
 * Create Phaser game configuration
 * Adjusts settings based on Electron vs web environment
 */
export function createPhaserConfig(transparent: boolean = false): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: transparent ? 0x00000000 : 0x1a1a2e,
    transparent: transparent,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
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
}

/**
 * Phaser game configuration (default - for non-Electron or backwards compatibility)
 */
export const phaserConfig: Phaser.Types.Core.GameConfig = createPhaserConfig(false);
