/**
 * AudioManager - Manages game audio with pooling and event-driven triggers
 *
 * Features:
 * - SFX pooling to prevent audio popping during rapid fire
 * - Music management with crossfade support
 * - Volume sync with SettingsManager (masterVolume, musicVolume, sfxVolume)
 * - Event-driven sound triggers (combat, UI, progression)
 * - Rate variation for non-repetitive SFX
 *
 * Adapted from DH's @telazer/phaser-audio-helper patterns for Phaser 3.
 */

import Phaser from 'phaser';
import { EventManager, getEventManager } from './EventManager';
import { getSettingsManager } from './SettingsManager';
import { GameEvents, DamageDealtPayload, SkillActivatedPayload } from '../types/GameEvents';

interface SFXPoolConfig {
  key: string;
  poolSize: number;
}

const SFX_POOL_CONFIGS: SFXPoolConfig[] = [
  { key: 'sfx-shot1', poolSize: 5 },
  { key: 'sfx-shot2', poolSize: 5 },
  { key: 'sfx-hit', poolSize: 8 },
  { key: 'sfx-explosion', poolSize: 3 },
];

export class AudioManager {
  private static instance: AudioManager | null = null;

  private scene: Phaser.Scene | null = null;
  private eventManager: EventManager;
  private sfxPools: Map<string, Phaser.Sound.BaseSound[]> = new Map();
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentMusicKey: string | null = null;
  private initialized = false;

  private constructor() {
    this.eventManager = getEventManager();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize AudioManager with a scene reference.
   * Must be called from GameScene.create() after assets are loaded.
   */
  public init(scene: Phaser.Scene): void {
    if (this.initialized) return;

    this.scene = scene;
    this.createPools();
    this.setupEventTriggers();
    this.setupSettingsSync();
    this.initialized = true;

    if (import.meta.env.DEV) {
      console.log('[AudioManager] Initialized with SFX pools');
    }
  }

  // ============================================================================
  // POOL MANAGEMENT
  // ============================================================================

  private createPools(): void {
    if (!this.scene) return;

    for (const config of SFX_POOL_CONFIGS) {
      // Check if the audio key exists in the cache
      if (!this.scene.cache.audio.exists(config.key)) {
        if (import.meta.env.DEV) {
          console.warn(`[AudioManager] Audio key '${config.key}' not found in cache, skipping pool`);
        }
        continue;
      }

      const pool: Phaser.Sound.BaseSound[] = [];
      for (let i = 0; i < config.poolSize; i++) {
        const sound = this.scene.sound.add(config.key);
        pool.push(sound);
      }
      this.sfxPools.set(config.key, pool);
    }
  }

  // ============================================================================
  // SFX PLAYBACK
  // ============================================================================

  /**
   * Play a sound effect from the pool.
   * Finds an idle instance; if all are busy, skips (for rapid-fire sounds).
   */
  public playSFX(
    key: string,
    options?: { volume?: number; rate?: number }
  ): void {
    if (!this.scene || !this.initialized) return;

    const settings = getSettingsManager();
    const effectiveVolume = settings.getEffectiveSFXVolume();
    if (effectiveVolume <= 0) return;

    const baseVolume = options?.volume ?? 1.0;
    const finalVolume = baseVolume * effectiveVolume;

    // Add slight rate variation for natural feel (±10%)
    const baseRate = options?.rate ?? 1.0;
    const finalRate = baseRate * (0.9 + Math.random() * 0.2);

    const pool = this.sfxPools.get(key);
    if (pool) {
      // Find an idle sound in the pool
      const idleSound = pool.find((s) => !s.isPlaying);
      if (idleSound) {
        idleSound.play({ volume: finalVolume, rate: finalRate });
        return;
      }
      // All pool instances are busy — skip for rapid-fire sounds
      return;
    }

    // Fallback: play without pooling for non-pooled sounds
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: finalVolume, rate: finalRate });
    }
  }

  // ============================================================================
  // MUSIC
  // ============================================================================

  /**
   * Play a music track with optional fade-in.
   */
  public playMusic(
    key: string,
    options?: { fadeIn?: number; volume?: number; loop?: boolean }
  ): void {
    if (!this.scene || !this.initialized) return;
    if (!this.scene.cache.audio.exists(key)) return;

    // Don't restart the same track
    if (this.currentMusicKey === key && this.currentMusic?.isPlaying) return;

    // Stop current music
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
    }

    const settings = getSettingsManager();
    const effectiveVolume = settings.getEffectiveMusicVolume();
    const targetVolume = (options?.volume ?? 1.0) * effectiveVolume;

    this.currentMusic = this.scene.sound.add(key, {
      volume: options?.fadeIn ? 0 : targetVolume,
      loop: options?.loop ?? true,
    });
    this.currentMusicKey = key;
    this.currentMusic.play();

    // Fade in
    if (options?.fadeIn && this.currentMusic) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: targetVolume,
        duration: options.fadeIn,
        ease: 'Linear',
      });
    }
  }

  /**
   * Crossfade to a new music track.
   */
  public crossfadeMusic(key: string, duration: number = 2000): void {
    if (!this.scene || !this.initialized) return;
    if (this.currentMusicKey === key) return;
    if (!this.scene.cache.audio.exists(key)) return;

    const oldMusic = this.currentMusic;

    // Fade out old music
    if (oldMusic && oldMusic.isPlaying) {
      this.scene.tweens.add({
        targets: oldMusic,
        volume: 0,
        duration,
        onComplete: () => {
          oldMusic.stop();
          oldMusic.destroy();
        },
      });
    }

    // Start new music with fade in
    this.playMusic(key, { fadeIn: duration });
  }

  /**
   * Stop current music with optional fade-out.
   */
  public stopMusic(options?: { fadeOut?: number }): void {
    if (!this.currentMusic || !this.scene) return;

    if (options?.fadeOut) {
      const music = this.currentMusic;
      this.scene.tweens.add({
        targets: music,
        volume: 0,
        duration: options.fadeOut,
        onComplete: () => {
          music.stop();
          music.destroy();
        },
      });
    } else {
      this.currentMusic.stop();
      this.currentMusic.destroy();
    }

    this.currentMusic = null;
    this.currentMusicKey = null;
  }

  // ============================================================================
  // EVENT-DRIVEN TRIGGERS
  // ============================================================================

  private setupEventTriggers(): void {
    // Combat sounds
    this.eventManager.on(GameEvents.DAMAGE_DEALT, (payload: DamageDealtPayload) => {
      if (payload.isCrit) {
        this.playSFX('sfx-hit', { volume: 1.0, rate: 0.8 });
      } else {
        this.playSFX('sfx-hit', { volume: 0.5 });
      }
    });

    this.eventManager.on(GameEvents.ENEMY_DIED, () => {
      if (Math.random() < 0.3) {
        this.playSFX('sfx-explosion', { volume: 0.4 });
      }
    });

    // Module firing
    this.eventManager.on(GameEvents.SKILL_ACTIVATED, (_payload: SkillActivatedPayload) => {
      this.playSFX('sfx-shot1');
    });

    // Zone music changes
    this.eventManager.on(GameEvents.ZONE_CHANGED, () => {
      this.crossfadeMusic('music-combat', 2000);
    });
  }

  // ============================================================================
  // VOLUME SYNC
  // ============================================================================

  private setupSettingsSync(): void {
    this.eventManager.on(GameEvents.SETTINGS_CHANGED, (payload: { key: string }) => {
      if (['masterVolume', 'musicVolume', 'sfxVolume'].includes(payload.key)) {
        this.updateVolumes();
      }
    });
  }

  /**
   * Update all active sound volumes based on current settings.
   */
  private updateVolumes(): void {
    if (!this.scene) return;

    const settings = getSettingsManager();

    // Update music volume
    if (this.currentMusic && this.currentMusic.isPlaying) {
      const musicVolume = settings.getEffectiveMusicVolume();
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(musicVolume);
    }
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  public pause(): void {
    if (this.scene) {
      this.scene.sound.pauseAll();
    }
  }

  public resume(): void {
    if (this.scene) {
      this.scene.sound.resumeAll();
    }
  }

  public destroy(): void {
    // Destroy all pooled sounds
    for (const pool of this.sfxPools.values()) {
      for (const sound of pool) {
        sound.destroy();
      }
    }
    this.sfxPools.clear();

    // Destroy music
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
      this.currentMusicKey = null;
    }

    this.scene = null;
    this.initialized = false;
  }
}

export function getAudioManager(): AudioManager {
  return AudioManager.getInstance();
}
