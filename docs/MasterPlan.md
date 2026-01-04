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
| VFX Polish | 🟡 In Progress | None | P0 |
| **Center Tank Redesign** | ⏳ Planned | VFX Complete | P1 |
| **Center Tank UI Refactor** | ⏳ Planned | Part of P1 | P1 |
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

**Exit Criteria:** Combat feels impactful, ready for architectural work.

---

### 🟠 TIER 1: CENTER TANK REDESIGN (High Priority)

**Major architectural change.** Tank moves to screen center with bidirectional combat.

#### Phase 1A: Core Mechanics

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 1.1 | Move tank position to screen center | Low | ⏳ |
| 1.2 | Add left-side enemy spawn system | Medium | ⏳ |
| 1.3 | Update MODULE_SLOT_POSITIONS config | Low | ⏳ |
| 1.4 | Add `targetDirection` property to slots | Medium | ⏳ |
| 1.5 | Update module targeting logic (left/right/both) | Medium | ⏳ |
| 1.6 | Adjust wave spawning for 50/50 split | Low | ⏳ |
| 1.7 | Remove built-in cannon | Low | ⏳ |
| 1.8 | Update slot costs: [0, 0, 10K, 20K, 75K] | Low | ⏳ |
| 1.9 | Add Act 6 requirement for Slot 5 | Low | ⏳ |
| 1.10 | Test bidirectional combat balance | Medium | ⏳ |

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
                    │     - Damage numbers ✅                  │
                    │     - Enemy death ✅                     │
                    │     - Hit sparks ✅                      │
                    │     - Muzzle flash ⏳                    │
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

## Current Status

| Milestone | Status | Last Updated |
|-----------|--------|--------------|
| Prototype | ✅ Complete | Dec 2024 |
| MVP | ✅ Complete | Dec 2024 |
| Balance Guide | ✅ Complete | Jan 3, 2025 |
| VFX Polish | 🟡 In Progress | Jan 4, 2025 |
| Center Tank | ⏳ Next | - |

**Current Phase:** VFX Polish completion
**Next Phase:** Center Tank Redesign
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

## Changelog

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
