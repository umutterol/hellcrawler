import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { getGameState, GameState } from '../../state/GameState';
import { EventManager, getEventManager } from '../../managers/EventManager';
import { GameEvents } from '../../types/GameEvents';
import { ModuleItemData, ModuleSlotData } from '../../types/ModuleTypes';
import { Rarity } from '../../types/GameTypes';
import { MODULE_SELL_VALUES } from '../../modules/ModuleItem';

/**
 * Selection type to track where the selected module is
 */
interface ModuleSelection {
  module: ModuleItemData;
  source: 'equipped' | 'inventory';
  slotIndex?: number; // Only set when source is 'equipped'
}

/**
 * InventoryPanel - Sliding panel for module inventory management
 *
 * Based on UISpec.md:
 * - View all modules in inventory
 * - Equipped modules shown at top (5 slots)
 * - 6-column grid for inventory
 * - Click to select, see details
 * - Equip/Unequip/Sell buttons
 */
export class InventoryPanel extends SlidingPanel {
  // Initialize after super() since these need GameState singleton
  private gameState: GameState = getGameState();
  private eventManager: EventManager = getEventManager();

  // UI Elements that need updating
  private equippedSlotContainers: Phaser.GameObjects.Container[] = [];

  // Selection state
  private selectedModule: ModuleSelection | null = null;

  // Action buttons
  private equipButton!: Phaser.GameObjects.Container;
  private unequipButton!: Phaser.GameObjects.Container;
  private sellButton!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.INVENTORY);
    this.setTitle('INVENTORY');
    this.initContent();
    this.subscribeToEvents();
  }

  /**
   * Subscribe to game events for inventory changes
   */
  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.MODULE_EQUIPPED, this.onModuleChanged, this);
    this.eventManager.on(GameEvents.MODULE_SOLD, this.onModuleChanged, this);
  }

  /**
   * Handle module changes (equip/sell)
   */
  private onModuleChanged(): void {
    if (this.isOpen) {
      this.rebuildContent();
    }
  }

  /**
   * Create the panel content
   */
  protected createContent(): void {
    this.createEquippedSection();
    this.createInventoryGrid();
    this.createDetailsSection();
  }

  /**
   * Rebuild all content when inventory changes
   */
  private rebuildContent(): void {
    // Clear selection if the selected module no longer exists
    if (this.selectedModule) {
      const stillExists = this.findModule(this.selectedModule.module.id);
      if (!stillExists) {
        this.selectedModule = null;
      }
    }

    // Clear and rebuild
    this.clearContent();
    this.equippedSlotContainers = [];
    this.createContent();
  }

  /**
   * Find a module by ID in equipped slots or inventory
   */
  private findModule(moduleId: string): ModuleSelection | null {
    const slots = this.gameState.getModuleSlots();
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot?.equipped?.id === moduleId) {
        return { module: slot.equipped, source: 'equipped', slotIndex: i };
      }
    }

    const inventory = this.gameState.getModuleInventory();
    for (const module of inventory) {
      if (module.id === moduleId) {
        return { module, source: 'inventory' };
      }
    }

    return null;
  }

  /**
   * Create the equipped modules section
   */
  private createEquippedSection(): void {
    const sectionContainer = this.scene.add.container(16, 0);
    const slots = this.gameState.getModuleSlots();

    // Section header
    const headerText = this.scene.add.text(0, 0, 'EQUIPPED MODULES', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionContainer.add(headerText);

    // Equipped slots (5 slots)
    const slotSize = 56;
    const slotSpacing = 8;
    const slotsY = 24;

    for (let i = 0; i < 5; i++) {
      const slot = slots[i];
      const slotX = i * (slotSize + slotSpacing);
      const slotContainer = this.createEquippedSlot(slot, i, slotX, slotsY, slotSize);
      sectionContainer.add(slotContainer);
      this.equippedSlotContainers.push(slotContainer);
    }

    this.addToContent(sectionContainer);
  }

  /**
   * Create an equipped module slot
   */
  private createEquippedSlot(
    slot: Readonly<ModuleSlotData> | undefined,
    index: number,
    x: number,
    y: number,
    size: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Determine if this slot is selected
    const isSelected =
      this.selectedModule?.source === 'equipped' && this.selectedModule?.slotIndex === index;

    // Slot background
    const slotBg = this.scene.add.graphics();
    const bgColor = slot?.equipped
      ? this.getRarityColorValue(slot.equipped.rarity)
      : 0x2d2d44;
    slotBg.fillStyle(bgColor, slot?.equipped ? 0.3 : 1);
    slotBg.fillRoundedRect(0, 0, size, size, 4);

    // Border - highlight if selected
    const borderColor = isSelected ? 0xffffff : UI_CONFIG.COLORS.PANEL_BORDER;
    const borderAlpha = isSelected ? 1 : 0.5;
    slotBg.lineStyle(isSelected ? 3 : 2, borderColor, borderAlpha);
    slotBg.strokeRoundedRect(0, 0, size, size, 4);
    container.add(slotBg);

    if (slot?.equipped) {
      // Module icon (first letter of type)
      const moduleType = slot.equipped.type;
      const iconText = moduleType.charAt(0).toUpperCase();
      const rarityColor = this.getRarityColorHex(slot.equipped.rarity);

      const moduleIcon = this.scene.add.text(size / 2, size / 2, iconText, {
        fontSize: '24px',
        color: rarityColor,
        fontStyle: 'bold',
      });
      moduleIcon.setOrigin(0.5);
      container.add(moduleIcon);

      // Rarity indicator bar at bottom
      const rarityBar = this.scene.add.graphics();
      rarityBar.fillStyle(this.getRarityColorValue(slot.equipped.rarity), 1);
      rarityBar.fillRect(4, size - 6, size - 8, 3);
      container.add(rarityBar);

      // Make clickable
      const hitArea = this.scene.add.rectangle(size / 2, size / 2, size, size);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.selectModule({ module: slot.equipped!, source: 'equipped', slotIndex: index });
      });
      container.add(hitArea);
    } else if (slot?.unlocked) {
      // Empty unlocked slot
      const emptyText = this.scene.add.text(size / 2, size / 2, `${index + 1}`, {
        fontSize: '18px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      emptyText.setOrigin(0.5);
      container.add(emptyText);
    } else {
      // Locked slot
      const lockText = this.scene.add.text(size / 2, size / 2 - 6, `${index + 1}`, {
        fontSize: '16px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      lockText.setOrigin(0.5);
      container.add(lockText);

      const lockIcon = this.scene.add.text(size / 2, size - 12, 'L', {
        fontSize: '12px',
        color: '#ff6666',
      });
      lockIcon.setOrigin(0.5);
      container.add(lockIcon);
    }

    return container;
  }

  /**
   * Create the inventory grid
   */
  private createInventoryGrid(): void {
    const inventory = this.gameState.getModuleInventory();
    const sectionContainer = this.scene.add.container(16, 100);

    // Section header with item count
    const inventoryHeaderText = this.scene.add.text(
      0,
      0,
      `INVENTORY (${inventory.length}/50)`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
        fontStyle: 'bold',
      }
    );
    sectionContainer.add(inventoryHeaderText);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionContainer.add(divider);

    // Grid parameters
    const cellSize = 52;
    const cellSpacing = 6;
    const gridY = 32;
    const cols = 6;
    const rows = 4;

    // Draw grid cells and modules
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellIndex = row * cols + col;
        const cellX = col * (cellSize + cellSpacing);
        const cellY = gridY + row * (cellSize + cellSpacing);
        const module = inventory[cellIndex];

        const cellContainer = this.createInventoryCell(cellX, cellY, cellSize, module, cellIndex);
        sectionContainer.add(cellContainer);
      }
    }

    // Empty state text (only show if inventory is empty)
    if (inventory.length === 0) {
      const emptyText = this.scene.add.text(
        this.getContentWidth() / 2 - 16,
        gridY + (rows * (cellSize + cellSpacing)) / 2,
        'No modules in inventory\nDefeat enemies to collect drops',
        {
          fontSize: '12px',
          color: UI_CONFIG.COLORS.TEXT_SECONDARY,
          align: 'center',
        }
      );
      emptyText.setOrigin(0.5);
      sectionContainer.add(emptyText);
    }

    this.addToContent(sectionContainer);
  }

  /**
   * Create an inventory grid cell
   */
  private createInventoryCell(
    x: number,
    y: number,
    size: number,
    module: Readonly<ModuleItemData> | undefined,
    _index: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Check if this cell is selected
    const isSelected =
      this.selectedModule?.source === 'inventory' &&
      module &&
      this.selectedModule.module.id === module.id;

    // Cell background
    const cellBg = this.scene.add.graphics();
    if (module) {
      cellBg.fillStyle(this.getRarityColorValue(module.rarity), 0.2);
    } else {
      cellBg.fillStyle(0x1a1a2e, 1);
    }
    cellBg.fillRoundedRect(0, 0, size, size, 4);

    // Border
    const borderColor = isSelected ? 0xffffff : UI_CONFIG.COLORS.PANEL_BORDER;
    const borderAlpha = isSelected ? 1 : 0.3;
    cellBg.lineStyle(isSelected ? 2 : 1, borderColor, borderAlpha);
    cellBg.strokeRoundedRect(0, 0, size, size, 4);
    container.add(cellBg);

    if (module) {
      // Module icon (first letter of type)
      const iconText = module.type.charAt(0).toUpperCase();
      const rarityColor = this.getRarityColorHex(module.rarity);

      const moduleIcon = this.scene.add.text(size / 2, size / 2 - 4, iconText, {
        fontSize: '20px',
        color: rarityColor,
        fontStyle: 'bold',
      });
      moduleIcon.setOrigin(0.5);
      container.add(moduleIcon);

      // Rarity indicator bar
      const rarityBar = this.scene.add.graphics();
      rarityBar.fillStyle(this.getRarityColorValue(module.rarity), 1);
      rarityBar.fillRect(4, size - 6, size - 8, 3);
      container.add(rarityBar);

      // Make clickable
      const hitArea = this.scene.add.rectangle(size / 2, size / 2, size, size);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.selectModule({ module: module as ModuleItemData, source: 'inventory' });
      });
      container.add(hitArea);
    }

    return container;
  }

  /**
   * Create the details/actions section
   */
  private createDetailsSection(): void {
    const sectionContainer = this.scene.add.container(16, 380);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 0, this.getContentWidth(), 0);
    sectionContainer.add(divider);

    if (this.selectedModule) {
      this.createModuleDetails(sectionContainer);
    } else {
      // Placeholder text
      const placeholderText = this.scene.add.text(0, 16, 'Select a module to view details', {
        fontSize: '12px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      sectionContainer.add(placeholderText);
      this.createDisabledButtons(sectionContainer);
    }

    this.addToContent(sectionContainer);
  }

  /**
   * Create module details display
   */
  private createModuleDetails(container: Phaser.GameObjects.Container): void {
    const module = this.selectedModule!.module;
    const rarityColor = this.getRarityColorHex(module.rarity);

    // Module name with rarity color
    const typeName = this.getModuleTypeName(module.type);
    const nameText = this.scene.add.text(0, 12, typeName, {
      fontSize: '16px',
      color: rarityColor,
      fontStyle: 'bold',
    });
    container.add(nameText);

    // Rarity badge
    const rarityName = module.rarity.charAt(0).toUpperCase() + module.rarity.slice(1);
    const rarityText = this.scene.add.text(0, 32, rarityName, {
      fontSize: '12px',
      color: rarityColor,
    });
    container.add(rarityText);

    // Stats
    let statsY = 52;
    if (module.stats && module.stats.length > 0) {
      for (const stat of module.stats) {
        const statName = this.formatStatName(stat.type);
        const statText = this.scene.add.text(0, statsY, `+${stat.value}% ${statName}`, {
          fontSize: '11px',
          color: UI_CONFIG.COLORS.TEXT_PRIMARY,
        });
        container.add(statText);
        statsY += 14;
      }
    }

    // Sell value
    const sellValue = this.getSellValue(module.rarity);
    const sellText = this.scene.add.text(
      this.getContentWidth() - 16,
      12,
      `Sell: ${sellValue}g`,
      {
        fontSize: '12px',
        color: UI_CONFIG.COLORS.TEXT_GOLD,
      }
    );
    sellText.setOrigin(1, 0);
    container.add(sellText);

    // Action buttons
    this.createActionButtons(container);
  }

  /**
   * Create action buttons (Equip/Unequip/Sell)
   */
  private createActionButtons(container: Phaser.GameObjects.Container): void {
    const buttonY = 110;
    const buttonWidth = 80;
    const buttonHeight = 28;
    const buttonSpacing = 12;

    const isEquipped = this.selectedModule?.source === 'equipped';

    // Equip/Unequip button
    if (isEquipped) {
      this.unequipButton = this.createActionButton(
        'UNEQUIP',
        0,
        buttonY,
        buttonWidth,
        buttonHeight,
        true,
        () => this.onUnequip()
      );
      container.add(this.unequipButton);
    } else {
      this.equipButton = this.createActionButton(
        'EQUIP',
        0,
        buttonY,
        buttonWidth,
        buttonHeight,
        this.hasAvailableSlot(),
        () => this.onEquip()
      );
      container.add(this.equipButton);
    }

    // Sell button (only for inventory items)
    this.sellButton = this.createActionButton(
      'SELL',
      buttonWidth + buttonSpacing,
      buttonY,
      buttonWidth,
      buttonHeight,
      !isEquipped, // Can only sell if not equipped
      () => this.onSell()
    );
    container.add(this.sellButton);
  }

  /**
   * Create disabled placeholder buttons
   */
  private createDisabledButtons(container: Phaser.GameObjects.Container): void {
    const buttonY = 48;
    const buttonWidth = 80;
    const buttonHeight = 28;
    const buttonSpacing = 12;

    const equipBtn = this.createActionButton('EQUIP', 0, buttonY, buttonWidth, buttonHeight, false);
    container.add(equipBtn);

    const sellBtn = this.createActionButton(
      'SELL',
      buttonWidth + buttonSpacing,
      buttonY,
      buttonWidth,
      buttonHeight,
      false
    );
    container.add(sellBtn);
  }

  /**
   * Create an action button
   */
  private createActionButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    enabled: boolean,
    onClick?: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(
      width / 2,
      0,
      width,
      height,
      enabled ? UI_CONFIG.COLORS.BUTTON_DEFAULT : UI_CONFIG.COLORS.BUTTON_DISABLED
    );
    container.add(bg);

    const text = this.scene.add.text(width / 2, 0, label, {
      fontSize: '12px',
      color: enabled ? UI_CONFIG.COLORS.TEXT_PRIMARY : UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    text.setOrigin(0.5);
    container.add(text);

    if (enabled && onClick) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setFillStyle(UI_CONFIG.COLORS.BUTTON_HOVER);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(UI_CONFIG.COLORS.BUTTON_DEFAULT);
      });

      bg.on('pointerdown', () => {
        bg.setFillStyle(UI_CONFIG.COLORS.BUTTON_ACTIVE);
        onClick();
        this.scene.time.delayedCall(100, () => {
          bg.setFillStyle(UI_CONFIG.COLORS.BUTTON_DEFAULT);
        });
      });
    }

    return container;
  }

  /**
   * Select a module
   */
  private selectModule(selection: ModuleSelection): void {
    this.selectedModule = selection;
    this.rebuildContent();

    if (import.meta.env.DEV) {
      console.log(
        `[InventoryPanel] Selected ${selection.module.type} (${selection.module.rarity}) from ${selection.source}`
      );
    }
  }

  /**
   * Check if there's an available slot to equip to
   */
  private hasAvailableSlot(): boolean {
    const slots = this.gameState.getModuleSlots();
    return slots.some((slot) => slot.unlocked && !slot.equipped);
  }

  /**
   * Find the first available slot index
   */
  private findAvailableSlotIndex(): number {
    const slots = this.gameState.getModuleSlots();
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot && slot.unlocked && !slot.equipped) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Handle equip action
   */
  private onEquip(): void {
    if (!this.selectedModule || this.selectedModule.source !== 'inventory') return;

    const slotIndex = this.findAvailableSlotIndex();
    if (slotIndex === -1) {
      if (import.meta.env.DEV) {
        console.warn('[InventoryPanel] No available slots to equip');
      }
      return;
    }

    const success = this.gameState.equipModule(
      slotIndex,
      this.selectedModule.module as ModuleItemData
    );

    if (success) {
      // Update selection to reflect new location
      this.selectedModule = {
        module: this.selectedModule.module,
        source: 'equipped',
        slotIndex,
      };
      this.rebuildContent();
    }
  }

  /**
   * Handle unequip action
   */
  private onUnequip(): void {
    if (!this.selectedModule || this.selectedModule.source !== 'equipped') return;
    if (this.selectedModule.slotIndex === undefined) return;

    const success = this.gameState.unequipModule(this.selectedModule.slotIndex);

    if (success) {
      // Update selection to reflect new location
      this.selectedModule = {
        module: this.selectedModule.module,
        source: 'inventory',
      };
      this.rebuildContent();
    }
  }

  /**
   * Handle sell action
   */
  private onSell(): void {
    if (!this.selectedModule || this.selectedModule.source !== 'inventory') return;

    const success = this.gameState.sellModule(this.selectedModule.module as ModuleItemData);

    if (success) {
      this.selectedModule = null;
      this.rebuildContent();
    }
  }

  /**
   * Get rarity color as hex number
   */
  private getRarityColorValue(rarity: string): number {
    switch (rarity) {
      case Rarity.Uncommon:
        return UI_CONFIG.COLORS.RARITY_UNCOMMON;
      case Rarity.Rare:
        return UI_CONFIG.COLORS.RARITY_RARE;
      case Rarity.Epic:
        return UI_CONFIG.COLORS.RARITY_EPIC;
      case Rarity.Legendary:
        return UI_CONFIG.COLORS.RARITY_LEGENDARY;
      default:
        return 0xffffff;
    }
  }

  /**
   * Get rarity color as hex string for text
   */
  private getRarityColorHex(rarity: string): string {
    switch (rarity) {
      case Rarity.Uncommon:
        return '#4ade80';
      case Rarity.Rare:
        return '#60a5fa';
      case Rarity.Epic:
        return '#c084fc';
      case Rarity.Legendary:
        return '#fb923c';
      default:
        return '#ffffff';
    }
  }

  /**
   * Get module type display name
   */
  private getModuleTypeName(type: string): string {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format stat name for display
   */
  private formatStatName(statType: string): string {
    return statType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Get sell value for rarity
   * Uses canonical values from ModuleItem
   */
  private getSellValue(rarity: string): number {
    return MODULE_SELL_VALUES[rarity as Rarity] || 50;
  }

  /**
   * Refresh panel content when opened
   */
  public refresh(): void {
    this.rebuildContent();

    if (import.meta.env.DEV) {
      console.log('[InventoryPanel] Refreshing content');
    }
  }

  /**
   * Clean up on destroy
   */
  public destroy(fromScene?: boolean): void {
    this.eventManager.off(GameEvents.MODULE_EQUIPPED, this.onModuleChanged, this);
    this.eventManager.off(GameEvents.MODULE_SOLD, this.onModuleChanged, this);
    super.destroy(fromScene);
  }
}
