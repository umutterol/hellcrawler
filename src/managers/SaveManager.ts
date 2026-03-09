/**
 * SaveManager - Handles game save/load operations
 *
 * Features:
 * - Debounced auto-save (5s) on any state change
 * - Instant save on zone completion and boss defeat
 * - Save on window close (beforeunload)
 * - Chain-based version migration
 * - localStorage for web (Electron file system in future)
 *
 * Enhanced using DH's debounced auto-save and version migration patterns.
 */

import { GameState, getGameState } from '../state/GameState';
import { SaveData } from '../types/SaveTypes';
import { EventManager, getEventManager } from './EventManager';
import { GameEvents } from '../types/GameEvents';

const SAVE_KEY = 'hellcrawler_save';
const SAVE_VERSION = '1.0.0';
const AUTO_SAVE_DEBOUNCE_MS = 5000;

/**
 * Version migration functions.
 * Each key is a version string, and the function transforms save data to the next version.
 * Chain: '0.9.0' -> '1.0.0' (example for backwards compat)
 */
const SAVE_MIGRATIONS: Record<string, (data: SaveData) => SaveData> = {
  // Example migration for future use:
  // '1.0.0': (data) => {
  //   // Add new fields for v1.1.0
  //   data.version = '1.1.0';
  //   return data;
  // },
};

export class SaveManager {
  private static instance: SaveManager | null = null;
  private gameState: GameState;
  private eventManager: EventManager;
  private autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.gameState = getGameState();
    this.eventManager = getEventManager();

    this.setupAutoSave();
    this.setupUnloadSave();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Setup all auto-save triggers
   */
  private setupAutoSave(): void {
    // Instant save on zone completion
    this.eventManager.on(GameEvents.ZONE_COMPLETED, () => {
      this.save();
      if (import.meta.env.DEV) {
        console.log('[SaveManager] Auto-saved on zone completion');
      }
    });

    // Instant save on boss defeat
    this.eventManager.on(GameEvents.BOSS_DEFEATED, () => {
      this.save();
      if (import.meta.env.DEV) {
        console.log('[SaveManager] Auto-saved on boss defeat');
      }
    });

    // Debounced save on any store change (from Phase 1 STORE_CHANGED event)
    this.eventManager.on(GameEvents.STORE_CHANGED, () => {
      this.scheduleAutoSave();
    });

    // Also debounce on key progression events
    this.eventManager.on(GameEvents.LEVEL_UP, () => {
      this.scheduleAutoSave();
    });

    this.eventManager.on(GameEvents.MODULE_EQUIPPED, () => {
      this.scheduleAutoSave();
    });

    this.eventManager.on(GameEvents.SLOT_UNLOCKED, () => {
      this.scheduleAutoSave();
    });
  }

  /**
   * Schedule a debounced auto-save.
   * Resets the timer on every call — only fires after 5s of inactivity.
   */
  private scheduleAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    this.autoSaveTimeout = setTimeout(() => {
      this.autoSaveTimeout = null;
      this.save();
      if (import.meta.env.DEV) {
        console.log('[SaveManager] Auto-saved (debounced)');
      }
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  /**
   * Save immediately on window close to prevent data loss
   */
  private setupUnloadSave(): void {
    window.addEventListener('beforeunload', () => {
      // Cancel any pending debounced save
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = null;
      }
      // Synchronous localStorage write
      this.save();
    });
  }

  /**
   * Save the current game state
   * Returns true if save was successful
   */
  public save(): boolean {
    try {
      const saveData = this.gameState.toSaveData();
      saveData.version = SAVE_VERSION;
      saveData.timestamp = Date.now();

      const saveString = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, saveString);

      this.eventManager.emit(GameEvents.GAME_SAVED, {
        timestamp: saveData.timestamp,
        tankLevel: saveData.tank.level,
        currentZone: saveData.progression.currentZone,
        currentAct: saveData.progression.currentAct,
        totalPlayTime: 0,
      });

      if (import.meta.env.DEV) {
        console.log('[SaveManager] Game saved successfully');
        console.log('[SaveManager] Save size:', (saveString.length / 1024).toFixed(2), 'KB');
      }

      return true;
    } catch (error) {
      console.error('[SaveManager] Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load the saved game state
   * Returns true if load was successful
   */
  public load(): boolean {
    try {
      const saveString = localStorage.getItem(SAVE_KEY);
      if (!saveString) {
        if (import.meta.env.DEV) {
          console.log('[SaveManager] No save data found');
        }
        return false;
      }

      const saveData = JSON.parse(saveString) as SaveData;

      // Run migration chain if version doesn't match
      if (saveData.version !== SAVE_VERSION) {
        const migrated = this.migrateSave(saveData);
        if (!migrated) {
          console.warn('[SaveManager] Save version mismatch and migration failed');
          return false;
        }
      }

      this.gameState.fromSaveData(saveData);

      if (import.meta.env.DEV) {
        console.log('[SaveManager] Game loaded successfully');
        console.log('[SaveManager] Loaded state:', {
          level: saveData.tank.level,
          act: saveData.progression.currentAct,
          zone: saveData.progression.currentZone,
          gold: saveData.economy.gold,
        });
      }

      return true;
    } catch (error) {
      console.error('[SaveManager] Failed to load game:', error);
      return false;
    }
  }

  /**
   * Check if a save exists
   */
  public hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Delete the save data
   */
  public deleteSave(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      if (import.meta.env.DEV) {
        console.log('[SaveManager] Save deleted');
      }
      return true;
    } catch (error) {
      console.error('[SaveManager] Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Get save info without loading
   */
  public getSaveInfo(): { exists: boolean; timestamp?: number; level?: number; zone?: number; act?: number } {
    try {
      const saveString = localStorage.getItem(SAVE_KEY);
      if (!saveString) {
        return { exists: false };
      }

      const saveData = JSON.parse(saveString) as SaveData;
      return {
        exists: true,
        timestamp: saveData.timestamp,
        level: saveData.tank.level,
        zone: saveData.progression.currentZone,
        act: saveData.progression.currentAct,
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Migrate save data through version chain.
   * Each migration transforms data from version N to N+1.
   * Returns true if migration was successful.
   */
  private migrateSave(saveData: SaveData): boolean {
    let currentVersion = saveData.version;
    const targetVersion = SAVE_VERSION;
    let iterations = 0;
    const maxIterations = 50; // Safety against infinite loops

    if (import.meta.env.DEV) {
      console.log(`[SaveManager] Migrating save from ${currentVersion} to ${targetVersion}`);
    }

    while (currentVersion !== targetVersion && iterations < maxIterations) {
      const migration = SAVE_MIGRATIONS[currentVersion];
      if (!migration) {
        // No explicit migration path — try accepting the save as-is
        // This handles cases where the version is unknown but compatible
        if (import.meta.env.DEV) {
          console.warn(`[SaveManager] No migration for ${currentVersion}, accepting as ${targetVersion}`);
        }
        saveData.version = targetVersion;
        return true;
      }

      const migrated = migration(saveData);
      currentVersion = migrated.version;
      iterations++;

      if (import.meta.env.DEV) {
        console.log(`[SaveManager] Migrated to ${currentVersion}`);
      }
    }

    return currentVersion === targetVersion;
  }

  /**
   * Export save as a string (for backup/sharing)
   */
  public exportSave(): string | null {
    try {
      const saveString = localStorage.getItem(SAVE_KEY);
      if (!saveString) return null;

      return btoa(saveString);
    } catch (error) {
      console.error('[SaveManager] Failed to export save:', error);
      return null;
    }
  }

  /**
   * Import save from a string
   */
  public importSave(encodedSave: string): boolean {
    try {
      const saveString = atob(encodedSave);
      const saveData = JSON.parse(saveString) as SaveData;

      // Validate structure
      if (!saveData.version || !saveData.tank || !saveData.progression) {
        console.error('[SaveManager] Invalid save data structure');
        return false;
      }

      // Validate all 4 store sections exist
      if (!saveData.economy || !saveData.modules || !saveData.paragon) {
        console.error('[SaveManager] Missing store sections in save data');
        return false;
      }

      localStorage.setItem(SAVE_KEY, saveString);
      return this.load();
    } catch (error) {
      console.error('[SaveManager] Failed to import save:', error);
      return false;
    }
  }
}

/**
 * Get SaveManager instance
 */
export function getSaveManager(): SaveManager {
  return SaveManager.getInstance();
}
