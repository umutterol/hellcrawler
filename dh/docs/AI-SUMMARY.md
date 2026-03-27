# AI-Friendly Codebase Summary

This document provides a structured, machine-parseable overview of this idle game codebase for AI agents.

## SYSTEM OVERVIEW

```yaml
project_type: idle_game
genre: incremental_auto_combat
engine: phaser_4.0.0_rc4
platform: electron_36
language: typescript
build_tool: vite
version: 2.4.13
```

## TECHNOLOGY STACK

```json
{
  "runtime": {
    "game_engine": "phaser@4.0.0-rc.4",
    "desktop_shell": "electron@36.5.0",
    "state_persistence": "electron-store@8.1.0"
  },
  "build": {
    "bundler": "vite@5.4.8",
    "language": "typescript@5.0.3",
    "packager": "electron-forge@7.8.1"
  },
  "custom_libraries": [
    "@telazer/game-ui-kit",
    "@telazer/phaser-anim-helper",
    "@telazer/phaser-audio-helper",
    "@telazer/phaser-image-helper",
    "@telazer/phaser-text-helper",
    "@telazer/event-helper",
    "@telazer/font-loader",
    "@telazer/number-formatter",
    "@telazer/json-bigint",
    "@telazer/steamworks",
    "@telazer/version-check"
  ],
  "integrations": [
    "steam_sdk",
    "twitch_chat_tmi.js",
    "gameanalytics",
    "i18next"
  ]
}
```

## FILE STRUCTURE

```
ENTRY_POINTS:
  - electron_main: "electron-loader.js"
  - web_entry: "index.html" -> "src/main.ts"
  - production_build: "build/index.*.js"

DIRECTORIES:
  - source_code: "src/"
  - electron_code: "src/electron/"
  - build_output: "build/"
  - assets: "build/assets/"
  - save_data: "save/"
  - documentation: "docs/"

KEY_FILES:
  - package_config: "package.json"
  - electron_loader: "electron-loader.js"
  - bundled_game: "build/index.mgg5vSgd.js"
  - shaders: "build/assets/shaders/*.frag"
```

## STATE MANAGEMENT

### Store Schema

```json
{
  "stores": {
    "gameStore": {
      "purpose": "character_state_and_active_selections",
      "fields": {
        "version": "string",
        "fairyActive": "boolean",
        "fairyLevel": "number",
        "fairyThreshold": "number",
        "character": "string (active character ID)",
        "sideKicks": "array",
        "sideKicksLimit": "number",
        "characters": "object (character_id -> character_data)"
      }
    },
    "inventoryStore": {
      "purpose": "items_equipment_skills",
      "fields": {
        "version": "string",
        "autoSlots": "object (class_skill_bar -> boolean[])",
        "chests": "object (chest_type -> item[])"
      }
    },
    "progressStore": {
      "purpose": "gameplay_statistics",
      "fields": {
        "version": "string",
        "map": "object (character -> map -> progress)",
        "damage": "object (dealt, received, healed)",
        "kill": "object (total, byMob, byCharacter, bySkill)",
        "goldEarned": "object (total, kill, sell)",
        "itemCooldowns": "object",
        "skillUse": "object",
        "itemUse": "object"
      }
    },
    "settingsStore": {
      "purpose": "user_preferences",
      "fields": {
        "audio": "object (sfxVolume, musicVolume, muted)",
        "graphics": "object (quality, particles, shaders)",
        "window": "object (sizeStep, display, clickThrough)",
        "language": "string"
      }
    }
  }
}
```

### Save File Format

```yaml
file_extension: ".pxt"
encoding: "base64"
inner_format: "json"
location: "save/save-data-{slot}.pxt"

structure:
  ptx: "timestamp (number)"
  gameStore: "object"
  inventoryStore: "object"
  progressStore: "object"
  settingsStore: "object"

decode_method: "JSON.parse(atob(file_content))"
encode_method: "btoa(JSON.stringify(save_data))"
```

## CHARACTER SYSTEM

```json
{
  "character_schema": {
    "location": "string (map:zone format)",
    "level": "number",
    "exp": "number",
    "health": "number",
    "stats": {
      "entity_stat_attack": "number (multiplier)",
      "entity_stat_defense": "number (multiplier)",
      "entity_stat_agility": "number (multiplier)",
      "entity_stat_gold_income": "number",
      "entity_stat_exp_income": "number",
      "entity_stat_drop_rate": "number",
      "entity_stat_walk_speed": "number",
      "entity_stat_dice_rate": "number",
      "entity_stat_vampiric": "number (percent)",
      "entity_stat_dodge": "number (percent)",
      "entity_stat_health_regen": "number",
      "entity_stat_slow": "number (percent)",
      "entity_stat_burning": "number (percent)",
      "entity_stat_poison": "number (percent)",
      "entity_stat_shock": "number (percent)",
      "entity_stat_disarm": "number (percent)",
      "entity_stat_shield_break": "number (percent)",
      "entity_stat_cooldown_reduction": "number",
      "entity_stat_effect_duration": "number",
      "entity_stat_aoe_range": "number",
      "entity_stat_charisma": "number",
      "entity_stat_skill_replacement": "number"
    }
  },
  "character_ids": [
    "char_edric",
    "char_serewyn",
    "char_corin",
    "char_alaric"
  ],
  "class_types": [
    "warrior",
    "hunter",
    "assassin",
    "wizard"
  ]
}
```

## INVENTORY SYSTEM

```json
{
  "chest_types": [
    "shared",
    "backpack",
    "gear",
    "skill_bar",
    "crafting_table",
    "fairy",
    "quest",
    "junk"
  ],
  "item_classes": [
    "item_class:stackable",
    "item_class:consumable",
    "item_class:equippable",
    "item_class:ingredient",
    "item_class:craftable",
    "item_class:skill_bar",
    "item_class:pet_item",
    "item_class:hp_pot",
    "item_class:weapon",
    "item_class:armor"
  ],
  "item_schema": {
    "key": "string (unique identifier)",
    "name": "string (i18n key)",
    "description": "string (i18n key)",
    "type": "string",
    "icon": "string (asset key)",
    "class": "array of item_class strings",
    "defaultChestType": "string",
    "amount": "number (for stackable)",
    "cooldown": "number (ms, for consumable)",
    "consume": "object (skill definition, for consumable)",
    "stats": "object (for equipment)",
    "requirements": "object (for equipment)"
  }
}
```

## MAP SYSTEM

```json
{
  "map_ids": [
    "map:forest",
    "map:desert",
    "map:jungle",
    "map:water",
    "map:village",
    "map:graveyard",
    "map:swamp",
    "map:castle",
    "map:dungeon",
    "map:cave",
    "map:inferno",
    "map:snow",
    "map:mountain"
  ],
  "difficulty_range": {
    "min": 1,
    "max": 50
  },
  "progress_schema": {
    "difficulty": "number (current)",
    "maxDifficulty": "number (highest reached)",
    "killCount": "number",
    "distance": "number (pixels traveled)"
  }
}
```

## COMBAT FORMULAS

```yaml
damage_calculation:
  base_damage: "character.baseAttack * stats.attack"
  skill_modifier: "base_damage * skill.multiplier"
  critical_chance: "min(stats.agility * 0.01, 0.5)"
  critical_multiplier: 2
  final_damage: "max(1, damage - (enemy.defense * enemy.stats.defense))"

effect_application:
  vampiric: "heal = damage_dealt * (stats.vampiric / 100)"
  poison: "chance = stats.poison, dot_damage = target.maxHealth * 0.02"
  burning: "chance = stats.burning, dot_damage = 50 per tick"
  shock: "chance = stats.shock, effect = stun 1 second"
  slow: "chance = stats.slow, effect = speed * 0.8"

difficulty_scaling:
  enemy_health: "base * (1 + (difficulty - 1) * 0.5)"
  enemy_damage: "base * (1 + (difficulty - 1) * 0.3)"
  gold_reward: "base * (1 + (difficulty - 1) * 0.4)"
  exp_reward: "base * (1 + (difficulty - 1) * 0.35)"
```

## RENDERING SYSTEM

```json
{
  "renderer": "phaser_4_webgl_canvas",
  "base_canvas_height": 104,
  "size_steps": [2, 4, 6, 8, 10],
  "pixel_art_mode": true,
  "tile_size": 16,
  "tile_extrusion": 1,
  "depth_layers": {
    "background": -100,
    "ground": 0,
    "decorations": 10,
    "shadows": 25,
    "characters": 50,
    "effects": 75,
    "foreground": 100,
    "ui_phaser": 200,
    "ui_dom": 300
  }
}
```

## UI COMPONENTS

```json
{
  "library": "@telazer/game-ui-kit",
  "components": {
    "Button": {
      "features": ["cooldown", "hold_detection", "shortcuts", "indicators"],
      "events": ["onClick", "onPress", "onRelease", "onHold", "onMouseEnter", "onMouseLeave"],
      "config": {
        "hold_delay_ms": 270,
        "hold_repeat_ms": 90
      }
    },
    "Slider": {
      "features": ["min_max", "steps", "value_display"]
    },
    "Notify": {
      "features": ["queue", "themes", "positions"],
      "themes": ["blue", "red", "tan"],
      "positions": ["top", "left", "right"]
    },
    "Modal": {
      "features": ["title", "content", "buttons"]
    },
    "Input": {
      "features": ["placeholder", "maxLength", "onChange"]
    }
  }
}
```

## SHADER EFFECTS

```yaml
shaders:
  damageEffect.frag:
    purpose: "white flash on damage"
    uniforms:
      - uTime: "float (current time)"
      - uFlashStart: "float (start timestamp)"
      - uFlashDuration: "float (seconds)"
      - uFlashStrength: "float (0-1)"

  hue.frag:
    purpose: "color rotation for status effects"
    uniforms:
      - uTime: "float"
      - uSpeed: "float (rotation speed)"

  flashEffect.frag:
    purpose: "general flash effect"

  tv.frag:
    purpose: "retro scanline effect"
```

## ASSET MANIFEST

```json
{
  "animations": {
    "count": 42,
    "format": "png spritesheet",
    "frame_size": "32x32",
    "types": ["characters", "bosses", "mobs", "fairies", "effects"]
  },
  "tilesets": {
    "count": 61,
    "format": "png",
    "tile_size": "16x16",
    "extruded_versions": true
  },
  "tilemaps": {
    "count": 61,
    "format": "tiled json"
  },
  "sounds": {
    "count": 44,
    "format": "mp3"
  },
  "music": {
    "count": 23,
    "format": "mp3"
  },
  "fonts": {
    "count": 4,
    "names": ["BlinkyStar", "PressStart2P", "SVBasicManual-Bold", "SuperCartoon"]
  },
  "shaders": {
    "count": 4,
    "format": "glsl fragment"
  }
}
```

## PLATFORM CONFIGURATION

```json
{
  "electron": {
    "window": {
      "frame": false,
      "transparent": true,
      "alwaysOnTop": true,
      "resizable": false
    },
    "gpu_flags": {
      "darwin": "use-angle=metal",
      "win32": "use-angle=d3d11",
      "linux": "use-gl=desktop"
    }
  },
  "integrations": {
    "steam": {
      "library": "@telazer/steamworks",
      "features": ["achievements", "overlay_detection"]
    },
    "twitch": {
      "library": "tmi.js",
      "features": ["chat_commands"]
    },
    "analytics": {
      "library": "gameanalytics",
      "events": ["progression", "resource", "design"]
    }
  }
}
```

## KEY PATTERNS

### Event-Driven Architecture
```
events.on('enemyKilled', handler)
events.on('levelUp', handler)
events.on('itemEquipped', handler)
events.on('mapChange', handler)
events.on('gamePause', handler)
events.on('gameResume', handler)
```

### Scene Lifecycle
```
Scene.init(data) -> Scene.preload() -> Scene.create() -> Scene.update(time, delta) -> Scene.shutdown()
```

### State Update Flow
```
Game Action -> Store Update -> Auto-save (debounced 5s) -> .pxt file
```

### Damage Flow
```
Attack -> Calculate Damage -> Apply Defense -> Apply Effects -> Update Health -> Check Death -> Award XP/Gold
```

## COMMON QUERIES

| Task | Location |
|------|----------|
| Find character stats | `gameStore.characters[char_id].stats` |
| Get equipped items | `inventoryStore.chests.gear` |
| Check map progress | `progressStore.map[char_id][map_id]` |
| Get audio settings | `settingsStore.audio` |
| Load save file | `save/save-data-{slot}.pxt` (base64 decode) |
| Find shader code | `build/assets/shaders/*.frag` |
| UI component source | `node_modules/@telazer/game-ui-kit/` |
| Animation helper | `node_modules/@telazer/phaser-anim-helper/` |

## RELATIONSHIP MAP

```
gameStore
  └── characters (4)
        ├── stats (22 stat types)
        ├── location (references map_id)
        └── equipment (references inventoryStore.chests.gear)

inventoryStore
  └── chests (21 types)
        └── items
              ├── stackable items (amount field)
              └── equipment (stats field)

progressStore
  └── map
        └── per-character
              └── per-map (difficulty, kills, distance)

settingsStore
  └── audio, graphics, window, language
```

## MODIFICATION GUIDE

| To modify... | Edit... |
|--------------|---------|
| Character base stats | Source code (not in save) |
| Equipment stats | `inventoryStore.chests.gear[n].stats` |
| Map difficulty | `progressStore.map[char][map].difficulty` |
| Gold amount | Add items or modify `progressStore.goldEarned` |
| Skill cooldowns | Item definitions or `progressStore.itemCooldowns` |
| Audio volume | `settingsStore.audio.sfxVolume/musicVolume` |
| Window size | `settingsStore.window.sizeStep` (2-10) |
