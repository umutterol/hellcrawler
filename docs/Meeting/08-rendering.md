# Rendering System

This document covers Phaser 4's rendering pipeline, tilemap system, sprites, and camera management.

## Rendering Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   RENDERING PIPELINE                             │
└─────────────────────────────────────────────────────────────────┘

    Scene Graph                WebGL/Canvas            Display
┌─────────────────┐       ┌─────────────────┐    ┌─────────────┐
│ Game Objects    │ ───>  │ Render Queue    │ -> │ Canvas      │
│ (sorted by      │       │ (batch draws)   │    │ Element     │
│  depth)         │       │                 │    │             │
└─────────────────┘       └─────────────────┘    └─────────────┘
        │
        ├── Tilemap layers
        ├── Character sprites
        ├── Enemy sprites
        ├── Particle systems
        ├── UI elements
        └── Effects/overlays
```

## Canvas Configuration

### Base Canvas Setup

```javascript
// Phaser game configuration (conceptual)
const config = {
  type: Phaser.WEBGL, // or Phaser.CANVAS fallback
  parent: 'game-container',
  width: 800,
  height: 104 * sizeStep, // 104px base height
  backgroundColor: 'transparent',
  transparent: true,
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};
```

### Resolution Scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                   RESOLUTION SCALING                             │
│                                                                  │
│  Base Height: 104 pixels                                         │
│                                                                  │
│  Size Steps (sizeStep multiplier):                               │
│  ├── Step 2:  208px  (104 × 2)                                  │
│  ├── Step 4:  416px  (104 × 4)                                  │
│  ├── Step 6:  624px  (104 × 6)  ← Default                       │
│  ├── Step 8:  832px  (104 × 8)                                  │
│  └── Step 10: 1040px (104 × 10)                                 │
│                                                                  │
│  Width: Calculated from aspect ratio and display                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tilemap System

### Tilemap Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    TILEMAP LAYERS                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Layer 4: Foreground Objects (depth: 100)                    ││
│  │          Trees, pillars that render in front                ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Layer 3: Characters & Enemies (depth: 50)                   ││
│  │          Dynamic sprites                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Layer 2: Ground Objects (depth: 10)                         ││
│  │          Rocks, grass, decorations                          ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Layer 1: Ground Tiles (depth: 0)                            ││
│  │          Floor/terrain                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Layer 0: Background (depth: -100)                           ││
│  │          Sky, parallax layers                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Available Maps

| Map | Tileset | Layers | Tile Size |
|-----|---------|--------|-----------|
| Forest | `forest.png` | 4 | 16×16 |
| Desert | `desert.png` | 4 | 16×16 |
| Jungle | `jungle.png` | 4 | 16×16 |
| Water | `water.png` | 4 | 16×16 |
| Village | `village.png` | 5 | 16×16 |
| Graveyard | `graveyard.png` | 4 | 16×16 |
| Swamp | `swamp.png` | 4 | 16×16 |
| Castle | `castle.png` | 5 | 16×16 |
| Dungeon | `dungeon.png` | 4 | 16×16 |
| Cave | `cave.png` | 4 | 16×16 |
| Inferno | `inferno.png` | 4 | 16×16 |
| Snow | `snow.png` | 4 | 16×16 |
| Mountain | `mountain.png` | 4 | 16×16 |

### Tilemap Loading

```javascript
// Load tilemap (conceptual)
preload() {
  // Load tilemap JSON (from Tiled)
  this.load.tilemapTiledJSON('forest', 'tilemaps/forest.json');

  // Load tileset image (extruded version for better filtering)
  this.load.image('forest_tiles', 'sheets_extruded/forest.png');
}

create() {
  // Create tilemap
  const map = this.make.tilemap({ key: 'forest' });

  // Add tileset with extrusion margin
  const tileset = map.addTilesetImage(
    'forest',           // Name in Tiled
    'forest_tiles',     // Loaded texture key
    16, 16,             // Tile size
    1, 2                // Margin, spacing (for extrusion)
  );

  // Create layers
  const background = map.createLayer('background', tileset);
  const ground = map.createLayer('ground', tileset);
  const objects = map.createLayer('objects', tileset);
  const foreground = map.createLayer('foreground', tileset);

  // Set depth
  background.setDepth(-100);
  ground.setDepth(0);
  objects.setDepth(10);
  foreground.setDepth(100);
}
```

## Tile Extrusion

### Why Extrusion?

```
┌─────────────────────────────────────────────────────────────────┐
│                    TILE BLEEDING PROBLEM                         │
│                                                                  │
│  Without Extrusion:                                              │
│  ┌────┬────┐                                                    │
│  │    │    │ ← Visible seams between tiles                      │
│  │Tile│Tile│   due to texture filtering                         │
│  │ A  │ B  │                                                    │
│  └────┴────┘                                                    │
│                                                                  │
│  With Extrusion:                                                 │
│  ┌──────────┐                                                   │
│  │  ┌────┐  │ ← 1px border of edge pixels                       │
│  │  │Tile│  │   prevents bleeding                               │
│  │  │ A  │  │                                                   │
│  │  └────┘  │                                                   │
│  └──────────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Extrusion Process

```bash
# npm script
npm run extrude

# Uses tile-extruder package
# Input: src/assets/sheets/*.png
# Output: build/assets/sheets_extruded/*.png
```

## Sprite System

### Sprite Configuration

```javascript
// Sprite creation with @telazer/phaser-image-helper
const character = ImageHelper.createSprite(this, {
  key: 'char_edric',
  frame: 0,
  x: 100,
  y: 200,
  scale: 2,
  origin: { x: 0.5, y: 1 }, // Bottom center
  depth: 50
});
```

### Sprite Sheet Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRITE SHEET LAYOUT                           │
│                                                                  │
│  char_edric.png (example)                                        │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┐                      │
│  │ I1 │ I2 │ I3 │ I4 │ W1 │ W2 │ W3 │ W4 │  Row 0: Idle, Walk  │
│  ├────┼────┼────┼────┼────┼────┼────┼────┤                      │
│  │ A1 │ A2 │ A3 │ A4 │ A5 │ A6 │ D1 │ D2 │  Row 1: Attack, Die │
│  └────┴────┴────┴────┴────┴────┴────┴────┘                      │
│                                                                  │
│  Frame size: 32×32 pixels                                        │
│  Animations defined in JSON or code                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Animation Definition

```javascript
// Animation setup with @telazer/phaser-anim-helper
const anims = AnimHelper.createAnimations(this, 'char_edric', {
  idle: {
    frames: [0, 1, 2, 3],
    frameRate: 8,
    repeat: -1
  },
  walk: {
    frames: [4, 5, 6, 7],
    frameRate: 10,
    repeat: -1
  },
  attack: {
    frames: [8, 9, 10, 11, 12, 13],
    frameRate: 12,
    repeat: 0,
    onComplete: () => this.sprite.play('idle')
  },
  die: {
    frames: [14, 15],
    frameRate: 6,
    repeat: 0
  }
});
```

## Camera System

### Camera Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMERA SETUP                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    WORLD BOUNDS                              ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │                                                       │  ││
│  │  │    ┌─────────────┐                                   │  ││
│  │  │    │   CAMERA    │ ← Follows character               │  ││
│  │  │    │   VIEWPORT  │                                   │  ││
│  │  │    │             │                                   │  ││
│  │  │    │  [Player]   │                                   │  ││
│  │  │    │      →      │                                   │  ││
│  │  │    └─────────────┘                                   │  ││
│  │  │                                                       │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Camera Implementation

```javascript
// Camera setup (conceptual)
create() {
  // Set world bounds from tilemap
  const worldWidth = this.tilemap.widthInPixels;
  const worldHeight = this.tilemap.heightInPixels;

  this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

  // Configure camera
  this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  this.cameras.main.setBackgroundColor('transparent');

  // Follow character with lerp (smooth following)
  this.cameras.main.startFollow(this.character, true, 0.1, 0.1);

  // Dead zone (area where character can move without camera moving)
  this.cameras.main.setDeadzone(100, 50);
}
```

## Depth Sorting

### Depth Layers

| Depth | Contents |
|-------|----------|
| -100 | Background, sky |
| -50 | Parallax layers |
| 0 | Ground tiles |
| 10 | Ground decorations |
| 25 | Shadows |
| 50 | Characters, enemies |
| 75 | Projectiles, effects |
| 100 | Foreground objects |
| 200 | UI elements (Phaser) |
| 300+ | DOM overlay (buttons, etc.) |

### Dynamic Depth

```javascript
// Characters sorted by Y position
update() {
  // Lower Y = further back = lower depth
  this.character.setDepth(50 + this.character.y * 0.01);

  // Enemies follow same rule
  this.enemies.forEach(enemy => {
    enemy.setDepth(50 + enemy.y * 0.01);
  });
}
```

## Pixel Art Rendering

### Configuration

```javascript
// Pixel art settings
const config = {
  render: {
    pixelArt: true,      // Nearest-neighbor filtering
    antialias: false,    // No smoothing
    roundPixels: true    // Prevent sub-pixel rendering
  }
};

// CSS backup
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

### Scaling

```javascript
// Scale sprites without blur
this.sprite.setScale(2); // 2x size, still pixel-perfect

// Transform matrix for consistent scaling
this.cameras.main.setZoom(2);
```

## Performance Considerations

### Texture Atlases

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEXTURE BATCHING                              │
│                                                                  │
│  Without Atlas:                                                  │
│  ├── Draw call per sprite                                        │
│  ├── Texture switch overhead                                     │
│  └── GPU bottleneck                                              │
│                                                                  │
│  With Atlas:                                                     │
│  ├── Single draw call for multiple sprites                       │
│  ├── Same texture = batched                                      │
│  └── Much better performance                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Culling

```javascript
// Only render visible objects
this.cameras.main.cull = true;

// Objects outside camera bounds are not drawn
// Phaser handles this automatically with cull enabled
```

## Related Documentation

- [01-architecture.md](./01-architecture.md) - Build pipeline for assets
- [10-visual-effects.md](./10-visual-effects.md) - Shaders and particles
- [13-assets.md](./13-assets.md) - Asset organization
