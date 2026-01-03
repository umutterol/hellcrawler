# Asset Organization

This document covers the game's asset structure, loading pipeline, and content organization.

## Asset Directory Structure

```
build/assets/
├── animations/          # Character and effect sprite sheets
│   ├── char_dwarf.png
│   ├── char_necromancer.png
│   ├── boss_*.png
│   ├── mob_*.png
│   └── fairy_*.png
│
├── sheets/              # Tileset sprite sheets (original)
│   ├── forest.png
│   ├── desert.png
│   ├── dungeon.png
│   └── ... (61 files)
│
├── sheets_extruded/     # Tileset sheets with extrusion
│   ├── forest.png       # 1px border around each tile
│   ├── desert.png
│   └── ... (61 files)
│
├── tilemaps/            # Tiled JSON map data
│   ├── forest_*.json
│   ├── desert_*.json
│   ├── castle_*.json
│   └── ... (61+ files)
│
├── images/              # UI and game images
│   ├── avatars/         # Character portraits
│   ├── colors/          # Color palettes
│   ├── effects/         # Visual effect sprites
│   ├── items/           # Item icons
│   ├── logos/           # Logo variations
│   ├── particles/       # Particle sprites
│   ├── projectiles/     # Projectile sprites
│   ├── radar/           # Minimap elements
│   ├── skills/          # Skill icons
│   └── potions/         # Potion icons
│
├── sounds/              # Sound effects
│   ├── arrow.mp3
│   ├── boom.mp3
│   ├── hit.mp3
│   └── ... (44 files)
│
├── music/               # Background music
│   ├── forest_theme.mp3
│   ├── battle_theme.mp3
│   └── ... (23 files)
│
├── shaders/             # GLSL fragment shaders
│   ├── damageEffect.frag
│   ├── flashEffect.frag
│   ├── hue.frag
│   └── tv.frag
│
├── fonts/               # Custom fonts
│   ├── BlinkyStar.ttf
│   ├── PressStart2P.ttf
│   ├── SVBasicManual-Bold.otf
│   └── SuperCartoon.ttf
│
├── cursor/              # Custom cursors
│   ├── cursor_default.png
│   ├── cursor_default.cur
│   ├── cursor_pointer.png
│   └── ...
│
└── icons/               # Application icons
    ├── icon.png
    ├── icon.icns        # macOS
    └── icon.ico         # Windows
```

## Asset Categories

### Animations (42 files)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANIMATION ASSETS                              │
└─────────────────────────────────────────────────────────────────┘

    Characters:
    ├── char_dwarf.png       # Dwarf character animations
    ├── char_necromancer.png # Necromancer animations
    ├── char_edric.png       # Warrior hero
    ├── char_serewyn.png     # Hunter hero
    ├── char_corin.png       # Assassin hero
    └── char_alaric.png      # Wizard hero

    Bosses:
    ├── boss_slime.png       # Slime boss
    ├── boss_orc.png         # Orc boss
    └── boss_*.png           # Other bosses

    Mobs:
    ├── mob_slime.png        # Basic slime
    ├── mob_skeleton.png     # Skeleton enemy
    └── mob_*.png            # Other enemies

    Effects:
    ├── fairy_fire.png       # Fire fairy
    ├── fairy_water.png      # Water fairy
    └── fairy_*.png          # Other fairies
```

### Sprite Sheet Format

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRITE SHEET LAYOUT                           │
│                                                                  │
│  char_edric.png (128x128, 8x4 frames = 32 frames)               │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┐                      │
│  │ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ Row 0: Idle         │
│  ├────┼────┼────┼────┼────┼────┼────┼────┤                      │
│  │ 8  │ 9  │10  │11  │12  │13  │14  │15  │ Row 1: Walk         │
│  ├────┼────┼────┼────┼────┼────┼────┼────┤                      │
│  │16  │17  │18  │19  │20  │21  │22  │23  │ Row 2: Attack       │
│  ├────┼────┼────┼────┼────┼────┼────┼────┤                      │
│  │24  │25  │26  │27  │28  │29  │30  │31  │ Row 3: Special      │
│  └────┴────┴────┴────┴────┴────┴────┴────┘                      │
│                                                                  │
│  Frame size: 32x32 pixels                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tilesets (61 sheets + 61 extruded)

| Environment | Sheet | Tile Size | Tiles |
|-------------|-------|-----------|-------|
| Forest | `forest.png` | 16x16 | 256 |
| Desert | `desert.png` | 16x16 | 256 |
| Jungle | `jungle.png` | 16x16 | 256 |
| Water | `water.png` | 16x16 | 256 |
| Village | `village.png` | 16x16 | 512 |
| Graveyard | `graveyard.png` | 16x16 | 256 |
| Swamp | `swamp.png` | 16x16 | 256 |
| Castle | `castle.png` | 16x16 | 512 |
| Dungeon | `dungeon.png` | 16x16 | 256 |
| Cave | `cave.png` | 16x16 | 256 |
| Inferno | `inferno.png` | 16x16 | 256 |
| Snow | `snow.png` | 16x16 | 256 |

### Tilemaps (61+ JSON files)

```json
// Example tilemap structure (Tiled format)
{
  "width": 100,
  "height": 10,
  "tilewidth": 16,
  "tileheight": 16,
  "layers": [
    {
      "name": "background",
      "type": "tilelayer",
      "data": [1, 2, 3, ...]
    },
    {
      "name": "ground",
      "type": "tilelayer",
      "data": [...]
    },
    {
      "name": "objects",
      "type": "objectgroup",
      "objects": [...]
    }
  ],
  "tilesets": [
    {
      "firstgid": 1,
      "name": "forest",
      "image": "forest.png"
    }
  ]
}
```

### Sounds (44 files)

| Category | Files | Examples |
|----------|-------|----------|
| Combat | 15 | hit, slash, arrow, boom |
| UI | 8 | click, hover, open, close |
| Player | 6 | footstep, jump, hurt |
| Items | 8 | coin, equip, potion, chest |
| Environment | 7 | door, ambient, water |

### Music (23 tracks)

| Category | Tracks | Duration |
|----------|--------|----------|
| Map themes | 13 | 2-4 min each |
| Combat | 3 | 1-2 min |
| UI/Menu | 4 | 2-3 min |
| Jingles | 3 | 10-30 sec |

## Asset Loading Pipeline

### Phaser Preloader

```javascript
// Scene preload method
preload() {
  // Progress bar
  this.load.on('progress', (value) => {
    progressBar.setScale(value, 1);
  });

  // Load sprite sheets
  this.load.spritesheet('char_edric', 'animations/char_edric.png', {
    frameWidth: 32,
    frameHeight: 32
  });

  // Load tilemaps
  this.load.tilemapTiledJSON('forest', 'tilemaps/forest.json');

  // Load tileset images (extruded)
  this.load.image('forest_tiles', 'sheets_extruded/forest.png', {
    margin: 1,
    spacing: 2
  });

  // Load audio
  this.load.audio('hit', 'sounds/hit.mp3');
  this.load.audio('forest_theme', 'music/forest_theme.mp3');

  // Load shaders
  this.load.glsl('damageEffect', 'shaders/damageEffect.frag');
}
```

### Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSET LOADING FLOW                            │
└─────────────────────────────────────────────────────────────────┘

    1. Boot Scene (minimal assets)
         │
         ▼
    2. Preloader Scene
         ├── Show loading screen
         ├── Load core assets
         │   ├── UI sprites
         │   ├── Common sounds
         │   └── Fonts
         └── Load progress: 0% → 100%
         │
         ▼
    3. Main Menu Scene
         ├── Load menu assets
         └── Wait for user
         │
         ▼
    4. Game Scene (per-map)
         ├── Load map tileset
         ├── Load map JSON
         ├── Load map music
         └── Load enemy sprites
```

### Lazy Loading

```javascript
// Load assets on demand
const loadMap = async (mapId) => {
  // Check if already loaded
  if (scene.cache.tilemap.exists(mapId)) {
    return;
  }

  // Show loading indicator
  showLoadingSpinner();

  // Load tilemap and tileset
  await new Promise(resolve => {
    scene.load.tilemapTiledJSON(mapId, `tilemaps/${mapId}.json`);
    scene.load.image(`${mapId}_tiles`, `sheets_extruded/${mapId}.png`);
    scene.load.once('complete', resolve);
    scene.load.start();
  });

  hideLoadingSpinner();
};
```

## Tile Extrusion

### Why Extrude?

```
┌─────────────────────────────────────────────────────────────────┐
│                    TILE BLEEDING FIX                             │
│                                                                  │
│  Problem: Texture filtering causes color bleeding                │
│                                                                  │
│  Original 16x16 tile:          Extruded 18x18 tile:             │
│  ┌────────────────┐            ┌──────────────────┐             │
│  │                │            │ ┌──────────────┐ │             │
│  │     TILE       │    ==>     │ │              │ │             │
│  │                │            │ │    TILE      │ │             │
│  │                │            │ │              │ │             │
│  └────────────────┘            │ └──────────────┘ │             │
│                                └──────────────────┘             │
│                                  ↑                              │
│                        1px border of edge colors                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Extrusion Process

```bash
# Run extrusion script
npm run extrude

# Uses tile-extruder package
# Configuration in scripts/extruder.js

# Input: src/assets/sheets/*.png (16x16 tiles)
# Output: build/assets/sheets_extruded/*.png (18x18 cells)
```

### Extrusion Configuration

```javascript
// scripts/extruder.js
const tileExtruder = require('tile-extruder');

tileExtruder({
  input: 'src/assets/sheets/forest.png',
  output: 'build/assets/sheets_extruded/forest.png',
  tileWidth: 16,
  tileHeight: 16,
  margin: 0,
  spacing: 0,
  extrusion: 1 // 1px border
});
```

## Font Loading

### @telazer/font-loader

```javascript
import { FontLoader } from '@telazer/font-loader';

// Load custom fonts
await FontLoader.load([
  { name: 'PressStart2P', url: 'fonts/PressStart2P.ttf' },
  { name: 'BlinkyStar', url: 'fonts/BlinkyStar.ttf' }
]);

// Use in Phaser text
const text = scene.add.text(100, 50, 'Score: 0', {
  fontFamily: 'PressStart2P',
  fontSize: '16px'
});
```

### CSS Font Face

```css
@font-face {
  font-family: 'PressStart2P';
  src: url('fonts/PressStart2P.ttf') format('truetype');
  font-display: swap;
}

@font-face {
  font-family: 'BlinkyStar';
  src: url('fonts/BlinkyStar.ttf') format('truetype');
  font-display: swap;
}
```

## Shader Loading

### GLSL Files

```javascript
// Load shader
preload() {
  this.load.glsl('damageEffect', 'shaders/damageEffect.frag');
}

// Create pipeline
create() {
  const shader = new Phaser.Renderer.WebGL.Pipelines.SinglePipeline({
    game: this.game,
    fragShader: this.cache.shader.get('damageEffect')
  });

  this.game.renderer.pipelines.add('DamageEffect', shader);
}
```

## Asset Optimization

### Image Optimization

| Format | Use Case | Compression |
|--------|----------|-------------|
| PNG | Sprites, UI | Lossless |
| PNG-8 | Simple icons | Indexed color |
| WebP | Optional alt | Lossy/Lossless |

### Audio Optimization

| Format | Use Case | Quality |
|--------|----------|---------|
| MP3 | Music | 128-192 kbps |
| MP3 | SFX | 96-128 kbps |
| OGG | Fallback | Similar to MP3 |

### Texture Atlases

```javascript
// Using texture atlas for batched rendering
this.load.atlas(
  'ui_atlas',
  'images/ui_atlas.png',
  'images/ui_atlas.json'
);

// Access frames
const button = scene.add.image(0, 0, 'ui_atlas', 'button_green');
```

## Asset Manifest

### Build Output Summary

| Category | Count | Size |
|----------|-------|------|
| Animations | 42 | ~2 MB |
| Tilesets | 122 | ~5 MB |
| Tilemaps | 61 | ~1 MB |
| Images | ~100 | ~3 MB |
| Sounds | 44 | ~2 MB |
| Music | 23 | ~30 MB |
| Shaders | 4 | ~10 KB |
| Fonts | 4 | ~500 KB |
| **Total** | ~400 | ~45 MB |

## Development Workflow

### Watch Mode

```bash
# Auto-extrude on sprite changes
npm run watch:extrude

# Auto-parse tilemap changes
npm run watch:tilesetData

# Run both
npm run watch
```

### Adding New Assets

```
1. Add source file to src/assets/
2. Run appropriate script:
   - Sprites: npm run extrude
   - Tilemaps: npm run tilesetData
3. Load in scene preload()
4. Use in game
```

## Related Documentation

- [01-architecture.md](./01-architecture.md) - Build pipeline
- [08-rendering.md](./08-rendering.md) - Rendering with assets
- [10-visual-effects.md](./10-visual-effects.md) - Shader usage
- [11-audio.md](./11-audio.md) - Audio assets
