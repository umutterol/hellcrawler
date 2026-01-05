import Phaser from 'phaser';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameState, getGameState } from '../state/GameState';
import { GameEvents } from '../types/GameEvents';
import { UI_CONFIG, ZONE_CONFIG } from '../config/UIConfig';
import { GAME_CONFIG } from '../config/GameConfig';
import { ZoneSelectionPanel } from './components/ZoneSelectionPanel';

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
  private goldRateText!: Phaser.GameObjects.Text;
  private displayedGold: number = 0;
  private goldTween: Phaser.Tweens.Tween | null = null;

  // Gold rate tracking
  private goldHistory: { time: number; amount: number }[] = [];
  private readonly GOLD_RATE_WINDOW = 10000; // 10 second window for rate calculation
  private goldRateUpdateTimer: number = 0;
  private readonly GOLD_RATE_UPDATE_INTERVAL = 500; // Update rate display every 500ms

  // Center section - Level & XP
  private levelText!: Phaser.GameObjects.Text;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;

  // Right section - Zone and Flee
  private zoneText!: Phaser.GameObjects.Text;
  private zoneSelectionPanel: ZoneSelectionPanel | null = null;
  private fleeButton!: Phaser.GameObjects.Container;

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
    this.createFleeButton();
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
    // Transparent background for desktop mode - just a subtle bottom border
    this.background.lineStyle(1, 0x3d3d5c, 0.5);
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

    // Gold rate text (positioned after gold amount, updated dynamically)
    this.goldRateText = this.scene.add.text(x + 100, y, '', {
      fontSize: '14px',
      color: '#4ade80', // Green for positive income
    });
    this.goldRateText.setOrigin(0, 0.5);
    this.container.add(this.goldRateText);
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

  private createFleeButton(): void {
    const buttonWidth = 55;
    const buttonHeight = 28;
    const x = GAME_CONFIG.WIDTH - this.PADDING - buttonWidth / 2;
    const y = this.HEIGHT / 2;

    this.fleeButton = this.scene.add.container(x, y);

    // Button background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x8b0000, 1); // Dark red
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
    bg.lineStyle(1, 0xcc3333, 1);
    bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
    this.fleeButton.add(bg);

    // Button text
    const text = this.scene.add.text(0, 0, 'FLEE', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    this.fleeButton.add(text);

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xaa2222, 1); // Lighter red on hover
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
      bg.lineStyle(1, 0xff4444, 1);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x8b0000, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
      bg.lineStyle(1, 0xcc3333, 1);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 4);
    });

    hitArea.on('pointerdown', () => {
      this.onFleeClicked();
    });

    this.fleeButton.add(hitArea);
    this.container.add(this.fleeButton);
  }

  private onFleeClicked(): void {
    // Get current zone before fleeing
    const previousAct = this.gameState.getCurrentAct();
    const previousZone = this.gameState.getCurrentZone();

    // Retreat to Act 1 Zone 1
    this.gameState.setZone(1, 1);
    this.eventManager.emit(GameEvents.ZONE_CHANGED, {
      previousAct,
      previousZone,
      newAct: 1,
      newZone: 1,
    });

    if (import.meta.env.DEV) {
      console.log('[TopBar] Fled to Act 1, Zone 1');
    }
  }

  private createZoneSection(): void {
    // Position zone text to the left of the flee button
    const fleeButtonWidth = 55;
    const x = GAME_CONFIG.WIDTH - this.PADDING - fleeButtonWidth - 12;
    const y = this.HEIGHT / 2;

    this.zoneText = this.scene.add.text(x, y, 'Act 1 - Zone 1', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.zoneText.setOrigin(1, 0.5);
    this.zoneText.setInteractive({ useHandCursor: true });

    // Hover effects
    this.zoneText.on('pointerover', () => {
      this.zoneText.setColor('#4ecdc4'); // Cyan on hover
    });

    this.zoneText.on('pointerout', () => {
      this.zoneText.setColor('#ffffff');
    });

    // Click to open zone selection
    this.zoneText.on('pointerdown', () => {
      this.toggleZoneSelection();
    });

    this.container.add(this.zoneText);
  }

  private toggleZoneSelection(): void {
    if (this.zoneSelectionPanel) {
      this.closeZoneSelection();
      return;
    }

    // Position panel below the zone text, aligned to right edge
    const panelX = GAME_CONFIG.WIDTH - this.PADDING - ZONE_CONFIG.PANEL_WIDTH;
    const panelY = this.HEIGHT + 4;

    this.zoneSelectionPanel = new ZoneSelectionPanel(
      this.scene,
      panelX,
      panelY,
      {
        onZoneSelected: (act: number, zone: number) => {
          this.updateZoneText();
          // Notify game scene to reset waves
          if (import.meta.env.DEV) {
            console.log(`[TopBar] Zone selected: Act ${act}, Zone ${zone}`);
          }
        },
        onClose: () => {
          this.zoneSelectionPanel = null;
        },
      }
    );
  }

  private closeZoneSelection(): void {
    if (this.zoneSelectionPanel) {
      this.zoneSelectionPanel.destroy();
      this.zoneSelectionPanel = null;
    }
  }

  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.on(GameEvents.XP_GAINED, this.onXPChanged, this);
    this.eventManager.on(GameEvents.LEVEL_UP, this.onLevelUp, this);
    this.eventManager.on(GameEvents.ZONE_CHANGED, this.onZoneChanged, this);
    this.eventManager.on(GameEvents.ZONE_COMPLETED, this.onZoneCompleted, this);
  }

  private onZoneChanged(): void {
    this.updateZoneText();
  }

  private onZoneCompleted(): void {
    this.updateZoneText();
  }

  private onGoldChanged(payload: { newGold: number; change: number }): void {
    this.animateGoldChange(payload.newGold, payload.change);

    // Track positive gold income for rate calculation
    if (payload.change > 0) {
      this.goldHistory.push({
        time: Date.now(),
        amount: payload.change,
      });

      // Clean up old entries outside the window
      const cutoff = Date.now() - this.GOLD_RATE_WINDOW;
      this.goldHistory = this.goldHistory.filter((entry) => entry.time > cutoff);
    }
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

    // Get zone name from config if available
    const zoneNames = ZONE_CONFIG.ZONES[act];
    const zoneName = zoneNames?.[zone - 1] ?? `Zone ${zone}`;

    this.zoneText.setText(`Act ${act}: ${zoneName} ▼`);
  }

  private updateAll(): void {
    this.displayedGold = this.gameState.getGold();
    this.goldText.setText(this.formatNumber(this.displayedGold));
    this.updateLevel(this.gameState.getTankLevel());
    this.updateXPBar();
    this.updateZoneText();
    this.updateGoldRateDisplay();
  }

  /**
   * Update method called each frame (for gold rate timer)
   */
  public update(_time: number, delta: number): void {
    this.goldRateUpdateTimer += delta;

    if (this.goldRateUpdateTimer >= this.GOLD_RATE_UPDATE_INTERVAL) {
      this.goldRateUpdateTimer = 0;
      this.updateGoldRateDisplay();
    }
  }

  /**
   * Calculate gold income rate per second
   */
  private calculateGoldRate(): number {
    const now = Date.now();
    const cutoff = now - this.GOLD_RATE_WINDOW;

    // Filter to entries within window
    const recentEntries = this.goldHistory.filter((entry) => entry.time > cutoff);

    if (recentEntries.length === 0) {
      return 0;
    }

    // Sum up all gold earned
    const totalGold = recentEntries.reduce((sum, entry) => sum + entry.amount, 0);

    // Calculate time span (use actual window or time since first entry)
    const oldestEntry = recentEntries[0];
    if (!oldestEntry) return 0;
    const timeSpan = Math.max(1000, now - oldestEntry.time); // At least 1 second

    // Return rate per second
    return (totalGold / timeSpan) * 1000;
  }

  /**
   * Update the gold rate display
   */
  private updateGoldRateDisplay(): void {
    const rate = this.calculateGoldRate();

    // Position rate text after gold amount
    this.goldRateText.x = this.goldText.x + this.goldText.width + 10;

    if (rate > 0) {
      const formattedRate = this.formatNumber(Math.round(rate));
      this.goldRateText.setText(`+${formattedRate}/s`);
      this.goldRateText.setVisible(true);
    } else {
      this.goldRateText.setVisible(false);
    }
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
    this.eventManager.off(GameEvents.ZONE_CHANGED, this.onZoneChanged, this);
    this.eventManager.off(GameEvents.ZONE_COMPLETED, this.onZoneCompleted, this);

    if (this.goldTween) {
      this.goldTween.stop();
    }

    this.closeZoneSelection();
    this.container.destroy(true);
  }
}
