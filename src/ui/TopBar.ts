import Phaser from 'phaser';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameState, getGameState } from '../state/GameState';
import { GameEvents } from '../types/GameEvents';
import { UI_CONFIG } from '../config/UIConfig';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * TopBar - Horizontal bar at top of screen
 *
 * Shows:
 * - Gold display with icon (left)
 * - Level + XP progress bar (center)
 * - Zone indicator (right)
 *
 * Height: 48px (from UIConfig)
 */
export class TopBar {
  private scene: Phaser.Scene;
  private eventManager: EventManager;
  private gameState: GameState;

  // Container
  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Graphics;

  // Left section - Gold
  private goldIcon!: Phaser.GameObjects.Graphics;
  private goldText!: Phaser.GameObjects.Text;
  private displayedGold: number = 0;
  private goldTween: Phaser.Tweens.Tween | null = null;

  // Center section - Level & XP
  private levelText!: Phaser.GameObjects.Text;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;

  // Right section - Zone
  private zoneText!: Phaser.GameObjects.Text;

  // Constants
  private readonly HEIGHT = UI_CONFIG.TOP_BAR.HEIGHT;
  private readonly PADDING = 16;
  private readonly XP_BAR_WIDTH = 200;
  private readonly XP_BAR_HEIGHT = 16;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventManager = getEventManager();
    this.gameState = getGameState();

    this.createContainer();
    this.createBackground();
    this.createGoldSection();
    this.createLevelSection();
    this.createZoneSection();
    this.subscribeToEvents();
    this.updateAll();
  }

  private createContainer(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(UI_CONFIG.DEPTHS.HUD);
  }

  private createBackground(): void {
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x1a1a2e, 0.9);
    this.background.fillRect(0, 0, GAME_CONFIG.WIDTH, this.HEIGHT);

    // Bottom border
    this.background.lineStyle(2, 0x3d3d5c, 1);
    this.background.lineBetween(0, this.HEIGHT, GAME_CONFIG.WIDTH, this.HEIGHT);

    this.container.add(this.background);
  }

  private createGoldSection(): void {
    const y = this.HEIGHT / 2;
    const x = this.PADDING;

    // Gold coin icon (simple circle)
    this.goldIcon = this.scene.add.graphics();
    this.goldIcon.fillStyle(0xffd700, 1);
    this.goldIcon.fillCircle(x + 12, y, 10);
    this.goldIcon.lineStyle(2, 0xb8860b, 1);
    this.goldIcon.strokeCircle(x + 12, y, 10);
    // Inner detail
    this.goldIcon.fillStyle(0xffec8b, 1);
    this.goldIcon.fillCircle(x + 12, y, 4);
    this.container.add(this.goldIcon);

    // Gold amount text
    this.goldText = this.scene.add.text(x + 30, y, '0', {
      fontSize: '20px',
      color: UI_CONFIG.COLORS.TEXT_GOLD,
      fontStyle: 'bold',
    });
    this.goldText.setOrigin(0, 0.5);
    this.container.add(this.goldText);
  }

  private createLevelSection(): void {
    const centerX = GAME_CONFIG.WIDTH / 2;
    const y = this.HEIGHT / 2;

    // Level text (left of XP bar)
    this.levelText = this.scene.add.text(centerX - this.XP_BAR_WIDTH / 2 - 10, y, 'Lv. 1', {
      fontSize: '18px',
      color: '#4ade80',
      fontStyle: 'bold',
    });
    this.levelText.setOrigin(1, 0.5);
    this.container.add(this.levelText);

    // XP Bar background
    const xpBarX = centerX - this.XP_BAR_WIDTH / 2;
    const xpBarY = y - this.XP_BAR_HEIGHT / 2;

    this.xpBarBg = this.scene.add.graphics();
    this.xpBarBg.fillStyle(0x333333, 1);
    this.xpBarBg.fillRoundedRect(xpBarX, xpBarY, this.XP_BAR_WIDTH, this.XP_BAR_HEIGHT, 4);
    this.xpBarBg.lineStyle(2, 0x555555, 1);
    this.xpBarBg.strokeRoundedRect(xpBarX, xpBarY, this.XP_BAR_WIDTH, this.XP_BAR_HEIGHT, 4);
    this.container.add(this.xpBarBg);

    // XP Bar fill
    this.xpBar = this.scene.add.graphics();
    this.container.add(this.xpBar);

    // XP text (centered on bar)
    this.xpText = this.scene.add.text(centerX, y, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.xpText.setOrigin(0.5, 0.5);
    this.container.add(this.xpText);
  }

  private createZoneSection(): void {
    const x = GAME_CONFIG.WIDTH - this.PADDING;
    const y = this.HEIGHT / 2;

    this.zoneText = this.scene.add.text(x, y, 'Act 1 - Zone 1', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.zoneText.setOrigin(1, 0.5);
    this.container.add(this.zoneText);
  }

  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.on(GameEvents.XP_GAINED, this.onXPChanged, this);
    this.eventManager.on(GameEvents.LEVEL_UP, this.onLevelUp, this);
    // Note: ZONE_CHANGED event will be added when zone progression is implemented
  }

  private onGoldChanged(payload: { newGold: number; change: number }): void {
    this.animateGoldChange(payload.newGold, payload.change);
  }

  private onXPChanged(): void {
    this.updateXPBar();
  }

  private onLevelUp(payload: { newLevel: number }): void {
    this.updateLevel(payload.newLevel);
    this.updateXPBar();

    // Level up flash effect
    this.levelText.setTint(0xffff00);
    this.scene.tweens.add({
      targets: this.levelText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.levelText.clearTint();
      },
    });
  }

  private animateGoldChange(targetGold: number, change: number): void {
    // Cancel existing tween
    if (this.goldTween) {
      this.goldTween.stop();
    }

    // Show floating change indicator
    if (change !== 0) {
      const sign = change > 0 ? '+' : '';
      const color = change > 0 ? '#4ade80' : '#ef4444';
      const changeText = this.scene.add.text(
        this.goldText.x + this.goldText.width + 10,
        this.goldText.y,
        `${sign}${this.formatNumber(change)}`,
        {
          fontSize: '14px',
          color,
          fontStyle: 'bold',
        }
      );
      changeText.setOrigin(0, 0.5);
      changeText.setDepth(UI_CONFIG.DEPTHS.HUD + 1);

      this.scene.tweens.add({
        targets: changeText,
        y: changeText.y - 20,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => changeText.destroy(),
      });
    }

    // Animate gold counter
    this.goldTween = this.scene.tweens.addCounter({
      from: this.displayedGold,
      to: targetGold,
      duration: 300,
      ease: 'Power2',
      onUpdate: (tween) => {
        const value = tween.getValue();
        this.displayedGold = Math.floor(value ?? 0);
        this.goldText.setText(this.formatNumber(this.displayedGold));
      },
    });
  }

  private updateLevel(level: number): void {
    this.levelText.setText(`Lv. ${level}`);
  }

  private updateXPBar(): void {
    const currentXP = this.gameState.getTankXP();
    const xpToNext = this.gameState.getXPToNextLevel();
    const percent = Math.min(currentXP / xpToNext, 1);

    const centerX = GAME_CONFIG.WIDTH / 2;
    const y = this.HEIGHT / 2;
    const xpBarX = centerX - this.XP_BAR_WIDTH / 2;
    const xpBarY = y - this.XP_BAR_HEIGHT / 2;

    this.xpBar.clear();

    if (percent > 0) {
      // Gradient-like effect with main color
      this.xpBar.fillStyle(0x4ade80, 1);
      this.xpBar.fillRoundedRect(
        xpBarX + 2,
        xpBarY + 2,
        (this.XP_BAR_WIDTH - 4) * percent,
        this.XP_BAR_HEIGHT - 4,
        3
      );
    }

    // Update XP text
    this.xpText.setText(`${this.formatNumber(currentXP)} / ${this.formatNumber(xpToNext)}`);
  }

  private updateZoneText(): void {
    const act = this.gameState.getCurrentAct();
    const zone = this.gameState.getCurrentZone();
    this.zoneText.setText(`Act ${act} - Zone ${zone}`);
  }

  private updateAll(): void {
    this.displayedGold = this.gameState.getGold();
    this.goldText.setText(this.formatNumber(this.displayedGold));
    this.updateLevel(this.gameState.getTankLevel());
    this.updateXPBar();
    this.updateZoneText();
  }

  private formatNumber(num: number): string {
    const rounded = Math.floor(num);
    if (rounded >= 1_000_000) {
      return (rounded / 1_000_000).toFixed(1) + 'M';
    } else if (rounded >= 1_000) {
      return (rounded / 1_000).toFixed(1) + 'K';
    }
    return rounded.toString();
  }

  /**
   * Get the container for external positioning
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Get bar height for layout purposes
   */
  public getHeight(): number {
    return this.HEIGHT;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.off(GameEvents.XP_GAINED, this.onXPChanged, this);
    this.eventManager.off(GameEvents.LEVEL_UP, this.onLevelUp, this);

    if (this.goldTween) {
      this.goldTween.stop();
    }

    this.container.destroy(true);
  }
}
