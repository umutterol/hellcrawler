import Phaser from 'phaser';
import { IPoolable } from '../managers/PoolManager';
import { GAME_CONFIG } from '../config/GameConfig';
import { Enemy } from './Enemy';

/**
 * Configuration for spawning an arcing missile
 */
export interface ArcingMissileConfig {
  damage: number;
  isCrit: boolean;
  targetX: number;
  targetY: number;
  arcHeight: number;      // How high the arc peaks (100-150px typical)
  travelDuration: number; // ms to reach target
  aoeRadius: number;
  enemies: Enemy[];       // Reference to current enemies for AoE damage
}

/**
 * ArcingMissile - Missile with cinematic parabolic trajectory
 *
 * Features:
 * - Vertical launch phase
 * - Smooth parabolic arc to target
 * - Persistent smoke trail
 * - Tween-based movement (not physics)
 * - Rotation follows trajectory
 *
 * Based on GDD Section 4.6 Missile Pod Behavior:
 * ```
 *                   ↑ Peak (100-150px above launch)
 *                  / \
 *                 /   \
 *   [Module] → ↗       ↘ → [Enemy]
 *          Launch      Dive
 * ```
 */
export class ArcingMissile extends Phaser.GameObjects.Container implements IPoolable {
  private sprite: Phaser.GameObjects.Sprite;

  private config: ArcingMissileConfig | null = null;
  private missileId: string = '';

  // Trajectory state
  private startX: number = 0;
  private startY: number = 0;
  private progress: number = 0;
  private isFlying: boolean = false;
  private trajectoryTween: Phaser.Tweens.Tween | null = null;

  // Smoke trail timing
  private lastSmokeTime: number = 0;
  private readonly SMOKE_INTERVAL = 30; // ms between smoke puffs

  // ID counter
  private static idCounter: number = 0;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    super(scene, x, y);

    // Add to scene
    scene.add.existing(this);

    // Create missile sprite (shot-03 rocket sprite is 34x10px)
    this.sprite = scene.add.sprite(0, 0, 'missile-1');
    this.sprite.setScale(2.0);
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);

    // Set depth
    this.setDepth(GAME_CONFIG.DEPTH.PROJECTILES);

    // Initial state - inactive
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * Activate this missile from the pool
   */
  public activate(x: number, y: number, config: ArcingMissileConfig): void {
    this.config = config;
    this.missileId = `arc_missile_${++ArcingMissile.idCounter}`;

    // Store start position
    this.startX = x;
    this.startY = y;
    this.setPosition(x, y);

    // Reset state
    this.progress = 0;
    this.isFlying = true;
    this.lastSmokeTime = 0;

    // Make visible and active
    this.setActive(true);
    this.setVisible(true);

    // Initial rotation (pointing up for launch)
    this.sprite.setRotation(-Math.PI / 2);

    // Crit visual - slight scale boost
    if (config.isCrit) {
      this.sprite.setScale(2.5);
      this.sprite.setTint(0xffaa00);
    } else {
      this.sprite.setScale(2.0);
      this.sprite.clearTint();
    }

    // Create launch smoke puff
    this.createLaunchSmoke(x, y);

    // Start the trajectory tween
    this.startTrajectory();

    if (import.meta.env.DEV) {
      console.log(`[ArcingMissile] Activated ${this.missileId} at (${x}, ${y}) → (${config.targetX}, ${config.targetY})`);
    }
  }

  /**
   * Deactivate this missile and return to pool
   */
  public deactivate(): void {
    this.isFlying = false;

    // Stop trajectory tween
    if (this.trajectoryTween) {
      this.trajectoryTween.stop();
      this.trajectoryTween = null;
    }

    this.setActive(false);
    this.setVisible(false);
    this.config = null;
  }

  /**
   * Create launch smoke puff at start position
   */
  private createLaunchSmoke(x: number, y: number): void {
    // Multiple smoke puffs for a dramatic launch
    for (let i = 0; i < 5; i++) {
      const offsetX = Phaser.Math.FloatBetween(-10, 10);
      const offsetY = Phaser.Math.FloatBetween(-5, 10);
      const size = Phaser.Math.FloatBetween(6, 12);
      const delay = i * 30;

      this.scene.time.delayedCall(delay, () => {
        const puff = this.scene.add.circle(x + offsetX, y + offsetY, size, 0x888888, 0.7);
        puff.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 1);

        this.scene.tweens.add({
          targets: puff,
          scale: 2.5,
          alpha: 0,
          y: puff.y + 15,
          duration: 400,
          ease: 'Quad.easeOut',
          onComplete: () => puff.destroy(),
        });
      });
    }
  }

  /**
   * Spawn a smoke puff at current position
   */
  private spawnSmokePuff(): void {
    const puff = this.scene.add.circle(this.x, this.y, 4, 0x666666, 0.5);
    puff.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 2);

    this.scene.tweens.add({
      targets: puff,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => puff.destroy(),
    });
  }

  /**
   * Start the parabolic trajectory animation
   */
  private startTrajectory(): void {
    if (!this.config) return;

    // Create tween that updates progress from 0 to 1
    this.trajectoryTween = this.scene.tweens.add({
      targets: this,
      progress: 1,
      duration: this.config.travelDuration,
      ease: 'Linear',
      onUpdate: () => this.updatePosition(),
      onComplete: () => this.onReachTarget(),
    });
  }

  /**
   * Update position along parabolic trajectory
   */
  private updatePosition(): void {
    if (!this.config || !this.isFlying) return;

    const t = this.progress;
    const { targetX, targetY, arcHeight } = this.config;

    // Parabolic interpolation
    // x moves linearly from start to target
    const newX = Phaser.Math.Linear(this.startX, targetX, t);

    // y follows a parabola: peaks at t=0.3 (earlier peak for dramatic dive)
    // y = startY + (targetY - startY) * t - arcHeight * 4 * t * (1 - t)
    const peakT = 0.35; // Peak at 35% of journey
    const parabola = -4 * (t - peakT) * (t - peakT) + 4 * peakT * peakT;
    const baseY = Phaser.Math.Linear(this.startY, targetY, t);
    const newY = baseY - arcHeight * parabola / (4 * peakT * peakT);

    // Calculate rotation to follow trajectory
    const prevX = this.x;
    const prevY = this.y;
    const dx = newX - prevX;
    const dy = newY - prevY;
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      const angle = Math.atan2(dy, dx);
      this.sprite.setRotation(angle);
    }

    // Update position
    this.setPosition(newX, newY);
  }

  /**
   * Called when missile reaches target
   */
  private onReachTarget(): void {
    if (!this.config) return;

    // Deal AoE damage to enemies within radius
    this.dealAoEDamage();

    // Play impact effect
    this.playImpactEffect();

    // Deactivate
    this.deactivate();
  }

  /**
   * Deal damage to all enemies within AoE radius
   */
  private dealAoEDamage(): void {
    if (!this.config) return;

    const { enemies, damage, isCrit, aoeRadius } = this.config;
    let hitCount = 0;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) continue;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist <= aoeRadius) {
        // Deal damage to enemy (takeDamage emits DAMAGE_DEALT event internally)
        enemy.takeDamage(damage, isCrit);
        hitCount++;
      }
    }

    if (import.meta.env.DEV && hitCount > 0) {
      console.log(`[ArcingMissile] ${this.missileId} dealt ${damage} damage to ${hitCount} enemies (AoE radius ${aoeRadius})`);
    }
  }

  /**
   * Play AoE explosion effect at impact
   */
  private playImpactEffect(): void {
    if (!this.config) return;

    const radius = this.config.aoeRadius;
    const isCrit = this.config.isCrit;

    // Inner explosion flash (bright core)
    const core = this.scene.add.circle(this.x, this.y, 10, 0xffffff, 1);
    core.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets: core,
      scale: 2.5,
      alpha: 0,
      duration: 120,
      onComplete: () => core.destroy(),
    });

    // Fire ring (orange expanding)
    const fireRing = this.scene.add.circle(this.x, this.y, 8, 0xff6600, 0.9);
    fireRing.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 1);

    this.scene.tweens.add({
      targets: fireRing,
      scale: radius / 8,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => fireRing.destroy(),
    });

    // Shockwave ring
    const shockwave = this.scene.add.circle(this.x, this.y, 12, 0xff4400, 0);
    shockwave.setStrokeStyle(4, 0xff8800, 0.7);
    shockwave.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 2);

    this.scene.tweens.add({
      targets: shockwave,
      scale: (radius * 1.3) / 12,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => shockwave.destroy(),
    });

    // Debris particles
    const debrisCount = isCrit ? 10 : 6;
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * 0.4 + Math.random() * radius * 0.6;
      const size = 3 + Math.random() * 4;
      const color = Math.random() > 0.6 ? 0xff6600 : (Math.random() > 0.5 ? 0xffaa00 : 0x444444);

      const debris = this.scene.add.circle(this.x, this.y, size, color, 0.9);
      debris.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

      // Debris flies out and falls
      this.scene.tweens.add({
        targets: debris,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance - 20 + Math.random() * 40,
        scale: 0,
        alpha: 0,
        duration: 250 + Math.random() * 150,
        ease: 'Quad.easeOut',
        onComplete: () => debris.destroy(),
      });
    }
  }

  /**
   * Pre-update for smoke trail spawning
   */
  public preUpdate(time: number, _delta: number): void {
    if (!this.active || !this.isFlying) return;

    // Spawn smoke puffs at intervals
    if (time - this.lastSmokeTime >= this.SMOKE_INTERVAL) {
      this.spawnSmokePuff();
      this.lastSmokeTime = time;
    }
  }

  /**
   * Get missile damage
   */
  public getDamage(): number {
    return this.config?.damage || 0;
  }

  /**
   * Check if critical hit
   */
  public isCriticalHit(): boolean {
    return this.config?.isCrit || false;
  }

  /**
   * Get AoE radius
   */
  public getAoERadius(): number {
    return this.config?.aoeRadius || 0;
  }

  /**
   * Get target position
   */
  public getTargetPosition(): { x: number; y: number } {
    return {
      x: this.config?.targetX || 0,
      y: this.config?.targetY || 0,
    };
  }

  /**
   * Check if missile is currently flying
   */
  public isActive(): boolean {
    return this.isFlying;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.trajectoryTween) {
      this.trajectoryTween.stop();
    }
    super.destroy();
  }
}
