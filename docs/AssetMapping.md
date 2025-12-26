# Hellcrawler MVP Asset Mapping

> This document maps GameDevMarket assets to the game's folder structure.
> Copy the specified source files to the destination paths.

---

## Folder Structure Created

```
public/assets/
├── sprites/
│   ├── tank/              # Player tank sprites
│   ├── enemies/act1/      # Act 1 enemy sprites
│   ├── bosses/            # Boss sprites
│   ├── projectiles/       # Bullets, missiles, cannon shells
│   └── modules/           # Module weapon icons
├── effects/
│   ├── explosions/        # Explosion animations
│   ├── hits/              # Hit impact effects
│   └── muzzle/            # Muzzle flash effects
├── backgrounds/
│   └── act1/              # Act 1 city background layers
├── ui/
│   ├── icons/             # UI icons
│   ├── panels/            # Panel backgrounds
│   └── bars/              # Health/XP bars
└── audio/
    ├── sfx/
    │   ├── weapons/       # Weapon sounds
    │   ├── impacts/       # Hit/explosion sounds
    │   └── ui/            # UI click sounds
    └── music/             # Background music
```

---

## Asset Mapping

### 1. TANK (Player)

| Destination | Source |
|-------------|--------|
| `sprites/tank/tank-sheet.png` | `gamedevmarketassets/Warped Assets/Vehicles/tank-unit/Spritesheets/tank-unit-sheet.png` |
| `sprites/tank/tank1.png` | `gamedevmarketassets/Warped Assets/Vehicles/tank-unit/sprites/tank-unit1.png` |
| `sprites/tank/tank2.png` | `gamedevmarketassets/Warped Assets/Vehicles/tank-unit/sprites/tank-unit2.png` |
| `sprites/tank/tank3.png` | `gamedevmarketassets/Warped Assets/Vehicles/tank-unit/sprites/tank-unit3.png` |
| `sprites/tank/tank4.png` | `gamedevmarketassets/Warped Assets/Vehicles/tank-unit/sprites/tank-unit4.png` |

**Notes:** Tank has 4 animation frames. Use for idle animation or damage states.

---

### 2. ENEMIES - Act 1

#### Imp (Fodder - Fast movement)

| Destination | Source |
|-------------|--------|
| `sprites/enemies/act1/imp-sheet.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Imp/imp-sheet.png` |
| `sprites/enemies/act1/imp-run1.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Imp/run/imp-run1.png` |
| `sprites/enemies/act1/imp-run2.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Imp/run/imp-run2.png` |
| `sprites/enemies/act1/imp-run3.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Imp/run/imp-run3.png` |
| `sprites/enemies/act1/imp-run4.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Imp/run/imp-run4.png` |

#### Hellhound (Fodder - Leap attack)

| Destination | Source |
|-------------|--------|
| `sprites/enemies/act1/hellhound-sheet.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Hell-Hound-Files/Sheets/` (check for spritesheet) |
| `sprites/enemies/act1/hellhound-*.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Hell-Hound-Files/Sprites/` |

**Alternative (Wolf):** If Hellhound doesn't fit, use:
| Destination | Source |
|-------------|--------|
| `sprites/enemies/act1/hellhound-sheet.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Wolf/wolf-sheet.png` |
| `sprites/enemies/act1/hellhound-run*.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Wolf/running/wolf-running*.png` |

#### Possessed Soldier (Fodder - Ranged attack)

**Option A - Mummy (wrapped soldier):**
| Destination | Source |
|-------------|--------|
| `sprites/enemies/act1/soldier-sheet.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Mummy/Mummy-sheet.png` |
| `sprites/enemies/act1/soldier-*.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Mummy/Sprites/Mummy*.png` |

**Option B - Terrible Knight:**
| Destination | Source |
|-------------|--------|
| `sprites/enemies/act1/soldier-*.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Terrible Knight Character/` |

#### Fire Skull (Elite - Explodes on death)

| Destination | Source |
|-------------|--------|
| `sprites/enemies/act1/fireskull-*.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Fire-Skull-Files/Sprites/` |
| `sprites/enemies/act1/fireskull-sheet.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Fire-Skull-Files/Spritesheets/` |

---

### 3. BOSS - Corrupted Sentinel

> Using Boss-Demon as the Act 1 boss (can be reskinned/recolored for robotic look)

| Destination | Source |
|-------------|--------|
| `sprites/bosses/sentinel-idle.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Boss-Demon/Spritesheets/demon-idle.png` |
| `sprites/bosses/sentinel-attack.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Boss-Demon/Spritesheets/demon-attack.png` |
| `sprites/bosses/sentinel-breath.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Boss-Demon/Spritesheets/breath.png` |
| `sprites/bosses/sentinel-breath-fire.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Boss-Demon/Spritesheets/breath-fire.png` |

**Attack frames (individual):**
| Destination | Source |
|-------------|--------|
| `sprites/bosses/sentinel-attack*.png` | `gamedevmarketassets/Gothicvania Assets/Characters/Boss-Demon/Sprites/DemonAttackBreath/demon-attack*.png` |

---

### 4. BACKGROUNDS - Act 1 (City Invasion)

| Destination | Source |
|-------------|--------|
| `backgrounds/act1/sky.png` | `gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/night-town-background-sky.png` |
| `backgrounds/act1/clouds.png` | `gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/night-town-background-clouds.png` |
| `backgrounds/act1/mountains.png` | `gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/night-town-background-mountains.png` |
| `backgrounds/act1/mountains-lights.png` | `gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/night-town-background-mountains-lights.png` |
| `backgrounds/act1/far-buildings.png` | `gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/night-town-background-far-buildings.png` |
| `backgrounds/act1/town.png` | `gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/night-town-background-town.png` |
| `backgrounds/act1/forest.png` | `gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/night-town-background-forest.png` |

**Notes:** These are parallax layers. Order from back to front: sky, clouds, mountains, mountains-lights, far-buildings, forest, town.

---

### 5. PROJECTILES

#### Bullets (Machine Gun)

| Destination | Source |
|-------------|--------|
| `sprites/projectiles/bullet1.png` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/shoot/shoot1.png` |
| `sprites/projectiles/bullet2.png` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/shoot/shoot2.png` |
| `sprites/projectiles/bullet-sheet.png` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/shoot/shoot-spritesheet.png` |

#### Missiles

| Destination | Source |
|-------------|--------|
| `sprites/projectiles/missile*.png` | `gamedevmarketassets/Warped Assets/VFX/Warped shooting fx files/Pixelart/Bolt/frames/bolt*.png` |
| `sprites/projectiles/missile-sheet.png` | `gamedevmarketassets/Warped Assets/VFX/Warped shooting fx files/Pixelart/Bolt/bolt.png` |

#### Cannon Shell (main cannon)

| Destination | Source |
|-------------|--------|
| `sprites/projectiles/cannon*.png` | `gamedevmarketassets/Warped Assets/VFX/Warped shooting fx files/Pixelart/charged/frames/charged*.png` |
| `sprites/projectiles/cannon-sheet.png` | `gamedevmarketassets/Warped Assets/VFX/Warped shooting fx files/Pixelart/charged/charged.png` |

---

### 6. EFFECTS

#### Explosions (Enemy death, cannon impact)

| Destination | Source |
|-------------|--------|
| `effects/explosions/explosion-sheet.png` | `gamedevmarketassets/Warped Assets/VFX/Explosion/spritesheet/explosion-animation.png` |
| `effects/explosions/explosion.json` | `gamedevmarketassets/Warped Assets/VFX/Explosion/spritesheet/explosion-animation.json` |
| `effects/explosions/explosion*.png` | `gamedevmarketassets/Warped Assets/VFX/Explosion/sprites/explosion-animation*.png` |

**Large Explosion (Boss, big hits):**
| Destination | Source |
|-------------|--------|
| `effects/explosions/big-explosion-sheet.png` | `gamedevmarketassets/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/Big Explosion/big_explosion-sheet.png` |
| `effects/explosions/big-explosion*.png` | `gamedevmarketassets/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/Big Explosion/Sprites/big_explosion*.png` |

#### Hit Impacts

| Destination | Source |
|-------------|--------|
| `effects/hits/hit*.png` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Hit/sprites/hit*.png` |
| `effects/hits/hit-sheet.png` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Hit/hit.png` |

**Alternative hit effects:**
| Destination | Source |
|-------------|--------|
| `effects/hits/spark*.png` | `gamedevmarketassets/Warped Assets/VFX/Warped shooting fx files/Pixelart/spark/frames/spark*.png` |
| `effects/hits/impact*.png` | `gamedevmarketassets/Warped Assets/VFX/Warped shooting fx files/Pixelart/hits/hits-1/frames/hits-1-*.png` |

#### Muzzle Flash

| Destination | Source |
|-------------|--------|
| `effects/muzzle/flash.png` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/flash/flash.png` |

#### Smoke (Near Death state)

| Destination | Source |
|-------------|--------|
| `effects/smoke-sheet.png` | `gamedevmarketassets/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/SmokeColumn/SmokeColumn-sheet.png` |
| `effects/smoke*.png` | `gamedevmarketassets/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/SmokeColumn/Sprites/SmokeColumn*.png` |

---

### 7. AUDIO

#### Weapon SFX

| Destination | Source |
|-------------|--------|
| `audio/sfx/weapons/shot1.wav` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Sound FX/shot 1.wav` |
| `audio/sfx/weapons/shot2.wav` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Sound FX/shot 2.wav` |

#### Impact SFX

| Destination | Source |
|-------------|--------|
| `audio/sfx/impacts/hit.wav` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Sound FX/hit.wav` |
| `audio/sfx/impacts/explosion.wav` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Sound FX/explosion.wav` |

#### Music

| Destination | Source |
|-------------|--------|
| `audio/music/combat.mp3` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/music/exports/space-asteroids.mp3` |
| `audio/music/combat.ogg` | `gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/music/exports/space-asteroids.ogg` |

---

## Quick Copy Commands

Run these from the project root to copy all assets:

```bash
# Create directories
mkdir -p public/assets/{sprites/{tank,enemies/act1,bosses,projectiles,modules},effects/{explosions,hits,muzzle},backgrounds/act1,ui/{icons,panels,bars},audio/{sfx/{weapons,impacts,ui},music}}

# Tank
cp "gamedevmarketassets/Warped Assets/Vehicles/tank-unit/Spritesheets/tank-unit-sheet.png" public/assets/sprites/tank/tank-sheet.png
cp "gamedevmarketassets/Warped Assets/Vehicles/tank-unit/sprites/"*.png public/assets/sprites/tank/

# Imp
cp "gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Imp/imp-sheet.png" public/assets/sprites/enemies/act1/
cp "gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Imp/run/"*.png public/assets/sprites/enemies/act1/

# Wolf (as Hellhound)
cp "gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Wolf/wolf-sheet.png" public/assets/sprites/enemies/act1/hellhound-sheet.png
cp "gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Wolf/running/"*.png public/assets/sprites/enemies/act1/

# Mummy (as Possessed Soldier)
cp "gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Mummy/Mummy-sheet.png" public/assets/sprites/enemies/act1/soldier-sheet.png
cp "gamedevmarketassets/Gothicvania Assets/Characters/Enemies Pack 2/Mummy/Sprites/"*.png public/assets/sprites/enemies/act1/

# Fire Skull
cp "gamedevmarketassets/Gothicvania Assets/Characters/Fire-Skull-Files/Spritesheets/"*.png public/assets/sprites/enemies/act1/

# Boss (Sentinel)
cp "gamedevmarketassets/Gothicvania Assets/Characters/Boss-Demon/Spritesheets/"*.png public/assets/sprites/bosses/

# Background
cp "gamedevmarketassets/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/"*.png public/assets/backgrounds/act1/

# Projectiles
cp "gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/shoot/"*.png public/assets/sprites/projectiles/
cp "gamedevmarketassets/Warped Assets/VFX/Warped shooting fx files/Pixelart/Bolt/frames/"*.png public/assets/sprites/projectiles/

# Explosions
cp "gamedevmarketassets/Warped Assets/VFX/Explosion/spritesheet/"* public/assets/effects/explosions/
cp "gamedevmarketassets/Warped Assets/VFX/Explosion/sprites/"*.png public/assets/effects/explosions/

# Hits
cp "gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Hit/sprites/"*.png public/assets/effects/hits/
cp "gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/flash/flash.png" public/assets/effects/muzzle/

# Audio
cp "gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/Sound FX/"*.wav public/assets/audio/sfx/
cp "gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/music/exports/space-asteroids.mp3" public/assets/audio/music/combat.mp3
cp "gamedevmarketassets/Warped Assets/Space Shooters/Space Shooter files/music/exports/space-asteroids.ogg" public/assets/audio/music/combat.ogg
```

---

## Missing Assets (Need Alternatives)

| Asset | Status | Notes |
|-------|--------|-------|
| Module Icons (MG, Missile, Drone) | Needed | Create simple icons or use existing UI elements |
| UI Panel backgrounds | Needed | Can create programmatically or find in SunnyLand |
| Health/XP bars | Needed | Can create programmatically |
| Button sprites | Needed | Check SunnyLand Assets for UI elements |

---

## Spritesheet Format Notes

Most assets include:
- **Individual frames** (`sprite1.png`, `sprite2.png`, etc.)
- **Spritesheets** (`sprite-sheet.png`)

For Phaser, prefer spritesheets with JSON atlas files when available. The Warped VFX Explosion includes a `.json` file compatible with Phaser's atlas loader.

---

**Last Updated:** December 2024
