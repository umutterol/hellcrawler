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

    // === TANK ===
    this.load.image('tank', 'assets/sprites/tank/tank-sheet.png');
    this.load.image('tank-1', 'assets/sprites/tank/tank-unit1.png');
    this.load.image('tank-2', 'assets/sprites/tank/tank-unit2.png');
    this.load.image('tank-3', 'assets/sprites/tank/tank-unit3.png');
    this.load.image('tank-4', 'assets/sprites/tank/tank-unit4.png');

    // === ENEMIES - ACT 1 ===
    // Imp (Fodder)
    this.load.spritesheet('imp', 'assets/sprites/enemies/act1/imp-sheet.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image('imp-run-1', 'assets/sprites/enemies/act1/imp-run1.png');
    this.load.image('imp-run-2', 'assets/sprites/enemies/act1/imp-run2.png');
    this.load.image('imp-run-3', 'assets/sprites/enemies/act1/imp-run3.png');
    this.load.image('imp-run-4', 'assets/sprites/enemies/act1/imp-run4.png');

    // Hellhound (Fodder)
    this.load.spritesheet('hellhound', 'assets/sprites/enemies/act1/hellhound-sheet.png', {
      frameWidth: 48,
      frameHeight: 32,
    });
    this.load.image('hellhound-run-1', 'assets/sprites/enemies/act1/hellhound-run1.png');
    this.load.image('hellhound-run-2', 'assets/sprites/enemies/act1/hellhound-run2.png');
    this.load.image('hellhound-run-3', 'assets/sprites/enemies/act1/hellhound-run3.png');
    this.load.image('hellhound-run-4', 'assets/sprites/enemies/act1/hellhound-run4.png');

    // Possessed Soldier (Fodder)
    this.load.spritesheet('soldier', 'assets/sprites/enemies/act1/soldier-sheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    for (let i = 1; i <= 8; i++) {
      this.load.image(`soldier-${i}`, `assets/sprites/enemies/act1/soldier${i}.png`);
    }

    // Fire Skull (Elite)
    this.load.image('fire-skull', 'assets/sprites/enemies/act1/fire-skull.png');
    this.load.image('fire-skull-no-fire', 'assets/sprites/enemies/act1/fire-skull-no-fire.png');

    // === BOSS - SENTINEL ===
    // Sentinel spritesheet: 960x144 with 5 frames = 192x144 per frame
    this.load.spritesheet('sentinel-idle', 'assets/sprites/bosses/sentinel-idle.png', {
      frameWidth: 192,
      frameHeight: 144,
    });
    this.load.image('sentinel-attack', 'assets/sprites/bosses/sentinel-attack.png');
    this.load.image('sentinel-attack-no-breath', 'assets/sprites/bosses/sentinel-attack-no-breath.png');
    this.load.image('sentinel-breath', 'assets/sprites/bosses/breath.png');
    this.load.image('sentinel-breath-fire', 'assets/sprites/bosses/breath-fire.png');

    // === PROJECTILES ===
    // Bullets (Machine Gun)
    this.load.image('bullet-1', 'assets/sprites/projectiles/shoot1.png');
    this.load.image('bullet-2', 'assets/sprites/projectiles/shoot2.png');
    this.load.spritesheet('bullet', 'assets/sprites/projectiles/shoot-spritesheet.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Missiles
    this.load.image('missile-1', 'assets/sprites/projectiles/missile1.png');
    this.load.image('missile-2', 'assets/sprites/projectiles/missile2.png');
    this.load.image('missile-3', 'assets/sprites/projectiles/missile3.png');
    this.load.image('missile-4', 'assets/sprites/projectiles/missile4.png');

    // Cannon shells
    this.load.image('cannon-1', 'assets/sprites/projectiles/cannon1.png');
    this.load.image('cannon-2', 'assets/sprites/projectiles/cannon2.png');
    this.load.image('cannon-3', 'assets/sprites/projectiles/cannon3.png');
    this.load.image('cannon-4', 'assets/sprites/projectiles/cannon4.png');
    this.load.image('cannon-5', 'assets/sprites/projectiles/cannon5.png');
    this.load.image('cannon-6', 'assets/sprites/projectiles/cannon6.png');

    // === EFFECTS ===
    // Explosions
    this.load.atlas(
      'explosion',
      'assets/effects/explosions/explosion-animation.png',
      'assets/effects/explosions/explosion-animation.json'
    );
    for (let i = 1; i <= 9; i++) {
      this.load.image(`explosion-${i}`, `assets/effects/explosions/explosion-animation${i}.png`);
    }

    // Big explosion
    this.load.image('big-explosion-sheet', 'assets/effects/explosions/big_explosion-sheet.png');
    for (let i = 1; i <= 11; i++) {
      this.load.image(`big-explosion-${i}`, `assets/effects/explosions/big_explosion${i}.png`);
    }

    // Hit effects
    this.load.image('hit-sheet', 'assets/effects/hits/hit-sheet.png');
    for (let i = 1; i <= 4; i++) {
      this.load.image(`hit-${i}`, `assets/effects/hits/hit${i}.png`);
    }

    // Spark effects
    for (let i = 1; i <= 5; i++) {
      this.load.image(`spark-${i}`, `assets/effects/hits/spark-preview${i}.png`);
    }

    // Muzzle flash
    this.load.image('muzzle-flash', 'assets/effects/muzzle/flash.png');

    // Smoke (Near Death state)
    this.load.image('smoke-sheet', 'assets/effects/smoke/SmokeColumn-sheet.png');
    for (let i = 1; i <= 21; i++) {
      this.load.image(`smoke-${i}`, `assets/effects/smoke/SmokeColumn${i}.png`);
    }

    // === GORE EFFECTS ===
    // Blood splatters (large)
    for (let i = 1; i <= 9; i++) {
      this.load.image(`blood${i}`, `assets/effects/gore/blood/blood${i}.png`);
    }
    // Blood splatters (small)
    for (let i = 1; i <= 6; i++) {
      this.load.image(`blood-small${i}`, `assets/effects/gore/blood/blood-small${i}.png`);
    }
    // Gib sprites - torso pieces
    this.load.image('gib-torso1', 'assets/effects/gore/gibs/torso1.png');
    this.load.image('gib-torso2', 'assets/effects/gore/gibs/torso2.png');
    this.load.image('gib-torso3', 'assets/effects/gore/gibs/torso3.png');
    this.load.image('gib-lower-torso-1', 'assets/effects/gore/gibs/lower-torso-1.png');
    this.load.image('gib-lower-torso-2', 'assets/effects/gore/gibs/lower-torso-2.png');
    this.load.image('gib-lower-torso-3', 'assets/effects/gore/gibs/lower-torso-3.png');
    // Gib sprites - limb pieces
    this.load.image('gib-arm-part', 'assets/effects/gore/gibs/arm-part.png');
    this.load.image('gib-arm-back-part', 'assets/effects/gore/gibs/arm-back-part.png');
    this.load.image('gib-forearm-front', 'assets/effects/gore/gibs/forearm-front.png');
    this.load.image('gib-forearm-back', 'assets/effects/gore/gibs/forearm-back.png');

    // === BACKGROUNDS - ACT 1 ===
    this.load.image('bg-sky', 'assets/backgrounds/act1/sky.png');
    this.load.image('bg-clouds', 'assets/backgrounds/act1/clouds.png');
    this.load.image('bg-mountains', 'assets/backgrounds/act1/mountains.png');
    this.load.image('bg-mountains-lights', 'assets/backgrounds/act1/mountains-lights.png');
    this.load.image('bg-far-buildings', 'assets/backgrounds/act1/far-buildings.png');
    this.load.image('bg-forest', 'assets/backgrounds/act1/forest.png');
    this.load.image('bg-town', 'assets/backgrounds/act1/town.png');

    // === AUDIO ===
    // Weapon SFX
    this.load.audio('sfx-shot1', 'assets/audio/sfx/weapons/shot1.wav');
    this.load.audio('sfx-shot2', 'assets/audio/sfx/weapons/shot2.wav');

    // Impact SFX
    this.load.audio('sfx-hit', 'assets/audio/sfx/impacts/hit.wav');
    this.load.audio('sfx-explosion', 'assets/audio/sfx/impacts/explosion.wav');

    // Music
    this.load.audio('music-combat', ['assets/audio/music/combat.ogg', 'assets/audio/music/combat.mp3']);
  }

  create(): void {
    // Create animations for sprites
    this.createAnimations();

    // Create placeholder assets as fallback
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

  private createAnimations(): void {
    // Imp run animation
    if (!this.anims.exists('imp-run')) {
      this.anims.create({
        key: 'imp-run',
        frames: [
          { key: 'imp-run-1' },
          { key: 'imp-run-2' },
          { key: 'imp-run-3' },
          { key: 'imp-run-4' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    // Hellhound run animation
    if (!this.anims.exists('hellhound-run')) {
      this.anims.create({
        key: 'hellhound-run',
        frames: [
          { key: 'hellhound-run-1' },
          { key: 'hellhound-run-2' },
          { key: 'hellhound-run-3' },
          { key: 'hellhound-run-4' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    // Soldier walk animation
    if (!this.anims.exists('soldier-walk')) {
      this.anims.create({
        key: 'soldier-walk',
        frames: [
          { key: 'soldier-1' },
          { key: 'soldier-2' },
          { key: 'soldier-3' },
          { key: 'soldier-4' },
          { key: 'soldier-5' },
          { key: 'soldier-6' },
          { key: 'soldier-7' },
          { key: 'soldier-8' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    // Sentinel boss idle animation (5 frames)
    if (!this.anims.exists('sentinel-idle-anim')) {
      this.anims.create({
        key: 'sentinel-idle-anim',
        frames: this.anims.generateFrameNumbers('sentinel-idle', { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Explosion animation
    if (!this.anims.exists('explosion-anim')) {
      this.anims.create({
        key: 'explosion-anim',
        frames: [
          { key: 'explosion-1' },
          { key: 'explosion-2' },
          { key: 'explosion-3' },
          { key: 'explosion-4' },
          { key: 'explosion-5' },
          { key: 'explosion-6' },
          { key: 'explosion-7' },
          { key: 'explosion-8' },
          { key: 'explosion-9' },
        ],
        frameRate: 15,
        repeat: 0,
      });
    }

    // Big explosion animation
    if (!this.anims.exists('big-explosion-anim')) {
      this.anims.create({
        key: 'big-explosion-anim',
        frames: [
          { key: 'big-explosion-1' },
          { key: 'big-explosion-2' },
          { key: 'big-explosion-3' },
          { key: 'big-explosion-4' },
          { key: 'big-explosion-5' },
          { key: 'big-explosion-6' },
          { key: 'big-explosion-7' },
          { key: 'big-explosion-8' },
          { key: 'big-explosion-9' },
          { key: 'big-explosion-10' },
          { key: 'big-explosion-11' },
        ],
        frameRate: 12,
        repeat: 0,
      });
    }

    // Hit effect animation
    if (!this.anims.exists('hit-anim')) {
      this.anims.create({
        key: 'hit-anim',
        frames: [
          { key: 'hit-1' },
          { key: 'hit-2' },
          { key: 'hit-3' },
          { key: 'hit-4' },
        ],
        frameRate: 15,
        repeat: 0,
      });
    }

    // Smoke animation
    if (!this.anims.exists('smoke-anim')) {
      const smokeFrames = [];
      for (let i = 1; i <= 21; i++) {
        smokeFrames.push({ key: `smoke-${i}` });
      }
      this.anims.create({
        key: 'smoke-anim',
        frames: smokeFrames,
        frameRate: 12,
        repeat: -1,
      });
    }

    // Missile animation
    if (!this.anims.exists('missile-anim')) {
      this.anims.create({
        key: 'missile-anim',
        frames: [
          { key: 'missile-1' },
          { key: 'missile-2' },
          { key: 'missile-3' },
          { key: 'missile-4' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    // Cannon shell animation
    if (!this.anims.exists('cannon-anim')) {
      this.anims.create({
        key: 'cannon-anim',
        frames: [
          { key: 'cannon-1' },
          { key: 'cannon-2' },
          { key: 'cannon-3' },
          { key: 'cannon-4' },
          { key: 'cannon-5' },
          { key: 'cannon-6' },
        ],
        frameRate: 12,
        repeat: -1,
      });
    }
  }

  private createPlaceholderAssets(): void {
    // Create placeholder tank texture (fallback)
    if (!this.textures.exists('tank-placeholder')) {
      const tankGraphics = this.make.graphics({ x: 0, y: 0 });
      tankGraphics.fillStyle(0x4a5d23, 1); // Olive drab
      tankGraphics.fillRect(0, 0, 128, 64);
      tankGraphics.fillStyle(0x3a4d13, 1);
      tankGraphics.fillRect(80, 20, 60, 24); // Cannon barrel
      tankGraphics.fillStyle(0xff6600, 1);
      tankGraphics.fillRect(0, 58, 128, 6); // Orange hazard stripe
      tankGraphics.generateTexture('tank-placeholder', 140, 64);
      tankGraphics.destroy();
    }

    // Create placeholder enemy texture (fallback)
    if (!this.textures.exists('enemy-placeholder')) {
      const enemyGraphics = this.make.graphics({ x: 0, y: 0 });
      enemyGraphics.fillStyle(0x8b0000, 1); // Dark red
      enemyGraphics.fillCircle(16, 16, 16);
      enemyGraphics.generateTexture('enemy-placeholder', 32, 32);
      enemyGraphics.destroy();
    }

    // Create placeholder projectile texture (fallback)
    if (!this.textures.exists('bullet-placeholder')) {
      const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
      bulletGraphics.fillStyle(0xffff00, 1); // Yellow
      bulletGraphics.fillCircle(4, 4, 4);
      bulletGraphics.generateTexture('bullet-placeholder', 8, 8);
      bulletGraphics.destroy();
    }

    // Create module placeholder textures
    this.createModulePlaceholders();
  }

  /**
   * Create placeholder textures for module sprites
   * These are 16-bit style turret sprites
   */
  private createModulePlaceholders(): void {
    // Machine Gun - Dual barrel turret
    if (!this.textures.exists('module-machinegun')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Turret base
      g.fillStyle(0x4a5a4a, 1);
      g.fillRect(0, 4, 12, 8);
      // Barrel mount
      g.fillStyle(0x5a6a5a, 1);
      g.fillRect(8, 2, 6, 12);
      // Top barrel
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(10, 3, 16, 3);
      // Bottom barrel
      g.fillRect(10, 10, 16, 3);
      // Muzzle flash point (small bright dot)
      g.fillStyle(0x666666, 1);
      g.fillCircle(25, 4, 1);
      g.fillCircle(25, 12, 1);
      g.generateTexture('module-machinegun', 28, 16);
      g.destroy();
    }

    // Missile Pod - Boxy launcher with tubes
    if (!this.textures.exists('module-missile')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Launcher body
      g.fillStyle(0x5a5a3a, 1);
      g.fillRect(0, 2, 14, 12);
      // Launch tubes (2x2)
      g.fillStyle(0x2a2a2a, 1);
      g.fillCircle(16, 5, 3);
      g.fillCircle(16, 11, 3);
      g.fillCircle(22, 5, 3);
      g.fillCircle(22, 11, 3);
      // Highlight
      g.fillStyle(0x7a7a5a, 1);
      g.fillRect(2, 3, 10, 2);
      g.generateTexture('module-missile', 28, 16);
      g.destroy();
    }

    // Repair Drone - Hexagonal drone with glow
    if (!this.textures.exists('module-repair')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Drone body (hexagon-ish)
      g.fillStyle(0x3a6a3a, 1);
      g.fillRect(4, 4, 12, 8);
      g.fillRect(6, 2, 8, 12);
      // Center light
      g.fillStyle(0x66ff66, 1);
      g.fillCircle(10, 8, 3);
      // Rotor arms
      g.fillStyle(0x2a4a2a, 1);
      g.fillRect(0, 6, 5, 4);
      g.fillRect(15, 6, 5, 4);
      g.generateTexture('module-repair', 20, 16);
      g.destroy();
    }

    // Generic placeholder for unknown types
    if (!this.textures.exists('module-placeholder')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x666666, 1);
      g.fillRect(0, 4, 10, 8);
      g.fillStyle(0x888888, 1);
      g.fillRect(8, 6, 12, 4);
      g.generateTexture('module-placeholder', 20, 16);
      g.destroy();
    }
  }
}
