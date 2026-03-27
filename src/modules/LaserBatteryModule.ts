import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { Enemy } from '../entities/Enemy';
import { GAME_CONFIG } from '../config/GameConfig';
import { getStatusEffectManager } from '../systems/StatusEffectManager';
import { StatusEffectType } from '../types/StatusEffectTypes';

/**
 * LaserBatteryModule - Continuous beam weapon (ModuleType.LaserCutter)
 *
 * Fire rate: 100ms (tick), Damage: 5/tick
 * Locks closest enemy, continuous damage. 20% ShieldBreak/sec
 *
 * Skills:
 * 1. Focused Beam: +200% damage to locked target for 4s
 * 2. Sweep: Beam hits ALL enemies in line for 3s
 */
export class LaserBatteryModule extends BaseModule {
  // Locked target
  private lockedTarget: Enemy | null = null;

  // Skill states
  private focusedBeamActive: boolean = false;
  private sweepActive: boolean = false;

  // VFX
  private beamGraphics: Phaser.GameObjects.Graphics | null = null;

  // ShieldBreak tracking (apply every 5 ticks at 100ms = once per 500ms ≈ 20%/sec)
  private shieldBreakAccumulator: number = 0;

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    this.baseFireRate = 100; // 10 ticks per second
    this.baseDamage = 5;

    this.beamGraphics = this.scene.add.graphics();
    this.beamGraphics.setDepth(GAME_CONFIG.DEPTH.EFFECTS);
  }

  /**
   * Fire = continuous beam damage each tick
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    this.updateEnemiesReference(enemies);

    if (!this.canFire(currentTime) || enemies.length === 0) {
      // Clear beam if no enemies
      if (this.beamGraphics) this.beamGraphics.clear();
      this.lockedTarget = null;
      return;
    }

    // Lock onto closest enemy (re-acquire if target dies)
    if (!this.lockedTarget || !this.lockedTarget.isAlive()) {
      this.lockedTarget = this.findClosestEnemy(enemies);
    }

    if (!this.lockedTarget) {
      if (this.beamGraphics) this.beamGraphics.clear();
      return;
    }

    const firePos = this.getFirePosition();
    const statusManager = getStatusEffectManager();

    if (this.sweepActive) {
      // Sweep: Hit ALL enemies in a line from fire pos through locked target
      this.drawBeamSweep(firePos.x, firePos.y, enemies);

      for (const enemy of enemies) {
        if (!enemy.isAlive()) continue;

        // Check if enemy is roughly on the line from fire pos to infinity in target direction
        const angle = Phaser.Math.Angle.Between(firePos.x, firePos.y, this.lockedTarget.x, this.lockedTarget.y);
        const enemyAngle = Phaser.Math.Angle.Between(firePos.x, firePos.y, enemy.x, enemy.y);
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));

        if (angleDiff <= 0.15) { // ~8.5 degree tolerance
          const { damage, isCrit } = this.calculateDamage();
          enemy.takeDamage(damage, isCrit);
        }
      }
    } else {
      // Normal: Single target damage
      const damageMultiplier = this.focusedBeamActive ? 3 : 1; // +200% = 3x
      const { damage, isCrit } = this.calculateDamage();
      const finalDamage = Math.floor(damage * damageMultiplier);

      this.lockedTarget.takeDamage(finalDamage, isCrit);

      // Draw beam to locked target
      this.drawBeam(firePos.x, firePos.y, this.lockedTarget.x, this.lockedTarget.y);

      // ShieldBreak: apply once per ~500ms
      this.shieldBreakAccumulator++;
      if (this.shieldBreakAccumulator >= 5) {
        this.shieldBreakAccumulator = 0;
        statusManager.applyEffect(
          this.lockedTarget.getId(),
          { type: StatusEffectType.ShieldBreak, chance: 1.0 },
          currentTime
        );
      }
    }

    this.lastFireTime = currentTime;
  }

  /**
   * Draw single beam line
   */
  private drawBeam(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.beamGraphics) return;

    this.beamGraphics.clear();

    // Pulsing width effect
    const width = 2 + Math.sin(this.scene.time.now * 0.01) * 1;

    // Red beam
    this.beamGraphics.lineStyle(width, 0xff0000, 0.8);
    this.beamGraphics.beginPath();
    this.beamGraphics.moveTo(x1, y1);
    this.beamGraphics.lineTo(x2, y2);
    this.beamGraphics.strokePath();

    // Inner brighter core
    this.beamGraphics.lineStyle(1, 0xff4444, 1);
    this.beamGraphics.beginPath();
    this.beamGraphics.moveTo(x1, y1);
    this.beamGraphics.lineTo(x2, y2);
    this.beamGraphics.strokePath();
  }

  /**
   * Draw sweep beam (wider, through all targets)
   */
  private drawBeamSweep(x: number, y: number, _enemies: Enemy[]): void {
    if (!this.beamGraphics || !this.lockedTarget) return;

    this.beamGraphics.clear();

    const angle = Phaser.Math.Angle.Between(x, y, this.lockedTarget.x, this.lockedTarget.y);
    const beamLength = 1200;
    const endX = x + Math.cos(angle) * beamLength;
    const endY = y + Math.sin(angle) * beamLength;

    // Wide red sweep beam
    this.beamGraphics.lineStyle(4, 0xff2200, 0.6);
    this.beamGraphics.beginPath();
    this.beamGraphics.moveTo(x, y);
    this.beamGraphics.lineTo(endX, endY);
    this.beamGraphics.strokePath();
  }

  protected onSkillActivate(skill: ModuleSkill, _enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Focused Beam':
        this.focusedBeamActive = true;
        if (import.meta.env.DEV) {
          console.log('[LaserBattery] Focused Beam activated!');
        }
        break;
      case 'Sweep':
        this.sweepActive = true;
        if (import.meta.env.DEV) {
          console.log('[LaserBattery] Sweep activated!');
        }
        break;
    }
  }

  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Focused Beam':
        this.focusedBeamActive = false;
        if (import.meta.env.DEV) {
          console.log('[LaserBattery] Focused Beam ended');
        }
        break;
      case 'Sweep':
        this.sweepActive = false;
        if (import.meta.env.DEV) {
          console.log('[LaserBattery] Sweep ended');
        }
        break;
    }
  }

  public destroy(): void {
    if (this.beamGraphics) {
      this.beamGraphics.destroy();
      this.beamGraphics = null;
    }
    this.lockedTarget = null;
    this.focusedBeamActive = false;
    this.sweepActive = false;
    super.destroy();
  }
}
