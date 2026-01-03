import Phaser from 'phaser';
import { IPoolable } from '../managers/PoolManager';
import { EnemyConfig, EnemyType, EnemyCategory } from '../types/EnemyTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';
import { getSettingsManager } from '../managers/SettingsManager';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Enemy - Base class for all enemy types
 *
 * Implements IPoolable for object pooling.
 * Enemies move from right to left toward the tank.
 *
 * Features:
 * - Poolable (activate/deactivate lifecycle)
 * - Movement toward tank
 * - Health management
 * - Attack logic
 * - Death handling with loot emission
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite implements IPoolable {
  protected eventManager: EventManager;

  // Configuration (set on activation)
  protected config: EnemyConfig | null = null;
  protected enemyId: string = '';

  // State
  protected currentHP: number = 0;
  protected maxHP: number = 0;
  protected lastAttackTime: number = 0;
  protected attackCooldown: number = 1000; // ms between attacks

  // Visual
  protected healthBar: Phaser.GameObjects.Graphics | null = null;
  protected lastHealthPercent: number = 1; // Track for redraw optimization

  // Constants
  private static readonly HEALTH_BAR_WIDTH = 30;
  private static readonly HEALTH_BAR_HEIGHT = 4;
  private static readonly HEALTH_BAR_OFFSET_Y = -40;
  private static readonly STOP_X_POSITION = 400; // Stop 200px from tank (tank is at x=200)
  private static idCounter: number = 0;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    super(scene, x, y, 'imp-run-1'); // Default texture, will be changed on activate

    this.eventManager = getEventManager();

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Initial state - inactive
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * Activate this enemy from the pool
   * Resets all state and starts movement
   */
  public activate(x: number, y: number, config: EnemyConfig): void {
    this.config = config;
    this.enemyId = `enemy_${config.type}_${++Enemy.idCounter}`;

    if (import.meta.env.DEV) {
      console.log(`[Enemy] Activated ${this.enemyId} at (${x}, ${y})`);
    }

    // Set origin at bottom center so enemy stands on ground
    this.setOrigin(0.5, 1);

    // Reset position
    this.setPosition(x, y);

    // Reset health
    this.maxHP = config.hp;
    this.currentHP = config.hp;
    this.lastHealthPercent = -1; // Force initial health bar draw

    // Reset attack timing
    this.lastAttackTime = 0;

    // Make visible and active
    this.setActive(true);
    this.setVisible(true);

    // Apply visual FIRST so we have correct texture dimensions
    this.applyVisualsByCategory(config.category);

    // Enable physics body and set hitbox AFTER texture is set
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setEnable(true);
      // Reset body position explicitly to match sprite
      body.reset(x, y);

      // Set tall hitbox from ground level to 2x sprite height
      // This ensures projectiles can hit enemies regardless of visual height
      const spriteHeight = this.displayHeight || 32;
      const spriteWidth = this.displayWidth || 32;
      const hitboxHeight = spriteHeight * 2;
      const hitboxWidth = Math.max(24, spriteWidth * 0.6);

      body.setSize(hitboxWidth, hitboxHeight);
      // Offset so bottom of hitbox aligns with sprite feet (origin is 0.5, 1)
      // Use displayWidth/displayHeight to match the scaled sprite
      body.setOffset(
        (spriteWidth - hitboxWidth) / 2,
        spriteHeight - hitboxHeight
      );
    }

    // Set velocity to move left toward tank (after body reset)
    this.setVelocityX(-config.speed);
    this.setVelocityY(0);

    // Create health bar
    this.createHealthBar();
  }

  /**
   * Deactivate this enemy and return to pool
   */
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);

    // Disable physics body
    (this.body as Phaser.Physics.Arcade.Body)?.setEnable(false);

    // Destroy health bar
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }

    this.config = null;
  }

  private applyVisualsByCategory(category: EnemyCategory): void {
    if (!this.config) return;

    // Set texture and animation based on enemy type
    this.applyTextureByType(this.config.type);

    // Apply scale based on category (on top of base scale)
    let categoryScale = 1;
    switch (category) {
      case EnemyCategory.Fodder:
        categoryScale = 1;
        break;
      case EnemyCategory.Elite:
        categoryScale = 1.3;
        break;
      case EnemyCategory.SuperElite:
        categoryScale = 1.6;
        break;
      case EnemyCategory.Boss:
        categoryScale = 2.5;
        break;
    }

    // Apply final scale (base scale * category multiplier)
    const baseScale = this.getBaseScaleForType(this.config.type);
    this.setScale(baseScale * categoryScale);

    // Clear any previous tint - let the actual sprites show their colors
    this.clearTint();
  }

  private applyTextureByType(type: EnemyType): void {
    // Set texture and play animation based on enemy type
    switch (type) {
      case EnemyType.Imp:
        this.setTexture('imp-run-1');
        if (this.scene.anims.exists('imp-run')) {
          this.play('imp-run');
        }
        break;

      case EnemyType.Hellhound:
        this.setTexture('hellhound-run-1');
        if (this.scene.anims.exists('hellhound-run')) {
          this.play('hellhound-run');
        }
        break;

      case EnemyType.PossessedSoldier:
        this.setTexture('soldier-1');
        if (this.scene.anims.exists('soldier-walk')) {
          this.play('soldier-walk');
        }
        break;

      case EnemyType.FireSkull:
        this.setTexture('fire-skull');
        // Fire skull is static, no animation
        this.stop();
        break;

      case EnemyType.CorruptedSentinel:
        this.setTexture('sentinel-idle');
        // Boss uses idle texture
        this.stop();
        break;

      // Elite enemies - use soldier sprite with tint until we have specific sprites
      case EnemyType.Demon:
      case EnemyType.Necromancer:
      case EnemyType.ShadowFiend:
      case EnemyType.InfernalWarrior:
        this.setTexture('soldier-1');
        if (this.scene.anims.exists('soldier-walk')) {
          this.play('soldier-walk');
        }
        // Apply tint for elites to differentiate
        this.setTint(0xff8800); // Orange tint for elites
        break;

      // Super Elite enemies
      case EnemyType.ArchDemon:
      case EnemyType.VoidReaver:
        this.setTexture('soldier-1');
        if (this.scene.anims.exists('soldier-walk')) {
          this.play('soldier-walk');
        }
        this.setTint(0xaa00ff); // Purple tint for super elites
        break;

      // Other bosses
      case EnemyType.InfernalWarlord:
      case EnemyType.LordOfFlames:
        this.setTexture('sentinel-idle');
        this.setTint(0xff4400); // Red-orange tint for flame bosses
        this.stop();
        break;

      default:
        // Fallback to imp
        this.setTexture('imp-run-1');
        if (this.scene.anims.exists('imp-run')) {
          this.play('imp-run');
        }
        break;
    }
  }

  private getBaseScaleForType(type: EnemyType): number {
    // Base scale for each enemy type to make them visually appropriate
    switch (type) {
      case EnemyType.Imp:
        return 2; // Small creature, scale up from 16x16
      case EnemyType.Hellhound:
        return 1.5; // Medium size, 48x32 sprite
      case EnemyType.PossessedSoldier:
        return 1.5; // Human-sized, 32x32 sprite
      case EnemyType.FireSkull:
        return 2; // Small floating skull
      case EnemyType.CorruptedSentinel:
        return 1; // Boss is already large
      default:
        return 1.5;
    }
  }

  private createHealthBar(): void {
    // Check if health bars are enabled in settings
    const settings = getSettingsManager();
    if (!settings.showHealthBars) return;

    if (this.healthBar) {
      this.healthBar.destroy();
    }

    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  /**
   * Update health bar position only (called every frame - cheap operation)
   */
  private updateHealthBarPosition(): void {
    if (!this.healthBar || !this.active) return;

    // Just update the graphics object position - no redraw needed
    const barWidth = Enemy.HEALTH_BAR_WIDTH;
    this.healthBar.x = this.x - barWidth / 2;
    this.healthBar.y = this.y + Enemy.HEALTH_BAR_OFFSET_Y;
  }

  /**
   * Redraw health bar (only called when health changes)
   */
  private redrawHealthBar(): void {
    if (!this.healthBar || !this.active) return;

    const healthPercent = this.currentHP / this.maxHP;

    // Skip redraw if health hasn't changed significantly
    if (Math.abs(healthPercent - this.lastHealthPercent) < 0.01) return;
    this.lastHealthPercent = healthPercent;

    const barWidth = Enemy.HEALTH_BAR_WIDTH;
    const barHeight = Enemy.HEALTH_BAR_HEIGHT;

    this.healthBar.clear();

    // Draw at local origin (0,0) - position is set by graphics object x,y
    // Background
    this.healthBar.fillStyle(0x333333, 1);
    this.healthBar.fillRect(0, 0, barWidth, barHeight);

    // Health bar color
    let color = 0x00ff00;
    if (healthPercent <= 0.3) {
      color = 0xff0000;
    } else if (healthPercent <= 0.6) {
      color = 0xffff00;
    }

    // Health fill
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(1, 1, (barWidth - 2) * healthPercent, barHeight - 2);
  }

  /**
   * Legacy method for compatibility - redirects to appropriate method
   */
  private updateHealthBar(): void {
    // Check if health bars are enabled in settings
    const settings = getSettingsManager();
    if (!settings.showHealthBars) {
      if (this.healthBar) {
        this.healthBar.clear();
      }
      return;
    }

    // Initial draw
    this.redrawHealthBar();
    this.updateHealthBarPosition();
  }

  /**
   * Deal damage to this enemy
   */
  public takeDamage(amount: number, isCrit: boolean = false): void {
    if (!this.active || !this.config) return;

    this.currentHP -= amount;
    this.redrawHealthBar(); // Only redraw when health changes

    // Emit damage event
    this.eventManager.emit(GameEvents.DAMAGE_DEALT, {
      targetId: this.enemyId,
      targetType: 'enemy',
      sourceId: 'player-tank',
      sourceType: 'module',
      damage: amount,
      isCrit,
      remainingHealth: Math.max(0, this.currentHP),
      maxHealth: this.maxHP,
    });

    // Visual feedback
    this.flashWhite();

    // Check for death
    if (this.currentHP <= 0) {
      this.die();
    }
  }

  private flashWhite(): void {
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active && this.config) {
        // Restore the appropriate tint based on enemy type
        this.restoreTint();
      }
    });
  }

  /**
   * Restore the correct tint for this enemy type (for elite/super elite visual distinction)
   */
  private restoreTint(): void {
    if (!this.config) return;

    switch (this.config.type) {
      // Elite enemies - orange tint
      case EnemyType.Demon:
      case EnemyType.Necromancer:
      case EnemyType.ShadowFiend:
      case EnemyType.InfernalWarrior:
        this.setTint(0xff8800);
        break;
      // Super Elite enemies - purple tint
      case EnemyType.ArchDemon:
      case EnemyType.VoidReaver:
        this.setTint(0xaa00ff);
        break;
      // Flame bosses - red-orange tint
      case EnemyType.InfernalWarlord:
      case EnemyType.LordOfFlames:
        this.setTint(0xff4400);
        break;
      // All other enemies - no tint
      default:
        this.clearTint();
        break;
    }
  }

  /**
   * Handle enemy death
   * Visual effect: Flash white → hold → fade out
   */
  protected die(): void {
    if (!this.config) return;

    const timing = GAME_CONFIG.EFFECT_TIMING;

    // Emit death event with rewards
    this.eventManager.emit(GameEvents.ENEMY_DIED, {
      enemyId: this.enemyId,
      enemyType: this.config.type,
      killedBy: 'tank',
      xpAwarded: this.config.xpReward,
      goldAwarded: this.config.goldReward,
    });

    // Stop any animations and movement
    this.stop();
    this.setVelocity(0, 0);

    // Hide health bar immediately
    if (this.healthBar) {
      this.healthBar.setVisible(false);
    }

    // Store original scale for death animation
    const originalScale = this.scale;

    // Phase 1: Flash white (instant tint)
    this.setTint(0xffffff);

    // Phase 2: Quick scale pop during flash
    this.scene.tweens.add({
      targets: this,
      scaleX: originalScale * 1.2,
      scaleY: originalScale * 1.2,
      duration: timing.DEATH_FLASH_DURATION / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Phase 3: After flash duration, fade out
    this.scene.time.delayedCall(timing.DEATH_FLASH_DURATION, () => {
      if (!this.active) return;

      // Clear tint for proper fade visual
      this.clearTint();

      // Fade out with scale reduction
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scaleX: originalScale * 0.5,
        scaleY: originalScale * 0.5,
        duration: timing.DEATH_FADE_DURATION,
        ease: 'Quad.easeIn',
        onComplete: () => {
          // Reset state before returning to pool
          this.alpha = 1;
          this.setScale(originalScale);
          this.deactivate();
        },
      });
    });
  }

  /**
   * Check if this enemy can attack
   */
  public canAttack(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.attackCooldown;
  }

  /**
   * Execute attack on target (tank)
   */
  public attack(currentTime: number): number {
    if (!this.config || !this.canAttack(currentTime)) return 0;

    this.lastAttackTime = currentTime;

    // Visual feedback
    this.animateAttack();

    return this.config.damage;
  }

  private animateAttack(): void {
    // Quick lunge animation
    const originalX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: originalX - 10,
      duration: 50,
      yoyo: true,
      ease: 'Power2',
    });
  }

  /**
   * Get attack range (how close enemy needs to be to attack)
   */
  public getAttackRange(): number {
    // Default melee range
    return 50;
  }

  /**
   * Get current position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Get enemy config
   */
  public getConfig(): EnemyConfig | null {
    return this.config;
  }

  /**
   * Get enemy ID
   */
  public getId(): string {
    return this.enemyId;
  }

  /**
   * Check if enemy is alive
   */
  public isAlive(): boolean {
    return this.active && this.currentHP > 0;
  }

  /**
   * Update loop
   */
  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // Stop at tank position
    if (this.x <= Enemy.STOP_X_POSITION) {
      this.setVelocityX(0);
      this.x = Enemy.STOP_X_POSITION;
    }

    // Only update health bar position (cheap), not redraw
    this.updateHealthBarPosition();

    // Deactivate if somehow off screen
    if (this.x < -50) {
      this.deactivate();
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    super.destroy();
  }
}

/**
 * Enemy configurations for Act 1
 * These define the base stats for each enemy type
 */
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  // Fodder enemies
  [EnemyType.Imp]: {
    type: EnemyType.Imp,
    category: EnemyCategory.Fodder,
    hp: 50,
    damage: 5,
    speed: 80,
    xpReward: 10,
    goldReward: 5,
  },
  [EnemyType.Hellhound]: {
    type: EnemyType.Hellhound,
    category: EnemyCategory.Fodder,
    hp: 40,
    damage: 8,
    speed: 120,
    xpReward: 12,
    goldReward: 6,
  },
  [EnemyType.PossessedSoldier]: {
    type: EnemyType.PossessedSoldier,
    category: EnemyCategory.Fodder,
    hp: 70,
    damage: 6,
    speed: 60,
    xpReward: 15,
    goldReward: 8,
  },
  [EnemyType.FireSkull]: {
    type: EnemyType.FireSkull,
    category: EnemyCategory.Fodder,
    hp: 30,
    damage: 10,
    speed: 100,
    xpReward: 14,
    goldReward: 7,
  },

  // Elite enemies
  [EnemyType.Demon]: {
    type: EnemyType.Demon,
    category: EnemyCategory.Elite,
    hp: 200,
    damage: 15,
    speed: 70,
    xpReward: 50,
    goldReward: 25,
  },
  [EnemyType.Necromancer]: {
    type: EnemyType.Necromancer,
    category: EnemyCategory.Elite,
    hp: 150,
    damage: 12,
    speed: 50,
    xpReward: 60,
    goldReward: 30,
  },
  [EnemyType.ShadowFiend]: {
    type: EnemyType.ShadowFiend,
    category: EnemyCategory.Elite,
    hp: 120,
    damage: 20,
    speed: 130,
    xpReward: 55,
    goldReward: 28,
  },
  [EnemyType.InfernalWarrior]: {
    type: EnemyType.InfernalWarrior,
    category: EnemyCategory.Elite,
    hp: 180,
    damage: 18,
    speed: 60,
    xpReward: 65,
    goldReward: 35,
  },

  // Super Elite enemies
  [EnemyType.ArchDemon]: {
    type: EnemyType.ArchDemon,
    category: EnemyCategory.SuperElite,
    hp: 500,
    damage: 25,
    speed: 50,
    xpReward: 150,
    goldReward: 80,
  },
  [EnemyType.VoidReaver]: {
    type: EnemyType.VoidReaver,
    category: EnemyCategory.SuperElite,
    hp: 400,
    damage: 35,
    speed: 90,
    xpReward: 180,
    goldReward: 100,
  },

  // Bosses
  [EnemyType.CorruptedSentinel]: {
    type: EnemyType.CorruptedSentinel,
    category: EnemyCategory.Boss,
    hp: 2500,
    damage: 25,
    speed: 45,
    xpReward: 600,
    goldReward: 400,
  },
  [EnemyType.InfernalWarlord]: {
    type: EnemyType.InfernalWarlord,
    category: EnemyCategory.Boss,
    hp: 2000,
    damage: 30,
    speed: 40,
    xpReward: 500,
    goldReward: 300,
  },
  [EnemyType.LordOfFlames]: {
    type: EnemyType.LordOfFlames,
    category: EnemyCategory.Boss,
    hp: 3000,
    damage: 40,
    speed: 35,
    xpReward: 750,
    goldReward: 500,
  },
};
