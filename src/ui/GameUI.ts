import Phaser from 'phaser';
import { UI_CONFIG } from '../config/UIConfig';

/**
 * GameUI - Minimal in-game HUD elements
 *
 * Note: Most HUD elements have been moved to:
 * - TopBar: Gold, XP, Level, Zone
 * - BottomBar: HP bar, module slots, wave progress, near death
 *
 * This class is kept for potential future floating UI elements
 * that need to be in the game world (damage numbers, pickup indicators, etc.)
 */
export class GameUI {
  // Container for any floating UI elements
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setDepth(UI_CONFIG.DEPTHS.HUD);
  }

  /**
   * Update called each frame
   */
  public update(_time: number, _delta: number): void {
    // Reserved for floating UI updates (damage numbers, etc.)
  }

  /**
   * Get the container for adding floating elements
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.container.destroy(true);
  }
}
