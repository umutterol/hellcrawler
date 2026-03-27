# Visual Effects

This document covers shaders, particle systems, animations, and visual feedback.

## Shader System

### Available Shaders

| Shader | File | Purpose |
|--------|------|---------|
| Damage Effect | `damageEffect.frag` | White flash on hit |
| Flash Effect | `flashEffect.frag` | General flash |
| Hue Shift | `hue.frag` | Color rotation |
| TV Effect | `tv.frag` | Retro scanlines |

### Damage Effect Shader

Creates a white flash when characters take damage:

```glsl
// damageEffect.frag
#define SHADER_NAME DAMAGE_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uFlashStart;
uniform float uFlashDuration;
uniform float uFlashStrength;

varying vec2 outTexCoord;

// Smoothstep-based pulse that fades from 1 to 0
float flashAmount(float t, float startTime, float duration) {
    if (startTime < 0.0) {
        return 0.0;
    }
    float endTime = startTime + duration;
    float x = clamp((t - startTime) / max(0.0001, duration), 0.0, 1.0);
    // Ease-out curve for quick pop then fade
    float eased = 1.0 - smoothstep(0.0, 1.0, x);
    return eased;
}

void main() {
    vec4 base = texture2D(uMainSampler, outTexCoord);
    float amt = flashAmount(uTime, uFlashStart, uFlashDuration) * uFlashStrength;

    // Ignore transparent pixels
    float mask = step(0.01, base.a);
    amt *= mask * base.a;

    // Lerp to white while preserving alpha
    vec3 flashColor = vec3(1.0);
    vec3 color = mix(base.rgb, flashColor, clamp(amt, 0.0, 1.0));
    gl_FragColor = vec4(color, base.a);
}
```

#### Usage

```javascript
// Apply damage flash to sprite
const damageShader = scene.game.renderer.pipelines.get('DamageEffect');

sprite.setPipeline(damageShader);
damageShader.set1f('uFlashStart', scene.time.now / 1000);
damageShader.set1f('uFlashDuration', 0.2);
damageShader.set1f('uFlashStrength', 1.0);
```

### Hue Shift Shader

Rotates colors over time (for status effects):

```glsl
// hue.frag
#define SHADER_NAME HUE_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uSpeed;

varying vec2 outTexCoord;

void main() {
    vec4 texture = texture2D(uMainSampler, outTexCoord);

    float c = cos(uTime * uSpeed);
    float s = sin(uTime * uSpeed);

    // Color rotation matrices
    mat4 r = mat4(0.299, 0.587, 0.114, 0.0,
                  0.299, 0.587, 0.114, 0.0,
                  0.299, 0.587, 0.114, 0.0,
                  0.0, 0.0, 0.0, 1.0);

    mat4 g = mat4(0.701, -0.587, -0.114, 0.0,
                  -0.299, 0.413, -0.114, 0.0,
                  -0.300, -0.588, 0.886, 0.0,
                  0.0, 0.0, 0.0, 0.0);

    mat4 b = mat4(0.168, 0.330, -0.497, 0.0,
                  -0.328, 0.035, 0.292, 0.0,
                  1.250, -1.050, -0.203, 0.0,
                  0.0, 0.0, 0.0, 0.0);

    mat4 hueRotation = r + g * c + b * s;

    gl_FragColor = texture * hueRotation;
}
```

#### Usage

```javascript
// Apply hue shift for poison effect
const hueShader = scene.game.renderer.pipelines.get('HueEffect');

poisonedSprite.setPipeline(hueShader);
hueShader.set1f('uSpeed', 2.0); // Rotation speed
```

### Shader Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHADER PIPELINE                               │
└─────────────────────────────────────────────────────────────────┘

    Sprite Texture          Shader Processing         Output
┌─────────────────┐      ┌─────────────────┐      ┌─────────────┐
│ Original        │ ---> │ Fragment Shader │ ---> │ Modified    │
│ Texture         │      │ (per-pixel)     │      │ Pixels      │
└─────────────────┘      └─────────────────┘      └─────────────┘
                               │
                         Uniforms:
                         ├── uTime (current time)
                         ├── uFlashStart
                         ├── uFlashDuration
                         └── uFlashStrength
```

## Particle System

### Particle Emitter Setup

```javascript
// Create particle emitter
const particles = scene.add.particles('particles');

const emitter = particles.createEmitter({
  frame: 'spark',
  lifespan: 1000,
  speed: { min: 50, max: 150 },
  scale: { start: 1, end: 0 },
  alpha: { start: 1, end: 0 },
  angle: { min: 0, max: 360 },
  gravityY: 100,
  quantity: 5,
  frequency: 100
});

// Attach to position
emitter.setPosition(sprite.x, sprite.y);
```

### Particle Types

| Effect | Particle | Description |
|--------|----------|-------------|
| Hit | Spark | Small white/yellow sparks |
| Gold | Coin | Gold coin particles |
| Heal | Heart/Plus | Green healing particles |
| Death | Smoke | Gray dissipating smoke |
| Level Up | Stars | Colorful star burst |
| Poison | Bubbles | Green toxic bubbles |
| Fire | Flame | Orange/red fire particles |

### Effect Examples

```javascript
// Hit effect
const hitEmitter = particles.createEmitter({
  frame: 'spark',
  lifespan: 300,
  speed: { min: 100, max: 200 },
  scale: { start: 0.5, end: 0 },
  angle: { min: -30, max: 30 },
  quantity: 10,
  on: false
});

// Trigger on hit
const playHitEffect = (x, y) => {
  hitEmitter.setPosition(x, y);
  hitEmitter.explode(10);
};

// Gold pickup effect
const goldEmitter = particles.createEmitter({
  frame: 'coin',
  lifespan: 800,
  speed: { min: 50, max: 100 },
  scale: { start: 0.8, end: 0.2 },
  gravityY: -50, // Float upward
  quantity: 1,
  frequency: 50
});
```

## Animation System

### @telazer/phaser-anim-helper

```javascript
import { AnimHelper } from '@telazer/phaser-anim-helper';

// Create animated sprite
const sprite = AnimHelper.createSprite(scene, {
  key: 'char_edric',
  x: 100,
  y: 200,
  scale: 2
});

// Define animations
AnimHelper.addAnimations(scene, 'char_edric', {
  idle: { start: 0, end: 3, frameRate: 8, repeat: -1 },
  walk: { start: 4, end: 7, frameRate: 10, repeat: -1 },
  attack: { start: 8, end: 13, frameRate: 12, repeat: 0 },
  die: { start: 14, end: 15, frameRate: 6, repeat: 0 }
});

// Play animation
sprite.play('walk');
```

### Animation Events

```javascript
// Animation complete callback
sprite.on('animationcomplete', (anim) => {
  if (anim.key === 'attack') {
    sprite.play('idle');
  }
});

// Frame event (e.g., deal damage on specific frame)
sprite.on('animationupdate', (anim, frame) => {
  if (anim.key === 'attack' && frame.index === 5) {
    dealDamage();
  }
});

// Promise-based waiting
await AnimHelper.waitForComplete(sprite, 'attack');
console.log('Attack animation finished');
```

### Speed Control

```javascript
// Global animation speed
AnimHelper.setGlobalSpeed(1.5); // 50% faster

// Individual sprite speed
sprite.anims.timeScale = 2; // Double speed

// Pause all animations
AnimHelper.pauseAll();

// Resume all animations
AnimHelper.resumeAll();
```

## Tween Animations

### Movement Tweens

```javascript
// Move to position
scene.tweens.add({
  targets: sprite,
  x: 300,
  y: 200,
  duration: 1000,
  ease: 'Power2'
});

// Bounce effect
scene.tweens.add({
  targets: sprite,
  y: sprite.y - 20,
  yoyo: true,
  repeat: 2,
  duration: 150,
  ease: 'Sine.easeOut'
});
```

### Visual Tweens

```javascript
// Fade out
scene.tweens.add({
  targets: sprite,
  alpha: 0,
  duration: 500,
  onComplete: () => sprite.destroy()
});

// Scale pulse
scene.tweens.add({
  targets: sprite,
  scaleX: 1.2,
  scaleY: 1.2,
  yoyo: true,
  duration: 200,
  ease: 'Sine.easeInOut'
});

// Color tint
scene.tweens.addCounter({
  from: 0xffffff,
  to: 0xff0000,
  duration: 500,
  onUpdate: (tween) => {
    sprite.setTint(tween.getValue());
  }
});
```

### Damage Number Float

```javascript
// Floating damage number
const createDamageNumber = (scene, x, y, damage) => {
  const text = scene.add.text(x, y, damage.toString(), {
    fontSize: '20px',
    color: '#ff0000',
    fontFamily: 'PressStart2P'
  });

  scene.tweens.add({
    targets: text,
    y: y - 50,
    alpha: 0,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => text.destroy()
  });
};
```

## Visual Feedback Patterns

### Combat Feedback

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMBAT VISUAL FEEDBACK                        │
└─────────────────────────────────────────────────────────────────┘

    Attack:
    ├── Sprite plays attack animation
    ├── Enemy flashes white (damage shader)
    ├── Damage numbers float up
    ├── Hit particles spawn
    └── Camera shake (optional)

    Take Damage:
    ├── Character flashes white
    ├── Health bar decreases (tween)
    └── Screen flash (if critical)

    Heal:
    ├── Green particles rise
    ├── Health bar increases
    └── Heal number floats up

    Level Up:
    ├── Star particle burst
    ├── Character scales up briefly
    ├── Level text appears
    └── Sound effect plays
```

### UI Feedback

```javascript
// Button click feedback
button.on('click', () => {
  // Scale down then up
  scene.tweens.add({
    targets: button.element,
    scaleX: 0.9,
    scaleY: 0.9,
    duration: 50,
    yoyo: true
  });
});

// Error shake
const shakeElement = (element) => {
  scene.tweens.add({
    targets: element,
    x: element.x + 10,
    duration: 50,
    yoyo: true,
    repeat: 3
  });
};

// Success flash
const flashSuccess = (element) => {
  element.style.backgroundColor = '#4CAF50';
  setTimeout(() => {
    element.style.backgroundColor = '';
  }, 200);
};
```

## Effect Timing

### Combat Effect Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATTACK EFFECT TIMELINE                        │
│                                                                  │
│  Time (ms)   0    100   200   300   400   500   600   700      │
│  ──────────────────────────────────────────────────────────────  │
│  Anim      [============ Attack Animation ==============]       │
│  Flash            [===]                                         │
│  Particles           [=======]                                  │
│  Damage #           [============]                              │
│  Sound         [!]                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Coordinated Effects

```javascript
// Coordinated attack effect
const playAttackEffect = async (attacker, target, damage) => {
  // Start attack animation
  attacker.play('attack');

  // Wait for impact frame
  await AnimHelper.waitForFrame(attacker, 'attack', 5);

  // Apply effects simultaneously
  applyDamageFlash(target);
  spawnHitParticles(target.x, target.y);
  showDamageNumber(target.x, target.y, damage);
  playSound('hit');

  // Camera shake for big hits
  if (damage > 1000) {
    scene.cameras.main.shake(100, 0.01);
  }
};
```

## Performance Considerations

### Particle Pooling

```javascript
// Use particle pools
const emitter = particles.createEmitter({
  maxParticles: 100, // Limit active particles
  // ... other config
});

// Pre-warm particles
emitter.preUpdate(100); // Create 100 particles ahead of time
```

### Shader Optimization

```javascript
// Only apply shaders when needed
sprite.resetPipeline(); // Remove shader when effect ends

// Batch similar shaders
const batchedSprites = [sprite1, sprite2, sprite3];
batchedSprites.forEach(s => s.setPipeline(damageShader));
```

## Related Documentation

- [08-rendering.md](./08-rendering.md) - Rendering pipeline
- [04-combat-system.md](./04-combat-system.md) - Combat events
- [11-audio.md](./11-audio.md) - Sound effects
