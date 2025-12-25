/**
 * Game Events Enum
 * Centralized event types for the EventManager
 *
 * Phase 1: Core Managers
 */

/**
 * All game event types
 */
export enum GameEvents {
  // Combat Events
  ENEMY_SPAWNED = 'enemy:spawned',
  ENEMY_DIED = 'enemy:died',
  DAMAGE_DEALT = 'damage:dealt',
  DAMAGE_TAKEN = 'damage:taken',

  // Progression Events
  XP_GAINED = 'progression:xp_gained',
  LEVEL_UP = 'progression:level_up',
  GOLD_CHANGED = 'progression:gold_changed',

  // Module Events
  MODULE_DROPPED = 'module:dropped',
  MODULE_EQUIPPED = 'module:equipped',
  MODULE_UNEQUIPPED = 'module:unequipped',
  MODULE_SOLD = 'module:sold',
  SKILL_ACTIVATED = 'skill:activated',
  SKILL_COOLDOWN_STARTED = 'skill:cooldown_started',
  SKILL_COOLDOWN_ENDED = 'skill:cooldown_ended',

  // Slot Events
  SLOT_UNLOCKED = 'slot:unlocked',
  SLOT_UPGRADED = 'slot:upgraded',

  // Wave Events
  WAVE_STARTED = 'wave:started',
  WAVE_COMPLETED = 'wave:completed',
  ZONE_COMPLETED = 'zone:completed',

  // Boss Events
  BOSS_SPAWNED = 'boss:spawned',
  BOSS_DEFEATED = 'boss:defeated',

  // Tank Events
  NEAR_DEATH_ENTERED = 'tank:near_death_entered',
  TANK_REVIVED = 'tank:revived',
  TANK_STAT_UPGRADED = 'tank:stat_upgraded',

  // Save Events
  GAME_SAVED = 'save:saved',
  GAME_LOADED = 'save:loaded',
}

/**
 * Event payload type definitions
 * Each event can carry specific typed data
 */

// Combat Event Payloads
export interface EnemySpawnedPayload {
  enemyId: string;
  enemyType: string;
  x: number;
  y: number;
  health: number;
  waveNumber: number;
}

export interface EnemyDiedPayload {
  enemyId: string;
  enemyType: string;
  killedBy: 'tank' | 'skill';
  xpAwarded: number;
  goldAwarded: number;
}

export interface DamageDealtPayload {
  sourceId: string;
  sourceType: 'tank' | 'skill' | 'module';
  targetId: string;
  targetType: 'enemy' | 'boss';
  damage: number;
  isCrit: boolean;
  remainingHealth: number;
  maxHealth: number;
}

export interface DamageTakenPayload {
  targetId: string;
  targetType: 'tank';
  sourceId: string;
  sourceType: 'enemy' | 'boss';
  damage: number;
  remainingHealth: number;
  maxHealth: number;
}

// Progression Event Payloads
export interface XpGainedPayload {
  amount: number;
  currentXp: number;
  xpToNextLevel: number;
  source: 'enemy' | 'boss' | 'wave_completion';
}

export interface LevelUpPayload {
  previousLevel: number;
  newLevel: number;
  skillPointsAwarded: number;
  totalSkillPoints: number;
}

export interface GoldChangedPayload {
  previousGold: number;
  newGold: number;
  change: number;
  reason: 'enemy_drop' | 'boss_drop' | 'module_sold' | 'purchase' | 'upgrade';
}

// Module Event Payloads
export interface ModuleDroppedPayload {
  moduleId: string;
  rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
  type: string;
  x: number;
  y: number;
  droppedBy: string;
}

export interface ModuleEquippedPayload {
  moduleId: string;
  moduleType: string;
  slotIndex: number;
  previousModuleId: string | null;
}

export interface ModuleUnequippedPayload {
  moduleId: string;
  moduleType: string;
  slotIndex: number;
}

export interface ModuleSoldPayload {
  moduleId: string;
  rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
  goldEarned: number;
}

export interface SkillActivatedPayload {
  skillId: string;
  skillName: string;
  moduleId: string;
  slotIndex: number;
  targetCount: number;
  damage?: number;
  isAutoMode?: boolean; // True if skill was auto-triggered
}

export interface SkillCooldownPayload {
  skillId: string;
  skillName: string;
  moduleId: string;
  slotIndex: number;
  cooldownDuration: number;
}

// Slot Event Payloads
export interface SlotUnlockedPayload {
  slotIndex: number;
  cost: number;
}

export interface SlotUpgradedPayload {
  slotIndex: number;
  newLevel: number;
  cost: number;
}

// Wave Event Payloads
export interface WaveStartedPayload {
  waveNumber: number;
  zoneNumber: number;
  actNumber: number;
  enemyCount: number;
  isBossWave: boolean;
}

export interface WaveCompletedPayload {
  waveNumber: number;
  zoneNumber: number;
  actNumber: number;
  duration: number;
  enemiesKilled: number;
  xpAwarded: number;
  goldAwarded: number;
}

export interface ZoneCompletedPayload {
  zoneNumber: number;
  actNumber: number;
  totalWaves: number;
  totalDuration: number;
  totalEnemiesKilled: number;
  totalXpGained: number;
  totalGoldGained: number;
}

// Boss Event Payloads
export interface BossSpawnedPayload {
  bossId: string;
  bossName: string;
  actNumber: number;
  health: number;
  maxHealth: number;
}

export interface BossDefeatedPayload {
  bossId: string;
  bossName: string;
  actNumber: number;
  duration: number;
  xpAwarded: number;
  goldAwarded: number;
  guaranteedModuleRarity: 'epic' | 'legendary';
}

// Tank Event Payloads
export interface NearDeathEnteredPayload {
  currentHealth: number;
  maxHealth: number;
  threshold: number;
  reviveTimeRemaining: number;
}

export interface TankRevivedPayload {
  restoredHealth: number;
  maxHealth: number;
  cooldownDuration: number;
}

export interface TankStatUpgradedPayload {
  stat: string;
  newLevel: number;
  newValue: number;
  cost: number;
}

// Save Event Payloads
export interface GameSavedPayload {
  timestamp: number;
  tankLevel: number;
  currentZone: number;
  currentAct: number;
  totalPlayTime: number;
}

export interface GameLoadedPayload {
  timestamp: number;
  tankLevel: number;
  currentZone: number;
  currentAct: number;
  totalPlayTime: number;
}

/**
 * Type mapping for event payloads
 * Maps each event to its corresponding payload type
 */
export type EventPayloadMap = {
  [GameEvents.ENEMY_SPAWNED]: EnemySpawnedPayload;
  [GameEvents.ENEMY_DIED]: EnemyDiedPayload;
  [GameEvents.DAMAGE_DEALT]: DamageDealtPayload;
  [GameEvents.DAMAGE_TAKEN]: DamageTakenPayload;
  [GameEvents.XP_GAINED]: XpGainedPayload;
  [GameEvents.LEVEL_UP]: LevelUpPayload;
  [GameEvents.GOLD_CHANGED]: GoldChangedPayload;
  [GameEvents.MODULE_DROPPED]: ModuleDroppedPayload;
  [GameEvents.MODULE_EQUIPPED]: ModuleEquippedPayload;
  [GameEvents.MODULE_UNEQUIPPED]: ModuleUnequippedPayload;
  [GameEvents.MODULE_SOLD]: ModuleSoldPayload;
  [GameEvents.SKILL_ACTIVATED]: SkillActivatedPayload;
  [GameEvents.SKILL_COOLDOWN_STARTED]: SkillCooldownPayload;
  [GameEvents.SKILL_COOLDOWN_ENDED]: SkillCooldownPayload;
  [GameEvents.SLOT_UNLOCKED]: SlotUnlockedPayload;
  [GameEvents.SLOT_UPGRADED]: SlotUpgradedPayload;
  [GameEvents.WAVE_STARTED]: WaveStartedPayload;
  [GameEvents.WAVE_COMPLETED]: WaveCompletedPayload;
  [GameEvents.ZONE_COMPLETED]: ZoneCompletedPayload;
  [GameEvents.BOSS_SPAWNED]: BossSpawnedPayload;
  [GameEvents.BOSS_DEFEATED]: BossDefeatedPayload;
  [GameEvents.NEAR_DEATH_ENTERED]: NearDeathEnteredPayload;
  [GameEvents.TANK_REVIVED]: TankRevivedPayload;
  [GameEvents.TANK_STAT_UPGRADED]: TankStatUpgradedPayload;
  [GameEvents.GAME_SAVED]: GameSavedPayload;
  [GameEvents.GAME_LOADED]: GameLoadedPayload;
};
