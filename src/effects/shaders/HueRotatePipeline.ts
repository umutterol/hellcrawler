import Phaser from 'phaser';

/**
 * HueRotatePipeline - Hue rotation effect for status effect visuals
 *
 * Adapted from DH's hue.frag for Phaser 3 PostFXPipeline.
 * Rotates the hue of the sprite over time, useful for:
 * - Poison (green shift)
 * - Burning (red/orange shift)
 * - Shock (blue shift)
 *
 * Usage:
 *   sprite.setPostPipeline(HueRotatePipeline);
 *   const pipeline = sprite.getPostPipeline(HueRotatePipeline) as HueRotatePipeline;
 *   pipeline.setSpeed(2.0); // rotation speed
 */

const FRAG_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uSpeed;

varying vec2 outTexCoord;

void main() {
    vec4 tex = texture2D(uMainSampler, outTexCoord);

    float c = cos(uTime * uSpeed);
    float s = sin(uTime * uSpeed);

    mat4 r = mat4(
        0.299, 0.587, 0.114, 0.0,
        0.299, 0.587, 0.114, 0.0,
        0.299, 0.587, 0.114, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
    mat4 g = mat4(
        0.701, -0.587, -0.114, 0.0,
        -0.299, 0.413, -0.114, 0.0,
        -0.300, -0.588, 0.886, 0.0,
        0.0, 0.0, 0.0, 0.0
    );
    mat4 b = mat4(
        0.168, 0.330, -0.497, 0.0,
        -0.328, 0.035, 0.292, 0.0,
        1.250, -1.050, -0.203, 0.0,
        0.0, 0.0, 0.0, 0.0
    );

    mat4 hueRotation = r + g * c + b * s;

    gl_FragColor = tex * hueRotation;
}
`;

export class HueRotatePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private _speed: number = 1.0;

  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'HueRotate',
      fragShader: FRAG_SHADER,
    });
  }

  /**
   * Set the hue rotation speed.
   * @param speed Rotation speed (default 1.0)
   */
  public setSpeed(speed: number): void {
    this._speed = speed;
  }

  onPreRender(): void {
    const time = this.game.loop.time / 1000;
    this.set1f('uTime', time);
    this.set1f('uSpeed', this._speed);
  }
}
