# Gore/Ragdoll Death System Implementation Plan

> **Status:** Planned for future implementation. Add to MasterPlan.md as TIER 2 Polish task.

## Overview
Implement a comprehensive gore system combining fake ragdoll physics, gibs/dismemberment, and blood particles for all enemy deaths.

**Approach:** Universal system using generic gib sprites (tinted per-enemy) with tween-based fake physics.

---

## Asset Creation Prompts

### For AI Image Generator (Midjourney/DALL-E/Stable Diffusion):

```
16-bit pixel art gore sprites for a demon-killing tank game, dark fantasy style.

Create 5 separate sprites with TRANSPARENT backgrounds:

1. GIB-HEAD (16x16 pixels): Round skull/head chunk, cracked, dark red flesh with bone fragments showing through. Black 1px outline.

2. GIB-TORSO (16x20 pixels): Rectangular ribcage/body chunk, exposed bones, dark red meat. Black 1px outline.

3. GIB-LIMB-UPPER (12x8 pixels): Arm or thigh piece, cylindrical, torn ends with bone visible. Black 1px outline.

4. GIB-LIMB-LOWER (8x10 pixels): Small hand/foot piece, mangled, dark red. Black 1px outline.

5. GIB-CHUNK (10x10 pixels): Generic meat chunk, irregular shape, dark red with maroon shadows. Black 1px outline.

Color palette: #660000 (dark red), #990000 (blood), #CC0000 (bright blood), #EEEEEE (bone), #000000 (outline)
Style: Flat pixel art, no anti-aliasing, clear silhouettes at small size
```

### Manual Pixel Art Specs:
- Save as PNG with transparency
- Files: `gib-head.png`, `gib-torso.png`, `gib-limb-upper.png`, `gib-limb-lower.png`, `gib-chunk.png`
- Location: `public/assets/effects/gore/`

---

## Files to Create

```
src/effects/gore/
├── GoreTypes.ts      # Type definitions (GibType enum, configs)
├── GoreConfig.ts     # Constants (pool sizes, velocities, timing)
├── Gib.ts            # Poolable gib with fake ragdoll physics
├── BloodParticle.ts  # Poolable blood droplet
└── GoreManager.ts    # Singleton orchestrator
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/entities/Enemy.ts` | Add position data to ENEMY_DIED event |
| `src/types/GameEvents.ts` | Extend EnemyDiedPayload with x, y, scale, tint, width, height |
| `src/scenes/BootScene.ts` | Load 5 gib sprite textures |
| `src/scenes/GameScene.ts` | Initialize GoreManager in initializeSystems() |

---

## Implementation Steps

### Phase 1: Core Types & Config
1. Create `src/effects/gore/GoreTypes.ts`
   - `GibType` enum: Head, Torso, LimbUpper, LimbLower, Chunk
   - `GibSpawnConfig`, `BloodSpawnConfig`, `GoreEffectConfig` interfaces

2. Create `src/effects/gore/GoreConfig.ts`
   - Pool sizes: 150 gibs, 300 blood, 50 splatters
   - Velocities, rotation speeds, gravity (800 px/s²)
   - Timing: flash 100ms, fade 500ms, persist 1500ms

### Phase 2: Gib System
3. Create `src/effects/gore/Gib.ts`
   - Extends `Phaser.GameObjects.Sprite`
   - Fake ragdoll via tweens (parabolic motion, rotation)
   - Bounce logic when hitting groundY
   - Fade and return to pool after settling

### Phase 3: Blood System
4. Create `src/effects/gore/BloodParticle.ts`
   - Extends `Phaser.GameObjects.Ellipse` (4x6 red droplet)
   - Gravity-affected motion via tweens
   - Optional ground splatter callback

### Phase 4: Manager
5. Create `src/effects/gore/GoreManager.ts`
   - Singleton with `init(scene)` and `destroy()`
   - Creates gib pool, blood pool, splatter pool
   - Listens to `GameEvents.ENEMY_DIED`
   - `spawnGoreEffect(config)` spawns 4-6 gibs + 8-15 blood particles
   - Ground splatters persist 5 seconds then fade

### Phase 5: Integration
6. Modify `src/entities/Enemy.ts` die() method:
   ```typescript
   this.eventManager.emit(GameEvents.ENEMY_DIED, {
     ...existing,
     x: this.x,
     y: this.y,
     scale: this.scale,
     tint: this.tintTopLeft,
     width: this.displayWidth,
     height: this.displayHeight,
   });
   ```
   - Remove fade tween (gore handles visuals)
   - Keep white flash, then immediate deactivate

7. Update `src/types/GameEvents.ts`:
   ```typescript
   export interface EnemyDiedPayload {
     // ...existing fields
     x?: number;
     y?: number;
     scale?: number;
     tint?: number;
     width?: number;
     height?: number;
   }
   ```

8. Add to `src/scenes/BootScene.ts` preload():
   ```typescript
   this.load.image('gib-head', 'assets/effects/gore/gib-head.png');
   this.load.image('gib-torso', 'assets/effects/gore/gib-torso.png');
   this.load.image('gib-limb-upper', 'assets/effects/gore/gib-limb-upper.png');
   this.load.image('gib-limb-lower', 'assets/effects/gore/gib-limb-lower.png');
   this.load.image('gib-chunk', 'assets/effects/gore/gib-chunk.png');
   ```

9. Add to `src/scenes/GameScene.ts`:
   ```typescript
   import { getGoreManager } from '../effects/gore/GoreManager';

   // In initializeSystems():
   getGoreManager().init(this);

   // In shutdown():
   getGoreManager().destroy();
   ```

---

## Fake Ragdoll Physics (Key Algorithm)

```typescript
// Parabolic motion via tween onUpdate
const gravity = 800; // px/s²
let elapsed = 0;
const startY = gib.y;
const startVelY = -250; // upward

scene.tweens.add({
  targets: gib,
  x: gib.x + velocityX * duration / 1000,
  duration: duration,
  onUpdate: (tween) => {
    elapsed = tween.elapsed;
    const t = elapsed / 1000;
    gib.y = startY + (startVelY * t) + (0.5 * gravity * t * t);

    if (gib.y >= groundY) {
      // Bounce or settle
    }
  }
});

// Continuous rotation
scene.tweens.add({
  targets: gib,
  angle: gib.angle + 360,
  duration: 500,
  repeat: -1,
});
```

---

## Performance Budget

| Resource | Count | Notes |
|----------|-------|-------|
| Gib pool | 150 | 30 enemies × 5 gibs |
| Blood pool | 300 | 30 enemies × 10 particles |
| Splatter pool | 50 | Persist longer, fewer created |
| Active tweens | ~100 max | Auto-cleanup on complete |

---

## Testing Checklist

- [ ] Kill fodder enemy → 4-6 gibs fly out with rotation
- [ ] Gibs bounce 2x then settle and fade
- [ ] Blood particles spray upward then fall
- [ ] Some blood creates ground splatters
- [ ] Splatters fade after 5 seconds
- [ ] Boss death → more gibs (8-12) and blood (20-30)
- [ ] 60 FPS maintained with 10 enemies dying simultaneously
- [ ] Gibs tinted to match enemy color (if tint applied)
- [ ] No memory leaks (pools reuse objects)

---

## Optional Enhancements (Post-Implementation)

- Gore intensity setting (Off/Low/High)
- Screen shake on boss deaths
- Gib trails (small particles behind flying gibs)
- Enemy-specific gib sprites for bosses
- Sound effects (squish/splatter)
