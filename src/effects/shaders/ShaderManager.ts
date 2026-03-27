import Phaser from 'phaser';
import { DamageFlashPipeline } from './DamageFlashPipeline';
import { HueRotatePipeline } from './HueRotatePipeline';
import { CRTEffectPipeline } from './CRTEffectPipeline';

/**
 * ShaderManager - Registers and provides access to shader pipelines
 *
 * Handles WebGL availability check and provides tint-based fallback
 * when shaders aren't available (Canvas renderer).
 */

let webglAvailable = false;

/**
 * Register all shader pipelines with the game renderer.
 * Call once during boot (BootScene.create).
 */
export function registerShaderPipelines(game: Phaser.Game): void {
  const renderer = game.renderer;

  if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) {
    console.warn('[ShaderManager] WebGL not available — using tint fallback');
    webglAvailable = false;
    return;
  }

  webglAvailable = true;

  renderer.pipelines.addPostPipeline('DamageFlash', DamageFlashPipeline);
  renderer.pipelines.addPostPipeline('HueRotate', HueRotatePipeline);
  renderer.pipelines.addPostPipeline('CRTEffect', CRTEffectPipeline);

  if (import.meta.env.DEV) {
    console.log('[ShaderManager] Registered 3 post-fx pipelines');
  }
}

/**
 * Check if WebGL shaders are available.
 */
export function areShadersAvailable(): boolean {
  return webglAvailable;
}

/**
 * Apply damage flash to a game object with sprite-like interface.
 * Uses shader if available, falls back to tint-based flash.
 */
export function applyDamageFlash(
  gameObject: Phaser.GameObjects.GameObject,
  duration: number = 0.15,
  strength: number = 1.0
): void {
  const sprite = gameObject as Phaser.GameObjects.Sprite;
  if (webglAvailable) {
    const pipeline = sprite.getPostPipeline('DamageFlash') as DamageFlashPipeline | undefined;
    if (pipeline) {
      pipeline.flash(duration, strength);
    }
  } else {
    // Tint-based fallback
    sprite.setTint(0xffffff);
    sprite.scene.time.delayedCall(duration * 1000, () => {
      if (sprite.active) {
        sprite.clearTint();
      }
    });
  }
}

/**
 * Set up a game object for shader effects.
 * Adds DamageFlash pipeline if WebGL is available.
 */
export function setupSpriteShaders(gameObject: Phaser.GameObjects.GameObject): void {
  if (webglAvailable) {
    (gameObject as Phaser.GameObjects.Sprite).setPostPipeline('DamageFlash');
  }
}

/**
 * Remove shader pipelines from a game object.
 */
export function clearSpriteShaders(gameObject: Phaser.GameObjects.GameObject): void {
  if (webglAvailable) {
    (gameObject as Phaser.GameObjects.Sprite).removePostPipeline('DamageFlash');
  }
}
