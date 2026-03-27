import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill, SlotStats } from '../types/ModuleTypes';
import { Enemy } from '../entities/Enemy';
import { GameState } from '../state/GameState';
import { GameEvents, DamageTakenPayload } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * ShieldGeneratorModule - Damage absorption (ModuleType.ShieldGenerator)
 *
 * No firing (baseFireRate = Infinity, baseDamage = 0)
 * Shield HP: 50 base + 10/slot level, regen 5/s after 3s no-hit
 *
 * Skills:
 * 1. Reinforce: Restore full shield + 50% bonus for 8s
 * 2. Reflect: 30% damage reflected to attackers for 6s
 */
export class ShieldGeneratorModule extends BaseModule {
  private gameState: GameState;

  // Shield state
  private shieldHP: number = 0;
  private maxShieldHP: number = 50;
  private shieldRegenRate: number = 5; // Per second
  private timeSinceLastHit: number = 999999; // Start ready to regen
  private static readonly REGEN_DELAY = 3000; // 3s no-hit before regen

  // Reinforce state
  private reinforceActive: boolean = false;
  private reinforceBonusHP: number = 0;

  // Reflect state
  private reflectActive: boolean = false;
  private static readonly REFLECT_PERCENT = 0.3;

  // VFX
  private shieldCircle: Phaser.GameObjects.Arc | null = null;

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotStats: SlotStats,
    gameState: GameState
  ) {
    super(scene, moduleData, slotIndex, slotStats);
    this.gameState = gameState;

    this.baseFireRate = Infinity;
    this.baseDamage = 0;

    // Calculate max shield HP
    this.maxShieldHP = 50 + this.slotStats.damageLevel * 10;
    this.shieldHP = this.maxShieldHP;

    // Create shield visual
    this.createShieldVisual();

    // Listen for damage taken events
    this.eventManager.on(
      GameEvents.DAMAGE_TAKEN,
      this.onDamageTaken,
      this
    );
  }

  /**
   * Create blue circle around tank
   */
  private createShieldVisual(): void {
    const firePos = this.getFirePosition();
    this.shieldCircle = this.scene.add.circle(
      firePos.x - this.slotOffsetX, // Center on tank, not slot
      firePos.y - this.slotOffsetY,
      60,
      0x4488ff,
      0.15
    );
    this.shieldCircle.setStrokeStyle(2, 0x4488ff, 0.5);
    this.shieldCircle.setDepth(GAME_CONFIG.DEPTH.EFFECTS - 3);
  }

  /**
   * No firing - shield logic is in update and event handler
   */
  public fire(_currentTime: number, enemies: Enemy[]): void {
    this.updateEnemiesReference(enemies);
  }

  /**
   * Update shield state
   */
  public update(time: number, delta: number): void {
    super.update(time, delta);

    this.timeSinceLastHit += delta;

    // Regenerate shield after no-hit delay
    if (this.timeSinceLastHit >= ShieldGeneratorModule.REGEN_DELAY && this.shieldHP < this.getMaxShield()) {
      const regenAmount = this.shieldRegenRate * (delta / 1000);
      this.shieldHP = Math.min(this.getMaxShield(), this.shieldHP + regenAmount);
    }

    // Update visual
    this.updateShieldVisual();
  }

  /**
   * Get current max shield (including reinforce bonus)
   */
  private getMaxShield(): number {
    const base = 50 + this.slotStats.damageLevel * 10;
    return this.reinforceActive ? base + this.reinforceBonusHP : base;
  }

  /**
   * Update shield circle visual
   */
  private updateShieldVisual(): void {
    if (!this.shieldCircle) return;

    const firePos = this.getFirePosition();
    this.shieldCircle.x = firePos.x - this.slotOffsetX;
    this.shieldCircle.y = firePos.y - this.slotOffsetY;

    const ratio = this.shieldHP / this.getMaxShield();
    this.shieldCircle.setScale(0.5 + ratio * 0.5);
    this.shieldCircle.setAlpha(ratio * 0.15);

    const strokeAlpha = ratio > 0 ? 0.3 + ratio * 0.4 : 0;
    this.shieldCircle.setStrokeStyle(2, 0x4488ff, strokeAlpha);
  }

  /**
   * Handle damage taken - absorb with shield
   */
  private onDamageTaken(payload: DamageTakenPayload): void {
    if (this.shieldHP <= 0) return;

    this.timeSinceLastHit = 0;

    // Absorb damage
    const absorbed = Math.min(this.shieldHP, payload.damage);
    this.shieldHP -= absorbed;

    // Heal back the absorbed amount
    if (absorbed > 0) {
      this.gameState.heal(absorbed, 'other');
    }

    // Reflect damage if active
    if (this.reflectActive && this.lastKnownEnemies.length > 0) {
      const reflectDamage = Math.floor(payload.damage * ShieldGeneratorModule.REFLECT_PERCENT);
      if (reflectDamage > 0) {
        // Find the source enemy and damage them
        for (const enemy of this.lastKnownEnemies) {
          if (enemy.isAlive() && enemy.getId() === payload.sourceId) {
            enemy.takeDamage(reflectDamage, false);
            break;
          }
        }
      }
    }

    // Flash shield visual on hit
    if (this.shieldCircle) {
      this.scene.tweens.add({
        targets: this.shieldCircle,
        alpha: 0.6,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
  }

  protected onSkillActivate(skill: ModuleSkill, _enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Reinforce':
        this.activateReinforce();
        break;
      case 'Reflect':
        this.reflectActive = true;
        // Flash shield green for reflect feedback
        if (this.shieldCircle) {
          this.shieldCircle.setStrokeStyle(2, 0x44ff88, 0.8);
        }
        if (import.meta.env.DEV) {
          console.log('[ShieldGenerator] Reflect activated!');
        }
        break;
    }
  }

  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Reinforce':
        this.reinforceActive = false;
        // Clamp shield to normal max
        this.shieldHP = Math.min(this.shieldHP, this.getMaxShield());
        if (import.meta.env.DEV) {
          console.log('[ShieldGenerator] Reinforce ended');
        }
        break;
      case 'Reflect':
        this.reflectActive = false;
        // Restore blue shield color
        if (this.shieldCircle) {
          this.shieldCircle.setStrokeStyle(2, 0x4488ff, 0.5);
        }
        if (import.meta.env.DEV) {
          console.log('[ShieldGenerator] Reflect ended');
        }
        break;
    }
  }

  /**
   * Reinforce: Restore full shield + 50% bonus for 8s
   */
  private activateReinforce(): void {
    this.reinforceActive = true;
    this.reinforceBonusHP = Math.floor(this.getMaxShield() * 0.5);
    this.shieldHP = this.getMaxShield();

    // Visual burst
    const firePos = this.getFirePosition();
    const burst = this.scene.add.circle(
      firePos.x - this.slotOffsetX,
      firePos.y - this.slotOffsetY,
      30,
      0x4488ff,
      0.5
    );
    burst.setDepth(GAME_CONFIG.DEPTH.EFFECTS);
    this.scene.tweens.add({
      targets: burst,
      scale: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => burst.destroy(),
    });

    if (import.meta.env.DEV) {
      console.log(`[ShieldGenerator] Reinforce! Shield: ${this.shieldHP}/${this.getMaxShield()}`);
    }
  }

  public destroy(): void {
    this.eventManager.off(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);

    if (this.shieldCircle) {
      this.shieldCircle.destroy();
      this.shieldCircle = null;
    }

    this.reinforceActive = false;
    this.reflectActive = false;
    super.destroy();
  }
}
