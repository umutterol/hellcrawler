import Phaser from 'phaser';
import { UI_CONFIG, PanelType } from '../../config/UIConfig';
import { GAME_CONFIG } from '../../config/GameConfig';

/**
 * SlidingPanel - Base class for all sliding panels
 *
 * Implements the Desktop Heroes-style sliding panel system:
 * - Slides in from left side of screen
 * - Game continues running while panel is open
 * - Only one panel can be open at a time (managed by PanelManager)
 *
 * Based on UISpec.md specifications
 */
export abstract class SlidingPanel extends Phaser.GameObjects.Container {
  protected panelType: PanelType;
  protected isOpen: boolean = false;
  protected isAnimating: boolean = false;

  // Panel dimensions
  protected panelWidth: number = UI_CONFIG.PANEL.WIDTH;
  protected panelHeight: number;

  // Visual elements
  protected background!: Phaser.GameObjects.Graphics;
  protected header!: Phaser.GameObjects.Container;
  protected content!: Phaser.GameObjects.Container;
  protected collapseButton!: Phaser.GameObjects.Container;

  // Scrolling support
  protected scrollY: number = 0;
  protected maxScrollY: number = 0;
  protected contentHeight: number = 0;

  // Current tween reference for cleanup
  private openTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, panelType: PanelType) {
    // Start off-screen to the left
    super(scene, -UI_CONFIG.PANEL.WIDTH, UI_CONFIG.TOP_BAR.HEIGHT);

    this.panelType = panelType;

    // Calculate panel height (screen height minus top and bottom bars)
    this.panelHeight =
      GAME_CONFIG.HEIGHT - UI_CONFIG.TOP_BAR.HEIGHT - UI_CONFIG.BOTTOM_BAR.HEIGHT;

    // Add to scene
    scene.add.existing(this);

    // Set depth above game, below modals
    this.setDepth(UI_CONFIG.DEPTHS.PANEL);

    // Create base visual structure
    this.createBackground();
    this.createHeader();
    this.createContentContainer();

    // NOTE: Do NOT call createContent() here!
    // Subclass field initializers run AFTER super() returns,
    // so subclass properties won't be available yet.
    // Subclasses must call initContent() after their constructor.

    // Start hidden
    this.setVisible(false);
  }

  /**
   * Initialize content - must be called by subclasses after constructor
   */
  protected initContent(): void {
    this.createContent();
  }

  /**
   * Create the panel background
   */
  private createBackground(): void {
    this.background = this.scene.add.graphics();

    // Draw panel background
    this.background.fillStyle(UI_CONFIG.COLORS.PANEL_BACKGROUND, 0.95);
    this.background.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 0);

    // Draw border
    this.background.lineStyle(2, UI_CONFIG.COLORS.PANEL_BORDER, 1);
    this.background.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 0);

    // Right edge highlight
    this.background.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    this.background.lineBetween(this.panelWidth - 1, 0, this.panelWidth - 1, this.panelHeight);

    this.add(this.background);
  }

  /**
   * Create the panel header with collapse button and title
   */
  private createHeader(): void {
    this.header = this.scene.add.container(0, 0);

    // Header background
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UI_CONFIG.COLORS.PANEL_BORDER, 0.3);
    headerBg.fillRect(0, 0, this.panelWidth, 48);
    this.header.add(headerBg);

    // Collapse button "<<"
    this.collapseButton = this.createCollapseButton();
    this.header.add(this.collapseButton);

    // Title will be set by subclasses via setTitle()
    this.add(this.header);
  }

  /**
   * Create the collapse button
   */
  private createCollapseButton(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(16, 8);

    // Button background
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_CONFIG.COLORS.BUTTON_DEFAULT, 1);
    bg.fillRoundedRect(0, 0, 32, 32, 4);
    container.add(bg);

    // Arrow text
    const arrow = this.scene.add.text(16, 16, '<<', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    });
    arrow.setOrigin(0.5);
    container.add(arrow);

    // Interactive
    const hitArea = this.scene.add.rectangle(16, 16, 32, 32);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(UI_CONFIG.COLORS.BUTTON_HOVER, 1);
      bg.fillRoundedRect(0, 0, 32, 32, 4);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(UI_CONFIG.COLORS.BUTTON_DEFAULT, 1);
      bg.fillRoundedRect(0, 0, 32, 32, 4);
    });

    hitArea.on('pointerdown', () => {
      this.close();
    });

    container.add(hitArea);

    return container;
  }

  /**
   * Create the scrollable content container
   */
  private createContentContainer(): void {
    this.content = this.scene.add.container(0, 56); // Below header
    this.content.setDepth(UI_CONFIG.DEPTHS.PANEL_CONTENT);
    this.add(this.content);
  }

  /**
   * Set the panel title (called by subclasses)
   */
  protected setTitle(title: string): void {
    // Remove existing title if any
    const existingTitle = this.header.getByName('title') as Phaser.GameObjects.Text;
    if (existingTitle) {
      existingTitle.destroy();
    }

    // Create title text
    const titleText = this.scene.add.text(60, 24, title, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    titleText.setOrigin(0, 0.5);
    titleText.setName('title');
    this.header.add(titleText);
  }

  /**
   * Abstract method - subclasses create their specific content
   */
  protected abstract createContent(): void;

  /**
   * Abstract method - subclasses refresh their content when panel opens
   */
  public abstract refresh(): void;

  /**
   * Get the panel type
   */
  public getPanelType(): PanelType {
    return this.panelType;
  }

  /**
   * Check if panel is currently open
   */
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Check if panel is currently animating
   */
  public getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * Open the panel with slide animation
   */
  public open(): void {
    if (this.isOpen || this.isAnimating) return;

    this.isAnimating = true;
    this.setVisible(true);

    // Refresh content before showing
    this.refresh();

    // Kill any existing tween
    if (this.openTween) {
      this.openTween.stop();
      this.openTween = null;
    }

    // Slide in from left
    this.openTween = this.scene.tweens.add({
      targets: this,
      x: 0,
      duration: UI_CONFIG.PANEL.OPEN_DURATION,
      ease: UI_CONFIG.PANEL.EASE_OPEN,
      onComplete: () => {
        this.isOpen = true;
        this.isAnimating = false;
        this.onOpenComplete();
      },
    });

    if (import.meta.env.DEV) {
      console.log(`[SlidingPanel] Opening ${this.panelType}`);
    }
  }

  /**
   * Close the panel with slide animation
   */
  public close(): void {
    if (!this.isOpen || this.isAnimating) return;

    this.isAnimating = true;

    // Kill any existing tween
    if (this.openTween) {
      this.openTween.stop();
      this.openTween = null;
    }

    // Slide out to left
    this.openTween = this.scene.tweens.add({
      targets: this,
      x: -this.panelWidth,
      duration: UI_CONFIG.PANEL.CLOSE_DURATION,
      ease: UI_CONFIG.PANEL.EASE_CLOSE,
      onComplete: () => {
        this.isOpen = false;
        this.isAnimating = false;
        this.setVisible(false);
        this.onCloseComplete();
      },
    });

    if (import.meta.env.DEV) {
      console.log(`[SlidingPanel] Closing ${this.panelType}`);
    }
  }

  /**
   * Toggle the panel open/closed
   */
  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Force close without animation (used when switching panels)
   */
  public forceClose(): void {
    if (this.openTween) {
      this.openTween.stop();
      this.openTween = null;
    }

    this.x = -this.panelWidth;
    this.isOpen = false;
    this.isAnimating = false;
    this.setVisible(false);
  }

  /**
   * Called when open animation completes
   * Override in subclasses for additional behavior
   */
  protected onOpenComplete(): void {
    // Override in subclasses
  }

  /**
   * Called when close animation completes
   * Override in subclasses for additional behavior
   */
  protected onCloseComplete(): void {
    // Override in subclasses
  }

  /**
   * Add content to the scrollable content area
   */
  protected addToContent(child: Phaser.GameObjects.GameObject): void {
    this.content.add(child);
  }

  /**
   * Clear all content
   */
  protected clearContent(): void {
    this.content.removeAll(true);
  }

  /**
   * Get the usable content width (panel width minus padding)
   */
  protected getContentWidth(): number {
    return this.panelWidth - 32; // 16px padding on each side
  }

  /**
   * Get the usable content height
   */
  protected getContentHeight(): number {
    return this.panelHeight - 64; // Header height + padding
  }

  /**
   * Destroy the panel
   */
  public destroy(fromScene?: boolean): void {
    if (this.openTween) {
      this.openTween.stop();
      this.openTween = null;
    }
    super.destroy(fromScene);
  }
}
