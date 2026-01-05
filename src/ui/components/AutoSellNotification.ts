import Phaser from 'phaser';
import { EventManager, getEventManager } from '../../managers/EventManager';
import { GameEvents, ModuleAutoSoldPayload } from '../../types/GameEvents';
import { UI_CONFIG } from '../../config/UIConfig';

/**
 * AutoSellNotification - Shows floating "+Xg (Auto-sold)" text when modules are auto-sold
 *
 * Listens for MODULE_AUTO_SOLD events and displays a floating gold notification
 * at the drop position.
 */
export class AutoSellNotification {
  private scene: Phaser.Scene;
  private eventManager: EventManager;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventManager = getEventManager();

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.eventManager.on(GameEvents.MODULE_AUTO_SOLD, this.onModuleAutoSold, this);
  }

  /**
   * Handle auto-sold module event
   */
  private onModuleAutoSold(payload: ModuleAutoSoldPayload): void {
    this.showNotification(payload.x, payload.y, payload.goldEarned);
  }

  /**
   * Show floating gold notification
   */
  private showNotification(x: number, y: number, goldEarned: number): void {
    // Create container for the notification
    const container = this.scene.add.container(x, y);
    container.setDepth(UI_CONFIG.DEPTHS.OVERLAY);

    // Gold text with green color (Uncommon color)
    const text = this.scene.add.text(0, 0, `+${goldEarned}g`, {
      fontSize: '14px',
      color: '#4ade80', // Green for Uncommon
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    container.add(text);

    // Auto-sold label below
    const label = this.scene.add.text(0, 16, '(Auto-sold)', {
      fontSize: '10px',
      color: '#9ca3af',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0.5);
    container.add(label);

    // Pop-in animation
    container.setScale(0);
    this.scene.tweens.add({
      targets: container,
      scale: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });

    // Float up and fade out
    this.scene.tweens.add({
      targets: container,
      y: y - 40,
      alpha: 0,
      duration: 1500,
      delay: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        container.destroy();
      },
    });
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.MODULE_AUTO_SOLD, this.onModuleAutoSold, this);
  }
}
