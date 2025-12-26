import Phaser from 'phaser';
import { IPoolable } from '../managers/PoolManager';

/**
 * Projectile type enumeration
 */
export enum ProjectileType {
  Bullet = 'bullet',
  Missile = 'missile',
  Beam = 'beam',
  CannonShell = 'cannonShell',
}

/**
 * Configuration for spawning a projectile
 */
export interface ProjectileConfig {
  type: ProjectileType;
  damage: number;
  speed: number;
  isCrit: boolean;
  piercing?: boolean;
  aoeRadius?: number;
  homingTarget?: Phaser.GameObjects.GameObject;
  lifetime?: number;
}

/**
 * Projectile - Base class for all projectiles
 *
 * Implements IPoolable for object pooling.
 * Projectiles move from left to right toward enemies.
 *
 * Features:
 * - Poolable (activate/deactivate lifecycle)
 * - Linear or homing movement
 * - Damage carrying
 * - Collision detection support
 * - Lifetime management
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite implements IPoolable {
  // Configuration (set on activation)
  protected config: ProjectileConfig | null = null;
  protected projectileId: string = '';

  // State
  protected lifetime: number = 0;
  protected maxLifetime: number = 3000; // Default 3 second lifetime
  protected hasHit: boolean = false;
  protected piercedEnemies: Set<string> = new Set();

  // Homing
  protected homingTarget: Phaser.GameObjects.GameObject | null = null;
  protected homingStrength: number = 0.1;

  // ID counter
  private static idCounter: number = 0;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    super(scene, x, y, 'bullet-1');

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Initial state - inactive
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * Activate this projectile from the pool
   */
  public activate(x: number, y: number, config: ProjectileConfig): void {
    this.config = config;
    this.projectileId = `proj_${config.type}_${++Projectile.idCounter}`;

    if (import.meta.env.DEV) {
      console.log(`[Projectile] Activated ${this.projectileId} at (${x}, ${y}), speed=${config.speed}`);
    }

    // Reset position
    this.setPosition(x, y);

    // Reset state
    this.lifetime = 0;
    this.maxLifetime = config.lifetime || 3000;
    this.hasHit = false;
    this.piercedEnemies.clear();

    // Make visible and active
    this.setActive(true);
    this.setVisible(true);

    // Enable physics body and explicitly reset position
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setEnable(true);
      // Reset body position explicitly to match sprite
      body.reset(x, y);
    }

    // Configure based on type
    this.configureByType(config);

    // Set initial velocity (after body reset)
    if (config.type !== ProjectileType.Beam) {
      this.setVelocityX(config.speed);
      this.setVelocityY(0); // Ensure no vertical velocity
    }

    // Store homing target if applicable
    if (config.homingTarget) {
      this.homingTarget = config.homingTarget;
    }
  }

  /**
   * Deactivate this projectile and return to pool
   */
  public deactivate(): void {
    if (import.meta.env.DEV && this.active) {
      console.log(`[Projectile] Deactivating ${this.projectileId} at (${this.x.toFixed(0)}, ${this.y.toFixed(0)}), lifetime=${this.lifetime.toFixed(0)}ms`);
    }

    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);

    // Disable physics body
    (this.body as Phaser.Physics.Arcade.Body)?.setEnable(false);

    // Clear references
    this.config = null;
    this.homingTarget = null;
    this.piercedEnemies.clear();
  }

  private configureByType(config: ProjectileConfig): void {
    // Clear any previous tint
    this.clearTint();

    switch (config.type) {
      case ProjectileType.Bullet:
        this.setTexture('bullet-1');
        this.setScale(1.5);
        break;

      case ProjectileType.CannonShell:
        this.setTexture('cannon-1');
        this.setScale(1.5);
        break;

      case ProjectileType.Missile:
        this.setTexture('missile-1');
        this.setScale(1.5);
        break;

      case ProjectileType.Beam:
        this.setTexture('bullet-1');
        this.setScale(2, 0.5);
        this.setTint(0x00ffff); // Cyan for beam
        break;
    }

    // Crit visual - slight scale boost
    if (config.isCrit) {
      this.setScale(this.scaleX * 1.2, this.scaleY * 1.2);
    }
  }

  /**
   * Check if this projectile can hit a specific enemy
   * (for piercing projectiles that track what they've hit)
   */
  public canHitEnemy(enemyId: string): boolean {
    if (!this.config?.piercing) {
      return !this.hasHit;
    }
    return !this.piercedEnemies.has(enemyId);
  }

  /**
   * Mark that this projectile has hit an enemy
   */
  public registerHit(enemyId: string): void {
    if (this.config?.piercing) {
      this.piercedEnemies.add(enemyId);
    } else {
      this.hasHit = true;
    }
  }

  /**
   * Check if projectile should be deactivated after hit
   */
  public shouldDeactivateOnHit(): boolean {
    return !this.config?.piercing;
  }

  /**
   * Get the damage this projectile deals
   */
  public getDamage(): number {
    return this.config?.damage || 0;
  }

  /**
   * Check if this is a critical hit
   */
  public isCriticalHit(): boolean {
    return this.config?.isCrit || false;
  }

  /**
   * Get AOE radius if applicable
   */
  public getAoERadius(): number {
    return this.config?.aoeRadius || 0;
  }

  /**
   * Get projectile type
   */
  public getType(): ProjectileType {
    return this.config?.type || ProjectileType.Bullet;
  }

  /**
   * Get projectile ID
   */
  public getId(): string {
    return this.projectileId;
  }

  /**
   * Update loop
   */
  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // Update lifetime
    this.lifetime += delta;
    if (this.lifetime >= this.maxLifetime) {
      if (import.meta.env.DEV) {
        console.log(`[Projectile] ${this.projectileId} expired (lifetime)`);
      }
      this.deactivate();
      return;
    }

    // Homing logic
    if (this.homingTarget && this.homingTarget.active) {
      this.updateHoming(delta);
    }

    // Deactivate if off screen
    if (this.x > 2000 || this.x < -50 || this.y < -50 || this.y > 1130) {
      if (import.meta.env.DEV) {
        console.log(`[Projectile] ${this.projectileId} off screen at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
      }
      this.deactivate();
    }
  }

  private updateHoming(_delta: number): void {
    if (!this.homingTarget || !this.config) return;

    const target = this.homingTarget as Phaser.GameObjects.Sprite;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);

    // Gradually rotate toward target
    const currentAngle = Math.atan2(this.body?.velocity.y || 0, this.body?.velocity.x || 0);
    const angleDiff = Phaser.Math.Angle.Wrap(angle - currentAngle);
    const turnAmount = angleDiff * this.homingStrength;

    const newAngle = currentAngle + turnAmount;
    const speed = this.config.speed;

    this.setVelocity(
      Math.cos(newAngle) * speed,
      Math.sin(newAngle) * speed
    );

    // Rotate sprite to match direction
    this.setRotation(newAngle);
  }

  /**
   * Play hit effect (called by CombatSystem)
   */
  public playHitEffect(): void {
    if (this.config?.aoeRadius && this.config.aoeRadius > 0) {
      this.playAoEEffect();
    } else {
      this.playImpactEffect();
    }
  }

  private playImpactEffect(): void {
    // Create a small flash at impact point
    const flash = this.scene.add.circle(this.x, this.y, 10, 0xffffff, 1);
    this.scene.tweens.add({
      targets: flash,
      scale: 0,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy(),
    });
  }

  private playAoEEffect(): void {
    const radius = this.config?.aoeRadius || 50;

    // Create expanding circle for AOE
    const circle = this.scene.add.circle(this.x, this.y, 5, 0xff8800, 0.5);
    this.scene.tweens.add({
      targets: circle,
      radius: radius,
      alpha: 0,
      duration: 200,
      onComplete: () => circle.destroy(),
    });
  }
}
