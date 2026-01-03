import Phaser from 'phaser';
import { Tank } from '../entities/Tank';
import { Enemy } from '../entities/Enemy';
import { Projectile, ProjectileType, ProjectileConfig } from '../entities/Projectile';
import { getGameState } from '../state/GameState';
import { getSettingsManager } from '../managers/SettingsManager';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * CombatSystem - Handles all combat interactions
 *
 * Responsibilities:
 * - Projectile-enemy collision detection
 * - Damage application with formulas
 * - Enemy-tank melee combat
 * - AOE damage calculations
 * - Lifesteal processing
 */
export class CombatSystem {
  private scene: Phaser.Scene;
  private tank: Tank;
  private enemies: Phaser.GameObjects.Group;
  private projectiles: Phaser.GameObjects.Group;
  private gameState: ReturnType<typeof getGameState>;

  // Collision overlaps
  private projectileEnemyOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private enemyTankOverlap: Phaser.Physics.Arcade.Collider | null = null;

  constructor(
    scene: Phaser.Scene,
    tank: Tank,
    enemies: Phaser.GameObjects.Group,
    projectiles: Phaser.GameObjects.Group
  ) {
    this.scene = scene;
    this.tank = tank;
    this.enemies = enemies;
    this.projectiles = projectiles;
    this.gameState = getGameState();

    this.setupCollisions();
  }

  private setupCollisions(): void {
    // Projectile vs Enemy
    this.projectileEnemyOverlap = this.scene.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.onProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Enemy vs Tank hitbox (melee range)
    // Use the tank's physics hitbox, not the container
    const hitbox = this.tank.getHitbox();
    this.enemyTankOverlap = this.scene.physics.add.overlap(
      this.enemies,
      hitbox,
      this.onEnemyReachTank as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    if (import.meta.env.DEV) {
      console.log('[CombatSystem] Enemy-tank overlap registered:', this.enemyTankOverlap ? 'success' : 'failed');
    }
  }

  /**
   * Handle projectile hitting an enemy
   */
  private onProjectileHitEnemy(
    projectileObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ): void {
    const projectile = projectileObj as Projectile;
    const enemy = enemyObj as Enemy;

    // Don't log every overlap - too spammy and causes FPS drops
    if (!projectile.active || !enemy.active) return;
    if (!enemy.isAlive()) return;

    // Check if this projectile can hit this enemy (piercing tracking)
    if (!projectile.canHitEnemy(enemy.getId())) return;

    // Get damage info
    const damage = projectile.getDamage();
    const isCrit = projectile.isCriticalHit();
    const aoeRadius = projectile.getAoERadius();

    // Register the hit
    projectile.registerHit(enemy.getId());

    // Apply damage
    enemy.takeDamage(damage, isCrit);

    // Handle AOE
    if (aoeRadius > 0) {
      this.applyAoEDamage(enemy.x, enemy.y, damage * 0.5, aoeRadius, enemy.getId());
    }

    // Handle lifesteal
    this.processLifesteal(damage);

    // Play hit effect
    projectile.playHitEffect();

    // Spawn damage number at enemy center (enemy.y is at feet due to origin 0.5, 1)
    this.spawnDamageNumber(enemy.x, enemy.y - 16, damage, isCrit);

    // Deactivate projectile if not piercing
    if (projectile.shouldDeactivateOnHit()) {
      projectile.deactivate();
    }
  }

  /**
   * Apply AOE damage to nearby enemies
   */
  private applyAoEDamage(
    x: number,
    y: number,
    damage: number,
    radius: number,
    excludeId: string
  ): void {
    const activeEnemies = this.enemies.getChildren().filter(
      (child) => (child as Enemy).active && (child as Enemy).isAlive()
    ) as Enemy[];

    for (const enemy of activeEnemies) {
      if (enemy.getId() === excludeId) continue;

      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance <= radius) {
        // Falloff damage based on distance
        const falloff = 1 - (distance / radius) * 0.5;
        const aoeDamage = Math.floor(damage * falloff);

        enemy.takeDamage(aoeDamage, false);
        this.spawnDamageNumber(enemy.x, enemy.y - 16, aoeDamage, false);
      }
    }
  }

  /**
   * Process lifesteal from damage dealt
   */
  private processLifesteal(damageDealt: number): void {
    const lifestealPercent = this.gameState.getStatLevel('lifesteal' as any) * 0.5;
    if (lifestealPercent > 0) {
      const healAmount = Math.floor(damageDealt * (lifestealPercent / 100));
      if (healAmount > 0) {
        this.gameState.heal(healAmount);
      }
    }
  }

  /**
   * Handle enemy reaching the tank for melee attack
   */
  private onEnemyReachTank(
    obj1: Phaser.GameObjects.GameObject,
    obj2: Phaser.GameObjects.GameObject
  ): void {
    if (import.meta.env.DEV) {
      console.log(`[CombatSystem] onEnemyReachTank called: obj1=${obj1.constructor.name}, obj2=${obj2.constructor.name}`);
    }

    // Determine which object is the enemy (could be either depending on overlap order)
    let enemy: Enemy | null = null;

    if (obj1 instanceof Enemy) {
      enemy = obj1;
    } else if (obj2 instanceof Enemy) {
      enemy = obj2;
    }

    if (!enemy) {
      if (import.meta.env.DEV) {
        console.warn('[CombatSystem] Neither object is an Enemy!');
      }
      return;
    }

    if (!enemy.active || !enemy.isAlive()) {
      if (import.meta.env.DEV) {
        console.log(`[CombatSystem] Enemy not active/alive: active=${enemy.active}, alive=${enemy.isAlive()}`);
      }
      return;
    }

    const currentTime = this.scene.time.now;
    const tankPos = this.tank.getPosition();

    // Since overlap callback fired, enemy is in contact with tank hitbox - they can attack
    // No need for additional distance check - physics overlap handles proximity
    if (enemy.canAttack(currentTime)) {
      const damage = enemy.attack(currentTime);
      if (import.meta.env.DEV) {
        console.log(`[CombatSystem] Enemy ${enemy.getId()} attacking, damage=${damage}`);
      }
      if (damage > 0) {
        const config = enemy.getConfig();
        this.gameState.takeDamage(damage, enemy.getId(), config?.category === 'boss' ? 'boss' : 'enemy');

        // Spawn damage number on tank
        this.spawnDamageNumber(tankPos.x, tankPos.y - 30, damage, false, true);
      }
    } else if (import.meta.env.DEV) {
      console.log(`[CombatSystem] Enemy ${enemy.getId()} cannot attack yet (cooldown)`);
    }
  }

  /**
   * Spawn a floating damage number with pop animation
   */
  private spawnDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean,
    isTankDamage: boolean = false
  ): void {
    // Check if damage numbers are enabled in settings
    const settings = getSettingsManager();
    if (!settings.showDamageNumbers) return;

    const timing = GAME_CONFIG.EFFECT_TIMING;
    const depth = GAME_CONFIG.DEPTH;

    // Add random horizontal offset to prevent stacking
    const offsetX = Phaser.Math.Between(-timing.DAMAGE_NUMBER_RANDOM_OFFSET_X, timing.DAMAGE_NUMBER_RANDOM_OFFSET_X);
    const spawnX = x + offsetX;

    // Configure appearance based on damage type
    let color = '#ffffff';
    let fontSize = 20;
    let displayText = damage.toString();

    if (isTankDamage) {
      color = '#ff4444';
      fontSize = 24;
    } else if (isCrit) {
      color = '#ffff00';
      fontSize = 32;
      displayText = `CRIT!\n${damage}`;
    }

    // Create the damage number text
    const text = this.scene.add.text(spawnX, y, displayText, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial Black, Arial, sans-serif',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    text.setOrigin(0.5);
    text.setDepth(depth.DAMAGE_NUMBERS);
    text.setScale(0); // Start at scale 0 for pop-in effect

    // Pop-in animation (scale 0 → peak → settle)
    const peakScale = isCrit ? timing.CRIT_SCALE_PEAK : 1.2;
    const settleScale = isCrit ? timing.CRIT_SCALE_SETTLE : 1.0;

    // Phase 1: Pop in (scale 0 → peak)
    this.scene.tweens.add({
      targets: text,
      scale: peakScale,
      duration: timing.DAMAGE_NUMBER_POP_DURATION * 0.6,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Phase 2: Settle (peak → settle)
        this.scene.tweens.add({
          targets: text,
          scale: settleScale,
          duration: timing.DAMAGE_NUMBER_POP_DURATION * 0.4,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // Float up and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - timing.DAMAGE_NUMBER_FLOAT_DISTANCE,
      alpha: 0,
      duration: timing.DAMAGE_NUMBER_FLOAT_DURATION,
      ease: 'Cubic.easeOut',
      delay: timing.DAMAGE_NUMBER_POP_DURATION, // Wait for pop animation
      onComplete: () => text.destroy(),
    });

    // Add slight horizontal drift for visual interest
    this.scene.tweens.add({
      targets: text,
      x: spawnX + Phaser.Math.Between(-10, 10),
      duration: timing.DAMAGE_NUMBER_FLOAT_DURATION,
      ease: 'Sine.easeInOut',
      delay: timing.DAMAGE_NUMBER_POP_DURATION,
    });
  }

  /**
   * Fire the tank's built-in cannon at the closest enemy
   */
  public fireCannonAt(time: number): void {
    const fireData = this.tank.fireCannon(time);
    if (!fireData) return;

    // Find closest alive enemy to target
    const enemyCount = this.enemies.getChildren().filter(e => (e as Enemy).active && (e as Enemy).isAlive()).length;
    const target = this.findClosestEnemy(fireData.x, fireData.y);

    if (import.meta.env.DEV) {
      console.log(`[CombatSystem] fireCannonAt: ${enemyCount} enemies, target=${target ? 'found at ' + target.x.toFixed(0) : 'none'}`);
    }

    if (!target) {
      // No enemies to target, don't waste ammo
      return;
    }

    const projectile = this.projectiles.getFirstDead(false) as Projectile | null;
    if (!projectile) {
      if (import.meta.env.DEV) {
        console.warn('[CombatSystem] No inactive projectiles available!');
      }
      return;
    }

    const speed = 600;
    const config: ProjectileConfig = {
      type: ProjectileType.CannonShell,
      damage: fireData.damage,
      speed,
      isCrit: false, // Cannon handles crit in damage calc
      aoeRadius: 30,
    };

    projectile.activate(fireData.x, fireData.y, config);

    // Calculate angle to target and set velocity toward it
    const angle = Phaser.Math.Angle.Between(fireData.x, fireData.y, target.x, target.y);
    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed;
    projectile.setVelocity(velX, velY);

    if (import.meta.env.DEV) {
      console.log(`[CombatSystem] Cannon fired: vel=(${velX.toFixed(0)}, ${velY.toFixed(0)}), angle=${(angle * 180 / Math.PI).toFixed(1)}°`);
    }
  }

  /**
   * Find the closest alive enemy to a position
   */
  private findClosestEnemy(fromX: number, fromY: number): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    const enemies = this.enemies.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) continue;

      const dist = Phaser.Math.Distance.Between(fromX, fromY, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * Spawn a projectile from a module
   */
  public spawnProjectile(
    x: number,
    y: number,
    config: ProjectileConfig,
    target?: Enemy
  ): Projectile | null {
    const projectile = this.projectiles.getFirstDead(false) as Projectile | null;
    if (!projectile) return null;

    if (target && config.type === ProjectileType.Missile) {
      config.homingTarget = target;
    }

    projectile.activate(x, y, config);
    return projectile;
  }

  /**
   * Get the closest enemy to a position
   */
  public getClosestEnemy(x: number, y: number): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    const activeEnemies = this.enemies.getChildren().filter(
      (child) => (child as Enemy).active && (child as Enemy).isAlive()
    ) as Enemy[];

    for (const enemy of activeEnemies) {
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * Get all enemies within a range
   */
  public getEnemiesInRange(x: number, y: number, range: number): Enemy[] {
    return this.enemies.getChildren().filter((child) => {
      const enemy = child as Enemy;
      if (!enemy.active || !enemy.isAlive()) return false;

      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      return dist <= range;
    }) as Enemy[];
  }

  /**
   * Get count of active enemies
   */
  public getActiveEnemyCount(): number {
    return this.enemies.getChildren().filter(
      (child) => (child as Enemy).active && (child as Enemy).isAlive()
    ).length;
  }

  /**
   * Update loop
   */
  public update(time: number, _delta: number): void {
    // Fire cannon if ready
    this.fireCannonAt(time);

    // Debug: Log active counts periodically (every 5 seconds to reduce spam)
    if (import.meta.env.DEV && Math.floor(time / 5000) !== Math.floor((time - _delta) / 5000)) {
      const activeProjectiles = this.projectiles.getChildren().filter(p => p.active).length;
      const activeEnemies = this.enemies.getChildren().filter(e => (e as Enemy).active && (e as Enemy).isAlive()).length;
      console.log(`[CombatSystem] Active: ${activeProjectiles} projectiles, ${activeEnemies} enemies`);
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.projectileEnemyOverlap) {
      this.projectileEnemyOverlap.destroy();
    }
    if (this.enemyTankOverlap) {
      this.enemyTankOverlap.destroy();
    }
  }
}
