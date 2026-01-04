/**
 * Gore System Configuration
 * Constants for pool sizes, physics, timing, and spawn parameters
 */

import { GoreIntensity } from './GoreTypes';

/**
 * Object pool sizes
 */
export const GORE_POOL_SIZES = {
  /** Maximum gibs in pool (30 enemies × 5 gibs) */
  GIBS: 150,
  /** Maximum blood particles in pool (30 enemies × 10 particles) */
  BLOOD_PARTICLES: 300,
  /** Maximum ground splatters (persist longer, fewer created) */
  SPLATTERS: 50,
} as const;

/**
 * Physics constants for fake ragdoll
 */
export const GORE_PHYSICS = {
  /** Gravity acceleration in pixels per second squared */
  GRAVITY: 800,
  /** Ground Y position (where gibs settle) - must be within viewport (game height is 350) */
  GROUND_Y: 320,
  /** Velocity dampening on bounce (0-1, lower = more energy loss) */
  BOUNCE_DAMPING: 0.4,
  /** Minimum velocity to trigger bounce (below this, gib settles) */
  MIN_BOUNCE_VELOCITY: 50,
  /** Maximum bounces before settling */
  MAX_BOUNCES: 2,
  /** Angular velocity dampening on bounce */
  ANGULAR_DAMPING: 0.6,
} as const;

/**
 * Gib spawn velocities
 */
export const GIB_VELOCITY = {
  /** Minimum horizontal velocity (can be negative for left) */
  MIN_X: -150,
  /** Maximum horizontal velocity */
  MAX_X: 150,
  /** Minimum upward velocity (negative = up) */
  MIN_Y: -350,
  /** Maximum upward velocity */
  MAX_Y: -150,
  /** Minimum angular velocity in degrees per second */
  MIN_ANGULAR: -360,
  /** Maximum angular velocity */
  MAX_ANGULAR: 360,
} as const;

/**
 * Blood particle spawn velocities
 */
export const BLOOD_VELOCITY = {
  /** Minimum horizontal velocity */
  MIN_X: -100,
  /** Maximum horizontal velocity */
  MAX_X: 100,
  /** Minimum upward velocity */
  MIN_Y: -250,
  /** Maximum upward velocity */
  MAX_Y: -100,
} as const;

/**
 * Visual timing constants
 */
export const GORE_TIMING = {
  /** Duration of initial white flash on death (ms) */
  DEATH_FLASH_DURATION: 100,
  /** Duration of gib fade out after settling (ms) */
  GIB_FADE_DURATION: 500,
  /** How long gibs persist after settling before fading (ms) */
  GIB_PERSIST_DURATION: 1500,
  /** Total gib lifetime (flight + settle + persist + fade) */
  GIB_TOTAL_LIFETIME: 3000,
  /** How long ground splatters persist (ms) */
  SPLATTER_PERSIST_DURATION: 5000,
  /** Duration of splatter fade out (ms) */
  SPLATTER_FADE_DURATION: 1000,
  /** Blood particle lifetime (ms) */
  BLOOD_PARTICLE_LIFETIME: 800,
} as const;

/**
 * Spawn counts by intensity and enemy type
 */
export const GORE_SPAWN_COUNTS = {
  [GoreIntensity.Off]: {
    gibs: { normal: 0, boss: 0 },
    blood: { normal: 0, boss: 0 },
    splatters: { normal: 0, boss: 0 },
  },
  [GoreIntensity.Low]: {
    gibs: { normal: 2, boss: 4 },
    blood: { normal: 4, boss: 8 },
    splatters: { normal: 1, boss: 2 },
  },
  [GoreIntensity.High]: {
    gibs: { normal: 5, boss: 10 },
    blood: { normal: 12, boss: 25 },
    splatters: { normal: 2, boss: 4 },
  },
} as const;

/**
 * Gib scale ranges (relative to enemy scale)
 */
export const GIB_SCALE = {
  /** Minimum scale multiplier */
  MIN: 0.3,
  /** Maximum scale multiplier */
  MAX: 0.6,
  /** Boss scale multiplier bonus */
  BOSS_BONUS: 0.2,
} as const;

/**
 * Blood particle visual settings
 */
export const BLOOD_PARTICLE = {
  /** Base color for blood */
  COLOR: 0x8b0000, // Dark red
  /** Particle width */
  WIDTH: 4,
  /** Particle height */
  HEIGHT: 6,
  /** Minimum scale */
  MIN_SCALE: 0.5,
  /** Maximum scale */
  MAX_SCALE: 1.5,
  /** Chance to create ground splatter when hitting ground (0-1) */
  SPLATTER_CHANCE: 0.3,
} as const;

/**
 * Ground splatter visual settings
 */
export const SPLATTER = {
  /** Base alpha for splatters */
  ALPHA: 0.8,
  /** Minimum scale */
  MIN_SCALE: 0.4,
  /** Maximum scale */
  MAX_SCALE: 1.0,
  /** Random rotation enabled */
  RANDOM_ROTATION: true,
} as const;

/**
 * Depth values for gore elements
 * Must be coordinated with GAME_CONFIG.DEPTH:
 *   GROUND: 50, LOOT: 100, ENEMIES: 200, TANK: 300, PROJECTILES: 400, EFFECTS: 500
 */
export const GORE_DEPTH = {
  /** Ground splatters (on ground, below loot) */
  SPLATTER: 60,
  /** Blood particles (above enemies, below tank) */
  BLOOD: 250,
  /** Gibs (above enemies, below tank) */
  GIB: 250,
} as const;

/**
 * Default gore intensity setting
 */
export const DEFAULT_GORE_INTENSITY = GoreIntensity.High;
