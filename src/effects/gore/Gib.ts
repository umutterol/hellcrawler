/**
 * Gib - Poolable gore piece with fake ragdoll physics
 * Uses tweens for parabolic motion and rotation
 */

import Phaser from 'phaser';
import { GibType } from './GoreTypes';
import {
  GORE_PHYSICS,
  GORE_TIMING,
  GORE_DEPTH,
} from './GoreConfig';

export class Gib extends Phaser.GameObjects.Sprite {
  /** Whether this gib is currently active in the scene */
  private isActive: boolean = false;

  /** Current horizontal velocity */
  private velocityX: number = 0;

  /** Current vertical velocity */
  private velocityY: number = 0;

  /** Angular velocity in degrees per second */
  private angularVelocity: number = 0;

  /** Number of bounces so far */
  private bounceCount: number = 0;

  /** Whether the gib has settled on the ground */
  private hasSettled: boolean = false;

  /** Time when gib settled (for persist timing) */
  private settledTime: number = 0;

  /** Time elapsed since spawn in seconds */
  private elapsedTime: number = 0;

  /** Reference to the scene */
  declare scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    // Create with a placeholder texture - will be set on activate
    super(scene, 0, 0, 'gib-torso1');

    this.setDepth(GORE_DEPTH.GIB);
    this.setActive(false);
    this.setVisible(false);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Activate this gib with the given configuration
   */
  activate(
    x: number,
    y: number,
    type: GibType,
    velocityX: number,
    velocityY: number,
    angularVelocity: number,
    scale: number,
    tint?: number
  ): void {
    this.setPosition(x, y);
    this.setTexture(type);
    this.setScale(scale);
    this.setAlpha(1);
    this.setAngle(Phaser.Math.Between(0, 360));

    if (tint !== undefined) {
      this.setTint(tint);
    } else {
      this.clearTint();
    }

    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.angularVelocity = angularVelocity;
    this.elapsedTime = 0;
    this.bounceCount = 0;
    this.hasSettled = false;
    this.settledTime = 0;

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
    this.clearTint();

    // Stop any running tweens
    this.scene.tweens.killTweensOf(this);
  }

  /**
   * Check if this gib is currently active
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

    if (!this.hasSettled) {
      // Update elapsed time
      this.elapsedTime += deltaSeconds;

      // Calculate position using kinematic equations
      // x = x0 + vx * t
      this.x += this.velocityX * deltaSeconds;

      // y = y0 + vy0 * t + 0.5 * g * t^2
      // But we need incremental updates, so we update velocity and position
      this.velocityY += GORE_PHYSICS.GRAVITY * deltaSeconds;
      this.y += this.velocityY * deltaSeconds;

      // Rotate based on angular velocity
      this.angle += this.angularVelocity * deltaSeconds;

      // Check for ground collision
      if (this.y >= GORE_PHYSICS.GROUND_Y) {
        this.y = GORE_PHYSICS.GROUND_Y;

        if (
          Math.abs(this.velocityY) > GORE_PHYSICS.MIN_BOUNCE_VELOCITY &&
          this.bounceCount < GORE_PHYSICS.MAX_BOUNCES
        ) {
          // Bounce
          this.bounceCount++;
          this.velocityY = -this.velocityY * GORE_PHYSICS.BOUNCE_DAMPING;
          this.velocityX *= GORE_PHYSICS.BOUNCE_DAMPING;
          this.angularVelocity *= GORE_PHYSICS.ANGULAR_DAMPING;
        } else {
          // Settle
          this.settle();
        }
      }
    } else {
      // Gib has settled - check if it's time to fade
      const timeSinceSettled = this.scene.time.now - this.settledTime;

      if (timeSinceSettled >= GORE_TIMING.GIB_PERSIST_DURATION) {
        // Start fading if not already
        if (this.alpha === 1) {
          this.startFadeOut();
        }
      }
    }
  }

  /**
   * Called when gib settles on the ground
   */
  private settle(): void {
    this.hasSettled = true;
    this.settledTime = this.scene.time.now;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angularVelocity = 0;
  }

  /**
   * Start the fade out animation
   */
  private startFadeOut(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: GORE_TIMING.GIB_FADE_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.deactivate();
      },
    });
  }

  /**
   * Force immediate deactivation (for cleanup)
   */
  forceDeactivate(): void {
    this.scene.tweens.killTweensOf(this);
    this.deactivate();
  }
}
