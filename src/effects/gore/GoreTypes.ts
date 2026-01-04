/**
 * Gore System Type Definitions
 * Types and interfaces for the gore/ragdoll death system
 */

/**
 * Types of gibs that can be spawned
 * Maps to actual sprite assets in public/assets/effects/gore/gibs/
 */
export enum GibType {
  Torso1 = 'gib-torso1',
  Torso2 = 'gib-torso2',
  Torso3 = 'gib-torso3',
  LowerTorso1 = 'gib-lower-torso-1',
  LowerTorso2 = 'gib-lower-torso-2',
  LowerTorso3 = 'gib-lower-torso-3',
  ArmPart = 'gib-arm-part',
  ArmBackPart = 'gib-arm-back-part',
  ForearmFront = 'gib-forearm-front',
  ForearmBack = 'gib-forearm-back',
}

/**
 * All gib types as an array for random selection
 */
export const ALL_GIB_TYPES: GibType[] = Object.values(GibType);

/**
 * Large gibs (torso pieces) - spawn fewer of these
 */
export const LARGE_GIB_TYPES: GibType[] = [
  GibType.Torso1,
  GibType.Torso2,
  GibType.Torso3,
  GibType.LowerTorso1,
  GibType.LowerTorso2,
  GibType.LowerTorso3,
];

/**
 * Small gibs (limb pieces) - spawn more of these
 */
export const SMALL_GIB_TYPES: GibType[] = [
  GibType.ArmPart,
  GibType.ArmBackPart,
  GibType.ForearmFront,
  GibType.ForearmBack,
];

/**
 * Blood splatter types for ground decals
 * Maps to actual sprite keys loaded in BootScene.ts
 */
export type BloodSplatterType = string;

/**
 * Large blood splatters for ground decals
 */
export const LARGE_BLOOD_TYPES: BloodSplatterType[] = [
  'blood1',
  'blood2',
  'blood3',
  'blood4',
  'blood5',
  'blood6',
  'blood7',
  'blood8',
  'blood9',
];

/**
 * Small blood splatters
 */
export const SMALL_BLOOD_TYPES: BloodSplatterType[] = [
  'blood-small1',
  'blood-small2',
  'blood-small3',
  'blood-small4',
  'blood-small5',
  'blood-small6',
];

/**
 * Configuration for spawning a single gib
 */
export interface GibSpawnConfig {
  x: number;
  y: number;
  type: GibType;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
  scale: number;
  tint?: number;
}

/**
 * Configuration for spawning a blood particle
 */
export interface BloodSpawnConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  scale: number;
  createSplatter: boolean;
}

/**
 * Configuration for a complete gore effect (multiple gibs + blood)
 */
export interface GoreEffectConfig {
  x: number;
  y: number;
  enemyWidth: number;
  enemyHeight: number;
  enemyScale: number;
  enemyTint?: number;
  isBoss: boolean;
}

/**
 * Gore intensity levels for settings
 */
export enum GoreIntensity {
  Off = 'off',
  Low = 'low',
  High = 'high',
}

/**
 * Extended enemy died payload with position data for gore system
 */
export interface EnemyDiedGoreData {
  x: number;
  y: number;
  scale: number;
  tint?: number;
  width: number;
  height: number;
  isBoss: boolean;
}
