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

import { TankStats, StatType, TankStatType, Rarity } from '../types/GameTypes';
import { ModuleSlotData, ModuleItemData, SlotStatType, SlotStats } from '../types/ModuleTypes';
import { MODULE_SELL_VALUES } from '../modules/ModuleItem';
import { SaveData } from '../types/SaveTypes';
import { GameEvents } from '../types/GameEvents';
import { EventManager } from '../managers/EventManager';
import { getSettingsManager } from '../managers/SettingsManager';
import { GAME_CONFIG, BALANCE } from '../config/GameConfig';
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
  private tankStatLevels: Map<TankStatType, number>;

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
  private highestAct: number;   // Highest act ever reached
  private highestZone: number;  // Highest zone in highest act
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
    this.tankStatLevels = new Map([
      [TankStatType.MaxHP, 0],
      [TankStatType.Defense, 0],
      [TankStatType.HPRegen, 0],
    ]);

    this.gold = defaultState.economy.gold;
    this.essences = new Map(Object.entries(defaultState.economy.essences));
    this.infernalCores = defaultState.economy.infernalCores;

    this.moduleSlots = defaultState.modules.slots.map((slot) => ({ ...slot }));
    this.moduleInventory = [];

    this.currentAct = defaultState.progression.currentAct;
    this.currentZone = defaultState.progression.currentZone;
    this.currentWave = defaultState.progression.currentWave;
    this.highestAct = defaultState.progression.highestAct ?? defaultState.progression.currentAct;
    this.highestZone = defaultState.progression.highestZone ?? defaultState.progression.currentZone;
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
   * Uses BALANCE constants for base tank stats
   */
  public static getDefaultState(): SaveData {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      tank: {
        level: 1,
        xp: 0,
        stats: {
          maxHP: BALANCE.TANK_MAX_HP_BASE,      // 200 base HP
          currentHP: BALANCE.TANK_MAX_HP_BASE,
          defense: 0,
          hpRegen: 0,
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
   * Upgrade a tank stat using gold
   * Per GDD: Cost = level * 100 gold, capped by tank level
   *
   * @returns true if upgrade successful, false if insufficient gold or at cap
   */
  public upgradeTankStat(stat: TankStatType): boolean {
    const currentLevel = this.tankStatLevels.get(stat) ?? 0;

    // Check tank level cap
    if (currentLevel >= this.tankLevel) {
      if (import.meta.env.DEV) {
        console.warn(
          `[GameState] Tank stat ${stat} at cap (${currentLevel}/${this.tankLevel})`
        );
      }
      return false;
    }

    // Calculate cost: (currentLevel + 1) * 100
    const cost = (currentLevel + 1) * 100;

    // Check if player can afford
    if (!this.spendGold(cost, 'upgrade')) {
      return false;
    }

    // Upgrade the stat
    this.tankStatLevels.set(stat, currentLevel + 1);

    // Apply stat bonus to tankStats
    this.applyTankStatBonus(stat, currentLevel + 1);

    // Emit event so UI can update
    this.eventManager.emit(GameEvents.TANK_STAT_UPGRADED, {
      stat,
      newLevel: currentLevel + 1,
      newValue: this.getTankStatValue(stat),
      cost,
    });

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Upgraded tank stat ${stat} to level ${currentLevel + 1} for ${cost} gold`
      );
    }

    return true;
  }

  /**
   * Get the current value of a tank stat
   */
  private getTankStatValue(stat: TankStatType): number {
    switch (stat) {
      case TankStatType.MaxHP:
        return this.tankStats.maxHP;
      case TankStatType.Defense:
        return this.tankStats.defense;
      case TankStatType.HPRegen:
        return this.tankStats.hpRegen;
      default:
        return 0;
    }
  }

  /**
   * Apply tank stat bonus based on level
   * Uses BALANCE constants for meaningful scaling (Desktop Heroes pattern)
   */
  private applyTankStatBonus(stat: TankStatType, level: number): void {
    switch (stat) {
      case TankStatType.MaxHP:
        // Base + bonus per level (now 25 HP per level instead of 10)
        const newMaxHP = BALANCE.TANK_MAX_HP_BASE + level * BALANCE.TANK_MAX_HP_PER_LEVEL;
        // Increase current HP proportionally when max HP increases
        if (this.tankStats.maxHP > 0) {
          const hpRatio = this.tankStats.currentHP / this.tankStats.maxHP;
          this.tankStats.currentHP = Math.floor(newMaxHP * hpRatio);
        }
        this.tankStats.maxHP = newMaxHP;
        break;
      case TankStatType.Defense:
        // +1 defense per level
        this.tankStats.defense = level * BALANCE.TANK_DEFENSE_PER_LEVEL;
        break;
      case TankStatType.HPRegen:
        // +1 HP/s per level
        this.tankStats.hpRegen = level * BALANCE.TANK_REGEN_PER_LEVEL;
        break;
    }
  }

  /**
   * Get tank stat level
   */
  public getTankStatLevel(stat: TankStatType): number {
    return this.tankStatLevels.get(stat) ?? 0;
  }

  /**
   * Get tank stat upgrade cost
   */
  public getTankStatUpgradeCost(stat: TankStatType): number {
    const currentLevel = this.tankStatLevels.get(stat) ?? 0;
    return (currentLevel + 1) * 100;
  }

  /**
   * Check if tank stat can be upgraded (not at cap)
   */
  public canUpgradeTankStat(stat: TankStatType): boolean {
    const currentLevel = this.tankStatLevels.get(stat) ?? 0;
    return currentLevel < this.tankLevel;
  }

  /**
   * Deal damage to the tank
   * IMPORTANT: Tank cannot die - HP minimum is 1 (Near Death system)
   */
  public takeDamage(amount: number, sourceId: string, sourceType: 'enemy' | 'boss'): void {
    const previousHP = this.tankStats.currentHP;

    // Apply defense reduction
    const defenseReduction = this.tankStats.defense / (this.tankStats.defense + 100);
    const actualDamage = Math.floor(amount * (1 - defenseReduction));

    // CRITICAL: Tank cannot die - minimum HP is 1
    // This implements the Near Death mechanic from the GDD
    this.tankStats.currentHP = Math.max(1, this.tankStats.currentHP - actualDamage);

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

    if (wasAboveThreshold && isNowBelowThreshold) {
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
  public heal(
    amount: number,
    source: 'regen' | 'repair_drone' | 'skill' | 'revive' | 'other' = 'other'
  ): void {
    const previousHP = this.tankStats.currentHP;
    // Round to 2 decimal places to avoid floating point precision issues
    this.tankStats.currentHP = Math.round(
      Math.min(this.tankStats.maxHP, this.tankStats.currentHP + amount) * 100
    ) / 100;

    const actualHeal = this.tankStats.currentHP - previousHP;

    // Only emit if actual healing occurred
    if (actualHeal > 0) {
      this.eventManager.emit(GameEvents.TANK_HEALED, {
        amount: actualHeal,
        currentHealth: this.tankStats.currentHP,
        maxHealth: this.tankStats.maxHP,
        source,
      });

      if (import.meta.env.DEV) {
        console.log(
          `[GameState] Healed for ${actualHeal} (${source}), HP: ${previousHP} -> ${this.tankStats.currentHP}`
        );
      }
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
   * Directly set a module as equipped on a slot (no events)
   * Used by ModuleManager to sync state without triggering duplicate events
   */
  public equipModuleDirectly(slotIndex: number, module: ModuleItemData): void {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      return;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.unlocked) {
      return;
    }

    // Simply set the equipped module - no events, no inventory management
    // The calling code (ModuleManager) handles all the side effects
    slot.equipped = module;

    if (import.meta.env.DEV) {
      console.log(`[GameState] equipModuleDirectly: slot ${slotIndex} = ${module.type}`);
    }
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

    // Store module info before clearing
    const unequippedModule = slot.equipped;

    // Move module to inventory
    this.moduleInventory.push(slot.equipped);
    slot.equipped = null;

    // Emit event so ModuleManager can destroy the active module
    this.eventManager.emit(GameEvents.MODULE_UNEQUIPPED, {
      moduleId: unequippedModule.id,
      moduleType: unequippedModule.type,
      slotIndex,
    });

    if (import.meta.env.DEV) {
      console.log(`[GameState] Unequipped module from slot ${slotIndex}`);
    }

    return true;
  }

  /**
   * Add a module to the inventory
   * If autoSellUncommon is enabled and module is Uncommon, auto-sell it instead
   *
   * @param module The module to add
   * @param dropPosition Optional position for auto-sell notification
   * @returns true if added to inventory, false if auto-sold
   */
  public addToInventory(module: ModuleItemData, dropPosition?: { x: number; y: number }): boolean {
    // Check auto-sell setting for Uncommon modules
    const settings = getSettingsManager();
    if (settings.autoSellUncommon && module.rarity === Rarity.Uncommon) {
      // Auto-sell the module
      const goldEarned = MODULE_SELL_VALUES[Rarity.Uncommon] || 50;
      this.addGold(goldEarned, 'module_sold');

      // Emit auto-sold event with position for notification
      this.eventManager.emit(GameEvents.MODULE_AUTO_SOLD, {
        moduleId: module.id,
        moduleType: module.type,
        rarity: 'uncommon',
        goldEarned,
        x: dropPosition?.x ?? 0,
        y: dropPosition?.y ?? 0,
      });

      if (import.meta.env.DEV) {
        console.log(
          `[GameState] Auto-sold ${module.type} (${module.rarity}) for ${goldEarned} gold`
        );
      }

      return false; // Module was auto-sold, not added to inventory
    }

    // Normal inventory addition
    this.moduleInventory.push(module);

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Added ${module.type} (${module.rarity}) to inventory (${this.moduleInventory.length} total)`
      );
    }

    return true; // Module was added to inventory
  }

  /**
   * Sell a module for gold
   */
  public sellModule(module: ModuleItemData): boolean {
    // Use canonical sell values from ModuleItem
    const goldEarned = MODULE_SELL_VALUES[module.rarity as Rarity] || 50;

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
   * Upgrade a specific stat for a module slot
   * Cost = (currentLevel + 1) * 50 gold, capped by tank level
   */
  public upgradeSlotStat(slotIndex: number, statType: SlotStatType): boolean {
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

    // Get current level for this stat
    const currentLevel = this.getSlotStatLevel(slotIndex, statType);

    // Check tank level cap
    if (currentLevel >= this.tankLevel) {
      if (import.meta.env.DEV) {
        console.warn(
          `[GameState] Slot ${slotIndex} ${statType} at cap (${currentLevel}/${this.tankLevel})`
        );
      }
      return false;
    }

    // Calculate cost: (currentLevel + 1) * 50
    const cost = (currentLevel + 1) * 50;

    // Check if player can afford
    if (!this.spendGold(cost, 'upgrade')) {
      return false;
    }

    // Upgrade the stat
    switch (statType) {
      case SlotStatType.Damage:
        slot.stats.damageLevel += 1;
        break;
      case SlotStatType.AttackSpeed:
        slot.stats.attackSpeedLevel += 1;
        break;
      case SlotStatType.CDR:
        slot.stats.cdrLevel += 1;
        break;
    }

    // Emit event so UI can update
    this.eventManager.emit(GameEvents.SLOT_STAT_UPGRADED, {
      slotIndex,
      statType,
      newLevel: this.getSlotStatLevel(slotIndex, statType),
      cost,
    });

    if (import.meta.env.DEV) {
      console.log(
        `[GameState] Upgraded slot ${slotIndex} ${statType} to level ${this.getSlotStatLevel(slotIndex, statType)} for ${cost} gold`
      );
    }

    return true;
  }

  /**
   * Get the current level of a specific slot stat
   */
  public getSlotStatLevel(slotIndex: number, statType: SlotStatType): number {
    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.stats) return 0;

    switch (statType) {
      case SlotStatType.Damage:
        return slot.stats.damageLevel ?? 0;
      case SlotStatType.AttackSpeed:
        return slot.stats.attackSpeedLevel ?? 0;
      case SlotStatType.CDR:
        return slot.stats.cdrLevel ?? 0;
      default:
        return 0;
    }
  }

  /**
   * Get all slot stats for a slot
   */
  public getSlotStats(slotIndex: number): SlotStats | null {
    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.stats) return null;
    return { ...slot.stats };
  }

  /**
   * Get the upgrade cost for a specific slot stat
   * Cost = (currentLevel + 1) * 50
   */
  public getSlotStatUpgradeCost(slotIndex: number, statType: SlotStatType): number {
    const currentLevel = this.getSlotStatLevel(slotIndex, statType);
    return (currentLevel + 1) * 50;
  }

  /**
   * Check if a slot stat can be upgraded (unlocked and not at cap)
   */
  public canUpgradeSlotStat(slotIndex: number, statType: SlotStatType): boolean {
    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.unlocked) return false;
    const currentLevel = this.getSlotStatLevel(slotIndex, statType);
    return currentLevel < this.tankLevel;
  }

  /**
   * Get the bonus percentage for a slot stat
   * Returns 1% per level
   */
  public getSlotStatBonus(slotIndex: number, statType: SlotStatType): number {
    return this.getSlotStatLevel(slotIndex, statType);
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

    this.eventManager.emit(GameEvents.SLOT_UNLOCKED, {
      slotIndex,
      cost,
    });

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

    // Update highest progress if we've reached a new zone
    this.updateHighestProgress();

    if (import.meta.env.DEV) {
      console.log(`[GameState] Advanced to Act ${this.currentAct}, Zone ${this.currentZone}`);
    }
  }

  /**
   * Set the current zone directly (for zone selection UI)
   * Only allows selecting zones that have been previously reached
   *
   * @returns true if zone was changed, false if zone is locked
   */
  public setZone(act: number, zone: number): boolean {
    // Validate act and zone bounds
    if (act < 1 || act > GAME_CONFIG.TOTAL_ACTS || zone < 1 || zone > GAME_CONFIG.ZONES_PER_ACT) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Invalid zone selection: Act ${act}, Zone ${zone}`);
      }
      return false;
    }

    // Check if this zone is unlocked (accessible)
    if (!this.isZoneUnlocked(act, zone)) {
      if (import.meta.env.DEV) {
        console.warn(`[GameState] Zone is locked: Act ${act}, Zone ${zone}`);
      }
      return false;
    }

    // Store previous values for event
    const previousAct = this.currentAct;
    const previousZone = this.currentZone;

    // Don't change if already at this zone
    if (previousAct === act && previousZone === zone) {
      return false;
    }

    // Update to new zone
    this.currentAct = act;
    this.currentZone = zone;
    this.currentWave = 1; // Reset to wave 1 when changing zones

    // Emit zone changed event
    this.eventManager.emit(GameEvents.ZONE_CHANGED, {
      previousAct,
      previousZone,
      newAct: act,
      newZone: zone,
    });

    if (import.meta.env.DEV) {
      console.log(`[GameState] Zone changed: Act ${previousAct}-${previousZone} -> Act ${act}-${zone}`);
    }

    return true;
  }

  /**
   * Check if a zone is unlocked (accessible for replay)
   * A zone is unlocked if:
   * - It's Act 1 Zone 1 (always unlocked)
   * - Player has reached or passed this zone before
   */
  public isZoneUnlocked(act: number, zone: number): boolean {
    // Act 1 Zone 1 is always unlocked
    if (act === 1 && zone === 1) {
      return true;
    }

    // If this act is before the highest act, all zones in it are unlocked
    if (act < this.highestAct) {
      return true;
    }

    // If this is the highest act, only zones up to highestZone are unlocked
    if (act === this.highestAct) {
      return zone <= this.highestZone;
    }

    // Acts beyond highest are locked
    return false;
  }

  /**
   * Update highest progression when completing zones
   * Called internally when zone completion advances past current highest
   */
  private updateHighestProgress(): void {
    // Check if current position is ahead of highest
    const currentAhead =
      this.currentAct > this.highestAct ||
      (this.currentAct === this.highestAct && this.currentZone > this.highestZone);

    if (currentAhead) {
      this.highestAct = this.currentAct;
      this.highestZone = this.currentZone;

      if (import.meta.env.DEV) {
        console.log(`[GameState] New highest progress: Act ${this.highestAct}, Zone ${this.highestZone}`);
      }
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
        highestAct: this.highestAct,
        highestZone: this.highestZone,
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

    // Migrate old slot format (level) to new format (stats)
    this.moduleSlots = data.modules.slots.map((slot) => {
      // Check if slot has old format (level) or new format (stats)
      const slotData = slot as unknown as Record<string, unknown>;
      if (slotData.stats && typeof slotData.stats === 'object') {
        // New format - use as-is
        return { ...slot } as ModuleSlotData;
      } else {
        // Old format - migrate level to stats
        const oldLevel = (slotData.level as number) ?? 0;
        return {
          index: slot.index,
          stats: {
            damageLevel: oldLevel,
            attackSpeedLevel: 0,
            cdrLevel: 0,
          },
          equipped: slot.equipped,
          unlocked: slot.unlocked,
        } as ModuleSlotData;
      }
    });

    // Migration: Ensure slots 0 and 1 are always unlocked (center tank design)
    // This fixes saves from before the free starter slots change
    if (this.moduleSlots[0]) this.moduleSlots[0].unlocked = true;
    if (this.moduleSlots[1]) this.moduleSlots[1].unlocked = true;

    this.moduleInventory = data.modules.inventory.map((module) => ({ ...module }));

    this.currentAct = data.progression.currentAct;
    this.currentZone = data.progression.currentZone;
    this.currentWave = data.progression.currentWave;
    // Backwards compatibility: if highestAct/Zone don't exist, use currentAct/Zone
    this.highestAct = data.progression.highestAct ?? data.progression.currentAct;
    this.highestZone = data.progression.highestZone ?? data.progression.currentZone;
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
