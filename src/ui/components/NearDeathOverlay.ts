/**
 * NearDeathOverlay - Full-screen overlay when tank is in near-death state
 *
 * Features:
 * - Semi-transparent red overlay on game area (not sidebar)
 * - Pulsing "NEAR DEATH" warning
 * - "Attack Speed -50%" indicator
 * - Auto-revive countdown timer
 * - "REVIVE NOW" button
 *
 * Phase 2.5C: UI Polish
 */

import Phaser from 'phaser';
import { UI_CONFIG } from '../../config/UIConfig';
import { GAME_CONFIG } from '../../config/GameConfig';
import { EventManager } from '../../managers/EventManager';
import { GameEvents, NearDeathEnteredPayload } from '../../types/GameEvents';
import { Tank } from '../../entities/Tank';

export class NearDeathOverlay extends Phaser.GameObjects.Container {
  private eventManager: EventManager;
  private tank: Tank | null = null;

  // UI elements
  private overlay!: Phaser.GameObjects.Rectangle;
  private warningContainer!: Phaser.GameObjects.Container;
  private warningText!: Phaser.GameObjects.Text;
  private debuffText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private reviveButton!: Phaser.GameObjects.Container;

  // State
  private isActive: boolean = false;

  // Sidebar width to avoid covering
  private readonly SIDEBAR_WIDTH = UI_CONFIG.SIDEBAR.WIDTH;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.eventManager = EventManager.getInstance();

    this.createOverlay();
    this.createWarningContent();

    // Set depth above game but below modals
    this.setDepth(UI_CONFIG.DEPTHS.OVERLAY);

    // Start hidden
    this.setVisible(false);

    // Subscribe to events
    this.eventManager.on(GameEvents.NEAR_DEATH_ENTERED, this.onNearDeathEntered, this);
    this.eventManager.on(GameEvents.TANK_REVIVED, this.onTankRevived, this);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Set reference to tank for timer updates
   */
  public setTank(tank: Tank): void {
    this.tank = tank;
  }

  private createOverlay(): void {
    // Semi-transparent red overlay covering game area (not sidebar)
    const overlayWidth = GAME_CONFIG.WIDTH - this.SIDEBAR_WIDTH;
    this.overlay = this.scene.add.rectangle(
      overlayWidth / 2,
      GAME_CONFIG.HEIGHT / 2,
      overlayWidth,
      GAME_CONFIG.HEIGHT,
      0xff0000,
      0.15
    );
    this.add(this.overlay);
  }

  private createWarningContent(): void {
    const centerX = (GAME_CONFIG.WIDTH - this.SIDEBAR_WIDTH) / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2 - 30;

    this.warningContainer = this.scene.add.container(centerX, centerY);
    this.add(this.warningContainer);

    // Warning text
    this.warningText = this.scene.add.text(0, 0, 'NEAR DEATH', {
      fontSize: '28px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.warningText.setOrigin(0.5);
    this.warningContainer.add(this.warningText);

    // Debuff indicator
    this.debuffText = this.scene.add.text(0, 35, 'Attack Speed -50%', {
      fontSize: '14px',
      color: '#ffaaaa',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.debuffText.setOrigin(0.5);
    this.warningContainer.add(this.debuffText);

    // Timer text
    this.timerText = this.scene.add.text(0, 60, 'Auto-revive in: 60s', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.timerText.setOrigin(0.5);
    this.warningContainer.add(this.timerText);

    // Revive button
    this.createReviveButton(centerX, centerY + 100);
  }

  private createReviveButton(x: number, y: number): void {
    this.reviveButton = this.scene.add.container(x, y);
    this.add(this.reviveButton);

    const buttonWidth = 140;
    const buttonHeight = 40;

    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0x22cc22, 1);
    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    buttonBg.lineStyle(2, 0x44ff44, 1);
    buttonBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    this.reviveButton.add(buttonBg);

    // Button text
    const buttonText = this.scene.add.text(0, 0, 'REVIVE NOW', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);
    this.reviveButton.add(buttonText);

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x33dd33, 1);
      buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
      buttonBg.lineStyle(2, 0x66ff66, 1);
      buttonBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    });

    hitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x22cc22, 1);
      buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
      buttonBg.lineStyle(2, 0x44ff44, 1);
      buttonBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    });

    hitArea.on('pointerdown', () => {
      this.onReviveClicked();
    });

    this.reviveButton.add(hitArea);
  }

  private onNearDeathEntered(_payload: NearDeathEnteredPayload): void {
    this.show();
  }

  private onTankRevived(): void {
    this.hide();
  }

  private onReviveClicked(): void {
    if (this.tank) {
      this.tank.revive();
    }
  }

  /**
   * Show the overlay with animation
   */
  public show(): void {
    if (this.isActive) return;
    this.isActive = true;

    this.setVisible(true);
    this.setAlpha(0);

    // Fade in
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    // Start pulsing animation on warning text
    this.scene.tweens.add({
      targets: this.warningText,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      alpha: { from: 1, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pulse overlay
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: { from: 0.15, to: 0.25 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Hide the overlay with animation
   */
  public hide(): void {
    if (!this.isActive) return;

    // Stop tweens
    this.scene.tweens.killTweensOf(this.warningText);
    this.scene.tweens.killTweensOf(this.overlay);

    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.setVisible(false);
        this.isActive = false;
        this.warningText.setScale(1);
        this.warningText.setAlpha(1);
        this.overlay.setAlpha(0.15);
      },
    });
  }

  /**
   * Update timer display
   */
  public update(): void {
    if (!this.isActive || !this.tank) return;

    const timeRemaining = this.tank.getNearDeathTimeRemaining();
    if (timeRemaining > 0) {
      this.timerText.setText(`Auto-revive in: ${Math.ceil(timeRemaining)}s`);
    }
  }

  /**
   * Destroy the overlay
   */
  public destroy(fromScene?: boolean): void {
    this.scene.tweens.killTweensOf(this.warningText);
    this.scene.tweens.killTweensOf(this.overlay);
    this.eventManager.off(GameEvents.NEAR_DEATH_ENTERED, this.onNearDeathEntered, this);
    this.eventManager.off(GameEvents.TANK_REVIVED, this.onTankRevived, this);
    super.destroy(fromScene);
  }
}
