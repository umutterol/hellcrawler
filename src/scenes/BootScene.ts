import Phaser from 'phaser';

/**
 * Boot Scene - Asset loading and initialization
 * Responsible for loading all game assets and transitioning to GameScene
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingBar();

    // TODO: Load assets when available
    // Critical assets (blocking)
    // this.load.image('tank', 'assets/sprites/tank/tank.png');

    // For now, create placeholder graphics in create()
  }

  create(): void {
    // Placeholder: Create simple graphics until real assets are available
    this.createPlaceholderAssets();

    // Transition to GameScene
    this.scene.start('GameScene');
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading bar background
    const barBg = this.add.rectangle(width / 2, height / 2, 400, 30, 0x222222);
    barBg.setOrigin(0.5);

    // Loading bar fill
    const barFill = this.add.rectangle(
      width / 2 - 198,
      height / 2,
      0,
      26,
      0x00ff00
    );
    barFill.setOrigin(0, 0.5);

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    // Update loading bar on progress
    this.load.on('progress', (value: number) => {
      barFill.width = 396 * value;
    });

    this.load.on('complete', () => {
      loadingText.setText('Complete!');
    });
  }

  private createPlaceholderAssets(): void {
    // Create placeholder tank texture
    const tankGraphics = this.make.graphics({ x: 0, y: 0 });
    tankGraphics.fillStyle(0x4a5d23, 1); // Olive drab
    tankGraphics.fillRect(0, 0, 128, 64);
    tankGraphics.fillStyle(0x3a4d13, 1);
    tankGraphics.fillRect(80, 20, 60, 24); // Cannon barrel
    tankGraphics.fillStyle(0xff6600, 1);
    tankGraphics.fillRect(0, 58, 128, 6); // Orange hazard stripe
    tankGraphics.generateTexture('tank-placeholder', 140, 64);
    tankGraphics.destroy();

    // Create placeholder enemy texture
    const enemyGraphics = this.make.graphics({ x: 0, y: 0 });
    enemyGraphics.fillStyle(0x8b0000, 1); // Dark red
    enemyGraphics.fillCircle(16, 16, 16);
    enemyGraphics.generateTexture('enemy-placeholder', 32, 32);
    enemyGraphics.destroy();

    // Create placeholder projectile texture
    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0xffff00, 1); // Yellow
    bulletGraphics.fillCircle(4, 4, 4);
    bulletGraphics.generateTexture('bullet-placeholder', 8, 8);
    bulletGraphics.destroy();
  }
}
