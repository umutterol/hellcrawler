/**
 * ClickThroughManager - Manages click-through behavior for Electron transparent windows
 *
 * When running in Electron with a transparent window, this manager dynamically
 * enables/disables click-through based on cursor position:
 * - Over interactive game elements: click-through disabled (game receives clicks)
 * - Over transparent/empty areas: click-through enabled (clicks pass to desktop)
 *
 * This creates a "widget-like" experience where the game floats on the desktop
 * without blocking interaction with other applications.
 */

import { getSettingsManager } from './SettingsManager';

// Minimum depth for objects to be considered interactive (above background layers)
const MIN_INTERACTIVE_DEPTH = 10;

export class ClickThroughManager {
  private scene: Phaser.Scene;
  private isClickThroughEnabled: boolean = false;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 50; // Check every 50ms to reduce overhead
  private pointerMoveHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  private mouseLeaveHandler: (() => void) | null = null;
  private mouseEnterHandler: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Only initialize in Electron environment
    if (!this.isElectronEnvironment()) {
      return;
    }

    this.setupPointerTracking();
    this.applyElectronSettings();

    if (import.meta.env.DEV) {
      console.log('[ClickThroughManager] Initialized for Electron environment');
    }
  }

  /**
   * Apply saved Electron-specific settings on startup
   */
  private async applyElectronSettings(): Promise<void> {
    const settings = getSettingsManager();

    // Apply saved always-on-top setting
    await settings.applyAlwaysOnTop();

    if (import.meta.env.DEV) {
      console.log(`[ClickThroughManager] Applied alwaysOnTop: ${settings.alwaysOnTop}`);
    }
  }

  /**
   * Check if running in Electron
   */
  private isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
  }

  /**
   * Setup pointer movement tracking
   */
  private setupPointerTracking(): void {
    this.pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      this.onPointerMove(pointer);
    };

    this.scene.input.on('pointermove', this.pointerMoveHandler);

    // Track when pointer leaves the game canvas entirely
    this.mouseLeaveHandler = () => {
      this.setClickThrough(true);
    };
    this.scene.game.canvas.addEventListener('mouseleave', this.mouseLeaveHandler);

    // Track when pointer re-enters the canvas
    this.mouseEnterHandler = () => {
      // Re-evaluate on re-entry
      const pointer = this.scene.input.activePointer;
      this.evaluateClickThrough(pointer);
    };
    this.scene.game.canvas.addEventListener('mouseenter', this.mouseEnterHandler);
  }

  /**
   * Handle pointer movement
   */
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    // Throttle updates to reduce IPC overhead
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    this.lastUpdateTime = now;

    this.evaluateClickThrough(pointer);
  }

  /**
   * Evaluate whether click-through should be enabled based on pointer position
   */
  private evaluateClickThrough(pointer: Phaser.Input.Pointer): void {
    const settings = getSettingsManager();

    // If click-through is disabled in settings, always keep it off
    if (!settings.clickThroughEnabled) {
      if (this.isClickThroughEnabled) {
        this.setClickThrough(false);
      }
      return;
    }

    // Check if pointer is over any interactive object
    const isOverInteractive = this.isPointerOverInteractive(pointer);

    // Toggle click-through based on whether we're over something interactive
    if (isOverInteractive && this.isClickThroughEnabled) {
      this.setClickThrough(false);
    } else if (!isOverInteractive && !this.isClickThroughEnabled) {
      this.setClickThrough(true);
    }
  }

  /**
   * Check if the pointer is over any interactive game object
   */
  private isPointerOverInteractive(pointer: Phaser.Input.Pointer): boolean {
    // Use Phaser's built-in hit test to check for interactive objects
    const hitObjects = this.scene.input.hitTestPointer(pointer);

    if (hitObjects.length > 0) {
      return true;
    }

    // Also check if pointer is over any visible game sprites (tank, enemies, UI)
    // This provides a buffer zone around game elements
    const gameObjects = this.scene.children.list;

    for (const obj of gameObjects) {
      if (this.isGameObjectInteractive(obj, pointer)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a game object should be considered interactive for click-through purposes
   */
  private isGameObjectInteractive(
    obj: Phaser.GameObjects.GameObject,
    pointer: Phaser.Input.Pointer
  ): boolean {
    // Skip invisible objects
    if (!('visible' in obj) || !(obj as Phaser.GameObjects.Sprite).visible) {
      return false;
    }

    // Skip objects without bounds
    if (!('getBounds' in obj)) {
      return false;
    }

    const sprite = obj as Phaser.GameObjects.Sprite;

    // Skip very transparent objects (likely background elements)
    if (sprite.alpha < 0.3) {
      return false;
    }

    // Skip objects at very low depth (background layers)
    if (sprite.depth < MIN_INTERACTIVE_DEPTH) {
      return false;
    }

    // Check if pointer is within bounds
    const bounds = sprite.getBounds();
    return bounds.contains(pointer.worldX, pointer.worldY);
  }

  /**
   * Set click-through state via Electron IPC
   */
  private async setClickThrough(enabled: boolean): Promise<void> {
    if (this.isClickThroughEnabled === enabled) {
      return;
    }

    this.isClickThroughEnabled = enabled;

    try {
      await window.electronAPI?.setClickThrough(enabled);

      if (import.meta.env.DEV) {
        console.log(`[ClickThroughManager] Click-through ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[ClickThroughManager] Failed to set click-through:', error);
      }
    }
  }

  /**
   * Force click-through to a specific state (for manual control)
   */
  public forceClickThrough(enabled: boolean): void {
    this.setClickThrough(enabled);
  }

  /**
   * Cleanup - remove all event listeners to prevent memory leaks
   */
  public destroy(): void {
    // Remove Phaser input listener
    if (this.pointerMoveHandler) {
      this.scene.input.off('pointermove', this.pointerMoveHandler);
      this.pointerMoveHandler = null;
    }

    // Remove canvas DOM event listeners
    if (this.mouseLeaveHandler) {
      this.scene.game.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
      this.mouseLeaveHandler = null;
    }

    if (this.mouseEnterHandler) {
      this.scene.game.canvas.removeEventListener('mouseenter', this.mouseEnterHandler);
      this.mouseEnterHandler = null;
    }
  }
}
