import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { Enemy } from '../entities/Enemy';
import { GAME_CONFIG } from '../config/GameConfig';
import { getStatusEffectManager } from '../systems/StatusEffectManager';
import { StatusEffectType } from '../types/StatusEffectTypes';

/**
 * FlamethrowerModule - Close-range area damage (ModuleType.Flamethrower)
 *
 * Fire rate: 200ms (tick), Damage: 3/tick
 * Damages enemies in cone (200px, 45 degrees) directly via takeDamage()
 * 30% chance Burning status per tick
 *
 * Skills:
 * 1. Napalm: Ground DoT zone for 5s
 * 2. Inferno: Triple cone width (135 deg) + 3x damage for 4s
 */
export class FlamethrowerModule extends BaseModule {
  // Inferno state
  private infernoActive: boolean = false;

  // Cone configuration
  private static readonly CONE_RANGE = 200;
  private static readonly CONE_ANGLE = Math.PI / 4; // 45 degrees
  private static readonly INFERNO_CONE_ANGLE = Math.PI * 3 / 4; // 135 degrees

  // VFX
  private flameGraphics: Phaser.GameObjects.Graphics | null = null;
  private napalmZones: Phaser.GameObjects.Rectangle[] = [];

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats
  ) {
    super(scene, moduleData, slotIndex, slotStats);

    this.baseFireRate = 200; // Tick rate
    this.baseDamage = 3; // Per tick

    // Create flame graphics
    this.flameGraphics = this.scene.add.graphics();
    this.flameGraphics.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 1);
  }

  /**
   * Fire = damage enemies in cone each tick
   */
  public fire(currentTime: number, enemies: Enemy[]): void {
    this.updateEnemiesReference(enemies);

    if (!this.canFire(currentTime) || enemies.length === 0) {
      return;
    }

    const firePos = this.getFirePosition();
    const coneAngle = this.infernoActive
      ? FlamethrowerModule.INFERNO_CONE_ANGLE
      : FlamethrowerModule.CONE_ANGLE;
    const damageMultiplier = this.infernoActive ? 3 : 1;

    const statusManager = getStatusEffectManager();
    let hitCount = 0;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      const dist = Phaser.Math.Distance.Between(firePos.x, firePos.y, enemy.x, enemy.y);
      if (dist > FlamethrowerModule.CONE_RANGE) continue;

      // Check if enemy is within the cone angle (toward right by default)
      const angle = Phaser.Math.Angle.Between(firePos.x, firePos.y, enemy.x, enemy.y);
      if (Math.abs(angle) <= coneAngle / 2) {
        const { damage, isCrit } = this.calculateDamage();
        const finalDamage = Math.floor(damage * damageMultiplier);

        enemy.takeDamage(finalDamage, isCrit);
        hitCount++;

        // 30% chance Burning
        statusManager.applyEffect(
          enemy.getId(),
          { type: StatusEffectType.Burning, chance: 0.3 },
          currentTime
        );
      }
    }

    // Update flame VFX
    this.drawFlameEffect(firePos.x, firePos.y, coneAngle, hitCount > 0);

    this.lastFireTime = currentTime;
  }

  /**
   * Draw semi-transparent orange cone
   */
  private drawFlameEffect(x: number, y: number, coneAngle: number, hasTargets: boolean): void {
    if (!this.flameGraphics) return;

    this.flameGraphics.clear();

    if (!hasTargets && !this.infernoActive) return;

    const alpha = 0.2 + Math.random() * 0.15; // Flickering
    const range = FlamethrowerModule.CONE_RANGE;
    const color = this.infernoActive ? 0xff4400 : 0xff8800;

    this.flameGraphics.fillStyle(color, alpha);
    this.flameGraphics.beginPath();
    this.flameGraphics.moveTo(x, y);

    // Draw arc
    const startAngle = -coneAngle / 2;
    const endAngle = coneAngle / 2;
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / steps);
      this.flameGraphics.lineTo(
        x + Math.cos(a) * range,
        y + Math.sin(a) * range
      );
    }

    this.flameGraphics.closePath();
    this.flameGraphics.fill();
  }

  protected onSkillActivate(skill: ModuleSkill, enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Napalm':
        this.activateNapalm(enemies);
        break;
      case 'Inferno':
        this.infernoActive = true;
        if (import.meta.env.DEV) {
          console.log('[Flamethrower] Inferno activated!');
        }
        break;
    }
  }

  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Inferno':
        this.infernoActive = false;
        if (this.flameGraphics) {
          this.flameGraphics.clear();
        }
        if (import.meta.env.DEV) {
          console.log('[Flamethrower] Inferno ended');
        }
        break;
    }
  }

  /**
   * Napalm: Create a ground DoT zone lasting 5 seconds
   */
  private activateNapalm(_enemies: Enemy[]): void {
    const firePos = this.getFirePosition();
    // Place napalm zone in front of the tank
    const zoneX = firePos.x + 150;
    const zoneY = firePos.y + 20;
    const zoneWidth = 120;
    const zoneHeight = 30;

    const zone = this.scene.add.rectangle(zoneX, zoneY, zoneWidth, zoneHeight, 0xff4400, 0.4);
    zone.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 2);
    this.napalmZones.push(zone);

    const statusManager = getStatusEffectManager();
    const duration = 5000;
    const tickRate = 500;
    let elapsed = 0;

    const napalmTimer = this.scene.time.addEvent({
      delay: tickRate,
      repeat: Math.floor(duration / tickRate) - 1,
      callback: () => {
        elapsed += tickRate;

        // Flicker effect
        zone.setAlpha(0.3 + Math.random() * 0.2);

        // Damage enemies in zone
        for (const enemy of this.lastKnownEnemies) {
          if (!enemy.isAlive()) continue;

          const dx = Math.abs(enemy.x - zoneX);
          const dy = Math.abs(enemy.y - zoneY);
          if (dx <= zoneWidth / 2 && dy <= zoneHeight / 2) {
            const { damage } = this.calculateDamage();
            enemy.takeDamage(damage, false);
            statusManager.applyEffect(
              enemy.getId(),
              { type: StatusEffectType.Burning, chance: 0.5 },
              this.scene.time.now
            );
          }
        }

        if (elapsed >= duration) {
          zone.destroy();
          const idx = this.napalmZones.indexOf(zone);
          if (idx !== -1) this.napalmZones.splice(idx, 1);
          napalmTimer.destroy();
        }
      },
    });

    if (import.meta.env.DEV) {
      console.log('[Flamethrower] Napalm deployed!');
    }
  }

  public destroy(): void {
    if (this.flameGraphics) {
      this.flameGraphics.destroy();
      this.flameGraphics = null;
    }
    for (const zone of this.napalmZones) {
      zone.destroy();
    }
    this.napalmZones = [];
    this.infernoActive = false;
    super.destroy();
  }
}
