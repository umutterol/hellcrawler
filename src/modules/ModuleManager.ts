import Phaser from 'phaser';
import { ModuleSlot } from './ModuleSlot';
import { ModuleItem } from './ModuleItem';
import { BaseModule } from './BaseModule';
import { createModule } from './ModuleFactory';
import { ModuleItemData, ModuleType } from '../types/ModuleTypes';
import { Rarity } from '../types/GameTypes';
import { GameState } from '../state/GameState';
import { Enemy } from '../entities/Enemy';
import { EventManager, getEventManager } from '../managers/EventManager';
import {
  GameEvents,
  ModuleEquippedPayload,
  ModuleUnequippedPayload,
  SlotStatUpgradedPayload,
} from '../types/GameEvents';
import { GAME_CONFIG, SlotDirection } from '../config/GameConfig';

/**
 * ModuleManager - Manages the module slot system
 *
 * Handles:
 * - 5 module slots (index 0-4)
 * - Equipping/unequipping modules
 * - Creating active module instances
 * - Updating all active modules
 * - Skill activation
 */
export class ModuleManager {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private eventManager: EventManager;

  // Module slots (5 total)
  private slots: ModuleSlot[] = [];

  // Active module instances (one per equipped slot)
  private activeModules: Map<number, BaseModule> = new Map();

  // Inventory of unequipped modules
  private inventory: ModuleItem[] = [];

  // Position for modules (relative to tank)
  private tankX: number = 200;
  private tankY: number = 540;

  // Projectile group for modules to spawn bullets
  private projectileGroup: Phaser.GameObjects.Group | null = null;

  // Constants
  private static readonly MAX_SLOTS = 5;
  private static readonly MAX_INVENTORY = 50;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.eventManager = getEventManager();

    // Initialize slots
    this.initializeSlots();

    // Setup event listeners for UI-initiated equip/unequip
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for module equip/unequip events from UI
   */
  private setupEventListeners(): void {
    this.eventManager.on(GameEvents.MODULE_EQUIPPED, this.onModuleEquipped, this);
    this.eventManager.on(GameEvents.MODULE_UNEQUIPPED, this.onModuleUnequipped, this);
    this.eventManager.on(GameEvents.SLOT_STAT_UPGRADED, this.onSlotStatUpgraded, this);
  }

  /**
   * Handle module equipped event from GameState/UI
   * Creates the active module instance so it can fire and use skills
   */
  private onModuleEquipped(payload: ModuleEquippedPayload): void {
    const { slotIndex, moduleId } = payload;

    if (import.meta.env.DEV) {
      console.log(`[ModuleManager] onModuleEquipped: slot ${slotIndex}, module ${moduleId}`);
    }

    // Skip if active module already exists for this slot
    // (direct equip via equipModule() already created it)
    const existingActive = this.activeModules.get(slotIndex);
    if (existingActive) {
      if (import.meta.env.DEV) {
        console.log(`[ModuleManager] Active module already exists for slot ${slotIndex}, skipping`);
      }
      return;
    }

    // Get the module data from GameState (for UI-initiated equips via InventoryPanel)
    const slot = this.gameState.getModuleSlots()[slotIndex];
    if (!slot || !slot.equipped) {
      if (import.meta.env.DEV) {
        console.warn(`[ModuleManager] No module data found in GameState for slot ${slotIndex}`);
      }
      return;
    }

    const moduleData = slot.equipped;
    if (moduleData.id !== moduleId) {
      if (import.meta.env.DEV) {
        console.warn(`[ModuleManager] Module ID mismatch: expected ${moduleId}, got ${moduleData.id}`);
      }
      return;
    }

    // Destroy existing active module if any
    const existingModule = this.activeModules.get(slotIndex);
    if (existingModule) {
      existingModule.destroy();
      this.activeModules.delete(slotIndex);
    }

    // Create new active module
    const newModule = createModule(
      this.scene,
      moduleData,
      slotIndex,
      slot.stats,
      this.gameState
    );

    if (newModule) {
      newModule.setPosition(this.tankX, this.tankY);
      if (this.projectileGroup) {
        newModule.setProjectileGroup(this.projectileGroup);
      }
      this.activeModules.set(slotIndex, newModule);

      if (import.meta.env.DEV) {
        console.log(`[ModuleManager] Created active module for slot ${slotIndex}: ${moduleData.type}`);
      }
    }
  }

  /**
   * Handle module unequipped event from GameState/UI
   * Destroys the active module instance
   */
  private onModuleUnequipped(payload: ModuleUnequippedPayload): void {
    const { slotIndex } = payload;

    if (import.meta.env.DEV) {
      console.log(`[ModuleManager] onModuleUnequipped: slot ${slotIndex}`);
    }

    // Destroy active module
    const activeModule = this.activeModules.get(slotIndex);
    if (activeModule) {
      activeModule.destroy();
      this.activeModules.delete(slotIndex);

      if (import.meta.env.DEV) {
        console.log(`[ModuleManager] Destroyed active module for slot ${slotIndex}`);
      }
    }
  }

  /**
   * Handle slot stat upgraded event from GameState
   * Syncs the ModuleSlot and active module with the new stats
   */
  private onSlotStatUpgraded(payload: SlotStatUpgradedPayload): void {
    const { slotIndex, statType, newLevel } = payload;

    if (import.meta.env.DEV) {
      console.log(`[ModuleManager] onSlotStatUpgraded: slot ${slotIndex}, ${statType} -> ${newLevel}`);
    }

    // Get updated stats from GameState
    const gameStateSlots = this.gameState.getModuleSlots();
    const gameStateSlot = gameStateSlots[slotIndex];
    if (!gameStateSlot || !gameStateSlot.stats) return;

    // Update the ModuleSlot's stats
    const slot = this.slots[slotIndex];
    if (slot) {
      slot.setStats(gameStateSlot.stats);
    }

    // Update the active module's slot stats
    this.updateModuleSlotStats(slotIndex);
  }

  /**
   * Set the projectile group for modules to use
   */
  public setProjectileGroup(group: Phaser.GameObjects.Group): void {
    this.projectileGroup = group;

    // Update existing modules
    for (const module of this.activeModules.values()) {
      module.setProjectileGroup(group);
    }
  }

  /**
   * Initialize the 5 module slots
   * Slots 0 (front) and 1 (back) are always unlocked for bidirectional combat
   */
  private initializeSlots(): void {
    for (let i = 0; i < ModuleManager.MAX_SLOTS; i++) {
      // Slots 0 and 1 start unlocked
      const slot = new ModuleSlot(i, i === 0 || i === 1);
      this.slots.push(slot);
    }
  }

  /**
   * Set tank position for module positioning
   */
  public setTankPosition(x: number, y: number): void {
    this.tankX = x;
    this.tankY = y;

    // Update all active modules
    for (const module of this.activeModules.values()) {
      module.setPosition(x, y);
    }
  }

  /**
   * Get all slots
   */
  public getSlots(): ModuleSlot[] {
    return [...this.slots];
  }

  /**
   * Get a specific slot
   */
  public getSlot(index: number): ModuleSlot | null {
    return this.slots[index] ?? null;
  }

  /**
   * Check if a slot is unlocked
   */
  public isSlotUnlocked(index: number): boolean {
    return this.slots[index]?.isUnlocked() ?? false;
  }

  /**
   * Unlock a slot (requires gold payment handled externally)
   */
  public unlockSlot(index: number): boolean {
    const slot = this.slots[index];
    if (!slot) return false;

    return slot.unlock();
  }

  /**
   * Update active module's slot stats (called when slot stats are upgraded)
   */
  public updateModuleSlotStats(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (!slot) return;

    const activeModule = this.activeModules.get(slotIndex);
    if (activeModule) {
      activeModule.setSlotStats(slot.getStats());
    }
  }

  /**
   * Equip a module to a slot
   * Returns the previously equipped module (if any)
   */
  public equipModule(slotIndex: number, moduleItem: ModuleItem): ModuleItem | null {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.isUnlocked()) {
      return null;
    }

    // Remove from inventory
    const inventoryIndex = this.inventory.indexOf(moduleItem);
    if (inventoryIndex !== -1) {
      this.inventory.splice(inventoryIndex, 1);
    }

    // Destroy existing active module
    const existingModule = this.activeModules.get(slotIndex);
    if (existingModule) {
      existingModule.destroy();
      this.activeModules.delete(slotIndex);
    }

    // Create new active module BEFORE equipping to slot
    // This ensures activeModules is populated before MODULE_EQUIPPED event fires
    const newModule = createModule(
      this.scene,
      moduleItem.getData(),
      slotIndex,
      slot.getStats(),
      this.gameState
    );

    if (newModule) {
      newModule.setPosition(this.tankX, this.tankY);
      if (this.projectileGroup) {
        newModule.setProjectileGroup(this.projectileGroup);
      }
      this.activeModules.set(slotIndex, newModule);
    }

    // Equip to slot (this emits MODULE_EQUIPPED event)
    // The event handler will skip since activeModules already has an entry
    const previousData = slot.equip(moduleItem.getData());

    // Also update GameState to persist the equipped module for UI panels
    // This ensures InventoryPanel and other UI can see the equipped module
    this.gameState.equipModuleDirectly(slotIndex, moduleItem.getData());

    // Return previous module as ModuleItem if there was one
    if (previousData) {
      const previousItem = new ModuleItem(previousData);
      this.addToInventory(previousItem);
      return previousItem;
    }

    return null;
  }

  /**
   * Unequip a module from a slot
   */
  public unequipModule(slotIndex: number): ModuleItem | null {
    const slot = this.slots[slotIndex];
    if (!slot) return null;

    // Destroy active module
    const activeModule = this.activeModules.get(slotIndex);
    if (activeModule) {
      activeModule.destroy();
      this.activeModules.delete(slotIndex);
    }

    // Unequip from slot
    const moduleData = slot.unequip();
    if (moduleData) {
      const moduleItem = new ModuleItem(moduleData);
      this.addToInventory(moduleItem);
      return moduleItem;
    }

    return null;
  }

  /**
   * Add a module to inventory
   */
  public addToInventory(moduleItem: ModuleItem): boolean {
    if (this.inventory.length >= ModuleManager.MAX_INVENTORY) {
      if (import.meta.env.DEV) {
        console.warn('[ModuleManager] Inventory full!');
      }
      return false;
    }

    this.inventory.push(moduleItem);
    return true;
  }

  /**
   * Get inventory
   */
  public getInventory(): ModuleItem[] {
    return [...this.inventory];
  }

  /**
   * Generate and add a random module to inventory
   */
  public generateModule(type: ModuleType, rarity: Rarity): ModuleItem | null {
    const moduleItem = ModuleItem.generate(type, rarity);
    if (this.addToInventory(moduleItem)) {
      return moduleItem;
    }
    return null;
  }

  /**
   * Sell a module from inventory
   */
  public sellModule(moduleItem: ModuleItem): number {
    const index = this.inventory.indexOf(moduleItem);
    if (index === -1) return 0;

    this.inventory.splice(index, 1);
    const sellValue = moduleItem.getSellValue();

    this.eventManager.emit(GameEvents.MODULE_SOLD, {
      moduleId: moduleItem.getId(),
      rarity: moduleItem.getRarity() as 'uncommon' | 'rare' | 'epic' | 'legendary',
      goldEarned: sellValue,
    });

    return sellValue;
  }

  /**
   * Filter enemies based on slot direction for bidirectional combat
   * - Right-facing slots only target enemies from the right (moving left)
   * - Left-facing slots only target enemies from the left (moving right)
   * - Center slots target enemies from both sides
   */
  private filterEnemiesBySlotDirection(slotIndex: number, enemies: Enemy[]): Enemy[] {
    const direction = GAME_CONFIG.SLOT_DIRECTIONS[slotIndex];

    if (direction === SlotDirection.Both) {
      return enemies;
    }

    return enemies.filter(enemy => {
      const spawnSide = enemy.getSpawnSide();
      // Slot targets right → only enemies from right (spawn side 'right')
      // Slot targets left → only enemies from left (spawn side 'left')
      return direction === SlotDirection.Right
        ? spawnSide === 'right'
        : spawnSide === 'left';
    });
  }

  /**
   * Update all active modules
   * Modules only fire at enemies on their designated side (bidirectional combat)
   */
  public update(time: number, delta: number, enemies: Enemy[]): void {
    for (const [slotIndex, module] of this.activeModules) {
      // Update module state
      module.update(time, delta);

      // Filter enemies based on slot direction
      const targetableEnemies = this.filterEnemiesBySlotDirection(slotIndex, enemies);

      // Fire at enemies on this slot's side
      module.fire(time, targetableEnemies);
    }
  }

  /**
   * Activate a skill on a module
   * Filters enemies based on slot direction
   */
  public activateSkill(slotIndex: number, skillIndex: number, enemies: Enemy[]): boolean {
    const module = this.activeModules.get(slotIndex);
    if (!module) return false;

    // Filter enemies based on slot direction
    const targetableEnemies = this.filterEnemiesBySlotDirection(slotIndex, enemies);

    return module.activateSkill(skillIndex, targetableEnemies);
  }

  /**
   * Toggle auto-mode for a skill
   * @returns The new auto-mode state, or false if module not found
   */
  public toggleAutoMode(slotIndex: number, skillIndex: number): boolean {
    const module = this.activeModules.get(slotIndex);
    if (!module) return false;

    return module.toggleAutoMode(skillIndex);
  }

  /**
   * Check if auto-mode is enabled for a skill
   */
  public isAutoModeEnabled(slotIndex: number, skillIndex: number): boolean {
    const module = this.activeModules.get(slotIndex);
    if (!module) return false;

    return module.isAutoModeEnabled(skillIndex);
  }

  /**
   * Get active module for a slot
   */
  public getActiveModule(slotIndex: number): BaseModule | null {
    return this.activeModules.get(slotIndex) ?? null;
  }

  /**
   * Check if any skill is ready to use
   */
  public hasReadySkill(): boolean {
    for (const module of this.activeModules.values()) {
      if (!module.isSkillOnCooldown(0) || !module.isSkillOnCooldown(1)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get total stats from all equipped modules
   */
  public getTotalModuleStats(): Map<string, number> {
    const stats = new Map<string, number>();

    for (const slot of this.slots) {
      const equipped = slot.getEquipped();
      if (!equipped) continue;

      for (const stat of equipped.stats) {
        const current = stats.get(stat.type) ?? 0;
        stats.set(stat.type, current + stat.value);
      }
    }

    return stats;
  }

  /**
   * Load saved module data
   */
  public loadData(slotData: ModuleItemData[], inventoryData: ModuleItemData[]): void {
    // Clear existing
    this.activeModules.forEach((m) => m.destroy());
    this.activeModules.clear();
    this.inventory = [];

    // Load inventory
    for (const data of inventoryData) {
      this.inventory.push(new ModuleItem(data));
    }

    // Load slots
    for (let i = 0; i < slotData.length && i < this.slots.length; i++) {
      const data = slotData[i];
      if (data) {
        const slot = this.slots[i]!;
        slot.equip(data);

        // Create active module
        const module = createModule(
          this.scene,
          data,
          i,
          slot.getStats(),
          this.gameState
        );

        if (module) {
          module.setPosition(this.tankX, this.tankY);
          if (this.projectileGroup) {
            module.setProjectileGroup(this.projectileGroup);
          }
          this.activeModules.set(i, module);
        }
      }
    }
  }

  /**
   * Get save data
   */
  public getSaveData(): {
    slots: (ModuleItemData | null)[];
    inventory: ModuleItemData[];
  } {
    return {
      slots: this.slots.map((slot) => slot.getEquipped()),
      inventory: this.inventory.map((m) => m.getData()),
    };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // Remove event listeners
    this.eventManager.off(GameEvents.MODULE_EQUIPPED, this.onModuleEquipped, this);
    this.eventManager.off(GameEvents.MODULE_UNEQUIPPED, this.onModuleUnequipped, this);
    this.eventManager.off(GameEvents.SLOT_STAT_UPGRADED, this.onSlotStatUpgraded, this);

    this.activeModules.forEach((m) => m.destroy());
    this.activeModules.clear();
    this.inventory = [];
    this.slots = [];
  }
}
