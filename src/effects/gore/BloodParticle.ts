/**
 * BloodParticle - Poolable blood droplet with gravity-affected motion
 * Creates ground splatters on impact
 */

import Phaser from 'phaser';
import {
  GORE_PHYSICS,
  GORE_TIMING,
  GORE_DEPTH,
  BLOOD_PARTICLE,
} from './GoreConfig';

/** Callback type for when blood hits ground and should create splatter */
export type SplatterCallback = (x: number, y: number) => void;

export class BloodParticle extends Phaser.GameObjects.Ellipse {
  /** Whether this particle is currently active */
  private isActive: boolean = false;

  /** Current horizontal velocity */
  private velocityX: number = 0;

  /** Current vertical velocity */
  private velocityY: number = 0;

  /** Whether this particle should create a splatter on ground hit */
  private createSplatter: boolean = false;

  /** Callback to invoke when creating a splatter */
  private splatterCallback: SplatterCallback | null = null;

  /** Time when particle was spawned */
  private spawnTime: number = 0;

  /** Reference to the scene */
  declare scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    super(
      scene,
      0,
      0,
      BLOOD_PARTICLE.WIDTH,
      BLOOD_PARTICLE.HEIGHT,
      BLOOD_PARTICLE.COLOR
    );

    this.setDepth(GORE_DEPTH.BLOOD);
    this.setActive(false);
    this.setVisible(false);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Activate this blood particle
   */
  activate(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    scale: number,
    createSplatter: boolean,
    splatterCallback: SplatterCallback | null
  ): void {
    this.setPosition(x, y);
    this.setScale(scale);
    this.setAlpha(1);

    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.createSplatter = createSplatter;
    this.splatterCallback = splatterCallback;
    this.spawnTime = this.scene.time.now;

    this.setActive(true);
    this.setVisible(true);
    this.isActive = true;
  }

  /**
   * Deactivate and return to pool
   */
  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.isActive = false;
    this.splatterCallback = null;
  }

  /**
   * Check if this particle is currently active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Update physics simulation
   * Called every frame by GoreManager
   */
  updatePhysics(delta: number): void {
    if (!this.isActive) return;

    const deltaSeconds = delta / 1000;

    // Check lifetime
    const age = this.scene.time.now - this.spawnTime;
    if (age >= GORE_TIMING.BLOOD_PARTICLE_LIFETIME) {
      this.deactivate();
      return;
    }

    // Apply gravity
    this.velocityY += GORE_PHYSICS.GRAVITY * deltaSeconds;

    // Update position
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;

    // Check for ground collision
    if (this.y >= GORE_PHYSICS.GROUND_Y) {
      this.y = GORE_PHYSICS.GROUND_Y;

      // Create splatter if configured and callback exists
      if (this.createSplatter && this.splatterCallback) {
        this.splatterCallback(this.x, this.y);
      }

      // Deactivate on ground hit
      this.deactivate();
    }

    // Fade out based on age
    const lifetimeRatio = age / GORE_TIMING.BLOOD_PARTICLE_LIFETIME;
    if (lifetimeRatio > 0.7) {
      // Start fading in last 30% of lifetime
      this.setAlpha(1 - (lifetimeRatio - 0.7) / 0.3);
    }
  }

  /**
   * Force immediate deactivation (for cleanup)
   */
  forceDeactivate(): void {
    this.deactivate();
  }
}
