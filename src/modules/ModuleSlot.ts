import { ModuleSlotData, ModuleItemData } from '../types/ModuleTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';

/**
 * ModuleSlot - Container for equipped modules
 *
 * Each tank has up to 5 module slots (index 0-4).
 * Slots have their own level (1-160) that provides damage multiplier.
 * Slots can hold one ModuleItem at a time.
 *
 * Unlock costs:
 * - Slot 0: Free
 * - Slot 1: 10,000 Gold
 * - Slot 2: 50,000 Gold
 * - Slot 3: 200,000 Gold
 * - Slot 4: 1,000,000 Gold
 */
export class ModuleSlot {
  private data: ModuleSlotData;
  private eventManager: EventManager;

  // Unlock costs per slot index
  private static readonly UNLOCK_COSTS: number[] = [0, 10000, 50000, 200000, 1000000];

  // Upgrade cost = current level * 100
  private static readonly UPGRADE_COST_MULTIPLIER = 100;

  constructor(index: number, unlocked: boolean = false) {
    this.eventManager = getEventManager();

    this.data = {
      index,
      level: 1,
      equipped: null,
      unlocked: index === 0 ? true : unlocked, // Slot 0 is always unlocked
    };
  }

  /**
   * Get the slot index (0-4)
   */
  public getIndex(): number {
    return this.data.index;
  }

  /**
   * Get current slot level
   */
  public getLevel(): number {
    return this.data.level;
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
   * Get the cost to upgrade this slot to the next level
   */
  public getUpgradeCost(): number {
    return this.data.level * ModuleSlot.UPGRADE_COST_MULTIPLIER;
  }

  /**
   * Upgrade slot level (capped by tank level)
   */
  public upgrade(tankLevel: number): boolean {
    if (!this.data.unlocked) return false;
    if (this.data.level >= tankLevel) return false;

    this.data.level++;

    this.eventManager.emit(GameEvents.SLOT_UPGRADED, {
      slotIndex: this.data.index,
      newLevel: this.data.level,
      cost: this.getUpgradeCost(),
    });

    return true;
  }

  /**
   * Get the damage multiplier from slot level
   * Formula: 1 + (slotLevel * 0.01)
   * Level 1 = 1.01x, Level 100 = 2.0x, Level 160 = 2.6x
   */
  public getDamageMultiplier(): number {
    return 1 + this.data.level * 0.01;
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
