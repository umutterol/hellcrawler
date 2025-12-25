# CLAUDE.md - Hellcrawler Project Guidelines

> This file provides context and guidelines for Claude Code when working on the Hellcrawler project.

---

## 🎮 PROJECT OVERVIEW

**Hellcrawler** is a 16-bit pixel art idle RPG auto-battler where players command a military tank against waves of demonic invaders. Built with Phaser 3, TypeScript, and Electron for Steam release.

### Key Documents
- `docs/GDD.md` - Game Design Document (gameplay, systems, content)
- `docs/PRD.md` - Product Requirements Document (technical specs, architecture)
- `docs/QUICKREF.md` - Implementation cheatsheet

**Always consult these documents before implementing new features.**

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

Phase 1 must include:
- [ ] Tank with built-in cannon (2.5s fire rate)
- [ ] 3 modules: Machine Gun, Missile Pod, Repair Drone
- [ ] Each module has 2 skills
- [ ] Module drops with 4 rarities
- [ ] 11 possible stat rolls
- [ ] Act 1: 2 zones, 7 waves each
- [ ] 4 enemy types (Imp, Hellhound, Possessed Soldier, Fire Skull)
- [ ] Boss: Corrupted Sentinel
- [ ] XP system (exponential curve)
- [ ] Gold economy
- [ ] Near Death system
- [ ] Save/Load on zone complete
- [ ] Basic UI (HP, Gold, Module slots)
- [ ] Object pooling for all spawned entities
- [ ] 60 FPS on minimum spec

---

## 🔗 USEFUL REFERENCES

- [Phaser 3 API Docs](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Electron Docs](https://www.electronjs.org/docs)

---

**Remember: When in doubt, check the GDD first. It is the source of truth for all gameplay decisions.**