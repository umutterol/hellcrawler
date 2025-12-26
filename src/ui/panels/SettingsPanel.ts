import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { getSaveManager } from '../../managers/SaveManager';

/**
 * SettingsPanel - Sliding panel for game settings
 *
 * Based on UISpec.md:
 * - Display toggles (health bars, damage numbers, etc.)
 * - Gameplay toggles (auto-collect, confirm sells)
 * - Audio sliders (master, music, SFX)
 * - Controls reference
 * - Save Game / Save & Quit buttons
 *
 * NOTE: This is a simplified implementation. Full settings
 * functionality will be added when AudioManager is implemented.
 */
export class SettingsPanel extends SlidingPanel {
  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.SETTINGS);
    this.setTitle('SETTINGS');
    this.initContent();
  }

  /**
   * Create the panel content
   */
  protected createContent(): void {
    this.createDisplaySection();
    this.createGameplaySection();
    this.createControlsSection();
    this.createSaveSection();
  }

  /**
   * Create display settings section
   */
  private createDisplaySection(): void {
    const sectionContainer = this.scene.add.container(16, 0);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'DISPLAY', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionContainer.add(headerText);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionContainer.add(divider);

    // Toggle options
    const toggles = [
      { label: 'Show Health Bars', value: true },
      { label: 'Show Damage Numbers', value: true },
      { label: 'Show Enemy HP Text', value: true },
    ];

    toggles.forEach((toggle, index) => {
      const toggleRow = this.createToggleRow(toggle.label, toggle.value, 32 + index * 32);
      sectionContainer.add(toggleRow);
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create gameplay settings section
   */
  private createGameplaySection(): void {
    const sectionContainer = this.scene.add.container(16, 140);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'GAMEPLAY', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionContainer.add(headerText);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionContainer.add(divider);

    // Toggle options
    const toggles = [
      { label: 'Auto-Collect Loot', value: true },
      { label: 'Confirm Rare+ Sells', value: true },
      { label: 'Show Tooltips', value: true },
    ];

    toggles.forEach((toggle, index) => {
      const toggleRow = this.createToggleRow(toggle.label, toggle.value, 32 + index * 32);
      sectionContainer.add(toggleRow);
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create a toggle row
   */
  private createToggleRow(label: string, value: boolean, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);

    // Label
    const labelText = this.scene.add.text(0, 0, label, {
      fontSize: '13px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    });
    container.add(labelText);

    // Toggle checkbox
    const checkboxSize = 20;
    const checkboxX = this.getContentWidth() - checkboxSize - 16;

    const checkbox = this.scene.add.graphics();
    checkbox.fillStyle(value ? UI_CONFIG.COLORS.HEALTH_GREEN : 0x3d3d3d, 1);
    checkbox.fillRoundedRect(checkboxX, -2, checkboxSize, checkboxSize, 3);
    checkbox.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    checkbox.strokeRoundedRect(checkboxX, -2, checkboxSize, checkboxSize, 3);
    container.add(checkbox);

    if (value) {
      const checkmark = this.scene.add.text(checkboxX + checkboxSize / 2, checkboxSize / 2 - 2, 'X', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      checkmark.setOrigin(0.5);
      container.add(checkmark);
    }

    return container;
  }

  /**
   * Create controls reference section
   */
  private createControlsSection(): void {
    const sectionContainer = this.scene.add.container(16, 280);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'CONTROLS', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      fontStyle: 'bold',
    });
    sectionContainer.add(headerText);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 20, this.getContentWidth(), 20);
    sectionContainer.add(divider);

    // Controls list
    const controls = [
      'Skill Keys: 1-10',
      'Auto-Mode: Shift + Key',
      'Tank Stats: TAB',
      'Inventory: I',
      'Shop: P',
      'Settings: ESC',
    ];

    controls.forEach((control, index) => {
      const controlText = this.scene.add.text(0, 32 + index * 22, control, {
        fontSize: '12px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      });
      sectionContainer.add(controlText);
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create save/quit section
   */
  private createSaveSection(): void {
    const sectionContainer = this.scene.add.container(16, 450);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 0, this.getContentWidth(), 0);
    sectionContainer.add(divider);

    // Save Game button
    const saveButton = this.createButton('SAVE GAME', 24, () => {
      this.onSaveGame();
    });
    sectionContainer.add(saveButton);

    // Save & Quit button
    const quitButton = this.createButton('SAVE & QUIT TO MENU', 72, () => {
      this.onSaveAndQuit();
    });
    sectionContainer.add(quitButton);

    this.addToContent(sectionContainer);
  }

  /**
   * Create a button
   */
  private createButton(
    label: string,
    y: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);
    const buttonWidth = this.getContentWidth();
    const buttonHeight = 36;

    // Button background
    const buttonBg = this.scene.add.rectangle(
      buttonWidth / 2,
      buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      UI_CONFIG.COLORS.BUTTON_DEFAULT
    );
    buttonBg.setInteractive({ useHandCursor: true });
    container.add(buttonBg);

    // Button text
    const buttonText = this.scene.add.text(buttonWidth / 2, buttonHeight / 2, label, {
      fontSize: '14px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);
    container.add(buttonText);

    // Hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_HOVER);
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_DEFAULT);
    });

    buttonBg.on('pointerdown', () => {
      buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_ACTIVE);
      onClick();
      this.scene.time.delayedCall(100, () => {
        buttonBg.setFillStyle(UI_CONFIG.COLORS.BUTTON_DEFAULT);
      });
    });

    return container;
  }

  /**
   * Handle save game
   */
  private onSaveGame(): void {
    const saveManager = getSaveManager();
    saveManager.save();

    if (import.meta.env.DEV) {
      console.log('[SettingsPanel] Game saved');
    }
  }

  /**
   * Handle save and quit
   */
  private onSaveAndQuit(): void {
    const saveManager = getSaveManager();
    saveManager.save();

    if (import.meta.env.DEV) {
      console.log('[SettingsPanel] Game saved, returning to menu (not implemented)');
    }

    // TODO: Implement scene transition to main menu
  }

  /**
   * Refresh panel content when opened
   */
  public refresh(): void {
    // TODO: Update toggle states from settings storage
    if (import.meta.env.DEV) {
      console.log('[SettingsPanel] Refreshing content');
    }
  }
}
