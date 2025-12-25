import Phaser from 'phaser';
import { GameEvents, EventPayloadMap } from '../types/GameEvents';

/**
 * EventManager - Singleton Event Bus
 *
 * Centralized type-safe event system for game-wide communication.
 * Built on Phaser's EventEmitter for reliable event handling.
 *
 * Phase 1: Core Managers
 *
 * Features:
 * - Singleton pattern ensures single event bus
 * - Type-safe event emission and subscription
 * - Context binding for callbacks
 * - Support for one-time listeners
 * - Built on Phaser's battle-tested EventEmitter
 *
 * Usage:
 * ```typescript
 * // Get instance
 * const events = EventManager.getInstance();
 *
 * // Subscribe to events
 * events.on(GameEvents.ENEMY_DIED, (payload) => {
 *   console.log(`Enemy ${payload.enemyId} died, awarded ${payload.xpAwarded} XP`);
 * }, this);
 *
 * // Emit events
 * events.emit(GameEvents.ENEMY_DIED, {
 *   enemyId: 'goblin_001',
 *   enemyType: 'goblin',
 *   killedBy: 'tank',
 *   xpAwarded: 50,
 *   goldAwarded: 10
 * });
 *
 * // One-time listener
 * events.once(GameEvents.BOSS_DEFEATED, (payload) => {
 *   console.log(`Boss ${payload.bossName} defeated!`);
 * }, this);
 *
 * // Unsubscribe
 * events.off(GameEvents.ENEMY_DIED, callback, this);
 * ```
 */
export class EventManager {
  private static instance: EventManager | null = null;
  private emitter: Phaser.Events.EventEmitter;
  private isDestroyed: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.emitter = new Phaser.Events.EventEmitter();

    if (import.meta.env.DEV) {
      console.log('[EventManager] Initialized');
    }
  }

  /**
   * Get the singleton instance of EventManager
   * Creates the instance if it doesn't exist
   */
  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Emit a game event with typed payload
   *
   * @param event - The event type to emit
   * @param payload - The typed payload for this event
   */
  public emit<T extends GameEvents>(
    event: T,
    payload: EventPayloadMap[T]
  ): void {
    if (this.isDestroyed) {
      console.warn('[EventManager] Cannot emit - manager is destroyed');
      return;
    }

    if (import.meta.env.DEV) {
      this.validatePayload(event, payload);
    }

    this.emitter.emit(event, payload);

    if (import.meta.env.DEV) {
      this.logEvent(event, payload);
    }
  }

  /**
   * Subscribe to a game event
   *
   * @param event - The event type to listen for
   * @param callback - The callback function to execute
   * @param context - The context (this) to bind the callback to
   */
  public on<T extends GameEvents>(
    event: T,
    callback: (payload: EventPayloadMap[T]) => void,
    context?: unknown
  ): void {
    if (this.isDestroyed) {
      console.warn('[EventManager] Cannot subscribe - manager is destroyed');
      return;
    }

    this.emitter.on(event, callback, context);
  }

  /**
   * Subscribe to a game event (one-time listener)
   * The callback will be removed automatically after first execution
   *
   * @param event - The event type to listen for
   * @param callback - The callback function to execute once
   * @param context - The context (this) to bind the callback to
   */
  public once<T extends GameEvents>(
    event: T,
    callback: (payload: EventPayloadMap[T]) => void,
    context?: unknown
  ): void {
    if (this.isDestroyed) {
      console.warn('[EventManager] Cannot subscribe - manager is destroyed');
      return;
    }

    this.emitter.once(event, callback, context);
  }

  /**
   * Unsubscribe from a game event
   *
   * @param event - The event type to unsubscribe from
   * @param callback - The callback function to remove (optional)
   * @param context - The context that was used when subscribing (optional)
   */
  public off<T extends GameEvents>(
    event: T,
    callback?: (payload: EventPayloadMap[T]) => void,
    context?: unknown
  ): void {
    if (this.isDestroyed) {
      return;
    }

    if (callback) {
      this.emitter.off(event, callback, context);
    } else {
      // Remove all listeners for this event
      this.emitter.removeAllListeners(event);
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   *
   * @param event - Optional specific event to clear. If omitted, clears all events
   */
  public removeAllListeners(event?: GameEvents): void {
    if (this.isDestroyed) {
      return;
    }

    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }

    if (import.meta.env.DEV) {
      console.log(
        `[EventManager] Removed all listeners${event ? ` for ${event}` : ''}`
      );
    }
  }

  /**
   * Get the count of listeners for a specific event
   *
   * @param event - The event to count listeners for
   * @returns The number of listeners
   */
  public listenerCount(event: GameEvents): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Check if a specific event has any listeners
   *
   * @param event - The event to check
   * @returns True if the event has at least one listener
   */
  public hasListeners(event: GameEvents): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Destroy the EventManager instance
   * Removes all listeners and prevents further use
   * Should only be called when completely shutting down the game
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.emitter.removeAllListeners();
    this.emitter.destroy();
    this.isDestroyed = true;
    EventManager.instance = null;

    if (import.meta.env.DEV) {
      console.log('[EventManager] Destroyed');
    }
  }

  /**
   * Reset the EventManager (for testing purposes)
   * Clears all listeners but keeps the instance alive
   */
  public reset(): void {
    if (this.isDestroyed) {
      console.warn('[EventManager] Cannot reset - manager is destroyed');
      return;
    }

    this.emitter.removeAllListeners();

    if (import.meta.env.DEV) {
      console.log('[EventManager] Reset - all listeners cleared');
    }
  }

  /**
   * Development mode: Validate payload structure
   * Ensures required fields are present
   */
  private validatePayload<T extends GameEvents>(
    event: T,
    payload: EventPayloadMap[T]
  ): void {
    if (!payload || typeof payload !== 'object') {
      console.warn(
        `[EventManager] Invalid payload for ${event}:`,
        'Payload must be an object'
      );
      return;
    }

    // Check for common required fields based on event category
    const eventStr = event as string;

    if (eventStr.startsWith('enemy:')) {
      const enemyPayload = payload as unknown as Record<string, unknown>;
      if (
        !enemyPayload.enemyId ||
        typeof enemyPayload.enemyId !== 'string'
      ) {
        console.warn(
          `[EventManager] Missing or invalid enemyId in ${event}`,
          payload
        );
      }
    }

    if (eventStr.startsWith('module:')) {
      const modulePayload = payload as unknown as Record<string, unknown>;
      if (
        !modulePayload.moduleId ||
        typeof modulePayload.moduleId !== 'string'
      ) {
        console.warn(
          `[EventManager] Missing or invalid moduleId in ${event}`,
          payload
        );
      }
    }

    if (eventStr.startsWith('boss:')) {
      const bossPayload = payload as unknown as Record<string, unknown>;
      if (!bossPayload.bossId || typeof bossPayload.bossId !== 'string') {
        console.warn(
          `[EventManager] Missing or invalid bossId in ${event}`,
          payload
        );
      }
    }

    if (eventStr.startsWith('wave:') || eventStr.startsWith('zone:')) {
      const wavePayload = payload as unknown as Record<string, unknown>;
      if (
        wavePayload.waveNumber !== undefined &&
        typeof wavePayload.waveNumber !== 'number'
      ) {
        console.warn(
          `[EventManager] Invalid waveNumber in ${event}`,
          payload
        );
      }
    }
  }

  /**
   * Development mode: Log event emission
   * Helps with debugging event flow
   */
  private logEvent<T extends GameEvents>(
    event: T,
    payload: EventPayloadMap[T]
  ): void {
    const eventStr = event as string;
    const category = eventStr.split(':')[0];

    // Color coding by category
    const colors: Record<string, string> = {
      enemy: '#ff6b6b',
      damage: '#ff8787',
      progression: '#51cf66',
      module: '#748ffc',
      skill: '#9775fa',
      wave: '#ffd43b',
      zone: '#ffa94d',
      boss: '#ff6b9d',
      tank: '#20c997',
      save: '#66d9e8',
    };

    const color = (category && colors[category]) || '#adb5bd';

    console.log(
      `%c[Event] ${event}`,
      `color: ${color}; font-weight: bold`,
      payload
    );
  }

  /**
   * Get debug information about the EventManager state
   * Useful for development and debugging
   */
  public getDebugInfo(): {
    isDestroyed: boolean;
    totalListeners: number;
    eventCounts: Record<string, number>;
  } {
    const eventCounts: Record<string, number> = {};

    if (!this.isDestroyed) {
      // Count listeners for each event type
      Object.values(GameEvents).forEach((event) => {
        const count = this.listenerCount(event);
        if (count > 0) {
          eventCounts[event] = count;
        }
      });
    }

    const totalListeners = Object.values(eventCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      isDestroyed: this.isDestroyed,
      totalListeners,
      eventCounts,
    };
  }
}

/**
 * Export a convenience function to get the EventManager instance
 * This allows for cleaner imports in game code
 */
export function getEventManager(): EventManager {
  return EventManager.getInstance();
}
