import Phaser from 'phaser';
import { ModuleType } from '../types/ModuleTypes';
import { GAME_CONFIG, SlotDirection } from '../config/GameConfig';
import { Enemy } from './Enemy';

/**
 * Configuration for module sprite visual effects
 */
export interface ModuleSpriteConfig {
  /** Module type for texture selection */
  type: ModuleType;
  /** Slot index (0-4) for positioning and direction */
  slotIndex: number;
  /** Tank container to attach to */
  tankContainer: Phaser.GameObjects.Container;
}

/**
 * ModuleSprite - Visual representation of an equipped module
 *
 * Features:
 * - Mounted on tank at slot-specific position
 * - Idle wobble/breathing animation
 * - Target tracking rotation (rotates toward nearest enemy)
 * - Fire recoil animation
 * - Provides projectile spawn position
 *
 * Note: This is purely visual - damage/firing logic remains in BaseModule
 */
export class ModuleSprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private slotIndex: number;
  private moduleType: ModuleType;
  private slotDirection: SlotDirection;

  // Animation state
  private idleWobbleTween: Phaser.Tweens.Tween | null = null;
  private recoilTween: Phaser.Tweens.Tween | null = null;
  private currentTarget: Enemy | null = null;
  private baseAngle: number = 0; // Base angle based on slot direction

  // Position offset from tank center (Y used for wobble reset)
  private slotOffsetY: number;

  // Visual configuration
  private static readonly WOBBLE_INTENSITY = 0.015; // Radians (about 1 degree)
  private static readonly WOBBLE_DURATION = 1500; // ms for one wobble cycle
  private static readonly RECOIL_DISTANCE = 4; // Pixels to kick back
  private static readonly RECOIL_DURATION = 80; // ms for recoil
  private static readonly RECOIL_RECOVERY = 120; // ms to return
  private static readonly ROTATION_SPEED = 0.1; // Lerp factor for smooth rotation
  private static readonly MAX_ROTATION_ANGLE = Math.PI / 4; // 45 degrees from base

  constructor(scene: Phaser.Scene, config: ModuleSpriteConfig) {
    // Position at slot offset
    const slotPos = GAME_CONFIG.MODULE_SLOT_POSITIONS[config.slotIndex];
    super(scene, slotPos?.x ?? 0, slotPos?.y ?? 0);

    this.slotIndex = config.slotIndex;
    this.moduleType = config.type;
    this.slotOffsetY = slotPos?.y ?? 0;
    this.slotDirection = GAME_CONFIG.SLOT_DIRECTIONS[config.slotIndex] ?? SlotDirection.Right;

    // Set base angle based on slot direction
    this.baseAngle = this.getBaseAngleForDirection();

    // Create the module sprite
    this.sprite = this.createSprite();
    this.add(this.sprite);

    // Add to tank container
    config.tankContainer.add(this);

    // Set depth above tank body
    this.setDepth(GAME_CONFIG.DEPTH.TANK + 10 + config.slotIndex);

    // Start idle wobble animation
    this.startIdleWobble();
  }

  /**
   * Get base angle based on slot direction
   */
  private getBaseAngleForDirection(): number {
    switch (this.slotDirection) {
      case SlotDirection.Right:
        return 0; // Point right
      case SlotDirection.Left:
        return Math.PI; // Point left
      case SlotDirection.Both:
        return 0; // Default to right, will track closest
      default:
        return 0;
    }
  }

  /**
   * Create the module sprite based on type
   */
  private createSprite(): Phaser.GameObjects.Sprite {
    const textureKey = this.getTextureKey();
    const sprite = this.scene.add.sprite(0, 0, textureKey);

    // Set origin to barrel base for proper rotation
    sprite.setOrigin(0.3, 0.5);

    // Scale based on module type
    const scale = this.getScaleForType();
    sprite.setScale(scale);

    // Set initial rotation
    sprite.setRotation(this.baseAngle);

    return sprite;
  }

  /**
   * Get texture key for module type
   */
  private getTextureKey(): string {
    switch (this.moduleType) {
      case ModuleType.MachineGun:
        return 'module-machinegun';
      case ModuleType.MissilePod:
        return 'module-missile';
      case ModuleType.RepairDrone:
        return 'module-repair';
      default:
        return 'module-placeholder';
    }
  }

  /**
   * Get scale based on module type
   */
  private getScaleForType(): number {
    switch (this.moduleType) {
      case ModuleType.MachineGun:
        return 2;
      case ModuleType.MissilePod:
        return 2.2;
      case ModuleType.RepairDrone:
        return 1.8;
      default:
        return 2;
    }
  }

  /**
   * Start idle wobble/breathing animation
   */
  private startIdleWobble(): void {
    // Stop existing wobble if any
    if (this.idleWobbleTween) {
      this.idleWobbleTween.stop();
    }

    // Create subtle up/down wobble
    this.idleWobbleTween = this.scene.tweens.add({
      targets: this,
      y: this.slotOffsetY - 1.5, // Slight up movement
      duration: ModuleSprite.WOBBLE_DURATION / 2,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Also add subtle rotation wobble to sprite
    this.scene.tweens.add({
      targets: this.sprite,
      rotation: this.sprite.rotation + ModuleSprite.WOBBLE_INTENSITY,
      duration: ModuleSprite.WOBBLE_DURATION / 2,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: ModuleSprite.WOBBLE_DURATION / 4, // Offset from position wobble
    });
  }

  /**
   * Update target tracking rotation
   * Called each frame with list of valid targets
   */
  public updateTargetTracking(enemies: Enemy[]): void {
    // Find closest enemy
    const closest = this.findClosestEnemy(enemies);
    this.currentTarget = closest;

    if (!closest) {
      // Return to base angle when no targets
      this.rotateToAngle(this.baseAngle);
      return;
    }

    // Calculate angle to target
    const worldPos = this.getWorldPosition();
    const targetAngle = Phaser.Math.Angle.Between(
      worldPos.x,
      worldPos.y,
      closest.x,
      closest.y
    );

    // Clamp rotation within limits of base angle
    const clampedAngle = this.clampRotation(targetAngle);
    this.rotateToAngle(clampedAngle);
  }

  /**
   * Smoothly rotate sprite to target angle
   */
  private rotateToAngle(targetAngle: number): void {
    const currentAngle = this.sprite.rotation;

    // Use lerp for smooth rotation
    const newAngle = Phaser.Math.Angle.RotateTo(
      currentAngle,
      targetAngle,
      ModuleSprite.ROTATION_SPEED
    );

    this.sprite.setRotation(newAngle);
  }

  /**
   * Clamp rotation angle within allowed range from base angle
   */
  private clampRotation(angle: number): number {
    const diff = Phaser.Math.Angle.Wrap(angle - this.baseAngle);
    const clamped = Phaser.Math.Clamp(
      diff,
      -ModuleSprite.MAX_ROTATION_ANGLE,
      ModuleSprite.MAX_ROTATION_ANGLE
    );
    return this.baseAngle + clamped;
  }

  /**
   * Find closest enemy in valid direction
   */
  private findClosestEnemy(enemies: Enemy[]): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = Infinity;
    const worldPos = this.getWorldPosition();

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      // For "Both" direction, accept any enemy
      // For Left/Right, only accept enemies on that side
      if (this.slotDirection !== SlotDirection.Both) {
        const spawnSide = enemy.getSpawnSide();
        if (this.slotDirection === SlotDirection.Right && spawnSide !== 'right') continue;
        if (this.slotDirection === SlotDirection.Left && spawnSide !== 'left') continue;
      }

      const dist = Phaser.Math.Distance.Between(worldPos.x, worldPos.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * Play fire recoil animation
   * Called by module when firing
   */
  public playRecoil(): void {
    // Don't stack recoils
    if (this.recoilTween && this.recoilTween.isPlaying()) {
      return;
    }

    // Calculate recoil direction (opposite of facing)
    const recoilAngle = this.sprite.rotation + Math.PI;
    const recoilX = Math.cos(recoilAngle) * ModuleSprite.RECOIL_DISTANCE;
    const recoilY = Math.sin(recoilAngle) * ModuleSprite.RECOIL_DISTANCE;

    // Store original position within container
    const originalX = 0;
    const originalY = 0;

    // Animate sprite back then return
    this.recoilTween = this.scene.tweens.add({
      targets: this.sprite,
      x: recoilX,
      y: recoilY,
      duration: ModuleSprite.RECOIL_DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Return to original position
        this.scene.tweens.add({
          targets: this.sprite,
          x: originalX,
          y: originalY,
          duration: ModuleSprite.RECOIL_RECOVERY,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  /**
   * Get world position of the module (for projectile spawning)
   */
  public getWorldPosition(): { x: number; y: number } {
    // Get transform matrix for container
    const matrix = this.getWorldTransformMatrix();
    const point = matrix.transformPoint(0, 0);
    return { x: point.x, y: point.y };
  }

  /**
   * Get the barrel tip position for projectile spawning
   * Accounts for sprite rotation
   */
  public getFirePosition(): { x: number; y: number } {
    const worldPos = this.getWorldPosition();

    // Barrel tip offset from center (in local space)
    const barrelLength = 16 * this.sprite.scaleX; // Approximate barrel length

    // Transform barrel tip to world space using current rotation
    const angle = this.sprite.rotation;
    const tipX = worldPos.x + Math.cos(angle) * barrelLength;
    const tipY = worldPos.y + Math.sin(angle) * barrelLength;

    return { x: tipX, y: tipY };
  }

  /**
   * Get current target enemy (if any)
   */
  public getCurrentTarget(): Enemy | null {
    return this.currentTarget;
  }

  /**
   * Get the current rotation angle
   */
  public getRotation(): number {
    return this.sprite.rotation;
  }

  /**
   * Get slot index
   */
  public getSlotIndex(): number {
    return this.slotIndex;
  }

  /**
   * Get module type
   */
  public getModuleType(): ModuleType {
    return this.moduleType;
  }

  /**
   * Update module sprite (called from ModuleManager)
   */
  public update(_time: number, _delta: number, enemies: Enemy[]): void {
    this.updateTargetTracking(enemies);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.idleWobbleTween) {
      this.idleWobbleTween.stop();
    }
    if (this.recoilTween) {
      this.recoilTween.stop();
    }
    super.destroy();
  }
}
