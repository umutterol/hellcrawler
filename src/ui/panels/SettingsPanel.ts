import Phaser from 'phaser';
import { SlidingPanel } from './SlidingPanel';
import { PanelType, UI_CONFIG } from '../../config/UIConfig';
import { getSaveManager } from '../../managers/SaveManager';
import { getSettingsManager, GameSettings } from '../../managers/SettingsManager';

/**
 * Toggle row data for tracking interactive elements
 */
interface ToggleRowData {
  key: keyof GameSettings;
  checkbox: Phaser.GameObjects.Graphics;
  checkmark: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Rectangle;
}

/**
 * Slider row data for tracking interactive elements
 */
interface SliderRowData {
  key: keyof GameSettings;
  track: Phaser.GameObjects.Graphics;
  handle: Phaser.GameObjects.Rectangle;
  valueText: Phaser.GameObjects.Text;
  trackX: number;
  trackWidth: number;
}

/**
 * SettingsPanel - Sliding panel for game settings
 *
 * Based on UISpec.md:
 * - Display toggles (health bars, damage numbers, etc.)
 * - Gameplay toggles (auto-collect, confirm sells)
 * - Audio sliders (master, music, SFX)
 * - Controls reference
 * - Save Game / Save & Quit buttons
 */
export class SettingsPanel extends SlidingPanel {
  private toggleRows: ToggleRowData[] = [];
  private sliderRows: SliderRowData[] = [];
  private isDraggingSlider: boolean = false;
  private activeSlider: SliderRowData | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, PanelType.SETTINGS);
    this.setTitle('SETTINGS');
    this.initContent();
  }

  /**
   * Create the panel content
   */
  protected createContent(): void {
    this.toggleRows = [];
    this.sliderRows = [];

    this.createDisplaySection();
    this.createGameplaySection();
    this.createAudioSection();
    this.createBackgroundLayersSection();
    this.createDesktopModeSection();
    this.createControlsSection();
    this.createSaveSection();

    // Setup global pointer events for slider dragging
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);

    // Calculate total content height for scrolling
    // Save section is the last section and its Y position depends on Electron mode
    const settingsManager = getSettingsManager();
    const saveYOffset = settingsManager.isElectron() ? 852 : 747;
    // Save section contains: divider + save button (y=16, h=36) + quit button (y=60, h=36)
    const totalContentHeight = saveYOffset + 60 + 36 + 20; // ~843-948px depending on mode
    this.setContentHeight(totalContentHeight);
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
    const toggles: { label: string; key: keyof GameSettings }[] = [
      { label: 'Show Health Bars', key: 'showHealthBars' },
      { label: 'Show Damage Numbers', key: 'showDamageNumbers' },
      { label: 'Show Enemy HP Text', key: 'showEnemyHPText' },
    ];

    toggles.forEach((toggle, index) => {
      const toggleRow = this.createToggleRow(toggle.label, toggle.key, 32 + index * 32);
      sectionContainer.add(toggleRow);
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create gameplay settings section
   */
  private createGameplaySection(): void {
    const sectionContainer = this.scene.add.container(16, 130);

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
    const toggles: { label: string; key: keyof GameSettings }[] = [
      { label: 'Auto-Collect Loot', key: 'autoCollectLoot' },
      { label: 'Confirm Rare+ Sells', key: 'confirmRareSells' },
      { label: 'Auto-Sell Uncommon', key: 'autoSellUncommon' },
      { label: 'Show Tooltips', key: 'showTooltips' },
    ];

    toggles.forEach((toggle, index) => {
      const toggleRow = this.createToggleRow(toggle.label, toggle.key, 32 + index * 32);
      sectionContainer.add(toggleRow);
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create audio settings section
   */
  private createAudioSection(): void {
    const sectionContainer = this.scene.add.container(16, 292);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'AUDIO', {
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

    // Slider options
    const sliders: { label: string; key: keyof GameSettings }[] = [
      { label: 'Master Volume', key: 'masterVolume' },
      { label: 'Music Volume', key: 'musicVolume' },
      { label: 'SFX Volume', key: 'sfxVolume' },
    ];

    sliders.forEach((slider, index) => {
      const sliderRow = this.createSliderRow(slider.label, slider.key, 32 + index * 40);
      sectionContainer.add(sliderRow);
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create a toggle row with interactive checkbox
   */
  private createToggleRow(
    label: string,
    key: keyof GameSettings,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);
    const settingsManager = getSettingsManager();
    const value = settingsManager.getSetting(key) as boolean;

    // Label
    const labelText = this.scene.add.text(0, 0, label, {
      fontSize: '13px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    });
    container.add(labelText);

    // Toggle checkbox
    const checkboxSize = 20;
    const checkboxX = this.getContentWidth() - checkboxSize - 16;

    // Checkbox background
    const checkbox = this.scene.add.graphics();
    this.drawCheckbox(checkbox, checkboxX, -2, checkboxSize, value);
    container.add(checkbox);

    // Checkmark text
    const checkmark = this.scene.add.text(checkboxX + checkboxSize / 2, checkboxSize / 2 - 2, 'X', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    checkmark.setOrigin(0.5);
    checkmark.setVisible(value);
    container.add(checkmark);

    // Hit area for clicking (covers both label and checkbox)
    const hitArea = this.scene.add.rectangle(
      this.getContentWidth() / 2,
      checkboxSize / 2 - 2,
      this.getContentWidth(),
      checkboxSize + 8,
      0x000000,
      0
    );
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // Store reference for updating
    const rowData: ToggleRowData = { key, checkbox, checkmark, hitArea };
    this.toggleRows.push(rowData);

    // Click handler
    hitArea.on('pointerdown', () => {
      const newValue = settingsManager.toggleSetting(key);
      this.updateToggleVisual(rowData, newValue);
    });

    // Hover effects
    hitArea.on('pointerover', () => {
      labelText.setStyle({ color: '#ffffff' });
    });

    hitArea.on('pointerout', () => {
      labelText.setStyle({ color: UI_CONFIG.COLORS.TEXT_PRIMARY });
    });

    return container;
  }

  /**
   * Draw checkbox graphics
   */
  private drawCheckbox(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
    checked: boolean
  ): void {
    graphics.clear();
    graphics.fillStyle(checked ? UI_CONFIG.COLORS.HEALTH_GREEN : 0x3d3d3d, 1);
    graphics.fillRoundedRect(x, y, size, size, 3);
    graphics.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    graphics.strokeRoundedRect(x, y, size, size, 3);
  }

  /**
   * Update toggle visual state
   */
  private updateToggleVisual(rowData: ToggleRowData, checked: boolean): void {
    const checkboxSize = 20;
    const checkboxX = this.getContentWidth() - checkboxSize - 16;
    this.drawCheckbox(rowData.checkbox, checkboxX, -2, checkboxSize, checked);
    rowData.checkmark.setVisible(checked);
  }

  /**
   * Create a slider row for volume control
   */
  private createSliderRow(
    label: string,
    key: keyof GameSettings,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);
    const settingsManager = getSettingsManager();
    const value = settingsManager.getSetting(key) as number;

    // Label
    const labelText = this.scene.add.text(0, 0, label, {
      fontSize: '13px',
      color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    });
    container.add(labelText);

    // Slider track - wider for better precision on 525px panel
    const trackWidth = 220;
    const trackHeight = 6;
    const trackX = this.getContentWidth() - trackWidth - 50;
    const trackY = 4;

    const track = this.scene.add.graphics();
    this.drawSliderTrack(track, trackX, trackY, trackWidth, trackHeight, value);
    container.add(track);

    // Slider handle
    const handleWidth = 12;
    const handleHeight = 16;
    const handleX = trackX + (value / 100) * trackWidth;
    const handle = this.scene.add.rectangle(
      handleX,
      trackY + trackHeight / 2,
      handleWidth,
      handleHeight,
      UI_CONFIG.COLORS.BUTTON_ACTIVE
    );
    handle.setInteractive({ useHandCursor: true, draggable: false });
    container.add(handle);

    // Value text
    const valueText = this.scene.add.text(
      this.getContentWidth() - 35,
      0,
      `${value}%`,
      {
        fontSize: '12px',
        color: UI_CONFIG.COLORS.TEXT_SECONDARY,
      }
    );
    container.add(valueText);

    // Store reference for updating
    const rowData: SliderRowData = {
      key,
      track,
      handle,
      valueText,
      trackX,
      trackWidth,
    };
    this.sliderRows.push(rowData);

    // Handle drag start
    handle.on('pointerdown', () => {
      this.isDraggingSlider = true;
      this.activeSlider = rowData;
    });

    // Track click to jump
    const trackHitArea = this.scene.add.rectangle(
      trackX + trackWidth / 2,
      trackY + trackHeight / 2,
      trackWidth + 20,
      handleHeight + 10,
      0x000000,
      0
    );
    trackHitArea.setInteractive({ useHandCursor: true });
    container.add(trackHitArea);

    trackHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Calculate value from click position
      const localX = pointer.x - this.x - 16 - trackX;
      const newValue = Math.round(Math.max(0, Math.min(100, (localX / trackWidth) * 100)));
      settingsManager.setSetting(key, newValue as GameSettings[typeof key]);
      this.updateSliderVisual(rowData, newValue);
    });

    return container;
  }

  /**
   * Draw slider track with filled portion
   */
  private drawSliderTrack(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    value: number
  ): void {
    graphics.clear();

    // Background track
    graphics.fillStyle(0x3d3d3d, 1);
    graphics.fillRoundedRect(x, y, width, height, 3);

    // Filled portion
    const filledWidth = (value / 100) * width;
    if (filledWidth > 0) {
      graphics.fillStyle(UI_CONFIG.COLORS.HEALTH_GREEN, 1);
      graphics.fillRoundedRect(x, y, filledWidth, height, 3);
    }
  }

  /**
   * Update slider visual state
   */
  private updateSliderVisual(rowData: SliderRowData, value: number): void {
    const { track, handle, valueText, trackX, trackWidth } = rowData;
    const trackHeight = 6;
    const trackY = 4;

    // Update track
    this.drawSliderTrack(track, trackX, trackY, trackWidth, trackHeight, value);

    // Update handle position
    handle.x = trackX + (value / 100) * trackWidth;

    // Update value text
    valueText.setText(`${value}%`);
  }

  /**
   * Handle pointer move for slider dragging
   */
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDraggingSlider || !this.activeSlider) return;

    const { key, trackX, trackWidth } = this.activeSlider;
    const localX = pointer.x - this.x - 16 - trackX;
    const newValue = Math.round(Math.max(0, Math.min(100, (localX / trackWidth) * 100)));

    const settingsManager = getSettingsManager();
    settingsManager.setSetting(key, newValue as GameSettings[typeof key]);
    this.updateSliderVisual(this.activeSlider, newValue);
  }

  /**
   * Handle pointer up for slider dragging
   */
  private onPointerUp(): void {
    this.isDraggingSlider = false;
    this.activeSlider = null;
  }

  /**
   * Create background layers visibility section
   */
  private createBackgroundLayersSection(): void {
    const sectionContainer = this.scene.add.container(16, 422);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'BACKGROUND LAYERS', {
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

    // Toggle options for layer groups
    const toggles: { label: string; key: keyof GameSettings }[] = [
      { label: 'Sky & Clouds', key: 'showSkyLayer' },
      { label: 'Mountains', key: 'showMountainsLayer' },
      { label: 'Far Buildings', key: 'showFarBuildingsLayer' },
      { label: 'Forest & Town', key: 'showForegroundLayer' },
    ];

    toggles.forEach((toggle, index) => {
      const toggleRow = this.createToggleRow(toggle.label, toggle.key, 32 + index * 32);
      sectionContainer.add(toggleRow);
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create desktop mode section (Electron only)
   */
  private createDesktopModeSection(): void {
    // Only show in Electron environment
    const settingsManager = getSettingsManager();
    if (!settingsManager.isElectron()) {
      return; // Skip this section in web browser
    }

    const sectionContainer = this.scene.add.container(16, 587);

    // Section header
    const headerText = this.scene.add.text(0, 0, 'DESKTOP MODE', {
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
    const toggles: { label: string; key: keyof GameSettings }[] = [
      { label: 'Always On Top', key: 'alwaysOnTop' },
      { label: 'Click-Through Empty Areas', key: 'clickThroughEnabled' },
    ];

    toggles.forEach((toggle, index) => {
      const toggleRow = this.createToggleRow(toggle.label, toggle.key, 32 + index * 32);
      sectionContainer.add(toggleRow);

      // For these toggles, apply Electron window settings on change
      const rowData = this.toggleRows[this.toggleRows.length - 1];
      if (!rowData) return;

      const originalHitArea = rowData.hitArea;

      // Override the click handler to also apply to Electron
      originalHitArea.off('pointerdown');
      originalHitArea.on('pointerdown', async () => {
        const newValue = settingsManager.toggleSetting(toggle.key);
        this.updateToggleVisual(rowData, newValue);

        // Apply to Electron window
        if (toggle.key === 'alwaysOnTop') {
          await settingsManager.applyAlwaysOnTop();
        }
        // Click-through is managed dynamically, not via this toggle directly
      });
    });

    this.addToContent(sectionContainer);
  }

  /**
   * Create controls reference section
   */
  private createControlsSection(): void {
    // Adjust Y position based on whether Desktop Mode section is shown
    const settingsManager = getSettingsManager();
    const yOffset = settingsManager.isElectron() ? 692 : 587;
    const sectionContainer = this.scene.add.container(16, yOffset);

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
      'Tank Stats: TAB / T',
      'Inventory: I',
      'Shop: P',
      'Settings: ESC',
    ];

    controls.forEach((control, index) => {
      const controlText = this.scene.add.text(0, 32 + index * 20, control, {
        fontSize: '11px',
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
    // Adjust Y position based on whether Desktop Mode section is shown
    const settingsManager = getSettingsManager();
    const yOffset = settingsManager.isElectron() ? 852 : 747;
    const sectionContainer = this.scene.add.container(16, yOffset);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, UI_CONFIG.COLORS.PANEL_BORDER, 0.5);
    divider.lineBetween(0, 0, this.getContentWidth(), 0);
    sectionContainer.add(divider);

    // Save Game button
    const saveButton = this.createButton('SAVE GAME', 16, () => {
      this.onSaveGame();
    });
    sectionContainer.add(saveButton);

    // Save & Quit button
    const quitButton = this.createButton('SAVE & QUIT TO MENU', 60, () => {
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
    const settingsManager = getSettingsManager();

    // Update all toggle visuals
    for (const row of this.toggleRows) {
      const value = settingsManager.getSetting(row.key) as boolean;
      this.updateToggleVisual(row, value);
    }

    // Update all slider visuals
    for (const row of this.sliderRows) {
      const value = settingsManager.getSetting(row.key) as number;
      this.updateSliderVisual(row, value);
    }

    if (import.meta.env.DEV) {
      console.log('[SettingsPanel] Refreshed with current settings');
    }
  }

  /**
   * Cleanup when panel is destroyed
   */
  public destroy(): void {
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.toggleRows = [];
    this.sliderRows = [];
    super.destroy();
  }
}
