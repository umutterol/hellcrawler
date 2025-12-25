# HELLCRAWLER - Master Plan
## Last Updated: December 2024

> **THIS DOCUMENT MUST BE KEPT UP TO DATE.** Update after completing any phase, sprint, or major feature.

---

## Current Status

| Milestone | Status | Last Updated |
|-----------|--------|--------------|
| Prototype | ✅ Complete | Dec 2024 |
| MVP | 🔄 In Progress | Dec 2024 |
| Vertical Slice | ⏳ Pending | - |
| Content Expansion | ⏳ Pending | - |

**Current Phase:** MVP - Phase 1, Week 1
**Current Focus:** Core UI Systems

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

| System | Priority | Blocks |
|--------|----------|--------|
| Main Menu Scene | P1 | Game flow |
| Pause Menu Scene | P1 | Game flow |
| Module Inventory Screen | P1 | Equip/swap/sell |
| Module Slot Upgrade UI | P1 | Slot progression |
| Shop Screen | P1 | Unlock slots 2-3 |
| Loot Drop Visuals | P1 | Feedback loop |
| Zone Completion Screen | P1 | Progression feel |
| Near Death Revive Button | P2 | Manual revive |
| Settings Screen | P2 | Player options |

---

## Phase 1: Complete the MVP (2 Weeks)

### Week 1: Core UI Systems

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1-2 | Main Menu + Pause Scene | ⏳ | MainMenuScene, PauseScene, ESC binding |
| 3-4 | Module Inventory Screen | ⏳ | Browse, equip, unequip, sell |
| 5 | Module Slot Upgrade UI | ⏳ | Add to TankStatsUI or new panel |

**Week 1 Deliverables:**
- [ ] MainMenuScene with New Game, Continue, Settings, Quit
- [ ] PauseScene with Resume, Modules, Upgrades, Shop, Main Menu
- [ ] ESC key pauses game
- [ ] Full module inventory browser
- [ ] Equip/unequip modules by clicking
- [ ] Sell modules for gold
- [ ] Slot level upgrade buttons

### Week 2: Progression UI

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1-2 | Shop Screen | ⏳ | Purchase slots 2-3, show requirements |
| 3 | Loot Drop Visuals | ⏳ | Sprites on field, click to collect |
| 4 | Zone Completion Screen | ⏳ | Summary of XP, gold, drops |
| 5 | Near Death Revive Button | ⏳ | HUD button when tank damaged |

**Week 2 Deliverables:**
- [ ] ShopScene with slot purchase UI
- [ ] Slot unlock conditions displayed
- [ ] Loot drops appear as sprites on battlefield
- [ ] Click drops to collect (or auto-collect)
- [ ] Zone complete triggers summary modal
- [ ] Summary shows: XP gained, Gold earned, Modules dropped
- [ ] Revive button appears in Near Death state

### MVP Exit Criteria

All must be true before moving to Vertical Slice:

- [ ] Player can navigate: Menu → Game → Pause → Menu
- [ ] Player can open inventory and see all modules
- [ ] Player can equip/unequip/swap modules between slots
- [ ] Player can sell unwanted modules
- [ ] Player can upgrade tank stats (existing)
- [ ] Player can upgrade module slot levels
- [ ] Player can purchase slots 2 and 3
- [ ] Loot drops are visible and collectible
- [ ] Zone completion shows summary
- [ ] Game saves on zone complete
- [ ] Game loads correctly on Continue

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

### Juice Checklist (No Screen Shake)

| Element | Implementation | Status |
|---------|----------------|--------|
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

## Future Phases (Post-MVP)

### Phase 4: Remaining Content
- Acts 3-8
- 7 more modules
- 6 more bosses
- Uber boss variants

### Phase 5: Endgame Systems
- Paragon/Prestige system
- Boss summoning (Essences)
- Infernal Cores currency

### Phase 6: Steam Release
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

---

## Known Technical Debt

| Issue | Priority | Notes |
|-------|----------|-------|
| Damage calc tests needed | P1 | Verify auto-mode penalty |
| E2E tests missing | P2 | Playwright setup done |
| No AudioManager | P2 | Needed for Phase 2 |
| No particle pooling | P3 | May need for VFX |

---

## Changelog

### December 2024
- Initial plan created
- Prototype phase completed
- MVP gap analysis performed
- Phase 1-3 roadmap defined

---

**Remember: Update this document after every significant milestone!**
