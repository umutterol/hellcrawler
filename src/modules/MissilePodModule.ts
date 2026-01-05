import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { Enemy } from '../entities/Enemy';
import { ArcingMissile, ArcingMissileConfig } from '../entities/ArcingMissile';

/**
 * MissilePodModule - Launches arcing missiles with cinematic trajectories
 *
 * Fires missiles that arc through the sky before diving at enemies.
 * Slower fire rate but higher damage with AoE.
 *
 * Cinematic Behavior (per GDD 4.6):
 * - Launch: Vertical upward with smoke puff
 * - Travel: Parabolic arc (100-150px peak), smoke trail
 * - Impact: Fire ring, shockwave, debris
 *
 * Skills:
 * 1. Barrage: Fire 5 missiles in rapid succession
 * 2. Homing Swarm: All missiles gain perfect tracking for 8 seconds
 */
export class MissilePodModule extends BaseModule {
  // Barrage state
  private barrageActive: boolean = false;
  private barrageMissilesRemaining: number = 0;
  private barrageNextFireTime: number = 0;
  private barrageFireInterval: number = 150; // ms between barrage missiles (150ms per GDD)

  // Arcing missile pool
  private arcingMissileGroup: Phaser.GameObjects.Group | null = null;

  // Arc configuration
  private static readonly ARC_HEIGHT_MIN = 100;
  private static readonly ARC_HEIGHT_MAX = 150;
  private static readonly TRAVEL_DURATION = 800; // ms to reach target
  // AoE radius must account for enemy movement during flight time
  // At 120 speed over 800ms, enemy moves ~96px. Use 100px radius to reliably hit.
  private static readonly AOE_RADIUS = 100;

  // Current enemies reference (for barrage missiles)
  private currentEnemies: Enemy[] = [];

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

    // Create arcing missile pool
    this.createMissilePool();
  }

  /**
   * Create pool of arcing missiles
   */
  private createMissilePool(): void {
    this.arcingMissileGroup = this.scene.add.group({
      classType: ArcingMissile,
      runChildUpdate: true,
      maxSize: 20, // Max active missiles
    });

    // Pre-create missiles
    for (let i = 0; i < 10; i++) {
      const missile = new ArcingMissile(this.scene);
      this.arcingMissileGroup.add(missile);
      missile.deactivate();
    }
  }

  /**
   * Get an arcing missile from the pool
   */
  private getArcingMissile(): ArcingMissile | null {
    if (!this.arcingMissileGroup) return null;
    return this.arcingMissileGroup.getFirstDead(true) as ArcingMissile | null;
  }

  /**
   * Fire missiles at enemies
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    // Store enemies reference for auto-mode skill triggers and barrage
    this.updateEnemiesReference(enemies);
    this.currentEnemies = enemies;

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
   * Fire a single arcing missile
   */
  private fireMissile(_currentTime: number, enemies: Enemy[]): void {
    // Find target
    const target = this.findClosestEnemy(enemies);
    if (!target) return;

    // Get arcing missile from pool
    const missile = this.getArcingMissile();
    if (!missile) return;

    // Calculate damage
    const { damage, isCrit } = this.calculateDamage();

    // Get firing position from slot configuration
    const firePos = this.getFirePosition();

    // Calculate arc height based on distance (longer = higher arc)
    const distance = Phaser.Math.Distance.Between(firePos.x, firePos.y, target.x, target.y);
    const arcHeight = Phaser.Math.Clamp(
      distance * 0.3,
      MissilePodModule.ARC_HEIGHT_MIN,
      MissilePodModule.ARC_HEIGHT_MAX
    );

    // Configure and launch arcing missile
    const config: ArcingMissileConfig = {
      damage,
      isCrit,
      targetX: target.x,
      targetY: target.y,
      arcHeight,
      travelDuration: MissilePodModule.TRAVEL_DURATION,
      aoeRadius: MissilePodModule.AOE_RADIUS,
      enemies,
    };

    missile.activate(firePos.x, firePos.y, config);

    if (import.meta.env.DEV) {
      console.log(`[MissilePod] Launched arcing missile at (${firePos.x.toFixed(0)}, ${firePos.y.toFixed(0)}) → (${target.x.toFixed(0)}, ${target.y.toFixed(0)}), arc=${arcHeight.toFixed(0)}px`);
    }
  }

  /**
   * Fire a barrage missile (faster travel, staggered launches per GDD)
   */
  private fireBarrageMissile(_currentTime: number, enemies: Enemy[]): void {
    // Pick random enemy for variety
    const aliveEnemies = enemies.filter((e) => e.isAlive());
    if (aliveEnemies.length === 0) return;

    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]!;

    const missile = this.getArcingMissile();
    if (!missile) return;

    const { damage, isCrit } = this.calculateDamage();

    // Get firing position with slight offset for MLRS-like staggered visual
    const firePos = this.getFirePosition();
    const offsetX = Phaser.Math.FloatBetween(-8, 8);
    const offsetY = Phaser.Math.FloatBetween(-15, 15);
    const spawnX = firePos.x + offsetX;
    const spawnY = firePos.y + offsetY;

    // Calculate arc height (slightly lower for faster barrage)
    const distance = Phaser.Math.Distance.Between(spawnX, spawnY, target.x, target.y);
    const arcHeight = Phaser.Math.Clamp(
      distance * 0.25,
      MissilePodModule.ARC_HEIGHT_MIN * 0.8,
      MissilePodModule.ARC_HEIGHT_MAX * 0.9
    );

    // Barrage missiles travel faster
    const config: ArcingMissileConfig = {
      damage,
      isCrit,
      targetX: target.x,
      targetY: target.y,
      arcHeight,
      travelDuration: MissilePodModule.TRAVEL_DURATION * 0.75, // 25% faster
      aoeRadius: MissilePodModule.AOE_RADIUS,
      enemies: this.currentEnemies,
    };

    missile.activate(spawnX, spawnY, config);
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
   * TODO: Currently just visual - implement tracking arc behavior later
   */
  private activateHomingSwarm(): void {
    // Visual feedback
    this.createHomingSwarmEffect();

    if (import.meta.env.DEV) {
      console.log('[MissilePod] Homing Swarm activated! (visual only - tracking TODO)');
    }
  }

  private deactivateHomingSwarm(): void {
    if (import.meta.env.DEV) {
      console.log('[MissilePod] Homing Swarm ended');
    }
  }

  private createHomingSwarmEffect(): void {
    // Create pulsing effect around firing position
    const firePos = this.getFirePosition();
    const ring = this.scene.add.circle(firePos.x, firePos.y, 50, 0xff4444, 0);
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

    // Clean up arcing missile pool
    if (this.arcingMissileGroup) {
      this.arcingMissileGroup.clear(true, true);
      this.arcingMissileGroup = null;
    }

    super.destroy();
  }
}
