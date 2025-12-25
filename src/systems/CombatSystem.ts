import Phaser from 'phaser';
import { Tank } from '../entities/Tank';
import { Enemy } from '../entities/Enemy';
import { Projectile, ProjectileType, ProjectileConfig } from '../entities/Projectile';
import { getGameState } from '../state/GameState';

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
    this.enemyTankOverlap = this.scene.physics.add.overlap(
      this.enemies,
      this.tank.getHitbox(),
      this.onEnemyReachTank as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
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

    if (import.meta.env.DEV) {
      console.log(`[CombatSystem] Overlap detected: proj=${projectile.getId()}, enemy=${enemy.getId()}`);
    }

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
    enemyObj: Phaser.GameObjects.GameObject,
    _tankObj: Phaser.GameObjects.GameObject
  ): void {
    const enemy = enemyObj as Enemy;

    if (!enemy.active || !enemy.isAlive()) return;

    const currentTime = this.scene.time.now;
    const attackRange = enemy.getAttackRange();

    // Check if enemy is in attack range
    const tankPos = this.tank.getPosition();
    const distance = Math.abs(enemy.x - tankPos.x);

    if (distance <= attackRange && enemy.canAttack(currentTime)) {
      const damage = enemy.attack(currentTime);
      if (damage > 0) {
        const config = enemy.getConfig();
        this.gameState.takeDamage(damage, enemy.getId(), config?.category === 'boss' ? 'boss' : 'enemy');

        // Spawn damage number on tank
        this.spawnDamageNumber(tankPos.x, tankPos.y - 30, damage, false, true);
      }
    }
  }

  /**
   * Spawn a floating damage number
   */
  private spawnDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean,
    isTankDamage: boolean = false
  ): void {
    if (import.meta.env.DEV) {
      console.log(`[CombatSystem] Spawning damage number: ${damage} at (${x}, ${y}), crit=${isCrit}`);
    }

    // Create text for damage number
    let color = '#ffffff';
    let fontSize = '20px';

    if (isTankDamage) {
      color = '#ff4444';
      fontSize = '24px';
    } else if (isCrit) {
      color = '#ffff00';
      fontSize = '28px';
    }

    const text = this.scene.add.text(x, y, damage.toString(), {
      fontSize,
      color,
      fontStyle: isCrit ? 'bold' : 'normal',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(1000);

    // Animate floating up and fading
    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });

    // Scale pop for crits
    if (isCrit) {
      this.scene.tweens.add({
        targets: text,
        scale: 1.3,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
      });
    }
  }

  /**
   * Fire the tank's built-in cannon
   */
  public fireCannonAt(time: number): void {
    const fireData = this.tank.fireCannon(time);
    if (!fireData) return;

    // Get an inactive projectile from the group
    const totalProjectiles = this.projectiles.getChildren().length;
    const inactiveProjectiles = this.projectiles.getChildren().filter(p => !p.active).length;

    if (import.meta.env.DEV) {
      console.log(`[CombatSystem] Trying to fire. Pool: ${inactiveProjectiles}/${totalProjectiles} inactive`);
    }

    const projectile = this.projectiles.getFirstDead(false) as Projectile | null;
    if (!projectile) {
      if (import.meta.env.DEV) {
        console.warn('[CombatSystem] No inactive projectiles available!');
      }
      return;
    }

    const config: ProjectileConfig = {
      type: ProjectileType.CannonShell,
      damage: fireData.damage,
      speed: 600,
      isCrit: false, // Cannon handles crit in damage calc
      aoeRadius: 30,
    };

    projectile.activate(fireData.x, fireData.y, config);

    if (import.meta.env.DEV) {
      console.log(`[CombatSystem] Fired cannon: damage=${fireData.damage}, pos=(${fireData.x}, ${fireData.y})`);
    }
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

    // Debug: Log active counts periodically
    if (import.meta.env.DEV && Math.floor(time / 1000) !== Math.floor((time - _delta) / 1000)) {
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
