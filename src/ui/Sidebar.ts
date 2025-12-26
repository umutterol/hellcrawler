import Phaser from 'phaser';
import { UI_CONFIG, PanelType, SIDEBAR_BUTTONS } from '../config/UIConfig';
import { GAME_CONFIG } from '../config/GameConfig';
import { getPanelManager } from '../managers/PanelManager';

/**
 * SidebarButton - Individual button in the sidebar
 */
class SidebarButton extends Phaser.GameObjects.Container {
  private panelType: PanelType;
  private background: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Text;
  private buttonActive: boolean = false;
  private isHovered: boolean = false;

  // ASCII icons for each panel type
  private static readonly ASCII_ICONS: Record<PanelType, string> = {
    [PanelType.TANK_STATS]: 'T',
    [PanelType.INVENTORY]: 'I',
    [PanelType.SHOP]: 'S',
    [PanelType.SETTINGS]: 'O',
  };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    panelType: PanelType,
    onClick: () => void
  ) {
    super(scene, x, y);
    this.panelType = panelType;

    // Background
    this.background = scene.add.graphics();
    this.drawBackground();
    this.add(this.background);

    // Icon (using emoji or fallback text)
    const iconChar = SidebarButton.ASCII_ICONS[panelType];
    this.icon = scene.add.text(UI_CONFIG.SIDEBAR.ICON_SIZE / 2, UI_CONFIG.SIDEBAR.ICON_SIZE / 2, iconChar, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    this.icon.setOrigin(0.5);
    this.add(this.icon);

    // Hit area for interaction
    const hitArea = scene.add.rectangle(
      UI_CONFIG.SIDEBAR.ICON_SIZE / 2,
      UI_CONFIG.SIDEBAR.ICON_SIZE / 2,
      UI_CONFIG.SIDEBAR.ICON_SIZE,
      UI_CONFIG.SIDEBAR.ICON_SIZE
    );
    hitArea.setInteractive({ useHandCursor: true });
    this.add(hitArea);

    // Event handlers
    hitArea.on('pointerover', () => {
      this.isHovered = true;
      this.drawBackground();
    });

    hitArea.on('pointerout', () => {
      this.isHovered = false;
      this.drawBackground();
    });

    hitArea.on('pointerdown', () => {
      onClick();
    });

    scene.add.existing(this);
  }

  /**
   * Draw the button background based on state
   */
  private drawBackground(): void {
    this.background.clear();

    let color: number = UI_CONFIG.COLORS.SIDEBAR_BG;
    if (this.buttonActive) {
      color = UI_CONFIG.COLORS.SIDEBAR_ACTIVE;
    } else if (this.isHovered) {
      color = UI_CONFIG.COLORS.SIDEBAR_HOVER;
    }

    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(0, 0, UI_CONFIG.SIDEBAR.ICON_SIZE, UI_CONFIG.SIDEBAR.ICON_SIZE, 4);

    // Active indicator (left border)
    if (this.buttonActive) {
      this.background.fillStyle(UI_CONFIG.COLORS.BUTTON_ACTIVE, 1);
      this.background.fillRect(0, 4, 3, UI_CONFIG.SIDEBAR.ICON_SIZE - 8);
    }
  }

  /**
   * Set the button active state
   */
  public setButtonActive(active: boolean): void {
    this.buttonActive = active;
    this.drawBackground();
  }

  /**
   * Get the panel type
   */
  public getPanelType(): PanelType {
    return this.panelType;
  }
}

/**
 * Sidebar - Left sidebar with panel toggle buttons
 *
 * Contains 4 buttons:
 * 1. Tank Stats (TAB)
 * 2. Inventory (I)
 * 3. Shop (P)
 * 4. Settings (ESC)
 *
 * Based on UISpec.md specifications:
 * - Width: 56px
 * - Icon size: 40x40px
 * - Padding: 8px
 * - Positioned left side below top bar, above bottom bar
 */
export class Sidebar extends Phaser.GameObjects.Container {
  private buttons: Map<PanelType, SidebarButton> = new Map();
  private background: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    // Position at left edge, below top bar
    super(scene, 0, UI_CONFIG.TOP_BAR.HEIGHT);

    // Calculate sidebar height
    const sidebarHeight =
      GAME_CONFIG.HEIGHT - UI_CONFIG.TOP_BAR.HEIGHT - UI_CONFIG.BOTTOM_BAR.HEIGHT;

    // Background
    this.background = scene.add.graphics();
    this.background.fillStyle(UI_CONFIG.COLORS.SIDEBAR_BG, 0.9);
    this.background.fillRect(0, 0, UI_CONFIG.SIDEBAR.WIDTH, sidebarHeight);

    // Right border
    this.background.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    this.background.lineBetween(UI_CONFIG.SIDEBAR.WIDTH - 1, 0, UI_CONFIG.SIDEBAR.WIDTH - 1, sidebarHeight);

    this.add(this.background);

    // Create buttons
    this.createButtons();

    // Set depth
    this.setDepth(UI_CONFIG.DEPTHS.SIDEBAR);

    // Add to scene
    scene.add.existing(this);

    // Subscribe to panel changes
    this.subscribeToPanelChanges();
  }

  /**
   * Create the sidebar buttons
   */
  private createButtons(): void {
    const panelManager = getPanelManager();
    const startY = UI_CONFIG.SIDEBAR.PADDING;
    const buttonSpacing = UI_CONFIG.SIDEBAR.ICON_SIZE + UI_CONFIG.SIDEBAR.PADDING;

    SIDEBAR_BUTTONS.forEach((config, index) => {
      const button = new SidebarButton(
        this.scene,
        UI_CONFIG.SIDEBAR.PADDING,
        startY + index * buttonSpacing,
        config.type,
        () => {
          panelManager.togglePanel(config.type);
        }
      );

      this.buttons.set(config.type, button);
      this.add(button);
    });
  }

  /**
   * Subscribe to panel state changes
   */
  private subscribeToPanelChanges(): void {
    const panelManager = getPanelManager();

    panelManager.setOnPanelChangeCallback((activePanelType: PanelType | null) => {
      this.updateActiveButton(activePanelType);
    });
  }

  /**
   * Update which button is active
   */
  private updateActiveButton(activePanelType: PanelType | null): void {
    this.buttons.forEach((button, panelType) => {
      button.setButtonActive(panelType === activePanelType);
    });
  }

  /**
   * Set a specific button as active (for keyboard shortcuts)
   */
  public setActiveButton(panelType: PanelType | null): void {
    this.updateActiveButton(panelType);
  }

  /**
   * Clear all active buttons
   */
  public clearActiveButton(): void {
    this.updateActiveButton(null);
  }

  /**
   * Get sidebar width (for layout calculations)
   */
  public static getWidth(): number {
    return UI_CONFIG.SIDEBAR.WIDTH;
  }

  /**
   * Destroy the sidebar
   */
  public destroy(fromScene?: boolean): void {
    this.buttons.forEach((button) => button.destroy());
    this.buttons.clear();
    super.destroy(fromScene);
  }
}
