/**
 * ProgressionStore - Manages game progression through acts, zones, and waves
 *
 * Extracted from monolithic GameState. Handles:
 * - Act/Zone/Wave tracking
 * - Highest progress tracking
 * - Boss and uber boss defeat tracking
 * - Zone selection and unlocking
 * - Paragon/prestige system
 */

import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';
import { BaseStore } from './BaseStore';

export interface ProgressionStoreData {
  currentAct: number;
  currentZone: number;
  currentWave: number;
  highestAct?: number;
  highestZone?: number;
  bossesDefeated: string[];
  ubersDefeated: string[];
}

export interface ParagonStoreData {
  timesPrestiged: number;
  points: Record<string, number>;
}

export class ProgressionStore extends BaseStore<ProgressionStoreData> {
  private static instance: ProgressionStore | null = null;

  private currentAct: number;
  private currentZone: number;
  private currentWave: number;
  private highestAct: number;
  private highestZone: number;
  private bossesDefeated: Set<string>;
  private ubersDefeated: Set<string>;

  // Paragon state
  private timesPrestiged: number;
  private paragonPoints: Map<string, number>;

  private constructor() {
    super('progression');
    const defaults = ProgressionStore.getDefaults();
    this.currentAct = defaults.currentAct;
    this.currentZone = defaults.currentZone;
    this.currentWave = defaults.currentWave;
    this.highestAct = defaults.highestAct ?? defaults.currentAct;
    this.highestZone = defaults.highestZone ?? defaults.currentZone;
    this.bossesDefeated = new Set(defaults.bossesDefeated);
    this.ubersDefeated = new Set(defaults.ubersDefeated);

    this.timesPrestiged = 0;
    this.paragonPoints = new Map();
  }

  public static getInstance(): ProgressionStore {
    if (!ProgressionStore.instance) {
      ProgressionStore.instance = new ProgressionStore();
    }
    return ProgressionStore.instance;
  }

  public static getDefaults(): ProgressionStoreData {
    return {
      currentAct: 1,
      currentZone: 1,
      currentWave: 1,
      highestAct: 1,
      highestZone: 1,
      bossesDefeated: [],
      ubersDefeated: [],
    };
  }

  // ============================================================================
  // WAVE/ZONE PROGRESSION
  // ============================================================================

  public completeWave(duration: number, enemiesKilled: number, xpAwarded: number, goldAwarded: number): void {
    this.eventManager.emit(GameEvents.WAVE_COMPLETED, {
      waveNumber: this.currentWave,
      zoneNumber: this.currentZone,
      actNumber: this.currentAct,
      duration,
      enemiesKilled,
      xpAwarded,
      goldAwarded,
    });

    this.currentWave += 1;
    this.emitChange('currentWave');

    if (this.currentWave > GAME_CONFIG.WAVES_PER_ZONE) {
      this.completeZone();
    }
  }

  public completeZone(): void {
    this.eventManager.emit(GameEvents.ZONE_COMPLETED, {
      zoneNumber: this.currentZone,
      actNumber: this.currentAct,
      totalWaves: GAME_CONFIG.WAVES_PER_ZONE,
      totalDuration: 0,
      totalEnemiesKilled: 0,
      totalXpGained: 0,
      totalGoldGained: 0,
    });

    this.currentWave = 1;
    this.currentZone += 1;

    if (this.currentZone > GAME_CONFIG.ZONES_PER_ACT) {
      this.currentZone = 1;
      this.currentAct += 1;
    }

    this.updateHighestProgress();
    this.emitChange('zone');

    if (import.meta.env.DEV) {
      console.log(`[ProgressionStore] Advanced to Act ${this.currentAct}, Zone ${this.currentZone}`);
    }
  }

  public setZone(act: number, zone: number): boolean {
    if (act < 1 || act > GAME_CONFIG.TOTAL_ACTS || zone < 1 || zone > GAME_CONFIG.ZONES_PER_ACT) {
      if (import.meta.env.DEV) {
        console.warn(`[ProgressionStore] Invalid zone selection: Act ${act}, Zone ${zone}`);
      }
      return false;
    }

    if (!this.isZoneUnlocked(act, zone)) {
      if (import.meta.env.DEV) {
        console.warn(`[ProgressionStore] Zone is locked: Act ${act}, Zone ${zone}`);
      }
      return false;
    }

    const previousAct = this.currentAct;
    const previousZone = this.currentZone;

    if (previousAct === act && previousZone === zone) {
      return false;
    }

    this.currentAct = act;
    this.currentZone = zone;
    this.currentWave = 1;

    this.eventManager.emit(GameEvents.ZONE_CHANGED, {
      previousAct,
      previousZone,
      newAct: act,
      newZone: zone,
    });

    this.emitChange('zone');

    if (import.meta.env.DEV) {
      console.log(`[ProgressionStore] Zone changed: Act ${previousAct}-${previousZone} -> Act ${act}-${zone}`);
    }

    return true;
  }

  public isZoneUnlocked(act: number, zone: number): boolean {
    if (act === 1 && zone === 1) {
      return true;
    }

    if (act < this.highestAct) {
      return true;
    }

    if (act === this.highestAct) {
      return zone <= this.highestZone;
    }

    return false;
  }

  private updateHighestProgress(): void {
    const currentAhead =
      this.currentAct > this.highestAct ||
      (this.currentAct === this.highestAct && this.currentZone > this.highestZone);

    if (currentAhead) {
      this.highestAct = this.currentAct;
      this.highestZone = this.currentZone;

      if (import.meta.env.DEV) {
        console.log(`[ProgressionStore] New highest progress: Act ${this.highestAct}, Zone ${this.highestZone}`);
      }
    }
  }

  // ============================================================================
  // BOSS TRACKING
  // ============================================================================

  public defeatBoss(bossId: string): void {
    if (!this.bossesDefeated.has(bossId)) {
      this.bossesDefeated.add(bossId);
      this.emitChange('bossesDefeated');

      if (import.meta.env.DEV) {
        console.log(
          `[ProgressionStore] Defeated boss: ${bossId} (${this.bossesDefeated.size} total bosses defeated)`
        );
      }
    }
  }

  public defeatUberBoss(uberId: string): void {
    if (!this.ubersDefeated.has(uberId)) {
      this.ubersDefeated.add(uberId);
      this.emitChange('ubersDefeated');

      if (import.meta.env.DEV) {
        console.log(
          `[ProgressionStore] Defeated uber boss: ${uberId} (${this.ubersDefeated.size} total ubers defeated)`
        );
      }
    }
  }

  // ============================================================================
  // PARAGON
  // ============================================================================

  public prestige(): void {
    this.timesPrestiged += 1;
    this.emitChange('prestige');

    if (import.meta.env.DEV) {
      console.log(`[ProgressionStore] Prestiged ${this.timesPrestiged} times`);
    }
  }

  public investParagonPoints(category: string, points: number): void {
    const current = this.paragonPoints.get(category) || 0;
    this.paragonPoints.set(category, current + points);
    this.emitChange('paragonPoints');

    if (import.meta.env.DEV) {
      console.log(`[ProgressionStore] Invested ${points} paragon points in ${category} (total: ${current + points})`);
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getCurrentAct(): number {
    return this.currentAct;
  }

  public getCurrentZone(): number {
    return this.currentZone;
  }

  public getCurrentWave(): number {
    return this.currentWave;
  }

  public getHighestAct(): number {
    return this.highestAct;
  }

  public getHighestZone(): number {
    return this.highestZone;
  }

  public getBossesDefeated(): readonly string[] {
    return Array.from(this.bossesDefeated);
  }

  public getUbersDefeated(): readonly string[] {
    return Array.from(this.ubersDefeated);
  }

  public getTimesPrestiged(): number {
    return this.timesPrestiged;
  }

  public getParagonPoints(category: string): number {
    return this.paragonPoints.get(category) || 0;
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  public serialize(): ProgressionStoreData {
    return {
      currentAct: this.currentAct,
      currentZone: this.currentZone,
      currentWave: this.currentWave,
      highestAct: this.highestAct,
      highestZone: this.highestZone,
      bossesDefeated: Array.from(this.bossesDefeated),
      ubersDefeated: Array.from(this.ubersDefeated),
    };
  }

  public serializeParagon(): ParagonStoreData {
    return {
      timesPrestiged: this.timesPrestiged,
      points: Object.fromEntries(this.paragonPoints),
    };
  }

  public deserialize(data: ProgressionStoreData): void {
    this.currentAct = data.currentAct;
    this.currentZone = data.currentZone;
    this.currentWave = data.currentWave;
    this.highestAct = data.highestAct ?? data.currentAct;
    this.highestZone = data.highestZone ?? data.currentZone;
    this.bossesDefeated = new Set(data.bossesDefeated);
    this.ubersDefeated = new Set(data.ubersDefeated);
  }

  public deserializeParagon(data: ParagonStoreData): void {
    this.timesPrestiged = data.timesPrestiged;
    this.paragonPoints = new Map(Object.entries(data.points));
  }

  public reset(): void {
    const defaults = ProgressionStore.getDefaults();
    this.deserialize(defaults);
    this.timesPrestiged = 0;
    this.paragonPoints = new Map();
  }
}

export function getProgressionStore(): ProgressionStore {
  return ProgressionStore.getInstance();
}
