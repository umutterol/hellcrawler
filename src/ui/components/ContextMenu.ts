/**
 * ContextMenu Component
 * Right-click context menu for modules and other game elements
 */
import Phaser from 'phaser';
import { UI_CONFIG } from '../../config/UIConfig';

/**
 * Context menu item configuration
 */
export interface ContextMenuItem {
  label: string;
  icon?: string;
  enabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
}

/**
 * Context menu configuration
 */
export interface ContextMenuConfig {
  items: ContextMenuItem[];
  x: number;
  y: number;
}

/**
 * ContextMenu component for right-click menus
 */
export class ContextMenu extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private menuItems: Phaser.GameObjects.Container[] = [];
  private isVisible: boolean = false;

  // Constants
  private static readonly ITEM_HEIGHT = 28;
  private static readonly ITEM_PADDING = 8;
  private static readonly MENU_WIDTH = 140;
  private static readonly BORDER_RADIUS = 4;
  private static readonly SEPARATOR_HEIGHT = 8;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Set depth to be above everything
    this.setDepth(UI_CONFIG.DEPTHS.MODAL);

    // Create background graphics
    this.background = scene.add.graphics();
    this.add(this.background);

    // Initially hidden
    this.setVisible(false);

    // Add to scene
    scene.add.existing(this);

    // Close menu when clicking elsewhere
    scene.input.on('pointerdown', this.onGlobalClick, this);
  }

  /**
   * Show the context menu at specified position
   */
  public show(config: ContextMenuConfig): void {
    // Clear existing items
    this.clearItems();

    // Calculate menu dimensions
    let totalHeight = ContextMenu.ITEM_PADDING * 2;
    for (const item of config.items) {
      if (item.separator) {
        totalHeight += ContextMenu.SEPARATOR_HEIGHT;
      } else {
        totalHeight += ContextMenu.ITEM_HEIGHT;
      }
    }

    // Position menu (keep within screen bounds)
    let x = config.x;
    let y = config.y;

    // Check right edge
    if (x + ContextMenu.MENU_WIDTH > UI_CONFIG.WIDTH) {
      x = UI_CONFIG.WIDTH - ContextMenu.MENU_WIDTH - 10;
    }

    // Check bottom edge
    if (y + totalHeight > UI_CONFIG.HEIGHT) {
      y = UI_CONFIG.HEIGHT - totalHeight - 10;
    }

    // Ensure not off left or top
    x = Math.max(10, x);
    y = Math.max(10, y);

    this.setPosition(x, y);

    // Draw background
    this.background.clear();
    this.background.fillStyle(UI_CONFIG.TOOLTIP.BACKGROUND, 0.95);
    this.background.fillRoundedRect(
      0,
      0,
      ContextMenu.MENU_WIDTH,
      totalHeight,
      ContextMenu.BORDER_RADIUS
    );
    this.background.lineStyle(1, UI_CONFIG.TOOLTIP.BORDER_COLOR, 1);
    this.background.strokeRoundedRect(
      0,
      0,
      ContextMenu.MENU_WIDTH,
      totalHeight,
      ContextMenu.BORDER_RADIUS
    );

    // Create menu items
    let yOffset = ContextMenu.ITEM_PADDING;
    for (const item of config.items) {
      if (item.separator) {
        // Draw separator line
        const separator = this.scene.add.graphics();
        separator.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.3);
        separator.lineBetween(
          ContextMenu.ITEM_PADDING,
          yOffset + ContextMenu.SEPARATOR_HEIGHT / 2,
          ContextMenu.MENU_WIDTH - ContextMenu.ITEM_PADDING,
          yOffset + ContextMenu.SEPARATOR_HEIGHT / 2
        );
        this.add(separator);
        yOffset += ContextMenu.SEPARATOR_HEIGHT;
      } else {
        const itemContainer = this.createMenuItem(item, yOffset);
        this.menuItems.push(itemContainer);
        this.add(itemContainer);
        yOffset += ContextMenu.ITEM_HEIGHT;
      }
    }

    this.setVisible(true);
    this.isVisible = true;
  }

  /**
   * Hide the context menu
   */
  public hide(): void {
    this.setVisible(false);
    this.isVisible = false;
    this.clearItems();
  }

  /**
   * Check if menu is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Create a menu item
   */
  private createMenuItem(
    item: ContextMenuItem,
    yOffset: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, yOffset);
    const isEnabled = item.enabled !== false;

    // Background (for hover effect)
    const bg = this.scene.add.rectangle(
      ContextMenu.MENU_WIDTH / 2,
      ContextMenu.ITEM_HEIGHT / 2,
      ContextMenu.MENU_WIDTH - 4,
      ContextMenu.ITEM_HEIGHT - 2,
      0x000000,
      0
    );
    container.add(bg);

    // Icon (if provided)
    let textX = ContextMenu.ITEM_PADDING;
    if (item.icon) {
      const icon = this.scene.add.text(
        ContextMenu.ITEM_PADDING,
        ContextMenu.ITEM_HEIGHT / 2,
        item.icon,
        {
          fontSize: '12px',
          color: isEnabled ? UI_CONFIG.COLORS.TEXT_PRIMARY : UI_CONFIG.COLORS.TEXT_SECONDARY,
        }
      );
      icon.setOrigin(0, 0.5);
      container.add(icon);
      textX += 20;
    }

    // Label
    const label = this.scene.add.text(textX, ContextMenu.ITEM_HEIGHT / 2, item.label, {
      fontSize: '12px',
      color: isEnabled ? UI_CONFIG.COLORS.TEXT_PRIMARY : UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    label.setOrigin(0, 0.5);
    container.add(label);

    // Make interactive if enabled
    if (isEnabled && item.onClick) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setFillStyle(UI_CONFIG.COLORS.SIDEBAR_HOVER, 1);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x000000, 0);
      });

      bg.on('pointerdown', () => {
        item.onClick!();
        this.hide();
      });
    }

    return container;
  }

  /**
   * Clear all menu items
   */
  private clearItems(): void {
    for (const item of this.menuItems) {
      item.destroy();
    }
    this.menuItems = [];

    // Remove all children except background
    const children = this.getAll() as Phaser.GameObjects.GameObject[];
    for (const child of children) {
      if (child !== this.background) {
        child.destroy();
      }
    }
  }

  /**
   * Handle global click to close menu
   */
  private onGlobalClick(pointer: Phaser.Input.Pointer): void {
    if (!this.isVisible) return;

    // Check if click is outside menu bounds
    const bounds = this.getBounds();
    if (
      pointer.x < bounds.x ||
      pointer.x > bounds.x + bounds.width ||
      pointer.y < bounds.y ||
      pointer.y > bounds.y + bounds.height
    ) {
      // Delay hide to allow item click to process first
      this.scene.time.delayedCall(10, () => {
        this.hide();
      });
    }
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.scene.input.off('pointerdown', this.onGlobalClick, this);
    super.destroy(fromScene);
  }
}

/**
 * Singleton context menu manager
 */
let contextMenuInstance: ContextMenu | null = null;

/**
 * Get or create the context menu instance
 */
export function getContextMenu(scene: Phaser.Scene): ContextMenu {
  if (!contextMenuInstance || !contextMenuInstance.scene) {
    contextMenuInstance = new ContextMenu(scene);
  }
  return contextMenuInstance;
}

/**
 * Initialize context menu for a scene
 */
export function initContextMenu(scene: Phaser.Scene): ContextMenu {
  // Destroy existing if from different scene
  if (contextMenuInstance && contextMenuInstance.scene !== scene) {
    contextMenuInstance.destroy(true);
    contextMenuInstance = null;
  }

  if (!contextMenuInstance) {
    contextMenuInstance = new ContextMenu(scene);
  }
  return contextMenuInstance;
}

/**
 * Clean up context menu
 */
export function destroyContextMenu(): void {
  if (contextMenuInstance) {
    contextMenuInstance.destroy(true);
    contextMenuInstance = null;
  }
}
