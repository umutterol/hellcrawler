# HELLCRAWLER - Master Plan
## Last Updated: January 2025

> **THIS DOCUMENT MUST BE KEPT UP TO DATE.** Update after completing any phase, sprint, or major feature.

---

# PRIORITIZED ROADMAP (PM Analysis)

> **Analysis Date:** January 3, 2025
> **Methodology:** Prioritized by dependency chain, Vertical Slice needs, complexity, and risk

## Executive Summary

| Milestone | Status | Blocking Issues | ETA |
|-----------|--------|-----------------|-----|
| MVP | ✅ Complete | None | Done |
| Balance Guide | ✅ Complete | None | Done |
| Vertical Slice (VFX) | 🟡 IN PROGRESS | None | This week |
| Balance Implementation | ⏳ Ready | None | Can start now |
| Vertical Slice (Audio) | ⏸️ PAUSED | Waiting for SFX/music | TBD |
| Content Expansion | ⏳ Waiting | VFX + Balance complete | 2 weeks |

**Note:** Audio deprioritized - no SFX/music assets ready. Balance formulas now documented in `docs/BalanceGuide.md` - ready for implementation.

---

## Priority Tiers

### 🟠 TIER 1: VFX & GAME FEEL (Do Now - No Audio Needed)

Visual feedback that makes combat feel impactful. **Can complete without audio assets.**

| # | Task | Complexity | Dependency | Status |
|---|------|------------|------------|--------|
| 1.1 | Damage numbers pop animation | Low | None | ✅ |
| 1.2 | Enemy death flash + fade | Low | None | ✅ |
| 1.3 | Crit hit visual ("CRIT!" + bigger) | Low | 1.1 | ✅ |
| 1.4 | Cannon muzzle flash + recoil | Low | None | ⏳ |
| 1.5 | Missile smoke puff + wobble | Low | None | ⏳ |
| 1.6 | Hit spark/flash at impact point | Low | None | ✅ |
| 1.7 | DEPTH constants in GameConfig | Low | None | ✅ |
| 1.8 | EFFECT_TIMING constants | Low | None | ✅ |

**Estimated Time:** 2-3 days

---

### 🟡 TIER 2: POLISH VFX (Medium Priority - No Audio)

Nice-to-have visual polish. **Still no audio required.**

| # | Task | Complexity | Dependency | Status |
|---|------|------------|------------|--------|
| 2.1 | Boss spawn intro (darken + animation) | Medium | None | ⏳ |
| 2.2 | Near Death smoke + pulse | Medium | None | ⏳ |
| 2.3 | Legendary drop glow effect | Low | None | ⏳ |
| 2.4 | Onboarding tooltips (3-4) | Medium | None | ⏳ |
| 2.5 | **Gore System: GoreManager + pools** | Medium | Gib assets | ⏳ |
| 2.6 | **Gore System: Fake ragdoll gibs** | Medium | 2.5 | ⏳ |
| 2.7 | **Gore System: Blood particles + splatters** | Low | 2.5 | ⏳ |

**Gore System Details:** Fake ragdoll deaths using tweens (no physics). Generic gib sprites tinted per-enemy. See full plan: `~/.claude/plans/purring-shimmying-leaf.md`

**Asset Requirement:** Create 5 gib sprites (16-bit pixel art): `gib-head.png`, `gib-torso.png`, `gib-limb-upper.png`, `gib-limb-lower.png`, `gib-chunk.png` in `public/assets/effects/gore/`

**Estimated Time:** 3-4 days (including gore system)

---

### 🔵 TIER 3: BALANCE IMPLEMENTATION & QUICK WINS (Can Parallelize)

Implement balance formulas from `docs/BalanceGuide.md`. **No audio needed.**

| # | Task | Complexity | Dependency | Impact |
|---|------|------------|------------|--------|
| 3.1 | Add BALANCE constants to GameConfig | Low | None | High - foundation for all scaling |
| 3.2 | Implement per-act enemy scaling | Medium | 3.1 | High - proper difficulty curve |
| 3.3 | Add base enemy stats (HP, damage, speed) | Low | 3.1 | High - combat feel |
| 3.4 | Zone gold multipliers (+40%/zone) | Low | 3.1 | High - farming optimization |
| 3.5 | Elite = 2× drop rate | Low | None | Medium - loot satisfaction |
| 3.6 | Super Elite = guaranteed drop | Low | None | High - milestone reward |
| 3.7 | Boss = guaranteed + higher rarity | Low | None | High - boss value |
| 3.8 | Milestone rewards (5/10/25 levels) | Medium | None | High - dopamine hits |

**Reference:** `docs/BalanceGuide.md` - Complete formulas and base values
**Estimated Time:** 2-3 days total

---

### ⏸️ TIER 4: AUDIO (Paused - Waiting for Assets)

**Status: PAUSED** - Resume when SFX/music assets are ready.

| # | Task | Complexity | Dependency | Status |
|---|------|------------|------------|--------|
| 4.1 | Create AudioManager | Medium | Assets | ⏸️ |
| 4.2 | Create SFXPool | Low | 4.1 | ⏸️ |
| 4.3 | Cannon boom SFX | Low | 4.1 | ⏸️ |
| 4.4 | Machine gun rattle SFX | Low | 4.1 | ⏸️ |
| 4.5 | Missile whoosh SFX | Low | 4.1 | ⏸️ |
| 4.6 | Hit impact SFX | Low | 4.1 | ⏸️ |
| 4.7 | UI click SFX | Low | 4.1 | ⏸️ |
| 4.8 | Skill activation sound | Low | 4.1 | ⏸️ |
| 4.9 | Boss death celebration sound | Low | 4.1 | ⏸️ |
| 4.10 | Legendary drop sound | Low | 4.1 | ⏸️ |

**Files to Create (when ready):**
- `src/managers/AudioManager.ts`
- `src/audio/SFXPool.ts`

**Estimated Time:** 1-2 days (once assets ready)

---

### 🟢 TIER 5: CONTENT EXPANSION (After VFX Complete)

New content. **Only start after VFX polish done.**

| # | Task | Complexity | Dependency | Status |
|---|------|------------|------------|--------|
| 5.1 | Zone 2 polish (Super Elite focus) | Medium | VFX Complete | ⏳ |
| 5.2 | Act 2 Zone 1 enemies (4 types) | Medium | 5.1 | ⏳ |
| 5.3 | Act 2 Zone 1 waves | Low | 5.2 | ⏳ |
| 5.4 | Act 2 background art | Medium | None | ⏳ |
| 5.5 | Act 2 Zone 2 + Gargoyle boss | High | 5.2, 5.3 | ⏳ |
| 5.6 | Zone selection UI | Medium | 5.1 | ⏳ |
| 5.7 | Act/Zone progression tracking | Low | 5.6 | ⏳ |
| 5.8 | Auto-sell toggle for rarities | Low | None | ⏳ |

**Estimated Time:** 2 weeks

---

### ⚪ TIER 6: ARCHITECTURE REFACTOR (Low Priority)

Large refactors that improve maintainability. **Do after Content Expansion or during downtime.**

| # | Task | Complexity | Dependency | Risk |
|---|------|------------|------------|------|
| 6.1 | 4-store state architecture | High | None | Medium - breaking change |
| 6.2 | Debounced auto-save (5s) | Medium | 6.1 | Low |
| 6.3 | Save file versioning | Low | 6.2 | Low |
| 6.4 | GLSL damage flash shader | Medium | None | Low |
| 6.5 | Near Death visual shader | Medium | 6.4 | Low |

**Estimated Time:** 1-2 weeks

**Reference:** [03-state-management.md](Meeting/03-state-management.md)

---

### ⬜ TIER 7: FUTURE SYSTEMS (Post-Release Backlog)

New systems for long-term engagement. **Plan after Steam release.**

| # | Task | Complexity | Dependency | Value |
|---|------|------------|------------|-------|
| 6.1 | Status effects (Burn/Shock/Slow) | High | None | Medium |
| 6.2 | New stats (Dodge, Burn%, etc.) | Medium | 6.1 | Medium |
| 6.3 | Essence crafting recipes | Medium | None | Low |
| 6.4 | Module reforging | High | 6.3 | Medium |
| 6.5 | Support Drone system | High | None | High |
| 6.6 | Paragon/Prestige system | High | None | High |

**Estimated Time:** 3-4 weeks total

---

## Recommended Sprint Plan

### Sprint A: Unblock Audio (1-2 days)
```
Day 1: AudioManager + SFXPool
Day 2: Event hooks + test with cannon SFX
```
**Exit:** Cannon fires with sound

### Sprint B: Core Feedback (2-3 days)
```
Day 1: All weapon SFX + UI clicks
Day 2: Damage numbers animation + enemy death
Day 3: Crit visuals + hit impacts
```
**Exit:** Combat feels impactful

### Sprint C: Polish & Boss (3-4 days)
```
Day 1: Muzzle flash, missile smoke, skill activation
Day 2: Boss intro + death celebration
Day 3: Near Death VFX + Legendary glow
Day 4: Onboarding tooltips + constants
```
**Exit:** Vertical Slice complete

### Sprint D: Content (2 weeks)
```
Week 1: Zone 2 + Act 2 enemies
Week 2: Act 2 boss + zone selection + auto-sell
```
**Exit:** 45-60 minutes of content

### Sprint E: Quick Wins (parallel with D)
```
Zone multipliers, drop rates, milestone rewards
```
**Exit:** Better economy feel

### Sprint F: Architecture (when ready)
```
4-store refactor, auto-save, shaders
```
**Exit:** Cleaner codebase

---

## Dependency Graph

```
                    ┌─────────────────────────────────────────┐
                    │            MVP COMPLETE ✅               │
                    └─────────────────┬───────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│ 🟠 TIER 1: VFX   │     │ 🟡 TIER 2: Polish   │     │ 🔵 TIER 3:       │
│ - Damage nums ✅ │     │ - Boss intro        │     │ BALANCE          │
│ - Enemy death ✅ │     │ - Near Death VFX    │     │ (Can parallelize)│
│ - Crit visual ✅ │     │ - Legendary glow    │     │ - BALANCE config │
│ - Cannon recoil⏳│     │ - Onboarding        │     │ - Enemy scaling  │
│ - Missile smoke⏳│     │                     │     │ - Drop rates     │
│ - Hit sparks ✅  │     │                     │     │ - Milestones     │
└────────┬────────┘     └──────────┬──────────┘     └────────┬────────┘
         │                         │                          │
         └─────────────────────────┼──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │      VERTICAL SLICE COMPLETE            │
                    │  "Would put this in a Steam trailer"    │
                    └──────────────┬──────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ⏸️ TIER 4:       │     │ 🟢 TIER 5:       │     │ ⚪ TIER 6:       │
│ AUDIO (Paused)   │     │ Content          │     │ Architecture   │
│ - AudioManager   │     │ - Act 2          │     │ - 4-store      │
│ - SFXPool        │     │ - Zone select    │     │ - Auto-save    │
│ - All SFX        │     │ - Auto-sell      │     │ - Shaders      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │         STEAM RELEASE READY             │
                    └─────────────────────────────────────────┘
```

**Key Changes:**
- Audio moved to TIER 4 (paused, waiting for assets)
- Balance implementation (TIER 3) can run in parallel with VFX
- VFX tasks updated to show completion status
- Reference: `docs/BalanceGuide.md` for all scaling formulas

---

## Current Status

| Milestone | Status | Last Updated |
|-----------|--------|--------------|
| Prototype | ✅ Complete | Dec 2024 |
| MVP | ✅ Complete | Dec 2024 |
| Balance Guide | ✅ Complete | Jan 3, 2025 |
| Vertical Slice (VFX) | 🟡 In Progress | Jan 3, 2025 |
| Balance Implementation | ⏳ Ready | - |
| Content Expansion | ⏳ Pending | - |

**Current Phase:** Vertical Slice - VFX Polish
**Current Focus:** VFX completion, then Balance implementation
**Audio Status:** ⏸️ Paused (waiting for assets)

---

## MVP Gap Analysis

### What's Done (Backend) ✅

| System | Location | Notes |
|--------|----------|-------|
| Tank + Cannon | `src/entities/Tank.ts` | 2.5s fire rate, near death |
| 3 Modules | `src/modules/types/` | MachineGun, MissilePod, RepairDrone |
| Module Skills | `src/modules/BaseModule.ts` | 2 skills each, auto-mode with 10% penalty |
| Module Drops | `src/systems/LootSystem.ts` | 4 rarities, 11 stat types |
| Wave System | `src/systems/WaveSystem.ts` | 7 waves/zone, boss on zone 2 |
| Enemies | `src/entities/Enemy.ts` | 4 types + Super Elite + Boss |
| Combat | `src/systems/CombatSystem.ts` | Damage calc, crits, defense |
| XP/Leveling | `src/state/GameState.ts` | Exponential curve |
| Gold Economy | `src/state/GameState.ts` | Drops, upgrades, costs |
| Save/Load | `src/managers/SaveManager.ts` | localStorage, auto-save |
| Input | `src/managers/InputManager.ts` | Keys 1-10, Shift+key for auto |
| Tank Stats UI | `src/ui/TankStatsUI.ts` | TAB to open, upgrade stats |

### What's Missing (UI/UX) ⚠️

> **Architecture Change:** Using Sliding Panel System (Desktop Heroes style)
> **Reference:** See `docs/UISpec.md` for full specification

| System | Priority | Status |
|--------|----------|--------|
| Sidebar | P1 | ✅ Complete - 4 icon buttons |
| SlidingPanel base | P1 | ✅ Complete - Animation system |
| PanelManager | P1 | ✅ Complete - Single panel logic |
| TankStatsPanel | P1 | ✅ Complete - Stats + slot upgrades |
| InventoryPanel | P1 | ✅ Complete - Grid, select, equip/sell |
| ShopPanel | P1 | ✅ Complete - Purchase functionality |
| SettingsPanel | P1 | ✅ Complete - Interactive toggles + sliders |
| TopBar | P1 | ✅ Complete - Gold, XP bar, zone indicator |
| BottomBar refactor | P1 | ✅ Complete - HP bar, slots, wave progress, revive button |
| Near Death UI | P2 | ✅ Complete - Revive button in BottomBar |

---

## Phase 1: Complete the MVP (2 Weeks)

> **UI Philosophy:** Game NEVER pauses. Panels slide in from left, game continues running.

### Week 1: Panel Foundation + Core Panels

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1 | Sidebar + SlidingPanel base | ✅ | 4 icons, animation system implemented |
| 2 | PanelManager + keyboard shortcuts | ✅ | TAB, I, P, ESC bindings working |
| 3-4 | TankStatsPanel | ✅ | Stats upgrades + slot level upgrades (complete) |
| 5 | InventoryPanel | ✅ | Full implementation with equip/unequip/sell |

**Week 1 Deliverables:**
- [x] Sidebar with 4 clickable icons
- [x] SlidingPanel base class with open/close animations
- [x] PanelManager ensures only one panel open
- [x] Keyboard shortcuts: TAB, I, P, ESC
- [x] TankStatsPanel: View stats, upgrade with gold
- [x] TankStatsPanel: View slot levels, upgrade with gold
- [x] InventoryPanel: 6-column grid with modules
- [x] InventoryPanel: Click to select, see details
- [x] InventoryPanel: Equip/Unequip/Sell buttons
- [x] Game continues running while panels open

### Week 2: Remaining Panels + HUD

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1 | ShopPanel | ✅ | Full purchase functionality implemented |
| 2 | SettingsPanel | ✅ | Full implementation with working toggles + sliders |
| 3 | TopBar | ✅ | Gold, XP bar, zone indicator (no flee button per design) |
| 4 | BottomBar refactor | ✅ | HP bar, module slots with cooldowns, wave progress |
| 5 | Near Death overlay | ✅ | Revive button integrated into BottomBar |

**Week 2 Deliverables:**
- [x] ShopPanel: All 5 slots listed
- [x] ShopPanel: Purchase buttons with cost
- [x] ShopPanel: Locked slots show requirements
- [x] ShopPanel: Real-time updates on gold/slot changes
- [x] SettingsPanel: Display/audio toggles (placeholder)
- [x] SettingsPanel: Save Game button
- [x] SettingsPanel: Save & Quit button
- [x] TopBar: Gold amount display
- [x] TopBar: Level + XP progress bar
- [x] TopBar: Zone indicator
- [x] BottomBar: Full-width HP bar
- [x] BottomBar: Module slots with cooldowns
- [x] BottomBar: Wave progress indicator
- [x] Near Death: Revive button in BottomBar

### MVP Exit Criteria

All must be true before moving to Vertical Slice:

- [x] Sidebar visible with 4 working icons
- [x] All 4 panels open/close correctly with animations
- [x] Game continues running while panels are open
- [x] Player can upgrade tank stats via TankStatsPanel
- [x] Player can upgrade slot levels via TankStatsPanel
- [x] Player can view all modules in InventoryPanel
- [x] Player can equip/unequip/sell modules
- [x] Player can purchase slots 2-3 via ShopPanel
- [x] Player can change settings and save game
- [x] HUD shows gold, XP, HP, wave progress
- [x] Near Death shows revive button
- [x] ESC closes open panel (or opens Settings if none open)

---

## Phase 2: Vertical Slice Polish (1 Week)

**Goal:** Make Zone 1 (7 waves + Sentinel boss) feel release-quality.

### Polish Tasks

| Day | Focus | Tasks |
|-----|-------|-------|
| 1-2 | Audio | Cannon boom, MG rattle, missile whoosh, hit impacts, UI clicks |
| 3 | VFX | Muzzle flash, death explosions, damage number pop animation |
| 4 | Boss Polish | Sentinel intro sequence, phase transitions, death celebration |
| 5 | Onboarding | 3-4 tooltip hints for new players |

### Desktop Mode (Electron) ✅

| Feature | Description | Status |
|---------|-------------|--------|
| Desktop Heroes Layout | 350px tall strip, full screen width, docked to bottom | ✅ |
| Transparent Window | Always-transparent frameless Electron build | ✅ |
| Layer Toggles | 4 groups: Sky+Clouds, Mountains, Far Buildings, Forest+Town | ✅ |
| Always On Top | Keep window above other applications | ✅ |
| Click-Through | Pass clicks through transparent areas to desktop | ✅ |
| Compact UI | TopBar 28px, BottomBar 60px, Sidebar 40px | ✅ |

### Juice Checklist (No Screen Shake)

| Element | Implementation | Status |
|---------|----------------|--------|
| Parallax background | 7-layer scrolling with auto-drifting clouds | ✅ |
| Enemy death | Flash white → explosion → fade | ⏳ |
| Damage numbers | Pop + float up + scale down | ⏳ |
| Crit hits | Bigger font + "CRIT!" prefix | ⏳ |
| Cannon fire | Muzzle flash + recoil tween | ⏳ |
| Missile launch | Smoke puff + wobble | ⏳ |
| Hit impacts | Spark/flash at hit point | ⏳ |
| Skill activation | Flash on tank + sound | ⏳ |
| Boss spawn | Screen darken + intro animation | ⏳ |
| Legendary drop | Glow effect + special sound | ⏳ |
| Near Death state | Smoke particles + warning pulse | ⏳ |

### Vertical Slice Exit Criteria

- [ ] New player can complete Zone 1 without confusion
- [ ] Combat feels impactful (audio + visual feedback)
- [ ] Boss fight feels like an EVENT
- [ ] Zero crashes in 30-minute session
- [ ] 60 FPS with 30 enemies on screen
- [ ] Would put this in a Steam trailer

---

## Phase 3: Content Expansion (2 Weeks)

### Week 1: Act 1 Complete + Act 2 Start

| Task | Status |
|------|--------|
| Zone 2 polish (Super Elite focus) | ⏳ |
| Act 2 Zone 1 enemies (Demon, Bat, Ghost, Firebat) | ⏳ |
| Act 2 Zone 1 waves | ⏳ |
| Act 2 background art | ⏳ |

### Week 2: Act 2 Complete

| Task | Status |
|------|--------|
| Act 2 Zone 2 + Gargoyle boss | ⏳ |
| Zone selection UI | ⏳ |
| Act/Zone progression tracking | ⏳ |
| Auto-sell toggle for rarities | ⏳ |

### Content Expansion Exit Criteria

- [ ] Acts 1-2 fully playable (4 zones, 28 waves, 2 bosses)
- [ ] Can select which zone to play
- [ ] Auto-sell prevents inventory overflow
- [ ] 45-60 minutes of gameplay content

---

## Phase 4: Architecture Refactor (Desktop Heroes Patterns)

> **Reference:** `docs/DesktopHeroesAnalysis.md` and `docs/Meeting/` folder
> Based on analysis of Desktop Heroes, a similar idle auto-battler with proven patterns.

### Sprint 1: State Management Refactor

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Create `src/state/TankStore.ts` | P1 | ⏳ | [03-state-management.md](Meeting/03-state-management.md) |
| Create `src/state/InventoryStore.ts` | P1 | ⏳ | |
| Create `src/state/ProgressStore.ts` | P1 | ⏳ | |
| Create `src/state/SettingsStore.ts` | P1 | ⏳ | |
| Create `src/state/StateManager.ts` | P1 | ⏳ | |
| Migrate GameState → 4 stores | P1 | ⏳ | |

**Goal:** Split monolithic GameState into specialized stores for cleaner separation of concerns.

### Sprint 2: Auto-Save System

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Create `src/utils/debounce.ts` | P1 | ⏳ | [03-state-management.md](Meeting/03-state-management.md) |
| Create `src/state/SaveManager.ts` (new) | P1 | ⏳ | |
| Implement 5-second debounced auto-save | P1 | ⏳ | |
| Add save file versioning | P2 | ⏳ | |
| Add timestamp for offline progress | P2 | ⏳ | |
| Add migration system for version changes | P3 | ⏳ | |

**Goal:** Data safety without I/O thrashing, foundation for offline progress.

### Sprint 3: Audio Architecture

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Create `src/managers/AudioManager.ts` | P1 | ⏳ | [11-audio.md](Meeting/11-audio.md) |
| Create `src/audio/SFXPool.ts` | P1 | ⏳ | |
| Create `src/audio/MusicController.ts` | P2 | ⏳ | |
| Implement event-driven audio triggers | P1 | ⏳ | |
| Add pitch variation (0.9-1.1x) | P2 | ⏳ | |
| Add crossfade for music transitions | P3 | ⏳ | |

**Goal:** Decoupled, pooled audio system that prevents repetitive sound fatigue.

### Sprint 4: Visual Effects

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Create damage flash shader (GLSL) | P1 | ⏳ | [10-visual-effects.md](Meeting/10-visual-effects.md) |
| Create Near Death visual shader | P2 | ⏳ | |
| Implement coordinated effect timing | P1 | ⏳ | |
| Add DEPTH constants to GameConfig | P1 | ⏳ | [08-rendering.md](Meeting/08-rendering.md) |
| Add EFFECT_TIMING constants | P1 | ⏳ | |

**Goal:** GPU-accelerated effects with satisfying combat feedback timing.

---

## Phase 5: Game Design Improvements (Desktop Heroes Patterns)

> **Reference:** `docs/DesktopHeroesAnalysis.md` Part 1: Game Design Patterns

### Sprint 1: Economy Tuning

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Add zone gold multipliers (+40%/zone) | P1 | ⏳ | [06-economy.md](Meeting/06-economy.md) |
| Add drop rate bonus by enemy type | P1 | ⏳ | |
| Elite = 2× base drop rate | P1 | ⏳ | |
| Super Elite = guaranteed drop | P1 | ⏳ | |
| Boss = guaranteed + higher rarity | P1 | ⏳ | |

### Sprint 2: Progression Enhancements

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Add milestone rewards (every 5/10/25 levels) | P1 | ⏳ | [05-progression.md](Meeting/05-progression.md) |
| Every 5 levels: +1 inventory slot | P2 | ⏳ | |
| Every 25 levels: free random module | P2 | ⏳ | |
| Evaluate XP curve (1.15 → 1.12?) | P3 | ⏳ | |

### Sprint 3: New Module Stats

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Add Dodge % stat | P2 | ⏳ | [04-combat-system.md](Meeting/04-combat-system.md) |
| Add Burn Chance % stat | P2 | ⏳ | |
| Add Shock Chance % stat | P2 | ⏳ | |
| Add Essence Find % stat | P2 | ⏳ | |
| Add Shield Break % stat | P3 | ⏳ | |

**Goal:** Expand stat pool from 11 → 16 for more build variety.

### Sprint 4: Status Effect System

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Create StatusEffectManager | P2 | ⏳ | [04-combat-system.md](Meeting/04-combat-system.md) |
| Implement Burn DoT (Flamethrower) | P2 | ⏳ | |
| Implement Shock stun (Tesla Coil) | P2 | ⏳ | |
| Implement Slow (EMP Emitter) | P2 | ⏳ | |

### Sprint 5: Essence Crafting

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Add essence conversion recipes | P2 | ⏳ | [07-inventory.md](Meeting/07-inventory.md) |
| 5× Lesser Evil → 1× Prime Evil | P2 | ⏳ | |
| 3× Prime Evil → 1× Uber | P2 | ⏳ | |
| Module reforging (reroll stats) | P3 | ⏳ | |

### Sprint 6: Support Drone System (New)

| Task | Priority | Status | Reference |
|------|----------|--------|-----------|
| Design Support Drone progression | P3 | ⏳ | [05-progression.md](Meeting/05-progression.md) (Fairy) |
| Level 1: Auto-collect gold | P3 | ⏳ | |
| Level 2: +10% Gold Find | P3 | ⏳ | |
| Level 3: Auto-collect loot | P3 | ⏳ | |
| Level 4: +15% XP Bonus | P3 | ⏳ | |
| Level 5: Combat assist (small DPS) | P3 | ⏳ | |

**Goal:** Secondary progression layer similar to Desktop Heroes' Fairy companion.

---

## Future Phases (Post-Refactor)

### Phase 6: Remaining Content
- Acts 3-8
- 7 more modules
- 6 more bosses
- Uber boss variants

### Phase 7: Endgame Systems
- Paragon/Prestige system
- Boss summoning (Essences)
- Infernal Cores currency

### Phase 8: Steam Release
- Electron packaging
- Steam SDK integration
- Achievements
- Cloud saves
- Store page + marketing

---

## Architecture Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 2024 | No screen shake | Designer preference |
| Dec 2024 | Tank is stationary | Core design pillar |
| Dec 2024 | Near Death not Death | Core design pillar |
| Dec 2024 | Auto-mode has 10% penalty | Balance manual vs idle play |
| Dec 2024 | Sliding Panel UI (not scenes) | Desktop Heroes reference - game never pauses, idle-first |
| Dec 2024 | 4 panels: Tank, Inventory, Shop, Settings | Covers all player needs without clutter |
| Dec 2024 | Game runs during menu access | Core idle game philosophy |
| Dec 2024 | Per-slot stats (Damage/AtkSpd/CDR) | Each slot has 3 individual stats that only affect modules in that slot |
| Jan 2025 | Desktop Heroes as reference architecture | Friends' idle auto-battler has proven patterns for similar problems |
| Jan 2025 | 4-store state architecture | Split GameState → Tank/Inventory/Progress/Settings for cleaner concerns |
| Jan 2025 | Debounced auto-save (5s) | Data safety without I/O thrashing, Desktop Heroes pattern |
| Jan 2025 | Event-driven audio | Decouple audio from gameplay, enable pooling and pitch variation |
| Jan 2025 | GLSL shaders for VFX | GPU-accelerated damage flash, Near Death effects |
| Jan 2025 | Zone gold multipliers (+40%) | Desktop Heroes economy pattern, creates farming sweet spots |
| Jan 2025 | Milestone rewards at 5/10/25 levels | Dopamine hits at regular intervals, Desktop Heroes pattern |
| Jan 2025 | Support Drone = Hellcrawler's Fairy | Secondary progression layer, auto-collect + bonuses |
| Jan 2025 | BalanceGuide.md = Appendix B | Concrete numbers for enemy stats, scaling, economy targets |
| Jan 2025 | Desktop Heroes scaling patterns | HP 1.8^act, Damage 1.4^act, Gold 1.6^act exponential curves |

---

## Known Technical Debt

| Issue | Priority | Notes | Reference |
|-------|----------|-------|-----------|
| Monolithic GameState | P1 | Split into 4 stores (Phase 4) | [03-state-management.md](Meeting/03-state-management.md) |
| Zone-complete only saves | P1 | Add debounced auto-save (Phase 4) | [03-state-management.md](Meeting/03-state-management.md) |
| No AudioManager | P1 | Needed for Phase 2, event-driven | [11-audio.md](Meeting/11-audio.md) |
| Damage calc tests needed | P1 | Verify auto-mode penalty | |
| No DEPTH constants | P2 | Add to GameConfig for layer management | [08-rendering.md](Meeting/08-rendering.md) |
| No EFFECT_TIMING constants | P2 | Coordinated combat feedback timing | [10-visual-effects.md](Meeting/10-visual-effects.md) |
| No particle pooling | P3 | May need for VFX | |
| No status effect system | P2 | Burn/Shock/Slow for module synergies | [04-combat-system.md](Meeting/04-combat-system.md) |
| Limited stat pool (11) | P2 | Expand to 16 for build variety | [04-combat-system.md](Meeting/04-combat-system.md) |
| No zone scaling | P2 | Gold/XP multipliers per zone | [BalanceGuide.md](BalanceGuide.md) |
| No enemy base stats | P1 | Base HP/damage/speed per enemy type | [BalanceGuide.md](BalanceGuide.md) |
| No per-act scaling | P1 | Enemy stats scale exponentially per act | [BalanceGuide.md](BalanceGuide.md) |
| No milestone rewards | P2 | Every 5/10/25 levels | [05-progression.md](Meeting/05-progression.md) |
| No essence crafting | P3 | Conversion recipes for essence sink | [07-inventory.md](Meeting/07-inventory.md) |

---

## Changelog

### January 3, 2025 - Gore/Ragdoll Death System Planning
- **Designed comprehensive gore system** (tasks 2.5-2.7):
  - Fake ragdoll physics via tweens (no Matter.js needed)
  - Generic gib sprites (head, torso, limbs, chunks) tinted per-enemy
  - Blood particle burst + ground splatters
  - GoreManager singleton with object pools (150 gibs, 300 blood, 50 splatters)
- **Full implementation plan:** `~/.claude/plans/purring-shimmying-leaf.md`
- **Asset prompts included** for AI image generators (Midjourney/DALL-E)
- **Key technique:** Parabolic motion calculated in tween `onUpdate`, not real physics

### January 3, 2025 - Balance Guide Creation
- **Created `docs/BalanceGuide.md`:**
  - Complete balance formulas and base values (Appendix B from GDD)
  - Base enemy stats for Act 1: Imp (50 HP, 5 dmg), Hellhound (40 HP, 8 dmg), etc.
  - Per-act scaling multipliers: HP 1.8^(act-1), Damage 1.4^(act-1), Gold 1.6^(act-1)
  - Module base damage values: Machine Gun 50 DPS, Missile Pod 40 DPS, etc.
  - Gold economy targets: Slot 2 in 30min, Slot 3 in 2hrs, etc.
  - XP progression targets: Act-by-act level expectations
  - Ready-to-use `BALANCE` constants for GameConfig.ts
- **Updated `CLAUDE.md`:**
  - Added BalanceGuide.md to Key Documents
  - Added to "When to Check" table as first priority for scaling/balance
- **Updated `docs/MasterPlan.md`:**
  - Renamed TIER 3 to "BALANCE IMPLEMENTATION & QUICK WINS"
  - Added tasks 3.1-3.3 for implementing balance constants
  - Added balance-related items to Technical Debt (P1 priority)
  - References to BalanceGuide.md throughout

### January 3, 2025 - Desktop Heroes Analysis & Refactor Planning
- **Created `docs/DesktopHeroesAnalysis.md`:**
  - Complete analysis of Desktop Heroes architecture (idle auto-battler by friends)
  - Part 1: Game Design Patterns (economy, progression, combat, loot)
  - Part 2: Technical Architecture (state, save, UI, audio, VFX)
  - All sections reference `docs/Meeting/` folder for implementation details
- **Updated `CLAUDE.md`:**
  - Added Desktop Heroes Reference section
  - Feature-to-document lookup table
  - Workflow: "Check Meeting folder before implementing new features"
- **Updated `docs/MasterPlan.md`:**
  - Added Phase 4: Architecture Refactor (4 sprints)
    - Sprint 1: State Management (4-store pattern)
    - Sprint 2: Auto-Save System (debounced, versioned)
    - Sprint 3: Audio Architecture (event-driven, pooled)
    - Sprint 4: Visual Effects (shaders, timing)
  - Added Phase 5: Game Design Improvements (6 sprints)
    - Sprint 1: Economy Tuning (zone multipliers, drop rates)
    - Sprint 2: Progression (milestone rewards)
    - Sprint 3: New Stats (Dodge, Burn, Shock, Essence Find)
    - Sprint 4: Status Effects (Burn, Shock, Slow)
    - Sprint 5: Essence Crafting
    - Sprint 6: Support Drone (Fairy equivalent)
  - Updated Architecture Decisions Log with 8 new decisions
  - Expanded Technical Debt with 9 new items linked to Meeting docs

### January 3, 2025 - TIER 1 VFX Progress (6/8)
Tier 1 VFX tasks status:
- 1.1 ✅ Damage numbers pop animation
- 1.2 ✅ Enemy death flash + fade
- 1.3 ✅ Crit hit visual
- 1.4 ⏳ Cannon muzzle flash + recoil (reverted - needs rework)
- 1.5 ⏳ Missile smoke puff + wobble (reverted - needs rework)
- 1.6 ✅ Hit spark/flash at impact point
- 1.7 ✅ DEPTH constants
- 1.8 ✅ EFFECT_TIMING constants

**Note:** Tasks 1.4 and 1.5 were implemented but reverted due to issues. Will revisit later.

### January 3, 2025 - VFX: Hit Spark/Flash at Impact
- **Impact Effect (single-target):**
  - Core flash that scales and fades (80ms)
  - 4-6 spark particles radiating outward
  - Crit hits: yellow color, more sparks
  - Normal hits: white color
- **AoE Effect (missiles/explosives):**
  - White core flash
  - Orange fire ring expanding
  - Shockwave ring outline
  - 5-8 fire/debris particles rising and spreading
  - Crit hits spawn more particles
- Files: `src/entities/Projectile.ts`

### January 3, 2025 - VFX: Missile Smoke Puff + Wobble
- **Smoke Puff Effect:**
  - Layered smoke particles (main dark gray + 3 secondary lighter puffs)
  - Particles expand, drift backward (exhaust direction), and fade over 350-500ms
  - Uses DEPTH.EFFECTS layer
  - Added to both normal missile firing and barrage skill
- **Missile Wobble:**
  - Sinusoidal rotation wobble during flight (±0.2 radians at 8Hz)
  - Creates classic "unstable missile" visual
  - Added `wobble` property to ProjectileConfig interface
  - Wobble state tracked per-projectile
- Files: `src/modules/MissilePodModule.ts`, `src/entities/Projectile.ts`

### January 3, 2025 - VFX: Cannon Muzzle Flash + Recoil
- **Cannon Muzzle Flash:**
  - Created layered ellipse effect: orange outer glow → yellow middle → white core
  - Flash scales from 0.3 → 1.2 while fading out over 100ms
  - Positioned at cannon barrel (x+70, y-65 from tank position)
  - Uses DEPTH.EFFECTS layer for proper rendering order
- **Enhanced Recoil Animation:**
  - Tank body kicks back 8px with `Back.easeOut` for punchy feel
  - Duration increased to 60ms with yoyo
- Files: `src/entities/Tank.ts`

### January 3, 2025 - VFX: Enemy Death Flash + Fade
- **Enemy Death Effect Enhancement:**
  - Phase 1: Instant white tint flash (0xffffff)
  - Phase 2: Quick scale pop (1.2x) during flash with yoyo bounce
  - Phase 3: Fade out with alpha 0 and scale reduction (0.5x)
  - Uses `EFFECT_TIMING.DEATH_FLASH_DURATION` (150ms) and `DEATH_FADE_DURATION` (300ms)
  - Health bar hidden immediately on death
  - Enemy animation and movement stopped during death sequence
  - Proper state reset before returning to pool
  - Files: `src/entities/Enemy.ts`

### January 3, 2025 - VFX: Damage Numbers Pop Animation
- **Damage Numbers Enhancement:**
  - Added pop-in animation: scale 0 → 1.2 → 1.0 with `Back.easeOut` bounce
  - Random horizontal offset (±20px) prevents stacking when multiple hits occur
  - Float up 60px with fade out over 800ms
  - Slight horizontal drift for visual interest
- **Crit Hit Visual:**
  - "CRIT!" text displayed above damage number
  - Yellow color (#ffff00) with larger font (32px)
  - Scale peaks at 1.5x before settling at 1.2x
- **GameConfig Constants:**
  - Added `DEPTH` object with 12 layer constants (BACKGROUND=0 → DEBUG=1000)
  - Added `EFFECT_TIMING` object with animation timing constants
  - Files: `src/config/GameConfig.ts`, `src/systems/CombatSystem.ts`

### January 3, 2025 - Debug Panel Fix & Electron Settings Persistence
- **Debug Spawn Counter Fix:**
  - Bug: Spawning multiple enemies via Debug Panel appeared to spawn only 1
  - Root cause: All debug-spawned enemies had identical X position, stacking on top of each other
  - Fix: Added random 0-200px X offset in `WaveSystem.debugSpawnEnemy()` so enemies spread out
  - Debug log now shows spawn position: `Debug spawned: imp at x=2075`
- **Always-On-Top Setting Persistence:**
  - Bug: "Always On Top" toggle didn't persist across Electron restarts
  - Root cause: Saved setting wasn't applied when Electron window initialized
  - Fix: `ClickThroughManager.applyElectronSettings()` now applies saved `alwaysOnTop` setting on startup
  - Setting properly persists in localStorage and is applied via IPC on window creation

### January 2, 2025 - Panel System Fixes & ClickThroughManager Cleanup
- **Panel Scrolling Fix:**
  - Root cause: Panels never called `setContentHeight()`, so `maxScrollY` stayed at 0
  - Fixed InventoryPanel: Added `setContentHeight(544)` for equipped + grid + details
  - Fixed ShopPanel: Added `setContentHeight(370)` for header + slot cards + pagination
  - Fixed SettingsPanel: Added dynamic `setContentHeight(816-921)` based on Electron mode
  - All panels now scroll correctly via mouse wheel and touch drag
- **ClickThroughManager Memory Leak Fix:**
  - Canvas event listeners (`mouseleave`, `mouseenter`) were not cleaned up
  - Added `mouseLeaveHandler` and `mouseEnterHandler` properties to store references
  - Updated `destroy()` to properly remove all DOM event listeners
  - Added `MIN_INTERACTIVE_DEPTH` constant to replace magic number `10`

### January 2025 - Desktop Mode (Electron)
- **Desktop Heroes Layout Implementation:**
  - Changed game resolution from 1920x1080 to 1920x350 (bottom-docked strip)
  - Electron window uses full screen width, positioned at bottom of work area
  - Compact UI: TopBar 28px, BottomBar 60px, Sidebar 40px, Ground 60px
- **Transparent Window Support:**
  - Always-transparent frameless Electron window
  - Click-through behavior for transparent areas via `setIgnoreMouseEvents`
  - `ClickThroughManager` dynamically toggles click-through based on cursor position
- **Background Layer Toggles:**
  - 4 layer groups: Sky+Clouds, Mountains, Far Buildings, Forest+Town
  - Settings panel toggles for each group
  - `ParallaxBackground` listens to `SETTINGS_CHANGED` events
- **Settings Manager Additions:**
  - `alwaysOnTop`, `clickThroughEnabled` settings
  - Layer visibility settings: `showSkyLayer`, `showMountainsLayer`, `showFarBuildingsLayer`, `showForegroundLayer`
  - Electron IPC helpers: `applyAlwaysOnTop()`, `applyClickThrough()`
- **Panel Width Increase:**
  - Increased `UI_CONFIG.PANEL.WIDTH` from 350px to 525px (50% wider)
  - Better layout for inventory grids and shop cards

### December 27, 2024 - Parallax Background System
- **Parallax Background Implementation:**
  - Created `src/ui/ParallaxBackground.ts` - Multi-layer scrolling background system
  - Integrated 7 layers: sky, clouds, mountains, mountains-lights, far-buildings, forest, town
  - Implemented auto-scrolling clouds with slow drift effect
  - Each layer scrolls at different speeds creating depth perception
  - Replaced placeholder graphics with actual pixel art assets from Gothicvania pack
  - TileSprite-based for seamless horizontal scrolling
  - Updated GameScene to use ParallaxBackground instead of gradient graphics

### December 27, 2024 - Visual Assets & Performance Fixes
- **Visual Asset Integration:**
  - Created asset mapping documentation (`docs/AssetMapping.md`)
  - Created asset copy script (`scripts/copy-assets.sh`)
  - Updated BootScene to load actual sprite assets (tank, enemies, projectiles, backgrounds)
  - Integrated enemy sprites: imp, hellhound, possessed soldier, fire skull, boss sentinel
  - Integrated projectile sprites: bullet, cannon shell, missile
  - Set up enemy animations (imp-run, hellhound-run, soldier-walk)
- **Module Slot Firing Positions:**
  - Added `MODULE_SLOT_POSITIONS` to `GameConfig.ts` - 5 configurable slot positions
  - Updated `BaseModule.ts` with `getFirePosition()` method for slot-based positioning
  - All modules now use slot-based firing positions (any module can go in any slot)
- **Enemy Hitbox Fix:**
  - Changed hitbox to 2x sprite height from ground level
  - Fixed offset calculation to use scaled displayWidth/displayHeight
  - Ensures projectiles reliably hit enemies regardless of sprite size
- **FPS Optimization (30fps → 57fps):**
  - Split health bar into `updateHealthBarPosition()` (cheap, every frame) and `redrawHealthBar()` (only on damage)
  - Removed spammy console.log from projectile-enemy overlap callback
  - Fixed `flashWhite()` to use lightweight `restoreTint()` instead of expensive `applyVisualsByCategory()`
  - Added `restoreTint()` method to properly restore elite enemy tints
- **Targeting Fix:**
  - All weapons now correctly target closest enemy
  - Added debug logging to trace targeting (MachineGun, Cannon)
  - Verified 10/10 shots aimed correctly in automated testing

### December 2024
- Initial plan created
- Prototype phase completed
- MVP gap analysis performed
- Phase 1-3 roadmap defined
- **UI Architecture overhaul:** Adopted Desktop Heroes sliding panel system
- Created `docs/UISpec.md` with full panel specifications
- Updated GDD, PRD, MasterPlan to reflect new UI approach
- Removed scene-based menu approach in favor of overlay panels
- **Day 1 Implementation Complete:**
  - Created `src/config/UIConfig.ts` - UI constants and panel types
  - Created `src/ui/panels/SlidingPanel.ts` - Base class with animations
  - Created `src/managers/PanelManager.ts` - Singleton panel state manager
  - Created `src/ui/Sidebar.ts` - Left sidebar with 4 icon buttons
  - Created `src/ui/panels/TankStatsPanel.ts` - Full stat upgrade panel
  - Created `src/ui/panels/InventoryPanel.ts` - Placeholder
  - Created `src/ui/panels/ShopPanel.ts` - Placeholder with slot display
  - Created `src/ui/panels/SettingsPanel.ts` - Placeholder with save buttons
  - Updated `src/managers/InputManager.ts` - Added TAB, I, P, ESC shortcuts
  - Updated `src/types/GameEvents.ts` - Added panel events
  - Integrated panel system into GameScene
  - All panels slide in from left with 300ms animation
  - Keyboard shortcuts working: TAB, I, P, ESC
- **InventoryPanel Full Implementation:**
  - Equipped modules section (5 slots) with rarity-colored icons
  - Inventory grid (6x4) displaying unequipped modules
  - Module selection with details panel (type, rarity, stats, sell value)
  - Working Equip/Unequip/Sell buttons with state management
  - Event-driven refresh on module changes
  - Fixed sell value mismatch bug (tooltip vs actual gold)
  - Created `MODULE_SELL_VALUES` as single source of truth
- **Test Coverage Added:**
  - 53 unit tests for module inventory system
  - 22 e2e tests for inventory panel UI
  - Total: 89 unit tests, 39 e2e tests passing
- **ShopPanel Full Implementation:**
  - Purchase buttons with hover/click effects for slots 2-5
  - Real-time updates on gold changes and slot unlocks
  - Boss requirement checking for slots 4-5
  - Gold display in panel header with K/M formatting
  - Event-driven rebuild via SLOT_UNLOCKED and GOLD_CHANGED events
  - Added SLOT_UNLOCKED event emission to GameState.unlockSlot()
- **Test Coverage Updated:**
  - 36 unit tests for shop panel logic
  - 10 e2e tests for shop panel UI
  - Total: 125 unit tests, 50 e2e tests passing
- **Bug Fixes:**
  - Fixed enemy-tank damage overlap not triggering (hitbox wasn't covering enemy stop position)
  - Fixed module equip flow - modules equipped from InventoryPanel now create active instances
  - Fixed healing systems (HP regen, RepairDrone) not updating health bars
  - Fixed HP display showing long decimal numbers
- **TopBar Implementation:**
  - Created `src/ui/TopBar.ts` - horizontal bar at top of screen
  - Shows gold amount with animated changes
  - Shows level with XP progress bar
  - Shows current Act/Zone indicator
  - Refactored GameUI to remove duplicate elements (now only HP bar, wave info)
  - No flee button (removed from design per user request)
- **BottomBar Implementation:**
  - Created `src/ui/BottomBar.ts` - 120px bar at bottom of screen
  - Full-width HP bar with color changes based on health percentage
  - 5 module slots showing equipped modules with rarity-colored borders
  - Skill cooldown indicators with radial progress
  - Auto-mode indicators for each skill
  - Wave progress indicator with enemy count
  - Near Death revive button with pulsing animation
  - Consolidated functionality from GameUI and ModuleSlotUI
  - GameUI refactored to minimal shell for future floating UI
- **TankStatsPanel Slot Level Upgrades (Original):**
  - Added `upgradeSlotLevel()`, `getSlotUpgradeCost()`, `canUpgradeSlot()` to GameState
  - Rewrote MODULE SLOTS section in TankStatsPanel with full functionality
  - Each slot shows: colored icon, level badge, damage multiplier (1 + level * 0.01)
  - Level preview (current > next) with cost display
  - Working upgrade buttons with gold cost (level * 100)
  - Level capped by tank level, shows MAX when at cap
  - Locked slots display LOCKED text, can be unlocked via ShopPanel
  - Event-driven refresh on SLOT_UPGRADED, SLOT_UNLOCKED, GOLD_CHANGED, LEVEL_UP
- **TankStatsPanel Major Redesign (Per-Slot Stats):**
  - Complete architectural change from single slot level to 3-stat-per-slot system
  - TankStatsPanel now has 6 tabs: Tank, Slot 1, Slot 2, Slot 3, Slot 4, Slot 5
  - Tank tab: Vitality, Barrier, Regeneration, Suppression (as before)
  - Slot tabs: Each has 3 upgradeable stats:
    - Damage (+1% per level to module damage)
    - Attack Speed (+1% per level to module fire rate)
    - Cooldown Reduction (+1% per level to skill cooldowns, capped at 90%)
  - Added `SlotStatType` enum and `SlotStats` interface to ModuleTypes
  - Added `SLOT_STAT_UPGRADED` event to GameEvents
  - Updated GameState with per-stat methods: `upgradeSlotStat()`, `getSlotStatLevel()`, etc.
  - Updated ModuleSlot to track damageLevel, attackSpeedLevel, cdrLevel
  - Updated all module types (BaseModule, MachineGun, MissilePod, RepairDrone) to use SlotStats
  - Cost formula: (level + 1) × 50 gold
  - Level cap: Each stat capped by tank level
  - Locked slots show lock icon in tab and "Unlock in Shop" message
  - BottomBar and ModuleSlotUI show total stat levels (sum of all 3)
- **Per-Slot Stats Bug Fixes:**
  - Fixed save data migration: Old save format (`level` per slot) now migrates to new format (`stats: {damageLevel, attackSpeedLevel, cdrLevel}`)
  - Fixed upgrade button colors: Buttons now show correct color at creation time (green if affordable, brownish if not)
  - Fixed slot stats not applying to modules: Added `SLOT_STAT_UPGRADED` event listener to ModuleManager
  - Added `setStats()` method to ModuleSlot for syncing with GameState after upgrades
  - ModuleManager now properly syncs slot stats from GameState → ModuleSlot → active BaseModule
- **SettingsPanel Full Implementation:**
  - Created `src/managers/SettingsManager.ts` - Singleton with localStorage persistence
  - Settings interface: display (health bars, damage numbers, enemy HP), gameplay (auto-collect, confirm sells, tooltips), audio (master, music, SFX volumes)
  - Interactive toggle checkboxes that visually update on click
  - Draggable volume sliders with track fill visualization
  - Settings persist independently from game save data
  - Added `SETTINGS_CHANGED` event to GameEvents
  - CombatSystem respects `showDamageNumbers` setting
  - Enemy health bars respect `showHealthBars` setting
  - Controls reference and Save/Save & Quit buttons
- **MVP COMPLETE:** All exit criteria met, ready for Vertical Slice polish phase

---

**Remember: Update this document after every significant milestone!**
