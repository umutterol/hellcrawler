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

| System | Priority | Status |
|--------|----------|--------|
| Sidebar | P1 | ✅ Complete - 4 icon buttons |
| SlidingPanel base | P1 | ✅ Complete - Animation system |
| PanelManager | P1 | ✅ Complete - Single panel logic |
| TankStatsPanel | P1 | ✅ Complete - Stats + slot upgrades |
| InventoryPanel | P1 | ✅ Complete - Grid, select, equip/sell |
| ShopPanel | P1 | ✅ Complete - Purchase functionality |
| SettingsPanel | P1 | 🔄 Placeholder - Needs toggle logic |
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
| 3-4 | TankStatsPanel | ✅ | Stats upgrades + slot level upgrades (basic) |
| 5 | InventoryPanel | ✅ | Full implementation with equip/unequip/sell |

**Week 1 Deliverables:**
- [x] Sidebar with 4 clickable icons
- [x] SlidingPanel base class with open/close animations
- [x] PanelManager ensures only one panel open
- [x] Keyboard shortcuts: TAB, I, P, ESC
- [x] TankStatsPanel: View stats, upgrade with gold
- [ ] TankStatsPanel: View slot levels, upgrade with gold (partial)
- [x] InventoryPanel: 6-column grid with modules
- [x] InventoryPanel: Click to select, see details
- [x] InventoryPanel: Equip/Unequip/Sell buttons
- [x] Game continues running while panels open

### Week 2: Remaining Panels + HUD

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1 | ShopPanel | ✅ | Full purchase functionality implemented |
| 2 | SettingsPanel | 🔄 | Placeholder complete, needs toggle logic |
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
- [ ] Player can upgrade slot levels via TankStatsPanel
- [x] Player can view all modules in InventoryPanel
- [x] Player can equip/unequip/sell modules
- [x] Player can purchase slots 2-3 via ShopPanel
- [ ] Player can change settings and save game
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

---

**Remember: Update this document after every significant milestone!**
