# Game Loop & Scene Management

This document covers Phaser's game loop, scene lifecycle, and how the game manages different screens.

## Phaser Game Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                      PHASER GAME LOOP                            │
│                   (requestAnimationFrame)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. INPUT PROCESSING                                             │
│     ├── Keyboard events                                          │
│     ├── Mouse/Pointer events                                     │
│     └── Touch events                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. UPDATE PHASE                                                 │
│     ├── Scene.update(time, delta)  ← Game logic runs here       │
│     ├── Physics calculations                                     │
│     ├── Animation frame updates                                  │
│     └── Tween/Timer updates                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. RENDER PHASE                                                 │
│     ├── Clear canvas                                             │
│     ├── Draw game objects (depth sorted)                         │
│     ├── Apply shaders/post-processing                            │
│     └── Composite DOM overlay                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [Next Frame Loop]
```

## Scene Architecture

### Scene Types

The game uses multiple scenes for different UI states:

```
┌─────────────────────────────────────────────────────────────────┐
│                       SCENE MANAGER                              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   BATTLE    │  │   UPGRADE   │  │    MENU     │             │
│  │   SCENE     │  │   SCENE     │  │   SCENE     │             │
│  │             │  │             │  │             │             │
│  │ • Combat    │  │ • Character │  │ • Settings  │             │
│  │ • Movement  │  │ • Equipment │  │ • Save/Load │             │
│  │ • Spawning  │  │ • Skills    │  │ • Options   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│        │                │                │                      │
│        └────────────────┴────────────────┘                      │
│                         │                                        │
│                    Scene Events                                  │
│              (SLEEP, WAKE, PAUSE)                               │
└─────────────────────────────────────────────────────────────────┘
```

### Scene Lifecycle

```
┌────────────────┐
│     init()     │  ← Called once when scene is first created
│                │     Initialize scene data, parse config
└───────┬────────┘
        │
        ▼
┌────────────────┐
│   preload()    │  ← Load assets specific to this scene
│                │     Images, sounds, tilemaps
└───────┬────────┘
        │
        ▼
┌────────────────┐
│    create()    │  ← Build the scene
│                │     Create game objects, set up physics
│                │     Bind event listeners
└───────┬────────┘
        │
        ▼
┌────────────────┐
│    update()    │  ← Called every frame (60fps)
│  (time, delta) │     Game logic, movement, collision checks
└───────┬────────┘
        │
        ▼ (on scene transition)
┌────────────────┐
│   shutdown()   │  ← Clean up when scene is stopped
│                │     Remove listeners, destroy objects
└────────────────┘
```

## Scene Implementation Pattern

```javascript
// Typical scene structure (conceptual)
class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    // Receive data from previous scene
    this.mapId = data.mapId;
    this.characterId = data.characterId;
  }

  preload() {
    // Load map-specific assets
    this.load.tilemapTiledJSON('map', `tilemaps/${this.mapId}.json`);
    this.load.spritesheet('tileset', `sheets/${this.mapId}.png`);
  }

  create() {
    // Create tilemap
    this.tilemap = this.make.tilemap({ key: 'map' });

    // Create character sprite
    this.character = new Character(this, this.characterId);

    // Set up combat system
    this.combatSystem = new CombatSystem(this);

    // Bind pause/resume events
    this.events.on('pause', this.onPause, this);
    this.events.on('resume', this.onResume, this);
  }

  update(time, delta) {
    // Update character (movement, animation)
    this.character.update(delta);

    // Update combat (attacks, damage)
    this.combatSystem.update(delta);

    // Check for enemies
    this.spawnEnemies(time);
  }
}
```

## Scene Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCENE TRANSITIONS                            │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   BATTLE    │
                    │   SCENE     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UPGRADE   │    │    MENU     │    │  INVENTORY  │
│   SCENE     │    │   SCENE     │    │   SCENE     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
                 (Return to Battle)
```

### Transition Methods

```javascript
// Start a new scene (stops current)
this.scene.start('UpgradeScene', { characterId: 'char_edric' });

// Launch scene in parallel (overlay)
this.scene.launch('MenuScene');

// Pause current scene
this.scene.pause('BattleScene');

// Resume paused scene
this.scene.resume('BattleScene');

// Sleep scene (keeps in memory, stops updates)
this.scene.sleep('BattleScene');

// Wake sleeping scene
this.scene.wake('BattleScene');
```

## Update Loop Details

### Delta Time

The `delta` parameter represents milliseconds since last frame:

```javascript
update(time, delta) {
  // time  = total milliseconds since game start
  // delta = milliseconds since last frame (~16.67ms at 60fps)

  // Use delta for frame-rate independent movement
  const speed = 100; // pixels per second
  this.character.x += speed * (delta / 1000);
}
```

### Update Order

Within a single frame:

```
1. Input polling (keyboard, mouse, touch)
2. Timer/Tween updates
3. Physics step
4. Scene.update() calls
5. Animation frame updates
6. Render
```

## Pause/Resume Handling

The game can pause during:
- Menu/settings overlay
- Window losing focus
- Steam overlay
- External interrupts

```javascript
// Scene pause handling
class BattleScene extends Phaser.Scene {
  create() {
    this.events.on('pause', this.onPause, this);
    this.events.on('resume', this.onResume, this);
  }

  onPause() {
    // Stop animations
    this.character.anims.pause();

    // Pause cooldowns (via Button.pause())
    Button.pause();

    // Store current state
    this.pauseTime = Date.now();
  }

  onResume() {
    // Resume animations
    this.character.anims.resume();

    // Resume cooldowns
    Button.resume();

    // Calculate offline progress
    const offlineMs = Date.now() - this.pauseTime;
    this.calculateOfflineProgress(offlineMs);
  }
}
```

## Global Pause System

```
┌─────────────────────────────────────────────────────────────────┐
│                      PAUSE PROPAGATION                           │
└─────────────────────────────────────────────────────────────────┘

         Window Focus Lost / Steam Overlay / Menu Open
                              │
                              ▼
                    ┌─────────────────┐
                    │  Game.pause()   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ AnimHelper      │ │ Button.pause()  │ │ AudioHelper     │
│ .pauseAll()     │ │ (all buttons)   │ │ .pauseMusic()   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
   Stop sprite         Pause cooldown       Mute audio
   animations          timers
```

## Animation Frame Events

The AnimHelper provides frame-based callbacks:

```javascript
// Frame event example
this.sprite.on('frameEvent', (anim, frame, sprite) => {
  if (frame.index === 5) {
    // Trigger attack damage on frame 5
    this.dealDamage();
  }
});

// Animation complete event
this.sprite.on('animationcomplete', (anim) => {
  if (anim.key === 'attack') {
    // Return to idle
    this.sprite.play('idle');
  }
});
```

## Related Documentation

- [03-state-management.md](./03-state-management.md) - State persistence across scenes
- [04-combat-system.md](./04-combat-system.md) - Combat update logic
- [10-visual-effects.md](./10-visual-effects.md) - Animation system details
