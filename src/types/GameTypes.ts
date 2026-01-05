/**
 * Core game types and interfaces
 * Defines fundamental game structures used across the system
 */

/**
 * Tank base statistics
 */
export interface TankStats {
  /** Maximum hit points */
  maxHP: number;
  /** Current hit points */
  currentHP: number;
  /** Defense stat - reduces incoming damage */
  defense: number;
  /** HP regeneration per second */
  hpRegen: number;
}

/**
 * Tank progression and leveling data
 */
export interface TankProgression {
  /** Current tank level (1-160) */
  level: number;
  /** Current experience points */
  xp: number;
  /** Experience points required for next level */
  xpToNext: number;
  /** Levels invested in each stat type (by StatType enum) */
  statLevels: Map<StatType, number>;
}

/**
 * Item rarity tiers
 * Determines stat count and value ranges for modules
 */
export enum Rarity {
  Common = 'common', // Basic starter modules (no stats)
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
}

/**
 * Tank-specific stats that can be upgraded with gold
 * These are separate from module stats
 */
export enum TankStatType {
  /** +25 Max HP per level */
  MaxHP = 'maxHP',
  /** +1 Defense per level */
  Defense = 'defense',
  /** +1 HP/s Regen per level */
  HPRegen = 'hpRegen',
}

/**
 * All possible stat types in the game
 * Used for module stats and tank progression
 */
export enum StatType {
  /** Increases base damage output */
  Damage = 'damage',
  /** Increases attack/fire rate */
  AttackSpeed = 'attackSpeed',
  /** Chance to land a critical hit (percentage) */
  CritChance = 'critChance',
  /** Multiplier for critical hit damage */
  CritDamage = 'critDamage',
  /** Cooldown reduction for skills (percentage) */
  CDR = 'cdr',
  /** Area of effect size increase */
  AoE = 'aoe',
  /** Life steal percentage */
  Lifesteal = 'lifesteal',
  /** Chance to attack multiple times */
  Multistrike = 'multistrike',
  /** Attack range increase */
  Range = 'range',
  /** Gold drop rate multiplier */
  GoldFind = 'goldFind',
  /** Experience gain multiplier */
  XPBonus = 'xpBonus',
}
