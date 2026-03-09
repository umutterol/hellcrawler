/**
 * GameState - Facade over 4 specialized stores
 *
 * This class preserves the original GameState public API while delegating
 * all logic to TankStore, EconomyStore, InventoryStore, and ProgressionStore.
 * All existing consumers continue calling getGameState().method() unchanged.
 *
 * Refactored from a 1400-line monolith using DH's 4-store pattern.
 */

import { TankStats, StatType, TankStatType } from '../types/GameTypes';
import { ModuleSlotData, ModuleItemData, SlotStatType, SlotStats } from '../types/ModuleTypes';
import { SaveData } from '../types/SaveTypes';
import { GameEvents } from '../types/GameEvents';
import { EventManager, getEventManager } from '../managers/EventManager';
import { BALANCE } from '../config/GameConfig';
import { getTankStore } from './TankStore';
import { getEconomyStore } from './EconomyStore';
import { getInventoryStore } from './InventoryStore';
import { getProgressionStore } from './ProgressionStore';

export class GameState {
  private static instance: GameState | null = null;
  private eventManager: EventManager;

  // Stores
  private tankStore: ReturnType<typeof getTankStore>;
  private economyStore: ReturnType<typeof getEconomyStore>;
  private inventoryStore: ReturnType<typeof getInventoryStore>;
  private progressionStore: ReturnType<typeof getProgressionStore>;

  private constructor() {
    this.eventManager = getEventManager();
    this.tankStore = getTankStore();
    this.economyStore = getEconomyStore();
    this.inventoryStore = getInventoryStore();
    this.progressionStore = getProgressionStore();

    if (import.meta.env.DEV) {
      console.log('[GameState] Initialized with 4-store architecture');
    }
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  /**
   * Get default initial game state (used by SaveManager for new games)
   */
  public static getDefaultState(): SaveData {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      tank: {
        level: 1,
        xp: 0,
        stats: {
          maxHP: BALANCE.TANK_MAX_HP_BASE,
          currentHP: BALANCE.TANK_MAX_HP_BASE,
          defense: 0,
          hpRegen: BALANCE.TANK_REGEN_BASE,
        },
        statLevels: {
          [StatType.Damage]: 0,
          [StatType.AttackSpeed]: 0,
          [StatType.CritChance]: 0,
          [StatType.CritDamage]: 0,
          [StatType.CDR]: 0,
          [StatType.AoE]: 0,
          [StatType.Lifesteal]: 0,
          [StatType.Multistrike]: 0,
          [StatType.Range]: 0,
          [StatType.GoldFind]: 0,
          [StatType.XPBonus]: 0,
        },
      },
      modules: {
        slots: [
          { index: 0, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: true },
          { index: 1, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: true },
          { index: 2, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: false },
          { index: 3, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: false },
          { index: 4, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: false },
        ],
        inventory: [],
        equipped: [null, null, null, null, null],
      },
      progression: {
        currentAct: 1,
        currentZone: 1,
        currentWave: 1,
        highestAct: 1,
        highestZone: 1,
        bossesDefeated: [],
        ubersDefeated: [],
      },
      economy: {
        gold: 0,
        essences: {},
        infernalCores: 0,
      },
      paragon: {
        timesPrestiged: 0,
        points: {},
      },
    };
  }

  // ============================================================================
  // TANK METHODS (delegate to TankStore)
  // ============================================================================

  public addXP(amount: number, source: 'enemy' | 'boss' | 'wave_completion' = 'enemy'): void {
    this.tankStore.addXP(amount, source);
  }

  public upgradeStat(stat: StatType): boolean {
    return this.tankStore.upgradeStat(stat);
  }

  public upgradeTankStat(stat: TankStatType): boolean {
    const result = this.tankStore.upgradeTankStat(stat);
    if (!result.success) return false;

    // Spend gold through economy store
    if (!this.economyStore.spendGold(result.cost, 'upgrade')) {
      return false;
    }

    // Apply the upgrade now that gold is spent
    this.tankStore.applyTankStatUpgrade(stat);
    return true;
  }

  public takeDamage(amount: number, sourceId: string, sourceType: 'enemy' | 'boss'): void {
    this.tankStore.takeDamage(amount, sourceId, sourceType);
  }

  public heal(
    amount: number,
    source: 'regen' | 'repair_drone' | 'skill' | 'revive' | 'other' = 'other'
  ): void {
    this.tankStore.heal(amount, source);
  }

  public revive(): void {
    this.tankStore.revive();
  }

  public getTankStatLevel(stat: TankStatType): number {
    return this.tankStore.getTankStatLevel(stat);
  }

  public getTankStatUpgradeCost(stat: TankStatType): number {
    return this.tankStore.getTankStatUpgradeCost(stat);
  }

  public canUpgradeTankStat(stat: TankStatType): boolean {
    return this.tankStore.canUpgradeTankStat(stat);
  }

  // ============================================================================
  // ECONOMY METHODS (delegate to EconomyStore)
  // ============================================================================

  public addGold(
    amount: number,
    reason: 'enemy_drop' | 'boss_drop' | 'module_sold' | 'purchase' | 'upgrade' = 'enemy_drop'
  ): void {
    this.economyStore.addGold(amount, reason);
  }

  public spendGold(
    amount: number,
    reason: 'enemy_drop' | 'boss_drop' | 'module_sold' | 'purchase' | 'upgrade' = 'purchase'
  ): boolean {
    return this.economyStore.spendGold(amount, reason);
  }

  public canAfford(cost: number): boolean {
    return this.economyStore.canAfford(cost);
  }

  public addEssence(type: string, amount: number): void {
    this.economyStore.addEssence(type, amount);
  }

  public addInfernalCores(amount: number): void {
    this.economyStore.addInfernalCores(amount);
  }

  // ============================================================================
  // MODULE METHODS (delegate to InventoryStore)
  // ============================================================================

  public equipModule(slotIndex: number, module: ModuleItemData): boolean {
    return this.inventoryStore.equipModule(slotIndex, module);
  }

  public equipModuleDirectly(slotIndex: number, module: ModuleItemData): void {
    this.inventoryStore.equipModuleDirectly(slotIndex, module);
  }

  public unequipModule(slotIndex: number): boolean {
    return this.inventoryStore.unequipModule(slotIndex);
  }

  public addToInventory(module: ModuleItemData, dropPosition?: { x: number; y: number }): boolean {
    return this.inventoryStore.addToInventory(module, dropPosition);
  }

  public sellModule(module: ModuleItemData): boolean {
    return this.inventoryStore.sellModule(module);
  }

  public upgradeSlotStat(slotIndex: number, statType: SlotStatType): boolean {
    return this.inventoryStore.upgradeSlotStat(slotIndex, statType);
  }

  public getSlotStatLevel(slotIndex: number, statType: SlotStatType): number {
    return this.inventoryStore.getSlotStatLevel(slotIndex, statType);
  }

  public getSlotStats(slotIndex: number): SlotStats | null {
    return this.inventoryStore.getSlotStats(slotIndex);
  }

  public getSlotStatUpgradeCost(slotIndex: number, statType: SlotStatType): number {
    return this.inventoryStore.getSlotStatUpgradeCost(slotIndex, statType);
  }

  public canUpgradeSlotStat(slotIndex: number, statType: SlotStatType): boolean {
    return this.inventoryStore.canUpgradeSlotStat(slotIndex, statType);
  }

  public getSlotStatBonus(slotIndex: number, statType: SlotStatType): number {
    return this.inventoryStore.getSlotStatBonus(slotIndex, statType);
  }

  public unlockSlot(slotIndex: number): boolean {
    return this.inventoryStore.unlockSlot(slotIndex);
  }

  // ============================================================================
  // PROGRESSION METHODS (delegate to ProgressionStore)
  // ============================================================================

  public completeWave(duration: number, enemiesKilled: number, xpAwarded: number, goldAwarded: number): void {
    this.progressionStore.completeWave(duration, enemiesKilled, xpAwarded, goldAwarded);
  }

  public completeZone(): void {
    this.progressionStore.completeZone();
  }

  public setZone(act: number, zone: number): boolean {
    return this.progressionStore.setZone(act, zone);
  }

  public isZoneUnlocked(act: number, zone: number): boolean {
    return this.progressionStore.isZoneUnlocked(act, zone);
  }

  public defeatBoss(bossId: string): void {
    this.progressionStore.defeatBoss(bossId);
  }

  public defeatUberBoss(uberId: string): void {
    this.progressionStore.defeatUberBoss(uberId);
  }

  // ============================================================================
  // PARAGON METHODS (delegate to ProgressionStore)
  // ============================================================================

  public prestige(): void {
    this.progressionStore.prestige();
  }

  public investParagonPoints(category: string, points: number): void {
    this.progressionStore.investParagonPoints(category, points);
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  public toSaveData(): SaveData {
    const tankData = this.tankStore.serialize();
    const economyData = this.economyStore.serialize();
    const inventoryData = this.inventoryStore.serialize();
    const progressionData = this.progressionStore.serialize();
    const paragonData = this.progressionStore.serializeParagon();

    return {
      version: '1.0.0',
      timestamp: Date.now(),
      tank: {
        level: tankData.level,
        xp: tankData.xp,
        stats: tankData.stats,
        statLevels: tankData.statLevels,
      },
      modules: inventoryData,
      progression: progressionData,
      economy: economyData,
      paragon: paragonData,
    };
  }

  public fromSaveData(data: SaveData): void {
    this.tankStore.deserialize(data.tank);
    this.economyStore.deserialize(data.economy);
    this.inventoryStore.deserialize(data.modules);
    this.progressionStore.deserialize(data.progression);
    this.progressionStore.deserializeParagon(data.paragon);

    this.eventManager.emit(GameEvents.GAME_LOADED, {
      timestamp: data.timestamp,
      tankLevel: this.tankStore.getTankLevel(),
      currentZone: this.progressionStore.getCurrentZone(),
      currentAct: this.progressionStore.getCurrentAct(),
      totalPlayTime: 0,
    });

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Loaded save data (Level ${this.tankStore.getTankLevel()}, Act ${this.progressionStore.getCurrentAct()} Zone ${this.progressionStore.getCurrentZone()})`
      );
    }
  }

  public reset(): void {
    this.tankStore.reset();
    this.economyStore.reset();
    this.inventoryStore.reset();
    this.progressionStore.reset();

    if (import.meta.env.DEV) {
      console.log('[GameState] Reset to default state');
    }
  }

  // ============================================================================
  // GETTERS (delegate to stores)
  // ============================================================================

  public getTankLevel(): number {
    return this.tankStore.getTankLevel();
  }

  public getTankXP(): number {
    return this.tankStore.getTankXP();
  }

  public getTankStats(): Readonly<TankStats> {
    return this.tankStore.getTankStats();
  }

  public getStatLevel(stat: StatType): number {
    return this.tankStore.getStatLevel(stat);
  }

  public getGold(): number {
    return this.economyStore.getGold();
  }

  public getEssence(type: string): number {
    return this.economyStore.getEssence(type);
  }

  public getInfernalCores(): number {
    return this.economyStore.getInfernalCores();
  }

  public getModuleSlots(): readonly Readonly<ModuleSlotData>[] {
    return this.inventoryStore.getModuleSlots();
  }

  public getModuleInventory(): readonly Readonly<ModuleItemData>[] {
    return this.inventoryStore.getModuleInventory();
  }

  public getCurrentAct(): number {
    return this.progressionStore.getCurrentAct();
  }

  public getCurrentZone(): number {
    return this.progressionStore.getCurrentZone();
  }

  public getCurrentWave(): number {
    return this.progressionStore.getCurrentWave();
  }

  public getHighestAct(): number {
    return this.progressionStore.getHighestAct();
  }

  public getHighestZone(): number {
    return this.progressionStore.getHighestZone();
  }

  public getBossesDefeated(): readonly string[] {
    return this.progressionStore.getBossesDefeated();
  }

  public getUbersDefeated(): readonly string[] {
    return this.progressionStore.getUbersDefeated();
  }

  public getTimesPrestiged(): number {
    return this.progressionStore.getTimesPrestiged();
  }

  public getParagonPoints(category: string): number {
    return this.progressionStore.getParagonPoints(category);
  }

  public getAvailableSkillPoints(): number {
    return this.tankStore.getAvailableSkillPoints();
  }

  public getXPToNextLevel(): number {
    return this.tankStore.getXPToNextLevel();
  }

  public getStatUpgradeCost(stat: StatType): number {
    return this.tankStore.getStatUpgradeCost(stat);
  }
}

/**
 * Export a convenience function to get the GameState instance
 */
export function getGameState(): GameState {
  return GameState.getInstance();
}
