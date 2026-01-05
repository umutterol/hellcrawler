import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { ProjectileType } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * MachineGunModule - Rapid-fire projectile weapon
 *
 * Cinematic Effects (per GDD 4.6):
 * - Launch: Muzzle flash, shell casings ejection
 * - Travel: Tracer effect (handled in Projectile)
 * - Impact: Spark burst, dust puff (handled in Projectile)
 *
 * Skills:
 * 1. Overdrive: +50% fire rate for 5 seconds
 * 2. Suppressing Fire: Slow enemies in cone by 30% for 4 seconds
 */
export class MachineGunModule extends BaseModule {
  // Overdrive state
  private overdriveActive: boolean = false;
  private overdriveMultiplier: number = 1.5;

  // Suppressing Fire state
  private suppressingFireActive: boolean = false;
  private slowedEnemies: Set<Enemy> = new Set();
  private slowAmount: number = 0.3; // 30% slow

  // Muzzle flash configuration
  private static readonly MUZZLE_FLASH_COLORS = [0xffff00, 0xffaa00, 0xffffff];
  private static readonly SHELL_CASING_SPEED = 80;

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    // Machine gun specific settings
    this.baseFireRate = 200; // Very fast fire rate (5 shots per second)
    this.baseDamage = 8; // Lower damage per shot
  }

  /**
   * Get the fire rate with Overdrive bonus if active
   */
  protected getFireRate(): number {
    const baseRate = super.getFireRate();
    if (this.overdriveActive) {
      return baseRate / this.overdriveMultiplier;
    }
    return baseRate;
  }

  /**
   * Fire bullets at enemies
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    // Store enemies reference for auto-mode skill triggers
    this.updateEnemiesReference(enemies);

    if (!this.canFire(currentTime) || enemies.length === 0) {
      return;
    }

    // Find closest enemy to target
    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    // Get projectile from pool
    const projectile = this.getProjectile();
    if (!projectile) return;

    // Calculate damage
    const { damage, isCrit } = this.calculateDamage();

    // Get firing position from slot configuration
    const firePos = this.getFirePosition();

    // Calculate direction to target
    const angle = Phaser.Math.Angle.Between(firePos.x, firePos.y, target.x, target.y);

    // Add tiny random spread for machine gun feel (±1.5 degrees)
    const spread = Phaser.Math.FloatBetween(-0.025, 0.025);
    const finalAngle = angle + spread;

    // Configure and activate projectile
    const speed = 600;
    projectile.activate(firePos.x, firePos.y, {
      type: ProjectileType.Bullet,
      damage,
      speed,
      isCrit,
      lifetime: 2000,
    });

    // Set velocity based on angle - this MUST come after activate()
    const velX = Math.cos(finalAngle) * speed;
    const velY = Math.sin(finalAngle) * speed;
    projectile.setVelocity(velX, velY);

    // Cinematic effects: muzzle flash + shell casing
    this.createMuzzleFlash(firePos.x, firePos.y, finalAngle);
    this.ejectShellCasing(firePos.x, firePos.y, finalAngle);

    if (import.meta.env.DEV) {
      console.log(`[MachineGun] Fire: pos=(${firePos.x.toFixed(0)}, ${firePos.y.toFixed(0)}), target=(${target.x.toFixed(0)}, ${target.y.toFixed(0)}), vel=(${velX.toFixed(0)}, ${velY.toFixed(0)})`);
    }

    this.lastFireTime = currentTime;
  }

  /**
   * Create muzzle flash effect at firing position
   * Bright flash with multiple layers for depth
   */
  private createMuzzleFlash(x: number, y: number, angle: number): void {
    // Offset flash slightly forward in firing direction
    const flashOffsetX = Math.cos(angle) * 8;
    const flashOffsetY = Math.sin(angle) * 8;
    const flashX = x + flashOffsetX;
    const flashY = y + flashOffsetY;

    // Primary flash - bright white/yellow core
    const coreColor = MachineGunModule.MUZZLE_FLASH_COLORS[
      Math.floor(Math.random() * MachineGunModule.MUZZLE_FLASH_COLORS.length)
    ]!;
    const core = this.scene.add.circle(flashX, flashY, 6, coreColor, 1);
    core.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    // Random scale variation for more dynamic feel
    const randomScale = 0.8 + Math.random() * 0.4;

    this.scene.tweens.add({
      targets: core,
      scale: randomScale * 1.5,
      alpha: 0,
      duration: 50,
      ease: 'Quad.easeOut',
      onComplete: () => core.destroy(),
    });

    // Secondary flash - orange outer glow
    const glow = this.scene.add.circle(flashX, flashY, 10, 0xff6600, 0.6);
    glow.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 1);

    this.scene.tweens.add({
      targets: glow,
      scale: randomScale * 1.8,
      alpha: 0,
      duration: 60,
      ease: 'Quad.easeOut',
      onComplete: () => glow.destroy(),
    });

    // Occasional spark (every few shots)
    if (Math.random() < 0.3) {
      const sparkAngle = angle + Phaser.Math.FloatBetween(-0.5, 0.5);
      const sparkDist = 12 + Math.random() * 8;
      const spark = this.scene.add.circle(flashX, flashY, 2, 0xffffff, 0.9);
      spark.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

      this.scene.tweens.add({
        targets: spark,
        x: flashX + Math.cos(sparkAngle) * sparkDist,
        y: flashY + Math.sin(sparkAngle) * sparkDist,
        scale: 0,
        alpha: 0,
        duration: 80,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /**
   * Eject shell casing from firing position
   * Casing flies perpendicular to firing direction and falls
   */
  private ejectShellCasing(x: number, y: number, firingAngle: number): void {
    // Casing ejects perpendicular to firing direction (90 degrees)
    // Add some randomness for variety
    const ejectAngle = firingAngle + Math.PI / 2 + Phaser.Math.FloatBetween(-0.3, 0.3);

    // Offset casing spawn slightly back from muzzle
    const offsetX = -Math.cos(firingAngle) * 5;
    const offsetY = -Math.sin(firingAngle) * 5;
    const casingX = x + offsetX;
    const casingY = y + offsetY;

    // Create casing as small golden rectangle
    const casing = this.scene.add.rectangle(casingX, casingY, 4, 2, 0xccaa00);
    casing.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 2);
    casing.setRotation(firingAngle);

    // Initial velocities
    const ejectSpeed = MachineGunModule.SHELL_CASING_SPEED * (0.8 + Math.random() * 0.4);
    const velX = Math.cos(ejectAngle) * ejectSpeed;
    const velY = Math.sin(ejectAngle) * ejectSpeed;
    const gravity = 300;
    const rotationSpeed = Phaser.Math.FloatBetween(-15, 15);

    // Animate casing with physics-like motion
    let currentVelY = velY;
    let elapsed = 0;
    const duration = 400;

    const updateCasing = this.scene.time.addEvent({
      delay: 16,
      repeat: Math.floor(duration / 16),
      callback: () => {
        elapsed += 16;
        currentVelY += gravity * 0.016; // Apply gravity

        casing.x += velX * 0.016;
        casing.y += currentVelY * 0.016;
        casing.rotation += rotationSpeed * 0.016;

        // Fade out in last 100ms
        if (elapsed > duration - 100) {
          casing.alpha = Math.max(0, (duration - elapsed) / 100);
        }

        if (elapsed >= duration) {
          casing.destroy();
          updateCasing.destroy();
        }
      },
    });
  }

  /**
   * Handle skill activation
   */
  protected onSkillActivate(skill: ModuleSkill, enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Overdrive':
        this.activateOverdrive();
        break;
      case 'Suppressing Fire':
        this.activateSuppressingFire(enemies);
        break;
    }
  }

  /**
   * Handle skill end
   */
  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Overdrive':
        this.deactivateOverdrive();
        break;
      case 'Suppressing Fire':
        this.deactivateSuppressingFire();
        break;
    }
  }

  /**
   * Overdrive: +50% fire rate for 5 seconds
   */
  private activateOverdrive(): void {
    this.overdriveActive = true;

    // Visual feedback - could add particle effect here
    if (import.meta.env.DEV) {
      console.log('[MachineGun] Overdrive activated!');
    }
  }

  private deactivateOverdrive(): void {
    this.overdriveActive = false;

    if (import.meta.env.DEV) {
      console.log('[MachineGun] Overdrive ended');
    }
  }

  /**
   * Suppressing Fire: Slow enemies in cone by 30% for 4 seconds
   */
  private activateSuppressingFire(enemies: Enemy[]): void {
    this.suppressingFireActive = true;

    // Get firing position from slot configuration
    const firePos = this.getFirePosition();

    // Find enemies in a cone in front of the tank
    const coneAngle = Math.PI / 4; // 45 degrees
    const coneRange = 600;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      const dist = Phaser.Math.Distance.Between(firePos.x, firePos.y, enemy.x, enemy.y);
      if (dist > coneRange) continue;

      // Check if enemy is in the cone (to the right of tank)
      const angle = Phaser.Math.Angle.Between(firePos.x, firePos.y, enemy.x, enemy.y);
      if (Math.abs(angle) <= coneAngle) {
        // Apply slow effect
        this.applySlowToEnemy(enemy);
        this.slowedEnemies.add(enemy);
      }
    }

    // Visual feedback - muzzle flash effect
    this.createSuppressingFireEffect();

    if (import.meta.env.DEV) {
      console.log(`[MachineGun] Suppressing Fire hit ${this.slowedEnemies.size} enemies`);
    }
  }

  private deactivateSuppressingFire(): void {
    this.suppressingFireActive = false;

    // Remove slow from all affected enemies
    for (const enemy of this.slowedEnemies) {
      if (enemy.isAlive()) {
        this.removeSlowFromEnemy(enemy);
      }
    }
    this.slowedEnemies.clear();

    if (import.meta.env.DEV) {
      console.log('[MachineGun] Suppressing Fire ended');
    }
  }

  private applySlowToEnemy(enemy: Enemy): void {
    // Apply slow by modifying enemy's velocity
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    if (body) {
      const currentVelX = body.velocity.x;
      body.setVelocityX(currentVelX * (1 - this.slowAmount));
    }
  }

  private removeSlowFromEnemy(enemy: Enemy): void {
    // Restore normal speed
    const config = enemy.getConfig();
    if (config) {
      enemy.setVelocityX(-config.speed);
    }
  }

  private createSuppressingFireEffect(): void {
    // Get firing position from slot configuration
    const firePos = this.getFirePosition();

    // Create cone effect visual
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffff00, 0.3);

    // Draw cone shape
    const coneLength = 400;
    const coneWidth = 200;

    graphics.beginPath();
    graphics.moveTo(firePos.x, firePos.y);
    graphics.lineTo(firePos.x + coneLength, firePos.y - coneWidth / 2);
    graphics.lineTo(firePos.x + coneLength, firePos.y + coneWidth / 2);
    graphics.closePath();
    graphics.fill();

    // Fade out and destroy
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 500,
      onComplete: () => graphics.destroy(),
    });
  }

  /**
   * Update - also update slowed enemies
   */
  public update(time: number, delta: number): void {
    super.update(time, delta);

    // Keep slowed enemies at reduced speed while suppressing fire is active
    if (this.suppressingFireActive) {
      for (const enemy of this.slowedEnemies) {
        if (!enemy.isAlive()) {
          this.slowedEnemies.delete(enemy);
          continue;
        }
        // Maintain the slow
        this.applySlowToEnemy(enemy);
      }
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // Remove slow from all enemies
    for (const enemy of this.slowedEnemies) {
      if (enemy.isAlive()) {
        this.removeSlowFromEnemy(enemy);
      }
    }
    this.slowedEnemies.clear();
    super.destroy();
  }
}
