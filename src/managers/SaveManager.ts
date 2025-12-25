/**
 * SaveManager - Handles game save/load operations
 *
 * Features:
 * - Auto-save on zone completion
 * - Manual save/load via UI
 * - localStorage for web (Electron file system in future)
 * - Save versioning for migration support
 */

import { GameState, getGameState } from '../state/GameState';
import { SaveData } from '../types/SaveTypes';
import { EventManager, getEventManager } from './EventManager';
import { GameEvents } from '../types/GameEvents';

const SAVE_KEY = 'hellcrawler_save';
const SAVE_VERSION = '1.0.0';

export class SaveManager {
  private static instance: SaveManager | null = null;
  private gameState: GameState;
  private eventManager: EventManager;

  private constructor() {
    this.gameState = getGameState();
    this.eventManager = getEventManager();

    // Subscribe to auto-save triggers
    this.setupAutoSave();
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
   * Setup auto-save triggers
   */
  private setupAutoSave(): void {
    // Auto-save on zone completion
    this.eventManager.on(GameEvents.ZONE_COMPLETED, () => {
      this.save();
      if (import.meta.env.DEV) {
        console.log('[SaveManager] Auto-saved on zone completion');
      }
    });

    // Auto-save on boss defeat
    this.eventManager.on(GameEvents.BOSS_DEFEATED, () => {
      this.save();
      if (import.meta.env.DEV) {
        console.log('[SaveManager] Auto-saved on boss defeat');
      }
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
        totalPlayTime: 0, // TODO: Track play time
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

      // Version check (for future migration support)
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
   * Migrate save data to current version
   * Returns true if migration was successful
   */
  private migrateSave(saveData: SaveData): boolean {
    // For now, no migrations needed
    // Future: Add migration logic for breaking changes
    if (import.meta.env.DEV) {
      console.log(`[SaveManager] Migrating save from ${saveData.version} to ${SAVE_VERSION}`);
    }

    saveData.version = SAVE_VERSION;
    return true;
  }

  /**
   * Export save as a string (for backup/sharing)
   */
  public exportSave(): string | null {
    try {
      const saveString = localStorage.getItem(SAVE_KEY);
      if (!saveString) return null;

      // Encode to base64 for easier copying
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
      // Decode from base64
      const saveString = atob(encodedSave);
      const saveData = JSON.parse(saveString) as SaveData;

      // Validate structure
      if (!saveData.version || !saveData.tank || !saveData.progression) {
        console.error('[SaveManager] Invalid save data structure');
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
