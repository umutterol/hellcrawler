import Phaser from 'phaser';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameState, getGameState } from '../state/GameState';
import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * GameUI - Heads-up display for the game
 *
 * Shows:
 * - Zone/Act information
 * - Wave progress
 * - Gold counter
 * - XP bar
 * - Tank level
 */
export class GameUI {
  private scene: Phaser.Scene;
  private eventManager: EventManager;
  private gameState: GameState;

  // UI Elements
  private container!: Phaser.GameObjects.Container;
  private zoneText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private enemyCountText!: Phaser.GameObjects.Text;

  // HP Bar elements
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private nearDeathIndicator!: Phaser.GameObjects.Text;

  // State
  private displayedGold: number = 0;
  private goldTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventManager = getEventManager();
    this.gameState = getGameState();

    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    this.createUI();
    this.subscribeToEvents();
    this.updateAll();
  }

  private createUI(): void {
    const padding = 20;

    // Zone/Act display (top center)
    this.zoneText = this.scene.add.text(GAME_CONFIG.WIDTH / 2, padding, '', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.zoneText.setOrigin(0.5, 0);
    this.container.add(this.zoneText);

    // Wave display (below zone)
    this.waveText = this.scene.add.text(GAME_CONFIG.WIDTH / 2, padding + 40, '', {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.waveText.setOrigin(0.5, 0);
    this.container.add(this.waveText);

    // Enemy count (below wave)
    this.enemyCountText = this.scene.add.text(GAME_CONFIG.WIDTH / 2, padding + 65, '', {
      fontSize: '16px',
      color: '#ff8888',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.enemyCountText.setOrigin(0.5, 0);
    this.container.add(this.enemyCountText);

    // Gold display (top right)
    const goldIcon = this.scene.add.circle(GAME_CONFIG.WIDTH - padding - 100, padding + 15, 12, 0xffd700);
    this.container.add(goldIcon);

    this.goldText = this.scene.add.text(GAME_CONFIG.WIDTH - padding - 80, padding, '0', {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.goldText.setOrigin(0, 0);
    this.container.add(this.goldText);

    // Level display (top left)
    this.levelText = this.scene.add.text(padding, padding, 'Lv. 1', {
      fontSize: '24px',
      color: '#00ff88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.container.add(this.levelText);

    // XP Bar (below level)
    const xpBarWidth = 200;
    const xpBarHeight = 12;
    const xpBarY = padding + 35;

    this.xpBarBg = this.scene.add.graphics();
    this.xpBarBg.fillStyle(0x333333, 1);
    this.xpBarBg.fillRoundedRect(padding, xpBarY, xpBarWidth, xpBarHeight, 4);
    this.xpBarBg.lineStyle(2, 0x000000, 1);
    this.xpBarBg.strokeRoundedRect(padding, xpBarY, xpBarWidth, xpBarHeight, 4);
    this.container.add(this.xpBarBg);

    this.xpBar = this.scene.add.graphics();
    this.container.add(this.xpBar);

    // HP Bar (below XP bar)
    this.createHPBar();
  }

  private createHPBar(): void {
    const padding = 20;
    const hpBarWidth = 300;
    const hpBarHeight = 20;
    const hpBarY = padding + 55;

    // HP Bar background
    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 1);
    this.hpBarBg.fillRoundedRect(padding, hpBarY, hpBarWidth, hpBarHeight, 6);
    this.hpBarBg.lineStyle(2, 0x000000, 1);
    this.hpBarBg.strokeRoundedRect(padding, hpBarY, hpBarWidth, hpBarHeight, 6);
    this.container.add(this.hpBarBg);

    // HP Bar fill
    this.hpBar = this.scene.add.graphics();
    this.container.add(this.hpBar);

    // HP Text (centered on bar)
    this.hpText = this.scene.add.text(padding + hpBarWidth / 2, hpBarY + hpBarHeight / 2, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.hpText.setOrigin(0.5, 0.5);
    this.container.add(this.hpText);

    // Near Death indicator (hidden by default)
    this.nearDeathIndicator = this.scene.add.text(padding + hpBarWidth + 10, hpBarY + hpBarHeight / 2, '⚠ CRITICAL', {
      fontSize: '14px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.nearDeathIndicator.setOrigin(0, 0.5);
    this.nearDeathIndicator.setVisible(false);
    this.container.add(this.nearDeathIndicator);

    // Initial HP update
    this.updateHPBar();
  }

  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.on(GameEvents.XP_GAINED, this.onXPGained, this);
    this.eventManager.on(GameEvents.LEVEL_UP, this.onLevelUp, this);
    this.eventManager.on(GameEvents.WAVE_STARTED, this.onWaveStarted, this);
    this.eventManager.on(GameEvents.WAVE_COMPLETED, this.onWaveCompleted, this);
    this.eventManager.on(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
    this.eventManager.on(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.on(GameEvents.NEAR_DEATH_ENTERED, this.onNearDeathEntered, this);
    this.eventManager.on(GameEvents.TANK_REVIVED, this.onTankRevived, this);
  }

  private onGoldChanged(payload: { newGold: number; change: number }): void {
    this.animateGoldChange(payload.newGold, payload.change);
  }

  private onXPGained(_payload: { amount: number }): void {
    this.updateXPBar();
  }

  private onLevelUp(payload: { newLevel: number }): void {
    this.updateLevel(payload.newLevel);
    this.updateXPBar();

    // Level up flash effect
    this.levelText.setTint(0xffff00);
    this.scene.time.delayedCall(200, () => {
      this.levelText.clearTint();
    });
  }

  private onWaveStarted(payload: { waveNumber: number; enemyCount: number }): void {
    this.updateWaveText(payload.waveNumber, payload.enemyCount);
  }

  private onWaveCompleted(_payload: { waveNumber: number }): void {
    this.waveText.setText('Wave Complete!');
    this.waveText.setColor('#00ff00');

    this.scene.time.delayedCall(1500, () => {
      this.waveText.setColor('#ffff00');
    });
  }

  private onEnemyDied(_payload: unknown): void {
    // Update enemy count if we're tracking it
    // This will be handled by WaveSystem updating us
  }

  private onDamageTaken(_payload: { damage: number; remainingHealth: number }): void {
    this.updateHPBar();
    this.flashHPBar();
  }

  private onNearDeathEntered(_payload: { currentHealth: number }): void {
    this.updateHPBar();
    this.showNearDeathIndicator();
  }

  private onTankRevived(_payload: { restoredHealth: number }): void {
    this.updateHPBar();
    this.hideNearDeathIndicator();
  }

  private updateHPBar(): void {
    const stats = this.gameState.getTankStats();
    const currentHP = stats.currentHP;
    const maxHP = stats.maxHP;
    const percent = Math.max(0, Math.min(currentHP / maxHP, 1));

    const padding = 20;
    const hpBarWidth = 300;
    const hpBarHeight = 20;
    const hpBarY = padding + 55;

    this.hpBar.clear();

    // Color based on health percentage
    let color = 0x00ff00; // Green
    if (percent <= 0.2) {
      color = 0xff0000; // Red (Near Death)
    } else if (percent <= 0.5) {
      color = 0xffff00; // Yellow
    }

    // Fill bar
    if (percent > 0) {
      this.hpBar.fillStyle(color, 1);
      this.hpBar.fillRoundedRect(
        padding + 2,
        hpBarY + 2,
        (hpBarWidth - 4) * percent,
        hpBarHeight - 4,
        4
      );
    }

    // Update text
    this.hpText.setText(`${this.formatNumber(currentHP)} / ${this.formatNumber(maxHP)}`);

    // Show near death indicator if below 20%
    if (percent <= 0.2 && currentHP > 0) {
      this.showNearDeathIndicator();
    } else {
      this.hideNearDeathIndicator();
    }
  }

  private flashHPBar(): void {
    // Flash effect when taking damage
    this.hpBarBg.setAlpha(0.5);
    this.scene.time.delayedCall(100, () => {
      this.hpBarBg.setAlpha(1);
    });
  }

  private showNearDeathIndicator(): void {
    this.nearDeathIndicator.setVisible(true);

    // Pulsing animation
    if (!this.scene.tweens.isTweening(this.nearDeathIndicator)) {
      this.scene.tweens.add({
        targets: this.nearDeathIndicator,
        alpha: { from: 1, to: 0.3 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private hideNearDeathIndicator(): void {
    this.nearDeathIndicator.setVisible(false);
    this.scene.tweens.killTweensOf(this.nearDeathIndicator);
    this.nearDeathIndicator.setAlpha(1);
  }

  private animateGoldChange(targetGold: number, change: number): void {
    // Cancel existing tween
    if (this.goldTween) {
      this.goldTween.stop();
    }

    // Show change indicator
    if (change !== 0) {
      const sign = change > 0 ? '+' : '';
      const color = change > 0 ? '#00ff00' : '#ff0000';
      const changeText = this.scene.add.text(
        this.goldText.x,
        this.goldText.y + 25,
        `${sign}${this.formatNumber(change)}`,
        {
          fontSize: '16px',
          color,
          stroke: '#000000',
          strokeThickness: 2,
        }
      );

      this.scene.tweens.add({
        targets: changeText,
        y: changeText.y - 20,
        alpha: 0,
        duration: 1000,
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

    const padding = 20;
    const xpBarWidth = 200;
    const xpBarHeight = 12;
    const xpBarY = padding + 35;

    this.xpBar.clear();
    this.xpBar.fillStyle(0x00ff88, 1);
    this.xpBar.fillRoundedRect(
      padding + 2,
      xpBarY + 2,
      (xpBarWidth - 4) * percent,
      xpBarHeight - 4,
      3
    );
  }

  private updateWaveText(wave: number, enemyCount: number): void {
    this.waveText.setText(`Wave ${wave}/${GAME_CONFIG.WAVES_PER_ZONE}`);
    this.waveText.setColor('#ffff00');
    this.enemyCountText.setText(`Enemies: ${enemyCount}`);
  }

  public updateEnemyCount(remaining: number): void {
    this.enemyCountText.setText(`Enemies: ${remaining}`);
  }

  private updateZoneText(): void {
    const act = this.gameState.getCurrentAct();
    const zone = this.gameState.getCurrentZone();
    this.zoneText.setText(`Act ${act} - Zone ${zone}`);
  }

  private updateAll(): void {
    this.updateZoneText();
    this.updateLevel(this.gameState.getTankLevel());
    this.updateXPBar();
    this.updateHPBar();
    this.displayedGold = this.gameState.getGold();
    this.goldText.setText(this.formatNumber(this.displayedGold));
  }

  private formatNumber(num: number): string {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Update called each frame
   */
  public update(_time: number, _delta: number): void {
    // Any per-frame UI updates can go here
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.off(GameEvents.XP_GAINED, this.onXPGained, this);
    this.eventManager.off(GameEvents.LEVEL_UP, this.onLevelUp, this);
    this.eventManager.off(GameEvents.WAVE_STARTED, this.onWaveStarted, this);
    this.eventManager.off(GameEvents.WAVE_COMPLETED, this.onWaveCompleted, this);
    this.eventManager.off(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
    this.eventManager.off(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.off(GameEvents.NEAR_DEATH_ENTERED, this.onNearDeathEntered, this);
    this.eventManager.off(GameEvents.TANK_REVIVED, this.onTankRevived, this);

    if (this.goldTween) {
      this.goldTween.stop();
    }

    this.scene.tweens.killTweensOf(this.nearDeathIndicator);
    this.container.destroy(true);
  }
}
