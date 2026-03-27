import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { ProjectileType } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { GAME_CONFIG } from '../config/GameConfig';
import { getStatusEffectManager } from '../systems/StatusEffectManager';
import { StatusEffectType } from '../types/StatusEffectTypes';

/**
 * TeslaCoilModule - Chain lightning attacks
 *
 * ModuleType.TeslaCoil
 * Fire rate: 800ms, Damage: 18
 * Fires projectile at closest enemy, 40% chance Shock status
 *
 * Skills:
 * 1. Chain Lightning: Fires arc that chains to 3 additional nearby enemies
 * 2. Overload: +100% damage, 100% shock chance for 6s
 */
export class TeslaCoilModule extends BaseModule {
  // Overload state
  private overloadActive: boolean = false;

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    this.baseFireRate = 800;
    this.baseDamage = 18;
  }

  /**
   * Override calculateDamage for Overload bonus
   */
  protected calculateDamage(): { damage: number; isCrit: boolean } {
    const result = super.calculateDamage();
    if (this.overloadActive) {
      result.damage = Math.floor(result.damage * 2); // +100% damage
    }
    return result;
  }

  /**
   * Fire lightning bolt at closest enemy
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    this.updateEnemiesReference(enemies);

    if (!this.canFire(currentTime) || enemies.length === 0) {
      return;
    }

    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    const projectile = this.getProjectile();
    if (!projectile) return;

    const { damage, isCrit } = this.calculateDamage();
    const firePos = this.getFirePosition();
    const angle = Phaser.Math.Angle.Between(firePos.x, firePos.y, target.x, target.y);
    const speed = 500;

    // Determine shock chance
    const shockChance = this.overloadActive ? 1.0 : 0.4;

    projectile.activate(firePos.x, firePos.y, {
      type: ProjectileType.Bullet,
      damage,
      speed,
      isCrit,
      lifetime: 2000,
      statusEffects: [
        {
          type: StatusEffectType.Shock,
          chance: shockChance,
        },
      ],
    });

    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed;
    projectile.setVelocity(velX, velY);

    // VFX: Blue muzzle flash
    this.createLightningFlash(firePos.x, firePos.y);

    // VFX: Blue line from fire pos to approximate target
    this.createLightningBeam(firePos.x, firePos.y, target.x, target.y);

    this.lastFireTime = currentTime;
  }

  /**
   * Blue circle muzzle flash
   */
  private createLightningFlash(x: number, y: number): void {
    const flash = this.scene.add.circle(x, y, 8, 0x4488ff, 0.9);
    flash.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 80,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Blue line from fire position to target
   */
  private createLightningBeam(x1: number, y1: number, x2: number, y2: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(GAME_CONFIG.DEPTH.EFFECTS);
    graphics.lineStyle(2, 0x4488ff, 0.8);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    // Add slight zigzag for lightning feel
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segments = 4;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const px = x1 + dx * t + (i < segments ? Phaser.Math.FloatBetween(-10, 10) : 0);
      const py = y1 + dy * t + (i < segments ? Phaser.Math.FloatBetween(-10, 10) : 0);
      graphics.lineTo(px, py);
    }
    graphics.strokePath();

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 120,
      onComplete: () => graphics.destroy(),
    });
  }

  /**
   * Chain lightning between multiple enemies
   */
  private chainLightning(startEnemy: Enemy, enemies: Enemy[], chainDamage: number): void {
    const statusManager = getStatusEffectManager();
    let currentTarget = startEnemy;
    const hitEnemies = new Set<string>([startEnemy.getId()]);
    const firePos = this.getFirePosition();

    // Draw initial beam to first target
    this.createLightningBeam(firePos.x, firePos.y, currentTarget.x, currentTarget.y);

    // Chain to 3 additional enemies
    for (let i = 0; i < 3; i++) {
      // Find closest enemy within 150px that hasn't been hit
      let closestDist = 150;
      let closestEnemy: Enemy | null = null;

      for (const enemy of enemies) {
        if (!enemy.isAlive() || hitEnemies.has(enemy.getId())) continue;

        const dist = Phaser.Math.Distance.Between(
          currentTarget.x, currentTarget.y,
          enemy.x, enemy.y
        );

        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      if (!closestEnemy) break;

      // Draw chain beam
      this.createLightningBeam(currentTarget.x, currentTarget.y, closestEnemy.x, closestEnemy.y);

      // Deal damage
      closestEnemy.takeDamage(chainDamage, false);

      // Apply shock
      statusManager.applyEffect(
        closestEnemy.getId(),
        { type: StatusEffectType.Shock, chance: 0.6 },
        this.scene.time.now
      );

      hitEnemies.add(closestEnemy.getId());
      currentTarget = closestEnemy;
    }
  }

  protected onSkillActivate(skill: ModuleSkill, enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Chain Lightning':
        this.activateChainLightning(enemies);
        break;
      case 'Overload':
        this.overloadActive = true;
        if (import.meta.env.DEV) {
          console.log('[TeslaCoil] Overload activated!');
        }
        break;
    }
  }

  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Overload':
        this.overloadActive = false;
        if (import.meta.env.DEV) {
          console.log('[TeslaCoil] Overload ended');
        }
        break;
    }
  }

  /**
   * Chain Lightning skill: hit closest + chain to 3 more
   */
  private activateChainLightning(enemies: Enemy[]): void {
    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    const { damage } = this.calculateDamage();

    // Hit primary target
    target.takeDamage(damage, false);

    const statusManager = getStatusEffectManager();
    statusManager.applyEffect(
      target.getId(),
      { type: StatusEffectType.Shock, chance: 0.8 },
      this.scene.time.now
    );

    // Chain to 3 more
    this.chainLightning(target, enemies, Math.floor(damage * 0.7));

    // Big flash at fire position
    const firePos = this.getFirePosition();
    const burst = this.scene.add.circle(firePos.x, firePos.y, 15, 0x4488ff, 0.8);
    burst.setDepth(GAME_CONFIG.DEPTH.EFFECTS);
    this.scene.tweens.add({
      targets: burst,
      scale: 4,
      alpha: 0,
      duration: 300,
      onComplete: () => burst.destroy(),
    });

    if (import.meta.env.DEV) {
      console.log('[TeslaCoil] Chain Lightning activated!');
    }
  }

  public destroy(): void {
    this.overloadActive = false;
    super.destroy();
  }
}
