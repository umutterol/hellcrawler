import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Main Game Scene - Core gameplay loop
 * Handles tank, enemies, combat, and wave progression
 */
export class GameScene extends Phaser.Scene {
  private tank: Phaser.GameObjects.Sprite | null = null;
  private fpsText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.createBackground();
    this.createTank();
    this.createDebugInfo();

    // Log successful initialization
    console.log('Hellcrawler GameScene initialized');
    console.log(`Resolution: ${GAME_CONFIG.WIDTH}x${GAME_CONFIG.HEIGHT}`);
  }

  update(_time: number, delta: number): void {
    this.updateDebugInfo(delta);
  }

  private createBackground(): void {
    // Placeholder background - gradient effect
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Ground line
    bg.lineStyle(2, 0x444444);
    bg.lineBetween(
      0,
      GAME_CONFIG.HEIGHT - 100,
      GAME_CONFIG.WIDTH,
      GAME_CONFIG.HEIGHT - 100
    );
  }

  private createTank(): void {
    // Tank positioned on the left side, facing right
    const tankX = 200;
    const tankY = GAME_CONFIG.HEIGHT - 150;

    this.tank = this.add.sprite(tankX, tankY, 'tank-placeholder');
    this.tank.setOrigin(0.5, 1);

    // Add label for now
    this.add
      .text(tankX, tankY - 80, 'TANK', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  private createDebugInfo(): void {
    // FPS counter in top-left (dev only)
    if (import.meta.env.DEV) {
      this.fpsText = this.add.text(10, 10, 'FPS: --', {
        fontSize: '16px',
        color: '#00ff00',
      });

      // Zone info placeholder
      this.add.text(GAME_CONFIG.WIDTH / 2, 30, 'Zone: Act 1 - City Invasion', {
        fontSize: '24px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // Instructions
      this.add.text(
        GAME_CONFIG.WIDTH / 2,
        GAME_CONFIG.HEIGHT - 30,
        'Phase 0 Complete - Project Setup Ready',
        {
          fontSize: '18px',
          color: '#888888',
        }
      ).setOrigin(0.5);
    }
  }

  private updateDebugInfo(delta: number): void {
    if (this.fpsText && import.meta.env.DEV) {
      const fps = Math.round(1000 / delta);
      this.fpsText.setText(`FPS: ${fps}`);

      // Warn if FPS drops below target
      if (fps < 55) {
        this.fpsText.setColor('#ff0000');
        console.warn('FPS drop:', fps);
      } else {
        this.fpsText.setColor('#00ff00');
      }
    }
  }
}
