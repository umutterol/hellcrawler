import Phaser from 'phaser';

/**
 * Interface for poolable objects
 * All objects managed by PoolManager must implement these methods
 */
export interface IPoolable {
  activate(...args: unknown[]): void;
  deactivate(): void;
  setActive(value: boolean): this;
  setVisible(value: boolean): this;
}

/**
 * Pool statistics for debugging and monitoring
 */
export interface PoolStats {
  key: string;
  total: number;
  active: number;
  inactive: number;
  expansions: number;
}

/**
 * Internal pool data structure
 */
interface Pool {
  group: Phaser.GameObjects.Group;
  classType: any;
  expansions: number;
  initialSize: number;
}

/**
 * PoolManager - Generic object pool implementation for Phaser GameObjects
 *
 * Manages object pools for performance optimization by reusing game objects
 * instead of constantly creating and destroying them.
 *
 * Features:
 * - Generic type-safe pools using Phaser Groups
 * - Automatic pool expansion when running out of objects
 * - Singleton pattern for global access
 * - Pool statistics for debugging
 * - Support for activate/deactivate lifecycle methods
 *
 * Usage:
 * ```typescript
 * // Create a pool
 * poolManager.createPool('enemies', Enemy, 50);
 *
 * // Get an object from the pool
 * const enemy = poolManager.get<Enemy>('enemies');
 * enemy?.activate(x, y);
 *
 * // Return object to pool
 * poolManager.release('enemies', enemy);
 * ```
 */
export class PoolManager {
  private static instance: PoolManager | null = null;
  private scene: Phaser.Scene | null = null;
  private pools: Map<string, Pool> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of PoolManager
   */
  public static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  /**
   * Initialize the PoolManager with a Phaser scene
   * Must be called before using any pool operations
   *
   * @param scene - The Phaser scene that will own the pooled objects
   */
  public init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.pools.clear();
  }

  /**
   * Create a new object pool
   *
   * @param key - Unique identifier for this pool
   * @param classType - The class constructor for objects in this pool
   * @param size - Initial pool size (number of pre-allocated objects)
   * @returns True if pool was created successfully, false if it already exists
   */
  public createPool<T extends IPoolable>(
    key: string,
    classType: new (scene: Phaser.Scene, ...args: unknown[]) => T,
    size: number
  ): boolean {
    if (!this.scene) {
      console.error('PoolManager: Cannot create pool - PoolManager not initialized with a scene');
      return false;
    }

    if (this.pools.has(key)) {
      console.warn(`PoolManager: Pool "${key}" already exists`);
      return false;
    }

    // Create Phaser Group for this pool
    const group = this.scene.add.group({
      classType: classType,
      maxSize: -1, // No limit, we'll handle expansion manually
      runChildUpdate: false, // We'll update objects manually for better control
    });

    // Pre-allocate objects
    for (let i = 0; i < size; i++) {
      const obj = group.get() as T;
      if (obj) {
        obj.setActive(false);
        obj.setVisible(false);
        // Call deactivate to ensure object is in proper inactive state
        if (typeof obj.deactivate === 'function') {
          obj.deactivate();
        }
      }
    }

    // Store pool metadata
    this.pools.set(key, {
      group,
      classType,
      expansions: 0,
      initialSize: size,
    });

    console.log(`PoolManager: Created pool "${key}" with ${size} objects`);
    return true;
  }

  /**
   * Get an object from the pool
   * If no inactive objects are available, the pool will automatically expand
   *
   * @param key - The pool identifier
   * @returns An inactive object from the pool, or null if pool doesn't exist
   */
  public get<T extends IPoolable>(key: string): T | null {
    const pool = this.pools.get(key);

    if (!pool) {
      console.error(`PoolManager: Pool "${key}" does not exist`);
      return null;
    }

    // Try to get an inactive object
    const obj = pool.group.getFirstDead(false) as T | null;

    if (obj) {
      // Object found in pool
      obj.setActive(true);
      obj.setVisible(true);
      return obj;
    }

    // No inactive objects available - expand the pool
    this.expandPool(key, pool);

    // Try again after expansion
    const newObj = pool.group.getFirstDead(false) as T | null;
    if (newObj) {
      newObj.setActive(true);
      newObj.setVisible(true);
      return newObj;
    }

    console.error(`PoolManager: Failed to get object from pool "${key}" even after expansion`);
    return null;
  }

  /**
   * Return an object to the pool for reuse
   * The object will be deactivated and made invisible
   *
   * @param key - The pool identifier
   * @param obj - The object to return to the pool
   */
  public release<T extends IPoolable>(key: string, obj: T): void {
    const pool = this.pools.get(key);

    if (!pool) {
      console.error(`PoolManager: Cannot release object - pool "${key}" does not exist`);
      return;
    }

    // Verify object belongs to this pool (using type assertion for GameObject check)
    const gameObj = obj as unknown as Phaser.GameObjects.GameObject;
    if (!pool.group.contains(gameObj)) {
      console.error(`PoolManager: Object does not belong to pool "${key}"`);
      return;
    }

    // Deactivate the object
    if (typeof obj.deactivate === 'function') {
      obj.deactivate();
    }

    obj.setActive(false);
    obj.setVisible(false);
  }

  /**
   * Expand a pool by 50% of its initial size
   * Logs a warning as this indicates potential under-sizing
   *
   * @param key - The pool identifier
   * @param pool - The pool to expand
   */
  private expandPool(key: string, pool: Pool): void {
    const expandSize = Math.ceil(pool.initialSize * 0.5);
    pool.expansions++;

    console.warn(
      `PoolManager: Pool "${key}" exhausted! Expanding by ${expandSize} objects ` +
      `(expansion #${pool.expansions}). Consider increasing initial pool size.`
    );

    // Add new objects to the pool
    for (let i = 0; i < expandSize; i++) {
      const obj = pool.group.get() as IPoolable;
      if (obj) {
        obj.setActive(false);
        obj.setVisible(false);
        if (typeof obj.deactivate === 'function') {
          obj.deactivate();
        }
      }
    }
  }

  /**
   * Get statistics for a specific pool
   * Useful for debugging and monitoring pool usage
   *
   * @param key - The pool identifier
   * @returns Pool statistics or null if pool doesn't exist
   */
  public getPoolStats(key: string): PoolStats | null {
    const pool = this.pools.get(key);

    if (!pool) {
      return null;
    }

    const total = pool.group.getLength();
    const active = pool.group.countActive(true);
    const inactive = pool.group.countActive(false);

    return {
      key,
      total,
      active,
      inactive,
      expansions: pool.expansions,
    };
  }

  /**
   * Get statistics for all pools
   * Useful for debugging and performance monitoring
   *
   * @returns Array of statistics for all pools
   */
  public getAllPoolStats(): PoolStats[] {
    const stats: PoolStats[] = [];

    for (const key of this.pools.keys()) {
      const poolStats = this.getPoolStats(key);
      if (poolStats) {
        stats.push(poolStats);
      }
    }

    return stats;
  }

  /**
   * Log detailed statistics for all pools to console
   * Useful for debugging pool usage and identifying issues
   */
  public logPoolStats(): void {
    console.log('=== PoolManager Statistics ===');

    const allStats = this.getAllPoolStats();

    if (allStats.length === 0) {
      console.log('No pools created');
      return;
    }

    for (const stats of allStats) {
      console.log(
        `Pool "${stats.key}": ${stats.active} active, ${stats.inactive} inactive, ` +
        `${stats.total} total (${stats.expansions} expansions)`
      );
    }

    console.log('============================');
  }

  /**
   * Clear all objects from a specific pool
   * Does NOT destroy the pool itself
   *
   * @param key - The pool identifier
   */
  public clearPool(key: string): void {
    const pool = this.pools.get(key);

    if (!pool) {
      console.error(`PoolManager: Cannot clear pool - pool "${key}" does not exist`);
      return;
    }

    // Deactivate all objects in the pool
    pool.group.getChildren().forEach((obj) => {
      const poolable = obj as unknown as IPoolable;
      if (typeof poolable.deactivate === 'function') {
        poolable.deactivate();
      }
      poolable.setActive(false);
      poolable.setVisible(false);
    });

    console.log(`PoolManager: Cleared pool "${key}"`);
  }

  /**
   * Destroy a pool and all its objects
   * The pool cannot be used after this operation
   *
   * @param key - The pool identifier
   */
  public destroyPool(key: string): void {
    const pool = this.pools.get(key);

    if (!pool) {
      console.error(`PoolManager: Cannot destroy pool - pool "${key}" does not exist`);
      return;
    }

    // Destroy the group and all its objects
    pool.group.destroy(true);
    this.pools.delete(key);

    console.log(`PoolManager: Destroyed pool "${key}"`);
  }

  /**
   * Destroy all pools and clean up
   * Should be called when scene is destroyed
   */
  public destroy(): void {
    for (const key of this.pools.keys()) {
      this.destroyPool(key);
    }

    this.pools.clear();
    this.scene = null;

    console.log('PoolManager: All pools destroyed');
  }

  /**
   * Check if a pool exists
   *
   * @param key - The pool identifier
   * @returns True if the pool exists
   */
  public hasPool(key: string): boolean {
    return this.pools.has(key);
  }

  /**
   * Get the total number of pools
   *
   * @returns Number of active pools
   */
  public getPoolCount(): number {
    return this.pools.size;
  }
}

/**
 * Export singleton instance for convenience
 * Usage: import { poolManager } from '@/managers/PoolManager';
 */
export const poolManager = PoolManager.getInstance();
