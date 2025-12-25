import Phaser from 'phaser';
import { BaseModule } from './BaseModule';
import { ModuleItemData, ModuleSkill } from '../types/ModuleTypes';
import { Enemy } from '../entities/Enemy';
import { GameState } from '../state/GameState';

/**
 * RepairDroneModule - Passive healing over time
 *
 * Provides continuous HP regeneration to the tank.
 * Does not fire at enemies.
 *
 * Skills:
 * 1. Emergency Repair: Instantly heal 15% of max HP
 * 2. Regeneration Field: +200% HP regen for 10 seconds
 */
export class RepairDroneModule extends BaseModule {
  private gameState: GameState;

  // Passive healing
  private baseHealPerSecond: number = 2;
  private healAccumulator: number = 0;

  // Regeneration Field state
  private regenFieldActive: boolean = false;
  private regenFieldMultiplier: number = 3; // +200% = 3x total

  // Visual elements
  private droneSprite: Phaser.GameObjects.Arc | null = null;
  private healEffect: Phaser.GameObjects.Graphics | null = null;

  constructor(
    scene: Phaser.Scene,
    moduleData: ModuleItemData,
    slotIndex: number,
    slotLevel: number,
    gameState: GameState
  ) {
    super(scene, moduleData, slotIndex, slotLevel);
    this.gameState = gameState;

    // Repair drone settings - no firing
    this.baseFireRate = Infinity;
    this.baseDamage = 0;

    // Create visual drone representation
    this.createDroneVisual();
  }

  /**
   * Create visual representation of the repair drone
   */
  private createDroneVisual(): void {
    // Small orbiting drone around tank
    this.droneSprite = this.scene.add.circle(this.x + 30, this.y - 40, 8, 0x00ff88, 1);
    this.droneSprite.setStrokeStyle(2, 0x00ffaa);

    // Orbit animation
    this.scene.tweens.add({
      targets: this.droneSprite,
      props: {
        x: {
          value: () => this.x + Math.cos(this.scene.time.now * 0.002) * 40,
          duration: 100,
        },
        y: {
          value: () => this.y - 40 + Math.sin(this.scene.time.now * 0.003) * 10,
          duration: 100,
        },
      },
      repeat: -1,
      yoyo: false,
    });
  }

  /**
   * Repair drone doesn't fire - does passive healing instead
   */
  public fire(_currentTime: number, enemies: Enemy[]): void {
    // Store enemies reference for auto-mode skill triggers
    this.updateEnemiesReference(enemies);
    // No firing - healing is done in update
  }

  /**
   * Update - handle passive healing
   */
  public update(time: number, delta: number): void {
    super.update(time, delta);

    // Calculate healing per frame
    let healRate = this.baseHealPerSecond;

    // Apply slot level bonus
    const slotMultiplier = 1 + this.slotLevel * 0.01;
    healRate *= slotMultiplier;

    // Apply regeneration field if active
    if (this.regenFieldActive) {
      healRate *= this.regenFieldMultiplier;
    }

    // Convert to per-frame healing
    const healThisFrame = healRate * (delta / 1000);
    this.healAccumulator += healThisFrame;

    // Apply healing when we have at least 1 HP to heal
    if (this.healAccumulator >= 1) {
      const healAmount = Math.floor(this.healAccumulator);
      this.gameState.heal(healAmount);
      this.healAccumulator -= healAmount;

      // Visual feedback for healing (periodically)
      if (Math.random() < 0.1) {
        this.showHealEffect();
      }
    }

    // Update drone position
    if (this.droneSprite) {
      this.droneSprite.x = this.x + Math.cos(time * 0.002) * 40;
      this.droneSprite.y = this.y - 40 + Math.sin(time * 0.003) * 10;
    }
  }

  /**
   * Handle skill activation
   */
  protected onSkillActivate(skill: ModuleSkill, _enemies: Enemy[]): void {
    switch (skill.name) {
      case 'Emergency Repair':
        this.activateEmergencyRepair();
        break;
      case 'Regeneration Field':
        this.activateRegenerationField();
        break;
    }
  }

  /**
   * Handle skill end
   */
  protected onSkillEnd(skill: ModuleSkill): void {
    switch (skill.name) {
      case 'Regeneration Field':
        this.deactivateRegenerationField();
        break;
      // Emergency Repair is instant
    }
  }

  /**
   * Emergency Repair: Instantly heal 15% of max HP
   */
  private activateEmergencyRepair(): void {
    const tankStats = this.gameState.getTankStats();
    const healAmount = Math.floor(tankStats.maxHP * 0.15);

    this.gameState.heal(healAmount);

    // Big healing visual
    this.showEmergencyRepairEffect();

    if (import.meta.env.DEV) {
      console.log(`[RepairDrone] Emergency Repair healed ${healAmount} HP`);
    }
  }

  /**
   * Regeneration Field: +200% HP regen for 10 seconds
   */
  private activateRegenerationField(): void {
    this.regenFieldActive = true;

    // Visual feedback
    this.showRegenerationFieldEffect();

    if (import.meta.env.DEV) {
      console.log('[RepairDrone] Regeneration Field activated!');
    }
  }

  private deactivateRegenerationField(): void {
    this.regenFieldActive = false;

    if (import.meta.env.DEV) {
      console.log('[RepairDrone] Regeneration Field ended');
    }
  }

  /**
   * Small heal particle effect
   */
  private showHealEffect(): void {
    const x = this.x + Phaser.Math.Between(-20, 20);
    const y = this.y + Phaser.Math.Between(-30, 10);

    const particle = this.scene.add.text(x, y, '+', {
      fontSize: '12px',
      color: '#00ff88',
    });

    this.scene.tweens.add({
      targets: particle,
      y: y - 20,
      alpha: 0,
      duration: 500,
      onComplete: () => particle.destroy(),
    });
  }

  /**
   * Emergency repair effect - big healing burst
   */
  private showEmergencyRepairEffect(): void {
    // Green burst
    const burst = this.scene.add.circle(this.x, this.y, 10, 0x00ff88, 0.8);

    this.scene.tweens.add({
      targets: burst,
      scale: 8,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => burst.destroy(),
    });

    // Plus signs flying outward
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.text(this.x, this.y, '+', {
        fontSize: '16px',
        color: '#00ff88',
        fontStyle: 'bold',
      });

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 60,
        y: this.y + Math.sin(angle) * 60,
        alpha: 0,
        duration: 600,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Regeneration field effect - pulsing aura
   */
  private showRegenerationFieldEffect(): void {
    // Create pulsing green ring
    const ring = this.scene.add.circle(this.x, this.y, 30, 0x00ff88, 0);
    ring.setStrokeStyle(3, 0x00ff88, 0.8);

    this.scene.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 800,
      repeat: 5,
      onComplete: () => ring.destroy(),
    });
  }

  /**
   * Check if regeneration field is active
   */
  public isRegenFieldActive(): boolean {
    return this.regenFieldActive;
  }

  /**
   * Get current heal rate per second
   */
  public getHealRate(): number {
    let rate = this.baseHealPerSecond;
    rate *= 1 + this.slotLevel * 0.01;
    if (this.regenFieldActive) {
      rate *= this.regenFieldMultiplier;
    }
    return rate;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.droneSprite) {
      this.droneSprite.destroy();
      this.droneSprite = null;
    }
    if (this.healEffect) {
      this.healEffect.destroy();
      this.healEffect = null;
    }
    super.destroy();
  }
}
