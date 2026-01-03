/**
 * SettingsManager - Manages game settings with localStorage persistence
 *
 * Handles:
 * - Display settings (health bars, damage numbers, etc.)
 * - Gameplay settings (auto-collect, confirm sells, etc.)
 * - Audio settings (master, music, SFX volumes)
 *
 * Settings are stored independently from game save data in localStorage.
 */

import { EventManager, getEventManager } from './EventManager';
import { GameEvents } from '../types/GameEvents';

/**
 * Game settings interface
 */
export interface GameSettings {
  // Display settings
  showHealthBars: boolean;
  showDamageNumbers: boolean;
  showEnemyHPText: boolean;

  // Gameplay settings
  autoCollectLoot: boolean;
  confirmRareSells: boolean;
  showTooltips: boolean;

  // Audio settings (0-100)
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;

  // Desktop Mode settings (Electron only)
  alwaysOnTop: boolean;
  clickThroughEnabled: boolean;

  // Background Layer visibility
  showSkyLayer: boolean; // bg-sky + bg-clouds
  showMountainsLayer: boolean; // bg-mountains + bg-mountains-lights
  showFarBuildingsLayer: boolean; // bg-far-buildings
  showForegroundLayer: boolean; // bg-forest + bg-town
}

/**
 * Default settings values
 */
const DEFAULT_SETTINGS: GameSettings = {
  // Display - all on by default
  showHealthBars: true,
  showDamageNumbers: true,
  showEnemyHPText: true,

  // Gameplay - sensible defaults
  autoCollectLoot: true,
  confirmRareSells: true,
  showTooltips: true,

  // Audio - reasonable defaults
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,

  // Desktop Mode - enabled by default
  alwaysOnTop: true,
  clickThroughEnabled: true,

  // Background Layers - all visible by default
  showSkyLayer: true,
  showMountainsLayer: true,
  showFarBuildingsLayer: true,
  showForegroundLayer: true,
};

const SETTINGS_STORAGE_KEY = 'hellcrawler_settings';

/**
 * Singleton SettingsManager
 */
export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private settings: GameSettings;
  private eventManager: EventManager;

  private constructor() {
    this.eventManager = getEventManager();
    this.settings = this.loadSettings();

    if (import.meta.env.DEV) {
      console.log('[SettingsManager] Initialized with settings:', this.settings);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  public static resetInstance(): void {
    SettingsManager.instance = null;
  }

  /**
   * Load settings from localStorage or return defaults
   */
  private loadSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings added in updates
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[SettingsManager] Failed to load settings:', error);
      }
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      if (import.meta.env.DEV) {
        console.log('[SettingsManager] Settings saved');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[SettingsManager] Failed to save settings:', error);
      }
    }
  }

  /**
   * Get all settings
   */
  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  /**
   * Get a specific setting value
   */
  public getSetting<K extends keyof GameSettings>(key: K): GameSettings[K] {
    return this.settings[key];
  }

  /**
   * Set a specific setting value
   */
  public setSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    const oldValue = this.settings[key];
    if (oldValue === value) return;

    this.settings[key] = value;
    this.saveSettings();

    // Emit event for listeners
    this.eventManager.emit(GameEvents.SETTINGS_CHANGED, {
      key,
      oldValue,
      newValue: value,
    });

    if (import.meta.env.DEV) {
      console.log(`[SettingsManager] Setting changed: ${key} = ${value}`);
    }
  }

  /**
   * Toggle a boolean setting
   */
  public toggleSetting(key: keyof GameSettings): boolean {
    const currentValue = this.settings[key];
    if (typeof currentValue !== 'boolean') {
      if (import.meta.env.DEV) {
        console.warn(`[SettingsManager] Cannot toggle non-boolean setting: ${key}`);
      }
      return false;
    }

    this.setSetting(key, !currentValue as GameSettings[typeof key]);
    return !currentValue;
  }

  /**
   * Reset all settings to defaults
   */
  public resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();

    this.eventManager.emit(GameEvents.SETTINGS_CHANGED, {
      key: 'all',
      oldValue: null,
      newValue: this.settings,
    });

    if (import.meta.env.DEV) {
      console.log('[SettingsManager] Settings reset to defaults');
    }
  }

  // Convenience getters for common checks

  public get showHealthBars(): boolean {
    return this.settings.showHealthBars;
  }

  public get showDamageNumbers(): boolean {
    return this.settings.showDamageNumbers;
  }

  public get showEnemyHPText(): boolean {
    return this.settings.showEnemyHPText;
  }

  public get autoCollectLoot(): boolean {
    return this.settings.autoCollectLoot;
  }

  public get confirmRareSells(): boolean {
    return this.settings.confirmRareSells;
  }

  public get showTooltips(): boolean {
    return this.settings.showTooltips;
  }

  public get masterVolume(): number {
    return this.settings.masterVolume;
  }

  public get musicVolume(): number {
    return this.settings.musicVolume;
  }

  public get sfxVolume(): number {
    return this.settings.sfxVolume;
  }

  // Desktop Mode getters

  public get alwaysOnTop(): boolean {
    return this.settings.alwaysOnTop;
  }

  public get clickThroughEnabled(): boolean {
    return this.settings.clickThroughEnabled;
  }

  // Background Layer getters

  public get showSkyLayer(): boolean {
    return this.settings.showSkyLayer;
  }

  public get showMountainsLayer(): boolean {
    return this.settings.showMountainsLayer;
  }

  public get showFarBuildingsLayer(): boolean {
    return this.settings.showFarBuildingsLayer;
  }

  public get showForegroundLayer(): boolean {
    return this.settings.showForegroundLayer;
  }

  /**
   * Check if running in Electron environment
   */
  public isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
  }

  /**
   * Apply always-on-top setting to Electron window
   */
  public async applyAlwaysOnTop(): Promise<void> {
    if (this.isElectron()) {
      await window.electronAPI?.setAlwaysOnTop(this.settings.alwaysOnTop);
    }
  }

  /**
   * Apply click-through setting to Electron window
   */
  public async applyClickThrough(enabled?: boolean): Promise<void> {
    if (this.isElectron()) {
      const value = enabled ?? this.settings.clickThroughEnabled;
      await window.electronAPI?.setClickThrough(value);
    }
  }

  /**
   * Get effective music volume (master * music)
   */
  public getEffectiveMusicVolume(): number {
    return (this.settings.masterVolume / 100) * (this.settings.musicVolume / 100);
  }

  /**
   * Get effective SFX volume (master * sfx)
   */
  public getEffectiveSFXVolume(): number {
    return (this.settings.masterVolume / 100) * (this.settings.sfxVolume / 100);
  }
}

/**
 * Get singleton instance (convenience function)
 */
export function getSettingsManager(): SettingsManager {
  return SettingsManager.getInstance();
}
