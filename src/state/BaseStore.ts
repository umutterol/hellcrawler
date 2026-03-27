/**
 * BaseStore - Abstract base class for game state stores
 *
 * Provides event emission on state mutations and serialization support.
 * Adapted from Desktop Heroes' 4-store architecture pattern.
 */

import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';

export abstract class BaseStore<TData> {
  protected eventManager: EventManager;
  protected storeName: string;

  constructor(storeName: string) {
    this.eventManager = getEventManager();
    this.storeName = storeName;
  }

  /**
   * Emit a STORE_CHANGED event for auto-save debouncing
   */
  protected emitChange(field: string): void {
    this.eventManager.emit(GameEvents.STORE_CHANGED, {
      storeName: this.storeName,
      field,
    });
  }

  /**
   * Serialize the store's state for saving
   */
  abstract serialize(): TData;

  /**
   * Restore the store's state from saved data
   */
  abstract deserialize(data: TData): void;

  /**
   * Reset to default state
   */
  abstract reset(): void;
}
