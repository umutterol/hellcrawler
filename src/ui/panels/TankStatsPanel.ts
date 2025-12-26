import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { GameState, getGameState } from '../../state/GameState';
import { EventManager, getEventManager } from '../../managers/EventManager';
import { GameEvents } from '../../types/GameEvents';
import { TankStatType } from '../../types/GameTypes';

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
 * TankStatsPanel - Sliding panel for upgrading tank stats
 *
 * Based on UISpec.md Tank Stats Panel:
 * - View tank info, upgrade stats, upgrade module slots
 * - Shows 4 tank stats with upgrade buttons
 * - Shows 5 module slots with upgrade buttons
 */
export class TankStatsPanel extends SlidingPanel {
  // Initialize before super() is called since createContent() needs these
  private gameState: GameState = getGameState();
  private eventManager: EventManager = getEventManager();

  // Stat rows
  private statRows: Map<TankStatType, StatRowElement> = new Map();

  // Layout constants
  private static readonly ROW_HEIGHT = 64;

  // Stat configurations
  private static readonly STAT_CONFIGS: StatConfig[] = [
    {
      type: TankStatType.MaxHP,
      name: 'Vitality',
      description: 'Max HP',
      color: 0xff4444,
      perLevel: 10,
      suffix: '',
      getValue: (level) => 100 + level * 10,
      formatValue: (v) => v.toFixed(0),
    },
    {
      type: TankStatType.Defense,
      name: 'Barrier',
      description: 'Defense',
      color: 0x4488ff,
      perLevel: 0.5,
      suffix: '%',
      getValue: (level) => level * 0.5,
      formatValue: (v) => v.toFixed(1),
    },
    {
      type: TankStatType.HPRegen,
      name: 'Regeneration',
      description: 'HP Regen',
      color: 0x44ff88,
      perLevel: 0.5,
      suffix: '/s',
      getValue: (level) => level * 0.5,
      formatValue: (v) => v.toFixed(1),
    },
    {
      type: TankStatType.MoveSpeed,
      name: 'Suppression',
      description: 'Enemy Slow',
      color: 0xffaa44,
      perLevel: 1,
      suffix: '%',
      getValue: (level) => level,
      formatValue: (v) => v.toFixed(0),
    },
  ];

  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.TANK_STATS);

    this.setTitle('TANK STATS');
    this.initContent(); // Must be called after super() so gameState is initialized
    this.subscribeToEvents();
  }

  /**
   * Create the panel content
   */
  protected createContent(): void {
    this.createTankHeader();
    this.createStatsSection();
    this.createSlotsSection();
  }

  /**
   * Create tank info header
   */
  private createTankHeader(): void {
    const headerContainer = this.scene.add.container(16, 0);

    // Tank portrait placeholder (64x64)
    const portrait = this.scene.add.graphics();
    portrait.fillStyle(0x3d3d5c, 1);
    portrait.fillRoundedRect(0, 0, 64, 64, 8);
    portrait.lineStyle(2, UI_CONFIG.COLORS.PANEL_BORDER, 1);
    portrait.strokeRoundedRect(0, 0, 64, 64, 8);
    headerContainer.add(portrait);

    // Tank icon (placeholder "T")
    const tankIcon = this.scene.add.text(32, 32, 'T', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    tankIcon.setOrigin(0.5);
    headerContainer.add(tankIcon);

    // Tank name and level
    const tankLevel = this.gameState.getTankLevel();
    const tankName = this.scene.add.text(80, 16, 'HELLCRAWLER', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    headerContainer.add(tankName);

    const levelText = this.scene.add.text(80, 36, `Level ${tankLevel}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    levelText.setName('tankLevelText');
    headerContainer.add(levelText);

    // XP bar placeholder
    const xpBarBg = this.scene.add.graphics();
    xpBarBg.fillStyle(0x1a1a2e, 1);
    xpBarBg.fillRoundedRect(80, 54, this.getContentWidth() - 80, 8, 4);
    headerContainer.add(xpBarBg);

    this.addToContent(headerContainer);
  }

  /**
   * Create stats upgrade section
   */
  private createStatsSection(): void {
    const sectionY = 80;

    // Section header
    const sectionHeader = this.scene.add.container(16, sectionY);
    const headerText = this.scene.add.text(0, 0, 'TANK STATS', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionHeader.add(headerText);

    // Divider line
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionHeader.add(divider);

    this.addToContent(sectionHeader);

    // Stat rows
    TankStatsPanel.STAT_CONFIGS.forEach((config, index) => {
      const rowY = sectionY + 32 + index * TankStatsPanel.ROW_HEIGHT;
      const row = this.createStatRow(config, rowY);
      this.statRows.set(config.type, row);
    });
  }

  /**
   * Create a single stat row
   */
  private createStatRow(config: StatConfig, y: number): StatRowElement {
    const rowContainer = this.scene.add.container(16, y);
    this.addToContent(rowContainer);

    const rowWidth = this.getContentWidth();

    // Stat icon (colored square)
    const icon = this.scene.add.graphics();
    icon.fillStyle(config.color, 1);
    icon.fillRoundedRect(0, 0, 40, 40, 6);
    icon.lineStyle(1, 0xffffff, 0.2);
    icon.strokeRoundedRect(0, 0, 40, 40, 6);
    rowContainer.add(icon);

    // Level badge on icon
    const level = this.gameState.getTankStatLevel(config.type);
    const levelBadge = this.scene.add.container(32, 0);
    const badgeBg = this.scene.add.circle(0, 0, 10, 0x1a1a2e);
    badgeBg.setStrokeStyle(1, config.color);
    const levelText = this.scene.add.text(0, 0, `${level}`, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelText.setOrigin(0.5);
    levelBadge.add([badgeBg, levelText]);
    rowContainer.add(levelBadge);

    // Stat name
    const nameText = this.scene.add.text(52, 6, config.name, {
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    rowContainer.add(nameText);

    // Description
    const descText = this.scene.add.text(52, 24, config.description, {
      fontSize: '11px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    rowContainer.add(descText);

    // Current value -> Next value
    const currentValue = config.getValue(level);
    const nextValue = config.getValue(level + 1);
    const valueText = this.scene.add.text(
      160,
      15,
      `${config.formatValue(currentValue)}${config.suffix} > ${config.formatValue(nextValue)}${config.suffix}`,
      {
        fontSize: '12px',
        color: '#aaaaaa',
      }
    );
    rowContainer.add(valueText);

    // Upgrade button
    const buttonWidth = 80;
    const buttonHeight = 32;
    const upgradeButton = this.scene.add.container(rowWidth - buttonWidth, 4);
    rowContainer.add(upgradeButton);

    // Button background
    const buttonBg = this.scene.add.rectangle(
      buttonWidth / 2,
      buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      UI_CONFIG.COLORS.HEALTH_GREEN
    );
    buttonBg.setInteractive({ useHandCursor: true });
    upgradeButton.add(buttonBg);

    // Gold icon
    const goldIcon = this.scene.add.circle(16, buttonHeight / 2, 6, 0xffd700);
    upgradeButton.add(goldIcon);

    // Cost text
    const cost = this.gameState.getTankStatUpgradeCost(config.type);
    const costText = this.scene.add.text(28, buttonHeight / 2, this.formatCost(cost), {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    costText.setOrigin(0, 0.5);
    upgradeButton.add(costText);

    // Button interactions
    buttonBg.on('pointerover', () => {
      if (this.canUpgrade(config.type)) {
        buttonBg.setFillStyle(0x5dbe80);
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
   * Create module slots section (placeholder for now)
   */
  private createSlotsSection(): void {
    const sectionY = 80 + 32 + TankStatsPanel.STAT_CONFIGS.length * TankStatsPanel.ROW_HEIGHT + 16;

    // Section header
    const sectionHeader = this.scene.add.container(16, sectionY);
    const headerText = this.scene.add.text(0, 0, 'MODULE SLOTS', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionHeader.add(headerText);

    // Divider line
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionHeader.add(divider);

    this.addToContent(sectionHeader);

    // Slot rows (placeholder - will be implemented fully later)
    for (let i = 0; i < 5; i++) {
      const slotY = sectionY + 32 + i * 40;
      const slotRow = this.createSlotRow(i, slotY);
      this.addToContent(slotRow);
    }
  }

  /**
   * Create a slot row (simplified for now)
   */
  private createSlotRow(slotIndex: number, y: number): Phaser.GameObjects.Container {
    const rowContainer = this.scene.add.container(16, y);
    const rowWidth = this.getContentWidth();

    // Slot label
    const slotText = this.scene.add.text(0, 8, `Slot ${slotIndex + 1}`, {
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    });
    rowContainer.add(slotText);

    // Level indicator
    const moduleSlots = this.gameState.getModuleSlots();
    const slotLevel = moduleSlots[slotIndex]?.level ?? 1;
    const levelText = this.scene.add.text(80, 8, `Lv.${slotLevel}`, {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    });
    rowContainer.add(levelText);

    // Locked status for slots 4 and 5
    if (slotIndex >= 3) {
      const lockedText = this.scene.add.text(140, 8, 'LOCKED', {
        fontSize: '12px',
        color: '#ff6666',
      });
      rowContainer.add(lockedText);
    } else {
      // Upgrade button placeholder
      const buttonBg = this.scene.add.rectangle(rowWidth - 40, 12, 70, 24, 0x3d6a37);
      buttonBg.setInteractive({ useHandCursor: true });
      rowContainer.add(buttonBg);

      const cost = (slotLevel + 1) * 100;
      const costText = this.scene.add.text(rowWidth - 40, 12, `${cost}G`, {
        fontSize: '11px',
        color: '#ffd700',
      });
      costText.setOrigin(0.5);
      rowContainer.add(costText);
    }

    return rowContainer;
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
    return this.gameState.canUpgradeTankStat(stat) && this.gameState.canAfford(cost);
  }

  /**
   * Handle upgrade button click
   */
  private onUpgradeClick(stat: TankStatType): void {
    if (!this.canUpgrade(stat)) {
      // Visual feedback for can't upgrade
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

      // Visual feedback for success
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

    const config = TankStatsPanel.STAT_CONFIGS.find((c) => c.type === stat);
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
      row.costText.setColor('#ffffff');
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
      row.buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_DISABLED);
    } else if (canUpgrade) {
      row.buttonBg.setFillStyle(UI_CONFIG.COLORS.HEALTH_GREEN);
    } else {
      row.buttonBg.setFillStyle(0x5a4a37); // Can't afford
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
   * Subscribe to game events
   */
  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.on(GameEvents.LEVEL_UP, this.onLevelUp, this);
  }

  private onGoldChanged(): void {
    if (this.isOpen) {
      this.updateAllButtonStates();
    }
  }

  private onLevelUp(): void {
    if (this.isOpen) {
      for (const stat of this.statRows.keys()) {
        this.updateStatRow(stat);
      }
    }
  }

  /**
   * Refresh panel content when opened
   */
  public refresh(): void {
    for (const stat of this.statRows.keys()) {
      this.updateStatRow(stat);
    }
  }

  /**
   * Cleanup
   */
  public destroy(fromScene?: boolean): void {
    this.eventManager.off(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.off(GameEvents.LEVEL_UP, this.onLevelUp, this);
    this.statRows.clear();
    super.destroy(fromScene);
  }
}
