#define SHADER_NAME FLASH_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uFlashStart;
uniform float uFlashDuration;
uniform float uFlashStrength;

varying vec2 outTexCoord;
varying float outTexId;
varying vec4 outTint;

float flashAmount(float t, float startTime, float duration) {
    if (startTime < 0.0) {
        return 0.0;
    }
    float x = clamp((t - startTime) / max(0.0001, duration), 0.0, 1.0);
    return 1.0 - smoothstep(0.0, 1.0, x);
}

void main() {
    vec4 base = texture2D(uMainSampler, outTexCoord);
    float amt = flashAmount(uTime, uFlashStart, uFlashDuration) * uFlashStrength;
    vec3 color = mix(base.rgb, vec3(1.0), clamp(amt, 0.0, 1.0));
    gl_FragColor = vec4(color, base.a);
}


