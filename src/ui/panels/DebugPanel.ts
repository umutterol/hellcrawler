import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { GameState, getGameState } from '../../state/GameState';
import { getSaveManager, SaveManager } from '../../managers/SaveManager';
import { WaveSystem } from '../../systems/WaveSystem';
import { EnemyType } from '../../types/EnemyTypes';
import { GAME_CONFIG } from '../../config/GameConfig';

/**
 * Tab types for the debug panel
 */
enum DebugTab {
  Enemies = 'enemies',
  Economy = 'economy',
  Save = 'save',
}

/**
 * Tab button element
 */
interface TabElement {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

/**
 * DebugPanel - Dev-only sliding panel for testing and debugging
 *
 * Features:
 * - Enemies tab: Spawn enemies, kill all
 * - Economy tab: Add gold, XP, level up
 * - Save tab: Clear, export, import saves
 */
export class DebugPanel extends SlidingPanel {
  private gameState: GameState;
  private saveManager: SaveManager;
  private waveSystem: WaveSystem;

  // Current active tab
  private activeTab: DebugTab = DebugTab.Enemies;

  // Tab elements
  private tabs: Map<DebugTab, TabElement> = new Map();

  // Content container (changes based on tab)
  private contentContainer: Phaser.GameObjects.Container | null = null;

  // Layout constants - adjusted for 525px panel
  private static readonly TAB_HEIGHT = 32;
  private static readonly TAB_WIDTH = 155; // Wider tabs
  private static readonly BUTTON_HEIGHT = 32; // Taller buttons

  // Enemies tab state
  private selectedEnemyType: EnemyType = EnemyType.Imp;
  private spawnCount: number = 1;
  private spawnCountText: Phaser.GameObjects.Text | null = null;
  private enemyTypeButtons: Map<EnemyType, Phaser.GameObjects.Rectangle> = new Map();

  // Save tab state
  private confirmingClear: boolean = false;
  private clearButton: Phaser.GameObjects.Container | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;

  constructor(
    scene: Phaser.Scene,
    waveSystem: WaveSystem,
    _enemiesGroup: Phaser.GameObjects.Group
  ) {
    super(scene, PanelType.DEBUG);
    this.gameState = getGameState();
    this.saveManager = getSaveManager();
    this.waveSystem = waveSystem;

    this.setTitle('DEBUG TOOLS');
    this.initContent();
  }

  protected createContent(): void {
    this.createTabBar();
    this.createContentArea();
    this.switchToTab(DebugTab.Enemies);
  }

  /**
   * Create the tab bar with 3 tabs
   */
  private createTabBar(): void {
    const tabBarY = 0;
    const tabTypes = [DebugTab.Enemies, DebugTab.Economy, DebugTab.Save];
    const tabLabels = ['Enemies', 'Economy', 'Save'];

    for (let i = 0; i < tabTypes.length; i++) {
      const tabType = tabTypes[i]!;
      const x = 8 + i * (DebugPanel.TAB_WIDTH + 4);
      const tab = this.createTab(x, tabBarY, tabLabels[i]!, tabType);
      this.tabs.set(tabType, tab);
    }
  }

  /**
   * Create a single tab
   */
  private createTab(x: number, y: number, label: string, tabType: DebugTab): TabElement {
    const container = this.scene.add.container(x, y);
    this.addToContent(container);

    // Background
    const background = this.scene.add.rectangle(
      DebugPanel.TAB_WIDTH / 2,
      DebugPanel.TAB_HEIGHT / 2,
      DebugPanel.TAB_WIDTH,
      DebugPanel.TAB_HEIGHT,
      0x2d2d4a
    );
    background.setStrokeStyle(1, UI_CONFIG.COLORS.PANEL_BORDER);
    background.setInteractive({ useHandCursor: true });
    container.add(background);

    // Label
    const text = this.scene.add.text(DebugPanel.TAB_WIDTH / 2, DebugPanel.TAB_HEIGHT / 2, label, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    container.add(text);

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

    return { container, background, text };
  }

  /**
   * Create the content area container
   */
  private createContentArea(): void {
    this.contentContainer = this.scene.add.container(0, DebugPanel.TAB_HEIGHT + 8);
    this.addToContent(this.contentContainer);
  }

  /**
   * Switch to a specific tab
   */
  private switchToTab(tabType: DebugTab): void {
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
    this.enemyTypeButtons.clear();
    this.spawnCountText = null;
    this.clearButton = null;
    this.statusText = null;
    this.confirmingClear = false;

    // Create new content
    switch (tabType) {
      case DebugTab.Enemies:
        this.createEnemiesContent();
        break;
      case DebugTab.Economy:
        this.createEconomyContent();
        break;
      case DebugTab.Save:
        this.createSaveContent();
        break;
    }
  }

  // ============================================================================
  // ENEMIES TAB
  // ============================================================================

  private createEnemiesContent(): void {
    if (!this.contentContainer) return;

    let y = 0;

    // Section: Enemy Type
    y = this.addSectionHeader('ENEMY TYPE', y);
    y += 4;

    // Fodder row
    const fodderTypes = [EnemyType.Imp, EnemyType.Hellhound, EnemyType.PossessedSoldier, EnemyType.FireSkull];
    y = this.createEnemyTypeRow(fodderTypes, y, 'Fodder');

    // Elite row
    const eliteTypes = [EnemyType.Demon, EnemyType.Necromancer, EnemyType.ShadowFiend, EnemyType.InfernalWarrior];
    y = this.createEnemyTypeRow(eliteTypes, y, 'Elite');

    // Boss row
    const bossTypes = [EnemyType.CorruptedSentinel, EnemyType.ArchDemon];
    y = this.createEnemyTypeRow(bossTypes, y, 'Boss');

    y += 8;

    // Section: Spawn Count
    y = this.addSectionHeader('SPAWN COUNT', y);
    y += 4;
    y = this.createSpawnCountControls(y);

    y += 12;

    // Spawn button
    this.createActionButton('SPAWN ENEMIES', y, () => this.spawnEnemies(), 0x4a9e4a);
    y += DebugPanel.BUTTON_HEIGHT + 8;

    // Kill all button
    this.createActionButton('KILL ALL ENEMIES', y, () => this.killAllEnemies(), 0xcc3333);
    y += DebugPanel.BUTTON_HEIGHT + 8;

    this.setContentHeight(DebugPanel.TAB_HEIGHT + 8 + y + 16);
  }

  private createEnemyTypeRow(types: EnemyType[], startY: number, _label: string): number {
    // Wider buttons for 525px panel - can fit more text
    const buttonWidth = 90;
    const spacing = 6;
    const startX = 12;

    for (let i = 0; i < types.length; i++) {
      const type = types[i]!;
      const x = startX + i * (buttonWidth + spacing);
      const container = this.scene.add.container(x, startY);
      this.contentContainer!.add(container);

      const isSelected = type === this.selectedEnemyType;
      const bg = this.scene.add.rectangle(
        buttonWidth / 2,
        14,
        buttonWidth,
        28,
        isSelected ? 0x4a9e4a : 0x3d3d3d
      );
      bg.setStrokeStyle(1, isSelected ? 0x6abe6a : 0x5d5d5d);
      bg.setInteractive({ useHandCursor: true });
      container.add(bg);

      // Short name for button
      const shortName = this.getShortEnemyName(type);
      const text = this.scene.add.text(buttonWidth / 2, 14, shortName, {
        fontSize: '11px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      container.add(text);

      this.enemyTypeButtons.set(type, bg);

      bg.on('pointerdown', () => this.selectEnemyType(type));
      bg.on('pointerover', () => {
        if (type !== this.selectedEnemyType) bg.setFillStyle(0x5d5d5d);
      });
      bg.on('pointerout', () => {
        if (type !== this.selectedEnemyType) bg.setFillStyle(0x3d3d3d);
      });
    }

    return startY + 32;
  }

  private getShortEnemyName(type: EnemyType): string {
    const names: Record<EnemyType, string> = {
      [EnemyType.Imp]: 'Imp',
      [EnemyType.Hellhound]: 'Hound',
      [EnemyType.PossessedSoldier]: 'Soldier',
      [EnemyType.FireSkull]: 'Skull',
      [EnemyType.Demon]: 'Demon',
      [EnemyType.Necromancer]: 'Necro',
      [EnemyType.ShadowFiend]: 'Shadow',
      [EnemyType.InfernalWarrior]: 'Warrior',
      [EnemyType.ArchDemon]: 'Arch',
      [EnemyType.VoidReaver]: 'Void',
      [EnemyType.CorruptedSentinel]: 'Sentinel',
      [EnemyType.InfernalWarlord]: 'Warlord',
      [EnemyType.LordOfFlames]: 'Lord',
    };
    return names[type] || type;
  }

  private selectEnemyType(type: EnemyType): void {
    this.selectedEnemyType = type;
    // Update button visuals
    for (const [t, bg] of this.enemyTypeButtons) {
      if (t === type) {
        bg.setFillStyle(0x4a9e4a);
        bg.setStrokeStyle(1, 0x6abe6a);
      } else {
        bg.setFillStyle(0x3d3d3d);
        bg.setStrokeStyle(1, 0x5d5d5d);
      }
    }
  }

  private createSpawnCountControls(y: number): number {
    const container = this.scene.add.container(12, y);
    this.contentContainer!.add(container);

    // Wider spacing for 525px panel
    const buttonWidth = 50;
    const buttonHeight = 32;

    // Minus button
    const minusBtn = this.scene.add.rectangle(buttonWidth / 2, 16, buttonWidth, buttonHeight, 0x3d3d3d);
    minusBtn.setStrokeStyle(1, 0x5d5d5d);
    minusBtn.setInteractive({ useHandCursor: true });
    container.add(minusBtn);

    const minusText = this.scene.add.text(buttonWidth / 2, 16, '-', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    minusText.setOrigin(0.5);
    container.add(minusText);

    // Count display - centered in wider area
    this.spawnCountText = this.scene.add.text(110, 16, `${this.spawnCount}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.spawnCountText.setOrigin(0.5);
    container.add(this.spawnCountText);

    // Plus button
    const plusBtn = this.scene.add.rectangle(170, 16, buttonWidth, buttonHeight, 0x3d3d3d);
    plusBtn.setStrokeStyle(1, 0x5d5d5d);
    plusBtn.setInteractive({ useHandCursor: true });
    container.add(plusBtn);

    const plusText = this.scene.add.text(170, 16, '+', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    plusText.setOrigin(0.5);
    container.add(plusText);

    // Quick buttons - more spacing
    const quickButtons = [
      { label: 'x5', value: 5 },
      { label: 'x10', value: 10 },
      { label: 'MAX', value: GAME_CONFIG.MAX_ENEMIES_ON_SCREEN },
    ];

    quickButtons.forEach((btn, i) => {
      const qBtn = this.scene.add.rectangle(260 + i * 60, 16, 52, buttonHeight, 0x3d3d3d);
      qBtn.setStrokeStyle(1, 0x5d5d5d);
      qBtn.setInteractive({ useHandCursor: true });
      container.add(qBtn);

      const qText = this.scene.add.text(260 + i * 60, 16, btn.label, {
        fontSize: '12px',
        color: '#ffffff',
      });
      qText.setOrigin(0.5);
      container.add(qText);

      qBtn.on('pointerdown', () => {
        this.spawnCount = btn.value;
        this.updateSpawnCountDisplay();
      });
      qBtn.on('pointerover', () => qBtn.setFillStyle(0x5d5d5d));
      qBtn.on('pointerout', () => qBtn.setFillStyle(0x3d3d3d));
    });

    // Button handlers
    minusBtn.on('pointerdown', () => {
      this.spawnCount = Math.max(1, this.spawnCount - 1);
      this.updateSpawnCountDisplay();
    });
    minusBtn.on('pointerover', () => minusBtn.setFillStyle(0x5d5d5d));
    minusBtn.on('pointerout', () => minusBtn.setFillStyle(0x3d3d3d));

    plusBtn.on('pointerdown', () => {
      this.spawnCount = Math.min(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN, this.spawnCount + 1);
      this.updateSpawnCountDisplay();
    });
    plusBtn.on('pointerover', () => plusBtn.setFillStyle(0x5d5d5d));
    plusBtn.on('pointerout', () => plusBtn.setFillStyle(0x3d3d3d));

    return y + 36;
  }

  private updateSpawnCountDisplay(): void {
    if (this.spawnCountText) {
      this.spawnCountText.setText(`${this.spawnCount}`);
    }
  }

  private spawnEnemies(): void {
    let spawned = 0;
    for (let i = 0; i < this.spawnCount; i++) {
      const enemy = this.waveSystem.debugSpawnEnemy(this.selectedEnemyType);
      if (enemy) spawned++;
    }
    console.log(`[DebugPanel] Spawned ${spawned}/${this.spawnCount} ${this.selectedEnemyType}`);
  }

  private killAllEnemies(): void {
    const killed = this.waveSystem.debugKillAllEnemies();
    console.log(`[DebugPanel] Killed ${killed} enemies`);
  }

  // ============================================================================
  // ECONOMY TAB
  // ============================================================================

  private createEconomyContent(): void {
    if (!this.contentContainer) return;

    let y = 0;

    // Section: Gold
    y = this.addSectionHeader('GOLD', y);
    y += 4;

    const goldDisplay = this.scene.add.text(12, y, `Current: ${this.formatNumber(this.gameState.getGold())}`, {
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_GOLD,
    });
    this.contentContainer.add(goldDisplay);
    y += 24;

    y = this.createButtonRow([
      { label: '+100', action: () => this.addGold(100) },
      { label: '+1K', action: () => this.addGold(1000) },
      { label: '+10K', action: () => this.addGold(10000) },
      { label: '+100K', action: () => this.addGold(100000) },
    ], y);

    y += 12;

    // Section: Experience
    y = this.addSectionHeader('EXPERIENCE', y);
    y += 4;

    const level = this.gameState.getTankLevel();
    const xp = this.gameState.getTankXP();
    const xpToNext = this.gameState.getXPToNextLevel();
    const xpDisplay = this.scene.add.text(12, y, `Level ${level} | ${this.formatNumber(xp)} / ${this.formatNumber(xpToNext)} XP`, {
      fontSize: '14px',
      color: '#88ccff',
    });
    this.contentContainer.add(xpDisplay);
    y += 24;

    y = this.createButtonRow([
      { label: '+100 XP', action: () => this.addXP(100) },
      { label: '+1K XP', action: () => this.addXP(1000) },
      { label: 'LEVEL UP', action: () => this.instantLevelUp() },
    ], y);

    y += 12;

    // Section: Set Level
    y = this.addSectionHeader('SET LEVEL', y);
    y += 4;

    y = this.createButtonRow([
      { label: '+1 Level', action: () => this.addLevels(1) },
      { label: '+10 Levels', action: () => this.addLevels(10) },
      { label: 'MAX (160)', action: () => this.setMaxLevel() },
    ], y);

    this.setContentHeight(DebugPanel.TAB_HEIGHT + 8 + y + 16);
  }

  private addGold(amount: number): void {
    this.gameState.addGold(amount, 'enemy_drop');
    this.refresh();
  }

  private addXP(amount: number): void {
    this.gameState.addXP(amount, 'enemy');
    this.refresh();
  }

  private instantLevelUp(): void {
    const xpNeeded = this.gameState.getXPToNextLevel() - this.gameState.getTankXP();
    if (xpNeeded > 0) {
      this.gameState.addXP(xpNeeded + 1, 'enemy');
    }
    this.refresh();
  }

  private addLevels(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.gameState.getTankLevel() >= GAME_CONFIG.MAX_TANK_LEVEL) break;
      this.instantLevelUp();
    }
    this.refresh();
  }

  private setMaxLevel(): void {
    while (this.gameState.getTankLevel() < GAME_CONFIG.MAX_TANK_LEVEL) {
      const xpNeeded = this.gameState.getXPToNextLevel() - this.gameState.getTankXP();
      this.gameState.addXP(xpNeeded + 1, 'enemy');
    }
    this.refresh();
  }

  // ============================================================================
  // SAVE TAB
  // ============================================================================

  private createSaveContent(): void {
    if (!this.contentContainer) return;

    let y = 0;

    // Section: Save Info
    y = this.addSectionHeader('SAVE DATA', y);
    y += 4;

    const saveInfo = this.saveManager.getSaveInfo();
    if (saveInfo.exists) {
      const infoText = this.scene.add.text(12, y,
        `Level: ${saveInfo.level}\nAct ${saveInfo.act}, Zone ${saveInfo.zone}\nSaved: ${new Date(saveInfo.timestamp!).toLocaleString()}`,
        { fontSize: '12px', color: UI_CONFIG.COLORS.TEXT_PRIMARY, lineSpacing: 4 }
      );
      this.contentContainer.add(infoText);
      y += 56;
    } else {
      const noSaveText = this.scene.add.text(12, y, 'No save data found', {
        fontSize: '12px',
        color: '#888888',
      });
      this.contentContainer.add(noSaveText);
      y += 24;
    }

    y += 8;

    // Clear Save button
    this.clearButton = this.createActionButton('CLEAR SAVE DATA', y, () => this.handleClearSave(), 0xcc3333);
    y += DebugPanel.BUTTON_HEIGHT + 8;

    // Export button
    this.createActionButton('EXPORT TO CLIPBOARD', y, () => this.exportSave(), 0x4a6a9e);
    y += DebugPanel.BUTTON_HEIGHT + 8;

    // Import button
    this.createActionButton('IMPORT FROM CLIPBOARD', y, () => this.importSave(), 0x4a6a9e);
    y += DebugPanel.BUTTON_HEIGHT + 8;

    // Status text
    this.statusText = this.scene.add.text(12, y, '', {
      fontSize: '11px',
      color: '#888888',
    });
    this.contentContainer.add(this.statusText);
    y += 20;

    this.setContentHeight(DebugPanel.TAB_HEIGHT + 8 + y + 16);
  }

  private handleClearSave(): void {
    if (!this.confirmingClear) {
      this.confirmingClear = true;
      this.updateClearButtonText('CONFIRM CLEAR?');

      // Reset after 3 seconds
      this.scene.time.delayedCall(3000, () => {
        if (this.confirmingClear) {
          this.confirmingClear = false;
          this.updateClearButtonText('CLEAR SAVE DATA');
        }
      });
    } else {
      this.saveManager.deleteSave();
      this.gameState.reset();
      this.setStatus('Save cleared! Refresh to start fresh.');
      this.confirmingClear = false;
      this.refresh();
    }
  }

  private updateClearButtonText(text: string): void {
    if (this.clearButton) {
      const textObj = this.clearButton.getAt(1) as Phaser.GameObjects.Text;
      if (textObj) textObj.setText(text);
    }
  }

  private async exportSave(): Promise<void> {
    const encoded = this.saveManager.exportSave();
    if (encoded) {
      try {
        await navigator.clipboard.writeText(encoded);
        this.setStatus('Copied to clipboard!');
      } catch {
        this.setStatus('Failed to copy to clipboard');
      }
    } else {
      this.setStatus('No save data to export');
    }
  }

  private async importSave(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        this.setStatus('Clipboard is empty');
        return;
      }
      const success = this.saveManager.importSave(text);
      this.setStatus(success ? 'Save imported! Refreshing...' : 'Invalid save data');
      if (success) {
        this.scene.time.delayedCall(500, () => this.refresh());
      }
    } catch {
      this.setStatus('Failed to read clipboard');
    }
  }

  private setStatus(message: string): void {
    if (this.statusText) {
      this.statusText.setText(message);
    }
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  private addSectionHeader(text: string, y: number): number {
    const header = this.scene.add.text(12, y, text, {
      fontSize: '11px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    this.contentContainer!.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(12, y + 14, this.getContentWidth() - 12, y + 14);
    this.contentContainer!.add(divider);

    return y + 20;
  }

  private createButtonRow(buttons: Array<{ label: string; action: () => void }>, y: number): number {
    const totalWidth = this.getContentWidth() - 24;
    const buttonWidth = (totalWidth - (buttons.length - 1) * 4) / buttons.length;

    buttons.forEach((btn, i) => {
      const x = 12 + i * (buttonWidth + 4);
      const container = this.scene.add.container(x, y);
      this.contentContainer!.add(container);

      const bg = this.scene.add.rectangle(buttonWidth / 2, 12, buttonWidth, 24, 0x3d3d3d);
      bg.setStrokeStyle(1, 0x5d5d5d);
      bg.setInteractive({ useHandCursor: true });
      container.add(bg);

      const text = this.scene.add.text(buttonWidth / 2, 12, btn.label, {
        fontSize: '10px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      container.add(text);

      bg.on('pointerdown', btn.action);
      bg.on('pointerover', () => bg.setFillStyle(0x5d5d5d));
      bg.on('pointerout', () => bg.setFillStyle(0x3d3d3d));
    });

    return y + 28;
  }

  private createActionButton(
    label: string,
    y: number,
    onClick: () => void,
    color: number = 0x3d3d3d
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(12, y);
    this.contentContainer!.add(container);

    const width = this.getContentWidth() - 24;
    const bg = this.scene.add.rectangle(width / 2, DebugPanel.BUTTON_HEIGHT / 2, width, DebugPanel.BUTTON_HEIGHT, color);
    bg.setStrokeStyle(1, Phaser.Display.Color.IntegerToColor(color).brighten(30).color);
    bg.setInteractive({ useHandCursor: true });
    container.add(bg);

    const text = this.scene.add.text(width / 2, DebugPanel.BUTTON_HEIGHT / 2, label, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    container.add(text);

    const hoverColor = Phaser.Display.Color.IntegerToColor(color).brighten(20).color;
    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(hoverColor));
    bg.on('pointerout', () => bg.setFillStyle(color));

    return container;
  }

  private formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }

  public refresh(): void {
    this.switchToTab(this.activeTab);
  }

  public destroy(fromScene?: boolean): void {
    this.tabs.clear();
    this.enemyTypeButtons.clear();
    super.destroy(fromScene);
  }
}
