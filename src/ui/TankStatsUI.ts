import Phaser from 'phaser';
import { GameState, getGameState } from '../state/GameState';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';
import { TankStatType } from '../types/GameTypes';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Stat row UI element
 */
interface StatRowElement {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Graphics;
  levelBadge: Phaser.GameObjects.Container;
  levelText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
  descText: Phaser.GameObjects.Text;
  valueText: Phaser.GameObjects.Text;
  upgradeButton: Phaser.GameObjects.Container;
  buttonBg: Phaser.GameObjects.Rectangle;
  costText: Phaser.GameObjects.Text;
}

/**
 * Stat configuration for display
 */
interface StatConfig {
  type: TankStatType;
  name: string;
  description: string;
  color: number;
  perLevel: number;
  suffix: string;
  getValue: (level: number) => number;
  formatValue: (value: number) => string;
}

/**
 * TankStatsUI - Upgrade panel for tank stats
 * Design inspired by classic RPG stat panels
 */
export class TankStatsUI {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private eventManager: EventManager;

  // Main container
  private container!: Phaser.GameObjects.Container;

  // Stat rows
  private statRows: Map<TankStatType, StatRowElement> = new Map();

  // Visibility state
  private isVisible: boolean = false;

  // Layout constants
  private static readonly PANEL_WIDTH = 500;
  private static readonly PANEL_HEIGHT = 380;
  private static readonly ROW_HEIGHT = 70;
  private static readonly PADDING = 24;

  // Stat configurations
  private static readonly STAT_CONFIGS: StatConfig[] = [
    {
      type: TankStatType.MaxHP,
      name: 'Vitality',
      description: 'Max HP',
      color: 0xff4444,
      perLevel: 25,
      suffix: '',
      getValue: (level) => 200 + level * 25,
      formatValue: (v) => v.toFixed(0),
    },
    {
      type: TankStatType.Defense,
      name: 'Barrier',
      description: 'Defense',
      color: 0x4488ff,
      perLevel: 1,
      suffix: '',
      getValue: (level) => level * 1.0,
      formatValue: (v) => v.toFixed(0),
    },
    {
      type: TankStatType.HPRegen,
      name: 'Regeneration',
      description: 'HP Regen',
      color: 0x44ff88,
      perLevel: 1,
      suffix: '/s',
      getValue: (level) => level * 1.0,
      formatValue: (v) => v.toFixed(1),
    },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameState = getGameState();
    this.eventManager = getEventManager();

    this.createUI();
    this.subscribeToEvents();
    this.hide();
  }

  /**
   * Create the stats panel UI
   */
  private createUI(): void {
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2;

    // Main container
    this.container = this.scene.add.container(centerX, centerY);
    this.container.setDepth(200);

    // Semi-transparent background overlay
    const overlay = this.scene.add.rectangle(
      0,
      0,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT,
      0x000000,
      0.6
    );
    overlay.setInteractive();
    this.container.add(overlay);

    // Panel background with border
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 0.98);
    panelBg.fillRoundedRect(
      -TankStatsUI.PANEL_WIDTH / 2,
      -TankStatsUI.PANEL_HEIGHT / 2,
      TankStatsUI.PANEL_WIDTH,
      TankStatsUI.PANEL_HEIGHT,
      12
    );
    panelBg.lineStyle(3, 0x4a4a6a);
    panelBg.strokeRoundedRect(
      -TankStatsUI.PANEL_WIDTH / 2,
      -TankStatsUI.PANEL_HEIGHT / 2,
      TankStatsUI.PANEL_WIDTH,
      TankStatsUI.PANEL_HEIGHT,
      12
    );
    this.container.add(panelBg);

    // Header bar
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(0x2d2d44, 1);
    headerBg.fillRoundedRect(
      -TankStatsUI.PANEL_WIDTH / 2,
      -TankStatsUI.PANEL_HEIGHT / 2,
      TankStatsUI.PANEL_WIDTH,
      50,
      { tl: 12, tr: 12, bl: 0, br: 0 }
    );
    this.container.add(headerBg);

    // Title
    const titleText = this.scene.add.text(
      0,
      -TankStatsUI.PANEL_HEIGHT / 2 + 25,
      'UPGRADE',
      {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    titleText.setOrigin(0.5, 0.5);
    this.container.add(titleText);

    // Tank level badge
    const tankLevel = this.gameState.getTankLevel();
    const levelBadge = this.scene.add.container(
      -TankStatsUI.PANEL_WIDTH / 2 + 50,
      -TankStatsUI.PANEL_HEIGHT / 2 + 25
    );
    const levelBg = this.scene.add.circle(0, 0, 18, 0x4a7a4a);
    const levelNum = this.scene.add.text(0, 0, `${tankLevel}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelNum.setOrigin(0.5, 0.5);
    levelBadge.add([levelBg, levelNum]);
    this.container.add(levelBadge);

    // Close hint
    const closeHint = this.scene.add.text(
      TankStatsUI.PANEL_WIDTH / 2 - TankStatsUI.PADDING,
      -TankStatsUI.PANEL_HEIGHT / 2 + 25,
      '[TAB]',
      {
        fontSize: '12px',
        color: '#666666',
      }
    );
    closeHint.setOrigin(1, 0.5);
    this.container.add(closeHint);

    // Create stat rows
    const startY = -TankStatsUI.PANEL_HEIGHT / 2 + 80;
    TankStatsUI.STAT_CONFIGS.forEach((config, index) => {
      const rowY = startY + index * TankStatsUI.ROW_HEIGHT;
      const row = this.createStatRow(config, rowY);
      this.statRows.set(config.type, row);
    });
  }

  /**
   * Create a single stat row
   */
  private createStatRow(config: StatConfig, y: number): StatRowElement {
    const rowContainer = this.scene.add.container(0, y);
    this.container.add(rowContainer);

    const leftX = -TankStatsUI.PANEL_WIDTH / 2 + TankStatsUI.PADDING;
    const rightX = TankStatsUI.PANEL_WIDTH / 2 - TankStatsUI.PADDING;

    // Stat icon (colored circle with level badge)
    const icon = this.scene.add.graphics();
    icon.fillStyle(config.color, 1);
    icon.fillRoundedRect(leftX, -20, 44, 44, 8);
    icon.lineStyle(2, 0xffffff, 0.3);
    icon.strokeRoundedRect(leftX, -20, 44, 44, 8);
    rowContainer.add(icon);

    // Level badge on icon
    const level = this.gameState.getTankStatLevel(config.type);
    const levelBadge = this.scene.add.container(leftX + 36, -12);
    const badgeBg = this.scene.add.circle(0, 0, 12, 0x222244);
    badgeBg.setStrokeStyle(2, config.color);
    const levelText = this.scene.add.text(0, 0, `${level}`, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelText.setOrigin(0.5, 0.5);
    levelBadge.add([badgeBg, levelText]);
    rowContainer.add(levelBadge);

    // Stat name
    const nameText = this.scene.add.text(leftX + 56, -12, config.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0, 0.5);
    rowContainer.add(nameText);

    // Description
    const descText = this.scene.add.text(leftX + 56, 10, config.description, {
      fontSize: '12px',
      color: '#888888',
    });
    descText.setOrigin(0, 0.5);
    rowContainer.add(descText);

    // Current value -> Next value
    const currentValue = config.getValue(level);
    const nextValue = config.getValue(level + 1);
    const valueText = this.scene.add.text(
      leftX + 200,
      -1,
      `${config.formatValue(currentValue)}${config.suffix} > ${config.formatValue(nextValue)}${config.suffix}`,
      {
        fontSize: '14px',
        color: '#aaaaaa',
      }
    );
    valueText.setOrigin(0, 0.5);
    rowContainer.add(valueText);

    // Upgrade button container
    const buttonWidth = 100;
    const buttonHeight = 44;
    const upgradeButton = this.scene.add.container(rightX - buttonWidth / 2, 0);
    rowContainer.add(upgradeButton);

    // Button background
    const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x3d6a37);
    buttonBg.setStrokeStyle(2, 0x5d9a57);
    buttonBg.setInteractive({ useHandCursor: true });
    upgradeButton.add(buttonBg);

    // Cost icon (gold circle)
    const goldIcon = this.scene.add.circle(-30, 0, 8, 0xffd700);
    upgradeButton.add(goldIcon);

    // Cost text
    const cost = this.gameState.getTankStatUpgradeCost(config.type);
    const costText = this.scene.add.text(5, 0, this.formatCost(cost), {
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    costText.setOrigin(0, 0.5);
    upgradeButton.add(costText);

    // Button hover effects
    buttonBg.on('pointerover', () => {
      if (this.canUpgrade(config.type)) {
        buttonBg.setFillStyle(0x4d8a47);
      }
    });

    buttonBg.on('pointerout', () => {
      this.updateButtonState(config.type);
    });

    buttonBg.on('pointerdown', () => {
      this.onUpgradeClick(config.type);
    });

    return {
      container: rowContainer,
      icon,
      levelBadge,
      levelText,
      nameText,
      descText,
      valueText,
      upgradeButton,
      buttonBg,
      costText,
    };
  }

  /**
   * Format cost with K/M suffix
   */
  private formatCost(cost: number): string {
    if (cost >= 1_000_000) {
      return (cost / 1_000_000).toFixed(1) + 'M';
    } else if (cost >= 1_000) {
      return (cost / 1_000).toFixed(1) + 'K';
    }
    return cost.toString();
  }

  /**
   * Check if stat can be upgraded
   */
  private canUpgrade(stat: TankStatType): boolean {
    const cost = this.gameState.getTankStatUpgradeCost(stat);
    return (
      this.gameState.canUpgradeTankStat(stat) && this.gameState.canAfford(cost)
    );
  }

  /**
   * Handle upgrade button click
   */
  private onUpgradeClick(stat: TankStatType): void {
    if (!this.canUpgrade(stat)) {
      const row = this.statRows.get(stat);
      if (row) {
        row.buttonBg.setFillStyle(0x7a3737);
        this.scene.time.delayedCall(100, () => {
          this.updateButtonState(stat);
        });
      }
      return;
    }

    const success = this.gameState.upgradeTankStat(stat);
    if (success) {
      this.updateStatRow(stat);
      this.updateAllButtonStates();

      const row = this.statRows.get(stat);
      if (row) {
        row.buttonBg.setFillStyle(0x5dba57);
        this.scene.time.delayedCall(100, () => {
          this.updateButtonState(stat);
        });
      }
    }
  }

  /**
   * Update a stat row's display
   */
  private updateStatRow(stat: TankStatType): void {
    const row = this.statRows.get(stat);
    if (!row) return;

    const config = TankStatsUI.STAT_CONFIGS.find((c) => c.type === stat);
    if (!config) return;

    const level = this.gameState.getTankStatLevel(stat);
    const cost = this.gameState.getTankStatUpgradeCost(stat);
    const atCap = !this.gameState.canUpgradeTankStat(stat);

    // Update level text
    row.levelText.setText(`${level}`);

    // Update value preview
    const currentValue = config.getValue(level);
    if (atCap) {
      row.valueText.setText(`${config.formatValue(currentValue)}${config.suffix} (MAX)`);
      row.valueText.setColor('#ffaa00');
    } else {
      const nextValue = config.getValue(level + 1);
      row.valueText.setText(
        `${config.formatValue(currentValue)}${config.suffix} > ${config.formatValue(nextValue)}${config.suffix}`
      );
      row.valueText.setColor('#aaaaaa');
    }

    // Update cost
    if (atCap) {
      row.costText.setText('MAX');
      row.costText.setColor('#888888');
    } else {
      row.costText.setText(this.formatCost(cost));
      row.costText.setColor('#ffd700');
    }

    this.updateButtonState(stat);
  }

  /**
   * Update button visual state
   */
  private updateButtonState(stat: TankStatType): void {
    const row = this.statRows.get(stat);
    if (!row) return;

    const canUpgrade = this.canUpgrade(stat);
    const atCap = !this.gameState.canUpgradeTankStat(stat);

    if (atCap) {
      row.buttonBg.setFillStyle(0x333344);
      row.buttonBg.setStrokeStyle(2, 0x444455);
    } else if (canUpgrade) {
      row.buttonBg.setFillStyle(0x3d6a37);
      row.buttonBg.setStrokeStyle(2, 0x5d9a57);
    } else {
      row.buttonBg.setFillStyle(0x5a4a37);
      row.buttonBg.setStrokeStyle(2, 0x7a6a57);
    }
  }

  /**
   * Update all button states
   */
  private updateAllButtonStates(): void {
    for (const stat of this.statRows.keys()) {
      this.updateButtonState(stat);
    }
  }

  /**
   * Subscribe to events
   */
  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.on(GameEvents.LEVEL_UP, this.onLevelUp, this);
  }

  private onGoldChanged(): void {
    if (this.isVisible) {
      this.updateAllButtonStates();
    }
  }

  private onLevelUp(): void {
    if (this.isVisible) {
      for (const stat of this.statRows.keys()) {
        this.updateStatRow(stat);
      }
    }
  }

  public show(): void {
    this.isVisible = true;
    this.container.setVisible(true);

    for (const stat of this.statRows.keys()) {
      this.updateStatRow(stat);
    }
  }

  public hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public destroy(): void {
    this.eventManager.off(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.off(GameEvents.LEVEL_UP, this.onLevelUp, this);

    this.container.destroy(true);
    this.statRows.clear();
  }
}
