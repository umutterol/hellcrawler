# Idle Game - Technical Documentation

Comprehensive technical documentation for this Phaser 4 idle game implementation.

## Game Overview

This is a desktop idle/incremental game built with modern web technologies featuring:

- Auto-combat gameplay with 4 playable characters
- 13+ explorable map environments
- Equipment, crafting, and progression systems
- Steam and Twitch integration
- Multi-platform support (Windows, macOS, Linux)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Game Engine | Phaser 4.0.0 RC4 |
| Desktop Framework | Electron 36 |
| Language | TypeScript |
| Build Tool | Vite |
| State Persistence | electron-store |
| Localization | i18next |

## Documentation Index

| File | Description |
|------|-------------|
| [01-architecture.md](./01-architecture.md) | Project structure, tech stack, build pipeline |
| [02-game-loop.md](./02-game-loop.md) | Phaser scenes, update cycle, lifecycle |
| [03-state-management.md](./03-state-management.md) | Stores, save/load, persistence |
| [04-combat-system.md](./04-combat-system.md) | Auto-attack, damage, skills, effects |
| [05-progression.md](./05-progression.md) | Leveling, maps, difficulty scaling |
| [06-economy.md](./06-economy.md) | Currencies, crafting materials, drops |
| [07-inventory.md](./07-inventory.md) | Equipment, chests, crafting recipes |
| [08-rendering.md](./08-rendering.md) | Phaser rendering, tilemaps, sprites |
| [09-ui-system.md](./09-ui-system.md) | UI kit, DOM overlay, components |
| [10-visual-effects.md](./10-visual-effects.md) | Shaders, particles, animations |
| [11-audio.md](./11-audio.md) | Sound effects, music, audio management |
| [12-platform.md](./12-platform.md) | Electron, Steam, Twitch integration |
| [13-assets.md](./13-assets.md) | Asset organization, loading pipeline |

## Glossary

### Core Concepts

| Term | Definition |
|------|------------|
| **Idle Game** | A game genre where progress continues automatically, even when not actively playing |
| **Character** | A playable hero with stats and equipment |
| **Map** | An explorable environment with enemies and difficulty scaling |
| **Sidekick** | Companion characters that fight alongside the main character |
| **Fairy** | A companion system with its own progression |

### Technical Terms

| Term | Definition |
|------|------------|
| **Scene** | A Phaser container managing game objects, update loops, and rendering |
| **Store** | A state management container (gameStore, inventoryStore, progressStore, settingsStore) |
| **Chest** | An inventory container category (21 types) |
| **Tilemap** | A grid-based map composed of tile sprites |
| **Shader** | A GLSL program for visual effects (damage flash, hue shift) |

### Stat Types

| Stat | Description |
|------|-------------|
| `attack` | Base damage multiplier |
| `defense` | Damage reduction |
| `agility` | Attack speed modifier |
| `vampiric` | Health steal percentage |
| `poison` | Damage over time chance |
| `burning` | Fire damage over time |
| `shock` | Stun/interrupt chance |
| `slow` | Enemy speed reduction |
| `gold_income` | Gold drop multiplier |
| `exp_income` | Experience gain multiplier |
| `drop_rate` | Item drop chance multiplier |
| `cooldown_reduction` | Skill cooldown reduction |

### File Conventions

| Extension | Purpose |
|-----------|---------|
| `.pxt` | Save file (Base64 encoded JSON) |
| `.frag` | Fragment shader (GLSL) |
| `.png` | Sprite sheets, UI elements |
| `.json` | Tilemap data, configuration |

## Quick Start for Developers

```bash
# Install dependencies
npm install

# Start development (web + Electron)
npm start

# Build for production
npm run build

# Package for distribution
npm run make:all
```

## Project Structure Overview

```
project-root/
├── src/                    # Source code (TypeScript)
│   ├── electron/           # Electron main process
│   └── ...                 # Game source
├── build/                  # Production build output
│   ├── index.*.js          # Bundled game code
│   ├── assets/             # Game assets
│   └── electron/           # Compiled Electron code
├── node_modules/           # Dependencies
│   └── @telazer/           # Custom helper libraries
├── save/                   # Save data files
└── docs/                   # This documentation
```
