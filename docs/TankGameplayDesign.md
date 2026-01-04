# Tank Gameplay Redesign

> **Status:** Design Document - Pending Implementation
> **Created:** January 2025
> **Scope:** Center tank, bidirectional combat, cinematic modules, faction allegiance system

---

## Executive Summary

This document outlines three major gameplay changes:

1. **Center Tank with Bidirectional Combat** - Tank moves to screen center, enemies attack from both sides
2. **Cinematic Module Effects** - Dramatic animations for all modules (missiles arcing into sky, etc.)
3. **Faction Allegiance System** - Post-campaign faction choice replacing Paragon, leading to Void endgame

---

# 1. Center Tank & Bidirectional Combat

## 1.1 Core Concept

The tank is positioned at the **center of the screen** instead of the left side. Enemies spawn from **both left and right sides**. The tank is conceptually "moving right" (parallax scrolls left), so:

- **Right-side enemies**: Approach head-on (standard combat)
- **Left-side enemies**: Chase from behind (must catch up)

This creates a two-front battle that differentiates Hellcrawler from Desktop Heroes.

## 1.2 Module Slot Layout

```
                    TOP VIEW OF TANK

          ← REAR (LEFT)              FRONT (RIGHT) →

              [Slot 4]                  [Slot 3]
                        [Slot 5]
              [Slot 2]                  [Slot 1]

                   ═══[TANK BODY]═══════►

          ↑                                    ↑
    Attacks LEFT                         Attacks RIGHT
    (chasing enemies)                    (approaching enemies)
```

### Slot Positions (Approximate pixel offsets from tank center)

| Slot | Position | X Offset | Y Offset | Direction |
|------|----------|----------|----------|-----------|
| 1 | Front-Right Lower | +60 | -35 | Right only |
| 2 | Back-Left Lower | -50 | -35 | Left only |
| 3 | Front-Right Upper | +55 | -65 | Right only |
| 4 | Back-Left Upper | -45 | -65 | Left only |
| 5 | Center Middle | 0 | -50 | Both sides |

### Slot Targeting Rules

| Slot | Target Direction | Behavior |
|------|------------------|----------|
| 1, 3 (Front) | Right only | Only targets enemies approaching from right |
| 2, 4 (Back) | Left only | Only targets enemies chasing from left |
| 5 (Middle) | Both | Targets closest enemy from either side |

## 1.3 Slot Unlock Progression

| Slot | Unlock Condition | Cost | Notes |
|------|------------------|------|-------|
| Slot 1 (Front-Right) | Game Start | FREE | Starting slot |
| Slot 2 (Back-Left) | Game Start | FREE | Starting slot |
| Slot 3 (Front-Right Upper) | Purchasable | 10,000 gold | Available immediately |
| Slot 4 (Back-Left Upper) | Purchasable | 20,000 gold | Available immediately |
| Slot 5 (Center) | After Act 6 | 75,000 gold | Progression-locked + expensive |

### Economy Justification

Based on BalanceGuide.md gold progression:
- Slot 3 (10K): Achievable in ~30-45 minutes of play
- Slot 4 (20K): Achievable in ~1-1.5 hours
- Slot 5 (75K): Requires Act 6 completion + significant farming

Slot 5 is the most valuable (attacks both sides) and should feel like a major milestone.

## 1.4 Built-in Cannon Removal

The built-in cannon is **REMOVED** from this design. All damage comes from modules.

**Rationale:**
- With bidirectional combat, a single fixed cannon doesn't make sense
- Modules are now more independent and valuable
- Simplifies balance (no free damage source)

## 1.5 Module Independence

Modules are now **independent entities** with their own:

- **Position**: Each module has its own world position (not just offset from tank)
- **Firing Origin**: Projectiles spawn from module sprite, not tank
- **Targeting Animation**: Modules rotate/wiggle toward their target
- **Visual Identity**: Distinct sprites per module type

### Module Animation Requirements

| Animation | Description | Trigger |
|-----------|-------------|---------|
| Idle Wobble | Slight random rotation/bob | Always when equipped |
| Target Tracking | Rotate toward current target | When target acquired |
| Fire Recoil | Small kickback on firing | On each shot |
| Cooldown Pulse | Subtle glow when skill ready | Skill off cooldown |

## 1.6 Wave Design for Bidirectional Combat

### Spawn Distribution

Enemies spawn **equally** from both sides (50/50 split).

| Wave | Left Side | Right Side | Total |
|------|-----------|------------|-------|
| 1 | 2-3 Fodder | 2-3 Fodder | 5 |
| 2 | 4 Fodder | 4 Fodder | 8 |
| 3 | 3 Fodder | 3 Fodder + 1 Elite | 7 |
| 4 | 5 Fodder | 5 Fodder + 1 Elite | 11 |
| 5 | 4 Fodder + 1 Elite | 4 Fodder + 1 Elite | 10 |
| 6 | 6 Fodder + 1 Elite | 6 Fodder + 1 Elite | 14 |
| 7 | Super Elite OR Boss (random side) | - | 1 |

### Enemy Behavior

- **Left-side enemies (chasers)**: Same stats as right-side
- **Right-side enemies (approachers)**: Same stats as left-side
- **Boss/Super Elite**: Spawns from random side (adds variety)

### No Speed Difference

Since the tank is stationary and the background scrolls via parallax, enemy movement speed is the same regardless of which side they approach from. The "chasing" is purely visual/thematic.

---

# 2. Cinematic Module Effects

## 2.1 Design Philosophy

Every module should feel **impactful and epic**. This means:

- **Launch Phase**: Dramatic firing animation
- **Travel Phase**: Interesting projectile behavior
- **Impact Phase**: Satisfying hit effects

## 2.2 Module Cinematic Specifications

### Machine Gun

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Launch | Bullet spawns | Barrel spin-up, muzzle flash, shell casings eject |
| Travel | Straight line | Tracer effect (glowing line behind bullet) |
| Impact | Flash | Spark burst, small dust puff |

### Missile Pod

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Launch | Missile spawns forward | Missile launches **vertically upward** with smoke puff |
| Travel | Homing arc | Smooth parabolic arc - rises high, then dives toward target |
| Impact | Explosion | Fire ring, shockwave, debris particles |

**Missile Arc Behavior:**
```
                    ↑ Peak (dramatic height)
                   / \
                  /   \
    [Module] → ↗       ↘ → [Enemy]
           Launch      Dive
```

- **Arc Height**: High enough for dramatic effect (100-150px above launch point)
- **Motion**: Smooth continuous arc (no hover/pause)
- **Smoke Trail**: Persistent trail during flight

**Barrage Skill**: Staggered launches (5 missiles, 150ms apart), like real MLRS systems.

### Tesla Coil

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Charge | Instant | Visible charge-up glow on coil (200ms) |
| Strike | Line to enemy | Branching lightning arc with flicker |
| Impact | None | Enemy briefly shows skeleton/bones through flash |

### Mortar

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Launch | Shell arcs | Tube recoil animation, shell visible rising into sky |
| Travel | Arc | Shell goes above screen, target indicator appears on ground |
| Impact | Explosion | Large explosion radius, screen-edge dust clouds |

### Repair Drone

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Idle | Static | Drone hovers with small bob animation |
| Heal | Instant | Green particle beam from drone to tank, +HP numbers float |
| Skill | Instant | Expanding green pulse ring centered on tank |

### Flamethrower

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Fire | Cone | Rolling animated flames with heat distortion |
| Sustained | Static | Flames intensify over time, barrel glows red-hot |
| Impact | None | Enemies catch fire, run faster briefly while burning |

### Laser Cutter

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Charge | Instant | Lens focuses, power-up sound (when audio ready) |
| Beam | Instant line | Wobbling beam with heat shimmer at contact point |
| Sustained | Static | Burn marks appear on enemies, smoke rises |

### EMP Emitter

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Charge | Instant | Electrical arcs around emitter |
| Pulse | Instant | Expanding blue ring with crackling edges |
| Impact | Slow | Enemies flash blue, movement stutters |

### Shield Generator

| Phase | Current | Cinematic |
|-------|---------|-----------|
| Idle | Static | Subtle energy field shimmer around tank |
| Activate | Instant | Hexagonal shield pattern expands from generator |
| Hit | None | Shield ripples at impact point, energy disperses |

## 2.3 Performance Budget

| Resource | Limit | Notes |
|----------|-------|-------|
| Particles per module | 20 | Active at any time |
| Trail segments | 10 | Per projectile |
| Simultaneous effects | 50 | Total on screen |
| Target FPS | 60 | Must maintain with 30 enemies |

## 2.4 Implementation Priority

1. **Missile Pod** - Most dramatic visual change
2. **Cannon** (if kept) - Core weapon feel
3. **Tesla Coil** - Unique lightning effect
4. **Mortar** - Satisfying artillery
5. Others as time permits

---

# 3. Faction Allegiance System

## 3.1 Overview

Replaces the current Paragon prestige system with a **narrative-driven faction choice**.

### Trigger Condition

After defeating **all 8 Uber Bosses**, a portal to the **Throne of Ascension** appears.

### The Choice

Player is presented with three factions:

| Faction | Theme | Visual Style |
|---------|-------|--------------|
| **Angels** | Holy/Light | White, gold, divine glow |
| **Demons** | Fire/Chaos | Red, black, hellfire |
| **Military** | Tech/Order | Green, steel, tactical |

**Choice is permanent for that run.**

## 3.2 Faction Effects

### Module Infusion

Choosing a faction **infuses all modules** with that faction's theme:

| Original Module | + Angels | + Demons | + Military |
|-----------------|----------|----------|------------|
| Machine Gun | Holy Bolts (pierce) | Hellfire Rounds (burn) | Armor-Piercing (ignore def) |
| Missile Pod | Seraphim Missiles (homing+) | Brimstone Rockets (AoE+) | Tactical Missiles (faster) |
| Tesla Coil | Divine Lightning (chain+) | Chaos Arc (random jumps) | EMP Shock (stun+) |
| Repair Drone | Guardian Angel (overheal) | Blood Pact (lifesteal) | Nano Repair (faster) |
| Flamethrower | Holy Fire (purify) | Hellfire (DoT+) | Napalm (ground fire) |

**Infusions are cumulative across runs.** If you pick Angels first, then Demons second, your modules have BOTH infusions active.

### Enemy Changes

After picking a faction, you become enemies with the other two:

| Your Faction | Enemies You Fight |
|--------------|-------------------|
| Angels | Demons + Military (in separate waves) |
| Demons | Angels + Military (in separate waves) |
| Military | Angels + Demons (in separate waves) |

Enemy changes:
- **Stronger versions** of existing enemy types
- **Slight recoloring** to match faction (e.g., angel enemies glow white)
- Same mechanics, higher stats

## 3.3 Multi-Run Progression

### Run Structure

| Run | Faction Choice | Infusions Active | Enemies |
|-----|----------------|------------------|---------|
| 1 | Pick first (e.g., Demons) | Demons | Angels + Military |
| 2 | Pick second (e.g., Angels) | Demons + Angels | Military + Demons |
| 3 | Pick third (Military) | All three | Angels + Demons |
| 4+ | The Void unlocks | All three | Void creatures |

### What Resets Between Runs

| Resets | Keeps |
|--------|-------|
| Tank Level → 1 | Unlocked Module Slots (1-5) |
| All Stat Levels → 0 | Faction Infusions (permanent) |
| Gold → 0 | Module Collection (inventory) |
| Zone Progress → Act 1 | Bestiary Progress |
| - | Slot unlock status |

### What Persists

- **Module Infusions**: Once infused, always infused
- **Module Inventory**: Keep all collected modules
- **Slot Unlocks**: Don't have to re-buy slots
- **Achievements/Progress**: Tracked across runs

## 3.4 The Void (Endgame)

### Unlock Condition

Complete **3 full campaign runs**, one with each faction.

### The Void Content

| Content Type | Description |
|--------------|-------------|
| **Void Zone** | New Act 9 with void-themed environment |
| **Void Enemies** | Corrupted versions of ALL faction enemies |
| **Void Bosses** | 8 new void-corrupted Uber bosses |
| **Infinite Scaling** | After beating Void Ubers, difficulty scales infinitely |

### Void Enemy Design

Void enemies combine elements from all three factions:
- Angel enemies with demon fire effects
- Military units with holy auras
- Demon creatures with tech augments

Visual theme: Purple/black void corruption overtaking the original design.

### True Ending vs Infinite Play

| Milestone | Reward |
|-----------|--------|
| Beat all Void Uber Bosses | "True Ending" achievement, credits roll |
| Continue playing | Infinite scaling mode with ever-increasing rewards |

---

# 4. Implementation Phases

## Phase 1: Center Tank (High Priority)

**Changes Required:**

1. Move tank position to screen center
2. Add left-side enemy spawn points
3. Update `MODULE_SLOT_POSITIONS` in GameConfig
4. Add `targetDirection` property to module slots
5. Update module targeting logic
6. Adjust wave spawning for 50/50 split
7. Remove built-in cannon
8. Update slot costs: [0, 0, 10000, 20000, 75000]
9. Add Act 6 requirement for Slot 5

**Files to Modify:**
- `src/config/GameConfig.ts`
- `src/entities/Tank.ts`
- `src/modules/BaseModule.ts`
- `src/modules/ModuleSlot.ts`
- `src/systems/WaveSystem.ts`
- `src/state/GameState.ts`

## Phase 2: Module Independence (Medium Priority)

**Changes Required:**

1. Create module sprite system (separate from tank)
2. Add idle wobble animation
3. Add target tracking rotation
4. Add fire recoil animation
5. Update projectile spawn points to module position

**Files to Create:**
- `src/entities/ModuleSprite.ts`

**Files to Modify:**
- `src/modules/BaseModule.ts`
- `src/entities/Projectile.ts`

## Phase 3: Cinematic Effects (Medium Priority)

**Priority Order:**
1. Missile Pod arc trajectory
2. Machine Gun tracers + shell casings
3. Tesla Coil lightning effect
4. Mortar sky trajectory
5. Other modules

**Files to Modify:**
- `src/modules/types/MissilePodModule.ts`
- `src/modules/types/MachineGunModule.ts`
- `src/entities/Projectile.ts`
- New effect files in `src/effects/`

## Phase 4: Faction System (Low Priority - Post Content)

**Changes Required:**

1. Create faction data structures
2. Create Throne of Ascension scene
3. Implement module infusion system
4. Create faction-themed enemy variants
5. Track cross-run progress
6. Implement The Void content

**Files to Create:**
- `src/systems/FactionSystem.ts`
- `src/scenes/ThroneOfAscensionScene.ts`
- `src/effects/FactionInfusion.ts`

---

# 5. Open Questions (Resolved)

| # | Question | Answer |
|---|----------|--------|
| 1 | Starting slots | Slots 1 (front-right) + 2 (back-left) |
| 2 | Slot costs | [FREE, FREE, 10K, 20K, 75K after Act 6] |
| 3 | Middle slot special? | Yes, attacks both sides, most expensive |
| 4 | Slot layout | 2 front, 2 back, 1 center (see diagram) |
| 5 | Module targeting | Front→right, Back→left, Middle→closest |
| 6 | Built-in cannon | REMOVED |
| 7 | Range calculation | From module position |
| 8 | Spawn ratio | 50/50 equal both sides |
| 9 | Wave variation | Equal ratio every wave |
| 10 | Chaser stats | Same as approachers |
| 11 | Boss spawn side | Random |
| 12 | Missile arc height | High dramatic arc |
| 13 | Missile motion | Smooth continuous arc |
| 14 | Barrage behavior | Staggered launches (5 missiles, 150ms apart) |
| 15 | Performance budget | TBD during implementation |
| 16 | Module VFX priority | Missile → Cannon → Tesla → Mortar |
| 17 | Skill VFX | Same priority as auto-attacks |
| 18 | Faction trigger | After all 8 Uber Bosses |
| 19 | Faction choice permanent? | Yes, locked for that run |
| 20 | How fusions work | Cumulative visual + stat effects |
| 21 | Fusions permanent? | Yes, across all runs |
| 22 | All modules get fusions? | Yes |
| 23 | Enemy changes | Stronger versions, slight recolor |
| 24 | Enemy waves | Different factions in separate waves |
| 25 | Progress accumulates? | Yes, keep infusions across runs |
| 26 | Runs to unlock all? | 3 runs (one per faction) |
| 27 | What resets? | Level, gold, zone progress |
| 28 | What is The Void? | Infinite scaling mode |
| 29 | Void enemies | Corrupted versions of all factions |
| 30 | True ending? | Beat Void Ubers, then infinite scaling |

---

# 6. Related Documents

- [GDD.md](./GDD.md) - Core game design
- [BalanceGuide.md](./BalanceGuide.md) - Economy and scaling
- [GorePlan.md](./GorePlan.md) - Death effects (applies to all enemies)
- [MasterPlan.md](./MasterPlan.md) - Development roadmap

---

**Document Version:** 1.0
**Last Updated:** January 2025
