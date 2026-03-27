/**
 * InventoryStore - Manages module slots and inventory
 *
 * Extracted from monolithic GameState. Handles:
 * - Module slot equipment and unlocking
 * - Module inventory management
 * - Slot stat upgrades
 * - Module selling and auto-sell
 */

import { Rarity } from '../types/GameTypes';
import { ModuleSlotData, ModuleItemData, SlotStatType, SlotStats } from '../types/ModuleTypes';
import { MODULE_SELL_VALUES } from '../modules/ModuleItem';
import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';
import { getSettingsManager } from '../managers/SettingsManager';
import { BaseStore } from './BaseStore';
import { getEconomyStore } from './EconomyStore';
import { getTankStore } from './TankStore';

export interface InventoryStoreData {
  slots: ModuleSlotData[];
  inventory: ModuleItemData[];
  equipped: (ModuleItemData | null)[];
}

export class InventoryStore extends BaseStore<InventoryStoreData> {
  private static instance: InventoryStore | null = null;

  private moduleSlots: ModuleSlotData[];
  private moduleInventory: ModuleItemData[];

  private constructor() {
    super('inventory');
    const defaults = InventoryStore.getDefaults();
    this.moduleSlots = defaults.slots.map((slot) => ({ ...slot }));
    this.moduleInventory = [];
  }

  public static getInstance(): InventoryStore {
    if (!InventoryStore.instance) {
      InventoryStore.instance = new InventoryStore();
    }
    return InventoryStore.instance;
  }

  public static getDefaults(): InventoryStoreData {
    return {
      slots: [
        { index: 0, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: true },
        { index: 1, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: true },
        { index: 2, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: false },
        { index: 3, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: false },
        { index: 4, stats: { damageLevel: 0, attackSpeedLevel: 0, cdrLevel: 0 }, equipped: null, unlocked: false },
      ],
      inventory: [],
      equipped: [null, null, null, null, null],
    };
  }

  // ============================================================================
  // MODULE EQUIPMENT
  // ============================================================================

  public equipModule(slotIndex: number, module: ModuleItemData): boolean {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Invalid slot index: ${slotIndex}`);
      }
      return false;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Slot not found at index: ${slotIndex}`);
      }
      return false;
    }

    if (!slot.unlocked) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Slot ${slotIndex} is not unlocked`);
      }
      return false;
    }

    const previousModule = slot.equipped;
    if (previousModule) {
      this.moduleInventory.push(previousModule);
    }

    slot.equipped = module;

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

    this.emitChange('equipped');

    if (import.meta.env.DEV) {
      console.log(
        `[InventoryStore] Equipped ${module.type} (${module.rarity}) to slot ${slotIndex}${
          previousModule ? `, replaced ${previousModule.type}` : ''
        }`
      );
    }

    return true;
  }

  public equipModuleDirectly(slotIndex: number, module: ModuleItemData): void {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      return;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.unlocked) {
      return;
    }

    slot.equipped = module;

    if (import.meta.env.DEV) {
      console.log(`[InventoryStore] equipModuleDirectly: slot ${slotIndex} = ${module.type}`);
    }
  }

  public unequipModule(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Invalid slot index: ${slotIndex}`);
      }
      return false;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Slot not found at index: ${slotIndex}`);
      }
      return false;
    }

    if (!slot.equipped) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Slot ${slotIndex} is already empty`);
      }
      return false;
    }

    const unequippedModule = slot.equipped;

    this.moduleInventory.push(slot.equipped);
    slot.equipped = null;

    this.eventManager.emit(GameEvents.MODULE_UNEQUIPPED, {
      moduleId: unequippedModule.id,
      moduleType: unequippedModule.type,
      slotIndex,
    });

    this.emitChange('equipped');

    if (import.meta.env.DEV) {
      console.log(`[InventoryStore] Unequipped module from slot ${slotIndex}`);
    }

    return true;
  }

  // ============================================================================
  // INVENTORY MANAGEMENT
  // ============================================================================

  public addToInventory(module: ModuleItemData, dropPosition?: { x: number; y: number }): boolean {
    const settings = getSettingsManager();
    if (settings.autoSellUncommon && module.rarity === Rarity.Uncommon) {
      const goldEarned = MODULE_SELL_VALUES[Rarity.Uncommon] || 50;
      const economyStore = getEconomyStore();
      economyStore.addGold(goldEarned, 'module_sold');

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
          `[InventoryStore] Auto-sold ${module.type} (${module.rarity}) for ${goldEarned} gold`
        );
      }

      return false;
    }

    this.moduleInventory.push(module);
    this.emitChange('inventory');

    if (import.meta.env.DEV) {
      console.log(
        `[InventoryStore] Added ${module.type} (${module.rarity}) to inventory (${this.moduleInventory.length} total)`
      );
    }

    return true;
  }

  public sellModule(module: ModuleItemData): boolean {
    const goldEarned = MODULE_SELL_VALUES[module.rarity as Rarity] || 50;

    const inventoryIndex = this.moduleInventory.findIndex((m) => m.id === module.id);
    if (inventoryIndex !== -1) {
      this.moduleInventory.splice(inventoryIndex, 1);
      const economyStore = getEconomyStore();
      economyStore.addGold(goldEarned, 'module_sold');

      this.eventManager.emit(GameEvents.MODULE_SOLD, {
        moduleId: module.id,
        rarity: module.rarity,
        goldEarned,
      });

      this.emitChange('inventory');

      if (import.meta.env.DEV) {
        console.log(`[InventoryStore] Sold ${module.type} (${module.rarity}) for ${goldEarned} gold`);
      }

      return true;
    }

    if (import.meta.env.DEV) {
      console.warn(`[InventoryStore] Module ${module.id} not found in inventory`);
    }

    return false;
  }

  // ============================================================================
  // SLOT STAT UPGRADES
  // ============================================================================

  public upgradeSlotStat(slotIndex: number, statType: SlotStatType): boolean {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Invalid slot index: ${slotIndex}`);
      }
      return false;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.unlocked) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Slot ${slotIndex} not found or not unlocked`);
      }
      return false;
    }

    const currentLevel = this.getSlotStatLevel(slotIndex, statType);
    const tankStore = getTankStore();

    if (currentLevel >= tankStore.getTankLevel()) {
      if (import.meta.env.DEV) {
        console.warn(
          `[InventoryStore] Slot ${slotIndex} ${statType} at cap (${currentLevel}/${tankStore.getTankLevel()})`
        );
      }
      return false;
    }

    const cost = (currentLevel + 1) * 50;
    const economyStore = getEconomyStore();

    if (!economyStore.spendGold(cost, 'upgrade')) {
      return false;
    }

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

    this.eventManager.emit(GameEvents.SLOT_STAT_UPGRADED, {
      slotIndex,
      statType,
      newLevel: this.getSlotStatLevel(slotIndex, statType),
      cost,
    });

    this.emitChange('slotStats');

    if (import.meta.env.DEV) {
      console.log(
        `[InventoryStore] Upgraded slot ${slotIndex} ${statType} to level ${this.getSlotStatLevel(slotIndex, statType)} for ${cost} gold`
      );
    }

    return true;
  }

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

  public getSlotStats(slotIndex: number): SlotStats | null {
    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.stats) return null;
    return { ...slot.stats };
  }

  public getSlotStatUpgradeCost(slotIndex: number, statType: SlotStatType): number {
    const currentLevel = this.getSlotStatLevel(slotIndex, statType);
    return (currentLevel + 1) * 50;
  }

  public canUpgradeSlotStat(slotIndex: number, statType: SlotStatType): boolean {
    const slot = this.moduleSlots[slotIndex];
    if (!slot || !slot.unlocked) return false;
    const currentLevel = this.getSlotStatLevel(slotIndex, statType);
    const tankStore = getTankStore();
    return currentLevel < tankStore.getTankLevel();
  }

  public getSlotStatBonus(slotIndex: number, statType: SlotStatType): number {
    return this.getSlotStatLevel(slotIndex, statType);
  }

  // ============================================================================
  // SLOT UNLOCKING
  // ============================================================================

  public unlockSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.moduleSlots.length) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Invalid slot index: ${slotIndex}`);
      }
      return false;
    }

    const slot = this.moduleSlots[slotIndex];
    if (!slot) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Slot not found at index: ${slotIndex}`);
      }
      return false;
    }

    if (slot.unlocked) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] Slot ${slotIndex} is already unlocked`);
      }
      return false;
    }

    const cost = GAME_CONFIG.SLOT_COSTS[slotIndex];
    if (cost === undefined) {
      if (import.meta.env.DEV) {
        console.warn(`[InventoryStore] No cost defined for slot ${slotIndex}`);
      }
      return false;
    }

    const economyStore = getEconomyStore();
    if (!economyStore.spendGold(cost, 'purchase')) {
      return false;
    }

    slot.unlocked = true;

    this.eventManager.emit(GameEvents.SLOT_UNLOCKED, {
      slotIndex,
      cost,
    });

    this.emitChange('slots');

    if (import.meta.env.DEV) {
      console.log(`[InventoryStore] Unlocked slot ${slotIndex} for ${cost} gold`);
    }

    return true;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getModuleSlots(): readonly Readonly<ModuleSlotData>[] {
    return this.moduleSlots.map((slot) => ({ ...slot }));
  }

  public getModuleInventory(): readonly Readonly<ModuleItemData>[] {
    return this.moduleInventory.map((module) => ({ ...module }));
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  public serialize(): InventoryStoreData {
    return {
      slots: this.moduleSlots.map((slot) => ({
        ...slot,
        equipped: slot.equipped ? { ...slot.equipped } : null,
      })),
      inventory: this.moduleInventory.map((module) => ({ ...module })),
      equipped: this.moduleSlots.map((slot) =>
        slot.equipped ? { ...slot.equipped } : null
      ),
    };
  }

  public deserialize(data: InventoryStoreData): void {
    // Migrate old slot format (level) to new format (stats)
    this.moduleSlots = data.slots.map((slot) => {
      const slotData = slot as unknown as Record<string, unknown>;
      if (slotData.stats && typeof slotData.stats === 'object') {
        return { ...slot } as ModuleSlotData;
      } else {
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

    // Ensure slots 0 and 1 are always unlocked (center tank design)
    if (this.moduleSlots[0]) this.moduleSlots[0].unlocked = true;
    if (this.moduleSlots[1]) this.moduleSlots[1].unlocked = true;

    this.moduleInventory = data.inventory.map((module) => ({ ...module }));
  }

  public reset(): void {
    const defaults = InventoryStore.getDefaults();
    this.moduleSlots = defaults.slots.map((slot) => ({ ...slot }));
    this.moduleInventory = [];
  }
}

export function getInventoryStore(): InventoryStore {
  return InventoryStore.getInstance();
}
