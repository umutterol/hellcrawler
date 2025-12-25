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

---

## Remaining MVP Tasks

### Priority 1: Tank Stats UI
- [ ] Create `src/ui/TankStatsUI.ts` - Upgrade panel for 4 stats
- [ ] Add `upgradeTankStat()` to GameState (gold-based, not skill points)
- [ ] Stats: Max HP (+10), Defense (+0.5%), HP Regen (+0.5/s), Movement Speed (+1%)
- [ ] Cost formula: `level * 100` gold
- [ ] Cap: All stats capped by tank level

### Priority 2: Testing
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
