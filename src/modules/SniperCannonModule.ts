import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { ProjectileType } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { StatType } from '../types/GameTypes';
import { GAME_CONFIG, BALANCE } from '../config/GameConfig';

/**
 * SniperCannonModule - High-damage single shot (ModuleType.Mortar)
 *
 * Fire rate: 2500ms, Damage: 80
 * Innate +20% crit bonus
 *
 * Skills:
 * 1. Aimed Shot: Next shot +50% crit chance (instant, flag-based)
 * 2. Dead Eye: +100% crit chance, +50% crit damage for 8s
 */
export class SniperCannonModule extends BaseModule {
  // Aimed Shot state (instant, next-shot flag)
  private aimedShotReady: boolean = false;

  // Dead Eye state
  private deadEyeActive: boolean = false;

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    this.baseFireRate = 2500;
    this.baseDamage = 80;
  }

  /**
   * Override calculateDamage for innate crit bonus + skills
   */
  protected calculateDamage(): { damage: number; isCrit: boolean } {
    const moduleDamageBonus = this.getStat(StatType.Damage) / 100;
    const slotDamageBonus = this.slotStats.damageLevel * BALANCE.SLOT_DAMAGE_PER_LEVEL;

    // Base crit chance with innate +20% bonus
    let critChance = (this.getStat(StatType.CritChance) / 100) + 0.2;
    let critDamageBonus = this.getStat(StatType.CritDamage) / 100;

    // Aimed Shot: +50% crit chance for next shot
    if (this.aimedShotReady) {
      critChance += 0.5;
    }

    // Dead Eye: +100% crit chance, +50% crit damage
    if (this.deadEyeActive) {
      critChance += 1.0;
      critDamageBonus += 0.5;
    }

    const isCrit = Math.random() < Math.min(1.0, critChance);

    let damage = this.baseDamage;
    damage *= 1 + moduleDamageBonus;
    damage *= 1 + slotDamageBonus;
    if (isCrit) {
      damage *= GAME_CONFIG.BASE_CRIT_MULTIPLIER + critDamageBonus;
    }

    if (this.isAutoModeActive) {
      damage *= BaseModule.AUTO_MODE_DAMAGE_PENALTY;
    }

    damage *= Phaser.Math.FloatBetween(0.9, 1.1);

    return { damage: Math.floor(damage), isCrit };
  }

  /**
   * Fire a single high-damage shot
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

    // Consume aimed shot flag after calculating damage
    if (this.aimedShotReady) {
      this.aimedShotReady = false;
    }

    const firePos = this.getFirePosition();
    const angle = Phaser.Math.Angle.Between(firePos.x, firePos.y, target.x, target.y);
    const speed = 800; // Fast projectile

    projectile.activate(firePos.x, firePos.y, {
      type: ProjectileType.CannonShell,
      damage,
      speed,
      isCrit,
      lifetime: 2000,
    });

    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed;
    projectile.setVelocity(velX, velY);

    // VFX: Large muzzle flash
    this.createMuzzleFlash(firePos.x, firePos.y, angle);

    this.lastFireTime = currentTime;
  }

  /**
   * Large muzzle flash for sniper shot
   */
  private createMuzzleFlash(x: number, y: number, angle: number): void {
    const flashX = x + Math.cos(angle) * 12;
    const flashY = y + Math.sin(angle) * 12;

    // Bright core
    const core = this.scene.add.circle(flashX, flashY, 12, 0xffffff, 1);
    core.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets: core,
      scale: 2.5,
      alpha: 0,
      duration: 80,
      ease: 'Quad.easeOut',
      onComplete: () => core.destroy(),
    });

    // Outer glow
    const glow = this.scene.add.circle(flashX, flashY, 18, 0xff8800, 0.6);
    glow.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 1);

    this.scene.tweens.add({
      targets: glow,
      scale: 2,
      alpha: 0,
      duration: 100,
      ease: 'Quad.easeOut',
      onComplete: () => glow.destroy(),
    });
  }

  protected onSkillActivate(skill: ModuleSkill, _enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Aimed Shot':
        this.aimedShotReady = true;
        // Visual feedback
        this.showAimedShotEffect();
        if (import.meta.env.DEV) {
          console.log('[SniperCannon] Aimed Shot ready!');
        }
        break;
      case 'Dead Eye':
        this.deadEyeActive = true;
        if (import.meta.env.DEV) {
          console.log('[SniperCannon] Dead Eye activated!');
        }
        break;
    }
  }

  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Dead Eye':
        this.deadEyeActive = false;
        if (import.meta.env.DEV) {
          console.log('[SniperCannon] Dead Eye ended');
        }
        break;
    }
  }

  private showAimedShotEffect(): void {
    const firePos = this.getFirePosition();
    const crosshair = this.scene.add.circle(firePos.x, firePos.y, 20, 0xff0000, 0);
    crosshair.setStrokeStyle(2, 0xff0000, 0.8);
    crosshair.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets: crosshair,
      scale: 0.5,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => crosshair.destroy(),
    });
  }

  public destroy(): void {
    this.aimedShotReady = false;
    this.deadEyeActive = false;
    super.destroy();
  }
}
