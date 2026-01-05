import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { getGameState, GameState } from '../../state/GameState';
import { EventManager, getEventManager } from '../../managers/EventManager';
import { GameEvents } from '../../types/GameEvents';
import { ModuleItemData, ModuleSlotData } from '../../types/ModuleTypes';
import { Rarity } from '../../types/GameTypes';
import { MODULE_SELL_VALUES } from '../../modules/ModuleItem';
import { GAME_CONFIG, SlotDirection } from '../../config/GameConfig';
import {
  getSettingsManager,
  SettingsManager,
  InventorySortMethod,
  SortDirection,
} from '../../managers/SettingsManager';
import { ConfirmModal } from '../components/ConfirmModal';
import { getTooltipManager } from '../components/TooltipManager';

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
 * - 8-column grid for inventory with pagination
 * - Click to select, see details
 * - Equip/Unequip/Sell buttons
 */
// Rarity order for sorting (higher = better)
const RARITY_ORDER: Record<string, number> = {
  [Rarity.Common]: 0,
  [Rarity.Uncommon]: 1,
  [Rarity.Rare]: 2,
  [Rarity.Epic]: 3,
  [Rarity.Legendary]: 4,
};

export class InventoryPanel extends SlidingPanel {
  // Initialize after super() since these need GameState singleton
  private gameState: GameState = getGameState();
  private eventManager: EventManager = getEventManager();
  private settingsManager: SettingsManager = getSettingsManager();

  // Confirm modal for rare+ sells
  private confirmModal: ConfirmModal | null = null;

  // UI Elements that need updating
  private equippedSlotContainers: Phaser.GameObjects.Container[] = [];

  // Selection state
  private selectedModule: ModuleSelection | null = null;

  // Pagination state
  private currentPage: number = 0;
  private static readonly GRID_COLS = 8;
  private static readonly GRID_ROWS = 4;
  private static readonly ITEMS_PER_PAGE = 32; // 8 cols × 4 rows

  // Action buttons
  private equipButton!: Phaser.GameObjects.Container;
  private unequipButton!: Phaser.GameObjects.Container;
  private sellButton!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.INVENTORY);
    this.setTitle('INVENTORY');
    this.initContent();
    this.subscribeToEvents();

    // Create confirm modal for rare+ sells
    this.confirmModal = new ConfirmModal(scene);
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

    // Calculate total content height for scrolling
    // Equipped section: ~56px (4px top + 48px slots + 4px bottom)
    // Grid section at y=60: header (28) + grid (4 rows × 58) + pagination (30) = 290px
    // Details section: ~150px (details + buttons)
    const totalContentHeight = 60 + 290 + 150; // ~500px
    this.setContentHeight(totalContentHeight);
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

    // Equipped slots (5 slots) - 25% smaller (48px instead of 64px)
    const slotSize = 48;
    const slotSpacing = 12;
    const slotsY = 4; // Start higher without header

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

    // Get direction info for this slot
    const direction = GAME_CONFIG.SLOT_DIRECTIONS[index] ?? SlotDirection.Right;
    const dirShort = UI_CONFIG.SLOT_DIRECTIONS.SHORT_LABELS[direction];
    const dirColor = UI_CONFIG.SLOT_DIRECTIONS.HEX_COLORS[direction];
    const dirColorValue = UI_CONFIG.SLOT_DIRECTIONS.COLORS[direction];

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

    // Border - use direction color, highlight if selected
    const borderColor = isSelected ? 0xffffff : dirColorValue;
    const borderAlpha = isSelected ? 1 : 0.7;
    slotBg.lineStyle(isSelected ? 3 : 2, borderColor, borderAlpha);
    slotBg.strokeRoundedRect(0, 0, size, size, 4);
    container.add(slotBg);

    // Direction indicator (inside slot, top center) - smaller for 48px slots
    const dirIndicator = this.scene.add.text(size / 2, 2, dirShort, {
      fontSize: '8px',
      color: dirColor,
      fontStyle: 'bold',
    });
    dirIndicator.setOrigin(0.5, 0);
    container.add(dirIndicator);

    if (slot?.equipped) {
      // Module icon (first letter of type) - smaller for 48px slots
      const moduleType = slot.equipped.type;
      const iconText = moduleType.charAt(0).toUpperCase();
      const rarityColor = this.getRarityColorHex(slot.equipped.rarity);

      const moduleIcon = this.scene.add.text(size / 2, size / 2, iconText, {
        fontSize: '18px',
        color: rarityColor,
        fontStyle: 'bold',
      });
      moduleIcon.setOrigin(0.5);
      container.add(moduleIcon);

      // Rarity indicator bar at bottom
      const rarityBar = this.scene.add.graphics();
      rarityBar.fillStyle(this.getRarityColorValue(slot.equipped.rarity), 1);
      rarityBar.fillRect(3, size - 5, size - 6, 2);
      container.add(rarityBar);

      // Make clickable
      const hitArea = this.scene.add.rectangle(size / 2, size / 2, size, size);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.selectModule({ module: slot.equipped!, source: 'equipped', slotIndex: index });
      });

      // Tooltip on hover
      hitArea.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        getTooltipManager().show(
          { type: 'module', module: slot.equipped! },
          pointer.x,
          pointer.y
        );
      });
      hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        getTooltipManager().updatePosition(pointer.x, pointer.y);
      });
      hitArea.on('pointerout', () => {
        getTooltipManager().hide();
      });

      container.add(hitArea);
    } else if (slot?.unlocked) {
      // Empty unlocked slot - smaller for 48px slots
      const emptyText = this.scene.add.text(size / 2, size / 2, `${index + 1}`, {
        fontSize: '14px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      emptyText.setOrigin(0.5);
      container.add(emptyText);
    } else {
      // Locked slot - smaller for 48px slots
      const lockText = this.scene.add.text(size / 2, size / 2 - 4, `${index + 1}`, {
        fontSize: '12px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      lockText.setOrigin(0.5);
      container.add(lockText);

      const lockIcon = this.scene.add.text(size / 2, size - 10, '🔒', {
        fontSize: '10px',
      });
      lockIcon.setOrigin(0.5);
      container.add(lockIcon);
    }

    return container;
  }

  /**
   * Sort modules based on current settings
   */
  private sortModules(modules: readonly ModuleItemData[]): ModuleItemData[] {
    const sortMethod = this.settingsManager.inventorySortMethod;
    const sortDirection = this.settingsManager.inventorySortDirection;
    const multiplier = sortDirection === 'desc' ? -1 : 1;

    // Create a mutable copy for sorting
    const sorted = [...modules];

    switch (sortMethod) {
      case 'rarity':
        sorted.sort((a, b) => {
          const rarityDiff = (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0);
          if (rarityDiff !== 0) return rarityDiff * multiplier;
          // Secondary sort by type for same rarity
          return a.type.localeCompare(b.type) * multiplier;
        });
        break;

      case 'type':
        sorted.sort((a, b) => {
          const typeDiff = a.type.localeCompare(b.type);
          if (typeDiff !== 0) return typeDiff * multiplier;
          // Secondary sort by rarity for same type
          return ((RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0)) * multiplier;
        });
        break;

      case 'recent':
        // Module IDs contain timestamp, more recent = higher ID
        sorted.sort((a, b) => {
          return a.id.localeCompare(b.id) * multiplier;
        });
        break;
    }

    return sorted;
  }

  /**
   * Handle sort button click
   */
  private onSortClick(method: InventorySortMethod): void {
    const currentMethod = this.settingsManager.inventorySortMethod;
    const currentDirection = this.settingsManager.inventorySortDirection;

    if (currentMethod === method) {
      // Toggle direction if same method
      const newDirection: SortDirection = currentDirection === 'desc' ? 'asc' : 'desc';
      this.settingsManager.setSetting('inventorySortDirection', newDirection);
    } else {
      // Change method, reset to descending
      this.settingsManager.setSetting('inventorySortMethod', method);
      this.settingsManager.setSetting('inventorySortDirection', 'desc');
    }

    // Reset to first page and rebuild
    this.currentPage = 0;
    this.rebuildContent();

    if (import.meta.env.DEV) {
      console.log(
        `[InventoryPanel] Sort changed: ${this.settingsManager.inventorySortMethod} ${this.settingsManager.inventorySortDirection}`
      );
    }
  }

  /**
   * Create sort controls with icons (right-aligned)
   */
  private createSortControls(container: Phaser.GameObjects.Container, y: number): void {
    const currentMethod = this.settingsManager.inventorySortMethod;
    const currentDirection = this.settingsManager.inventorySortDirection;
    const dirArrow = currentDirection === 'desc' ? '▼' : '▲';
    const contentWidth = this.getContentWidth();

    // Icon-based sort buttons: ◆ (rarity), ▣ (type), ⏱ (recent)
    const buttonConfigs: { method: InventorySortMethod; icon: string; tooltip: string }[] = [
      { method: 'rarity', icon: '◆', tooltip: 'Sort by Rarity' },
      { method: 'type', icon: '▣', tooltip: 'Sort by Type' },
      { method: 'recent', icon: '⏱', tooltip: 'Sort by Recent' },
    ];

    const iconSize = 20;
    const iconSpacing = 4;
    const totalWidth = buttonConfigs.length * iconSize + (buttonConfigs.length - 1) * iconSpacing;
    let startX = contentWidth - totalWidth;

    for (let i = 0; i < buttonConfigs.length; i++) {
      const config = buttonConfigs[i]!;
      const isActive = currentMethod === config.method;
      const x = startX + i * (iconSize + iconSpacing);

      // Icon button background
      const btnBg = this.scene.add.rectangle(
        x + iconSize / 2,
        y + iconSize / 2,
        iconSize,
        iconSize,
        isActive ? 0x4a4a6a : 0x2a2a3a,
        1
      );
      btnBg.setStrokeStyle(1, isActive ? 0xffd700 : 0x555555);
      container.add(btnBg);

      // Icon with direction arrow if active
      const iconText = isActive ? `${config.icon}${dirArrow}` : config.icon;
      const btn = this.scene.add.text(x + iconSize / 2, y + iconSize / 2, iconText, {
        fontSize: isActive ? '10px' : '12px',
        color: isActive ? '#ffd700' : UI_CONFIG.COLORS.TEXT_PRIMARY,
      });
      btn.setOrigin(0.5);
      container.add(btn);

      // Interactive area
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerover', () => {
        if (!isActive) {
          btnBg.setFillStyle(0x3a3a5a);
          btn.setColor('#ffd700');
        }
        // Show tooltip
        getTooltipManager().show(
          { type: 'text', title: config.tooltip },
          btnBg.x + container.x + 16,
          btnBg.y + container.y
        );
      });
      btnBg.on('pointerout', () => {
        if (!isActive) {
          btnBg.setFillStyle(0x2a2a3a);
          btn.setColor(UI_CONFIG.COLORS.TEXT_PRIMARY);
        }
        getTooltipManager().hide();
      });
      btnBg.on('pointerdown', () => {
        this.onSortClick(config.method);
      });
    }
  }

  /**
   * Create the inventory grid with pagination
   */
  private createInventoryGrid(): void {
    const rawInventory = this.gameState.getModuleInventory();
    const inventory = this.sortModules(rawInventory);
    // Adjusted Y position since equipped slots are now smaller (48px + 4px top + 8px gap = 60)
    const sectionContainer = this.scene.add.container(16, 60);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(inventory.length / InventoryPanel.ITEMS_PER_PAGE));
    const startIndex = this.currentPage * InventoryPanel.ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + InventoryPanel.ITEMS_PER_PAGE, inventory.length);
    const pageItems = inventory.slice(startIndex, endIndex);

    // Inventory count (small, left side)
    const countText = this.scene.add.text(0, 4, `${inventory.length}/50`, {
      fontSize: '10px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    sectionContainer.add(countText);

    // Sort controls (right-aligned, icon buttons)
    this.createSortControls(sectionContainer, 0);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.3);
    divider.lineBetween(0, 22, this.getContentWidth(), 22);
    sectionContainer.add(divider);

    // Grid parameters - 8 columns for wider panel
    const cellSize = 52;
    const cellSpacing = 6;
    const gridY = 28;

    // Draw grid cells and modules
    for (let row = 0; row < InventoryPanel.GRID_ROWS; row++) {
      for (let col = 0; col < InventoryPanel.GRID_COLS; col++) {
        const cellIndex = row * InventoryPanel.GRID_COLS + col;
        const cellX = col * (cellSize + cellSpacing);
        const cellY = gridY + row * (cellSize + cellSpacing);
        const module = pageItems[cellIndex];
        const globalIndex = startIndex + cellIndex;

        const cellContainer = this.createInventoryCell(cellX, cellY, cellSize, module, globalIndex);
        sectionContainer.add(cellContainer);
      }
    }

    // Pagination controls (below grid)
    const paginationY = gridY + InventoryPanel.GRID_ROWS * (cellSize + cellSpacing) + 8;
    this.createPaginationControls(sectionContainer, paginationY, totalPages);

    // Empty state text (only show if inventory is empty)
    if (inventory.length === 0) {
      const emptyText = this.scene.add.text(
        this.getContentWidth() / 2 - 16,
        gridY + (InventoryPanel.GRID_ROWS * (cellSize + cellSpacing)) / 2,
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
   * Create pagination controls
   */
  private createPaginationControls(
    container: Phaser.GameObjects.Container,
    y: number,
    totalPages: number
  ): void {
    if (totalPages <= 1) return;

    const contentWidth = this.getContentWidth();

    // Previous button
    const prevBtn = this.scene.add.text(0, y, '< PREV', {
      fontSize: '12px',
      color: this.currentPage > 0 ? '#ffffff' : '#555555',
      fontStyle: 'bold',
    });
    if (this.currentPage > 0) {
      prevBtn.setInteractive({ useHandCursor: true });
      prevBtn.on('pointerdown', () => {
        this.currentPage--;
        this.rebuildContent();
      });
      prevBtn.on('pointerover', () => prevBtn.setColor('#ffd700'));
      prevBtn.on('pointerout', () => prevBtn.setColor('#ffffff'));
    }
    container.add(prevBtn);

    // Page indicator
    const pageText = this.scene.add.text(
      contentWidth / 2,
      y,
      `Page ${this.currentPage + 1} / ${totalPages}`,
      {
        fontSize: '12px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      }
    );
    pageText.setOrigin(0.5, 0);
    container.add(pageText);

    // Next button
    const nextBtn = this.scene.add.text(contentWidth, y, 'NEXT >', {
      fontSize: '12px',
      color: this.currentPage < totalPages - 1 ? '#ffffff' : '#555555',
      fontStyle: 'bold',
    });
    nextBtn.setOrigin(1, 0);
    if (this.currentPage < totalPages - 1) {
      nextBtn.setInteractive({ useHandCursor: true });
      nextBtn.on('pointerdown', () => {
        this.currentPage++;
        this.rebuildContent();
      });
      nextBtn.on('pointerover', () => nextBtn.setColor('#ffd700'));
      nextBtn.on('pointerout', () => nextBtn.setColor('#ffffff'));
    }
    container.add(nextBtn);
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

      // Tooltip on hover
      hitArea.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        getTooltipManager().show(
          { type: 'module', module: module as ModuleItemData },
          pointer.x,
          pointer.y
        );
      });
      hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        getTooltipManager().updatePosition(pointer.x, pointer.y);
      });
      hitArea.on('pointerout', () => {
        getTooltipManager().hide();
      });

      container.add(hitArea);
    }

    return container;
  }

  /**
   * Create the details/actions section
   */
  private createDetailsSection(): void {
    // Position below grid (60 + grid height + pagination)
    const gridHeight = InventoryPanel.GRID_ROWS * (52 + 6) + 28 + 30; // cells + header + pagination
    const sectionContainer = this.scene.add.container(16, 60 + gridHeight);

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
   * Check if a rarity requires confirmation to sell
   */
  private requiresSellConfirmation(rarity: string): boolean {
    return [Rarity.Rare, Rarity.Epic, Rarity.Legendary].includes(rarity as Rarity);
  }

  /**
   * Handle sell action
   */
  private async onSell(): Promise<void> {
    if (!this.selectedModule || this.selectedModule.source !== 'inventory') return;

    const module = this.selectedModule.module as ModuleItemData;

    // Check if confirmation is needed for Rare+ modules
    if (
      this.requiresSellConfirmation(module.rarity) &&
      this.settingsManager.confirmRareSells &&
      this.confirmModal
    ) {
      const sellValue = MODULE_SELL_VALUES[module.rarity as Rarity] || 0;
      const rarityName = module.rarity.charAt(0).toUpperCase() + module.rarity.slice(1);

      const confirmed = await this.confirmModal.show({
        title: 'Confirm Sell',
        message: `Are you sure you want to sell this ${rarityName} module for ${sellValue}g?`,
        confirmText: 'Sell',
        cancelText: 'Cancel',
        showDontAskAgain: true,
        modulePreview: module,
        onDontAskAgainChanged: (checked) => {
          if (checked) {
            this.settingsManager.setSetting('confirmRareSells', false);
            if (import.meta.env.DEV) {
              console.log('[InventoryPanel] Disabled rare sell confirmations');
            }
          }
        },
      });

      if (!confirmed) {
        if (import.meta.env.DEV) {
          console.log('[InventoryPanel] Sell cancelled by user');
        }
        return;
      }
    }

    const success = this.gameState.sellModule(module);

    if (success) {
      this.selectedModule = null;
      this.rebuildContent();

      if (import.meta.env.DEV) {
        console.log(`[InventoryPanel] Sold ${module.type} (${module.rarity})`);
      }
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
    this.confirmModal?.destroy(true);
    this.confirmModal = null;
    super.destroy(fromScene);
  }
}
