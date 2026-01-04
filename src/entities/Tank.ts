import Phaser from 'phaser';
import { GameState, getGameState } from '../state/GameState';
import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Tank - Main player entity
 *
 * The tank is stationary at screen center and cannot die. When HP reaches 0,
 * it enters Near Death state with reduced attack speed until revived.
 *
 * Features:
 * - Centered position for bidirectional combat
 * - Health management with near-death system
 * - HP regeneration
 * - Module slot container (all damage comes from modules)
 *
 * Note: Built-in cannon removed - all damage now comes from equipped modules
 */
export class Tank extends Phaser.GameObjects.Container {
  private gameState: GameState;
  private eventManager: EventManager;

  // Visual components
  private bodySprite!: Phaser.GameObjects.Sprite;

  // Physics hitbox for enemy collision (both sides for bidirectional combat)
  private hitboxLeft!: Phaser.Physics.Arcade.Sprite;
  private hitboxRight!: Phaser.Physics.Arcade.Sprite;

  // Combat state
  private isNearDeath: boolean = false;
  private nearDeathTimer: number = 0;

  // Constants
  private static readonly NEAR_DEATH_THRESHOLD = 0.2;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.gameState = getGameState();
    this.eventManager = getEventManager();

    // Create visual components
    this.createSprites();

    // Add to scene
    scene.add.existing(this);

    // Subscribe to events
    this.subscribeToEvents();

    if (import.meta.env.DEV) {
      console.log('[Tank] Created at', x, y);
    }
  }

  private createSprites(): void {
    // Tank body - using tank sprite
    this.bodySprite = this.scene.add.sprite(0, 0, 'tank-1');
    this.bodySprite.setOrigin(0.5, 1);
    this.bodySprite.setScale(2); // Scale up the 16-bit sprite
    this.add(this.bodySprite);

    // Create physics hitboxes for enemy collision detection (both sides for center tank)
    // Tank is at screen center, enemies approach from both left and right
    const hitboxWidth = 120;
    const hitboxHeight = 100;
    const hitboxOffsetX = 100; // Distance from tank center to hitbox center

    // Right hitbox - enemies from right stop here
    this.hitboxRight = this.scene.physics.add.sprite(
      this.x + hitboxOffsetX,
      this.y,
      'tank-placeholder'
    );
    this.hitboxRight.setVisible(import.meta.env.DEV);
    this.hitboxRight.setAlpha(0.3);
    this.hitboxRight.setTint(0x00ff00); // Green for right
    this.hitboxRight.setImmovable(true);
    this.hitboxRight.setOrigin(0.5, 0.5);
    this.hitboxRight.setData('tank', this);
    this.hitboxRight.setData('side', 'right');

    const bodyRight = this.hitboxRight.body as Phaser.Physics.Arcade.Body;
    if (bodyRight) {
      bodyRight.setSize(hitboxWidth, hitboxHeight);
      const textureHalf = 16;
      bodyRight.setOffset(-hitboxWidth / 2 + textureHalf, -hitboxHeight / 2 + textureHalf);
    }

    // Left hitbox - enemies from left stop here
    this.hitboxLeft = this.scene.physics.add.sprite(
      this.x - hitboxOffsetX,
      this.y,
      'tank-placeholder'
    );
    this.hitboxLeft.setVisible(import.meta.env.DEV);
    this.hitboxLeft.setAlpha(0.3);
    this.hitboxLeft.setTint(0xff0000); // Red for left
    this.hitboxLeft.setImmovable(true);
    this.hitboxLeft.setOrigin(0.5, 0.5);
    this.hitboxLeft.setData('tank', this);
    this.hitboxLeft.setData('side', 'left');

    const bodyLeft = this.hitboxLeft.body as Phaser.Physics.Arcade.Body;
    if (bodyLeft) {
      bodyLeft.setSize(hitboxWidth, hitboxHeight);
      const textureHalf = 16;
      bodyLeft.setOffset(-hitboxWidth / 2 + textureHalf, -hitboxHeight / 2 + textureHalf);
    }

    if (import.meta.env.DEV) {
      const bRight = this.hitboxRight.body as Phaser.Physics.Arcade.Body;
      const bLeft = this.hitboxLeft.body as Phaser.Physics.Arcade.Body;
      console.log(`[Tank] Right hitbox covers x=${bRight.x}-${bRight.right}, y=${bRight.y}-${bRight.bottom}`);
      console.log(`[Tank] Left hitbox covers x=${bLeft.x}-${bLeft.right}, y=${bLeft.y}-${bLeft.bottom}`);
    }
  }

  private subscribeToEvents(): void {
    this.eventManager.on(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.on(GameEvents.TANK_REVIVED, this.onRevived, this);
    this.eventManager.on(GameEvents.TANK_HEALED, this.onHealed, this);
  }

  private onDamageTaken(payload: { targetType: string; remainingHealth: number }): void {
    if (payload.targetType !== 'tank') return;

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
  }

  private onHealed(): void {
    // Health updated in GameState - visual feedback could be added here
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
   * Update loop - handles HP regen, near-death timer
   */
  public update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    // HP Regeneration
    const stats = this.gameState.getTankStats();
    if (stats.currentHP < stats.maxHP && stats.hpRegen > 0) {
      this.gameState.heal(stats.hpRegen * deltaSeconds, 'regen');
      // Health bar update is handled by TANK_HEALED event listener
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
   * Get both physics hitboxes for collision detection (bidirectional combat)
   */
  public getHitboxes(): { left: Phaser.Physics.Arcade.Sprite; right: Phaser.Physics.Arcade.Sprite } {
    return { left: this.hitboxLeft, right: this.hitboxRight };
  }

  /**
   * Get the right hitbox (for backwards compatibility and right-side enemies)
   */
  public getHitbox(): Phaser.Physics.Arcade.Sprite {
    return this.hitboxRight;
  }

  /**
   * Get the left hitbox (for left-side enemies)
   */
  public getLeftHitbox(): Phaser.Physics.Arcade.Sprite {
    return this.hitboxLeft;
  }

  /**
   * Cleanup on destruction
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.off(GameEvents.TANK_REVIVED, this.onRevived, this);
    this.eventManager.off(GameEvents.TANK_HEALED, this.onHealed, this);
    if (this.hitboxLeft) {
      this.hitboxLeft.destroy();
    }
    if (this.hitboxRight) {
      this.hitboxRight.destroy();
    }
    super.destroy();
  }
}
