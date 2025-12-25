import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill } from '../types/ModuleTypes';
import { ProjectileType } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';

/**
 * MachineGunModule - Rapid-fire projectile weapon
 *
 * Fires a stream of bullets at a high rate.
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

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotLevel: number
  ) {
    super(scene, moduleData, slotIndex, slotLevel);

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

    // Calculate direction to target
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);

    // Add small random spread for machine gun feel
    const spread = Phaser.Math.FloatBetween(-0.05, 0.05);
    const finalAngle = angle + spread;

    // Spawn position (offset from tank)
    const spawnX = this.x + 40;
    const spawnY = this.y;

    // Configure and activate projectile
    const speed = 600;
    projectile.activate(spawnX, spawnY, {
      type: ProjectileType.Bullet,
      damage,
      speed,
      isCrit,
      lifetime: 2000,
    });

    // Set velocity based on angle
    projectile.setVelocity(
      Math.cos(finalAngle) * speed,
      Math.sin(finalAngle) * speed
    );

    this.lastFireTime = currentTime;
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

    // Find enemies in a cone in front of the tank
    const coneAngle = Math.PI / 4; // 45 degrees
    const coneRange = 600;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist > coneRange) continue;

      // Check if enemy is in the cone (to the right of tank)
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
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
    // Create cone effect visual
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffff00, 0.3);

    // Draw cone shape
    const coneLength = 400;
    const coneWidth = 200;

    graphics.beginPath();
    graphics.moveTo(this.x + 40, this.y);
    graphics.lineTo(this.x + coneLength, this.y - coneWidth / 2);
    graphics.lineTo(this.x + coneLength, this.y + coneWidth / 2);
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
