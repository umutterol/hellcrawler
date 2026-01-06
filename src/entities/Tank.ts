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

    // Note: Physics hitboxes removed - enemy melee range is now handled by
    // HitboxManager using distance-based checks in CombatSystem
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
   * Get the melee range X boundaries (where enemies can attack the tank)
   * Uses GAME_CONFIG.STOP_DISTANCE_FROM_TANK for consistent range
   */
  public getMeleeRangeX(): { left: number; right: number } {
    const range = GAME_CONFIG.STOP_DISTANCE_FROM_TANK;
    return {
      left: this.x - range,
      right: this.x + range,
    };
  }

  /**
   * Cleanup on destruction
   */
  public destroy(): void {
    this.eventManager.off(GameEvents.DAMAGE_TAKEN, this.onDamageTaken, this);
    this.eventManager.off(GameEvents.TANK_REVIVED, this.onRevived, this);
    this.eventManager.off(GameEvents.TANK_HEALED, this.onHealed, this);
    super.destroy();
  }
}
