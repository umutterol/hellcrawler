import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';

/**
 * InventoryPanel - Sliding panel for module inventory management
 *
 * Based on UISpec.md:
 * - View all modules in inventory
 * - Equipped modules shown at top
 * - 6-column grid for inventory
 * - Click to select, see details
 * - Equip/Unequip/Sell buttons
 *
 * NOTE: This is a placeholder implementation. Full functionality
 * will be added in a future sprint.
 */
export class InventoryPanel extends SlidingPanel {
  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.INVENTORY);
    this.setTitle('INVENTORY');
    this.initContent();
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
   * Create the equipped modules section
   */
  private createEquippedSection(): void {
    const sectionContainer = this.scene.add.container(16, 0);

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
      const slotX = i * (slotSize + slotSpacing);
      const slotBg = this.scene.add.graphics();
      slotBg.fillStyle(0x2d2d44, 1);
      slotBg.fillRoundedRect(slotX, slotsY, slotSize, slotSize, 4);
      slotBg.lineStyle(2, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
      slotBg.strokeRoundedRect(slotX, slotsY, slotSize, slotSize, 4);
      sectionContainer.add(slotBg);

      // Slot number
      const slotNum = this.scene.add.text(slotX + slotSize / 2, slotsY + slotSize / 2, `${i + 1}`, {
        fontSize: '18px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      slotNum.setOrigin(0.5);
      sectionContainer.add(slotNum);

      // Lock icon for slots 4 and 5
      if (i >= 3) {
        const lockIcon = this.scene.add.text(slotX + slotSize / 2, slotsY + slotSize - 12, 'L', {
          fontSize: '12px',
          color: '#ff6666',
        });
        lockIcon.setOrigin(0.5);
        sectionContainer.add(lockIcon);
      }
    }

    this.addToContent(sectionContainer);
  }

  /**
   * Create the inventory grid
   */
  private createInventoryGrid(): void {
    const sectionContainer = this.scene.add.container(16, 100);

    // Section header with item count
    const headerText = this.scene.add.text(0, 0, 'INVENTORY (0/50)', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionContainer.add(headerText);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionContainer.add(divider);

    // Grid placeholder (6 columns, 4 rows visible)
    const cellSize = 52;
    const cellSpacing = 6;
    const gridY = 32;
    const cols = 6;
    const rows = 4;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellX = col * (cellSize + cellSpacing);
        const cellY = gridY + row * (cellSize + cellSpacing);

        const cellBg = this.scene.add.graphics();
        cellBg.fillStyle(0x1a1a2e, 1);
        cellBg.fillRoundedRect(cellX, cellY, cellSize, cellSize, 4);
        cellBg.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.3);
        cellBg.strokeRoundedRect(cellX, cellY, cellSize, cellSize, 4);
        sectionContainer.add(cellBg);
      }
    }

    // Empty state text
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

    this.addToContent(sectionContainer);
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

    // Placeholder text
    const placeholderText = this.scene.add.text(0, 16, 'Select a module to view details', {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    sectionContainer.add(placeholderText);

    // Action buttons placeholder
    const buttonY = 48;
    const buttonWidth = 80;
    const buttonHeight = 28;

    // Equip button
    const equipBtn = this.scene.add.rectangle(buttonWidth / 2, buttonY, buttonWidth, buttonHeight, 0x3d3d3d);
    sectionContainer.add(equipBtn);
    const equipText = this.scene.add.text(buttonWidth / 2, buttonY, 'EQUIP', {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    equipText.setOrigin(0.5);
    sectionContainer.add(equipText);

    // Sell button
    const sellBtn = this.scene.add.rectangle(buttonWidth * 1.5 + 16, buttonY, buttonWidth, buttonHeight, 0x3d3d3d);
    sectionContainer.add(sellBtn);
    const sellText = this.scene.add.text(buttonWidth * 1.5 + 16, buttonY, 'SELL', {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    sellText.setOrigin(0.5);
    sectionContainer.add(sellText);

    this.addToContent(sectionContainer);
  }

  /**
   * Refresh panel content when opened
   */
  public refresh(): void {
    // TODO: Update inventory display from GameState
    if (import.meta.env.DEV) {
      console.log('[InventoryPanel] Refreshing content');
    }
  }
}
