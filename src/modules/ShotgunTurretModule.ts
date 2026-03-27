import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { ProjectileType } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * ShotgunTurretModule - Multi-pellet spread (ModuleType.MainCannon)
 *
 * Fire rate: 1200ms, Damage: 6/pellet, 8 pellets in 30-degree cone
 *
 * Skills:
 * 1. Scatter Blast: 12 pellets in 60-degree cone (instant)
 * 2. Slug Round: 1 piercing projectile with 8x damage (instant)
 */
export class ShotgunTurretModule extends BaseModule {
  private static readonly PELLET_COUNT = 8;
  private static readonly CONE_ANGLE = Math.PI / 6; // 30 degrees
  private static readonly SCATTER_PELLET_COUNT = 12;
  private static readonly SCATTER_CONE_ANGLE = Math.PI / 3; // 60 degrees

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    this.baseFireRate = 1200;
    this.baseDamage = 6; // Per pellet
  }

  /**
   * Fire pellets in a cone at enemies
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    this.updateEnemiesReference(enemies);

    if (!this.canFire(currentTime) || enemies.length === 0) {
      return;
    }

    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    const firePos = this.getFirePosition();
    const baseAngle = Phaser.Math.Angle.Between(firePos.x, firePos.y, target.x, target.y);

    this.firePellets(
      firePos.x,
      firePos.y,
      baseAngle,
      ShotgunTurretModule.PELLET_COUNT,
      ShotgunTurretModule.CONE_ANGLE,
      false
    );

    // Muzzle flash
    this.createMuzzleFlash(firePos.x, firePos.y, baseAngle);

    this.lastFireTime = currentTime;
  }

  /**
   * Fire multiple pellets in a cone
   */
  private firePellets(
    x: number,
    y: number,
    baseAngle: number,
    count: number,
    coneAngle: number,
    isPiercing: boolean
  ): void {
    const halfCone = coneAngle / 2;
    const speed = 450;

    for (let i = 0; i < count; i++) {
      const projectile = this.getProjectile();
      if (!projectile) break;

      const { damage, isCrit } = this.calculateDamage();

      // Spread pellets evenly across the cone with a bit of random variation
      const spreadT = count > 1 ? i / (count - 1) : 0.5;
      const pelletAngle = baseAngle - halfCone + spreadT * coneAngle
        + Phaser.Math.FloatBetween(-0.03, 0.03);

      projectile.activate(x, y, {
        type: ProjectileType.Bullet,
        damage,
        speed,
        isCrit,
        lifetime: 1500,
        piercing: isPiercing,
      });

      const velX = Math.cos(pelletAngle) * speed;
      const velY = Math.sin(pelletAngle) * speed;
      projectile.setVelocity(velX, velY);
    }
  }

  /**
   * Fan-shaped muzzle flash
   */
  private createMuzzleFlash(x: number, y: number, angle: number): void {
    const flashX = x + Math.cos(angle) * 10;
    const flashY = y + Math.sin(angle) * 10;

    // Core flash
    const core = this.scene.add.circle(flashX, flashY, 10, 0xffcc00, 0.9);
    core.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets: core,
      scaleX: 2.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 70,
      ease: 'Quad.easeOut',
      onComplete: () => core.destroy(),
    });

    // Outer fan glow
    const glow = this.scene.add.circle(flashX, flashY, 14, 0xff8800, 0.5);
    glow.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 1);

    this.scene.tweens.add({
      targets: glow,
      scaleX: 3,
      scaleY: 2,
      alpha: 0,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => glow.destroy(),
    });
  }

  protected onSkillActivate(skill: ModuleSkill, enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Scatter Blast':
        this.activateScatterBlast(enemies);
        break;
      case 'Slug Round':
        this.activateSlugRound(enemies);
        break;
    }
  }

  protected onSkillEnd(_skill: ModuleSkill): void {
    // Both skills are instant, no cleanup needed
  }

  /**
   * Scatter Blast: 12 pellets in 60-degree cone
   */
  private activateScatterBlast(enemies: Enemy[]): void {
    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    const firePos = this.getFirePosition();
    const baseAngle = Phaser.Math.Angle.Between(firePos.x, firePos.y, target.x, target.y);

    this.firePellets(
      firePos.x,
      firePos.y,
      baseAngle,
      ShotgunTurretModule.SCATTER_PELLET_COUNT,
      ShotgunTurretModule.SCATTER_CONE_ANGLE,
      false
    );

    // Big muzzle flash
    this.createMuzzleFlash(firePos.x, firePos.y, baseAngle);

    if (import.meta.env.DEV) {
      console.log('[ShotgunTurret] Scatter Blast!');
    }
  }

  /**
   * Slug Round: Single piercing projectile with 8x damage
   */
  private activateSlugRound(enemies: Enemy[]): void {
    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    const projectile = this.getProjectile();
    if (!projectile) return;

    const { damage, isCrit } = this.calculateDamage();
    const slugDamage = damage * 8;

    const firePos = this.getFirePosition();
    const angle = Phaser.Math.Angle.Between(firePos.x, firePos.y, target.x, target.y);
    const speed = 700;

    projectile.activate(firePos.x, firePos.y, {
      type: ProjectileType.CannonShell,
      damage: slugDamage,
      speed,
      isCrit,
      lifetime: 3000,
      piercing: true,
    });

    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed;
    projectile.setVelocity(velX, velY);

    // Heavy muzzle flash
    this.createMuzzleFlash(firePos.x, firePos.y, angle);

    if (import.meta.env.DEV) {
      console.log(`[ShotgunTurret] Slug Round! Damage: ${slugDamage}`);
    }
  }

  public destroy(): void {
    super.destroy();
  }
}
