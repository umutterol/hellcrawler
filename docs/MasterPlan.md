# HELLCRAWLER - Master Plan
## Last Updated: January 2025

> **THIS DOCUMENT MUST BE KEPT UP TO DATE.** Update after completing any phase, sprint, or major feature.

---

# STRATEGIC ROADMAP

> **Analysis Date:** January 4, 2025
> **Methodology:** Dependency chain analysis, risk assessment, incremental value delivery

## Executive Summary

| Milestone | Status | Blocking Issues | Priority |
|-----------|--------|-----------------|----------|
| MVP (Core Systems) | ✅ Complete | None | Done |
| VFX Polish (Weapon Effects) | 🟡 In Progress | None | P0 |
| **VFX Polish (Gore System)** | ✅ Complete | None | P0 |
| **Center Tank Redesign (Phase 1A)** | ✅ Complete | None | P1 |
| **Center Tank UI Refactor (Phase 1B)** | ⏳ Planned | Phase 1A Complete | P1 |
| Cinematic Module Effects | ⏳ Planned | Center Tank | P2 |
| **UI Polish & Missing Features** | ⏳ Planned | Center Tank UI | P2.5 |
| Content Expansion (Acts 2-8) | ⏳ Planned | Center Tank | P3 |
| Audio System | ⏸️ Paused | Assets needed | P4 |
| Faction Allegiance System | ⏳ Planned | All Acts Complete | P5 |
| The Void (Endgame) | ⏳ Planned | Faction System | P6 |
| Steam Release | ⏳ Planned | All Above | P7 |

**Critical Decision:** Center Tank Redesign is scheduled BEFORE content expansion because:
1. It fundamentally changes gameplay (bidirectional combat)
2. All future content must account for new slot layout
3. Easier to implement now than retrofit later

**UI Analysis Complete:** Phase 1B added for UI refactoring to support center tank.
Separate TIER 2.5 added for UISpec features not yet implemented (drag/drop, tooltips, etc.)

---

## Priority Tiers

### 🔴 TIER 0: VFX POLISH (Complete Current Work)

Finish current VFX work before starting major architectural changes.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Damage numbers pop animation | ✅ | Complete |
| 0.2 | Enemy death flash + fade | ✅ | Complete |
| 0.3 | Crit hit visual ("CRIT!" + bigger) | ✅ | Complete |
| 0.4 | Hit spark/flash at impact point | ✅ | Complete |
| 0.5 | DEPTH constants in GameConfig | ✅ | Complete |
| 0.6 | EFFECT_TIMING constants | ✅ | Complete |
| 0.7 | Cannon muzzle flash + recoil | ⏳ | Reverted, revisit |
| 0.8 | Missile smoke puff + wobble | ⏳ | Reverted, revisit |

#### Phase 0B: Gore/Ragdoll Death System

See `docs/GorePlan.md` for detailed implementation plan.

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 0.9 | Create GoreTypes.ts + GoreConfig.ts | Low | ✅ |
| 0.10 | Create Gib.ts (poolable with fake ragdoll physics) | Medium | ✅ |
| 0.11 | Create BloodParticle.ts (gravity-affected droplets) | Low | ✅ |
| 0.12 | Create GoreManager.ts (singleton orchestrator) | Medium | ✅ |
| 0.13 | Integrate with Enemy.ts death + event payload | Low | ✅ |
| 0.14 | Load gib sprites in BootScene.ts | Low | ✅ |
| 0.15 | Add gore intensity setting (Off/Low/High) | Low | ⏳ |

**Files to Create:**
- `src/effects/gore/GoreTypes.ts`
- `src/effects/gore/GoreConfig.ts`
- `src/effects/gore/Gib.ts`
- `src/effects/gore/BloodParticle.ts`
- `src/effects/gore/GoreManager.ts`

**Files to Modify:**
- `src/entities/Enemy.ts` - Add position data to ENEMY_DIED event
- `src/types/GameEvents.ts` - Extend EnemyDiedPayload
- `src/scenes/BootScene.ts` - Load gib sprites
- `src/scenes/GameScene.ts` - Initialize GoreManager

**Assets Required:** (already copied to `public/assets/effects/gore/`)
- Blood splatter sprites (blood1-9.png, blood-small1-6.png)
- Gib sprites (need to create: gib-head, gib-torso, gib-limb-upper, gib-limb-lower, gib-chunk)

**Exit Criteria:** Combat feels impactful, ready for architectural work.

---

### 🟠 TIER 1: CENTER TANK REDESIGN (High Priority)

**Major architectural change.** Tank moves to screen center with bidirectional combat.

#### Phase 1A: Core Mechanics

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 1.1 | Move tank position to screen center | Low | ✅ |
| 1.2 | Add left-side enemy spawn system | Medium | ✅ |
| 1.3 | Update MODULE_SLOT_POSITIONS config | Low | ✅ |
| 1.4 | Add `targetDirection` property to slots | Medium | ✅ |
| 1.5 | Update module targeting logic (left/right/both) | Medium | ✅ |
| 1.6 | Adjust wave spawning for 50/50 split | Low | ✅ |
| 1.7 | Remove built-in cannon | Low | ✅ |
| 1.8 | Update slot costs: [0, 0, 10K, 20K, 75K] | Low | ✅ |
| 1.9 | Add Act 6 requirement for Slot 5 | Low | ✅ |
| 1.10 | Test bidirectional combat balance | Medium | ✅ |

#### Phase 1B: UI Refactoring for Center Tank

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 1.11 | **BottomBar.ts** - Add directional slot layout | Medium | ⏳ |
| 1.12 | **BottomBar.ts** - Direction indicators (←/→/⟷) | Low | ⏳ |
| 1.13 | **BottomBar.ts** - Reorder slots: [Back2, Back4, Center5, Front1, Front3] | Low | ⏳ |
| 1.14 | **TankStatsPanel.ts** - Add direction labels to tabs | Low | ⏳ |
| 1.15 | **TankStatsPanel.ts** - Show slot firing direction in content | Low | ⏳ |
| 1.16 | **ShopPanel.ts** - Update slot costs display | Low | ⏳ |
| 1.17 | **ShopPanel.ts** - Update unlock requirements | Low | ⏳ |
| 1.18 | **InventoryPanel.ts** - Add direction labels to equipped slots | Low | ⏳ |
| 1.19 | **UIConfig.ts** - Add slot direction constants | Low | ⏳ |
| 1.20 | **UISpec.md** - Update with new slot layout diagrams | Low | ⏳ |

**Files to Modify (Core):**
- `src/config/GameConfig.ts` - Slot positions, costs, requirements
- `src/entities/Tank.ts` - Position, remove cannon
- `src/modules/BaseModule.ts` - Target direction logic
- `src/modules/ModuleSlot.ts` - Direction property
- `src/systems/WaveSystem.ts` - Bidirectional spawning
- `src/state/GameState.ts` - Slot unlock logic

**Files to Modify (UI):**
- `src/ui/BottomBar.ts` - Slot layout with directions
- `src/ui/panels/TankStatsPanel.ts` - Tab direction labels
- `src/ui/panels/ShopPanel.ts` - New slot costs/requirements
- `src/ui/panels/InventoryPanel.ts` - Equipped slot directions
- `src/config/UIConfig.ts` - Direction constants
- `docs/UISpec.md` - Updated specifications

**Exit Criteria:**
- Tank centered on screen
- Enemies spawn from both sides (50/50)
- Front slots attack right, back slots attack left
- Center slot attacks closest from either side
- UI clearly shows slot directions
- Game is playable and balanced

**Estimated Time:** 4-6 days

---

### 🟡 TIER 2: MODULE INDEPENDENCE & CINEMATIC EFFECTS

Module sprites become independent entities with dramatic visual effects.

#### Phase 2A: Module Independence

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 2.1 | Create ModuleSprite entity class | Medium | ⏳ |
| 2.2 | Add idle wobble animation | Low | ⏳ |
| 2.3 | Add target tracking rotation | Medium | ⏳ |
| 2.4 | Add fire recoil animation | Low | ⏳ |
| 2.5 | Update projectile spawn to module position | Medium | ⏳ |

**Files to Create:**
- `src/entities/ModuleSprite.ts`

#### Phase 2B: Cinematic Effects (Priority Order)

| # | Module | Effect | Status |
|---|--------|--------|--------|
| 2.6 | Missile Pod | Vertical launch → arc → dive | ⏳ |
| 2.7 | Machine Gun | Tracers + shell casings | ⏳ |
| 2.8 | Tesla Coil | Charge-up + branching lightning | ⏳ |
| 2.9 | Mortar | Sky trajectory + target indicator | ⏳ |
| 2.10 | Others | As time permits | ⏳ |

**Exit Criteria:**
- Modules visually rotate toward targets
- Missiles arc dramatically through the sky
- Combat feels cinematic and impactful

**Estimated Time:** 1-2 weeks (can be done incrementally)

---

### 🟢 TIER 2.5: UI POLISH & MISSING FEATURES

Features specified in UISpec.md but not yet implemented.

#### Phase 2.5A: Essential Missing Features

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 2.51 | Drag & drop module equipping | Medium | ⏳ |
| 2.52 | Tooltips system (showTooltips already in settings) | Medium | ⏳ |
| 2.53 | Sort options in InventoryPanel (Rarity, Type, Recent) | Low | ⏳ |
| 2.54 | Auto-sell toggle + Uncommon auto-sell | Medium | ⏳ |
| 2.55 | Sell confirmation for Rare+ modules | Low | ⏳ |

#### Phase 2.5B: Nice-to-Have Features

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 2.56 | Right-click context menus | Medium | ⏳ |
| 2.57 | Module compare feature | Medium | ⏳ |
| 2.58 | Double-click to equip/unequip | Low | ⏳ |
| 2.59 | Zone selection UI | Medium | ⏳ |
| 2.60 | Zone completion summary screen | Medium | ⏳ |

#### Phase 2.5C: Future UI Systems

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 2.61 | Main Menu scene (New Game, Continue, Settings, Quit) | Medium | ⏳ |
| 2.62 | Near Death full-screen overlay (per UISpec) | Low | ⏳ |
| 2.63 | Gold income rate display (+5.2K/s in TopBar) | Low | ⏳ |
| 2.64 | Flee button in TopBar | Low | ⏳ |
| 2.65 | Wave pause button (delay next wave) | Low | ⏳ |

**Files to Modify:**
- `src/ui/panels/InventoryPanel.ts` - Drag/drop, sort, auto-sell, compare
- `src/ui/TopBar.ts` - Gold rate, flee button
- `src/ui/BottomBar.ts` - Wave pause
- `src/ui/components/Tooltip.ts` - New file
- `src/ui/components/ContextMenu.ts` - New file
- `src/scenes/MainMenuScene.ts` - New file
- `src/scenes/ZoneSelectScene.ts` - New file

**Exit Criteria:**
- All essential UISpec features implemented
- Smooth drag-and-drop module management
- Functional tooltips on hover
- Auto-sell for efficient inventory management

**Estimated Time:** 1-2 weeks (can be done incrementally alongside content)

---

### 🔵 TIER 3: CONTENT EXPANSION

Build out Acts 2-8 with new enemies, zones, and bosses.

#### Phase 3A: Act 2

| # | Task | Status |
|---|------|--------|
| 3.1 | Act 2 enemies (Demon, Bat, Ghost, Firebat) | ⏳ |
| 3.2 | Act 2 Zone 1 waves (bidirectional) | ⏳ |
| 3.3 | Act 2 background art | ⏳ |
| 3.4 | Act 2 Zone 2 + Gargoyle boss | ⏳ |

#### Phase 3B: Acts 3-8

| # | Task | Status |
|---|------|--------|
| 3.5 | Act 3: Military Base + Siege Beast | ⏳ |
| 3.6 | Act 4: Underground + Tunnel Wyrm | ⏳ |
| 3.7 | Act 5: Hell Outskirts + Hell Beast | ⏳ |
| 3.8 | Act 6: Burning Hells + The Infernal | ⏳ |
| 3.9 | Act 7: Chaos Realm + Void Dragon | ⏳ |
| 3.10 | Act 8: Throne + Diaboros | ⏳ |

#### Phase 3C: Content Systems

| # | Task | Status |
|---|------|--------|
| 3.11 | Zone selection UI | ⏳ |
| 3.12 | Act/Zone progression tracking | ⏳ |
| 3.13 | Auto-sell toggle for rarities | ⏳ |
| 3.14 | Remaining 7 modules | ⏳ |
| 3.15 | 8 Uber boss variants | ⏳ |

**Exit Criteria:** All 8 Acts playable with bidirectional combat.

**Estimated Time:** 4-6 weeks

---

### ⏸️ TIER 4: AUDIO SYSTEM (Paused - Waiting for Assets)

Resume when SFX/music assets are available.

| # | Task | Status |
|---|------|--------|
| 4.1 | Create AudioManager | ⏸️ |
| 4.2 | Create SFXPool | ⏸️ |
| 4.3 | Weapon SFX (cannon, MG, missiles) | ⏸️ |
| 4.4 | Impact SFX | ⏸️ |
| 4.5 | UI SFX | ⏸️ |
| 4.6 | Boss music + transitions | ⏸️ |

**Files to Create:**
- `src/managers/AudioManager.ts`
- `src/audio/SFXPool.ts`
- `src/audio/MusicController.ts`

---

### 🟣 TIER 5: FACTION ALLEGIANCE SYSTEM

Endgame content replacing Paragon. Requires all Uber Bosses defeatable.

| # | Task | Status |
|---|------|--------|
| 5.1 | Create FactionSystem.ts | ⏳ |
| 5.2 | Throne of Ascension scene | ⏳ |
| 5.3 | Faction choice UI (Angels/Demons/Military) | ⏳ |
| 5.4 | Module infusion system | ⏳ |
| 5.5 | Infusion visual effects per faction | ⏳ |
| 5.6 | Faction-themed enemy variants | ⏳ |
| 5.7 | Cross-run progress tracking | ⏳ |
| 5.8 | Cumulative infusion stacking | ⏳ |

**Files to Create:**
- `src/systems/FactionSystem.ts`
- `src/scenes/ThroneOfAscensionScene.ts`
- `src/effects/FactionInfusion.ts`

**Exit Criteria:**
- Player can complete 3 runs with different factions
- All modules have cumulative visual infusions
- Ready for The Void

---

### ⚫ TIER 6: THE VOID (True Endgame)

Unlocks after completing all 3 faction runs.

| # | Task | Status |
|---|------|--------|
| 6.1 | Void Zone environment/background | ⏳ |
| 6.2 | Void-corrupted enemy variants | ⏳ |
| 6.3 | 8 Void Uber Bosses | ⏳ |
| 6.4 | Infinite scaling system | ⏳ |
| 6.5 | "True Ending" achievement | ⏳ |

**Exit Criteria:** Infinite endgame loop with escalating difficulty.

---

### ⬜ TIER 7: STEAM RELEASE

Final polish and platform integration.

| # | Task | Status |
|---|------|--------|
| 7.1 | Steam SDK integration | ⏳ |
| 7.2 | Achievements (30+) | ⏳ |
| 7.3 | Cloud saves | ⏳ |
| 7.4 | Store page + marketing | ⏳ |
| 7.5 | Launch build verification | ⏳ |

---

## Dependency Graph

```
                    ┌─────────────────────────────────────────┐
                    │            MVP COMPLETE ✅               │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │  🔴 TIER 0: VFX Polish (In Progress)     │
                    │     Phase 0A: Weapon Effects             │
                    │     - Damage numbers ✅                  │
                    │     - Enemy death ✅                     │
                    │     - Hit sparks ✅                      │
                    │     - Muzzle flash ⏳                    │
                    │     Phase 0B: Gore System ✅             │
                    │     - Gibs + fake ragdoll ✅             │
                    │     - Blood particles ✅                 │
                    │     - Ground splatters ✅                │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │  🟠 TIER 1: CENTER TANK REDESIGN        │
                    │     Phase 1A: Core Mechanics             │
                    │     - Tank to center                     │
                    │     - Bidirectional combat               │
                    │     - Remove built-in cannon             │
                    │     - New slot layout & targeting        │
                    │     Phase 1B: UI Refactoring             │
                    │     - BottomBar directional slots        │
                    │     - Panel direction labels             │
                    │     - Updated shop costs                 │
                    └─────────────────┬───────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│ 🟡 TIER 2:       │     │ 🟢 TIER 2.5:         │     │ ⏸️ TIER 4:       │
│ Module Effects   │     │ UI Polish           │     │ Audio (Paused)  │
│ - Independence   │     │ - Drag & Drop       │     │ - When assets   │
│ - Cinematics     │     │ - Tooltips          │     │   are ready     │
│ (incremental)    │     │ - Auto-sell         │     │                 │
└────────┬────────┘     │ - Sort/Compare      │     └─────────────────┘
         │              │ - Zone Select UI    │
         │              └──────────┬──────────┘
         │                         │
         └─────────────────────────┼──────────────────────────
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │  🔵 TIER 3: CONTENT EXPANSION            │
                    │     (All 8 Acts + All Uber Bosses)       │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │  🟣 TIER 5: FACTION ALLEGIANCE          │
                    │     - Throne of Ascension               │
                    │     - 3 faction choices                  │
                    │     - Module infusions                   │
                    │     - 3 campaign runs                    │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │  ⚫ TIER 6: THE VOID                     │
                    │     - Void zone (Act 9)                  │
                    │     - 8 Void Uber Bosses                 │
                    │     - Infinite scaling                   │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │  ⬜ TIER 7: STEAM RELEASE               │
                    │     - Steam SDK                          │
                    │     - Achievements                       │
                    │     - Cloud saves                        │
                    └─────────────────────────────────────────┘
```

---

## Parallelization Guide (Multi-Instance Work)

This section identifies tasks that can be delegated to separate Claude instances working in parallel.

### Legend
- 🔀 **PARALLEL** - Can run simultaneously with other marked tasks
- 🔗 **SEQUENTIAL** - Must complete before dependent tasks
- 👤 **SINGLE OWNER** - Related tasks that should stay with one instance
- ⚡ **INDEPENDENT** - No dependencies, can start anytime

---

### TIER 0: VFX Polish - Parallelization

#### Phase 0A: Weapon Effects (2 Parallel Streams)

| Task | Parallelization | Notes |
|------|-----------------|-------|
| 0.7 Cannon muzzle flash | 🔀 PARALLEL | Independent of 0.8 |
| 0.8 Missile smoke puff | 🔀 PARALLEL | Independent of 0.7 |

**Recommended:** 2 instances can work on 0.7 and 0.8 simultaneously.

#### Phase 0B: Gore System (3 Parallel Streams)

```
STREAM A (Core)           STREAM B (Particles)      STREAM C (Integration)
══════════════════        ════════════════════      ═══════════════════════
0.9 Types + Config ──┐
        │            │
        ▼            │
0.10 Gib.ts ────────┤     0.11 BloodParticle.ts ──┐
        │            │            │                │
        └────────────┴────────────┴────────────────┘
                              │
                              ▼
                     0.12 GoreManager.ts
                              │
                              ▼
                     0.13 Enemy.ts integration
                     0.14 BootScene loading
                     0.15 Gore settings
```

| Stream | Tasks | Owner | Dependencies |
|--------|-------|-------|--------------|
| **Stream A** | 0.9 → 0.10 | 👤 Instance 1 | 0.9 first, then 0.10 |
| **Stream B** | 0.9 → 0.11 | 👤 Instance 2 | 🔀 Parallel with Stream A after 0.9 |
| **Stream C** | 0.12, 0.13, 0.14, 0.15 | 👤 Instance 3 | Needs 0.10 + 0.11 complete |

**Recommended:**
- Start with 0.9 (shared dependency)
- Then 2 instances for Gib.ts and BloodParticle.ts in parallel
- Final instance for integration (0.12-0.15)

**Cross-Phase Parallelization:**
- Phase 0A (0.7, 0.8) can run in PARALLEL with Phase 0B (gore system)
- Maximum 4 instances: 2 for weapon effects + 2 for gore system

---

### TIER 1: Center Tank - Parallelization

#### Phase 1A: Core Mechanics (3 Parallel Streams)

```
STREAM A (Position/Spawn)     STREAM B (Targeting)      STREAM C (Config)
═══════════════════════       ════════════════════      ═════════════════
1.1 Tank position ────┐       1.4 targetDirection ─┐    1.7 Remove cannon
         │            │              │              │    1.8 Slot costs
         ▼            │              ▼              │    1.9 Act 6 req
1.2 Left spawn ──────┤       1.5 Module targeting ─┤
         │            │                             │
         ▼            │                             │
1.3 Slot positions ──┤                             │
         │            │                             │
1.6 Wave spawning ───┴─────────────────────────────┘
                              │
                              ▼
                        1.10 Testing (ALL COMPLETE)
```

| Stream | Tasks | Owner |
|--------|-------|-------|
| **Stream A** | 1.1 → 1.2 → 1.3 → 1.6 | 👤 Instance 1 |
| **Stream B** | 1.4 → 1.5 | 👤 Instance 2 (🔀 parallel with A) |
| **Stream C** | 1.7, 1.8, 1.9 | 👤 Instance 3 (🔀 parallel with A, B) |
| **Final** | 1.10 | Any instance after merge |

**Recommended:** 3 instances for Phase 1A, merge for testing.

---

#### Phase 1B: UI Refactoring (4 Parallel Streams)

```
STREAM D (BottomBar)     STREAM E (Panels)          STREAM F (Shop)       STREAM G (Config)
════════════════════     ═════════════════          ═══════════════       ════════════════
1.11 Slot layout         1.14 Stats direction       1.16 Costs display    1.19 UIConfig
1.12 Direction icons     1.15 Stats content         1.17 Requirements     1.20 UISpec.md
1.13 Slot reorder        1.18 Inventory labels
```

| Stream | Tasks | Owner | Dependencies |
|--------|-------|-------|--------------|
| **Stream D** | 1.11, 1.12, 1.13 | 👤 Instance 1 | Needs 1.19 (UIConfig) |
| **Stream E** | 1.14, 1.15, 1.18 | 👤 Instance 2 | Needs 1.19 |
| **Stream F** | 1.16, 1.17 | 👤 Instance 3 | Needs 1.19 |
| **Stream G** | 1.19, 1.20 | 👤 Instance 4 | 🔗 FIRST - others depend on this |

**Recommended:** Start Stream G first, then 3 parallel UI instances.

---

### TIER 2: Module Effects - Parallelization

#### Phase 2A: Module Independence

| Task | Parallelization | Notes |
|------|-----------------|-------|
| 2.1 ModuleSprite class | 🔗 SEQUENTIAL | Must be first |
| 2.2 Idle wobble | 🔗 SEQUENTIAL | Needs 2.1 |
| 2.3 Target rotation | 🔗 SEQUENTIAL | Needs 2.2 |
| 2.4 Fire recoil | 🔗 SEQUENTIAL | Needs 2.3 |
| 2.5 Projectile spawn | 🔗 SEQUENTIAL | Needs 2.4 |

**Recommended:** Single instance for Phase 2A (tight dependencies).

---

#### Phase 2B: Cinematic Effects (5 Parallel Streams!)

```
Each module effect is INDEPENDENT - maximum parallelization possible!

Instance 1: 2.6 Missile Pod (arc + dive)
Instance 2: 2.7 Machine Gun (tracers + casings)
Instance 3: 2.8 Tesla Coil (lightning)
Instance 4: 2.9 Mortar (sky trajectory)
Instance 5: 2.10 Other modules
```

| Task | Parallelization | Notes |
|------|-----------------|-------|
| 2.6 Missile Pod | ⚡ INDEPENDENT | 🔀 Parallel |
| 2.7 Machine Gun | ⚡ INDEPENDENT | 🔀 Parallel |
| 2.8 Tesla Coil | ⚡ INDEPENDENT | 🔀 Parallel |
| 2.9 Mortar | ⚡ INDEPENDENT | 🔀 Parallel |
| 2.10 Others | ⚡ INDEPENDENT | 🔀 Parallel |

**Recommended:** Up to 5 instances for cinematic effects!

---

### TIER 2.5: UI Polish - Parallelization

#### Phase 2.5A: Essential Features (3 Parallel Streams)

| Stream | Tasks | Notes |
|--------|-------|-------|
| **Drag & Drop** | 2.51 | ⚡ INDEPENDENT - Complex, dedicated instance |
| **Tooltips** | 2.52 | ⚡ INDEPENDENT - New system, dedicated instance |
| **Inventory Features** | 2.53, 2.54, 2.55 | 👤 SINGLE OWNER - All in InventoryPanel |

---

#### Phase 2.5B & 2.5C: All Independent

| Task | Parallelization |
|------|-----------------|
| 2.56 Context menus | ⚡ INDEPENDENT |
| 2.57 Module compare | ⚡ INDEPENDENT |
| 2.58 Double-click | ⚡ INDEPENDENT |
| 2.59 Zone select UI | ⚡ INDEPENDENT |
| 2.60 Zone summary | ⚡ INDEPENDENT |
| 2.61 Main Menu scene | ⚡ INDEPENDENT |
| 2.62 Near Death overlay | ⚡ INDEPENDENT |
| 2.63 Gold rate display | ⚡ INDEPENDENT |
| 2.64 Flee button | ⚡ INDEPENDENT |
| 2.65 Wave pause | ⚡ INDEPENDENT |

**Recommended:** Each UI feature can be a separate instance.

---

### TIER 3: Content Expansion - Parallelization

#### Maximum Parallelization: 8 Acts

```
Each Act is INDEPENDENT - can be developed in parallel!

Instance 1: Act 2 (3.1-3.4) - Demon, Bat, Ghost, Firebat, Gargoyle boss
Instance 2: Act 3 (3.5) - Military Base, Siege Beast
Instance 3: Act 4 (3.6) - Underground, Tunnel Wyrm
Instance 4: Act 5 (3.7) - Hell Outskirts, Hell Beast
Instance 5: Act 6 (3.8) - Burning Hells, The Infernal
Instance 6: Act 7 (3.9) - Chaos Realm, Void Dragon
Instance 7: Act 8 (3.10) - Throne, Diaboros
Instance 8: Systems (3.11-3.15) - Zone UI, progression, modules
```

| Task Group | Parallelization | Notes |
|------------|-----------------|-------|
| Each Act (3.1-3.10) | ⚡ INDEPENDENT | 🔀 All parallel |
| Systems (3.11-3.15) | 🔀 PARALLEL | Can run alongside Acts |

**Recommended:** Scale to as many instances as needed for content.

---

### TIER 4-7: Later Phases

| Tier | Parallelization Strategy |
|------|--------------------------|
| **TIER 4: Audio** | Single instance (cohesive audio design) |
| **TIER 5: Faction** | 3 factions can be parallel after base system |
| **TIER 6: The Void** | Single instance (unique endgame content) |
| **TIER 7: Steam** | Single instance (platform integration) |

---

### Summary: Maximum Parallel Instances by Phase

| Phase | Max Instances | Work Streams |
|-------|---------------|--------------|
| TIER 0A | 2 | Muzzle flash, Smoke puff |
| TIER 0B | 3 | Gore core, Blood particles, Integration |
| **TIER 0 Total** | **4** | Phase 0A + 0B can run in parallel |
| TIER 1A | 3 | Position, Targeting, Config |
| TIER 1B | 4 | BottomBar, Panels, Shop, Config |
| TIER 2A | 1 | Sequential dependencies |
| TIER 2B | 5 | Each module effect |
| TIER 2.5 | 10+ | Each UI feature |
| TIER 3 | 8 | Each Act + Systems |

**Peak Parallelization:** TIER 2.5 and TIER 3 offer the most parallel work.

---

### Cross-Tier Parallelization

Some tiers can run in parallel with others:

```
After TIER 1 completes:
├── TIER 2 (Module Effects) ──────┐
├── TIER 2.5 (UI Polish) ─────────┼── All can run in PARALLEL
└── TIER 3 (Content) ─────────────┘

TIER 4 (Audio) can run in parallel with ANY tier (waiting for assets)
```

---

## Current Status

| Milestone | Status | Last Updated |
|-----------|--------|--------------|
| Prototype | ✅ Complete | Dec 2024 |
| MVP | ✅ Complete | Dec 2024 |
| Balance Guide | ✅ Complete | Jan 3, 2025 |
| VFX Polish | 🟡 In Progress | Jan 4, 2025 |
| Center Tank | ⏳ Next | - |

**Current Phase:** VFX Polish - Gore System Complete ✅
**Next Phase:** Center Tank Redesign (TIER 1) or remaining weapon VFX (0.7, 0.8)
**Audio Status:** ⏸️ Paused (waiting for assets)

---

## Architecture Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 2024 | No screen shake | Designer preference |
| Dec 2024 | Tank is stationary | Core design pillar |
| Dec 2024 | Near Death not Death | Core design pillar |
| Dec 2024 | Auto-mode has 10% penalty | Balance manual vs idle play |
| Dec 2024 | Sliding Panel UI (not scenes) | Desktop Heroes reference - game never pauses |
| Jan 2025 | Desktop Heroes as reference architecture | Proven patterns for idle auto-battlers |
| Jan 2025 | Desktop Heroes scaling patterns | HP 1.8^act, Damage 1.4^act exponential curves |
| **Jan 2025** | **Center Tank with bidirectional combat** | Differentiates from Desktop Heroes, more strategic |
| **Jan 2025** | **Remove built-in cannon** | All damage from modules, more meaningful loadout |
| **Jan 2025** | **Slot 5 attacks both sides** | Center slot is most valuable, creates strategy |
| **Jan 2025** | **Faction Allegiance replaces Paragon** | Narrative-driven endgame with cumulative infusions |
| **Jan 2025** | **The Void as true endgame** | Infinite scaling after all factions unlocked |

---

## Key Design Changes Summary

### 1. Center Tank & Bidirectional Combat
- Tank at screen center
- Enemies from both left and right (50/50)
- Slots 1, 3 (front) → Attack right
- Slots 2, 4 (back) → Attack left
- Slot 5 (center) → Attacks both sides

### 2. Slot Unlock Changes
| Old | New |
|-----|-----|
| Slot 1: Free | Slot 1: Free |
| Slot 2: 10K | Slot 2: Free |
| Slot 3: 50K | Slot 3: 10K |
| Slot 4: 500K (Diaboros) | Slot 4: 20K |
| Slot 5: 2M (All Ubers) | Slot 5: 75K (Act 6) |

### 3. Faction Allegiance System
- Unlocks after all 8 Uber Bosses
- Choose: Angels / Demons / Military
- Module infusions are cumulative
- 3 runs to unlock all factions
- The Void unlocks after 3 runs

---

## Known Technical Debt

| Issue | Priority | Notes |
|-------|----------|-------|
| Monolithic GameState | P2 | Split into 4 stores after Center Tank |
| Zone-complete only saves | P2 | Add debounced auto-save |
| No AudioManager | P3 | Wait for assets |
| Module targeting is global | P1 | Must add direction-based targeting |
| Cannon hardcoded in Tank | P1 | Remove as part of Center Tank work |

---

## Technical Differences: Desktop Heroes vs Hellcrawler

This section documents architectural differences between Desktop Heroes (Meeting Notes) and our Hellcrawler implementation, for alignment decisions.

### 1. UI System

| Aspect | Desktop Heroes | Hellcrawler | Alignment Action |
|--------|---------------|-------------|------------------|
| **UI Layer** | DOM overlay with `@telazer/game-ui-kit` | Pure Phaser GameObjects | Keep Phaser - simpler, no DOM sync issues |
| **Buttons** | DOM `Button.create()` with cooldown overlay | Phaser Rectangle + Text | Consider adding cooldown sweep animation |
| **Sliders** | DOM `Slider.create()` | Phaser Graphics + Rectangle | Works well, keep current |
| **Tooltips** | DOM-based with CSS | NOT IMPLEMENTED | Add Phaser-based Tooltip.ts |
| **Modals** | DOM `Modal.create()` | NOT IMPLEMENTED | Add for confirms (sell Rare+) |
| **Nine-Slice** | `@telazer/phaser-image-helper` | NOT USED | Consider for panel backgrounds |
| **Custom Cursors** | CSS cursor files | NOT IMPLEMENTED | Low priority |

**Recommendation:** Our Phaser-only approach is cleaner for a single-dev project. Add tooltips and modals as Phaser components.

---

### 2. State Management

| Aspect | Desktop Heroes | Hellcrawler | Alignment Action |
|--------|---------------|-------------|------------------|
| **Structure** | 4 separate stores (game, inventory, progress, settings) | 1 monolithic GameState | SPLIT into 4 stores (P2 debt) |
| **Save Format** | Base64-encoded `.pxt` files | JSON in localStorage | Add Electron file save later |
| **Auto-Save** | Debounced (5s after any change) | Zone-complete only | ADD debounced auto-save |
| **Save Slots** | Multiple slots (save-data-32.pxt, etc.) | Single save | Add slots for Steam (TIER 7) |
| **Version Migration** | Explicit migration functions | Version field only | Add migrations as needed |
| **Offline Progress** | Calculates earnings while closed | NOT IMPLEMENTED | Add for idle game feel |

**Recommended Store Split:**
```
GameState (current) → Split into:
├── tankStore      (level, stats, HP)
├── inventoryStore (modules, equipment)
├── progressStore  (act, zone, wave, bosses)
└── settingsStore  (audio, display, controls)
```

---

### 3. Combat System

| Aspect | Desktop Heroes | Hellcrawler | Alignment Action |
|--------|---------------|-------------|------------------|
| **Movement** | Character walks right, stops to attack | Tank stationary | Intentional design difference |
| **Damage Formula** | `base * stat * skill * crit - defense` | `base * slot * stats * crit * variance` | Similar, our variance adds feel |
| **Status Effects** | Poison, Burning, Slow, Shock, Disarm | NOT IMPLEMENTED | Add in TIER 3 with Act 2+ |
| **Vampiric/Lifesteal** | Stat-based % of damage | Implemented | Already aligned |
| **Critical Hits** | Based on Agility stat | Based on CritChance stat | Already aligned |
| **AOE** | `aoe_range` stat multiplier | Flat radius from module | Consider stat-based scaling |
| **Defense** | Linear subtraction | Diminishing returns formula | Our formula is better balanced |

**Status Effects to Add (TIER 3):**
- Burning (Fire DoT)
- Poison (% HP DoT)
- Slow (enemy speed reduction)
- Shock (stun)
- Bleed (physical DoT, stacks)

---

### 4. Inventory System

| Aspect | Desktop Heroes | Hellcrawler | Alignment Action |
|--------|---------------|-------------|------------------|
| **Structure** | 21 chest categories | Single inventory array | Keep simple, add categories if needed |
| **Item Classes** | stackable, consumable, equippable, etc. | Modules only (no consumables) | Keep modules-only for now |
| **Skill Bar** | 3 slots per class, auto-use toggle | Module skills (1-10 keys) | Similar concept |
| **Drag & Drop** | Full drag/drop for equip/sell | Click-based only | Add drag/drop (TIER 2.5) |
| **Auto-Equip** | Compare power, equip if better | Manual only | Add auto-equip option |
| **Crafting** | Recipe system with materials | NOT APPLICABLE | Not needed for Hellcrawler |

---

### 5. Visual Effects

| Aspect | Desktop Heroes | Hellcrawler | Alignment Action |
|--------|---------------|-------------|------------------|
| **Damage Flash** | GLSL shader (damageEffect.frag) | Phaser tint flash | Consider shader for smoother effect |
| **Status VFX** | Hue shift shader | NOT IMPLEMENTED | Add with status effects |
| **Damage Numbers** | Unknown | Implemented with pop animation | Already complete |
| **Hit Sparks** | Unknown | Implemented | Already complete |
| **Particles** | Phaser emitters | Limited use | Expand for missiles, explosions |

---

### 6. Audio System

| Aspect | Desktop Heroes | Hellcrawler | Alignment Action |
|--------|---------------|-------------|------------------|
| **Architecture** | AudioHelper with SFX pool | NOT IMPLEMENTED | Create AudioManager (TIER 4) |
| **Volume Controls** | Per-category (master, music, SFX) | Settings exist, no audio | Settings ready |
| **Music Transitions** | Boss music swap | NOT IMPLEMENTED | Add with audio assets |

---

### Priority Actions from Alignment

| Priority | Action | Effort | Tier |
|----------|--------|--------|------|
| P1 | Add debounced auto-save | Low | Standalone |
| P1 | Add tooltips system | Medium | 2.5 |
| P2 | Split GameState into 4 stores | Medium | After Center Tank |
| P2 | Add status effects system | Medium | 3 |
| P2 | Add drag & drop for modules | Medium | 2.5 |
| P3 | Add confirmation modals | Low | 2.5 |
| P3 | Add offline progress calculation | Medium | Content |
| P4 | Consider GLSL shaders for VFX | Low | Polish |
| P4 | Add save slots for Steam | Low | 7 |

---

## Changelog

### January 4, 2025 - Center Tank Redesign (Phase 1A) Complete

**Implemented Bidirectional Combat System:**
- Tank positioned at screen center (x=960)
- Enemies spawn from both left and right sides (50/50 distribution)
- Front slots (0, 2) attack right-side enemies
- Back slots (1, 3) attack left-side enemies
- Center slot (4) attacks enemies from both sides
- Removed built-in cannon (all damage from modules)

**Key Changes:**

*src/config/GameConfig.ts:*
- Added `SlotDirection` enum (Left, Right, Both)
- Added `TANK_X = 960` constant
- Updated `SLOT_COSTS` to [0, 0, 10K, 20K, 75K]
- Added `SLOT_5_ACT_REQUIREMENT = 6`
- Updated `MODULE_SLOT_POSITIONS` for bidirectional layout
- Added `SLOT_DIRECTIONS` array for slot targeting

*src/entities/Tank.ts:*
- Removed cannon-related code (sprite, firing, animation)
- Added dual hitboxes (left/right) for collision detection
- Added `getHitboxes()`, `getLeftHitbox()` methods

*src/entities/Enemy.ts:*
- Added `SpawnSide` type and `spawnSide` property
- Updated `activate()` to accept spawn side parameter
- Enemies now move toward tank center from both directions
- Sprite flipping based on spawn side
- Attack animation lunges toward tank

*src/systems/WaveSystem.ts:*
- Added `SpawnSide` type and bidirectional spawn positions
- Updated `buildSpawnQueue()` for 50/50 left/right distribution
- Updated `spawnEnemy()` to pass side to Enemy
- Boss always spawns from right (dramatic entrance)

*src/systems/CombatSystem.ts:*
- Dual enemy-tank overlaps (left + right hitboxes)
- Removed `fireCannonAt()` method
- Updated `destroy()` for both overlaps

*src/modules/ModuleManager.ts:*
- Added `filterEnemiesBySlotDirection()` method
- Modules only target enemies on their designated side
- Skills also respect slot direction

**Status:** Phase 1A complete. Phase 1B (UI Refactoring) next.

---

### January 4, 2025 - Gore System Bug Fixes & Complete

**Fixed Gore Visibility Issues:**
- Fixed GROUND_Y from 550 → 320 (game viewport is only 350px, gibs were falling off-screen)
- Fixed GORE_DEPTH values to render above enemies (depth 200):
  - GORE_DEPTH.SPLATTER: 5 → 60 (above ground layer)
  - GORE_DEPTH.BLOOD: 95 → 250 (above enemies)
  - GORE_DEPTH.GIB: 100 → 250 (above enemies)
- Removed debug logging after verification

**Files Modified:**
- `src/effects/gore/GoreConfig.ts` - GROUND_Y and GORE_DEPTH fixes
- `src/effects/gore/GoreManager.ts` - Cleaned up debug logging
- `src/effects/gore/Gib.ts` - Cleaned up debug logging
- `src/effects/gore/BloodParticle.ts` - Cleaned up debug logging

**Gore System Status:** ✅ Complete and visually verified

---

### January 4, 2025 - Gore System Implementation Complete

**Core Gore System Implemented (Tasks 0.9-0.14):**
- Created `src/effects/gore/GoreTypes.ts` - GibType enum, BloodSplatterType, config interfaces
- Created `src/effects/gore/GoreConfig.ts` - Pool sizes, physics constants, timing, spawn counts
- Created `src/effects/gore/Gib.ts` - Poolable gib with fake ragdoll physics via tweens
- Created `src/effects/gore/BloodParticle.ts` - Gravity-affected blood droplets
- Created `src/effects/gore/GoreManager.ts` - Singleton orchestrator with object pools

**Integration Completed:**
- Modified `src/entities/Enemy.ts` - Added position/scale/tint data to ENEMY_DIED event
- Updated `src/types/GameEvents.ts` - Extended EnemyDiedPayload with gore data fields
- Updated `src/scenes/BootScene.ts` - Added loading for all gib and blood sprites
- Updated `src/scenes/GameScene.ts` - Initialize and destroy GoreManager

**Features:**
- Object pooling (150 gibs, 300 blood particles, 50 splatters)
- Fake ragdoll physics with gravity, bouncing, and settling
- Blood particle spray with ground splatter creation
- Configurable spawn counts by intensity (Off/Low/High) and enemy type (normal/boss)
- Tint inheritance from enemy sprites for visual consistency

**Remaining:** Task 0.15 (Gore intensity UI setting) deferred to TIER 2.5 UI Polish

---

### January 4, 2025 - Gore System Added to Roadmap

**Gore/Ragdoll Death System Integration:**
- Added Phase 0B: Gore/Ragdoll Death System to TIER 0
- Added 7 new tasks (0.9-0.15) for gore implementation
- Integrated with parallelization guide (3 parallel streams)
- Updated dependency graph to show gore system
- Updated summary table (TIER 0 now supports 4 parallel instances)

**Tasks Added:**
- 0.9: GoreTypes.ts + GoreConfig.ts
- 0.10: Gib.ts (poolable with fake ragdoll physics)
- 0.11: BloodParticle.ts (gravity-affected droplets)
- 0.12: GoreManager.ts (singleton orchestrator)
- 0.13: Enemy.ts integration + event payload
- 0.14: BootScene.ts gib sprite loading
- 0.15: Gore intensity setting (Off/Low/High)

**Reference Document:** `docs/GorePlan.md` contains detailed implementation specs.

---

### January 4, 2025 - Parallelization Guide Added

**Multi-Instance Work Planning:**
- Added comprehensive "Parallelization Guide (Multi-Instance Work)" section
- Analyzed all tiers for parallel work opportunities
- Created stream diagrams showing dependency chains
- Identified maximum parallel instances per phase:
  - TIER 0: 2 instances (VFX effects)
  - TIER 1A: 3 instances (Position, Targeting, Config streams)
  - TIER 1B: 4 instances (BottomBar, Panels, Shop, Config)
  - TIER 2A: 1 instance (sequential dependencies)
  - TIER 2B: 5 instances (each module effect)
  - TIER 2.5: 10+ instances (each UI feature)
  - TIER 3: 8 instances (each Act)

**Key Findings:**
- Peak parallelization in TIER 2.5 and TIER 3
- TIER 2, 2.5, and 3 can all run in parallel after TIER 1 completes
- TIER 4 (Audio) can run alongside any tier while waiting for assets
- Created legend: 🔀 PARALLEL, 🔗 SEQUENTIAL, 👤 SINGLE OWNER, ⚡ INDEPENDENT

---

### January 4, 2025 - Technical Alignment Analysis

**Desktop Heroes vs Hellcrawler Comparison:**
- Added comprehensive technical differences section
- Analyzed 6 major systems: UI, State, Combat, Inventory, VFX, Audio
- Identified key architectural divergences and alignment actions

**Key Findings:**
- UI: Keep Phaser-only approach (simpler than DOM overlay)
- State: Need to split GameState into 4 stores (P2)
- Combat: Status effects needed for Act 2+ content
- Inventory: Add drag & drop for better UX
- VFX: Consider GLSL shaders for smoother damage flash
- Audio: Settings ready, awaiting assets

**Priority Actions Identified:**
- P1: Debounced auto-save, tooltips system
- P2: GameState split, status effects, drag & drop
- P3: Confirmation modals, offline progress
- P4: GLSL shaders, save slots

---

### January 4, 2025 - UI Refactoring Plan Added

**UI Analysis & Planning:**
- Analyzed all 14 UI files against UISpec.md specification
- Identified features requiring updates for center tank redesign
- Identified UISpec features not yet implemented

**Added to MasterPlan:**
- TIER 1 Phase 1B: UI Refactoring for Center Tank (10 tasks)
  - BottomBar directional slot layout
  - Direction indicators for all panels
  - Updated slot costs and requirements
- TIER 2.5: UI Polish & Missing Features (15 tasks)
  - Essential: Drag & drop, tooltips, sort, auto-sell
  - Nice-to-have: Context menus, compare, double-click
  - Future: Main menu, zone select, near death overlay

**Files Analyzed:**
- `src/ui/GameUI.ts` - Minimal, ready for floating elements
- `src/ui/Sidebar.ts` - Complete, no changes needed
- `src/ui/TopBar.ts` - Missing: gold rate, flee button
- `src/ui/BottomBar.ts` - Needs: directional slots, wave pause
- `src/ui/panels/SlidingPanel.ts` - Complete base class
- `src/ui/panels/TankStatsPanel.ts` - Needs: direction labels
- `src/ui/panels/InventoryPanel.ts` - Needs: drag/drop, sort, auto-sell
- `src/ui/panels/ShopPanel.ts` - Needs: new costs/requirements
- `src/ui/panels/SettingsPanel.ts` - Complete
- `src/config/UIConfig.ts` - Needs: direction constants

---

### January 4, 2025 - Major Roadmap Restructure

**Incorporated Tank Gameplay Redesign into GDD and PRD:**
- Updated GDD Section 3 (Player Tank) with center tank, bidirectional combat
- Updated GDD Section 3.5 (Module Slots) with new layout and targeting directions
- Added GDD Section 4.6 (Cinematic Module Effects)
- Replaced GDD Section 6.3 (Paragon) with Faction Allegiance System
- Updated GDD Section 5.1 (Combat Flow) for bidirectional combat
- Updated PRD F-MODULE-001 with slot directions and new unlock costs
- Replaced PRD F-PROG-002 (Paragon) with Faction Allegiance System
- Updated PRD Success Criteria with new features

**Reprioritized MasterPlan as Senior PM:**
- TIER 0: Complete current VFX work
- TIER 1: Center Tank Redesign (before content)
- TIER 2: Cinematic Module Effects (incremental)
- TIER 3: Content Expansion (Acts 2-8)
- TIER 4: Audio (paused for assets)
- TIER 5: Faction Allegiance System
- TIER 6: The Void (true endgame)
- TIER 7: Steam Release

**Rationale:** Center Tank must come before content expansion because:
1. It changes fundamental gameplay mechanics
2. All future content must account for bidirectional combat
3. Easier to implement now than retrofit later

### January 3, 2025 - VFX Progress & Balance Implementation
- Completed damage numbers, enemy death effects, crit visuals, hit sparks
- Added DEPTH and EFFECT_TIMING constants
- Implemented balance scaling from BalanceGuide.md
- Gore system assets copied, ready for implementation

### January 3, 2025 - Balance Guide Creation
- Created comprehensive BalanceGuide.md
- Base enemy stats, per-act scaling, economy targets
- Ready-to-use BALANCE constants

### December 2024 - MVP Complete
- All core systems functional
- Sliding panel UI implemented
- Save/Load working
- Ready for polish phase

---

**Remember: Update this document after every significant milestone!**
