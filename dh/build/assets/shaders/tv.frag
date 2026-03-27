#define SHADER_NAME TV_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float time;

varying vec2 outTexCoord;

float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Apply CRT-like screen bend/curvature and return both the bent UV and the radius squared
vec2 applyBend(vec2 uv, out float radiusSquared) {
    // Convert UV from [0,1] to [-1,1] range
    vec2 cuv = uv * 2.0 - 1.0;

    // Apply barrel distortion
    float barrel = 0.05; // Bend amount (higher = more bend)
    radiusSquared = cuv.x * cuv.x + cuv.y * cuv.y;
    cuv *= 1.0 + barrel * radiusSquared;

    // Convert back to [0,1] range
    return (cuv * 0.5 + 0.5);
}

void main() {
    // Apply screen bend effect
    float r2; // Will store the radius squared for vignette
    vec2 uv = applyBend(outTexCoord, r2);

    // Apply wave distortion
    uv.y += sin(uv.x * 80.0 + time * 3.0) * 0.003;

    // Check if we're outside the valid texture area after bending
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent for out of bounds
        return;
    }

    // Apply chromatic aberration
    float r = texture2D(uMainSampler, uv + vec2(0.001, 0.0)).r;
    float g = texture2D(uMainSampler, uv).g;
    float b = texture2D(uMainSampler, uv - vec2(0.001, 0.0)).b;

    vec3 color = vec3(r, g, b);

    // Apply scanlines
    color *= 0.9 + 0.1 * sin(uv.y * 800.0);

    // Apply noise
    color += rand(uv + time) * 0.04 - 0.02;

    // Apply vignette effect to enhance the CRT look
    float vignette = 1.0 - r2 * 0.5;
    color *= vignette;

    // Get the alpha from the original texture
    float alpha = texture2D(uMainSampler, uv).a;
    gl_FragColor = vec4(color, alpha);
}
