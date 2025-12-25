/**
 * GameState - Centralized Game State Manager
 * Singleton class managing all game state with event-driven updates
 *
 * Phase 2: GameState Implementation
 *
 * Features:
 * - Singleton pattern for global state access
 * - Event emission on all state changes
 * - Save/load serialization
 * - Type-safe state mutations
 * - Tank progression and stats
 * - Economy management
 * - Module inventory and equipment
 * - Progression tracking
 */

import { TankStats, StatType } from '../types/GameTypes';
import { ModuleSlotData, ModuleItemData } from '../types/ModuleTypes';
import { SaveData } from '../types/SaveTypes';
import { GameEvents } from '../types/GameEvents';
import { EventManager } from '../managers/EventManager';
import { GAME_CONFIG } from '../config/GameConfig';
import { calculateXPRequired, calculateUpgradeCost } from '../config/Constants';

/**
 * Main GameState class
 * Manages all persistent game state and emits events on changes
 */
export class GameState {
  private static instance: GameState | null = null;
  private eventManager: EventManager;

  // Tank state
  private tankLevel: number;
  private tankXP: number;
  private tankStats: TankStats;
  private statLevels: Map<StatType, number>;

  // Economy state
  private gold: number;
  private essences: Map<string, number>;
  private infernalCores: number;

  // Module state
  private moduleSlots: ModuleSlotData[];
  private moduleInventory: ModuleItemData[];

  // Progression state
  private currentAct: number;
  private currentZone: number;
  private currentWave: number;
  private bossesDefeated: Set<string>;
  private ubersDefeated: Set<string>;

  // Paragon state
  private timesPrestiged: number;
  private paragonPoints: Map<string, number>;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.eventManager = EventManager.getInstance();

    // Initialize with default state
    const defaultState = GameState.getDefaultState();

    this.tankLevel = defaultState.tank.level;
    this.tankXP = defaultState.tank.xp;
    this.tankStats = { ...defaultState.tank.stats };
    this.statLevels = new Map(
      Object.entries(defaultState.tank.statLevels) as [StatType, number][]
    );

    this.gold = defaultState.economy.gold;
    this.essences = new Map(Object.entries(defaultState.economy.essences));
    this.infernalCores = defaultState.economy.infernalCores;

    this.moduleSlots = defaultState.modules.slots.map((slot) => ({ ...slot }));
    this.moduleInventory = [];

    this.currentAct = defaultState.progression.currentAct;
    this.currentZone = defaultState.progression.currentZone;
    this.currentWave = defaultState.progression.currentWave;
    this.bossesDefeated = new Set(defaultState.progression.bossesDefeated);
    this.ubersDefeated = new Set(defaultState.progression.ubersDefeated);

    this.timesPrestiged = defaultState.paragon.timesPrestiged;
    this.paragonPoints = new Map(Object.entries(defaultState.paragon.points));

    if (import.meta.env.DEV) {
      console.log('[GameState] Initialized with default state');
    }
  }

  /**
   * Get the singleton instance of GameState
   */
  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  /**
   * Get default initial game state
   */
  public static getDefaultState(): SaveData {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      tank: {
        level: 1,
        xp: 0,
        stats: {
          maxHP: 100,
          currentHP: 100,
          defense: 0,
          hpRegen: 0,
          moveSpeed: 200,
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
          { index: 0, level: 1, equipped: null, unlocked: true },
          { index: 1, level: 1, equipped: null, unlocked: false },
          { index: 2, level: 1, equipped: null, unlocked: false },
          { index: 3, level: 1, equipped: null, unlocked: false },
          { index: 4, level: 1, equipped: null, unlocked: false },
        ],
        inventory: [],
        equipped: [null, null, null, null, null],
      },
      progression: {
        currentAct: 1,
        currentZone: 1,
        currentWave: 1,
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
  // TANK METHODS
  // ============================================================================

  /**
   * Add experience points to the tank
   * Automatically handles level-ups
   */
  public addXP(amount: number, source: 'enemy' | 'boss' | 'wave_completion' = 'enemy'): void {
    const xpBonus = (this.statLevels.get(StatType.XPBonus) || 0) / 100;
    const actualAmount = Math.floor(amount * (1 + xpBonus));

    this.tankXP += actualAmount;

    this.eventManager.emit(GameEvents.XP_GAINED, {
      amount: actualAmount,
      currentXp: this.tankXP,
      xpToNextLevel: calculateXPRequired(this.tankLevel),
      source,
    });

    // Check for level-up (recalculate xpToNext each iteration)
    while (
      this.tankXP >= calculateXPRequired(this.tankLevel) &&
      this.tankLevel < GAME_CONFIG.MAX_TANK_LEVEL
    ) {
      this.levelUp();
    }
  }

  /**
   * Level up the tank
   * Called automatically by addXP when enough XP is gained
   */
  private levelUp(): void {
    const previousLevel = this.tankLevel;
    this.tankLevel += 1;

    // Deduct XP for this level
    const xpRequired = calculateXPRequired(previousLevel);
    this.tankXP -= xpRequired;

    // Award skill points (1 per level)
    const skillPointsAwarded = 1;
    const totalSkillPoints = this.getTotalSkillPoints();

    this.eventManager.emit(GameEvents.LEVEL_UP, {
      previousLevel,
      newLevel: this.tankLevel,
      skillPointsAwarded,
      totalSkillPoints,
    });

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Level up! ${previousLevel} -> ${this.tankLevel} (${totalSkillPoints} total skill points)`
      );
    }
  }

  /**
   * Get total available skill points (unspent)
   */
  private getTotalSkillPoints(): number {
    const earnedPoints = this.tankLevel - 1; // Level 1 = 0 points, Level 2 = 1 point, etc.
    const spentPoints = Array.from(this.statLevels.values()).reduce(
      (sum, level) => sum + level,
      0
    );
    return earnedPoints - spentPoints;
  }

  /**
   * Upgrade a specific stat
   * Costs skill points gained from leveling
   */
  public upgradeStat(stat: StatType): boolean {
    const availablePoints = this.getTotalSkillPoints();

    if (availablePoints <= 0) {
      if (import.meta.env.DEV) {
        console.warn('[GameState] No skill points available for upgrade');
      }
      return false;
    }

    const currentLevel = this.statLevels.get(stat) || 0;
    this.statLevels.set(stat, currentLevel + 1);

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Upgraded ${stat} to level ${currentLevel + 1} (${this.getTotalSkillPoints()} points remaining)`
      );
    }

    return true;
  }

  /**
   * Deal damage to the tank
   */
  public takeDamage(amount: number, sourceId: string, sourceType: 'enemy' | 'boss'): void {
    const previousHP = this.tankStats.currentHP;

    // Apply defense reduction
    const defenseReduction = this.tankStats.defense / (this.tankStats.defense + 100);
    const actualDamage = Math.floor(amount * (1 - defenseReduction));

    this.tankStats.currentHP = Math.max(0, this.tankStats.currentHP - actualDamage);

    this.eventManager.emit(GameEvents.DAMAGE_TAKEN, {
      targetId: 'player-tank',
      targetType: 'tank',
      sourceId,
      sourceType,
      damage: actualDamage,
      remainingHealth: this.tankStats.currentHP,
      maxHealth: this.tankStats.maxHP,
    });

    // Check for near-death state (below 20% HP)
    const healthPercent = this.tankStats.currentHP / this.tankStats.maxHP;
    const wasAboveThreshold = previousHP / this.tankStats.maxHP >= 0.2;
    const isNowBelowThreshold = healthPercent < 0.2;

    if (wasAboveThreshold && isNowBelowThreshold && this.tankStats.currentHP > 0) {
      this.eventManager.emit(GameEvents.NEAR_DEATH_ENTERED, {
        currentHealth: this.tankStats.currentHP,
        maxHealth: this.tankStats.maxHP,
        threshold: 0.2,
        reviveTimeRemaining: GAME_CONFIG.NEAR_DEATH_REVIVE_TIME,
      });
    }
  }

  /**
   * Heal the tank
   */
  public heal(amount: number): void {
    const previousHP = this.tankStats.currentHP;
    this.tankStats.currentHP = Math.min(this.tankStats.maxHP, this.tankStats.currentHP + amount);

    if (import.meta.env.DEV && this.tankStats.currentHP !== previousHP) {
      console.log(
        `[GameState] Healed for ${amount}, HP: ${previousHP} -> ${this.tankStats.currentHP}`
      );
    }
  }

  /**
   * Revive the tank from near-death state
   */
  public revive(): void {
    const restoredHealth = Math.floor(this.tankStats.maxHP * 0.5);
    this.tankStats.currentHP = restoredHealth;

    this.eventManager.emit(GameEvents.TANK_REVIVED, {
      restoredHealth,
      maxHealth: this.tankStats.maxHP,
      cooldownDuration: GAME_CONFIG.NEAR_DEATH_REVIVE_TIME,
    });
  }

  // ============================================================================
  // ECONOMY METHODS
  // ============================================================================

  /**
   * Add gold to the player's economy
   */
  public addGold(
    amount: number,
    reason: 'enemy_drop' | 'boss_drop' | 'module_sold' | 'purchase' | 'upgrade' = 'enemy_drop'
  ): void {
    const goldBonus = (this.statLevels.get(StatType.GoldFind) || 0) / 100;
    const actualAmount = Math.floor(amount * (1 + goldBonus));

    const previousGold = this.gold;
    this.gold += actualAmount;

    this.eventManager.emit(GameEvents.GOLD_CHANGED, {
      previousGold,
      newGold: this.gold,
      change: actualAmount,
      reason,
    });
  }

  /**
   * Spend gold from the player's economy
   * Returns true if successful, false if insufficient gold
   */
  public spendGold(
    amount: number,
    reason: 'enemy_drop' | 'boss_drop' | 'module_sold' | 'purchase' | 'upgrade' = 'purchase'
  ): boolean {
    if (this.gold < amount) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Insufficient gold: have ${this.gold}, need ${amount}`);
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

    return true;
  }

  /**
   * Check if the player can afford a cost
   */
  public canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  /**
   * Add essence of a specific type
   */
  public addEssence(type: string, amount: number): void {
    const current = this.essences.get(type) || 0;
    this.essences.set(type, current + amount);

    if (import.meta.env.DEV) {
      console.log(`[GameState] Added ${amount} ${type} essence (total: ${current + amount})`);
    }
  }

  /**
   * Add infernal cores
   */
  public addInfernalCores(amount: number): void {
    this.infernalCores += amount;

    if (import.meta.env.DEV) {
      console.log(`[GameState] Added ${amount} infernal cores (total: ${this.infernalCores})`);
    }
  }

  // ============================================================================
  // MODULE METHODS
  // ============================================================================

  /**
   * Equip a module to a specific slot
   */
  public equipModule(slotIndex: number, module: ModuleItemData): boolean {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Invalid slot index: ${slotIndex}`);
      }
      return false;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Slot not found at index: ${slotIndex}`);
      }
      return false;
    }

    if (!slot.unlocked) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Slot ${slotIndex} is not unlocked`);
      }
      return false;
    }

    // If there's already a module equipped, move it to inventory
    const previousModule = slot.equipped;
    if (previousModule) {
      this.moduleInventory.push(previousModule);
    }

    // Equip the new module
    slot.equipped = module;

    // Remove from inventory if it was there
    const inventoryIndex = this.moduleInventory.findIndex((m) => m.id === module.id);
    if (inventoryIndex !== -1) {
      this.moduleInventory.splice(inventoryIndex, 1);
    }

    this.eventManager.emit(GameEvents.MODULE_EQUIPPED, {
      moduleId: module.id,
      moduleType: module.type,
      slotIndex,
      previousModuleId: previousModule?.id ?? null,
    });

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Equipped ${module.type} (${module.rarity}) to slot ${slotIndex}${
          previousModule ? `, replaced ${previousModule.type}` : ''
        }`
      );
    }

    return true;
  }

  /**
   * Unequip a module from a specific slot
   */
  public unequipModule(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Invalid slot index: ${slotIndex}`);
      }
      return false;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Slot not found at index: ${slotIndex}`);
      }
      return false;
    }

    if (!slot.equipped) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Slot ${slotIndex} is already empty`);
      }
      return false;
    }

    // Move module to inventory
    this.moduleInventory.push(slot.equipped);
    slot.equipped = null;

    if (import.meta.env.DEV) {
      console.log(`[GameState] Unequipped module from slot ${slotIndex}`);
    }

    return true;
  }

  /**
   * Add a module to the inventory
   */
  public addToInventory(module: ModuleItemData): void {
    this.moduleInventory.push(module);

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Added ${module.type} (${module.rarity}) to inventory (${this.moduleInventory.length} total)`
      );
    }
  }

  /**
   * Sell a module for gold
   */
  public sellModule(module: ModuleItemData): boolean {
    // Calculate gold value based on rarity
    const rarityValues: Record<string, number> = {
      uncommon: 100,
      rare: 250,
      epic: 500,
      legendary: 1000,
    };

    const goldEarned = rarityValues[module.rarity] || 100;

    // Remove from inventory
    const inventoryIndex = this.moduleInventory.findIndex((m) => m.id === module.id);
    if (inventoryIndex !== -1) {
      this.moduleInventory.splice(inventoryIndex, 1);
      this.addGold(goldEarned, 'module_sold');

      this.eventManager.emit(GameEvents.MODULE_SOLD, {
        moduleId: module.id,
        rarity: module.rarity,
        goldEarned,
      });

      if (import.meta.env.DEV) {
        console.log(`[GameState] Sold ${module.type} (${module.rarity}) for ${goldEarned} gold`);
      }

      return true;
    }

    if (import.meta.env.DEV) {
      console.warn(`[GameState] Module ${module.id} not found in inventory`);
    }

    return false;
  }

  /**
   * Unlock a module slot
   */
  public unlockSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Invalid slot index: ${slotIndex}`);
      }
      return false;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Slot not found at index: ${slotIndex}`);
      }
      return false;
    }

    if (slot.unlocked) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Slot ${slotIndex} is already unlocked`);
      }
      return false;
    }

    const cost = GAME_CONFIG.SLOT_COSTS[slotIndex];
    if (cost === undefined) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] No cost defined for slot ${slotIndex}`);
      }
      return false;
    }

    if (!this.spendGold(cost, 'purchase')) {
      return false;
    }

    slot.unlocked = true;

    if (import.meta.env.DEV) {
      console.log(`[GameState] Unlocked slot ${slotIndex} for ${cost} gold`);
    }

    return true;
  }

  // ============================================================================
  // PROGRESSION METHODS
  // ============================================================================

  /**
   * Complete the current wave and advance to the next
   */
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

    // Check if we've completed all waves in this zone
    if (this.currentWave > GAME_CONFIG.WAVES_PER_ZONE) {
      this.completeZone();
    }
  }

  /**
   * Complete the current zone and advance to the next
   */
  public completeZone(): void {
    this.eventManager.emit(GameEvents.ZONE_COMPLETED, {
      zoneNumber: this.currentZone,
      actNumber: this.currentAct,
      totalWaves: GAME_CONFIG.WAVES_PER_ZONE,
      totalDuration: 0, // Would be tracked separately
      totalEnemiesKilled: 0, // Would be tracked separately
      totalXpGained: 0, // Would be tracked separately
      totalGoldGained: 0, // Would be tracked separately
    });

    this.currentWave = 1;
    this.currentZone += 1;

    // Check if we've completed all zones in this act
    if (this.currentZone > GAME_CONFIG.ZONES_PER_ACT) {
      this.currentZone = 1;
      this.currentAct += 1;
    }

    if (import.meta.env.DEV) {
      console.log(`[GameState] Advanced to Act ${this.currentAct}, Zone ${this.currentZone}`);
    }
  }

  /**
   * Mark a boss as defeated
   */
  public defeatBoss(bossId: string): void {
    if (!this.bossesDefeated.has(bossId)) {
      this.bossesDefeated.add(bossId);

      if (import.meta.env.DEV) {
        console.log(
          `[GameState] Defeated boss: ${bossId} (${this.bossesDefeated.size} total bosses defeated)`
        );
      }
    }
  }

  /**
   * Mark an uber boss as defeated
   */
  public defeatUberBoss(uberId: string): void {
    if (!this.ubersDefeated.has(uberId)) {
      this.ubersDefeated.add(uberId);

      if (import.meta.env.DEV) {
        console.log(
          `[GameState] Defeated uber boss: ${uberId} (${this.ubersDefeated.size} total ubers defeated)`
        );
      }
    }
  }

  // ============================================================================
  // PARAGON METHODS
  // ============================================================================

  /**
   * Prestige the character (reset with bonuses)
   */
  public prestige(): void {
    this.timesPrestiged += 1;

    if (import.meta.env.DEV) {
      console.log(`[GameState] Prestiged ${this.timesPrestiged} times`);
    }

    // Reset would happen here in full implementation
    // For now, just increment the counter
  }

  /**
   * Invest paragon points in a category
   */
  public investParagonPoints(category: string, points: number): void {
    const current = this.paragonPoints.get(category) || 0;
    this.paragonPoints.set(category, current + points);

    if (import.meta.env.DEV) {
      console.log(`[GameState] Invested ${points} paragon points in ${category} (total: ${current + points})`);
    }
  }

  // ============================================================================
  // SERIALIZATION METHODS
  // ============================================================================

  /**
   * Convert current state to SaveData format
   */
  public toSaveData(): SaveData {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      tank: {
        level: this.tankLevel,
        xp: this.tankXP,
        stats: { ...this.tankStats },
        statLevels: Object.fromEntries(this.statLevels),
      },
      modules: {
        slots: this.moduleSlots.map((slot) => ({
          ...slot,
          equipped: slot.equipped ? { ...slot.equipped } : null,
        })),
        inventory: this.moduleInventory.map((module) => ({ ...module })),
        equipped: this.moduleSlots.map((slot) =>
          slot.equipped ? { ...slot.equipped } : null
        ),
      },
      progression: {
        currentAct: this.currentAct,
        currentZone: this.currentZone,
        currentWave: this.currentWave,
        bossesDefeated: Array.from(this.bossesDefeated),
        ubersDefeated: Array.from(this.ubersDefeated),
      },
      economy: {
        gold: this.gold,
        essences: Object.fromEntries(this.essences),
        infernalCores: this.infernalCores,
      },
      paragon: {
        timesPrestiged: this.timesPrestiged,
        points: Object.fromEntries(this.paragonPoints),
      },
    };
  }

  /**
   * Load state from SaveData
   */
  public fromSaveData(data: SaveData): void {
    this.tankLevel = data.tank.level;
    this.tankXP = data.tank.xp;
    this.tankStats = { ...data.tank.stats };
    this.statLevels = new Map(Object.entries(data.tank.statLevels) as [StatType, number][]);

    this.gold = data.economy.gold;
    this.essences = new Map(Object.entries(data.economy.essences));
    this.infernalCores = data.economy.infernalCores;

    this.moduleSlots = data.modules.slots.map((slot) => ({ ...slot }));
    this.moduleInventory = data.modules.inventory.map((module) => ({ ...module }));

    this.currentAct = data.progression.currentAct;
    this.currentZone = data.progression.currentZone;
    this.currentWave = data.progression.currentWave;
    this.bossesDefeated = new Set(data.progression.bossesDefeated);
    this.ubersDefeated = new Set(data.progression.ubersDefeated);

    this.timesPrestiged = data.paragon.timesPrestiged;
    this.paragonPoints = new Map(Object.entries(data.paragon.points));

    this.eventManager.emit(GameEvents.GAME_LOADED, {
      timestamp: data.timestamp,
      tankLevel: this.tankLevel,
      currentZone: this.currentZone,
      currentAct: this.currentAct,
      totalPlayTime: 0, // Would be tracked separately
    });

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Loaded save data (Level ${this.tankLevel}, Act ${this.currentAct} Zone ${this.currentZone})`
      );
    }
  }

  /**
   * Reset to default state (new game)
   */
  public reset(): void {
    const defaultState = GameState.getDefaultState();
    this.fromSaveData(defaultState);

    if (import.meta.env.DEV) {
      console.log('[GameState] Reset to default state');
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getTankLevel(): number {
    return this.tankLevel;
  }

  public getTankXP(): number {
    return this.tankXP;
  }

  public getTankStats(): Readonly<TankStats> {
    return { ...this.tankStats };
  }

  public getStatLevel(stat: StatType): number {
    return this.statLevels.get(stat) || 0;
  }

  public getGold(): number {
    return this.gold;
  }

  public getEssence(type: string): number {
    return this.essences.get(type) || 0;
  }

  public getInfernalCores(): number {
    return this.infernalCores;
  }

  public getModuleSlots(): readonly Readonly<ModuleSlotData>[] {
    return this.moduleSlots.map((slot) => ({ ...slot }));
  }

  public getModuleInventory(): readonly Readonly<ModuleItemData>[] {
    return this.moduleInventory.map((module) => ({ ...module }));
  }

  public getCurrentAct(): number {
    return this.currentAct;
  }

  public getCurrentZone(): number {
    return this.currentZone;
  }

  public getCurrentWave(): number {
    return this.currentWave;
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

  public getAvailableSkillPoints(): number {
    return this.getTotalSkillPoints();
  }

  public getXPToNextLevel(): number {
    return calculateXPRequired(this.tankLevel);
  }

  public getStatUpgradeCost(stat: StatType): number {
    const currentLevel = this.statLevels.get(stat) || 0;
    return calculateUpgradeCost(currentLevel);
  }
}

/**
 * Export a convenience function to get the GameState instance
 */
export function getGameState(): GameState {
  return GameState.getInstance();
}
