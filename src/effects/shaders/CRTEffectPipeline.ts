import Phaser from 'phaser';

/**
 * CRTEffectPipeline - CRT/TV screen effect
 *
 * Adapted from DH's tv.frag for Phaser 3 PostFXPipeline.
 * Applies barrel distortion, scanlines, chromatic aberration,
 * noise, and vignette for a retro CRT look.
 *
 * Intended for the full game camera, not individual sprites.
 *
 * Usage:
 *   camera.setPostPipeline(CRTEffectPipeline);
 */

const FRAG_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;

varying vec2 outTexCoord;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 applyBend(vec2 uv, out float radiusSquared) {
    vec2 cuv = uv * 2.0 - 1.0;
    float barrel = 0.05;
    radiusSquared = cuv.x * cuv.x + cuv.y * cuv.y;
    cuv *= 1.0 + barrel * radiusSquared;
    return (cuv * 0.5 + 0.5);
}

void main() {
    float r2;
    vec2 uv = applyBend(outTexCoord, r2);

    // Wave distortion
    uv.y += sin(uv.x * 80.0 + uTime * 3.0) * 0.003;

    // Out of bounds check
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic aberration
    float r = texture2D(uMainSampler, uv + vec2(0.001, 0.0)).r;
    float g = texture2D(uMainSampler, uv).g;
    float b = texture2D(uMainSampler, uv - vec2(0.001, 0.0)).b;

    vec3 color = vec3(r, g, b);

    // Scanlines
    color *= 0.9 + 0.1 * sin(uv.y * 800.0);

    // Noise
    color += rand(uv + uTime) * 0.04 - 0.02;

    // Vignette
    float vignette = 1.0 - r2 * 0.5;
    color *= vignette;

    float alpha = texture2D(uMainSampler, uv).a;
    gl_FragColor = vec4(color, alpha);
}
`;

export class CRTEffectPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'CRTEffect',
      fragShader: FRAG_SHADER,
    });
  }

  onPreRender(): void {
    const time = this.game.loop.time / 1000;
    this.set1f('uTime', time);
  }
}
