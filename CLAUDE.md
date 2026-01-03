# CLAUDE.md - Hellcrawler Project Guidelines

> This file provides context and guidelines for Claude Code when working on the Hellcrawler project.

---

## 🎮 PROJECT OVERVIEW

**Hellcrawler** is a 16-bit pixel art idle RPG auto-battler where players command a military tank against waves of demonic invaders. Built with Phaser 3, TypeScript, and Electron for Steam release.

### Key Documents
- `docs/MasterPlan.md` - **THE SOURCE OF TRUTH** for current progress and next steps
- `docs/GDD.md` - Game Design Document (gameplay, systems, content)
- `docs/PRD.md` - Product Requirements Document (technical specs, architecture)
- `docs/QUICKREF.md` - Implementation cheatsheet
- `docs/BalanceGuide.md` - **BALANCE NUMBERS** (enemy stats, scaling formulas, economy)
- `docs/DesktopHeroesAnalysis.md` - Reference patterns from Desktop Heroes
- `docs/Meeting/` - **REFERENCE IMPLEMENTATIONS** from Desktop Heroes (see below)

**Always consult these documents before implementing new features.**

---

## 📚 DESKTOP HEROES REFERENCE (docs/Meeting/)

**Before implementing ANY new feature, check the `docs/Meeting/` folder for reference patterns.**

Desktop Heroes is a similar idle auto-battler built by friends. Their meeting notes contain battle-tested solutions for common problems. Use these as implementation references.

### When to Check Meeting Docs

| Feature Type | Reference Document |
|--------------|-------------------|
| **Scaling/Balance** | [BalanceGuide.md](docs/BalanceGuide.md) - **CHECK FIRST for enemy stats, formulas** |
| Combat/Damage | [04-combat-system.md](docs/Meeting/04-combat-system.md) |
| XP/Leveling | [05-progression.md](docs/Meeting/05-progression.md) |
| Gold/Economy | [06-economy.md](docs/Meeting/06-economy.md) |
| Inventory/Items | [07-inventory.md](docs/Meeting/07-inventory.md) |
| Save/Load | [03-state-management.md](docs/Meeting/03-state-management.md) |
| UI Components | [09-ui-system.md](docs/Meeting/09-ui-system.md) |
| VFX/Shaders | [10-visual-effects.md](docs/Meeting/10-visual-effects.md) |
| Audio | [11-audio.md](docs/Meeting/11-audio.md) |
| Electron/Steam | [12-platform.md](docs/Meeting/12-platform.md) |
| Asset Pipeline | [13-assets.md](docs/Meeting/13-assets.md) |

### Quick Reference Files
- `docs/Meeting/AI-SUMMARY.md` - Fast overview of all systems
- `docs/Meeting/AI-QUICK-REF.json` - Data structures and patterns

### How to Use
1. **Before coding:** Check if Desktop Heroes solved similar problem
2. **Study the pattern:** Understand WHY they made those choices
3. **Adapt, don't copy:** Modify patterns to fit Hellcrawler's needs
4. **Document differences:** Note any deviations in MasterPlan.md

> **Note:** We learn from their architecture, not copy their code.

---

## 🚨 MASTER PLAN - CRITICAL

**The `docs/MasterPlan.md` file MUST be kept updated at all times.**

### ⚠️ MANDATORY: Update After EVERY Task Completion

**IMMEDIATELY after finishing any task, you MUST:**
1. Mark the task as complete (⏳ → ✅) in the Priority Tiers table
2. Add a changelog entry with what was done
3. Note any files modified

**DO NOT move on to the next task until MasterPlan.md is updated!**

### When to Update MasterPlan.md
- ✅ **IMMEDIATELY after completing ANY task** (non-negotiable!)
- ✅ After completing a day's work
- ✅ After finishing a phase or sprint
- ✅ When discovering new blockers or requirements
- ✅ When making architecture decisions
- ✅ When adding technical debt

### What to Update
- Mark tasks as complete (⏳ → ✅)
- Update "Current Phase" and "Current Focus"
- Add notes to completed items
- Log any new decisions in "Architecture Decisions Log"
- Add discovered issues to "Known Technical Debt"
- Update the Changelog

### How to Update
```markdown
# Change task status
| 1-2 | Main Menu + Pause Scene | ⏳ |  →  | 1-2 | Main Menu + Pause Scene | ✅ |

# Update current status
**Current Phase:** MVP - Phase 1, Week 1
**Current Focus:** Main Menu Scene

# Add to changelog
### December 2024
- Completed Main Menu and Pause scenes
```

**NEVER leave MasterPlan.md stale. The plan is only useful if it reflects reality.**

---

## 🛠️ TECH STACK

```
Runtime:     Phaser 3.80+
Language:    TypeScript 5.x (strict mode)
Bundler:     Vite
Desktop:     Electron
Platform:    Steam (Windows, macOS)
Testing:     Vitest (unit), Playwright (e2e)
```

---

## 📁 PROJECT STRUCTURE

```
hellcrawler/
├── electron/           # Electron main process
├── src/
│   ├── main.ts         # Game entry point
│   ├── config/         # Game configuration constants
│   ├── scenes/         # Phaser scenes
│   ├── entities/       # Game objects (Tank, Enemy, Projectile)
│   ├── modules/        # Module system (slots, items, types)
│   ├── systems/        # Core systems (Combat, Wave, Loot, XP)
│   ├── managers/       # Singletons (Pool, Audio, Input, Event)
│   ├── ui/             # UI components and screens
│   ├── utils/          # Helper functions
│   └── types/          # TypeScript type definitions
├── public/assets/      # Game assets (sprites, audio, etc.)
├── tests/              # Test files
└── docs/               # Documentation (GDD, PRD)
```

---

## ⚠️ CRITICAL REQUIREMENTS

### 1. OBJECT POOLING IS MANDATORY

**Never use `new` for frequently spawned objects during gameplay.**

```typescript
// ❌ WRONG - Creates garbage, causes frame drops
const enemy = new Enemy(scene, x, y, type);

// ✅ CORRECT - Use pool manager
const enemy = this.poolManager.getEnemy(type);
enemy.activate(x, y);
```

**Must pool:**
- All enemy types (50 per type)
- All projectiles (200 total)
- Damage numbers (100)
- Loot drops (30)
- Particle effects

### 2. NEAR DEATH, NOT DEATH

The tank **cannot die**. When HP reaches 0:

```typescript
// ❌ WRONG
if (this.hp <= 0) {
  this.die(); // NO!
}

// ✅ CORRECT
if (this.hp <= 0 && !this.isNearDeath) {
  this.enterNearDeath();
}
```

Near Death state:
- `isNearDeath = true`
- `attackSpeedMultiplier = 0.5`
- Cannot take fatal damage
- Revives after 60s OR manual button click

### 3. MODULE SYSTEM = SOCKETS + GEMS

**ModuleSlot** = Permanent progression (levels 1-160)
**ModuleItem** = Droppable equipment (rarities, stats)

```typescript
// Slots are containers
class ModuleSlot {
  level: number;        // Upgradeable with gold
  equipped: ModuleItem; // Swappable
}

// Items are droppable loot
class ModuleItem {
  type: ModuleType;     // MachineGun, Tesla, etc.
  rarity: Rarity;       // Uncommon through Legendary
  stats: ModuleStat[];  // Random rolled stats
}
```

**Same module type CAN be equipped multiple times** (e.g., 5 Machine Guns is valid).

### Module Slot Firing Positions

Each module slot has a fixed firing position on the tank. Configure in `src/config/GameConfig.ts`:

```typescript
MODULE_SLOT_POSITIONS: [
  { x: 60, y: -70 },   // Slot 0: Top front turret
  { x: 45, y: -45 },   // Slot 1: Upper mid turret
  { x: 30, y: -25 },   // Slot 2: Lower mid turret
  { x: 50, y: -60 },   // Slot 3: Top rear turret
  { x: 35, y: -35 },   // Slot 4: Lower rear turret
]
```

Modules use `getFirePosition()` from `BaseModule` to get their slot's firing coordinates.

### 4. STATIONARY TANK

The tank does NOT move. "Movement Speed" stat affects enemy approach speed.

```typescript
// ❌ WRONG
tank.x += tank.speed * delta;

// ✅ CORRECT - Tank stays still, enemies move
enemy.x -= enemy.speed * (1 - tank.movementSpeedReduction) * delta;
```

---

## 📐 CODING CONVENTIONS

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if truly needed)
- Prefer interfaces over types for objects
- Use enums for fixed sets of values

```typescript
// ✅ Good
interface EnemyConfig {
  type: EnemyType;
  hp: number;
  damage: number;
}

enum EnemyType {
  Imp = 'imp',
  Hellhound = 'hellhound',
}

// ❌ Bad
type EnemyConfig = any;
```

### Naming Conventions
```typescript
// Classes: PascalCase
class ModuleSlot {}

// Interfaces: PascalCase with 'I' prefix optional
interface ModuleSlotData {}

// Functions/Methods: camelCase
function calculateDamage() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_TANK_LEVEL = 160;

// Files: PascalCase for classes, camelCase for utils
// Tank.ts, ModuleSlot.ts, mathUtils.ts
```

### File Organization
- One class per file (generally)
- Group related types in a single types file
- Keep files under 300 lines when possible
- Extract complex logic into separate functions/files

---

## 🎯 KEY FORMULAS

Always use these exact formulas from the GDD:

### XP Required for Level
```typescript
const xpRequired = Math.floor(100 * Math.pow(1.15, level));
```

### Damage Calculation
```typescript
const finalDamage = baseDamage
  * (1 + slotLevel * 0.01)                    // Slot multiplier
  * (1 + this.getSumOfStatBonuses())          // Module stats
  * (isCrit ? 2.0 + critDamageBonus : 1.0)    // Crit multiplier
  * Phaser.Math.FloatBetween(0.9, 1.1);       // Variance
```

### Defense Reduction
```typescript
const reduction = defense / (defense + 100);
const damageTaken = incomingDamage * (1 - reduction);
```

### Upgrade Cost
```typescript
const cost = currentLevel * 100; // For both stats and slots
```

---

## 🏗️ ARCHITECTURE PATTERNS

### Scene Communication
Use the EventManager for cross-scene communication:

```typescript
// Emit event
EventManager.emit(GameEvents.ENEMY_DIED, { enemy, position, xp, gold });

// Listen for event
EventManager.on(GameEvents.ENEMY_DIED, this.onEnemyDied, this);
```

### State Management
Keep game state in a central GameState object:

```typescript
// Access via GameScene
const gold = this.gameState.economy.gold;

// Modify through methods
this.gameState.addGold(amount);
this.gameState.spendGold(cost);
```

### Entity Pattern
All game entities should extend a base class:

```typescript
class Enemy extends Phaser.GameObjects.Sprite {
  // Pool management
  activate(x: number, y: number, config: EnemyConfig): void;
  deactivate(): void;
  
  // Core methods
  takeDamage(amount: number): void;
  die(): void;
  update(time: number, delta: number): void;
}
```

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests (Vitest)
Required for:
- All damage calculations
- XP/leveling formulas
- Module stat rolling
- Economy transactions

```typescript
describe('CombatSystem', () => {
  it('should calculate damage correctly', () => {
    const result = calculateDamage(100, 1.0, false);
    expect(result).toBeGreaterThanOrEqual(90);
    expect(result).toBeLessThanOrEqual(110);
  });
});
```

### No Tests Required For
- Simple getters/setters
- Phaser lifecycle methods
- UI layout code

---

## 🚫 COMMON PITFALLS TO AVOID

### 1. Memory Leaks
```typescript
// ❌ WRONG - Event listener never removed
this.scene.events.on('update', this.onUpdate, this);

// ✅ CORRECT - Clean up in destroy
destroy() {
  this.scene.events.off('update', this.onUpdate, this);
  super.destroy();
}
```

### 2. Frame-Rate Dependent Logic
```typescript
// ❌ WRONG - Speed varies with frame rate
this.x += 5;

// ✅ CORRECT - Use delta time
this.x += this.speed * (delta / 1000);
```

### 3. Hardcoded Values
```typescript
// ❌ WRONG
if (this.hp <= 0) {
  this.attackSpeed *= 0.5;
}

// ✅ CORRECT - Use constants
if (this.hp <= 0) {
  this.attackSpeed *= NEAR_DEATH_ATTACK_SPEED_MULTIPLIER;
}
```

### 4. Sync Issues with Pools
```typescript
// ❌ WRONG - Object state persists
const enemy = pool.get();
// enemy still has old HP, position, etc.

// ✅ CORRECT - Always reset on activate
const enemy = pool.get();
enemy.reset(); // Or pass config to activate()
enemy.activate(x, y, config);
```

---

## 📊 PERFORMANCE TARGETS

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| FPS | 60 | Profile, reduce particles |
| Enemies | 30 max | Hard cap in WaveSystem |
| Projectiles | 100 max | Hard cap in PoolManager |
| Draw calls | 50 max | Use texture atlases |
| Memory | 300MB max | Check for leaks |

### Performance Monitoring
```typescript
// Add to GameScene update
if (this.game.loop.actualFps < 55) {
  console.warn('FPS drop:', this.game.loop.actualFps);
}
```

---

## 🔧 DEVELOPMENT COMMANDS

```bash
# Development
npm run dev          # Web dev server with HMR
npm run dev:electron # Electron with dev tools

# Building
npm run build        # Production web build
npm run build:win    # Windows executable
npm run build:mac    # macOS executable

# Testing
npm run test         # Run unit tests
npm run test:watch   # Watch mode
npm run test:e2e     # Playwright tests

# Code Quality
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

---

## 🎮 PHASER SKILL USAGE

**Always use the `/phaser` skill when implementing Phaser-related features.**

The Phaser skill provides battle-tested patterns and best practices for:
- Scene management and transitions
- Physics and collision detection
- Sprite animations and tweens
- Input handling
- Object pooling patterns
- Performance optimization

```
# Invoke in Claude Code
/phaser
```

Use it when:
- Creating new scenes
- Implementing game mechanics
- Working with physics bodies
- Optimizing rendering
- Debugging Phaser-specific issues

---

## 🖥️ DEV SERVER MANAGEMENT

**IMPORTANT: Only run ONE dev server at a time.**

Before starting a new dev server, always kill any existing ones:

```bash
# Check for running dev servers
lsof -ti:5173,5174,5175,3000,3001,3002 | xargs kill -9 2>/dev/null

# Or kill by process name
pkill -f "vite" 2>/dev/null

# Then start fresh
npm run dev
```

Common ports used:
- `5173-5175`: Vite dev server
- `3000-3002`: Alternative ports when others are busy

**Why this matters:**
- Multiple servers waste memory
- Port conflicts cause confusing errors
- HMR can get confused with multiple instances
- Playwright tests may connect to wrong server

---

## 🎭 PLAYWRIGHT E2E TESTING

### Setup
```bash
# Install Playwright browsers (first time only)
npx playwright install chromium
```

### Running Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run with headed browser (visible)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/gameplay.spec.ts

# Debug mode (step through)
npx playwright test --debug
```

### Writing Tests
```typescript
// tests/e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test('game loads and displays tank', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for Phaser to initialize
  await page.waitForFunction(() => {
    return (window as any).game?.isRunning;
  });

  // Check canvas exists
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});
```

### Test Patterns for Phaser Games
```typescript
// Wait for specific game state
await page.waitForFunction(() => {
  const scene = (window as any).game?.scene?.getScene('GameScene');
  return scene?.tank !== undefined;
});

// Simulate keyboard input
await page.keyboard.press('1'); // Activate skill 1

// Check game state via exposed globals
const gold = await page.evaluate(() => {
  return (window as any).gameState?.economy?.gold;
});
expect(gold).toBeGreaterThan(0);
```

### Best Practices
- Always wait for Phaser initialization before assertions
- Expose necessary game state to `window` for testing
- Use `page.waitForFunction` for game state checks
- Keep tests focused on user-visible behavior
- Don't test internal implementation details

---

## 📝 COMMIT CONVENTIONS

```
feat: Add missile pod module with homing projectiles
fix: Correct damage calculation for crit multiplier
perf: Implement object pooling for damage numbers
refactor: Extract combat logic to CombatSystem
docs: Update module skill descriptions
test: Add unit tests for XP formula
```

---

## 🎨 ASSET GUIDELINES

### Sprites
- Use texture atlases for related sprites
- Naming: `{category}-{name}-{frame}.png`
- Example: `enemy-imp-walk-0.png`

### Loading
```typescript
// In BootScene
this.load.atlas('enemies-act1', 'sprites/enemies/act1.png', 'sprites/enemies/act1.json');

// Usage
this.add.sprite(x, y, 'enemies-act1', 'enemy-imp-walk-0');
```

---

## 🆘 WHEN STUCK

1. **Check the GDD** for design intent
2. **Check the PRD** for technical specs
3. **Check the Quick Reference** for formulas
4. **Look at similar systems** in the codebase
5. **Ask for clarification** if requirements are ambiguous

---

## 📋 MVP CHECKLIST

### Core Systems (Backend) ✅
- [x] Tank with built-in cannon (2.5s fire rate)
- [x] 3 modules: Machine Gun, Missile Pod, Repair Drone
- [x] Each module has 2 skills + auto-mode
- [x] Module drops with 4 rarities
- [x] 11 possible stat rolls
- [x] Act 1: 2 zones, 7 waves each
- [x] 4 enemy types (Imp, Hellhound, Possessed Soldier, Fire Skull)
- [x] Boss: Corrupted Sentinel
- [x] XP system (exponential curve)
- [x] Gold economy
- [x] Near Death system
- [x] Save/Load on zone complete
- [x] Object pooling for all spawned entities
- [x] Input system for skills (1-10 keys)

### UI/UX Systems (Missing/Partial) ⚠️
- [ ] Main Menu scene (New Game, Continue, Settings, Quit)
- [ ] Pause Menu scene (Resume, Modules, Upgrades, Shop)
- [ ] Module Inventory screen (browse, equip, sell)
- [ ] Module Slot upgrade UI (upgrade slot levels with gold)
- [ ] Shop screen (purchase new slots)
- [ ] Loot drop visuals (drops on field, pickup interaction)
- [ ] Zone completion summary screen
- [ ] Settings screen (volume, keybinds)
- [ ] Near Death revive button UI

### Polish (Post-MVP)
- [ ] Audio (SFX + music)
- [ ] VFX (muzzle flash, explosions, impacts)
- [ ] 60 FPS verification with 30 enemies
- [ ] E2E tests for critical flows

---

## ✅ POST-TASK CHECKLIST

**After completing ANY task, run through this checklist:**

```
□ 1. Code compiles (npm run typecheck)
□ 2. Feature works (tested in browser/Electron)
□ 3. MasterPlan.md updated:
    □ Task marked complete (⏳ → ✅)
    □ Changelog entry added
    □ Files modified noted
□ 4. Ready for next task
```

**Example changelog entry:**
```markdown
### January 3, 2025 - VFX: Damage Numbers Pop Animation
- **What was done:**
  - Added pop-in animation with bounce effect
  - Crit visuals with "CRIT!" text
- **Files modified:**
  - `src/config/GameConfig.ts` - Added DEPTH and EFFECT_TIMING constants
  - `src/systems/CombatSystem.ts` - Enhanced spawnDamageNumber()
```

---

## 🔗 USEFUL REFERENCES

- [Phaser 3 API Docs](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Electron Docs](https://www.electronjs.org/docs)

---

**Remember: When in doubt, check the GDD first. It is the source of truth for all gameplay decisions.**