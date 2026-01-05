import Phaser from 'phaser';
import { Tooltip, TooltipContent } from './Tooltip';
import { UI_CONFIG } from '../../config/UIConfig';
import { getSettingsManager } from '../../managers/SettingsManager';

/**
 * TooltipManager - Singleton manager for tooltip display
 *
 * Features:
 * - Show delay before displaying tooltips
 * - Automatic positioning near cursor
 * - Settings-aware (respects showTooltips setting)
 * - Scene-aware lifecycle management
 */
export class TooltipManager {
  private static instance: TooltipManager | null = null;

  private scene: Phaser.Scene | null = null;
  private tooltip: Tooltip | null = null;
  private showDelayTimer: Phaser.Time.TimerEvent | null = null;
  private pendingContent: TooltipContent | null = null;
  private pendingX: number = 0;
  private pendingY: number = 0;
  private isShowing: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }

  /**
   * Initialize with a scene (call this when scene starts)
   */
  public init(scene: Phaser.Scene): void {
    // Clean up previous scene if any
    this.cleanup();

    this.scene = scene;
    this.tooltip = new Tooltip(scene);
  }

  /**
   * Check if tooltips are enabled in settings
   */
  public isEnabled(): boolean {
    const settings = getSettingsManager();
    return settings.showTooltips !== false; // Default to true if not set
  }

  /**
   * Show tooltip with delay
   */
  public show(content: TooltipContent, x: number, y: number): void {
    if (!this.scene || !this.tooltip || !this.isEnabled()) {
      return;
    }

    // Store pending content
    this.pendingContent = content;
    this.pendingX = x;
    this.pendingY = y;

    // Cancel any existing delay timer
    this.cancelDelayTimer();

    // Start delay timer
    this.showDelayTimer = this.scene.time.delayedCall(
      UI_CONFIG.TOOLTIP.SHOW_DELAY,
      this.showImmediately,
      [],
      this
    );
  }

  /**
   * Show tooltip immediately (no delay)
   */
  public showImmediately(): void {
    if (!this.tooltip || !this.pendingContent || !this.isEnabled()) {
      return;
    }

    this.tooltip.show(this.pendingContent, this.pendingX, this.pendingY);
    this.isShowing = true;
  }

  /**
   * Update tooltip position (for following cursor)
   */
  public updatePosition(x: number, y: number): void {
    if (!this.isShowing || !this.tooltip) {
      return;
    }

    // Update pending position for when tooltip shows
    this.pendingX = x;
    this.pendingY = y;

    // If already showing, reposition
    if (this.pendingContent) {
      this.tooltip.show(this.pendingContent, x, y);
    }
  }

  /**
   * Hide the tooltip
   */
  public hide(): void {
    this.cancelDelayTimer();
    this.pendingContent = null;
    this.isShowing = false;

    if (this.tooltip) {
      this.tooltip.hide();
    }
  }

  /**
   * Check if tooltip is currently visible
   */
  public isVisible(): boolean {
    return this.isShowing;
  }

  /**
   * Cancel the delay timer
   */
  private cancelDelayTimer(): void {
    if (this.showDelayTimer) {
      this.showDelayTimer.destroy();
      this.showDelayTimer = null;
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.cancelDelayTimer();
    this.pendingContent = null;
    this.isShowing = false;

    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }

    this.scene = null;
  }

  /**
   * Destroy the singleton (call on game shutdown)
   */
  public static destroy(): void {
    if (TooltipManager.instance) {
      TooltipManager.instance.cleanup();
      TooltipManager.instance = null;
    }
  }
}

/**
 * Helper function to get the TooltipManager instance
 */
export function getTooltipManager(): TooltipManager {
  return TooltipManager.getInstance();
}
