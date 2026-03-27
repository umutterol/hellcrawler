/**
 * EconomyStore - Manages gold, essences, and infernal cores
 *
 * Extracted from monolithic GameState. Handles:
 * - Gold income and spending
 * - Essence collection
 * - Infernal core management
 */

import { StatType } from '../types/GameTypes';
import { GameEvents } from '../types/GameEvents';
import { BaseStore } from './BaseStore';
import { getTankStore } from './TankStore';

export interface EconomyStoreData {
  gold: number;
  essences: Record<string, number>;
  infernalCores: number;
}

export class EconomyStore extends BaseStore<EconomyStoreData> {
  private static instance: EconomyStore | null = null;

  private gold: number;
  private essences: Map<string, number>;
  private infernalCores: number;

  private constructor() {
    super('economy');
    const defaults = EconomyStore.getDefaults();
    this.gold = defaults.gold;
    this.essences = new Map(Object.entries(defaults.essences));
    this.infernalCores = defaults.infernalCores;
  }

  public static getInstance(): EconomyStore {
    if (!EconomyStore.instance) {
      EconomyStore.instance = new EconomyStore();
    }
    return EconomyStore.instance;
  }

  public static getDefaults(): EconomyStoreData {
    return {
      gold: 0,
      essences: {},
      infernalCores: 0,
    };
  }

  // ============================================================================
  // GOLD
  // ============================================================================

  public addGold(
    amount: number,
    reason: 'enemy_drop' | 'boss_drop' | 'module_sold' | 'purchase' | 'upgrade' = 'enemy_drop'
  ): void {
    const tankStore = getTankStore();
    const goldBonus = (tankStore.getStatLevel(StatType.GoldFind) || 0) / 100;
    const actualAmount = Math.floor(amount * (1 + goldBonus));

    const previousGold = this.gold;
    this.gold += actualAmount;

    this.eventManager.emit(GameEvents.GOLD_CHANGED, {
      previousGold,
      newGold: this.gold,
      change: actualAmount,
      reason,
    });

    this.emitChange('gold');
  }

  public spendGold(
    amount: number,
    reason: 'enemy_drop' | 'boss_drop' | 'module_sold' | 'purchase' | 'upgrade' = 'purchase'
  ): boolean {
    if (this.gold < amount) {
      if (import.meta.env.DEV) {
        console.warn(`[EconomyStore] Insufficient gold: have ${this.gold}, need ${amount}`);
      }
      return false;
    }

    const previousGold = this.gold;
    this.gold -= amount;

    this.eventManager.emit(GameEvents.GOLD_CHANGED, {
      previousGold,
      newGold: this.gold,
      change: -amount,
      reason,
    });

    this.emitChange('gold');
    return true;
  }

  public canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  // ============================================================================
  // ESSENCES & INFERNAL CORES
  // ============================================================================

  public addEssence(type: string, amount: number): void {
    const current = this.essences.get(type) || 0;
    this.essences.set(type, current + amount);
    this.emitChange('essences');

    if (import.meta.env.DEV) {
      console.log(`[EconomyStore] Added ${amount} ${type} essence (total: ${current + amount})`);
    }
  }

  public addInfernalCores(amount: number): void {
    this.infernalCores += amount;
    this.emitChange('infernalCores');

    if (import.meta.env.DEV) {
      console.log(`[EconomyStore] Added ${amount} infernal cores (total: ${this.infernalCores})`);
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getGold(): number {
    return this.gold;
  }

  public getEssence(type: string): number {
    return this.essences.get(type) || 0;
  }

  public getInfernalCores(): number {
    return this.infernalCores;
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  public serialize(): EconomyStoreData {
    return {
      gold: this.gold,
      essences: Object.fromEntries(this.essences),
      infernalCores: this.infernalCores,
    };
  }

  public deserialize(data: EconomyStoreData): void {
    this.gold = data.gold;
    this.essences = new Map(Object.entries(data.essences));
    this.infernalCores = data.infernalCores;
  }

  public reset(): void {
    const defaults = EconomyStore.getDefaults();
    this.deserialize(defaults);
  }
}

export function getEconomyStore(): EconomyStore {
  return EconomyStore.getInstance();
}
