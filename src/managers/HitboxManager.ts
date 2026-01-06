import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { EnemyType } from '../types/EnemyTypes';
import { Enemy } from '../entities/Enemy';
import { Tank } from '../entities/Tank';

/**
 * Hitbox bounds in world-space coordinates
 */
export interface HitboxBounds {
  x: number;      // World X center
  y: number;      // World Y center
  width: number;
  height: number;
  left: number;   // World X left edge
  right: number;  // World X right edge
  top: number;    // World Y top edge
  bottom: number; // World Y bottom edge
}

/**
 * Hitbox configuration for an entity type
 */
export interface HitboxConfig {
  width: number;
  height: number;
  offsetY: number; // Vertical offset from entity origin
}

/**
 * HitboxManager - Central utility for all hitbox operations
 *
 * Provides a unified interface for:
 * - Getting hitbox bounds for entities
 * - Checking if enemies are in melee range of tank
 * - Finding closest enemies for targeting
 * - Debug visualization
 *
 * This replaces the fragmented hitbox logic scattered across
 * Tank.ts, Enemy.ts, CombatSystem.ts, and BaseModule.ts
 */
export class HitboxManager {
  private static instance: HitboxManager | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    if (import.meta.env.DEV) {
      console.log('[HitboxManager] Initialized');
    }
  }

  /**
   * Get the singleton instance of HitboxManager
   */
  public static getInstance(): HitboxManager {
    if (!HitboxManager.instance) {
      HitboxManager.instance = new HitboxManager();
    }
    return HitboxManager.instance;
  }

  /**
   * Get the hitbox configuration for an enemy type
   */
  public getEnemyHitboxConfig(enemyType: EnemyType): HitboxConfig {
    const config = GAME_CONFIG.HITBOX_CONFIGS.enemies[enemyType];
    if (config) {
      return config;
    }
    return GAME_CONFIG.HITBOX_CONFIGS.enemies.default;
  }

  /**
   * Get hitbox bounds for an enemy in world-space
   *
   * @param enemy - The enemy entity
   * @returns Hitbox bounds in world coordinates
   */
  public getEnemyHitbox(enemy: Enemy): HitboxBounds {
    const config = enemy.getConfig();
    const enemyType = config?.type ?? EnemyType.Imp;
    const hitboxConfig = this.getEnemyHitboxConfig(enemyType);

    // Enemy uses origin (0.5, 1) - center-bottom
    // So enemy.x is center, enemy.y is at feet
    const centerX = enemy.x;
    // Adjust for scale
    const scaledWidth = hitboxConfig.width * enemy.scaleX;
    const scaledHeight = hitboxConfig.height * enemy.scaleY;
    const scaledOffsetY = hitboxConfig.offsetY * enemy.scaleY;

    // Center Y is at feet minus half the hitbox height (hitbox extends upward)
    const centerY = enemy.y - (scaledHeight / 2) + scaledOffsetY;

    return {
      x: centerX,
      y: centerY,
      width: scaledWidth,
      height: scaledHeight,
      left: centerX - scaledWidth / 2,
      right: centerX + scaledWidth / 2,
      top: centerY - scaledHeight / 2,
      bottom: centerY + scaledHeight / 2,
    };
  }

  /**
   * Get tank melee range - the X boundaries where enemies can attack the tank
   *
   * @param tankX - Tank's X position (center)
   * @returns Left and right X boundaries for melee range
   */
  public getTankMeleeRangeX(tankX: number): { left: number; right: number } {
    const attackRange = GAME_CONFIG.STOP_DISTANCE_FROM_TANK;
    return {
      left: tankX - attackRange,
      right: tankX + attackRange,
    };
  }

  /**
   * Check if an enemy is within melee range of the tank
   *
   * An enemy is in melee range if it has stopped at the tank's attack boundary.
   * This uses a simple X-distance check with a small tolerance.
   *
   * @param enemy - The enemy to check
   * @param tankX - Tank's X position
   * @returns True if enemy is close enough to melee attack the tank
   */
  public isEnemyInMeleeRange(enemy: Enemy, tankX: number): boolean {
    if (!enemy.active || !enemy.isAlive()) {
      return false;
    }

    const attackRange = GAME_CONFIG.STOP_DISTANCE_FROM_TANK;
    const tolerance = 10; // Small tolerance for position rounding

    const spawnSide = enemy.getSpawnSide();
    const distanceFromTank = Math.abs(enemy.x - tankX);

    // Enemy should be approximately at the stop distance
    // Within tolerance means they've reached melee range
    if (distanceFromTank <= attackRange + tolerance) {
      // Verify enemy is on the correct side
      if (spawnSide === 'right' && enemy.x > tankX) {
        return true;
      }
      if (spawnSide === 'left' && enemy.x < tankX) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get distance from a point to an enemy's center
   *
   * @param x - Source X position
   * @param y - Source Y position
   * @param enemy - Target enemy
   * @returns Distance in pixels
   */
  public getDistanceToEnemy(x: number, y: number, enemy: Enemy): number {
    const hitbox = this.getEnemyHitbox(enemy);
    return Phaser.Math.Distance.Between(x, y, hitbox.x, hitbox.y);
  }

  /**
   * Find the closest enemy to a given position
   *
   * @param x - Source X position
   * @param y - Source Y position
   * @param enemies - Array of enemies to search
   * @param maxRange - Optional maximum range (enemies beyond this are ignored)
   * @returns Closest enemy or null if none found
   */
  public findClosestEnemy(
    x: number,
    y: number,
    enemies: Enemy[],
    maxRange?: number
  ): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = maxRange ?? Infinity;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) continue;

      const dist = this.getDistanceToEnemy(x, y, enemy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * Find all enemies within a range of a position
   *
   * @param x - Source X position
   * @param y - Source Y position
   * @param range - Maximum range in pixels
   * @param enemies - Array of enemies to search
   * @returns Array of enemies within range
   */
  public findEnemiesInRange(
    x: number,
    y: number,
    range: number,
    enemies: Enemy[]
  ): Enemy[] {
    return enemies.filter((enemy) => {
      if (!enemy.active || !enemy.isAlive()) return false;
      return this.getDistanceToEnemy(x, y, enemy) <= range;
    });
  }

  /**
   * Draw debug visualization for hitboxes
   *
   * @param graphics - Phaser Graphics object to draw on
   * @param tank - Tank entity (for position reference)
   * @param enemies - Array of enemies to visualize
   * @param showTankRange - Whether to show tank attack range
   */
  public drawDebugHitboxes(
    graphics: Phaser.GameObjects.Graphics,
    tank: Tank,
    enemies: Enemy[],
    showTankRange: boolean = true
  ): void {
    graphics.clear();
    graphics.setDepth(GAME_CONFIG.DEPTH.DEBUG);

    const tankPos = tank.getPosition();

    // Draw tank melee range (vertical lines at left/right boundaries)
    if (showTankRange) {
      const meleeRange = this.getTankMeleeRangeX(tankPos.x);
      graphics.lineStyle(2, 0x00ff00, 0.5);

      // Left boundary
      graphics.beginPath();
      graphics.moveTo(meleeRange.left, 0);
      graphics.lineTo(meleeRange.left, GAME_CONFIG.HEIGHT);
      graphics.strokePath();

      // Right boundary
      graphics.beginPath();
      graphics.moveTo(meleeRange.right, 0);
      graphics.lineTo(meleeRange.right, GAME_CONFIG.HEIGHT);
      graphics.strokePath();

      // Tank center line
      graphics.lineStyle(2, 0x00ffff, 0.3);
      graphics.beginPath();
      graphics.moveTo(tankPos.x, 0);
      graphics.lineTo(tankPos.x, GAME_CONFIG.HEIGHT);
      graphics.strokePath();
    }

    // Draw enemy hitboxes
    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) continue;

      const hitbox = this.getEnemyHitbox(enemy);
      const inMeleeRange = this.isEnemyInMeleeRange(enemy, tankPos.x);

      // Color based on melee range status
      const color = inMeleeRange ? 0xff0000 : 0xffff00;
      graphics.lineStyle(2, color, 0.8);

      // Draw hitbox rectangle
      graphics.strokeRect(
        hitbox.left,
        hitbox.top,
        hitbox.width,
        hitbox.height
      );

      // Draw center point
      graphics.fillStyle(color, 1);
      graphics.fillCircle(hitbox.x, hitbox.y, 3);
    }
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    HitboxManager.instance = null;
  }
}

/**
 * Export a convenience function to get the HitboxManager instance
 */
export function getHitboxManager(): HitboxManager {
  return HitboxManager.getInstance();
}
