import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { ProjectileType } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';

/**
 * MissilePodModule - Launches homing missiles
 *
 * Fires missiles that track enemies. Slower fire rate but higher damage.
 *
 * Skills:
 * 1. Barrage: Fire 5 missiles in rapid succession
 * 2. Homing Swarm: All missiles gain perfect tracking for 8 seconds
 */
export class MissilePodModule extends BaseModule {
  // Homing Swarm state
  private homingSwarmActive: boolean = false;

  // Barrage state
  private barrageActive: boolean = false;
  private barrageMissilesRemaining: number = 0;
  private barrageNextFireTime: number = 0;
  private barrageFireInterval: number = 100; // ms between barrage missiles

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    // Missile pod specific settings
    this.baseFireRate = 1500; // Slower fire rate
    this.baseDamage = 35; // Higher damage per missile
  }

  /**
   * Fire missiles at enemies
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    // Store enemies reference for auto-mode skill triggers
    this.updateEnemiesReference(enemies);

    // Handle barrage firing
    if (this.barrageActive && this.barrageMissilesRemaining > 0) {
      if (currentTime >= this.barrageNextFireTime) {
        this.fireBarrageMissile(currentTime, enemies);
        this.barrageMissilesRemaining--;
        this.barrageNextFireTime = currentTime + this.barrageFireInterval;

        if (this.barrageMissilesRemaining <= 0) {
          this.barrageActive = false;
        }
      }
      return; // Don't fire normal missiles during barrage
    }

    // Normal firing
    if (!this.canFire(currentTime) || enemies.length === 0) {
      return;
    }

    this.fireMissile(currentTime, enemies);
    this.lastFireTime = currentTime;
  }

  /**
   * Fire a single missile
   */
  private fireMissile(_currentTime: number, enemies: Enemy[]): void {
    // Find target
    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    // Get projectile from pool
    const projectile = this.getProjectile();
    if (!projectile) return;

    // Calculate damage
    const { damage, isCrit } = this.calculateDamage();

    // Spawn position
    const spawnX = this.x + 30;
    const spawnY = this.y - 20; // Missiles come from top of tank

    // Configure missile
    const speed = 350;
    projectile.activate(spawnX, spawnY, {
      type: ProjectileType.Missile,
      damage,
      speed,
      isCrit,
      lifetime: 4000,
      homingTarget: this.homingSwarmActive ? target : target, // Always homing
      aoeRadius: 30, // Small AoE on impact
    });

    // Initial velocity toward target
    const angle = Phaser.Math.Angle.Between(spawnX, spawnY, target.x, target.y);
    projectile.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
  }

  /**
   * Fire a barrage missile (faster, no normal cooldown)
   */
  private fireBarrageMissile(_currentTime: number, enemies: Enemy[]): void {
    // Pick random enemy for variety
    const aliveEnemies = enemies.filter((e) => e.isAlive());
    if (aliveEnemies.length === 0) return;

    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]!;

    const projectile = this.getProjectile();
    if (!projectile) return;

    const { damage, isCrit } = this.calculateDamage();

    // Spawn with slight offset for visual variety
    const offsetY = Phaser.Math.Between(-30, 30);
    const spawnX = this.x + 30;
    const spawnY = this.y + offsetY;

    const speed = 400;
    projectile.activate(spawnX, spawnY, {
      type: ProjectileType.Missile,
      damage,
      speed,
      isCrit,
      lifetime: 4000,
      homingTarget: target,
      aoeRadius: 30,
    });

    const angle = Phaser.Math.Angle.Between(spawnX, spawnY, target.x, target.y);
    projectile.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Visual effect
    this.createMissileTrail(spawnX, spawnY);
  }

  /**
   * Handle skill activation
   */
  protected onSkillActivate(skill: ModuleSkill, _enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Barrage':
        this.activateBarrage();
        break;
      case 'Homing Swarm':
        this.activateHomingSwarm();
        break;
    }
  }

  /**
   * Handle skill end
   */
  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Homing Swarm':
        this.deactivateHomingSwarm();
        break;
      // Barrage ends when all missiles are fired
    }
  }

  /**
   * Barrage: Fire 5 missiles in rapid succession
   */
  private activateBarrage(): void {
    this.barrageActive = true;
    this.barrageMissilesRemaining = 5;
    this.barrageNextFireTime = 0; // Fire immediately

    if (import.meta.env.DEV) {
      console.log('[MissilePod] Barrage activated!');
    }
  }

  /**
   * Homing Swarm: Perfect tracking for 8 seconds
   */
  private activateHomingSwarm(): void {
    this.homingSwarmActive = true;

    // Visual feedback
    this.createHomingSwarmEffect();

    if (import.meta.env.DEV) {
      console.log('[MissilePod] Homing Swarm activated!');
    }
  }

  private deactivateHomingSwarm(): void {
    this.homingSwarmActive = false;

    if (import.meta.env.DEV) {
      console.log('[MissilePod] Homing Swarm ended');
    }
  }

  private createMissileTrail(x: number, y: number): void {
    // Create smoke puff at launch
    const puff = this.scene.add.circle(x, y, 8, 0x888888, 0.6);
    this.scene.tweens.add({
      targets: puff,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => puff.destroy(),
    });
  }

  private createHomingSwarmEffect(): void {
    // Create pulsing effect around tank
    const ring = this.scene.add.circle(this.x, this.y, 50, 0xff4444, 0);
    ring.setStrokeStyle(2, 0xff4444, 0.8);

    this.scene.tweens.add({
      targets: ring,
      scale: 2,
      alpha: 0,
      duration: 500,
      repeat: 3,
      onComplete: () => ring.destroy(),
    });
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.barrageActive = false;
    this.homingSwarmActive = false;
    super.destroy();
  }
}
