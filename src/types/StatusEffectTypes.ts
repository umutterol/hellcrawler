/**
 * Status Effect Types
 *
 * Defines all status effect types, configurations, and active effect state.
 * Adapted from DH's status effect system for Hellcrawler's stationary tank model.
 */

export enum StatusEffectType {
  Poison = 'poison',
  Burning = 'burning',
  Shock = 'shock',
  Slow = 'slow',
  ShieldBreak = 'shield_break',
  Disarm = 'disarm',
}

/**
 * Configuration for a status effect type.
 * Defines timing, stacking, and visual properties.
 */
export interface StatusEffectConfig {
  type: StatusEffectType;
  /** Total duration in ms */
  duration: number;
  /** Time between ticks in ms (0 = no tick, instant effect) */
  tickRate: number;
  /** Maximum number of stacks */
  maxStacks: number;
  /** Tint color for visual feedback (applied to sprite) */
  tintColor: number;
}

/**
 * An active status effect on an entity.
 */
export interface ActiveStatusEffect {
  type: StatusEffectType;
  stacks: number;
  startTime: number;
  lastTickTime: number;
  remainingDuration: number;
}

/**
 * Status effect applied by a projectile or module.
 */
export interface StatusEffectSource {
  type: StatusEffectType;
  /** Chance to apply (0-1) */
  chance: number;
  /** Override duration (ms), if not set uses default */
  duration?: number;
  /** Override stacks to apply */
  stacks?: number;
}
