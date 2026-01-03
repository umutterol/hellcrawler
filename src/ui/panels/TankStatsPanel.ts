import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { GameState, getGameState } from '../../state/GameState';
import { EventManager, getEventManager } from '../../managers/EventManager';
import { GameEvents } from '../../types/GameEvents';
import { TankStatType } from '../../types/GameTypes';
import { SlotStatType } from '../../types/ModuleTypes';

/**
 * Tab types for the panel
 */
enum TabType {
  Tank = 'tank',
  Slot1 = 'slot1',
  Slot2 = 'slot2',
  Slot3 = 'slot3',
  Slot4 = 'slot4',
  Slot5 = 'slot5',
}

/**
 * Stat row UI element
 */
interface StatRowElement {
  container: Phaser.GameObjects.Container;
  levelText: Phaser.GameObjects.Text;
  valueText: Phaser.GameObjects.Text;
  buttonBg: Phaser.GameObjects.Rectangle;
  costText: Phaser.GameObjects.Text;
}

/**
 * Tab button element
 */
interface TabElement {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  lockIcon?: Phaser.GameObjects.Text;
}

/**
 * TankStatsPanel - Sliding panel for upgrading tank and slot stats
 *
 * Features 6 tabs:
 * - Tank: Vitality, Barrier, Regeneration, Suppression
 * - Slot 1-5: Damage%, Attack Speed%, CDR% (per slot)
 */
export class TankStatsPanel extends SlidingPanel {
  private gameState: GameState = getGameState();
  private eventManager: EventManager = getEventManager();

  // Current active tab
  private activeTab: TabType = TabType.Tank;

  // Tab elements
  private tabs: Map<TabType, TabElement> = new Map();

  // Content container (changes based on tab)
  private contentContainer: Phaser.GameObjects.Container | null = null;

  // Current stat rows (for active tab)
  private statRows: Map<string, StatRowElement> = new Map();

  // Layout constants - wider for 525px window
  private static readonly TAB_HEIGHT = 32;
  private static readonly TAB_WIDTH = 76; // Wider tabs for better labels
  private static readonly ROW_HEIGHT = 52; // More breathing room

  // Tank stat configs
  private static readonly TANK_STATS = [
    { type: TankStatType.MaxHP, name: 'Vitality', desc: 'Max HP', color: 0xff4444, getValue: (l: number) => 200 + l * 25, suffix: '' },
    { type: TankStatType.Defense, name: 'Barrier', desc: 'Defense', color: 0x4488ff, getValue: (l: number) => l * 1.0, suffix: '' },
    { type: TankStatType.HPRegen, name: 'Regeneration', desc: 'HP Regen', color: 0x44ff88, getValue: (l: number) => l * 1.0, suffix: '/s' },
  ];

  // Slot stat configs
  private static readonly SLOT_STATS = [
    { type: SlotStatType.Damage, name: 'Damage', desc: '+1% per level', color: 0xff6b6b },
    { type: SlotStatType.AttackSpeed, name: 'Attack Speed', desc: '+1% per level', color: 0x4ecdc4 },
    { type: SlotStatType.CDR, name: 'Cooldown Reduction', desc: '+1% per level', color: 0x9b59b6 },
  ];

  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.TANK_STATS);
    this.setTitle('UPGRADES');
    this.initContent();
    this.subscribeToEvents();
  }

  protected createContent(): void {
    this.createTabBar();
    this.createContentArea();
    this.switchToTab(TabType.Tank);
  }

  /**
   * Create the tab bar with 6 tabs
   */
  private createTabBar(): void {
    const tabBarY = 0;
    const tabTypes = [TabType.Tank, TabType.Slot1, TabType.Slot2, TabType.Slot3, TabType.Slot4, TabType.Slot5];
    const tabLabels = ['Tank', 'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5'];

    for (let i = 0; i < tabTypes.length; i++) {
      const tabType = tabTypes[i]!;
      const x = 8 + i * (TankStatsPanel.TAB_WIDTH + 4);
      const tab = this.createTab(x, tabBarY, tabLabels[i]!, tabType, i);
      this.tabs.set(tabType, tab);
    }
  }

  /**
   * Create a single tab
   */
  private createTab(x: number, y: number, label: string, tabType: TabType, index: number): TabElement {
    const container = this.scene.add.container(x, y);
    this.addToContent(container);

    // Background
    const background = this.scene.add.rectangle(
      TankStatsPanel.TAB_WIDTH / 2,
      TankStatsPanel.TAB_HEIGHT / 2,
      TankStatsPanel.TAB_WIDTH,
      TankStatsPanel.TAB_HEIGHT,
      0x2d2d4a
    );
    background.setStrokeStyle(1, UI_CONFIG.COLORS.PANEL_BORDER);
    background.setInteractive({ useHandCursor: true });
    container.add(background);

    // Label - consistent font size for wider tabs
    const text = this.scene.add.text(TankStatsPanel.TAB_WIDTH / 2, TankStatsPanel.TAB_HEIGHT / 2, label, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    container.add(text);

    // Lock icon for slot tabs (if locked)
    let lockIcon: Phaser.GameObjects.Text | undefined;
    if (index > 0) {
      const slotIndex = index - 1;
      const slot = this.gameState.getModuleSlots()[slotIndex];
      if (!slot?.unlocked) {
        lockIcon = this.scene.add.text(TankStatsPanel.TAB_WIDTH / 2, TankStatsPanel.TAB_HEIGHT / 2, '🔒', {
          fontSize: '14px',
        });
        lockIcon.setOrigin(0.5);
        container.add(lockIcon);
        text.setVisible(false);
      }
    }

    // Tab click handler
    background.on('pointerdown', () => {
      this.switchToTab(tabType);
    });

    background.on('pointerover', () => {
      if (tabType !== this.activeTab) {
        background.setFillStyle(0x3d3d5c);
      }
    });

    background.on('pointerout', () => {
      if (tabType !== this.activeTab) {
        background.setFillStyle(0x2d2d4a);
      }
    });

    return { container, background, text, lockIcon };
  }

  /**
   * Create the content area container
   */
  private createContentArea(): void {
    this.contentContainer = this.scene.add.container(0, TankStatsPanel.TAB_HEIGHT + 8);
    this.addToContent(this.contentContainer);
  }

  /**
   * Switch to a specific tab
   */
  private switchToTab(tabType: TabType): void {
    // Update tab visuals
    for (const [type, tab] of this.tabs) {
      if (type === tabType) {
        tab.background.setFillStyle(0x4a4a6a);
        tab.background.setStrokeStyle(2, 0x6a6a8a);
      } else {
        tab.background.setFillStyle(0x2d2d4a);
        tab.background.setStrokeStyle(1, UI_CONFIG.COLORS.PANEL_BORDER);
      }
    }

    this.activeTab = tabType;

    // Clear current content
    if (this.contentContainer) {
      this.contentContainer.removeAll(true);
    }
    this.statRows.clear();

    // Create new content
    if (tabType === TabType.Tank) {
      this.createTankContent();
    } else {
      const slotIndex = this.getSlotIndexFromTab(tabType);
      this.createSlotContent(slotIndex);
    }
  }

  /**
   * Get slot index from tab type
   */
  private getSlotIndexFromTab(tabType: TabType): number {
    switch (tabType) {
      case TabType.Slot1: return 0;
      case TabType.Slot2: return 1;
      case TabType.Slot3: return 2;
      case TabType.Slot4: return 3;
      case TabType.Slot5: return 4;
      default: return 0;
    }
  }

  /**
   * Create tank stats content
   */
  private createTankContent(): void {
    if (!this.contentContainer) return;

    // Header
    const header = this.scene.add.text(12, 0, 'TANK STATS', {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    this.contentContainer.add(header);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(12, 16, this.getContentWidth() - 12, 16);
    this.contentContainer.add(divider);

    // Stat rows
    TankStatsPanel.TANK_STATS.forEach((stat, index) => {
      const rowY = 24 + index * TankStatsPanel.ROW_HEIGHT;
      const row = this.createTankStatRow(stat, rowY);
      this.statRows.set(stat.type, row);
    });

    // Set content height for scrolling
    const totalHeight = 24 + TankStatsPanel.TANK_STATS.length * TankStatsPanel.ROW_HEIGHT + 16;
    this.setContentHeight(TankStatsPanel.TAB_HEIGHT + 8 + totalHeight);
  }

  /**
   * Create a tank stat row (compact)
   */
  private createTankStatRow(
    stat: typeof TankStatsPanel.TANK_STATS[0],
    y: number
  ): StatRowElement {
    const container = this.scene.add.container(12, y);
    this.contentContainer!.add(container);

    const level = this.gameState.getTankStatLevel(stat.type);
    const atCap = !this.gameState.canUpgradeTankStat(stat.type);

    // Icon - smaller
    const icon = this.scene.add.graphics();
    icon.fillStyle(stat.color, 1);
    icon.fillRoundedRect(0, 0, 28, 28, 4);
    container.add(icon);

    // Level badge - smaller
    const levelBadge = this.scene.add.circle(22, 0, 8, 0x1a1a2e);
    levelBadge.setStrokeStyle(1, stat.color);
    container.add(levelBadge);

    const levelText = this.scene.add.text(22, 0, `${level}`, {
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelText.setOrigin(0.5);
    container.add(levelText);

    // Name - smaller
    const nameText = this.scene.add.text(36, 2, stat.name, {
      fontSize: '11px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    container.add(nameText);

    // Value preview - smaller
    const currentValue = stat.getValue(level);
    const nextValue = stat.getValue(level + 1);
    const valueText = this.scene.add.text(
      36, 16,
      atCap ? `${currentValue.toFixed(1)}${stat.suffix} (MAX)` : `${currentValue.toFixed(1)}${stat.suffix} > ${nextValue.toFixed(1)}${stat.suffix}`,
      { fontSize: '9px', color: atCap ? '#ffaa00' : '#888888' }
    );
    container.add(valueText);

    // Upgrade button - wider for better readability
    const buttonWidth = 80;
    const cost = this.gameState.getTankStatUpgradeCost(stat.type);
    const canAfford = this.gameState.canAfford(cost);

    let initialColor: number = UI_CONFIG.COLORS.HEALTH_GREEN;
    if (atCap) {
      initialColor = UI_CONFIG.COLORS.BUTTON_DISABLED;
    } else if (!canAfford) {
      initialColor = 0x5a4a37;
    }

    const buttonBg = this.scene.add.rectangle(this.getContentWidth() - 24 - buttonWidth / 2, 14, buttonWidth, 22, initialColor);
    container.add(buttonBg);

    const costText = this.scene.add.text(this.getContentWidth() - 24 - buttonWidth / 2, 14, atCap ? 'MAX' : this.formatCost(cost), {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    costText.setOrigin(0.5);
    container.add(costText);

    if (!atCap) {
      buttonBg.setInteractive({ useHandCursor: true });
      buttonBg.on('pointerdown', () => this.onTankStatUpgrade(stat.type));
      buttonBg.on('pointerover', () => {
        if (this.canUpgradeTankStat(stat.type)) buttonBg.setFillStyle(0x5dbe80);
      });
      buttonBg.on('pointerout', () => this.updateTankStatButton(stat.type));
    }

    return { container, levelText, valueText, buttonBg, costText };
  }

  /**
   * Create slot stats content
   */
  private createSlotContent(slotIndex: number): void {
    if (!this.contentContainer) return;

    const slot = this.gameState.getModuleSlots()[slotIndex];
    const isUnlocked = slot?.unlocked ?? false;

    // Header
    const header = this.scene.add.text(12, 0, `SLOT ${slotIndex + 1} UPGRADES`, {
      fontSize: '12px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    this.contentContainer.add(header);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(12, 16, this.getContentWidth() - 12, 16);
    this.contentContainer.add(divider);

    if (!isUnlocked) {
      // Show locked message
      const lockMessage = this.scene.add.text(
        this.getContentWidth() / 2, 60,
        '🔒 SLOT LOCKED\n\nUnlock in Shop',
        {
          fontSize: '12px',
          color: '#ff6666',
          align: 'center',
        }
      );
      lockMessage.setOrigin(0.5);
      this.contentContainer.add(lockMessage);
      this.setContentHeight(TankStatsPanel.TAB_HEIGHT + 8 + 120);
      return;
    }

    // Slot stat rows
    TankStatsPanel.SLOT_STATS.forEach((stat, index) => {
      const rowY = 24 + index * TankStatsPanel.ROW_HEIGHT;
      const row = this.createSlotStatRow(slotIndex, stat, rowY);
      this.statRows.set(`${slotIndex}_${stat.type}`, row);
    });

    // Set content height for scrolling
    const totalHeight = 24 + TankStatsPanel.SLOT_STATS.length * TankStatsPanel.ROW_HEIGHT + 16;
    this.setContentHeight(TankStatsPanel.TAB_HEIGHT + 8 + totalHeight);
  }

  /**
   * Create a slot stat row (compact)
   */
  private createSlotStatRow(
    slotIndex: number,
    stat: typeof TankStatsPanel.SLOT_STATS[0],
    y: number
  ): StatRowElement {
    const container = this.scene.add.container(12, y);
    this.contentContainer!.add(container);

    const level = this.gameState.getSlotStatLevel(slotIndex, stat.type);
    const atCap = !this.gameState.canUpgradeSlotStat(slotIndex, stat.type);

    // Icon - smaller
    const icon = this.scene.add.graphics();
    icon.fillStyle(stat.color, 1);
    icon.fillRoundedRect(0, 0, 28, 28, 4);
    container.add(icon);

    // Level badge - smaller
    const levelBadge = this.scene.add.circle(22, 0, 8, 0x1a1a2e);
    levelBadge.setStrokeStyle(1, stat.color);
    container.add(levelBadge);

    const levelText = this.scene.add.text(22, 0, `${level}`, {
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelText.setOrigin(0.5);
    container.add(levelText);

    // Name - smaller
    const nameText = this.scene.add.text(36, 2, stat.name, {
      fontSize: '11px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    container.add(nameText);

    // Value preview - smaller
    const currentBonus = level;
    const nextBonus = level + 1;
    const valueText = this.scene.add.text(
      36, 16,
      atCap ? `+${currentBonus}% (MAX)` : `+${currentBonus}% > +${nextBonus}%`,
      { fontSize: '9px', color: atCap ? '#ffaa00' : '#888888' }
    );
    container.add(valueText);

    // Upgrade button - wider for better readability
    const buttonWidth = 80;
    const cost = this.gameState.getSlotStatUpgradeCost(slotIndex, stat.type);
    const canAfford = this.gameState.canAfford(cost);

    let initialColor: number = UI_CONFIG.COLORS.HEALTH_GREEN;
    if (atCap) {
      initialColor = UI_CONFIG.COLORS.BUTTON_DISABLED;
    } else if (!canAfford) {
      initialColor = 0x5a4a37;
    }

    const buttonBg = this.scene.add.rectangle(this.getContentWidth() - 24 - buttonWidth / 2, 14, buttonWidth, 22, initialColor);
    container.add(buttonBg);

    const costText = this.scene.add.text(this.getContentWidth() - 24 - buttonWidth / 2, 14, atCap ? 'MAX' : this.formatCost(cost), {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    costText.setOrigin(0.5);
    container.add(costText);

    if (!atCap) {
      buttonBg.setInteractive({ useHandCursor: true });
      buttonBg.on('pointerdown', () => this.onSlotStatUpgrade(slotIndex, stat.type));
      buttonBg.on('pointerover', () => {
        if (this.canUpgradeSlotStat(slotIndex, stat.type)) buttonBg.setFillStyle(0x5dbe80);
      });
      buttonBg.on('pointerout', () => this.updateSlotStatButton(slotIndex, stat.type));
    }

    return { container, levelText, valueText, buttonBg, costText };
  }

  // ============================================================================
  // UPGRADE LOGIC
  // ============================================================================

  private canUpgradeTankStat(stat: TankStatType): boolean {
    const cost = this.gameState.getTankStatUpgradeCost(stat);
    return this.gameState.canUpgradeTankStat(stat) && this.gameState.canAfford(cost);
  }

  private canUpgradeSlotStat(slotIndex: number, stat: SlotStatType): boolean {
    const cost = this.gameState.getSlotStatUpgradeCost(slotIndex, stat);
    return this.gameState.canUpgradeSlotStat(slotIndex, stat) && this.gameState.canAfford(cost);
  }

  private onTankStatUpgrade(stat: TankStatType): void {
    if (!this.canUpgradeTankStat(stat)) {
      const row = this.statRows.get(stat);
      if (row) {
        row.buttonBg.setFillStyle(0x7a3737);
        this.scene.time.delayedCall(100, () => this.updateTankStatButton(stat));
      }
      return;
    }

    const success = this.gameState.upgradeTankStat(stat);
    if (success) {
      this.switchToTab(this.activeTab); // Refresh content
    }
  }

  private onSlotStatUpgrade(slotIndex: number, stat: SlotStatType): void {
    if (!this.canUpgradeSlotStat(slotIndex, stat)) {
      const row = this.statRows.get(`${slotIndex}_${stat}`);
      if (row) {
        row.buttonBg.setFillStyle(0x7a3737);
        this.scene.time.delayedCall(100, () => this.updateSlotStatButton(slotIndex, stat));
      }
      return;
    }

    const success = this.gameState.upgradeSlotStat(slotIndex, stat);
    if (success) {
      this.switchToTab(this.activeTab); // Refresh content
    }
  }

  private updateTankStatButton(stat: TankStatType): void {
    const row = this.statRows.get(stat);
    if (!row) return;

    const canUpgrade = this.canUpgradeTankStat(stat);
    const atCap = !this.gameState.canUpgradeTankStat(stat);

    if (atCap) {
      row.buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_DISABLED);
    } else if (canUpgrade) {
      row.buttonBg.setFillStyle(UI_CONFIG.COLORS.HEALTH_GREEN);
    } else {
      row.buttonBg.setFillStyle(0x5a4a37);
    }
  }

  private updateSlotStatButton(slotIndex: number, stat: SlotStatType): void {
    const row = this.statRows.get(`${slotIndex}_${stat}`);
    if (!row) return;

    const canUpgrade = this.canUpgradeSlotStat(slotIndex, stat);
    const atCap = !this.gameState.canUpgradeSlotStat(slotIndex, stat);

    if (atCap) {
      row.buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_DISABLED);
    } else if (canUpgrade) {
      row.buttonBg.setFillStyle(UI_CONFIG.COLORS.HEALTH_GREEN);
    } else {
      row.buttonBg.setFillStyle(0x5a4a37);
    }
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  private formatCost(cost: number): string {
    if (cost >= 1_000_000) return (cost / 1_000_000).toFixed(1) + 'M';
    if (cost >= 1_000) return (cost / 1_000).toFixed(1) + 'K';
    return cost.toString();
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.on(GameEvents.LEVEL_UP, this.onLevelUp, this);
    this.eventManager.on(GameEvents.SLOT_UNLOCKED, this.onSlotUnlocked, this);
    this.eventManager.on(GameEvents.SLOT_STAT_UPGRADED, this.onSlotStatUpgraded, this);
  }

  private onGoldChanged(): void {
    if (this.isOpen) {
      this.switchToTab(this.activeTab); // Refresh to update button states
    }
  }

  private onLevelUp(): void {
    if (this.isOpen) {
      this.switchToTab(this.activeTab);
    }
  }

  private onSlotUnlocked(payload: { slotIndex: number }): void {
    // Update tab lock icon
    const tabTypes = [TabType.Slot1, TabType.Slot2, TabType.Slot3, TabType.Slot4, TabType.Slot5];
    const tabType = tabTypes[payload.slotIndex];
    if (tabType) {
      const tab = this.tabs.get(tabType);
      if (tab && tab.lockIcon) {
        tab.lockIcon.setVisible(false);
        tab.text.setVisible(true);
      }
    }

    if (this.isOpen) {
      this.switchToTab(this.activeTab);
    }
  }

  private onSlotStatUpgraded(): void {
    if (this.isOpen) {
      this.switchToTab(this.activeTab);
    }
  }

  public refresh(): void {
    this.switchToTab(this.activeTab);
  }

  public destroy(fromScene?: boolean): void {
    this.eventManager.off(GameEvents.GOLD_CHANGED, this.onGoldChanged, this);
    this.eventManager.off(GameEvents.LEVEL_UP, this.onLevelUp, this);
    this.eventManager.off(GameEvents.SLOT_UNLOCKED, this.onSlotUnlocked, this);
    this.eventManager.off(GameEvents.SLOT_STAT_UPGRADED, this.onSlotStatUpgraded, this);
    this.tabs.clear();
    this.statRows.clear();
    super.destroy(fromScene);
  }
}
