# Hellcrawler Development Handover

## Current State (December 2024)

### Project Overview
Hellcrawler is a 16-bit pixel art idle RPG auto-battler built with Phaser 3, TypeScript, and Vite. Players command a stationary military tank against waves of demonic invaders.

---

## Completed Features

### Core Systems
- **Tank Entity** (`src/entities/Tank.ts`) - Stationary player unit with HP bar, built-in cannon
- **Enemy System** (`src/entities/Enemy.ts`) - 4 enemy types + Super Elite + Boss (Corrupted Sentinel)
- **Projectile System** (`src/entities/Projectile.ts`) - Object-pooled projectiles with different types
- **Combat System** (`src/systems/CombatSystem.ts`) - Collision detection, damage calculation, AOE
- **Wave System** (`src/systems/WaveSystem.ts`) - 7 waves per zone, boss on wave 7 zone 2
- **Loot System** (`src/systems/LootSystem.ts`) - Module drops with rarity system

### Module System
- **ModuleManager** (`src/modules/ModuleManager.ts`) - Manages 5 module slots
- **ModuleSlot** (`src/modules/ModuleSlot.ts`) - Container for modules, upgradeable
- **ModuleItem** (`src/modules/ModuleItem.ts`) - Droppable equipment with random stats
- **BaseModule** (`src/modules/BaseModule.ts`) - Abstract base for active modules
- **3 Module Types Implemented:**
  - MachineGunModule - Rapid fire, skills: Overdrive, Suppressing Fire
  - MissilePodModule - Homing missiles, skills: Barrage, Homing Swarm
  - RepairDroneModule - Passive healing, skills: Emergency Repair, Regeneration Field

### Input System (NEW)
- **InputManager** (`src/managers/InputManager.ts`) - Keyboard input for skills
  - Keys 1-10: Activate skills (1,2 = slot 0, 3,4 = slot 1, etc.)
  - Shift+Key: Toggle auto-mode for skills
  - TAB: Reserved for stats panel (not yet implemented)

### State Management
- **GameState** (`src/state/GameState.ts`) - Central game state singleton
- **SaveManager** (`src/managers/SaveManager.ts`) - localStorage save/load, auto-save on zone complete
- **EventManager** (`src/managers/EventManager.ts`) - Event bus for cross-system communication

### UI
- **GameUI** (`src/ui/GameUI.ts`) - HUD with HP bar, gold, XP, wave info
- **ModuleSlotUI** (`src/ui/ModuleSlotUI.ts`) - Module slot display with cooldown indicators

---

## Recently Completed

### December 27, 2024 Session

#### Visual Asset Integration
- Created `docs/AssetMapping.md` documenting all asset sources
- Created `scripts/copy-assets.sh` for automated asset copying
- Updated `BootScene.ts` to load actual sprite assets (tank, enemies, projectiles, backgrounds)
- Set up enemy animations: `imp-run`, `hellhound-run`, `soldier-walk`

#### Module Slot Firing Positions
**Location:** `src/config/GameConfig.ts`, `src/modules/BaseModule.ts`

Each module slot now has a configurable firing position relative to tank:
```typescript
MODULE_SLOT_POSITIONS: [
  { x: 60, y: -70 },   // Slot 0
  { x: 45, y: -45 },   // Slot 1
  { x: 30, y: -25 },   // Slot 2
  { x: 50, y: -60 },   // Slot 3
  { x: 35, y: -35 },   // Slot 4
]
```

Modules use `getFirePosition()` from BaseModule to get their firing position.

#### FPS Optimization (30fps → 57fps)
**Files Modified:** `src/entities/Enemy.ts`, `src/systems/CombatSystem.ts`

Fixes applied:
1. **Health Bar Optimization:** Split into `updateHealthBarPosition()` (cheap, every frame) and `redrawHealthBar()` (only on damage)
2. **Removed Spammy Logging:** Removed console.log from projectile-enemy overlap callback
3. **flashWhite() Fix:** Now uses lightweight `restoreTint()` instead of expensive `applyVisualsByCategory()`
4. **restoreTint() Method:** Properly restores elite enemy tints (orange/purple) after damage flash

#### Enemy Hitbox Fix
**Location:** `src/entities/Enemy.ts` (activate method)

Fixed hitbox offset calculation to use scaled dimensions:
- `displayWidth`/`displayHeight` (scaled) instead of `width`/`height` (texture)
- Hitbox is 2x sprite height from ground level
- Ensures projectiles reliably hit enemies regardless of sprite scale

#### Weapon Targeting Fix
**Files:** `src/modules/MachineGunModule.ts`, `src/systems/CombatSystem.ts`

All weapons now correctly target the closest enemy:
- MachineGun: Targets closest enemy, small spread for effect
- Tank Cannon: Targets closest enemy via `findClosestEnemy()`
- Verified 10/10 shots aimed correctly in automated testing

---

### Auto-Mode System (FIXED)
**Location:** `src/modules/BaseModule.ts`

Auto-mode now works correctly:
- Toggle with Shift+Key (1-10)
- Skills auto-trigger when cooldown expires and enemies are present
- 10% damage penalty applied to auto-triggered skills
- Visual "A" indicator shows auto-mode state (green=ON, gray=OFF)

### Visual Indicator for Auto-Mode (IMPLEMENTED)
**Location:** `src/ui/ModuleSlotUI.ts`

Shows "A" indicator below each skill cooldown circle:
- Green (#00ff00) when auto-mode is enabled
- Gray (#444444) when disabled

### Tank Stats Upgrade UI (IMPLEMENTED)
**Location:** `src/ui/TankStatsUI.ts`

Full upgrade panel for 4 tank stats:
- **Max HP**: +10 HP per level
- **Defense**: +0.5% per level
- **HP Regen**: +0.5/s per level
- **Enemy Slow**: +1% per level (affects enemy approach speed)

Features:
- Toggle with TAB key
- Cost: `(level + 1) * 100` gold
- Stats capped by tank level
- Visual feedback for upgrade success/failure
- Button states: upgradeable (green), need gold (orange), at cap (gray)

---

## Remaining MVP Tasks

### Priority 1: Testing
- [ ] Unit tests for damage calculation with auto-mode penalty
- [ ] Unit tests for stat upgrade formulas
- [ ] E2E tests for skill activation flow

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/scenes/GameScene.ts` | Main game loop, system orchestration |
| `src/modules/BaseModule.ts` | Skill system, auto-mode logic |
| `src/modules/ModuleManager.ts` | Module slot management |
| `src/managers/InputManager.ts` | Keyboard input handling |
| `src/ui/ModuleSlotUI.ts` | Module slot UI display |
| `src/ui/GameUI.ts` | Main HUD |
| `src/state/GameState.ts` | Central game state |
| `src/types/GameEvents.ts` | Event definitions |
| `src/config/GameConfig.ts` | Game constants |

---

## Architecture Notes

### Object Pooling
All frequently spawned objects use pools:
- Enemies: `GameScene.enemies` group
- Projectiles: `GameScene.projectiles` group
- Get from pool: `group.getFirstDead(false)`
- Return to pool: `object.deactivate()`

### Event System
Use `EventManager` for cross-system communication:
```typescript
// Emit
eventManager.emit(GameEvents.ENEMY_DIED, payload);

// Listen
eventManager.on(GameEvents.ENEMY_DIED, this.onEnemyDied, this);

// Cleanup in destroy()
eventManager.off(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
```

### Damage Formula (GDD)
```typescript
FinalDamage = BaseDamage
  × (1 + SlotLevel × 0.01)
  × (1 + StatBonuses)
  × CritMultiplier
  × AutoModePenalty (0.9 if auto-mode)
  × Variance (0.9 to 1.1)
```

---

## Commands

```bash
npm run dev          # Start dev server (usually port 3002)
npm run build        # Production build
npx tsc --noEmit     # Type check
npm run test         # Run tests
```

---

## Contact / Resources

- **GDD:** `docs/GDD.md` - Game design details
- **PRD:** `docs/PRD.md` - Technical requirements
- **QUICKREF:** `docs/QUICKREF.md` - Formula cheatsheet
- **CLAUDE.md:** Project guidelines for AI assistance
