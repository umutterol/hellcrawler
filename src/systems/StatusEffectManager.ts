/**
 * StatusEffectManager - Manages status effects on all entities
 *
 * Handles effect application, stacking, ticking, and removal.
 * Uses a Map keyed by entity ID for O(1) lookups.
 *
 * Adapted from DH's status effect system (docs/04-combat-system.md).
 */

import { EventManager, getEventManager } from '../managers/EventManager';
import { GameEvents } from '../types/GameEvents';
import {
  StatusEffectType,
  StatusEffectConfig,
  ActiveStatusEffect,
  StatusEffectSource,
} from '../types/StatusEffectTypes';

/**
 * Default configurations for each status effect type.
 * Values adapted from DH and tuned for Hellcrawler balance.
 */
const STATUS_EFFECT_CONFIGS: Record<StatusEffectType, StatusEffectConfig> = {
  [StatusEffectType.Poison]: {
    type: StatusEffectType.Poison,
    duration: 5000,
    tickRate: 1000,
    maxStacks: 5,
    tintColor: 0x44ff44, // Green
  },
  [StatusEffectType.Burning]: {
    type: StatusEffectType.Burning,
    duration: 3000,
    tickRate: 500,
    maxStacks: 3,
    tintColor: 0xff6600, // Orange-red
  },
  [StatusEffectType.Shock]: {
    type: StatusEffectType.Shock,
    duration: 1000,
    tickRate: 0, // Instant effect, no ticking
    maxStacks: 1,
    tintColor: 0x4488ff, // Blue
  },
  [StatusEffectType.Slow]: {
    type: StatusEffectType.Slow,
    duration: 4000,
    tickRate: 0,
    maxStacks: 3,
    tintColor: 0x88bbff, // Light blue
  },
  [StatusEffectType.ShieldBreak]: {
    type: StatusEffectType.ShieldBreak,
    duration: 3000,
    tickRate: 0,
    maxStacks: 1,
    tintColor: 0xffcc00, // Gold
  },
  [StatusEffectType.Disarm]: {
    type: StatusEffectType.Disarm,
    duration: 2000,
    tickRate: 0,
    maxStacks: 1,
    tintColor: 0xcc44cc, // Purple
  },
};

/**
 * Callback interface for effect listeners.
 * The StatusEffectManager communicates what happened; the entity applies it.
 */
export interface StatusEffectCallbacks {
  onEffectApplied(targetId: string, type: StatusEffectType, stacks: number): void;
  onEffectTick(targetId: string, type: StatusEffectType, stacks: number): void;
  onEffectRemoved(targetId: string, type: StatusEffectType): void;
}

export class StatusEffectManager {
  private static instance: StatusEffectManager | null = null;
  private eventManager: EventManager;

  /** Active effects keyed by entity ID */
  private activeEffects: Map<string, ActiveStatusEffect[]> = new Map();

  private constructor() {
    this.eventManager = getEventManager();
  }

  public static getInstance(): StatusEffectManager {
    if (!StatusEffectManager.instance) {
      StatusEffectManager.instance = new StatusEffectManager();
    }
    return StatusEffectManager.instance;
  }

  /**
   * Get the default config for a status effect type.
   */
  public static getConfig(type: StatusEffectType): StatusEffectConfig {
    return STATUS_EFFECT_CONFIGS[type];
  }

  // ============================================================================
  // APPLY / STACK EFFECTS
  // ============================================================================

  /**
   * Apply a status effect to a target entity.
   * If the effect already exists, stacks are increased (up to maxStacks).
   * If maxStacks is reached, the duration is refreshed.
   */
  public applyEffect(
    targetId: string,
    source: StatusEffectSource,
    currentTime: number
  ): boolean {
    // Roll the chance
    if (Math.random() > source.chance) {
      return false;
    }

    const config = STATUS_EFFECT_CONFIGS[source.type];
    const duration = source.duration ?? config.duration;

    let effects = this.activeEffects.get(targetId);
    if (!effects) {
      effects = [];
      this.activeEffects.set(targetId, effects);
    }

    // Check if this effect type already exists
    const existing = effects.find((e) => e.type === source.type);

    if (existing) {
      // Add stacks or refresh duration
      const stacksToAdd = source.stacks ?? 1;
      if (existing.stacks < config.maxStacks) {
        existing.stacks = Math.min(existing.stacks + stacksToAdd, config.maxStacks);
      }
      // Refresh duration
      existing.remainingDuration = duration;
      existing.startTime = currentTime;
    } else {
      // New effect
      effects.push({
        type: source.type,
        stacks: source.stacks ?? 1,
        startTime: currentTime,
        lastTickTime: currentTime,
        remainingDuration: duration,
      });
    }

    this.eventManager.emit(GameEvents.STATUS_EFFECT_APPLIED, {
      targetId,
      effectType: source.type,
      stacks: existing?.stacks ?? (source.stacks ?? 1),
      duration,
    });

    return true;
  }

  // ============================================================================
  // UPDATE (TICK ALL ACTIVE EFFECTS)
  // ============================================================================

  /**
   * Update all active effects. Call once per frame from CombatSystem.
   * Returns a list of tick events for the caller to process.
   */
  public update(currentTime: number, delta: number): StatusEffectTickResult[] {
    const results: StatusEffectTickResult[] = [];

    for (const [targetId, effects] of this.activeEffects) {
      // Process in reverse so we can splice expired effects
      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i]!;
        const config = STATUS_EFFECT_CONFIGS[effect.type];

        // Reduce remaining duration
        effect.remainingDuration -= delta;

        // Check for tick
        if (config.tickRate > 0) {
          const timeSinceLastTick = currentTime - effect.lastTickTime;
          if (timeSinceLastTick >= config.tickRate) {
            effect.lastTickTime = currentTime;
            results.push({
              targetId,
              type: effect.type,
              stacks: effect.stacks,
              event: 'tick',
            });

            this.eventManager.emit(GameEvents.STATUS_EFFECT_TICK, {
              targetId,
              effectType: effect.type,
              stacks: effect.stacks,
            });
          }
        }

        // Check for expiry
        if (effect.remainingDuration <= 0) {
          effects.splice(i, 1);
          results.push({
            targetId,
            type: effect.type,
            stacks: 0,
            event: 'removed',
          });

          this.eventManager.emit(GameEvents.STATUS_EFFECT_REMOVED, {
            targetId,
            effectType: effect.type,
          });
        }
      }

      // Clean up empty entries
      if (effects.length === 0) {
        this.activeEffects.delete(targetId);
      }
    }

    return results;
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get all active effects on a target.
   */
  public getActiveEffects(targetId: string): readonly ActiveStatusEffect[] {
    return this.activeEffects.get(targetId) ?? [];
  }

  /**
   * Check if a target has a specific effect.
   */
  public hasEffect(targetId: string, type: StatusEffectType): boolean {
    const effects = this.activeEffects.get(targetId);
    return effects?.some((e) => e.type === type) ?? false;
  }

  /**
   * Get the number of stacks for a specific effect on a target.
   */
  public getEffectStacks(targetId: string, type: StatusEffectType): number {
    const effects = this.activeEffects.get(targetId);
    const effect = effects?.find((e) => e.type === type);
    return effect?.stacks ?? 0;
  }

  /**
   * Remove all effects from a target.
   * MUST be called when an enemy is deactivated (returned to pool).
   */
  public removeAllEffects(targetId: string): void {
    const effects = this.activeEffects.get(targetId);
    if (effects) {
      for (const effect of effects) {
        this.eventManager.emit(GameEvents.STATUS_EFFECT_REMOVED, {
          targetId,
          effectType: effect.type,
        });
      }
      this.activeEffects.delete(targetId);
    }
  }

  /**
   * Remove a specific effect type from a target.
   */
  public removeEffect(targetId: string, type: StatusEffectType): void {
    const effects = this.activeEffects.get(targetId);
    if (!effects) return;

    const index = effects.findIndex((e) => e.type === type);
    if (index !== -1) {
      effects.splice(index, 1);
      this.eventManager.emit(GameEvents.STATUS_EFFECT_REMOVED, {
        targetId,
        effectType: type,
      });
    }

    if (effects.length === 0) {
      this.activeEffects.delete(targetId);
    }
  }

  /**
   * Get the speed multiplier for a target from Slow stacks.
   * Returns 1.0 for no slow, down to 0.4 at max stacks.
   */
  public getSpeedMultiplier(targetId: string): number {
    const stacks = this.getEffectStacks(targetId, StatusEffectType.Slow);
    if (stacks === 0) return 1.0;
    // 20% slow per stack, minimum 40% speed
    return Math.max(0.4, 1.0 - stacks * 0.2);
  }

  /**
   * Check if a target is stunned (Shock effect).
   */
  public isStunned(targetId: string): boolean {
    return this.hasEffect(targetId, StatusEffectType.Shock);
  }

  /**
   * Check if a target is disarmed.
   */
  public isDisarmed(targetId: string): boolean {
    return this.hasEffect(targetId, StatusEffectType.Disarm);
  }

  /**
   * Get defense reduction multiplier from ShieldBreak.
   * Returns 1.0 for no shield break, 0.5 when active (50% defense ignored).
   */
  public getDefenseMultiplier(targetId: string): number {
    if (this.hasEffect(targetId, StatusEffectType.ShieldBreak)) {
      return 0.5; // 50% defense ignored
    }
    return 1.0;
  }
}

/**
 * Result from a status effect update tick.
 */
export interface StatusEffectTickResult {
  targetId: string;
  type: StatusEffectType;
  stacks: number;
  event: 'tick' | 'removed';
}

export function getStatusEffectManager(): StatusEffectManager {
  return StatusEffectManager.getInstance();
}
