/**
 * ZoneCompletionPanel - Shows zone completion summary
 *
 * Features:
 * - Displays zone completion stats (enemies, XP, gold)
 * - Shows modules dropped during the zone
 * - Continue button to advance to next zone
 * - Auto-displays when zone is completed
 *
 * Phase 2.5B: UI Polish
 */

import Phaser from 'phaser';
import { UI_CONFIG, ZONE_CONFIG } from '../../config/UIConfig';
import { EventManager } from '../../managers/EventManager';
import { GameEvents, ZoneCompletedPayload, ModuleDroppedPayload } from '../../types/GameEvents';
import { GameState, getGameState } from '../../state/GameState';
import { Rarity } from '../../types/GameTypes';

// Simplified module drop info for tracking
interface DroppedModuleInfo {
  type: string;
  rarity: string;
}

export interface ZoneCompletionCallbacks {
  onContinue?: () => void;
}

export class ZoneCompletionPanel extends Phaser.GameObjects.Container {
  private gameState: GameState;
  private eventManager: EventManager;
  private callbacks: ZoneCompletionCallbacks;

  // UI elements
  private overlay!: Phaser.GameObjects.Rectangle;
  private dialog!: Phaser.GameObjects.Container;

  // Zone tracking
  private modulesDropped: DroppedModuleInfo[] = [];
  private isShowing: boolean = false;

  // Auto-hide timer
  private autoHideTimer: Phaser.Time.TimerEvent | null = null;
  private readonly AUTO_HIDE_DELAY = 5000; // 5 seconds

  // Panel dimensions
  private readonly panelWidth = 380;
  private readonly panelPadding = 20;

  constructor(scene: Phaser.Scene, callbacks: ZoneCompletionCallbacks = {}) {
    super(scene, 0, 0);

    this.gameState = getGameState();
    this.eventManager = EventManager.getInstance();
    this.callbacks = callbacks;

    this.createOverlay();
    this.createDialog();

    // Set depth
    this.setDepth(UI_CONFIG.DEPTHS.MODAL);

    // Start hidden
    this.setVisible(false);

    // Subscribe to events
    this.eventManager.on(GameEvents.MODULE_DROPPED, this.onModuleDropped, this);
    this.eventManager.on(GameEvents.ZONE_CHANGED, this.onZoneChanged, this);
    this.eventManager.on(GameEvents.ZONE_COMPLETED, this.onZoneCompleted, this);

    // Add to scene
    scene.add.existing(this);
  }

  private createOverlay(): void {
    this.overlay = this.scene.add.rectangle(
      UI_CONFIG.WIDTH / 2,
      UI_CONFIG.HEIGHT / 2,
      UI_CONFIG.WIDTH,
      UI_CONFIG.HEIGHT,
      0x000000,
      0.7
    );
    this.overlay.setInteractive({ useHandCursor: true });
    // Click anywhere to dismiss
    this.overlay.on('pointerdown', () => {
      this.dismissAndContinue();
    });
    this.add(this.overlay);
  }

  private createDialog(): void {
    this.dialog = this.scene.add.container(UI_CONFIG.WIDTH / 2, UI_CONFIG.HEIGHT / 2);
    this.add(this.dialog);
  }

  /**
   * Track modules dropped during the zone
   */
  private onModuleDropped(payload: ModuleDroppedPayload): void {
    if (!this.isShowing) {
      this.modulesDropped.push({
        type: payload.type,
        rarity: payload.rarity,
      });
    }
  }

  /**
   * Reset tracking when zone changes
   */
  private onZoneChanged(): void {
    this.modulesDropped = [];
  }

  /**
   * Show the completion panel when zone is completed
   */
  private onZoneCompleted(payload: ZoneCompletedPayload): void {
    this.show(payload);
  }

  /**
   * Show the completion panel with stats
   */
  public show(stats: ZoneCompletedPayload): void {
    this.isShowing = true;

    // Cancel any existing auto-hide timer
    this.cancelAutoHideTimer();

    // Clear previous dialog content
    this.dialog.removeAll(true);

    // Build dialog
    this.buildDialog(stats);

    // Show with animation
    this.setVisible(true);
    this.setAlpha(0);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    // Animate dialog scaling
    this.dialog.setScale(0.8);
    this.scene.tweens.add({
      targets: this.dialog,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Start auto-hide timer (5 seconds)
    this.autoHideTimer = this.scene.time.delayedCall(this.AUTO_HIDE_DELAY, () => {
      this.dismissAndContinue();
    });
  }

  /**
   * Cancel the auto-hide timer
   */
  private cancelAutoHideTimer(): void {
    if (this.autoHideTimer) {
      this.autoHideTimer.destroy();
      this.autoHideTimer = null;
    }
  }

  /**
   * Dismiss the panel and continue to next zone
   */
  private dismissAndContinue(): void {
    // Cancel timer if still active
    this.cancelAutoHideTimer();

    // Advance to next zone
    this.gameState.completeZone();

    // Call callback
    this.callbacks.onContinue?.();

    // Hide panel
    this.hide();
  }

  /**
   * Hide the completion panel
   */
  public hide(): void {
    // Cancel auto-hide timer
    this.cancelAutoHideTimer();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.setVisible(false);
        this.isShowing = false;
        this.modulesDropped = [];
      },
    });
  }

  /**
   * Build the dialog content
   */
  private buildDialog(stats: ZoneCompletedPayload): void {
    const zoneName = this.getZoneName(stats.actNumber, stats.zoneNumber);
    const actName = this.getActName(stats.actNumber);
    const hasModules = this.modulesDropped.length > 0;

    // Calculate content height
    let contentHeight = this.panelPadding * 2; // Top and bottom padding
    contentHeight += 32; // Title
    contentHeight += 8; // Spacing
    contentHeight += 18; // Zone subtitle
    contentHeight += 24; // Spacing
    contentHeight += 80; // Stats grid (3 rows)
    contentHeight += hasModules ? 24 + Math.min(this.modulesDropped.length, 3) * 24 : 0; // Modules
    contentHeight += 24; // Spacing
    contentHeight += 36; // Button

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_CONFIG.COLORS.PANEL_BACKGROUND, 0.98);
    bg.fillRoundedRect(
      -this.panelWidth / 2,
      -contentHeight / 2,
      this.panelWidth,
      contentHeight,
      12
    );
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(
      -this.panelWidth / 2,
      -contentHeight / 2,
      this.panelWidth,
      contentHeight,
      12
    );
    this.dialog.add(bg);

    let currentY = -contentHeight / 2 + this.panelPadding;

    // Title - "ZONE COMPLETE!"
    const title = this.scene.add.text(0, currentY, 'ZONE COMPLETE!', {
      fontSize: '22px',
      color: UI_CONFIG.COLORS.TEXT_GOLD,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    this.dialog.add(title);
    currentY += 32 + 8;

    // Zone subtitle
    const subtitle = this.scene.add.text(0, currentY, `${actName} - ${zoneName}`, {
      fontSize: '14px',
      color: '#a0a0a0',
      fontFamily: 'monospace',
    });
    subtitle.setOrigin(0.5, 0);
    this.dialog.add(subtitle);
    currentY += 18 + 24;

    // Stats grid
    const statsLeft = -this.panelWidth / 2 + this.panelPadding + 20;
    const statsRight = this.panelWidth / 2 - this.panelPadding - 20;

    // Enemies Killed
    this.addStatRow(
      statsLeft,
      statsRight,
      currentY,
      'Enemies Defeated',
      this.formatNumber(stats.totalEnemiesKilled),
      '#ef4444'
    );
    currentY += 26;

    // XP Gained
    this.addStatRow(
      statsLeft,
      statsRight,
      currentY,
      'XP Earned',
      `+${this.formatNumber(stats.totalXpGained)}`,
      '#a78bfa'
    );
    currentY += 26;

    // Gold Gained
    this.addStatRow(
      statsLeft,
      statsRight,
      currentY,
      'Gold Collected',
      `+${this.formatNumber(stats.totalGoldGained)}`,
      UI_CONFIG.COLORS.TEXT_GOLD
    );
    currentY += 26 + 8;

    // Modules dropped
    if (hasModules) {
      const modulesLabel = this.scene.add.text(
        -this.panelWidth / 2 + this.panelPadding,
        currentY,
        'Modules Found:',
        {
          fontSize: '12px',
          color: '#a0a0a0',
          fontFamily: 'monospace',
        }
      );
      modulesLabel.setOrigin(0, 0);
      this.dialog.add(modulesLabel);
      currentY += 20;

      // Show up to 3 modules
      const modulesToShow = this.modulesDropped.slice(0, 3);
      for (const module of modulesToShow) {
        this.addModuleRow(currentY, module);
        currentY += 22;
      }

      // If more than 3, show count
      if (this.modulesDropped.length > 3) {
        const moreText = this.scene.add.text(
          0,
          currentY,
          `+${this.modulesDropped.length - 3} more...`,
          {
            fontSize: '11px',
            color: '#666666',
            fontFamily: 'monospace',
          }
        );
        moreText.setOrigin(0.5, 0);
        this.dialog.add(moreText);
        currentY += 18;
      }

      currentY += 8;
    }

    currentY += 16;

    // Continue button
    const buttonWidth = 140;
    const buttonHeight = 36;

    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0x4ade80, 1);
    buttonBg.fillRoundedRect(-buttonWidth / 2, currentY, buttonWidth, buttonHeight, 6);
    this.dialog.add(buttonBg);

    const buttonText = this.scene.add.text(0, currentY + buttonHeight / 2, 'CONTINUE', {
      fontSize: '14px',
      color: '#1a1a2e',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5, 0.5);
    this.dialog.add(buttonText);

    // Button hit area
    const buttonHitArea = this.scene.add.rectangle(
      0,
      currentY + buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      0x000000,
      0
    );
    buttonHitArea.setInteractive({ useHandCursor: true });
    buttonHitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x6ee7a7, 1);
      buttonBg.fillRoundedRect(-buttonWidth / 2, currentY, buttonWidth, buttonHeight, 6);
    });
    buttonHitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4ade80, 1);
      buttonBg.fillRoundedRect(-buttonWidth / 2, currentY, buttonWidth, buttonHeight, 6);
    });
    buttonHitArea.on('pointerdown', () => {
      this.onContinue();
    });
    this.dialog.add(buttonHitArea);
  }

  /**
   * Add a stat row to the dialog
   */
  private addStatRow(
    leftX: number,
    rightX: number,
    y: number,
    label: string,
    value: string,
    valueColor: string
  ): void {
    const labelText = this.scene.add.text(leftX, y, label, {
      fontSize: '13px',
      color: '#a0a0a0',
      fontFamily: 'monospace',
    });
    labelText.setOrigin(0, 0);
    this.dialog.add(labelText);

    const valueText = this.scene.add.text(rightX, y, value, {
      fontSize: '13px',
      color: valueColor,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    valueText.setOrigin(1, 0);
    this.dialog.add(valueText);
  }

  /**
   * Add a module row to the dialog
   */
  private addModuleRow(y: number, module: DroppedModuleInfo): void {
    const rarityColor = this.getRarityColor(module.rarity);
    const typeName = this.formatModuleType(module.type);
    const rarityName = module.rarity.charAt(0).toUpperCase() + module.rarity.slice(1);

    const moduleText = this.scene.add.text(
      -this.panelWidth / 2 + this.panelPadding + 16,
      y,
      `• ${rarityName} ${typeName}`,
      {
        fontSize: '12px',
        color: rarityColor,
        fontFamily: 'monospace',
      }
    );
    moduleText.setOrigin(0, 0);
    this.dialog.add(moduleText);
  }

  /**
   * Handle continue button click
   */
  private onContinue(): void {
    this.dismissAndContinue();
  }

  /**
   * Get zone name from config
   */
  private getZoneName(act: number, zone: number): string {
    const zones = ZONE_CONFIG.ZONES[act];
    const zoneName = zones?.[zone - 1];
    if (zoneName) {
      return zoneName;
    }
    return `Zone ${zone}`;
  }

  /**
   * Get act name from config
   */
  private getActName(act: number): string {
    const actConfig = ZONE_CONFIG.ACTS[act - 1];
    if (actConfig) {
      return `Act ${act}: ${actConfig.name}`;
    }
    return `Act ${act}`;
  }

  /**
   * Format number with commas
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Get rarity color
   */
  private getRarityColor(rarity: string): string {
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
   * Destroy the panel
   */
  public destroy(fromScene?: boolean): void {
    this.cancelAutoHideTimer();
    this.eventManager.off(GameEvents.MODULE_DROPPED, this.onModuleDropped, this);
    this.eventManager.off(GameEvents.ZONE_CHANGED, this.onZoneChanged, this);
    this.eventManager.off(GameEvents.ZONE_COMPLETED, this.onZoneCompleted, this);
    super.destroy(fromScene);
  }
}
