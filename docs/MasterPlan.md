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

> **Architecture Change:** Using Sliding Panel System (Desktop Heroes style)
> **Reference:** See `docs/UISpec.md` for full specification

| System | Priority | Implementation |
|--------|----------|----------------|
| Sidebar | P1 | 4 icon buttons for panel access |
| SlidingPanel base | P1 | Animation, state, collapse button |
| PanelManager | P1 | Single panel open at a time |
| TankStatsPanel | P1 | Stats + slot upgrades (replaces TAB menu) |
| InventoryPanel | P1 | Module inventory, equip/sell |
| ShopPanel | P1 | Purchase module slots |
| SettingsPanel | P1 | Options + Save & Quit |
| TopBar | P1 | Gold, XP, zone info |
| BottomBar refactor | P1 | HP bar, slots, wave progress |
| Near Death UI | P2 | Revive button overlay |

---

## Phase 1: Complete the MVP (2 Weeks)

> **UI Philosophy:** Game NEVER pauses. Panels slide in from left, game continues running.

### Week 1: Panel Foundation + Core Panels

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1 | Sidebar + SlidingPanel base | ⏳ | 4 icons, animation system |
| 2 | PanelManager + keyboard shortcuts | ⏳ | TAB, I, P, ESC bindings |
| 3-4 | TankStatsPanel | ⏳ | Stats upgrades + slot level upgrades |
| 5 | InventoryPanel | ⏳ | Grid, equip/unequip/sell |

**Week 1 Deliverables:**
- [ ] Sidebar with 4 clickable icons
- [ ] SlidingPanel base class with open/close animations
- [ ] PanelManager ensures only one panel open
- [ ] Keyboard shortcuts: TAB, I, P, ESC
- [ ] TankStatsPanel: View stats, upgrade with gold
- [ ] TankStatsPanel: View slot levels, upgrade with gold
- [ ] InventoryPanel: 6-column grid with modules
- [ ] InventoryPanel: Click to select, see details
- [ ] InventoryPanel: Equip/Unequip/Sell buttons
- [ ] Game continues running while panels open

### Week 2: Remaining Panels + HUD

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1 | ShopPanel | ⏳ | Purchase slots 2-3, show requirements |
| 2 | SettingsPanel | ⏳ | Options toggles + Save & Quit |
| 3 | TopBar | ⏳ | Gold, XP bar, zone, flee button |
| 4 | BottomBar refactor | ⏳ | HP bar, slots, wave progress |
| 5 | Near Death overlay | ⏳ | Revive button, timer display |

**Week 2 Deliverables:**
- [ ] ShopPanel: All 5 slots listed
- [ ] ShopPanel: Purchase buttons with cost
- [ ] ShopPanel: Locked slots show requirements
- [ ] SettingsPanel: Display/audio toggles
- [ ] SettingsPanel: Save Game button
- [ ] SettingsPanel: Save & Quit button
- [ ] TopBar: Gold amount + income rate
- [ ] TopBar: Level + XP progress bar
- [ ] TopBar: Zone indicator + Flee button
- [ ] BottomBar: Full-width HP bar
- [ ] BottomBar: Module slots with cooldowns
- [ ] BottomBar: Wave progress indicator
- [ ] Near Death: Overlay with revive button + timer

### MVP Exit Criteria

All must be true before moving to Vertical Slice:

- [ ] Sidebar visible with 4 working icons
- [ ] All 4 panels open/close correctly with animations
- [ ] Game continues running while panels are open
- [ ] Player can upgrade tank stats via TankStatsPanel
- [ ] Player can upgrade slot levels via TankStatsPanel
- [ ] Player can view all modules in InventoryPanel
- [ ] Player can equip/unequip/sell modules
- [ ] Player can purchase slots 2-3 via ShopPanel
- [ ] Player can change settings and save game
- [ ] HUD shows gold, XP, HP, wave progress
- [ ] Near Death shows revive button
- [ ] ESC closes open panel (or opens Settings if none open)

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
| Dec 2024 | Sliding Panel UI (not scenes) | Desktop Heroes reference - game never pauses, idle-first |
| Dec 2024 | 4 panels: Tank, Inventory, Shop, Settings | Covers all player needs without clutter |
| Dec 2024 | Game runs during menu access | Core idle game philosophy |

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
- **UI Architecture overhaul:** Adopted Desktop Heroes sliding panel system
- Created `docs/UISpec.md` with full panel specifications
- Updated GDD, PRD, MasterPlan to reflect new UI approach
- Removed scene-based menu approach in favor of overlay panels

---

**Remember: Update this document after every significant milestone!**
