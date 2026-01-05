import Phaser from 'phaser';
import { UI_CONFIG } from '../../config/UIConfig';
import { ModuleItemData } from '../../types/ModuleTypes';
import { Rarity } from '../../types/GameTypes';

/**
 * Configuration for the confirm modal
 */
export interface ConfirmModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showDontAskAgain?: boolean;
  modulePreview?: ModuleItemData;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDontAskAgainChanged?: (checked: boolean) => void;
}

/**
 * Reusable confirmation modal for important actions
 */
export class ConfirmModal extends Phaser.GameObjects.Container {
  private overlay: Phaser.GameObjects.Rectangle;
  private dialog: Phaser.GameObjects.Container;
  private dontAskAgain: boolean = false;
  private config: ConfirmModalConfig | null = null;

  // Promise resolver for async usage
  private resolvePromise: ((value: boolean) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Create overlay (full screen darkening)
    this.overlay = scene.add.rectangle(
      UI_CONFIG.WIDTH / 2,
      UI_CONFIG.HEIGHT / 2,
      UI_CONFIG.WIDTH,
      UI_CONFIG.HEIGHT,
      0x000000,
      UI_CONFIG.MODAL.OVERLAY_ALPHA
    );
    this.overlay.setInteractive(); // Block clicks through
    this.add(this.overlay);

    // Create dialog container
    this.dialog = scene.add.container(UI_CONFIG.WIDTH / 2, UI_CONFIG.HEIGHT / 2);
    this.add(this.dialog);

    // Set depth
    this.setDepth(UI_CONFIG.DEPTHS.MODAL);

    // Start hidden
    this.setVisible(false);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Show the modal with configuration
   * Returns a promise that resolves to true (confirm) or false (cancel)
   */
  public show(config: ConfirmModalConfig): Promise<boolean> {
    this.config = config;
    this.dontAskAgain = false;

    // Clear previous dialog content
    this.dialog.removeAll(true);

    // Build dialog
    this.buildDialog();

    // Show modal
    this.setVisible(true);

    // Return promise
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  /**
   * Hide the modal
   */
  public hide(): void {
    this.setVisible(false);
    this.config = null;
  }

  /**
   * Build the dialog content
   */
  private buildDialog(): void {
    if (!this.config) return;

    const padding = UI_CONFIG.MODAL.PADDING;
    const width = UI_CONFIG.MODAL.WIDTH;
    const hasModulePreview = !!this.config.modulePreview;
    const hasCheckbox = !!this.config.showDontAskAgain;

    // Calculate height based on content
    let contentHeight = padding * 2; // Top and bottom padding
    contentHeight += 24; // Title
    contentHeight += 16; // Spacing
    contentHeight += hasModulePreview ? 50 : 0; // Module preview
    contentHeight += 10; // Spacing
    contentHeight += 30; // Message
    contentHeight += hasCheckbox ? 30 : 0; // Checkbox
    contentHeight += 20; // Spacing
    contentHeight += UI_CONFIG.MODAL.BUTTON_HEIGHT; // Buttons

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_CONFIG.MODAL.BACKGROUND, 1);
    bg.fillRoundedRect(
      -width / 2,
      -contentHeight / 2,
      width,
      contentHeight,
      UI_CONFIG.MODAL.BORDER_RADIUS
    );
    bg.lineStyle(2, UI_CONFIG.COLORS.PANEL_BORDER, 1);
    bg.strokeRoundedRect(
      -width / 2,
      -contentHeight / 2,
      width,
      contentHeight,
      UI_CONFIG.MODAL.BORDER_RADIUS
    );
    this.dialog.add(bg);

    let currentY = -contentHeight / 2 + padding;

    // Title
    const title = this.scene.add.text(0, currentY, this.config.title, {
      fontSize: '16px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    this.dialog.add(title);
    currentY += 24 + 16;

    // Module preview (if provided)
    if (this.config.modulePreview) {
      const module = this.config.modulePreview;
      const rarityColor = this.getRarityColorHex(module.rarity);

      // Module type name
      const typeName = this.formatModuleType(module.type);
      const moduleText = this.scene.add.text(0, currentY, typeName, {
        fontSize: '14px',
        color: rarityColor,
        fontStyle: 'bold',
      });
      moduleText.setOrigin(0.5, 0);
      this.dialog.add(moduleText);
      currentY += 20;

      // Rarity
      const rarityName = module.rarity.charAt(0).toUpperCase() + module.rarity.slice(1);
      const rarityText = this.scene.add.text(0, currentY, rarityName, {
        fontSize: '12px',
        color: rarityColor,
      });
      rarityText.setOrigin(0.5, 0);
      this.dialog.add(rarityText);
      currentY += 30 + 10;
    }

    // Message
    const message = this.scene.add.text(0, currentY, this.config.message, {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      align: 'center',
      wordWrap: { width: width - padding * 2 },
    });
    message.setOrigin(0.5, 0);
    this.dialog.add(message);
    currentY += message.height + 10;

    // Don't ask again checkbox
    if (this.config.showDontAskAgain) {
      const checkboxContainer = this.scene.add.container(-width / 2 + padding + 80, currentY + 5);

      // Checkbox box
      const checkboxBg = this.scene.add.graphics();
      checkboxBg.fillStyle(0x2d2d44, 1);
      checkboxBg.fillRect(0, 0, 16, 16);
      checkboxBg.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 1);
      checkboxBg.strokeRect(0, 0, 16, 16);
      checkboxContainer.add(checkboxBg);

      // Checkmark (hidden initially)
      const checkmark = this.scene.add.text(8, 8, '✓', {
        fontSize: '12px',
        color: '#4ade80',
        fontStyle: 'bold',
      });
      checkmark.setOrigin(0.5);
      checkmark.setVisible(false);
      checkboxContainer.add(checkmark);

      // Checkbox label
      const checkboxLabel = this.scene.add.text(24, 0, "Don't ask again", {
        fontSize: '11px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      checkboxContainer.add(checkboxLabel);

      // Hit area for checkbox
      const hitArea = this.scene.add.rectangle(60, 8, 140, 20, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.dontAskAgain = !this.dontAskAgain;
        checkmark.setVisible(this.dontAskAgain);
        this.config?.onDontAskAgainChanged?.(this.dontAskAgain);
      });
      checkboxContainer.add(hitArea);

      this.dialog.add(checkboxContainer);
      currentY += 30;
    }

    currentY += 20;

    // Buttons
    const buttonWidth = UI_CONFIG.MODAL.BUTTON_WIDTH;
    const buttonHeight = UI_CONFIG.MODAL.BUTTON_HEIGHT;
    const buttonSpacing = UI_CONFIG.MODAL.BUTTON_SPACING;
    const buttonsWidth = buttonWidth * 2 + buttonSpacing;
    const buttonsStartX = -buttonsWidth / 2;

    // Cancel button
    const cancelBtn = this.createButton(
      buttonsStartX + buttonWidth / 2,
      currentY,
      buttonWidth,
      buttonHeight,
      this.config.cancelText || 'Cancel',
      false,
      () => this.onCancel()
    );
    this.dialog.add(cancelBtn);

    // Confirm button
    const confirmBtn = this.createButton(
      buttonsStartX + buttonWidth + buttonSpacing + buttonWidth / 2,
      currentY,
      buttonWidth,
      buttonHeight,
      this.config.confirmText || 'Confirm',
      true,
      () => this.onConfirm()
    );
    this.dialog.add(confirmBtn);
  }

  /**
   * Create a button
   */
  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isPrimary: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bgColor = isPrimary ? UI_CONFIG.COLORS.BUTTON_ACTIVE : UI_CONFIG.COLORS.BUTTON_DEFAULT;
    const hoverColor = isPrimary ? 0xd9b237 : UI_CONFIG.COLORS.BUTTON_HOVER;

    const bg = this.scene.add.rectangle(0, 0, width, height, bgColor);
    bg.setInteractive({ useHandCursor: true });
    container.add(bg);

    const text = this.scene.add.text(0, 0, label, {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: isPrimary ? 'bold' : 'normal',
    });
    text.setOrigin(0.5);
    container.add(text);

    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(bgColor);
    });

    bg.on('pointerdown', () => {
      onClick();
    });

    return container;
  }

  /**
   * Handle confirm button click
   */
  private onConfirm(): void {
    this.config?.onConfirm?.();
    this.resolvePromise?.(true);
    this.resolvePromise = null;
    this.hide();
  }

  /**
   * Handle cancel button click
   */
  private onCancel(): void {
    this.config?.onCancel?.();
    this.resolvePromise?.(false);
    this.resolvePromise = null;
    this.hide();
  }

  /**
   * Get rarity color as hex string
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
   * Format module type for display
   */
  private formatModuleType(type: string): string {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Check if the "don't ask again" checkbox was checked
   */
  public getDontAskAgain(): boolean {
    return this.dontAskAgain;
  }

  /**
   * Destroy the modal
   */
  public destroy(fromScene?: boolean): void {
    this.resolvePromise?.(false);
    super.destroy(fromScene);
  }
}
