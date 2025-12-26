import Phaser from 'phaser';
import { SlidingPanel } from '../ui/panels/SlidingPanel';
import { PanelType, UI_CONFIG } from '../config/UIConfig';

/**
 * PanelManager - Singleton manager for the sliding panel system
 *
 * Responsibilities:
 * - Ensures only ONE panel is open at a time
 * - Manages panel registration and lookup
 * - Handles panel open/close/toggle operations
 * - Coordinates game area shift when panels open/close
 *
 * Based on UISpec.md Panel Stack Rules:
 * 1. Only ONE panel open at a time
 * 2. Clicking different sidebar icon closes current, opens new
 * 3. Clicking same icon toggles (closes if open)
 * 4. Clicking "<<" or pressing ESC closes current panel
 * 5. Clicking in game area closes panel
 */
export class PanelManager {
  private static instance: PanelManager | null = null;

  private scene: Phaser.Scene | null = null;
  private panels: Map<PanelType, SlidingPanel> = new Map();
  private activePanel: PanelType | null = null;

  // Game area container (for shifting when panel opens)
  private gameAreaContainer: Phaser.GameObjects.Container | null = null;

  // Callback for when panel state changes
  private onPanelChangeCallback: ((panelType: PanelType | null) => void) | null = null;

  private constructor() {
    // Singleton constructor
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): PanelManager {
    if (!PanelManager.instance) {
      PanelManager.instance = new PanelManager();
    }
    return PanelManager.instance;
  }

  /**
   * Reset the singleton (for testing or scene restart)
   */
  public static resetInstance(): void {
    if (PanelManager.instance) {
      PanelManager.instance.destroy();
      PanelManager.instance = null;
    }
  }

  /**
   * Initialize with a scene
   */
  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Set the game area container for shifting
   */
  public setGameAreaContainer(container: Phaser.GameObjects.Container): void {
    this.gameAreaContainer = container;
  }

  /**
   * Register a panel with the manager
   */
  public registerPanel(panel: SlidingPanel): void {
    const panelType = panel.getPanelType();

    if (this.panels.has(panelType)) {
      console.warn(`[PanelManager] Panel ${panelType} already registered, replacing`);
      this.panels.get(panelType)?.destroy();
    }

    this.panels.set(panelType, panel);

    if (import.meta.env.DEV) {
      console.log(`[PanelManager] Registered panel: ${panelType}`);
    }
  }

  /**
   * Unregister a panel
   */
  public unregisterPanel(panelType: PanelType): void {
    if (this.activePanel === panelType) {
      this.closeCurrentPanel();
    }
    this.panels.delete(panelType);
  }

  /**
   * Get a registered panel
   */
  public getPanel(panelType: PanelType): SlidingPanel | undefined {
    return this.panels.get(panelType);
  }

  /**
   * Get the currently active panel type
   */
  public getActivePanel(): PanelType | null {
    return this.activePanel;
  }

  /**
   * Check if any panel is currently open
   */
  public hasOpenPanel(): boolean {
    return this.activePanel !== null;
  }

  /**
   * Check if a specific panel is open
   */
  public isPanelOpen(panelType: PanelType): boolean {
    return this.activePanel === panelType;
  }

  /**
   * Open a specific panel
   * If another panel is open, it closes first
   */
  public openPanel(panelType: PanelType): void {
    const panel = this.panels.get(panelType);
    if (!panel) {
      console.warn(`[PanelManager] Panel ${panelType} not registered`);
      return;
    }

    // If this panel is already open, do nothing
    if (this.activePanel === panelType) {
      return;
    }

    // Close current panel first (if any)
    if (this.activePanel !== null) {
      const currentPanel = this.panels.get(this.activePanel);
      currentPanel?.forceClose();
    }

    // Open the new panel
    this.activePanel = panelType;
    panel.open();

    // Shift game area
    this.shiftGameArea(true);

    // Notify callback
    this.notifyPanelChange(panelType);
  }

  /**
   * Close the currently open panel
   */
  public closeCurrentPanel(): void {
    if (this.activePanel === null) return;

    const panel = this.panels.get(this.activePanel);
    if (panel) {
      panel.close();
    }

    this.activePanel = null;

    // Shift game area back
    this.shiftGameArea(false);

    // Notify callback
    this.notifyPanelChange(null);
  }

  /**
   * Toggle a specific panel
   * If the panel is open, close it
   * If another panel is open, close it and open this one
   * If no panel is open, open this one
   */
  public togglePanel(panelType: PanelType): void {
    if (this.activePanel === panelType) {
      // Same panel - close it
      this.closeCurrentPanel();
    } else {
      // Different panel or no panel - open this one
      this.openPanel(panelType);
    }
  }

  /**
   * Handle ESC key behavior
   * If a panel is open, close it
   * If no panel is open, open Settings panel
   */
  public handleEscapeKey(): void {
    if (this.activePanel !== null) {
      this.closeCurrentPanel();
    } else {
      this.openPanel(PanelType.SETTINGS);
    }
  }

  /**
   * Shift the game area when panel opens/closes
   */
  private shiftGameArea(panelOpen: boolean): void {
    if (!this.scene || !this.gameAreaContainer) return;

    const targetX = panelOpen ? UI_CONFIG.PANEL.WIDTH : 0;
    const duration = panelOpen ? UI_CONFIG.PANEL.OPEN_DURATION : UI_CONFIG.PANEL.CLOSE_DURATION;
    const ease = panelOpen ? UI_CONFIG.PANEL.EASE_OPEN : UI_CONFIG.PANEL.EASE_CLOSE;

    this.scene.tweens.add({
      targets: this.gameAreaContainer,
      x: targetX,
      duration: duration,
      ease: ease,
    });
  }

  /**
   * Set callback for panel state changes
   */
  public setOnPanelChangeCallback(callback: (panelType: PanelType | null) => void): void {
    this.onPanelChangeCallback = callback;
  }

  /**
   * Notify callback of panel change
   */
  private notifyPanelChange(panelType: PanelType | null): void {
    if (this.onPanelChangeCallback) {
      this.onPanelChangeCallback(panelType);
    }
  }

  /**
   * Close panel when clicking on game area
   */
  public handleGameAreaClick(): void {
    if (this.hasOpenPanel()) {
      this.closeCurrentPanel();
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // Close any open panel
    if (this.activePanel !== null) {
      const panel = this.panels.get(this.activePanel);
      panel?.forceClose();
      this.activePanel = null;
    }

    // Clear all panels
    this.panels.clear();
    this.scene = null;
    this.gameAreaContainer = null;
    this.onPanelChangeCallback = null;
  }
}

/**
 * Helper function to get the PanelManager instance
 */
export function getPanelManager(): PanelManager {
  return PanelManager.getInstance();
}
