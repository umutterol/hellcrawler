import { ModuleSlotData, ModuleItemData, SlotStats, SlotStatType } from '../types/ModuleTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';

/**
 * ModuleSlot - Container for equipped modules
 *
 * Each tank has up to 5 module slots (index 0-4).
 * Slots have per-stat upgrades (damage, attackSpeed, CDR) that provide bonuses.
 * Slots can hold one ModuleItem at a time.
 *
 * Center Tank Layout:
 * - Slot 0 (Front): Free, attacks RIGHT
 * - Slot 1 (Back): Free, attacks LEFT
 * - Slot 2 (Front): 10,000 Gold, attacks RIGHT
 * - Slot 3 (Back): 20,000 Gold, attacks LEFT
 * - Slot 4 (Center): 75,000 Gold + Act 6, attacks BOTH
 */
export class ModuleSlot {
  private data: ModuleSlotData;
  private eventManager: EventManager;

  // Unlock costs per slot index (slots 0 and 1 are free)
  private static readonly UNLOCK_COSTS: number[] = [0, 0, 10000, 20000, 75000];

  // Upgrade cost = (current level + 1) * 50
  private static readonly UPGRADE_COST_MULTIPLIER = 50;

  constructor(index: number, unlocked: boolean = false) {
    this.eventManager = getEventManager();

    this.data = {
      index,
      stats: {
        damageLevel: 0,
        attackSpeedLevel: 0,
        cdrLevel: 0,
      },
      equipped: null,
      // Slots 0 (front) and 1 (back) are always unlocked for bidirectional combat
      unlocked: index === 0 || index === 1 ? true : unlocked,
    };
  }

  /**
   * Get the slot index (0-4)
   */
  public getIndex(): number {
    return this.data.index;
  }

  /**
   * Get current slot stats
   */
  public getStats(): SlotStats {
    return { ...this.data.stats };
  }

  /**
   * Get a specific stat level
   */
  public getStatLevel(statType: SlotStatType): number {
    switch (statType) {
      case SlotStatType.Damage:
        return this.data.stats.damageLevel;
      case SlotStatType.AttackSpeed:
        return this.data.stats.attackSpeedLevel;
      case SlotStatType.CDR:
        return this.data.stats.cdrLevel;
      default:
        return 0;
    }
  }

  /**
   * Check if slot is unlocked
   */
  public isUnlocked(): boolean {
    return this.data.unlocked;
  }

  /**
   * Get the cost to unlock this slot
   */
  public getUnlockCost(): number {
    return ModuleSlot.UNLOCK_COSTS[this.data.index] ?? 0;
  }

  /**
   * Unlock this slot
   */
  public unlock(): boolean {
    if (this.data.unlocked) return false;

    this.data.unlocked = true;

    this.eventManager.emit(GameEvents.SLOT_UNLOCKED, {
      slotIndex: this.data.index,
      cost: this.getUnlockCost(),
    });

    return true;
  }

  /**
   * Get the cost to upgrade a specific stat to the next level
   */
  public getStatUpgradeCost(statType: SlotStatType): number {
    const currentLevel = this.getStatLevel(statType);
    return (currentLevel + 1) * ModuleSlot.UPGRADE_COST_MULTIPLIER;
  }

  /**
   * Upgrade a specific stat (capped by tank level)
   */
  public upgradeStat(statType: SlotStatType, tankLevel: number): boolean {
    if (!this.data.unlocked) return false;

    const currentLevel = this.getStatLevel(statType);
    if (currentLevel >= tankLevel) return false;

    // Increment the stat
    switch (statType) {
      case SlotStatType.Damage:
        this.data.stats.damageLevel++;
        break;
      case SlotStatType.AttackSpeed:
        this.data.stats.attackSpeedLevel++;
        break;
      case SlotStatType.CDR:
        this.data.stats.cdrLevel++;
        break;
    }

    this.eventManager.emit(GameEvents.SLOT_STAT_UPGRADED, {
      slotIndex: this.data.index,
      statType,
      newLevel: this.getStatLevel(statType),
      cost: this.getStatUpgradeCost(statType),
    });

    return true;
  }

  /**
   * Get the damage multiplier from slot damage level
   * Formula: 1 + (damageLevel * 0.01)
   * Level 0 = 1.0x, Level 100 = 2.0x
   */
  public getDamageMultiplier(): number {
    return 1 + this.data.stats.damageLevel * 0.01;
  }

  /**
   * Get the attack speed multiplier from slot attackSpeed level
   * Formula: 1 + (attackSpeedLevel * 0.01)
   */
  public getAttackSpeedMultiplier(): number {
    return 1 + this.data.stats.attackSpeedLevel * 0.01;
  }

  /**
   * Get the cooldown reduction percentage from slot CDR level
   * Returns percentage (e.g., 10 for 10% CDR)
   */
  public getCDRBonus(): number {
    return this.data.stats.cdrLevel;
  }

  /**
   * Set slot stats (used to sync with GameState after upgrades)
   */
  public setStats(stats: SlotStats): void {
    this.data.stats = { ...stats };
  }

  /**
   * Get currently equipped module
   */
  public getEquipped(): ModuleItemData | null {
    return this.data.equipped;
  }

  /**
   * Check if slot has a module equipped
   */
  public hasModule(): boolean {
    return this.data.equipped !== null;
  }

  /**
   * Equip a module to this slot
   * Returns the previously equipped module (if any)
   */
  public equip(module: ModuleItemData): ModuleItemData | null {
    if (!this.data.unlocked) return null;

    const previousModule = this.data.equipped;
    this.data.equipped = module;

    this.eventManager.emit(GameEvents.MODULE_EQUIPPED, {
      slotIndex: this.data.index,
      moduleId: module.id,
      moduleType: module.type,
      previousModuleId: previousModule?.id ?? null,
    });

    return previousModule;
  }

  /**
   * Unequip the current module
   * Returns the unequipped module
   */
  public unequip(): ModuleItemData | null {
    if (!this.data.equipped) return null;

    const module = this.data.equipped;
    this.data.equipped = null;

    this.eventManager.emit(GameEvents.MODULE_UNEQUIPPED, {
      slotIndex: this.data.index,
      moduleId: module.id,
      moduleType: module.type,
    });

    return module;
  }

  /**
   * Get full slot data for serialization
   */
  public getData(): ModuleSlotData {
    return { ...this.data };
  }

  /**
   * Load slot data from save
   */
  public loadData(data: ModuleSlotData): void {
    this.data = { ...data };
  }
}
