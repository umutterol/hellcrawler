import Phaser from 'phaser';
import { IPoolable } from '../managers/PoolManager';
import { EnemyConfig, EnemyType, EnemyCategory } from '../types/EnemyTypes';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';

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

  // Constants
  private static readonly HEALTH_BAR_WIDTH = 30;
  private static readonly HEALTH_BAR_HEIGHT = 4;
  private static readonly HEALTH_BAR_OFFSET_Y = -20;
  private static readonly STOP_X_POSITION = 280; // Stop near tank (tank is at x=200)
  private static idCounter: number = 0;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    super(scene, x, y, 'enemy-placeholder');

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

    // Reset attack timing
    this.lastAttackTime = 0;

    // Make visible and active
    this.setActive(true);
    this.setVisible(true);

    // Enable physics body and explicitly reset position
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setEnable(true);
      // Reset body position explicitly to match sprite
      body.reset(x, y);
    }

    // Set velocity to move left toward tank (after body reset)
    this.setVelocityX(-config.speed);
    this.setVelocityY(0);

    // Apply visual based on category
    this.applyVisualsByCategory(config.category);

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
    // Scale and tint based on category
    switch (category) {
      case EnemyCategory.Fodder:
        this.setScale(1);
        this.setTint(0xff4444); // Red
        break;
      case EnemyCategory.Elite:
        this.setScale(1.3);
        this.setTint(0xff8800); // Orange
        break;
      case EnemyCategory.SuperElite:
        this.setScale(1.6);
        this.setTint(0xaa00ff); // Purple
        break;
      case EnemyCategory.Boss:
        this.setScale(2.5);
        this.setTint(0xffff00); // Yellow
        break;
    }
  }

  private createHealthBar(): void {
    if (this.healthBar) {
      this.healthBar.destroy();
    }

    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    if (!this.healthBar || !this.active) return;

    const healthPercent = this.currentHP / this.maxHP;
    const barWidth = Enemy.HEALTH_BAR_WIDTH;
    const barHeight = Enemy.HEALTH_BAR_HEIGHT;

    this.healthBar.clear();

    // Position above enemy
    const barX = this.x - barWidth / 2;
    const barY = this.y + Enemy.HEALTH_BAR_OFFSET_Y;

    // Background
    this.healthBar.fillStyle(0x333333, 1);
    this.healthBar.fillRect(barX, barY, barWidth, barHeight);

    // Health bar color
    let color = 0x00ff00;
    if (healthPercent <= 0.3) {
      color = 0xff0000;
    } else if (healthPercent <= 0.6) {
      color = 0xffff00;
    }

    // Health fill
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(barX + 1, barY + 1, (barWidth - 2) * healthPercent, barHeight - 2);
  }

  /**
   * Deal damage to this enemy
   */
  public takeDamage(amount: number, isCrit: boolean = false): void {
    if (!this.active || !this.config) return;

    this.currentHP -= amount;
    this.updateHealthBar();

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
        this.applyVisualsByCategory(this.config.category);
      }
    });
  }

  /**
   * Handle enemy death
   */
  protected die(): void {
    if (!this.config) return;

    // Emit death event with rewards
    this.eventManager.emit(GameEvents.ENEMY_DIED, {
      enemyId: this.enemyId,
      enemyType: this.config.type,
      killedBy: 'tank',
      xpAwarded: this.config.xpReward,
      goldAwarded: this.config.goldReward,
    });

    // Death animation (simple fade)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => {
        this.alpha = 1;
        this.deactivate();
      },
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

    // Update health bar position
    this.updateHealthBar();

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
