# HELLCRAWLER - Game Design Document (GDD)
## Version 1.0 | December 2024

---

# TABLE OF CONTENTS

1. [Game Overview](#1-game-overview)
2. [Core Gameplay Loop](#2-core-gameplay-loop)
3. [Player Tank](#3-player-tank)
4. [Module System](#4-module-system)
5. [Combat System](#5-combat-system)
6. [Progression Systems](#6-progression-systems)
7. [Economy](#7-economy)
8. [Content Structure](#8-content-structure)
9. [Enemy Design](#9-enemy-design)
10. [Boss Design](#10-boss-design)
11. [UI/UX Design](#11-uiux-design)
12. [Audio Design](#12-audio-design)
13. [Technical Specifications](#13-technical-specifications)

---

# 1. GAME OVERVIEW

## 1.1 High Concept

**Hellcrawler** is a 16-bit pixel art idle RPG auto-battler where players command a military tank against waves of demonic invaders from Hell. Inspired by Desktop Heroes' idle mechanics, Balatro's casino-roguelike systems, and Diablo's loot progression.

## 1.2 Genre & Platform

| Attribute | Value |
|-----------|-------|
| Genre | Idle RPG / Auto-battler |
| Platform | Windows, macOS (Steam) |
| Engine | Phaser 3 + TypeScript + Electron |
| Price Point | $3.99 - $4.99 |
| Art Style | 16-bit pixel art |
| Target Audience | Idle game fans, roguelike enthusiasts |

## 1.3 Core Pillars

1. **Satisfying Idle Progression** - Game plays itself, player optimizes
2. **Deep Module Customization** - Build your perfect loadout
3. **Escalating Challenge** - From clean combat to bullet hell
4. **Meaningful Loot** - Every drop matters

## 1.4 Unique Selling Points

- **Socket/Gem Module System** - Upgrade slots, swap modules freely
- **Near Death Mechanic** - Never truly die, fight on wounded
- **Boss Summoning** - Farm specific bosses with essence items
- **Paragon Prestige** - Infinite endgame scaling

---

# 2. CORE GAMEPLAY LOOP

## 2.1 Primary Loop (Per Zone)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   START ZONE                                                │
│       ↓                                                     │
│   Wave 1-6: Fight enemies → Collect gold/drops → XP gain   │
│       ↓                                                     │
│   Wave 7: Super Elite OR Boss                               │
│       ↓                                                     │
│   Zone Complete → Auto-save → Loot screen                  │
│       ↓                                                     │
│   Next Zone OR Return to upgrade                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Secondary Loop (Per Session)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Launch Game → Check modules/upgrades                      │
│       ↓                                                     │
│   Play zones → Gain XP, Gold, Module drops                 │
│       ↓                                                     │
│   Hit wall? → Upgrade tank stats, swap modules             │
│       ↓                                                     │
│   Progress further → Unlock new slots, defeat bosses       │
│       ↓                                                     │
│   Beat Act 8 → Prestige (Paragon) OR continue farming      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2.3 Tertiary Loop (Endgame)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Paragon Reset → Keep slots, lose levels/gold             │
│       ↓                                                     │
│   Gain Paragon points → Permanent % bonuses                │
│       ↓                                                     │
│   Farm Uber Bosses → Paragon currency                      │
│       ↓                                                     │
│   Push higher difficulties → Better loot                   │
│       ↓                                                     │
│   Optimize builds → Repeat                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 3. PLAYER TANK

## 3.1 Tank Overview

The player controls a stationary military battle tank. The tank does not move; instead, "movement speed" stat affects how fast enemies approach (creating illusion of tank speed).

### Visual Design
- Military olive drab camouflage
- Large main cannon (built-in weapon)
- Top-mounted machine gun (visual for Slot 1)
- Orange hazard stripes
- Red sensor light (pulses on damage)
- Exhaust pipes with smoke
- Radio antenna

## 3.2 Built-in Cannon

The main cannon is a **permanent weapon** that fires independently of module slots.

| Attribute | Value |
|-----------|-------|
| Fire Rate | 1 shot every 2.5 seconds |
| Damage | High (scales with Tank Level) |
| Range | Maximum (hits any enemy on screen) |
| Upgradeable | No |
| Special | Always active, cannot be disabled |

**Behavior:**
- Targets highest HP enemy
- Single target damage
- Creates large explosion effect on hit
- Pierces through fodder enemies (hits up to 3)

## 3.3 Tank Stats

All stats are upgradeable with Gold, capped by Tank Level.

| Stat | Description | Base Value | Per Upgrade |
|------|-------------|------------|-------------|
| Max HP | Total health points | 100 | +10 |
| Defense | Damage reduction % | 0% | +0.5% |
| HP Regen | Health recovered per second | 1 | +0.5 |
| Movement Speed | Enemy approach speed reduction | 0% | +1% |

### Upgrade Cost Formula
```
Cost = BaseCost × (CurrentLevel ^ 1.5)
BaseCost = 100 gold
```

### Upgrade Cap
Each stat can only be upgraded to the current Tank Level. If Tank is Level 30, max stat level is 30.

## 3.4 Tank Level & XP

Tank Level determines overall power and progression gates.

| Attribute | Value |
|-----------|-------|
| Max Level | 160 |
| XP Curve | Exponential |
| XP Sources | Killing enemies, completing waves |

### XP Formula (Exponential)
```
XP Required = Floor(100 × (1.15 ^ Level))

Level 1:   100 XP
Level 10:  405 XP
Level 50:  10,836 XP
Level 100: 1,174,313 XP
Level 160: 127,189,534 XP
```

### XP Rewards
| Source | Base XP |
|--------|---------|
| Fodder Enemy | 5-10 |
| Elite Enemy | 25-50 |
| Super Elite | 100-200 |
| Lesser Evil Boss | 500 |
| Prime Evil Boss | 1,500 |
| Diaboros | 5,000 |
| Uber Boss | 10,000 |

## 3.5 Module Slots

Slots are permanent sockets where module items are equipped.

| Slot | Unlock Condition | Gold Cost |
|------|------------------|-----------|
| Slot 1 | Free (game start) | 0 |
| Slot 2 | Available from start | 10,000 |
| Slot 3 | Available from start | 50,000 |
| Slot 4 | Defeat Act 8 (Diaboros) | 500,000 |
| Slot 5 | Defeat all 8 Uber Bosses | 2,000,000 |

### Slot Upgrades
Each slot can be upgraded to increase the power of any module placed in it.

| Attribute | Description |
|-----------|-------------|
| Max Level | Tank Level (cap) |
| Effect | +1% Damage, +0.5% Attack Speed per level |
| Cost | Level × 100 Gold |

---

# 4. MODULE SYSTEM

## 4.1 System Overview

Modules are the **items** that go into Module Slots. They are:
- Dropped by enemies with random rarities
- Swappable at any time (like party members in JRPGs)
- Not unique (can equip multiple Machine Guns)
- Sellable for Gold

## 4.2 Module Types (10 Total)

### Starting Module
Player begins with: **1× Uncommon Machine Gun** (random stat roll)

### Module List

| # | Module | Attack Type | Range | Fire Rate | Description |
|---|--------|-------------|-------|-----------|-------------|
| 1 | Machine Gun | Projectile | Medium | Fast | Rapid-fire bullets |
| 2 | Missile Pod | Homing | Long | Slow | Tracking missiles |
| 3 | Repair Drone | Support | Self | N/A | Heals tank over time |
| 4 | Shield Generator | Defensive | Self | N/A | Absorbs damage |
| 5 | Laser Cutter | Beam | Medium | Continuous | Sustained damage beam |
| 6 | Tesla Coil | Chain | Medium | Medium | Lightning chains to enemies |
| 7 | Flamethrower | Cone | Short | Continuous | Fire damage, burns |
| 8 | EMP Emitter | AoE | Medium | Slow | Stuns enemies |
| 9 | Mortar | Artillery | Long | Very Slow | High AoE damage |
| 10 | Main Cannon | Projectile | Long | Very Slow | Single powerful shot |

## 4.3 Module Stats (Random Rolls)

When a module drops, it rolls random stats based on rarity.

### Stat Pool (11 Possible Stats)

| Stat | Description | Min Roll | Max Roll |
|------|-------------|----------|----------|
| Damage % | Increases damage dealt | 1% | 15% |
| Attack Speed % | Increases fire rate | 1% | 15% |
| Crit Chance % | Chance for critical hit | 1% | 15% |
| Crit Damage % | Critical hit multiplier bonus | 1% | 15% |
| Cooldown Reduction % | Reduces skill cooldowns | 1% | 15% |
| Area of Effect % | Increases AoE radius | 1% | 15% |
| Lifesteal % | Heal based on damage dealt | 1% | 15% |
| Multistrike % | Chance to hit twice | 1% | 15% |
| Range % | Increases attack range | 1% | 15% |
| Gold Find % | Bonus gold from kills | 1% | 15% |
| XP Bonus % | Bonus XP from kills | 1% | 15% |

### Rarity System

| Rarity | # Stats | Stat Range | Color |
|--------|---------|------------|-------|
| Uncommon | 1 | 1-5% | Green |
| Rare | 2 | 3-8% | Blue |
| Epic | 3 | 5-12% | Purple |
| Legendary | 4 | 8-15% | Orange |

### Drop Rates (Base + Level Scaling)

| Rarity | Base % | Per 10 Levels | Max at Lv160 |
|--------|--------|---------------|--------------|
| Uncommon | 10% | +1% | 26% |
| Rare | 3% | +0.5% | 11% |
| Epic | 0.5% | +0.2% | 3.7% |
| Legendary | 0.05% | +0.05% | 0.85% |

## 4.4 Module Skills

Each module type has **2 active skills** that can be manually activated or auto-cast.

### Auto-Mode
- Toggle per module
- When enabled: Skills auto-cast when off cooldown
- Penalty: **10% damage reduction** on auto-cast skills

### Skill Definitions

#### 1. Machine Gun
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Overdrive** | 15s | +50% fire rate for 5 seconds |
| **Suppressing Fire** | 20s | Slow enemies in cone by 30% for 4 seconds |

#### 2. Missile Pod
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Barrage** | 18s | Fire 5 missiles in rapid succession |
| **Homing Swarm** | 25s | All missiles gain perfect tracking for 8 seconds |

#### 3. Repair Drone
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Emergency Repair** | 30s | Instantly heal 15% of max HP |
| **Regeneration Field** | 45s | +200% HP regen for 10 seconds |

#### 4. Shield Generator
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Energy Barrier** | 25s | Block the next 3 instances of damage |
| **Reflect Shield** | 35s | Return 30% of damage taken for 5 seconds |

#### 5. Laser Cutter
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Focused Beam** | 20s | Channel for 3s, damage increases each second |
| **Thermal Overload** | 25s | Enemies hit burn for 50% damage over 4 seconds |

#### 6. Tesla Coil
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Chain Lightning** | 15s | Next hit chains to 5 additional enemies |
| **EMP Burst** | 30s | Stun all enemies on screen for 1.5 seconds |

#### 7. Flamethrower
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Inferno** | 20s | Double damage and +50% range for 4 seconds |
| **Napalm Trail** | 30s | Leave burning ground for 6 seconds (DoT zone) |

#### 8. EMP Emitter
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **System Shock** | 25s | Disable enemy special abilities for 5 seconds |
| **Power Surge** | 35s | All modules deal +20% damage for 6 seconds |

#### 9. Mortar
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Artillery Strike** | 25s | Call down 3 explosions at random enemy positions |
| **Cluster Bomb** | 30s | Next shot splits into 5 smaller bomblets |

#### 10. Main Cannon
| Skill | Cooldown | Effect |
|-------|----------|--------|
| **Armor Piercing** | 20s | Next shot ignores 50% of enemy defense |
| **High Explosive** | 25s | Next shot deals AoE damage in large radius |

## 4.5 Module Range Tiers

| Range Tier | Distance | Modules |
|------------|----------|---------|
| Short | 200px | Flamethrower |
| Medium | 400px | Machine Gun, Laser Cutter, Tesla Coil, EMP |
| Long | 600px | Missile Pod, Mortar, Main Cannon |
| Self | 0px | Repair Drone, Shield Generator |

Enemies must be within range to be targeted. Enemies "out of range" continue approaching until targetable.

---

# 5. COMBAT SYSTEM

## 5.1 Combat Flow

1. **Enemies spawn** from right side of screen
2. **Enemies walk left** toward tank (speed affected by Movement Speed stat)
3. **Tank + Modules auto-fire** at enemies in range
4. **Player activates skills** (or auto-mode triggers them)
5. **Enemies die** → Drop Gold, XP, potential Module
6. **Wave clears** → Brief pause → Next wave
7. **Zone clears** → Auto-save, loot summary

## 5.2 Damage Calculation

### Base Damage Formula
```
FinalDamage = BaseDamage × SlotMultiplier × ModuleStats × CritMultiplier × RandomVariance

Where:
- BaseDamage = Module's base damage value
- SlotMultiplier = 1 + (SlotLevel × 0.01) [damage] × (1 + SlotLevel × 0.005) [attack speed]
- ModuleStats = Combined % bonuses from module's rolled stats
- CritMultiplier = 2.0 base (+ Crit Damage % bonuses)
- RandomVariance = 0.9 to 1.1 (±10%)
```

### Crit Calculation
```
if (Random(0,100) < CritChance):
    FinalDamage *= CritMultiplier
```

### Multistrike Calculation
```
Hits = 1
while (Random(0,100) < MultistrikeChance):
    Hits += 1
    MultistrikeChance *= 0.5  // Diminishing returns
```

### Defense Calculation
```
DamageReduction = Defense / (Defense + 100)
DamageTaken = IncomingDamage × (1 - DamageReduction)
```

## 5.3 Near Death State

When tank HP reaches 0, instead of dying:

| Attribute | Value |
|-----------|-------|
| State | Near Death |
| Attack Speed | -50% reduction |
| Can Die | No (immortal while Near Death) |
| Revival Methods | Manual button OR 60 second auto-revive |
| Visual | Smoke, sparks, red tint, warning indicator |

### Revival
- **Manual:** Click "Revive" button → Instant full HP restore
- **Auto:** After 60 seconds → Full HP restore
- No penalty for using Near Death (no gold loss, no progress loss)

## 5.4 Targeting Priority

Modules use the following targeting priority:

1. **Closest enemy** (default for most modules)
2. **Highest HP enemy** (Built-in Cannon, Mortar)
3. **Lowest HP enemy** (Machine Gun finishing mode)
4. **Random** (AoE skills)

## 5.5 Combat Pacing

| Phase | Description |
|-------|-------------|
| Early Game (Acts 1-2) | Clean, readable, 3-5 enemies at once |
| Mid Game (Acts 3-5) | Moderate chaos, 8-12 enemies at once |
| Late Game (Acts 6-8) | Bullet hell, 15-20+ enemies at once |

---

# 6. PROGRESSION SYSTEMS

## 6.1 Tank Level Progression

| Level Range | Content Unlocked |
|-------------|------------------|
| 1-20 | Act 1-2, Basic modules |
| 21-50 | Act 3-4, Slot 2-3 affordable |
| 51-100 | Act 5-6, Epic drops common |
| 101-140 | Act 7-8, Legendary hunting |
| 141-160 | Uber bosses, Slot 4-5 |

## 6.2 Module Slot Progression

| Milestone | Unlocks |
|-----------|---------|
| Game Start | Slot 1 (free) |
| 10,000 Gold | Slot 2 purchasable |
| 50,000 Gold | Slot 3 purchasable |
| Beat Diaboros | Slot 4 purchasable (500k) |
| Beat All Ubers | Slot 5 purchasable (2M) |

## 6.3 Paragon System

Unlocked after defeating Diaboros (Act 8 Boss).

### Prestige Reset
| Resets | Keeps |
|--------|-------|
| Tank Level → 1 | Unlocked Module Slots |
| All Stat Levels → 0 | Paragon Points/Upgrades |
| Gold → 0 | Module Collection (inventory) |
| Zone Progress → Act 1 | Bestiary Progress |

### Paragon Stats

Upgraded with **Infernal Cores** (dropped by Uber Bosses only).

| Stat | Effect per Point | Max Points |
|------|------------------|------------|
| Global Damage | +1% | 100 |
| Global Attack Speed | +1% | 100 |
| Max HP | +2% | 100 |
| Defense | +1% | 100 |
| Gold Find | +2% | 50 |
| Essence Drop Rate | +2% | 50 |

### Infernal Core Drops
| Uber Boss | Cores Dropped |
|-----------|---------------|
| Any Uber | 3-5 Cores |
| First Kill Bonus | +10 Cores |

---

# 7. ECONOMY

## 7.1 Currencies

### Gold (Primary)
| Source | Amount |
|--------|--------|
| Fodder Enemy | 1-5 |
| Elite Enemy | 10-50 |
| Super Elite | 100-500 |
| Wave Clear | 50-200 |
| Zone Clear | 500-2,000 |
| Lesser Evil | 5,000 |
| Prime Evil | 25,000 |
| Diaboros | 100,000 |
| Uber Boss | 250,000 |

| Sink | Cost |
|------|------|
| Slot 2 | 10,000 |
| Slot 3 | 50,000 |
| Slot 4 | 500,000 |
| Slot 5 | 2,000,000 |
| Stat Upgrade | Level × 100 |
| Slot Upgrade | Level × 100 |

### Essence (8 Types - Boss Summoning)

Each boss has a unique essence type.

| Essence | Dropped By | Used To Summon |
|---------|------------|----------------|
| Essence of [Boss 1] | Boss 1 kills | Boss 1 (10 required) |
| Essence of [Boss 2] | Boss 2 kills | Boss 2 (10 required) |
| ... | ... | ... |
| Essence of Diaboros | Diaboros kills | Diaboros (10 required) |

**Hierarchy:**
- Normal enemies → Small chance to drop Lesser Evil essences
- Lesser Evils → Drop Prime Evil essences (5 required)
- Prime Evils → Drop Uber essences (3 required)

**Restriction:** Cannot obtain essence for bosses you haven't defeated yet.

### Infernal Cores (Paragon Currency)
| Source | Amount |
|--------|--------|
| Uber Boss Kill | 3-5 |
| First Uber Kill | +10 Bonus |

## 7.2 Module Economy

### Selling Modules
| Rarity | Sell Value |
|--------|------------|
| Uncommon | 50 Gold |
| Rare | 200 Gold |
| Epic | 1,000 Gold |
| Legendary | 5,000 Gold |

---

# 8. CONTENT STRUCTURE

## 8.1 Act Overview

| Act | Name | Theme | Boss | Boss Type |
|-----|------|-------|------|-----------|
| 1 | First Contact | City Invasion | Corrupted Sentinel | Lesser Evil |
| 2 | Scorched Earth | Urban Collapse | Gargoyle | Lesser Evil |
| 3 | Last Stand | Military Base | Siege Beast | Lesser Evil |
| 4 | Into the Abyss | Underground | Tunnel Wyrm | Lesser Evil |
| 5 | No Man's Land | Hell Outskirts | Hell Beast | Prime Evil |
| 6 | Inferno | Burning Hells | The Infernal | Prime Evil |
| 7 | The Maelstrom | Chaos Realm | Void Dragon | Prime Evil |
| 8 | Endgame | Throne of Diaboros | Diaboros | Final Boss |

## 8.2 Zone Structure

Each Act contains **2 Zones**.
Each Zone contains **7 Waves**.

| Zone Position | Wave 7 Content |
|---------------|----------------|
| Zone 1 (mid-act) | Super Elite |
| Zone 2 (end-act) | Act Boss |

**Total Content:**
- 8 Acts × 2 Zones = 16 Zones
- 16 Zones × 7 Waves = 112 Waves
- 8 Act Bosses + 8 Uber Variants = 16 Boss Fights

## 8.3 Wave Composition

| Wave # | Composition |
|--------|-------------|
| 1 | 5 Fodder |
| 2 | 8 Fodder |
| 3 | 6 Fodder + 1 Elite |
| 4 | 10 Fodder + 1 Elite |
| 5 | 8 Fodder + 2 Elite |
| 6 | 12 Fodder + 2 Elite |
| 7 | Super Elite OR Boss |

Wave scaling increases enemy HP/damage per act.

## 8.4 Zone Duration

Target: **1-2 minutes per zone** at appropriate power level.

---

# 9. ENEMY DESIGN

## 9.1 Enemy Categories

### Fodder Enemies
- Low HP, low damage
- Killed in 1-2 hits
- Spawn in groups of 5-15

### Elite Enemies
- Medium HP, medium damage
- Killed in 5-10 hits
- Has 1 special ability
- Spawn 1-3 per wave

### Super Elite Enemies
- High HP, high damage
- Mini-boss at Zone 1 endings
- Larger sprite variant
- Guaranteed module drop

## 9.2 Enemy Roster by Act

### Act 1: City Invasion
| Enemy | Type | Special |
|-------|------|---------|
| Imp | Fodder | Fast movement |
| Hellhound | Fodder | Leap attack |
| Possessed Soldier | Fodder | Ranged attack |
| Fire Skull | Elite | Explodes on death |

### Act 2: Urban Collapse
| Enemy | Type | Special |
|-------|------|---------|
| Demon | Fodder | Standard melee |
| Bat | Fodder | Flying, fast |
| Ghost | Elite | Phase through damage briefly |
| Firebat | Elite | Ranged fire attack |

### Act 3: Military Base
| Enemy | Type | Special |
|-------|------|---------|
| Corrupted Robot | Fodder | Armored |
| Skeleton | Fodder | Resurrects once |
| Eye | Elite | Ranged laser |
| Ogre | Elite | High HP, slow |

### Act 4: Underground
| Enemy | Type | Special |
|-------|------|---------|
| Slime | Fodder | Splits on death |
| Cave Bat | Fodder | Flying |
| Mummy | Fodder | Poison on hit |
| Lava Worm | Elite | Burrows, surprise attack |

### Act 5: Hell Outskirts
| Enemy | Type | Special |
|-------|------|---------|
| Hell Beast | Fodder | Fire breath |
| Ghost Wolf | Fodder | Fast, pack bonus |
| Flying Demon | Elite | Aerial, dive bomb |
| Fireshaunt | Elite | Fire aura damage |

### Act 6: Burning Hells
| Enemy | Type | Special |
|-------|------|---------|
| Flame Demon | Fodder | Burns on attack |
| Lava Serpent | Fodder | Fire trail |
| Fire Skull | Elite | Chain explosion |
| Drake | Elite | Mini dragon, fire breath |

### Act 7: Chaos Realm
| Enemy | Type | Special |
|-------|------|---------|
| Werewolf | Fodder | Frenzy at low HP |
| Vampire | Fodder | Lifesteal |
| Nightmare | Elite | Fear (slow effect) |
| Witch | Elite | Curses (debuffs) |

### Act 8: Throne
| Enemy | Type | Special |
|-------|------|---------|
| Demon Knight | Fodder | Armored, shield |
| Elite Demon | Fodder | All-rounder |
| Skull Lord | Elite | Summons skeletons |
| Treant | Elite | High HP, regenerates |

---

# 10. BOSS DESIGN

## 10.1 Boss Philosophy

- **Loadout checks, not reflex checks** - Reward preparation over reaction
- **Idle-friendly** - Beatable on auto-mode with right build
- **Manual skill timing helps** - Optimization layer for engaged players

## 10.2 Lesser Evil Bosses (Acts 1-4)

### Boss 1: Corrupted Sentinel (Act 1)
| Attribute | Value |
|-----------|-------|
| HP | 10,000 |
| Damage | Medium |
| Essence | Essence of the Sentinel |

**Abilities:**
- **Laser Sweep:** Horizontal beam, avoidable by being below/above
- **Summon Drones:** Spawns 3 mini-sentinels

### Boss 2: Gargoyle (Act 2)
| Attribute | Value |
|-----------|-------|
| HP | 25,000 |
| Damage | Medium-High |
| Essence | Essence of Stone |

**Abilities:**
- **Stone Form:** Becomes invulnerable for 3 seconds
- **Dive Bomb:** Charges at tank, high damage

### Boss 3: Siege Beast (Act 3)
| Attribute | Value |
|-----------|-------|
| HP | 50,000 |
| Damage | High |
| Essence | Essence of the Beast |

**Abilities:**
- **Armored Charge:** Rush attack with damage reduction
- **Tail Swipe:** AoE knockback (enemies pushed away)

### Boss 4: Tunnel Wyrm (Act 4)
| Attribute | Value |
|-----------|-------|
| HP | 100,000 |
| Damage | High |
| Essence | Essence of the Deep |

**Abilities:**
- **Burrow:** Goes underground, emerges at random position
- **Acid Spit:** Ranged attack, leaves DoT pool

## 10.3 Prime Evil Bosses (Acts 5-7)

### Boss 5: Hell Beast (Act 5)
| Attribute | Value |
|-----------|-------|
| HP | 200,000 |
| Damage | Very High |
| Essence | Essence of Flame |

**Abilities:**
- **Infernal Breath:** Cone fire attack
- **Summon Imps:** Spawns 5 imps
- **Enrage:** +50% damage at 30% HP

### Boss 6: The Infernal (Act 6)
| Attribute | Value |
|-----------|-------|
| HP | 400,000 |
| Damage | Very High |
| Essence | Essence of the Infernal |

**Abilities:**
- **Meteor Storm:** Random meteors fall for 5 seconds
- **Fire Shield:** Reflects 20% damage for 8 seconds
- **Summon Drakes:** Spawns 2 elite drakes

### Boss 7: Void Dragon (Act 7)
| Attribute | Value |
|-----------|-------|
| HP | 750,000 |
| Damage | Extreme |
| Essence | Essence of the Void |

**Abilities:**
- **Void Breath:** Massive cone attack
- **Dimensional Shift:** Teleports, becomes untargetable briefly
- **Chaos Bolts:** Rapid-fire projectiles

## 10.4 Final Boss: Diaboros (Act 8)

| Attribute | Value |
|-----------|-------|
| HP | 1,500,000 |
| Damage | Extreme |
| Essence | Essence of Diaboros |

**Phase 1 (100-60% HP):**
- **Claw Swipe:** High damage melee
- **Summon Demons:** Spawns 3 demon knights

**Phase 2 (60-30% HP):**
- **Hellfire Rain:** Screen-wide fire damage
- **Soul Drain:** Heals 5% HP over 5 seconds

**Phase 3 (30-0% HP):**
- **All abilities active**
- **Enraged:** +100% attack speed
- **Last Stand:** At 10%, gains shield that must be broken

## 10.5 Uber Bosses

Uber versions of all 8 bosses with:
- **3× HP**
- **2× Damage**
- **All abilities active from start**
- **Unique Uber mechanic** (TBD per boss)
- **Drops Infernal Cores**

---

# 11. UI/UX DESIGN

> **Reference:** Desktop Heroes sliding panel system
> **Full Specification:** See `docs/UISpec.md` for complete implementation details

## 11.1 Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Idle-First** | Game NEVER pauses - continues during all menu interactions |
| **No Scene Transitions** | All UI is overlay-based, no black screen transitions |
| **Sliding Panels** | Menus slide in from left, pushing game area right |
| **Always Accessible** | Core actions (skills, flee) always visible |

## 11.2 Screen Layout

### Base Layout (No Panels Open)
```
┌─────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                         │
│ [Gold: 1.2M] [+5.2K/s]  [LVL 45 ████░░ XP]    [Zone 1-2] [Flee]│
├──┬──────────────────────────────────────────────────────────────┤
│  │                                                              │
│S │                         GAME AREA                            │
│I │     [TANK] ←←← enemies approach ←←←              [ENEMIES]  │
│D │                                                              │
│E │                    Damage numbers float up                   │
│B │                                                              │
│A │                                                              │
│R │                                                              │
├──┴──────────────────────────────────────────────────────────────┤
│ BOTTOM BAR                                                      │
│ [HP ████████████░░░░] 235K/300K                                │
│ [Slot1][Slot2][Slot3][Slot4][Slot5]              [Wave 5/7 ▶]  │
└─────────────────────────────────────────────────────────────────┘
```

### Layout With Panel Open
```
┌─────────────────────────────────────────────────────────────────┐
│              [Gold: 1.2M]  [LVL 45]              [Zone] [Flee] │
├──────────────────┬──┬────────────────────────────────────────────┤
│                  │  │                                            │
│  SLIDING PANEL   │S │           GAME AREA                        │
│  (~400px wide)   │I │        (compressed but visible)            │
│                  │D │                                            │
│  [<<] to close   │E │     [TANK] ←← enemies ←←                   │
│                  │B │                                            │
│  Panel content   │A │         (game keeps running!)              │
│                  │R │                                            │
├──────────────────┴──┴────────────────────────────────────────────┤
│              [HP Bar]        [Slot1][Slot2][Slot3]    [Wave 5/7]│
└─────────────────────────────────────────────────────────────────┘
```

## 11.3 Sidebar Icons

| Icon | Panel | Keyboard | Description |
|------|-------|----------|-------------|
| Tank silhouette | Tank Stats | TAB | View/upgrade tank stats and slot levels |
| Backpack | Inventory | I | Browse, equip, sell modules |
| Shopping cart | Shop | P | Purchase module slots |
| Cogwheel | Settings | ESC | Options, audio, save & quit |

## 11.4 Sliding Panels

### Tank Stats Panel
- Tank portrait, level, XP bar
- **Tank Stats:** Max HP, Defense, HP Regen, Enemy Slow
- Each stat shows: Current → Next value, upgrade cost button
- **Module Slots:** Level display, upgrade buttons
- Locked slots show unlock requirements

### Module Inventory Panel
- **Equipped Modules:** 5 slots at top
- **Inventory Grid:** 6-column scrollable grid
- **Selection Detail:** Stats, rarity, skill descriptions
- **Actions:** Equip, Unequip, Sell, Compare
- Auto-sell toggle for low rarities

### Shop Panel
- List of all 5 module slots
- Owned slots show "✓ Unlocked"
- Available slots show purchase button with cost
- Locked slots show requirement (e.g., "Beat Diaboros")

### Settings Panel
- Quick toggles: SFX, Music, Help, Save
- Display options: Health bars, damage numbers, VFX
- Audio sliders: Master, Music, SFX volume
- Controls reference
- Save Game / Save & Quit buttons

## 11.5 HUD Elements

### Top Bar
- Gold amount + income rate
- Tank level + XP progress bar
- Current zone indicator
- Flee button

### Sidebar
- 4 icon buttons (56px wide strip)
- Active panel indicated by highlight
- Always visible, even with panel open

### Bottom Bar
- HP bar (full width) with current/max values
- Near Death: Red pulsing + REVIVE button
- Module slots with cooldown indicators
- Wave progress + play/pause controls

## 11.6 Damage Number Format

- No decimals: `235K` not `235.04K`
- Abbreviations: K (thousand), M (million), B (billion), T (trillion)
- Color coding:
  - White: Normal damage
  - Yellow: Critical hit
  - Green: Healing
  - Red: Damage taken

## 11.7 Resolution & Scaling

| Attribute | Value |
|-----------|-------|
| Base Resolution | 1920×1080 |
| Aspect Ratio | 16:9 (fixed) |
| Scaling | Letterbox for non-16:9 displays |
| Minimum | 1280×720 |
| Panel Width | 400px (scales down at lower res) |

---

# 12. AUDIO DESIGN

## 12.1 Sound Effects (Priority)

### Must Have (MVP)
| Category | Sounds |
|----------|--------|
| Weapons | Machine gun fire, cannon boom, missile launch, laser hum |
| Impacts | Small hit, large hit, explosion |
| UI | Button click, purchase confirm, level up |

### Nice to Have
| Category | Sounds |
|----------|--------|
| Enemies | Spawn sounds, death sounds, boss roars |
| Ambient | Background combat noise |
| Skills | Per-skill activation sound |

## 12.2 Music

| Location | Style |
|----------|-------|
| Acts 1-4 | Tense military/action loops |
| Acts 5-7 | Dark, demonic ambience |
| Act 8 | Epic orchestral |
| Boss Fights | Intensified version of act theme |
| Prime Evils + Diaboros | Dynamic music (builds with phase) |

---

# 13. TECHNICAL SPECIFICATIONS

## 13.1 Performance Targets

| Metric | Target |
|--------|--------|
| Frame Rate | 60 FPS |
| Max Enemies | 30 on screen |
| Max Projectiles | 100 on screen |
| Load Time | <3 seconds |

## 13.2 Object Pooling Requirements

**CRITICAL:** All frequently spawned objects MUST use object pooling:
- Enemies
- Projectiles
- Damage numbers
- Particle effects
- Loot drops

## 13.3 Save System

| Attribute | Value |
|-----------|-------|
| Save Location | Local + Steam Cloud |
| Save Frequency | Every zone clear |
| Save Slots | 1 (auto-save only) |
| Data Format | JSON (encrypted) |

### Save Data Contents
```json
{
  "version": "1.0.0",
  "tankLevel": 45,
  "tankXP": 125000,
  "tankStats": {
    "maxHP": 30,
    "defense": 25,
    "hpRegen": 20,
    "moveSpeed": 15
  },
  "moduleSlots": {
    "unlocked": [1, 2, 3],
    "levels": [45, 30, 25, 0, 0]
  },
  "equippedModules": [...],
  "moduleInventory": [...],
  "gold": 125000,
  "essences": {...},
  "currentAct": 4,
  "currentZone": 2,
  "bossesDefeated": [...],
  "paragon": {
    "points": {...},
    "infernalCores": 15
  }
}
```

## 13.4 Platform Support

| Platform | Build Target |
|----------|--------------|
| Windows | Electron (Steam) |
| macOS | Electron (Steam) |
| Web | Phaser (testing only) |

---

# APPENDICES

## Appendix A: Asset List

See separate Asset Mapping Document for complete sprite/audio asset list.

## Appendix B: Balance Spreadsheet

To be created during implementation - will contain:
- XP curve values
- Gold economy simulation
- Module stat ranges
- Enemy HP/damage scaling

## Appendix C: Localization

Initial release: English only
Future consideration: Localization framework in place

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Author:** Game Design Team
**Status:** LOCKED FOR IMPLEMENTATION
