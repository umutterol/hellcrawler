import Phaser from 'phaser';
import { StatType } from '../types/GameTypes';
import { GameState, getGameState } from '../state/GameState';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';
import { CANNON_CONFIG, calculateDamage } from '../config/Constants';

/**
 * Tank - Main player entity
 *
 * The tank is stationary and cannot die. When HP reaches 0, it enters
 * Near Death state with reduced attack speed until revived.
 *
 * Features:
 * - Health management with near-death system
 * - Built-in cannon with auto-fire
 * - HP regeneration
 * - Module slot container
 */
export class Tank extends Phaser.GameObjects.Container {
  private gameState: GameState;
  private eventManager: EventManager;

  // Visual components
  private bodySprite!: Phaser.GameObjects.Sprite;
  private cannonSprite!: Phaser.GameObjects.Sprite;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarBg!: Phaser.GameObjects.Graphics;

  // Physics hitbox for enemy collision
  private hitbox!: Phaser.Physics.Arcade.Sprite;

  // Combat state
  private isNearDeath: boolean = false;
  private nearDeathTimer: number = 0;
  private lastCannonFireTime: number = 0;
  private cannonCooldown: number;

  // Constants
  private static readonly NEAR_DEATH_THRESHOLD = 0.2;
  private static readonly HEALTH_BAR_WIDTH = 120;
  private static readonly HEALTH_BAR_HEIGHT = 10;
  private static readonly HEALTH_BAR_OFFSET_Y = -50;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.gameState = getGameState();
    this.eventManager = getEventManager();
    this.cannonCooldown = CANNON_CONFIG.FIRE_RATE * 1000; // Convert to ms

    // Create visual components
    this.createSprites();
    this.createHealthBar();

    // Add to scene
    scene.add.existing(this);

    // Subscribe to events
    this.subscribeToEvents();

    if (import.meta.env.DEV) {
      console.log('[Tank] Created at', x, y);
    }
  }

  private createSprites(): void {
    // Tank body
    this.bodySprite = this.scene.add.sprite(0, 0, 'tank-placeholder');
    this.bodySprite.setOrigin(0.5, 1);
    this.add(this.bodySprite);

    // Cannon (part of the tank texture for now)
    this.cannonSprite = this.scene.add.sprite(40, -32, 'bullet-placeholder');
    this.cannonSprite.setScale(2);
    this.cannonSprite.setVisible(false); // Hidden, part of main sprite
    this.add(this.cannonSprite);

    // Create physics hitbox for enemy collision detection
    // Position it at the tank's world position with a reasonable size
    this.hitbox = this.scene.physics.add.sprite(this.x, this.y - 32, 'tank-placeholder');
    this.hitbox.setVisible(false); // Invisible, just for physics
    this.hitbox.setImmovable(true);
    this.hitbox.body?.setSize(80, 64); // Tank-sized hitbox
    this.hitbox.setData('tank', this); // Reference back to tank
  }

  private createHealthBar(): void {
    const barWidth = Tank.HEALTH_BAR_WIDTH;
    const barHeight = Tank.HEALTH_BAR_HEIGHT;
    const offsetY = Tank.HEALTH_BAR_OFFSET_Y;

    // Background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0x333333, 1);
    this.healthBarBg.fillRect(-barWidth / 2, offsetY, barWidth, barHeight);
    this.healthBarBg.lineStyle(2, 0x000000, 1);
    this.healthBarBg.strokeRect(-barWidth / 2, offsetY, barWidth, barHeight);
    this.add(this.healthBarBg);

    // Foreground (health)
    this.healthBar = this.scene.add.graphics();
    this.add(this.healthBar);

    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    const stats = this.gameState.getTankStats();
    const healthPercent = stats.currentHP / stats.maxHP;
    const barWidth = Tank.HEALTH_BAR_WIDTH;
    const barHeight = Tank.HEALTH_BAR_HEIGHT;
    const offsetY = Tank.HEALTH_BAR_OFFSET_Y;

    this.healthBar.clear();

    // Color based on health percentage
    let color = 0x00ff00; // Green
    if (healthPercent <= 0.2) {
      color = 0xff0000; // Red - near death
    } else if (healthPercent <= 0.5) {
      color = 0xffff00; // Yellow - caution
    }

    // Draw health bar
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(
      -barWidth / 2 + 2,
      offsetY + 2,
      (barWidth - 4) * healthPercent,
      barHeight - 4
    );
  }

  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.on(GameEvents.TANK_REVIVED, this.onRevived, this);
  }

  private onDamageTaken(payload: { targetType: string; remainingHealth: number }): void {
    if (payload.targetType !== 'tank') return;

    this.updateHealthBar();
    this.flashDamage();

    // Check for near-death
    const stats = this.gameState.getTankStats();
    const healthPercent = stats.currentHP / stats.maxHP;

    if (healthPercent <= Tank.NEAR_DEATH_THRESHOLD && !this.isNearDeath) {
      this.enterNearDeath();
    }
  }

  private onRevived(): void {
    this.exitNearDeath();
    this.updateHealthBar();
  }

  private flashDamage(): void {
    // Brief red flash on damage
    this.bodySprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.isNearDeath) {
        this.bodySprite.setTint(0xff6666); // Keep reddish in near-death
      } else {
        this.bodySprite.clearTint();
      }
    });
  }

  /**
   * Enter near-death state
   * Tank cannot die - instead it enters this reduced effectiveness state
   */
  public enterNearDeath(): void {
    if (this.isNearDeath) return;

    this.isNearDeath = true;
    this.nearDeathTimer = GAME_CONFIG.NEAR_DEATH_REVIVE_TIME * 1000;

    // Visual indication
    this.bodySprite.setTint(0xff6666);

    // Emit event
    this.eventManager.emit(GameEvents.NEAR_DEATH_ENTERED, {
      currentHealth: this.gameState.getTankStats().currentHP,
      maxHealth: this.gameState.getTankStats().maxHP,
      threshold: Tank.NEAR_DEATH_THRESHOLD,
      reviveTimeRemaining: GAME_CONFIG.NEAR_DEATH_REVIVE_TIME,
    });

    if (import.meta.env.DEV) {
      console.log('[Tank] Entered near-death state');
    }
  }

  /**
   * Exit near-death state (manual revive or timer)
   */
  public exitNearDeath(): void {
    if (!this.isNearDeath) return;

    this.isNearDeath = false;
    this.nearDeathTimer = 0;
    this.bodySprite.clearTint();

    if (import.meta.env.DEV) {
      console.log('[Tank] Exited near-death state');
    }
  }

  /**
   * Manually revive the tank
   */
  public revive(): void {
    this.gameState.revive();
  }

  /**
   * Get the attack speed multiplier (reduced in near-death)
   */
  public getAttackSpeedMultiplier(): number {
    if (this.isNearDeath) {
      return GAME_CONFIG.NEAR_DEATH_ATTACK_SPEED_MULTIPLIER;
    }
    return 1.0;
  }

  /**
   * Check if cannon can fire
   */
  public canFireCannon(currentTime: number): boolean {
    const cooldown = this.cannonCooldown / this.getAttackSpeedMultiplier();
    return currentTime - this.lastCannonFireTime >= cooldown;
  }

  /**
   * Fire the built-in cannon
   * Returns the firing position for projectile spawning
   */
  public fireCannon(currentTime: number): { x: number; y: number; damage: number } | null {
    if (!this.canFireCannon(currentTime)) {
      return null;
    }

    this.lastCannonFireTime = currentTime;

    // Calculate cannon damage
    // Built-in cannon uses tank level as slot level, no module stats
    const baseDamage = 25; // Base cannon damage
    const tankLevel = this.gameState.getTankLevel();
    const statBonus = this.gameState.getStatLevel(StatType.Damage) * 0.02;
    const critChance = this.gameState.getStatLevel(StatType.CritChance) * 0.5;
    const critBonus = this.gameState.getStatLevel(StatType.CritDamage) * 0.05;
    const isCrit = Math.random() * 100 < critChance;

    const damage = calculateDamage(baseDamage, tankLevel, statBonus, isCrit, critBonus);

    // Cannon muzzle position - fire at enemy center height
    // Tank is at ground level (Y = HEIGHT - 100 = 980)
    // Enemy placeholder is 32px with origin (0.5, 1), so center is at Y - 16 = 964
    const muzzleX = this.x + 70;
    const muzzleY = this.y - 16; // Fire at enemy center height (964)

    // Visual feedback
    this.animateCannonFire();

    if (import.meta.env.DEV) {
      console.log(`[Tank] Cannon fired at (${muzzleX}, ${muzzleY}), damage=${damage}`);
    }

    return { x: muzzleX, y: muzzleY, damage };
  }

  private animateCannonFire(): void {
    // Brief recoil animation
    this.scene.tweens.add({
      targets: this.bodySprite,
      x: -5,
      duration: 50,
      yoyo: true,
      ease: 'Power2',
    });
  }

  /**
   * Update loop - handles HP regen, near-death timer
   */
  public update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    // HP Regeneration
    const stats = this.gameState.getTankStats();
    if (stats.currentHP < stats.maxHP && stats.hpRegen > 0) {
      this.gameState.heal(stats.hpRegen * deltaSeconds);
      this.updateHealthBar();
    }

    // Near-death timer countdown
    if (this.isNearDeath) {
      this.nearDeathTimer -= delta;
      if (this.nearDeathTimer <= 0) {
        this.revive();
      }
    }
  }

  /**
   * Get tank's world position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Check if tank is in near-death state
   */
  public getIsNearDeath(): boolean {
    return this.isNearDeath;
  }

  /**
   * Get remaining near-death timer in seconds
   */
  public getNearDeathTimeRemaining(): number {
    return this.nearDeathTimer / 1000;
  }

  /**
   * Get the physics hitbox for collision detection
   */
  public getHitbox(): Phaser.Physics.Arcade.Sprite {
    return this.hitbox;
  }

  /**
   * Cleanup on destruction
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.off(GameEvents.TANK_REVIVED, this.onRevived, this);
    if (this.hitbox) {
      this.hitbox.destroy();
    }
    super.destroy();
  }
}
