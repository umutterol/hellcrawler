/**
 * Module system types and interfaces
 * Defines all module-related data structures
 */

import { Rarity, StatType } from './GameTypes';

/**
 * All available module types in the game
 * Each module has unique behavior and stats
 */
export enum ModuleType {
  /** Rapid-fire projectile weapon */
  MachineGun = 'machineGun',
  /** Launches homing missiles */
  MissilePod = 'missilePod',
  /** Passive healing over time */
  RepairDrone = 'repairDrone',
  /** Temporary damage absorption */
  ShieldGenerator = 'shieldGenerator',
  /** Continuous beam weapon */
  LaserCutter = 'laserCutter',
  /** Chain lightning attacks */
  TeslaCoil = 'teslaCoil',
  /** Close-range area damage */
  Flamethrower = 'flamethrower',
  /** Disables enemy abilities */
  EMPEmitter = 'empEmitter',
  /** Explosive long-range attacks */
  Mortar = 'mortar',
  /** Built-in basic cannon */
  MainCannon = 'mainCannon',
}

/**
 * Individual stat modifier on a module
 */
export interface ModuleStat {
  /** Type of stat being modified */
  type: StatType;
  /** Numerical value of the stat */
  value: number;
}

/**
 * Active skill/ability on a module
 */
export interface ModuleSkill {
  /** Skill name */
  name: string;
  /** Cooldown in seconds */
  cooldown: number;
  /** Duration in seconds (0 for instant effects) */
  duration: number;
  /** Human-readable skill description */
  description: string;
}

/**
 * Complete data for a module item
 * Represents a module in inventory or equipped
 */
export interface ModuleItemData {
  /** Unique identifier for this specific module instance */
  id: string;
  /** Type of module */
  type: ModuleType;
  /** Rarity tier */
  rarity: Rarity;
  /** Array of stat modifiers */
  stats: ModuleStat[];
  /** Array of active skills (optional) */
  skills: ModuleSkill[];
}

/**
 * Per-slot stat types for upgrades
 */
export enum SlotStatType {
  Damage = 'damage',
  AttackSpeed = 'attackSpeed',
  CDR = 'cdr',
}

/**
 * Per-slot upgrade stats
 * Each stat provides +1% bonus per level
 */
export interface SlotStats {
  /** Damage bonus level (+1% per level) */
  damageLevel: number;
  /** Attack speed bonus level (+1% per level) */
  attackSpeedLevel: number;
  /** Cooldown reduction bonus level (+1% per level) */
  cdrLevel: number;
}

/**
 * Data for a single module slot on the tank
 */
export interface ModuleSlotData {
  /** Slot index (0-4) */
  index: number;
  /** Per-slot upgrade stats */
  stats: SlotStats;
  /** Currently equipped module (null if empty) */
  equipped: ModuleItemData | null;
  /** Whether this slot is unlocked */
  unlocked: boolean;
}
