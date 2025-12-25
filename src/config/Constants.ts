/**
 * Additional game constants and calculation formulas
 * Extends GameConfig.ts with dynamic calculations
 */

/**
 * Module range constants (in pixels)
 */
export const MODULE_RANGES = {
  SHORT: 200,
  MEDIUM: 400,
  LONG: 600,
} as const;

/**
 * Built-in cannon constants
 */
export const CANNON_CONFIG = {
  FIRE_RATE: 2.5, // seconds between shots
} as const;

/**
 * Calculate XP required to reach next level
 * Formula: floor(100 * 1.15^level)
 *
 * @param level - Current player level (0-based or 1-based)
 * @returns XP required to reach the next level
 */
export function calculateXPRequired(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level));
}

/**
 * Calculate cost to upgrade a stat
 * Formula: level * 100
 *
 * @param level - Current stat level
 * @returns Gold cost for the upgrade
 */
export function calculateUpgradeCost(level: number): number {
  return level * 100;
}

/**
 * Calculate damage reduction from defense stat
 * Formula: defense / (defense + 100)
 * Returns a percentage reduction (0.0 to 1.0)
 *
 * @param defense - Defense stat value
 * @returns Damage reduction multiplier (0-1)
 */
export function calculateDefenseReduction(defense: number): number {
  return defense / (defense + 100);
}

/**
 * Calculate final damage output
 * Complete damage formula incorporating all bonuses
 *
 * GDD Formula:
 * Final = BaseDamage × SlotMultiplier(1 + slotLevel × 0.01)
 *       × StatBonuses(1 + sumOfStats)
 *       × CritMultiplier(if crit: 2.0 + critDamageBonus)
 *       × Variance(0.9 to 1.1)
 *
 * @param baseDamage - Base damage of the weapon/module
 * @param slotLevel - Level of the module slot (1-160)
 * @param statBonuses - Total damage bonus from stats (as decimal, e.g., 0.5 for +50%)
 * @param isCrit - Whether this is a critical hit
 * @param critDamageBonus - Critical damage multiplier bonus (as decimal, e.g., 1.0 for +100%, total 200%)
 * @param applyVariance - Whether to apply random variance (default true)
 * @returns Final calculated damage
 */
export function calculateDamage(
  baseDamage: number,
  slotLevel: number,
  statBonuses: number,
  isCrit: boolean,
  critDamageBonus: number,
  applyVariance: boolean = true
): number {
  // Base damage with slot level scaling (GDD: 1 + slotLevel * 0.01)
  let damage = baseDamage * (1 + slotLevel * 0.01);

  // Apply stat bonuses
  damage *= (1 + statBonuses);

  // Apply critical hit multiplier if applicable
  if (isCrit) {
    // Base crit is 2x (200%), plus any bonus crit damage
    const critMultiplier = 2.0 + critDamageBonus;
    damage *= critMultiplier;
  }

  // Apply damage variance (±10%)
  if (applyVariance) {
    const variance = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    damage *= variance;
  }

  return Math.floor(damage);
}
