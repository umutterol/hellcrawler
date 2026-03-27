import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { Enemy } from '../entities/Enemy';
import { GAME_CONFIG } from '../config/GameConfig';
import { getStatusEffectManager } from '../systems/StatusEffectManager';
import { StatusEffectType } from '../types/StatusEffectTypes';

/**
 * EMPDeviceModule - AoE pulse damage (ModuleType.EMPEmitter)
 *
 * Fire rate: 3000ms, Damage: 15
 * AoE pulse: findEnemiesInRange(300), damage all, 25% Shock
 * No projectiles - direct damage in fire()
 *
 * Skills:
 * 1. Pulse: Shock ALL enemies for 3s
 * 2. Overcharge: +300% damage + 100% shock for 6s
 */
export class EMPDeviceModule extends BaseModule {
  // Overcharge state
  private overchargeActive: boolean = false;

  private static readonly PULSE_RANGE = 300;

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    this.baseFireRate = 3000;
    this.baseDamage = 15;
  }

  /**
   * Fire = AoE pulse, no projectiles
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    this.updateEnemiesReference(enemies);

    if (!this.canFire(currentTime) || enemies.length === 0) {
      return;
    }

    const firePos = this.getFirePosition();
    const inRange = this.findEnemiesInRange(enemies, EMPDeviceModule.PULSE_RANGE);

    if (inRange.length === 0) return;

    const damageMultiplier = this.overchargeActive ? 4 : 1; // +300% = 4x
    const shockChance = this.overchargeActive ? 1.0 : 0.25;
    const statusManager = getStatusEffectManager();

    for (const enemy of inRange) {
      if (!enemy.isAlive()) continue;

      const { damage, isCrit } = this.calculateDamage();
      const finalDamage = Math.floor(damage * damageMultiplier);

      enemy.takeDamage(finalDamage, isCrit);

      // Apply shock
      statusManager.applyEffect(
        enemy.getId(),
        { type: StatusEffectType.Shock, chance: shockChance },
        currentTime
      );
    }

    // VFX: Expanding blue ring
    this.createPulseEffect(firePos.x, firePos.y);

    this.lastFireTime = currentTime;
  }

  /**
   * Expanding blue ring pulse effect
   */
  private createPulseEffect(x: number, y: number): void {
    const ring = this.scene.add.circle(x, y, 10, 0x4488ff, 0);
    ring.setStrokeStyle(3, 0x4488ff, 0.8);
    ring.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    const targetScale = EMPDeviceModule.PULSE_RANGE / 10;

    this.scene.tweens.add({
      targets: ring,
      scale: targetScale,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Center flash
    const flash = this.scene.add.circle(x, y, 8, 0x88bbff, 0.7);
    flash.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  protected onSkillActivate(skill: ModuleSkill, enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Pulse':
        this.activatePulse(enemies);
        break;
      case 'Overcharge':
        this.overchargeActive = true;
        if (import.meta.env.DEV) {
          console.log('[EMPDevice] Overcharge activated!');
        }
        break;
    }
  }

  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Overcharge':
        this.overchargeActive = false;
        if (import.meta.env.DEV) {
          console.log('[EMPDevice] Overcharge ended');
        }
        break;
    }
  }

  /**
   * Pulse skill: Shock ALL enemies for 3s
   */
  private activatePulse(enemies: Enemy[]): void {
    const statusManager = getStatusEffectManager();
    const currentTime = this.scene.time.now;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      statusManager.applyEffect(
        enemy.getId(),
        { type: StatusEffectType.Shock, chance: 1.0, duration: 3000 },
        currentTime
      );
    }

    // Big pulse effect
    const firePos = this.getFirePosition();
    const bigRing = this.scene.add.circle(firePos.x, firePos.y, 10, 0x4488ff, 0);
    bigRing.setStrokeStyle(4, 0x88bbff, 0.9);
    bigRing.setDepth(GAME_CONFIG.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets: bigRing,
      scale: 80, // Very large pulse
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => bigRing.destroy(),
    });

    if (import.meta.env.DEV) {
      console.log(`[EMPDevice] Pulse! Shocked ${enemies.filter((e) => e.isAlive()).length} enemies`);
    }
  }

  public destroy(): void {
    this.overchargeActive = false;
    super.destroy();
  }
}
