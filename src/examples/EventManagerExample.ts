/**
 * EventManager Usage Examples
 *
 * This file demonstrates how to use the EventManager system
 * in different scenarios throughout the game.
 *
 * Note: This is for documentation purposes only.
 * DO NOT import this file in production code.
 */

import { EventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';

/**
 * Example 1: Basic Event Emission and Listening
 */
export function basicUsageExample(): void {
  const events = EventManager.getInstance();

  // Subscribe to an event
  events.on(
    GameEvents.ENEMY_DIED,
    (payload) => {
      console.log(
        `Enemy ${payload.enemyId} killed! Awarded ${payload.xpAwarded} XP`
      );
    },
    undefined
  );

  // Emit the event with type-safe payload
  events.emit(GameEvents.ENEMY_DIED, {
    enemyId: 'goblin_001',
    enemyType: 'goblin',
    killedBy: 'tank',
    xpAwarded: 50,
    goldAwarded: 10,
  });
}

/**
 * Example 2: Using Context Binding in Phaser Scenes
 */
export class ExampleScene extends Phaser.Scene {
  private gameEvents: EventManager;
  private score: number = 0;

  constructor() {
    super({ key: 'ExampleScene' });
    this.gameEvents = EventManager.getInstance();
  }

  create(): void {
    // Bind event handler to this scene context
    this.gameEvents.on(GameEvents.ENEMY_DIED, this.handleEnemyDeath, this);
    this.gameEvents.on(GameEvents.XP_GAINED, this.handleXpGained, this);
  }

  private handleEnemyDeath(payload: {
    enemyId: string;
    enemyType: string;
    killedBy: 'tank' | 'skill';
    xpAwarded: number;
    goldAwarded: number;
  }): void {
    // 'this' correctly refers to the scene instance
    this.score += payload.goldAwarded;
    console.log(`Score: ${this.score}`);
  }

  private handleXpGained(payload: {
    amount: number;
    currentXp: number;
    xpToNextLevel: number;
    source: 'enemy' | 'boss' | 'wave_completion';
  }): void {
    console.log(`XP: ${payload.currentXp}/${payload.xpToNextLevel}`);
  }

  shutdown(): void {
    // Clean up listeners when scene shuts down
    this.gameEvents.off(GameEvents.ENEMY_DIED, this.handleEnemyDeath, this);
    this.gameEvents.off(GameEvents.XP_GAINED, this.handleXpGained, this);
  }
}

/**
 * Example 3: One-Time Listeners
 */
export function oneTimeListenerExample(): void {
  const events = EventManager.getInstance();

  // This will only fire once, then automatically unsubscribe
  events.once(
    GameEvents.BOSS_DEFEATED,
    (payload) => {
      console.log(`Achievement Unlocked: Defeated ${payload.bossName}!`);
      // Show achievement UI, etc.
    },
    undefined
  );
}

/**
 * Example 4: Chaining Events
 * One event can trigger others
 */
export function eventChainingExample(): void {
  const events = EventManager.getInstance();

  // When enemy dies, trigger XP gain
  events.on(
    GameEvents.ENEMY_DIED,
    (payload) => {
      events.emit(GameEvents.XP_GAINED, {
        amount: payload.xpAwarded,
        currentXp: 100,
        xpToNextLevel: 1000,
        source: 'enemy',
      });
    },
    undefined
  );

  // When XP is gained, check for level up
  events.on(
    GameEvents.XP_GAINED,
    (payload) => {
      if (payload.currentXp >= payload.xpToNextLevel) {
        events.emit(GameEvents.LEVEL_UP, {
          previousLevel: 5,
          newLevel: 6,
          skillPointsAwarded: 1,
          totalSkillPoints: 6,
        });
      }
    },
    undefined
  );
}

/**
 * Example 5: Multiple Systems Listening to Same Event
 */
export class CombatSystem {
  private events: EventManager;

  constructor() {
    this.events = EventManager.getInstance();
    this.events.on(GameEvents.DAMAGE_DEALT, this.trackDamage, this);
  }

  private trackDamage(payload: {
    sourceId: string;
    sourceType: 'tank' | 'skill' | 'module';
    targetId: string;
    targetType: 'enemy' | 'boss';
    damage: number;
    isCrit: boolean;
    remainingHealth: number;
    maxHealth: number;
  }): void {
    console.log(
      `${payload.sourceType} dealt ${payload.damage} damage${payload.isCrit ? ' (CRITICAL!)' : ''}`
    );
  }
}

export class UISystem {
  private events: EventManager;

  constructor() {
    this.events = EventManager.getInstance();
    this.events.on(GameEvents.DAMAGE_DEALT, this.showDamageNumber, this);
  }

  private showDamageNumber(payload: {
    sourceId: string;
    sourceType: 'tank' | 'skill' | 'module';
    targetId: string;
    targetType: 'enemy' | 'boss';
    damage: number;
    isCrit: boolean;
    remainingHealth: number;
    maxHealth: number;
  }): void {
    // Create floating damage number in UI
    console.log(
      `Display: ${payload.damage}${payload.isCrit ? '!' : ''}`
    );
  }
}

export class StatsSystem {
  private events: EventManager;
  private totalDamageDealt: number = 0;

  constructor() {
    this.events = EventManager.getInstance();
    this.events.on(GameEvents.DAMAGE_DEALT, this.recordDamage, this);
  }

  private recordDamage(payload: {
    sourceId: string;
    sourceType: 'tank' | 'skill' | 'module';
    targetId: string;
    targetType: 'enemy' | 'boss';
    damage: number;
    isCrit: boolean;
    remainingHealth: number;
    maxHealth: number;
  }): void {
    this.totalDamageDealt += payload.damage;
  }
}

/**
 * Example 6: Save System Integration
 */
export class SaveSystem {
  private events: EventManager;

  constructor() {
    this.events = EventManager.getInstance();

    // Listen to important game state changes
    this.events.on(GameEvents.LEVEL_UP, this.autoSave, this);
    this.events.on(GameEvents.ZONE_COMPLETED, this.autoSave, this);
    this.events.on(GameEvents.BOSS_DEFEATED, this.autoSave, this);
  }

  private autoSave(): void {
    // Save game state
    console.log('Auto-saving game...');

    // Emit save confirmation
    this.events.emit(GameEvents.GAME_SAVED, {
      timestamp: Date.now(),
      tankLevel: 10,
      currentZone: 3,
      currentAct: 1,
      totalPlayTime: 3600000,
    });
  }
}

/**
 * Example 7: Debugging and Development
 */
export function debuggingExample(): void {
  const events = EventManager.getInstance();

  // Check listener counts
  console.log(
    'ENEMY_DIED listeners:',
    events.listenerCount(GameEvents.ENEMY_DIED)
  );

  // Check if event has any listeners
  if (events.hasListeners(GameEvents.BOSS_DEFEATED)) {
    console.log('Boss defeat is being tracked');
  }

  // Get full debug info
  const debugInfo = events.getDebugInfo();
  console.log('EventManager Debug Info:', debugInfo);

  // In development, events are logged with color coding
  events.emit(GameEvents.WAVE_STARTED, {
    waveNumber: 1,
    zoneNumber: 1,
    actNumber: 1,
    enemyCount: 10,
    isBossWave: false,
  });
}

/**
 * Example 8: Cleaning Up
 */
export function cleanupExample(): void {
  const events = EventManager.getInstance();

  const callback = (payload: { enemyId: string }): void => {
    console.log(payload.enemyId);
  };

  // Subscribe
  events.on(GameEvents.ENEMY_DIED, callback, undefined);

  // Unsubscribe specific callback
  events.off(GameEvents.ENEMY_DIED, callback);

  // Or remove all listeners for an event
  events.removeAllListeners(GameEvents.ENEMY_DIED);

  // Or remove ALL listeners (careful!)
  events.removeAllListeners();
}
