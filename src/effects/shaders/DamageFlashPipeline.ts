import Phaser from 'phaser';

/**
 * DamageFlashPipeline - Smooth damage flash effect
 *
 * Adapted from DH's damageEffect.frag for Phaser 3 PostFXPipeline.
 * Uses smoothstep ease-out for a quick white pop then fade,
 * replacing the crude setTint(0xffffff) + 50ms toggle.
 *
 * Usage:
 *   sprite.setPostPipeline(DamageFlashPipeline);
 *   const pipeline = sprite.getPostPipeline(DamageFlashPipeline) as DamageFlashPipeline;
 *   pipeline.flash(duration?, strength?);
 */

const FRAG_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uFlashStart;
uniform float uFlashDuration;
uniform float uFlashStrength;

varying vec2 outTexCoord;

float flashAmount(float t, float startTime, float duration) {
    if (startTime < 0.0) {
        return 0.0;
    }
    float endTime = startTime + duration;
    float x = clamp((t - startTime) / max(0.0001, duration), 0.0, 1.0);
    // Ease-out curve: quick pop then smooth fade
    float eased = 1.0 - smoothstep(0.0, 1.0, x);
    return eased;
}

void main() {
    vec4 base = texture2D(uMainSampler, outTexCoord);
    float amt = flashAmount(uTime, uFlashStart, uFlashDuration) * uFlashStrength;
    // Ignore fully transparent pixels and reduce effect on semi-transparent edges
    float mask = step(0.01, base.a);
    amt *= mask * base.a;

    // Lerp to white while preserving alpha
    vec3 color = mix(base.rgb, vec3(1.0), clamp(amt, 0.0, 1.0));
    gl_FragColor = vec4(color, base.a);
}
`;

export class DamageFlashPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private _flashStart: number = -1;
  private _flashDuration: number = 0.15; // seconds
  private _flashStrength: number = 1.0;

  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'DamageFlash',
      fragShader: FRAG_SHADER,
    });
  }

  /**
   * Trigger a damage flash.
   * @param duration Flash duration in seconds (default 0.15)
   * @param strength Flash intensity 0-1 (default 1.0)
   */
  public flash(duration: number = 0.15, strength: number = 1.0): void {
    this._flashStart = this.game.loop.time / 1000;
    this._flashDuration = duration;
    this._flashStrength = strength;
  }

  onPreRender(): void {
    const time = this.game.loop.time / 1000;
    this.set1f('uTime', time);
    this.set1f('uFlashStart', this._flashStart);
    this.set1f('uFlashDuration', this._flashDuration);
    this.set1f('uFlashStrength', this._flashStrength);
  }
}
