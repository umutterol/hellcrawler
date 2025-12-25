/**
 * Enemy system types and configurations
 * Defines enemy categories, types, and configurations
 */

/**
 * Enemy difficulty categories
 * Determines spawn frequency and general strength
 */
export enum EnemyCategory {
  /** Common weak enemies, spawn frequently */
  Fodder = 'fodder',
  /** Tougher enemies with special abilities */
  Elite = 'elite',
  /** Very strong enemies, rare spawns */
  SuperElite = 'superElite',
  /** End-of-zone bosses */
  Boss = 'boss',
}

/**
 * Specific enemy types for Act 1 (Hell/Demon theme)
 * Each act will have its own set of enemy types
 */
export enum EnemyType {
  // Fodder enemies
  /** Small demonic creature - basic melee */
  Imp = 'imp',
  /** Fast melee attacker */
  Hellhound = 'hellhound',
  /** Slow ranged enemy */
  PossessedSoldier = 'possessedSoldier',
  /** Flying projectile enemy */
  FireSkull = 'fireSkull',

  // Elite enemies
  /** Tanky melee with charge attack */
  Demon = 'demon',
  /** Ranged support enemy that buffs others */
  Necromancer = 'necromancer',
  /** Fast assassin-type enemy */
  ShadowFiend = 'shadowFiend',
  /** Heavy ranged damage dealer */
  InfernalWarrior = 'infernalWarrior',

  // Super Elite enemies
  /** High HP, summons other enemies */
  ArchDemon = 'archDemon',
  /** Teleporting high-damage enemy */
  VoidReaver = 'voidReaver',

  // Boss
  /** Act 1 Zone 1 boss */
  InfernalWarlord = 'infernalWarlord',
  /** Act 1 Zone 2 boss */
  LordOfFlames = 'lordOfFlames',
}

/**
 * Complete configuration for an enemy type
 * Defines all stats and rewards for a specific enemy
 */
export interface EnemyConfig {
  /** Enemy type identifier */
  type: EnemyType;
  /** Category/difficulty tier */
  category: EnemyCategory;
  /** Maximum hit points */
  hp: number;
  /** Base damage per attack */
  damage: number;
  /** Movement speed in pixels per second */
  speed: number;
  /** Experience points awarded on kill */
  xpReward: number;
  /** Gold awarded on kill */
  goldReward: number;
}
