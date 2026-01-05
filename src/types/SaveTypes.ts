/**
 * Save system types and interfaces
 * Defines the structure for game save data
 *
 * Phase 2: GameState Implementation
 */

import { TankStats } from './GameTypes';
import { ModuleSlotData, ModuleItemData } from './ModuleTypes';

/**
 * Complete save data structure
 * Represents the entire serializable game state
 */
export interface SaveData {
  /** Save format version for migration support */
  version: string;
  /** Unix timestamp when save was created */
  timestamp: number;

  /** Tank progression and stats */
  tank: {
    /** Current tank level (1-160) */
    level: number;
    /** Current experience points */
    xp: number;
    /** Base tank statistics */
    stats: TankStats;
    /** Levels invested in each stat (by StatType string key) */
    statLevels: Record<string, number>;
  };

  /** Module equipment and inventory */
  modules: {
    /** All 5 module slots with their data */
    slots: ModuleSlotData[];
    /** Unequipped modules in inventory */
    inventory: ModuleItemData[];
    /** Quick reference to equipped modules (null for empty slots) */
    equipped: (ModuleItemData | null)[];
  };

  /** Progression through game content */
  progression: {
    /** Current Act (1-8) */
    currentAct: number;
    /** Current Zone within act */
    currentZone: number;
    /** Current Wave within zone */
    currentWave: number;
    /** Highest Act ever reached (for zone selection) - optional for backwards compat */
    highestAct?: number;
    /** Highest Zone in highest act ever reached - optional for backwards compat */
    highestZone?: number;
    /** IDs of defeated bosses */
    bossesDefeated: string[];
    /** IDs of defeated uber bosses */
    ubersDefeated: string[];
  };

  /** Economy and currencies */
  economy: {
    /** Current gold amount */
    gold: number;
    /** Essence amounts by type (string key) */
    essences: Record<string, number>;
    /** Infernal cores (premium currency) */
    infernalCores: number;
  };

  /** Paragon system (prestige) */
  paragon: {
    /** Total number of times player has prestiged */
    timesPrestiged: number;
    /** Paragon points invested by category (string key) */
    points: Record<string, number>;
  };
}
