/**
 * GoreManager - Singleton orchestrator for the gore system
 * Manages pools, listens to enemy death events, spawns gore effects
 */

import Phaser from 'phaser';
import { getEventManager } from '../../managers/EventManager';
import { GameEvents, EnemyDiedPayload } from '../../types/GameEvents';
import { Gib } from './Gib';
import { BloodParticle } from './BloodParticle';
import {
  GibType,
  GoreIntensity,
  GoreEffectConfig,
  LARGE_GIB_TYPES,
  SMALL_GIB_TYPES,
  LARGE_BLOOD_TYPES,
  SMALL_BLOOD_TYPES,
} from './GoreTypes';
import {
  GORE_POOL_SIZES,
  GORE_SPAWN_COUNTS,
  GIB_VELOCITY,
  BLOOD_VELOCITY,
  GIB_SCALE,
  BLOOD_PARTICLE,
  SPLATTER,
  GORE_DEPTH,
  GORE_TIMING,
  DEFAULT_GORE_INTENSITY,
} from './GoreConfig';

/** Singleton instance */
let instance: GoreManager | null = null;

/**
 * Get the singleton GoreManager instance
 */
export function getGoreManager(): GoreManager {
  if (!instance) {
    instance = new GoreManager();
  }
  return instance;
}

export class GoreManager {
  /** Reference to the current scene */
  private scene: Phaser.Scene | null = null;

  /** Pool of gib objects */
  private gibPool: Gib[] = [];

  /** Pool of blood particles */
  private bloodPool: BloodParticle[] = [];

  /** Pool of ground splatter sprites */
  private splatterPool: Phaser.GameObjects.Sprite[] = [];

  /** Current gore intensity setting */
  private intensity: GoreIntensity = DEFAULT_GORE_INTENSITY;

  /** Whether the manager is initialized */
  private isInitialized: boolean = false;

  /** Bound update handler for scene events */
  private boundUpdate: ((time: number, delta: number) => void) | null = null;

  /** Bound enemy died handler */
  private boundOnEnemyDied: ((payload: EnemyDiedPayload) => void) | null = null;

  constructor() {
    // Private constructor for singleton
  }

  /**
   * Initialize the gore manager with a scene
   */
  init(scene: Phaser.Scene): void {
    if (this.isInitialized) {
      this.destroy();
    }

    this.scene = scene;
    this.intensity = DEFAULT_GORE_INTENSITY;

    // Create pools
    this.createGibPool();
    this.createBloodPool();
    this.createSplatterPool();

    // Set up update loop
    this.boundUpdate = this.update.bind(this);
    scene.events.on('update', this.boundUpdate);

    // Listen for enemy deaths
    this.boundOnEnemyDied = this.onEnemyDied.bind(this);
    getEventManager().on(GameEvents.ENEMY_DIED, this.boundOnEnemyDied);

    this.isInitialized = true;
  }

  /**
   * Clean up and destroy the manager
   */
  destroy(): void {
    if (!this.isInitialized || !this.scene) return;

    // Remove event listeners
    if (this.boundUpdate) {
      this.scene.events.off('update', this.boundUpdate);
      this.boundUpdate = null;
    }

    if (this.boundOnEnemyDied) {
      getEventManager().off(GameEvents.ENEMY_DIED, this.boundOnEnemyDied);
      this.boundOnEnemyDied = null;
    }

    // Destroy all pooled objects
    this.gibPool.forEach((gib) => gib.destroy());
    this.bloodPool.forEach((blood) => blood.destroy());
    this.splatterPool.forEach((splatter) => splatter.destroy());

    this.gibPool = [];
    this.bloodPool = [];
    this.splatterPool = [];

    this.scene = null;
    this.isInitialized = false;
  }

  /**
   * Create the gib object pool
   */
  private createGibPool(): void {
    if (!this.scene) return;

    for (let i = 0; i < GORE_POOL_SIZES.GIBS; i++) {
      const gib = new Gib(this.scene);
      this.gibPool.push(gib);
    }
  }

  /**
   * Create the blood particle pool
   */
  private createBloodPool(): void {
    if (!this.scene) return;

    for (let i = 0; i < GORE_POOL_SIZES.BLOOD_PARTICLES; i++) {
      const blood = new BloodParticle(this.scene);
      this.bloodPool.push(blood);
    }
  }

  /**
   * Create the ground splatter pool
   */
  private createSplatterPool(): void {
    if (!this.scene) return;

    for (let i = 0; i < GORE_POOL_SIZES.SPLATTERS; i++) {
      const splatter = this.scene.add.sprite(0, 0, LARGE_BLOOD_TYPES[0] ?? 'blood1');
      splatter.setDepth(GORE_DEPTH.SPLATTER);
      splatter.setActive(false);
      splatter.setVisible(false);
      this.splatterPool.push(splatter);
    }
  }

  /**
   * Get an inactive gib from the pool
   */
  private getGib(): Gib | null {
    for (const gib of this.gibPool) {
      if (!gib.getIsActive()) {
        return gib;
      }
    }
    return null;
  }

  /**
   * Get an inactive blood particle from the pool
   */
  private getBloodParticle(): BloodParticle | null {
    for (const blood of this.bloodPool) {
      if (!blood.getIsActive()) {
        return blood;
      }
    }
    return null;
  }

  /**
   * Get an inactive splatter from the pool
   */
  private getSplatter(): Phaser.GameObjects.Sprite | null {
    for (const splatter of this.splatterPool) {
      if (!splatter.active) {
        return splatter;
      }
    }
    return null;
  }

  /**
   * Handle enemy death event
   */
  private onEnemyDied(payload: EnemyDiedPayload): void {

    // Check if gore data is included in payload
    const goreData = (payload as EnemyDiedPayload & {
      x?: number;
      y?: number;
      scale?: number;
      tint?: number;
      width?: number;
      height?: number;
      isBoss?: boolean;
    });

    // Only spawn gore if we have position data
    if (goreData.x === undefined || goreData.y === undefined) {
      return;
    }
    this.spawnGoreEffect({
      x: goreData.x,
      y: goreData.y,
      enemyWidth: goreData.width ?? 32,
      enemyHeight: goreData.height ?? 32,
      enemyScale: goreData.scale ?? 1,
      enemyTint: goreData.tint,
      isBoss: goreData.isBoss ?? false,
    });
  }

  /**
   * Spawn a complete gore effect (gibs + blood + splatters)
   */
  spawnGoreEffect(config: GoreEffectConfig): void {
    if (!this.scene || this.intensity === GoreIntensity.Off) {
      return;
    }

    const spawnCounts = GORE_SPAWN_COUNTS[this.intensity];
    const enemyType = config.isBoss ? 'boss' : 'normal';

    // Spawn gibs
    const gibCount = spawnCounts.gibs[enemyType];
    this.spawnGibs(config, gibCount);

    // Spawn blood particles
    const bloodCount = spawnCounts.blood[enemyType];
    this.spawnBloodParticles(config, bloodCount);

    // Spawn initial ground splatters
    const splatterCount = spawnCounts.splatters[enemyType];
    for (let i = 0; i < splatterCount; i++) {
      const offsetX = Phaser.Math.Between(-config.enemyWidth / 2, config.enemyWidth / 2);
      this.spawnSplatter(config.x + offsetX, config.y + config.enemyHeight / 2);
    }
  }

  /**
   * Spawn gibs for a gore effect
   */
  private spawnGibs(config: GoreEffectConfig, count: number): void {
    // Spawn a mix of large and small gibs
    const largeCount = Math.ceil(count * 0.3); // 30% large
    const smallCount = count - largeCount;

    // Spawn large gibs (torso pieces)
    for (let i = 0; i < largeCount; i++) {
      const gib = this.getGib();
      if (!gib) break;

      const type = Phaser.Math.RND.pick(LARGE_GIB_TYPES);
      this.activateGib(gib, config, type, true);
    }

    // Spawn small gibs (limb pieces)
    for (let i = 0; i < smallCount; i++) {
      const gib = this.getGib();
      if (!gib) break;

      const type = Phaser.Math.RND.pick(SMALL_GIB_TYPES);
      this.activateGib(gib, config, type, false);
    }
  }

  /**
   * Activate a single gib with random parameters
   */
  private activateGib(
    gib: Gib,
    config: GoreEffectConfig,
    type: GibType,
    isLarge: boolean
  ): void {
    // Random spawn position within enemy bounds
    const spawnX = config.x + Phaser.Math.Between(-config.enemyWidth / 4, config.enemyWidth / 4);
    const spawnY = config.y + Phaser.Math.Between(-config.enemyHeight / 4, config.enemyHeight / 4);

    // Random velocities
    const velocityX = Phaser.Math.Between(GIB_VELOCITY.MIN_X, GIB_VELOCITY.MAX_X);
    const velocityY = Phaser.Math.Between(GIB_VELOCITY.MIN_Y, GIB_VELOCITY.MAX_Y);
    const angularVelocity = Phaser.Math.Between(GIB_VELOCITY.MIN_ANGULAR, GIB_VELOCITY.MAX_ANGULAR);

    // Calculate scale based on enemy scale and gib size
    let scale = Phaser.Math.FloatBetween(GIB_SCALE.MIN, GIB_SCALE.MAX) * config.enemyScale;
    if (config.isBoss) {
      scale += GIB_SCALE.BOSS_BONUS;
    }
    if (isLarge) {
      scale *= 0.8; // Large gibs are scaled down a bit since sprites are bigger
    }

    gib.activate(
      spawnX,
      spawnY,
      type,
      velocityX,
      velocityY,
      angularVelocity,
      scale,
      config.enemyTint
    );
  }

  /**
   * Spawn blood particles for a gore effect
   */
  private spawnBloodParticles(config: GoreEffectConfig, count: number): void {
    for (let i = 0; i < count; i++) {
      const blood = this.getBloodParticle();
      if (!blood) break;

      // Random spawn position
      const spawnX = config.x + Phaser.Math.Between(-config.enemyWidth / 3, config.enemyWidth / 3);
      const spawnY = config.y + Phaser.Math.Between(-config.enemyHeight / 3, config.enemyHeight / 3);

      // Random velocities
      const velocityX = Phaser.Math.Between(BLOOD_VELOCITY.MIN_X, BLOOD_VELOCITY.MAX_X);
      const velocityY = Phaser.Math.Between(BLOOD_VELOCITY.MIN_Y, BLOOD_VELOCITY.MAX_Y);

      // Random scale
      const scale = Phaser.Math.FloatBetween(BLOOD_PARTICLE.MIN_SCALE, BLOOD_PARTICLE.MAX_SCALE);

      // Determine if this particle creates a splatter
      const createSplatter = Math.random() < BLOOD_PARTICLE.SPLATTER_CHANCE;

      blood.activate(
        spawnX,
        spawnY,
        velocityX,
        velocityY,
        scale,
        createSplatter,
        createSplatter ? this.spawnSplatter.bind(this) : null
      );
    }
  }

  /**
   * Spawn a ground splatter at the given position
   */
  private spawnSplatter(x: number, y: number): void {
    const splatter = this.getSplatter();
    if (!splatter) return;

    // Random splatter type (mix of large and small)
    const useLarge = Math.random() > 0.4;
    const types = useLarge ? LARGE_BLOOD_TYPES : SMALL_BLOOD_TYPES;
    const type = Phaser.Math.RND.pick(types);

    splatter.setTexture(type);
    splatter.setPosition(x, y);
    splatter.setAlpha(SPLATTER.ALPHA);

    // Random scale
    const scale = Phaser.Math.FloatBetween(SPLATTER.MIN_SCALE, SPLATTER.MAX_SCALE);
    splatter.setScale(scale);

    // Random rotation if enabled
    if (SPLATTER.RANDOM_ROTATION) {
      splatter.setAngle(Phaser.Math.Between(0, 360));
    }

    splatter.setActive(true);
    splatter.setVisible(true);

    // Schedule fade and deactivation
    if (this.scene) {
      this.scene.time.delayedCall(GORE_TIMING.SPLATTER_PERSIST_DURATION, () => {
        if (splatter.active && this.scene) {
          this.scene.tweens.add({
            targets: splatter,
            alpha: 0,
            duration: GORE_TIMING.SPLATTER_FADE_DURATION,
            onComplete: () => {
              splatter.setActive(false);
              splatter.setVisible(false);
            },
          });
        }
      });
    }
  }

  /**
   * Update all active gore objects
   */
  private update(_time: number, delta: number): void {
    if (!this.isInitialized) return;

    // Update all active gibs
    for (const gib of this.gibPool) {
      if (gib.getIsActive()) {
        gib.updatePhysics(delta);
      }
    }

    // Update all active blood particles
    for (const blood of this.bloodPool) {
      if (blood.getIsActive()) {
        blood.updatePhysics(delta);
      }
    }
  }

  /**
   * Set the gore intensity level
   */
  setIntensity(intensity: GoreIntensity): void {
    this.intensity = intensity;
  }

  /**
   * Get the current gore intensity level
   */
  getIntensity(): GoreIntensity {
    return this.intensity;
  }

  /**
   * Clear all active gore effects (for scene transitions, etc.)
   */
  clearAll(): void {
    // Deactivate all gibs
    for (const gib of this.gibPool) {
      if (gib.getIsActive()) {
        gib.forceDeactivate();
      }
    }

    // Deactivate all blood particles
    for (const blood of this.bloodPool) {
      if (blood.getIsActive()) {
        blood.forceDeactivate();
      }
    }

    // Deactivate all splatters
    for (const splatter of this.splatterPool) {
      if (splatter.active && this.scene) {
        this.scene.tweens.killTweensOf(splatter);
        splatter.setActive(false);
        splatter.setVisible(false);
      }
    }
  }

  /**
   * Get pool statistics for debugging
   */
  getPoolStats(): {
    gibs: { active: number; total: number };
    blood: { active: number; total: number };
    splatters: { active: number; total: number };
  } {
    return {
      gibs: {
        active: this.gibPool.filter((g) => g.getIsActive()).length,
        total: this.gibPool.length,
      },
      blood: {
        active: this.bloodPool.filter((b) => b.getIsActive()).length,
        total: this.bloodPool.length,
      },
      splatters: {
        active: this.splatterPool.filter((s) => s.active).length,
        total: this.splatterPool.length,
      },
    };
  }
}
