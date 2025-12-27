# HELLCRAWLER - Product Requirements Document (PRD)
## Version 1.0 | December 2024

---

# TABLE OF CONTENTS

1. [Product Overview](#1-product-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Development Phases](#3-development-phases)
4. [Feature Specifications](#4-feature-specifications)
5. [System Requirements](#5-system-requirements)
6. [Asset Pipeline](#6-asset-pipeline)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment & Distribution](#8-deployment--distribution)
9. [Tools & MCP Integration](#9-tools--mcp-integration)
10. [Risk Assessment](#10-risk-assessment)

---

# 1. PRODUCT OVERVIEW

## 1.1 Product Summary

| Attribute | Value |
|-----------|-------|
| Product Name | Hellcrawler |
| Version | 1.0.0 |
| Platform | Windows, macOS (Steam) |
| Engine | Phaser 3.80+ |
| Language | TypeScript |
| Packaging | Electron |
| Price | $3.99 - $4.99 |

## 1.2 Success Criteria

### MVP Success (Phase 1)
- [ ] Playable Act 1 with 2 zones, 14 waves
- [ ] 3 working modules (Machine Gun, Missile Pod, Repair Drone)
- [ ] Basic UI (HP bar, gold, module slots)
- [ ] Tank with built-in cannon
- [ ] Enemy spawning and combat
- [ ] Module drops and equipping
- [ ] Save/Load functionality

### Full Release Success
- [ ] All 8 Acts complete
- [ ] All 10 modules implemented
- [ ] Paragon system functional
- [ ] Boss summoning system
- [ ] Steam integration (achievements, cloud save)
- [ ] 60 FPS on minimum spec hardware

## 1.3 Stakeholders

| Role | Responsibility |
|------|----------------|
| Developer (Claude Code) | Implementation |
| Designer (Umut) | Design decisions, asset provision |
| QA | Testing via Playwright MCP |

---

# 2. TECHNICAL ARCHITECTURE

## 2.1 Technology Stack

```
┌─────────────────────────────────────────┐
│              ELECTRON                    │
│  ┌─────────────────────────────────┐    │
│  │           PHASER 3               │    │
│  │  ┌─────────────────────────┐    │    │
│  │  │      TYPESCRIPT          │    │    │
│  │  │  ┌─────────────────┐    │    │    │
│  │  │  │   GAME LOGIC    │    │    │    │
│  │  │  └─────────────────┘    │    │    │
│  │  └─────────────────────────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           STEAM SDK                      │
│  - Achievements                          │
│  - Cloud Save                            │
│  - Overlay                               │
└─────────────────────────────────────────┘
```

## 2.2 Project Structure

```
hellcrawler/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # Preload scripts
│   └── steam.ts                # Steam SDK integration
├── src/
│   ├── main.ts                 # Game entry point
│   ├── config/
│   │   ├── GameConfig.ts       # Phaser configuration
│   │   ├── Constants.ts        # Game constants
│   │   ├── ModuleData.ts       # Module definitions
│   │   ├── EnemyData.ts        # Enemy definitions
│   │   ├── BossData.ts         # Boss definitions
│   │   └── ActData.ts          # Act/Zone definitions
│   ├── scenes/
│   │   ├── BootScene.ts        # Asset loading
│   │   ├── MainMenuScene.ts    # Main menu (launch only)
│   │   └── GameScene.ts        # Main gameplay (contains all UI)
│   ├── entities/
│   │   ├── Tank.ts             # Player tank
│   │   ├── BuiltInCannon.ts    # Tank's main cannon
│   │   ├── Enemy.ts            # Base enemy class
│   │   ├── EnemyTypes/         # Enemy subclasses
│   │   │   ├── FodderEnemy.ts
│   │   │   ├── EliteEnemy.ts
│   │   │   ├── SuperElite.ts
│   │   │   └── Boss.ts
│   │   ├── Projectile.ts       # Base projectile
│   │   └── DamageNumber.ts     # Floating damage text
│   ├── modules/
│   │   ├── Module.ts           # Base module class
│   │   ├── ModuleSlot.ts       # Slot container
│   │   ├── ModuleItem.ts       # Droppable module item
│   │   ├── types/
│   │   │   ├── MachineGun.ts
│   │   │   ├── MissilePod.ts
│   │   │   ├── RepairDrone.ts
│   │   │   ├── ShieldGenerator.ts
│   │   │   ├── LaserCutter.ts
│   │   │   ├── TeslaCoil.ts
│   │   │   ├── Flamethrower.ts
│   │   │   ├── EMPEmitter.ts
│   │   │   ├── Mortar.ts
│   │   │   └── MainCannon.ts
│   │   └── skills/
│   │       └── ModuleSkills.ts # Skill definitions
│   ├── systems/
│   │   ├── CombatSystem.ts     # Damage calculations
│   │   ├── WaveSystem.ts       # Wave spawning
│   │   ├── LootSystem.ts       # Drop generation
│   │   ├── XPSystem.ts         # Experience/leveling
│   │   ├── EconomySystem.ts    # Gold management
│   │   ├── EssenceSystem.ts    # Boss summoning
│   │   ├── ParagonSystem.ts    # Prestige mechanics
│   │   └── SaveSystem.ts       # Save/Load
│   ├── managers/
│   │   ├── PoolManager.ts      # Object pooling
│   │   ├── AudioManager.ts     # Sound/Music
│   │   ├── InputManager.ts     # Controls
│   │   └── EventManager.ts     # Event bus
│   ├── ui/
│   │   ├── hud/
│   │   │   ├── TopBar.ts           # Gold, XP, zone info
│   │   │   ├── BottomBar.ts        # HP bar, module slots
│   │   │   ├── Sidebar.ts          # Panel toggle buttons
│   │   │   ├── ModuleSlotUI.ts     # Individual slot display
│   │   │   └── DamageNumber.ts     # Floating damage text
│   │   ├── panels/
│   │   │   ├── SlidingPanel.ts     # Base panel class
│   │   │   ├── PanelManager.ts     # Panel state management
│   │   │   ├── TankStatsPanel.ts   # Stats + slot upgrades
│   │   │   ├── InventoryPanel.ts   # Module inventory
│   │   │   ├── ShopPanel.ts        # Slot purchases
│   │   │   └── SettingsPanel.ts    # Options + save/quit
│   │   └── components/
│   │       ├── Button.ts           # Reusable button
│   │       ├── ProgressBar.ts      # HP/XP bars
│   │       ├── Toggle.ts           # Checkbox toggle
│   │       ├── Slider.ts           # Volume sliders
│   │       └── ItemGrid.ts         # Inventory grid
│   ├── utils/
│   │   ├── MathUtils.ts        # Math helpers
│   │   ├── FormatUtils.ts      # Number formatting (235K)
│   │   ├── RandomUtils.ts      # RNG helpers
│   │   └── PoolUtils.ts        # Pool helpers
│   └── types/
│       ├── GameTypes.ts        # Type definitions
│       ├── ModuleTypes.ts
│       ├── EnemyTypes.ts
│       └── SaveTypes.ts
├── public/
│   └── assets/
│       ├── sprites/
│       │   ├── tank/
│       │   ├── modules/
│       │   ├── enemies/
│       │   ├── bosses/
│       │   ├── projectiles/
│       │   └── effects/
│       ├── backgrounds/
│       ├── ui/
│       └── audio/
│           ├── sfx/
│           └── music/
└── tests/
    ├── unit/
    └── e2e/
```

## 2.3 Core Classes

### Tank.ts
```typescript
interface TankStats {
  maxHP: number;
  currentHP: number;
  defense: number;
  hpRegen: number;
  moveSpeed: number;
}

interface TankProgression {
  level: number;
  xp: number;
  xpToNext: number;
  statLevels: {
    maxHP: number;
    defense: number;
    hpRegen: number;
    moveSpeed: number;
  };
}

class Tank extends Phaser.GameObjects.Container {
  stats: TankStats;
  progression: TankProgression;
  moduleSlots: ModuleSlot[];
  builtInCannon: BuiltInCannon;
  isNearDeath: boolean;
  nearDeathTimer: number;
  
  takeDamage(amount: number): void;
  heal(amount: number): void;
  enterNearDeath(): void;
  revive(): void;
  gainXP(amount: number): void;
  upgradeStat(stat: string): boolean;
}
```

### ModuleSlot.ts
```typescript
interface SlotStats {
  damageLevel: number;
  attackSpeedLevel: number;
  cdrLevel: number;
}

interface ModuleSlotData {
  index: number;
  stats: SlotStats;
  equipped: ModuleItem | null;
  unlocked: boolean;
}

class ModuleSlot {
  data: ModuleSlotData;

  equip(module: ModuleItem): boolean;
  unequip(): ModuleItem | null;
  upgradeStat(statType: SlotStatType, tankLevel: number): boolean;
  getStatLevel(statType: SlotStatType): number;
  getDamageMultiplier(): number;      // 1 + (damageLevel * 0.01)
  getAttackSpeedMultiplier(): number; // 1 + (attackSpeedLevel * 0.01)
  getCDRBonus(): number;              // cdrLevel (percentage)
}
```

### ModuleItem.ts
```typescript
interface ModuleItemData {
  id: string;
  type: ModuleType;
  rarity: Rarity;
  stats: ModuleStat[];
  skills: ModuleSkill[];
}

interface ModuleStat {
  type: StatType;
  value: number;
}

class ModuleItem {
  data: ModuleItemData;
  
  static generate(type: ModuleType, rarity: Rarity): ModuleItem;
  getSellValue(): number;
  getStatTotal(statType: StatType): number;
}
```

### WaveSystem.ts
```typescript
interface WaveConfig {
  waveNumber: number;
  fodderCount: number;
  eliteCount: number;
  superElite: boolean;
  boss: BossType | null;
}

class WaveSystem {
  currentWave: number;
  enemiesAlive: number;
  waveInProgress: boolean;
  
  startWave(config: WaveConfig): void;
  onEnemyDeath(): void;
  checkWaveComplete(): boolean;
  getNextWaveConfig(): WaveConfig;
}
```

### PoolManager.ts
```typescript
class PoolManager {
  private pools: Map<string, Phaser.GameObjects.Group>;
  
  createPool(key: string, classType: any, size: number): void;
  get(key: string): Phaser.GameObjects.GameObject;
  release(key: string, object: Phaser.GameObjects.GameObject): void;
  
  // Pre-configured pools
  getEnemy(type: EnemyType): Enemy;
  getProjectile(type: ProjectileType): Projectile;
  getDamageNumber(): DamageNumber;
}
```

## 2.4 Event System

```typescript
// Event types
enum GameEvents {
  // Combat
  ENEMY_SPAWNED = 'enemy:spawned',
  ENEMY_DIED = 'enemy:died',
  DAMAGE_DEALT = 'damage:dealt',
  DAMAGE_TAKEN = 'damage:taken',
  
  // Progression
  XP_GAINED = 'xp:gained',
  LEVEL_UP = 'level:up',
  GOLD_CHANGED = 'gold:changed',
  
  // Modules
  MODULE_DROPPED = 'module:dropped',
  MODULE_EQUIPPED = 'module:equipped',
  MODULE_SOLD = 'module:sold',
  SKILL_ACTIVATED = 'skill:activated',
  
  // Waves
  WAVE_STARTED = 'wave:started',
  WAVE_COMPLETED = 'wave:completed',
  ZONE_COMPLETED = 'zone:completed',
  
  // Boss
  BOSS_SPAWNED = 'boss:spawned',
  BOSS_DEFEATED = 'boss:defeated',
  
  // Tank
  NEAR_DEATH_ENTERED = 'tank:nearDeath',
  TANK_REVIVED = 'tank:revived',
  
  // Save
  GAME_SAVED = 'game:saved',
  GAME_LOADED = 'game:loaded'
}
```

## 2.5 State Management

```typescript
interface GameState {
  // Tank
  tank: {
    level: number;
    xp: number;
    stats: TankStats;
    statLevels: StatLevels;
    currentHP: number;
    isNearDeath: boolean;
  };
  
  // Modules
  modules: {
    slots: ModuleSlotData[];
    inventory: ModuleItemData[];
  };
  
  // Progression
  progression: {
    currentAct: number;
    currentZone: number;
    currentWave: number;
    bossesDefeated: string[];
    ubersDefeated: string[];
  };
  
  // Economy
  economy: {
    gold: number;
    essences: Record<string, number>;
    infernalCores: number;
  };
  
  // Paragon
  paragon: {
    timesPrestiged: number;
    points: ParagonPoints;
  };
}
```

---

# 3. DEVELOPMENT PHASES

> **Current Status:** See `docs/MasterPlan.md` for live progress tracking
> **UI Architecture:** Sliding panels, no separate scenes (see `docs/UISpec.md`)

## 3.1 Phase 1: MVP (Priority 1) - IN PROGRESS

**Goal:** Playable Act 1 with all systems accessible

### Sprint 1.1-1.4: Core Systems ✅ COMPLETE
- [x] Project setup (Phaser 3 + TypeScript + Vite)
- [x] Tank with built-in cannon
- [x] Enemy spawning, movement, combat
- [x] Object pooling for enemies/projectiles
- [x] 3 module types with skills + auto-mode
- [x] XP system and tank leveling
- [x] Gold economy
- [x] Module drops with rarities
- [x] Wave system (7 waves per zone)
- [x] Boss: Corrupted Sentinel
- [x] Near Death system
- [x] Save/Load on zone complete
- [x] Basic HUD (HP, Gold, Module slots)
- [x] Input system for skills

### Sprint 1.5: UI Systems - CURRENT
**Architecture:** Sliding Panel System (Desktop Heroes style)

- [ ] **Sidebar** - 4 icon buttons for panel access
- [ ] **SlidingPanel base class** - Animation, state management
- [ ] **PanelManager** - Single panel open at a time
- [ ] **TankStatsPanel** - Stat upgrades + slot level upgrades
- [ ] **InventoryPanel** - Module inventory, equip/sell
- [ ] **ShopPanel** - Purchase module slots
- [ ] **SettingsPanel** - Options + Save & Quit
- [ ] **TopBar** - Gold, XP, zone info
- [ ] **BottomBar refactor** - HP bar, module slots, wave progress

### MVP Deliverables
- Playable Act 1 (2 zones, 14 waves, 1 boss)
- 3 functional modules with skills
- **All progression systems accessible via sliding panels**
- Save/Load

## 3.2 Phase 2: Vertical Slice (Priority 2)

**Goal:** Zone 1 polished to demo quality

### Features
- [ ] Audio pass (SFX + music)
- [ ] VFX pass (death effects, impacts, muzzle flash)
- [ ] Boss polish (intro, phases, death sequence)
- [ ] Onboarding (tooltip hints)
- [ ] Performance verification (60 FPS)

## 3.3 Phase 3: Content Expansion (Priority 3)

**Goal:** Acts 1-2 complete

### Features
- [ ] Act 2 enemies (4 types)
- [ ] Act 2 zones + Gargoyle boss
- [ ] Zone selection UI
- [ ] Auto-sell system
- [ ] Loot drop visuals

## 3.4 Phase 4: Full Content (Priority 4)

**Goal:** All 8 Acts

### Features
- [ ] Acts 3-8 (enemies, backgrounds, bosses)
- [ ] Remaining 7 modules
- [ ] Boss summoning system (essences)

## 3.5 Phase 5: Endgame (Priority 5)

**Goal:** Paragon, Ubers

### Features
- [ ] Paragon/Prestige system
- [ ] 8 Uber boss variants
- [ ] Infernal Cores currency

## 3.6 Phase 6: Steam Release (Priority 6)

**Goal:** Launch ready

### Features
- [ ] Steam SDK integration
- [ ] Achievements
- [ ] Cloud save
- [ ] Store page + marketing

---

# 4. FEATURE SPECIFICATIONS

## 4.1 Combat System

### F-COMBAT-001: Damage Calculation
```
Priority: P1 (MVP)
Description: Calculate final damage from source to target

Formula:
  BaseDamage × SlotDamageMultiplier × StatBonuses × CritMultiplier × Variance

Where:
  SlotDamageMultiplier = 1 + (SlotDamageLevel × 0.01)
  StatBonuses = 1 + (sum of all relevant % bonuses)
  CritMultiplier = if crit then 2.0 + CritDamageBonus else 1.0
  Variance = random(0.9, 1.1)

Fire Rate:
  BaseFireRate × SlotAttackSpeedMultiplier
  SlotAttackSpeedMultiplier = 1 + (SlotAttackSpeedLevel × 0.01)

Skill Cooldowns:
  BaseCooldown × (1 - CDRBonus)
  CDRBonus = min(SlotCDRLevel × 0.01, 0.90)  // Capped at 90%

Acceptance Criteria:
  - Damage numbers display correctly
  - Crits show yellow color
  - Multistrike triggers correctly
  - Slot damage stat affects module damage
  - Slot attack speed stat affects fire rate
  - Slot CDR stat affects skill cooldowns
```

### F-COMBAT-002: Near Death System
```
Priority: P1 (MVP)
Description: Tank enters Near Death instead of dying

Trigger: Tank HP reaches 0
State:
  - isNearDeath = true
  - attackSpeedMultiplier = 0.5
  - canDie = false
  - reviveTimer = 60 seconds

Revival:
  - Manual: Click Revive button
  - Auto: After 60 seconds

Visual:
  - Smoke particles
  - Red tint overlay
  - Warning indicator
  - Revive button appears

Acceptance Criteria:
  - Tank never actually dies
  - 50% attack speed reduction applied
  - Timer counts down visually
  - Revive restores full HP
```

### F-COMBAT-003: Object Pooling
```
Priority: P1 (MVP)
Description: Pool all frequently spawned objects

Pooled Objects:
  - Enemies (per type)
  - Projectiles (per type)
  - Damage numbers
  - Loot drops
  - Particle effects

Pool Size Guidelines:
  - Enemies: 50 per type
  - Projectiles: 200 total
  - Damage numbers: 100
  - Loot drops: 30

Acceptance Criteria:
  - No runtime instantiation during gameplay
  - Pool expands if needed (with warning log)
  - Objects properly reset on release
```

## 4.2 Module System

### F-MODULE-001: Module Slots
```
Priority: P1 (MVP)
Description: Container for module items with per-stat upgrades

Properties:
  - index: 0-4
  - stats: { damageLevel, attackSpeedLevel, cdrLevel }
  - equipped: ModuleItem | null
  - unlocked: boolean

Per-Stat Properties:
  - Each stat: level 0-160 (capped by tank level)
  - Cost per upgrade: (currentLevel + 1) × 50 Gold

Unlock Conditions:
  - Slot 0: Free
  - Slot 1: 10,000 Gold
  - Slot 2: 50,000 Gold
  - Slot 3: Beat Diaboros + 500,000 Gold
  - Slot 4: Beat all Ubers + 2,000,000 Gold

Per-Stat Upgrade Effects:
  - Damage: +1% module damage per level
  - Attack Speed: +1% module fire rate per level
  - CDR: +1% cooldown reduction per level (capped at 90%)

Acceptance Criteria:
  - Slots display correctly in UI with 3 stats each
  - TankStatsPanel shows tabs: Tank, Slot 1-5
  - Each stat upgrades independently
  - Upgrade costs scale correctly: (level + 1) × 50
  - Level cap enforced per stat (tank level)
  - Stat bonuses apply only to module in that slot
```

### F-MODULE-002: Module Items
```
Priority: P1 (MVP)
Description: Droppable weapon/ability items

Properties:
  - id: unique identifier
  - type: ModuleType enum
  - rarity: Uncommon | Rare | Epic | Legendary
  - stats: array of {type, value}

Stat Rolling:
  - Uncommon: 1 stat, 1-5% range
  - Rare: 2 stats, 3-8% range
  - Epic: 3 stats, 5-12% range
  - Legendary: 4 stats, 8-15% range

Stat Pool:
  - Damage, AttackSpeed, CritChance, CritDamage
  - CDR, AoE, Lifesteal, Multistrike, Range
  - GoldFind, XPBonus

Acceptance Criteria:
  - Stats roll within rarity ranges
  - No duplicate stat types on same item
  - Sell value correct per rarity
```

### F-MODULE-003: Module Skills
```
Priority: P1 (MVP)
Description: Active abilities per module type

Per Module:
  - 2 skills each
  - Cooldown-based
  - Manual or auto-cast

Auto-Mode:
  - Toggle per module
  - 10% damage reduction when auto

Acceptance Criteria:
  - Skills activate on button press
  - Cooldowns track correctly
  - Auto-mode applies penalty
  - Multiple same-type modules = multiple skill instances
```

## 4.3 Progression System

### F-PROG-001: Tank XP & Leveling
```
Priority: P1 (MVP)
Description: Experience-based tank progression

XP Formula: Floor(100 × (1.15 ^ Level))
Max Level: 160

XP Sources:
  - Fodder: 5-10
  - Elite: 25-50
  - Super Elite: 100-200
  - Bosses: 500-10,000

Level Up Effects:
  - Increases stat upgrade cap
  - Increases slot upgrade cap
  - May unlock content

Acceptance Criteria:
  - XP bar fills correctly
  - Level up notification
  - Caps enforced
```

### F-PROG-002: Paragon System
```
Priority: P4
Description: Prestige system after beating Act 8

Trigger: Defeat Diaboros

Resets:
  - Tank Level → 1
  - All Stat Levels → 0
  - Gold → 0
  - Zone Progress → Act 1

Keeps:
  - Unlocked Module Slots
  - Module Inventory
  - Paragon Points/Upgrades
  - Bosses Defeated (for essence access)

Paragon Stats (upgraded with Infernal Cores):
  - Global Damage: +1% per point (max 100)
  - Global Attack Speed: +1% (max 100)
  - Max HP: +2% (max 100)
  - Defense: +1% (max 100)
  - Gold Find: +2% (max 50)
  - Essence Drop Rate: +2% (max 50)

Acceptance Criteria:
  - Correct data preserved/reset
  - Paragon bonuses apply globally
  - Infernal Cores only from Ubers
```

## 4.4 Wave System

### F-WAVE-001: Wave Management
```
Priority: P1 (MVP)
Description: Control enemy wave spawning

Structure:
  - 1 Zone = 7 Waves
  - Wave 1-6: Regular combat
  - Wave 7: Super Elite OR Boss

Wave Composition Scaling:
  Wave 1: 5 Fodder
  Wave 2: 8 Fodder
  Wave 3: 6 Fodder + 1 Elite
  Wave 4: 10 Fodder + 1 Elite
  Wave 5: 8 Fodder + 2 Elite
  Wave 6: 12 Fodder + 2 Elite
  Wave 7: Special

Wave Completion:
  - All enemies dead
  - Brief pause (2 seconds)
  - Next wave starts

Acceptance Criteria:
  - Waves spawn correctly
  - Pause between waves
  - Zone complete triggers properly
```

## 4.5 Save System

### F-SAVE-001: Auto-Save
```
Priority: P1 (MVP)
Description: Automatic game saving

Trigger: Zone completion
Location: 
  - Local: AppData/Hellcrawler/save.json
  - Cloud: Steam Cloud (Phase 4)

Data: Full GameState object
Format: JSON (compressed, optionally encrypted)

Acceptance Criteria:
  - Save triggers on zone clear
  - Load restores exact state
  - Corruption handling (backup)
```

---

# 5. SYSTEM REQUIREMENTS

## 5.1 Minimum Specifications

| Component | Requirement |
|-----------|-------------|
| OS | Windows 10 / macOS 10.14 |
| Processor | Intel i3 / AMD Ryzen 3 |
| Memory | 4 GB RAM |
| Graphics | Integrated graphics |
| Storage | 500 MB |

## 5.2 Recommended Specifications

| Component | Requirement |
|-----------|-------------|
| OS | Windows 11 / macOS 12 |
| Processor | Intel i5 / AMD Ryzen 5 |
| Memory | 8 GB RAM |
| Graphics | Dedicated GPU |
| Storage | 500 MB SSD |

## 5.3 Performance Budgets

| Metric | Target | Max |
|--------|--------|-----|
| Frame Rate | 60 FPS | - |
| Frame Time | 16.67ms | 20ms |
| Memory | 150 MB | 300 MB |
| Draw Calls | 50 | 100 |
| Entities | 30 | 50 |
| Projectiles | 100 | 200 |

---

# 6. ASSET PIPELINE

## 6.1 Asset Sources

All visual assets sourced from existing GameDevMarket packs:
- Gothicvania (enemies, bosses)
- Tiny RPG (backgrounds, items)
- Warped Assets (modules, effects)
- SunnyLand (effects, UI elements)
- Explosion Packs 1-9
- Magic Packs 1-12

## 6.2 Asset Organization

```
public/assets/
├── sprites/
│   ├── tank/
│   │   └── tank.png              # Main tank sprite
│   ├── modules/
│   │   ├── machine-gun.png
│   │   ├── missile-pod.png
│   │   └── ... (10 modules)
│   ├── enemies/
│   │   ├── act1/
│   │   │   ├── imp.png
│   │   │   ├── hellhound.png
│   │   │   └── ...
│   │   └── act2-8/...
│   ├── bosses/
│   │   ├── corrupted-sentinel.png
│   │   └── ... (8 bosses)
│   ├── projectiles/
│   │   ├── bullet.png
│   │   ├── missile.png
│   │   └── ...
│   └── effects/
│       ├── explosions/
│       ├── magic/
│       └── ...
├── backgrounds/
│   ├── act1-city.png
│   ├── act2-urban.png
│   └── ... (8 backgrounds)
├── ui/
│   ├── health-bar.png
│   ├── module-slot.png
│   ├── buttons/
│   └── icons/
└── audio/
    ├── sfx/
    │   ├── weapons/
    │   ├── impacts/
    │   └── ui/
    └── music/
        ├── act1-theme.mp3
        └── ...
```

## 6.3 Spritesheet Format

Use Phaser's standard atlas format:
```json
{
  "frames": {
    "enemy-imp-walk-0": {
      "frame": {"x": 0, "y": 0, "w": 32, "h": 32},
      "sourceSize": {"w": 32, "h": 32}
    },
    "enemy-imp-walk-1": {...}
  },
  "meta": {
    "image": "enemies-act1.png",
    "size": {"w": 512, "h": 512}
  }
}
```

## 6.4 Asset Loading Strategy

```typescript
// BootScene.ts
preload() {
  // Critical (blocking)
  this.load.image('tank', 'sprites/tank/tank.png');
  this.load.atlas('ui', 'ui/ui.png', 'ui/ui.json');
  
  // Act-specific (load per act)
  this.load.atlas('enemies-act1', ...);
  this.load.image('bg-act1', ...);
  
  // On-demand (load when needed)
  // Boss sprites, effects, etc.
}
```

---

# 7. TESTING STRATEGY

## 7.1 Unit Testing

Framework: Vitest

Coverage Targets:
- Systems: 90%
- Utils: 95%
- Core logic: 85%

Key Test Areas:
```typescript
// Damage calculation
describe('CombatSystem', () => {
  it('calculates base damage correctly');
  it('applies crit multiplier');
  it('handles multistrike');
  it('respects defense reduction');
});

// Module stat rolling
describe('ModuleItem', () => {
  it('rolls correct number of stats per rarity');
  it('keeps values within rarity ranges');
  it('prevents duplicate stat types');
});

// XP curve
describe('XPSystem', () => {
  it('calculates XP requirements correctly');
  it('handles level up');
  it('respects max level');
});
```

## 7.2 Integration Testing

Framework: Playwright (via MCP)

Test Scenarios:
```typescript
// Full gameplay loop
test('complete Act 1', async () => {
  await game.start();
  await game.playZone(1);
  await game.playZone(2);
  expect(game.act).toBe(2);
});

// Save/Load
test('save and load preserves state', async () => {
  const stateBefore = game.getState();
  await game.save();
  await game.reload();
  const stateAfter = game.getState();
  expect(stateAfter).toEqual(stateBefore);
});
```

## 7.3 Performance Testing

Metrics to track:
- FPS during max enemy count
- Memory usage over time
- Load times
- Save/Load times

Benchmarks:
```typescript
test('maintains 60fps with 30 enemies', async () => {
  game.spawnEnemies(30);
  const fps = await game.measureFPS(5000);
  expect(fps).toBeGreaterThan(58);
});
```

---

# 8. DEPLOYMENT & DISTRIBUTION

## 8.1 Build Pipeline

```bash
# Development
npm run dev          # Vite dev server (web)
npm run dev:electron # Electron dev mode

# Production
npm run build        # Build web version
npm run build:win    # Build Windows executable
npm run build:mac    # Build macOS executable
npm run build:all    # Build all platforms
```

## 8.2 Electron Configuration

### 8.2.1 Builder Configuration

```javascript
// electron-builder.config.js
module.exports = {
  appId: 'com.hellcrawler.game',
  productName: 'Hellcrawler',
  directories: {
    output: 'dist-electron'
  },
  win: {
    target: 'nsis',
    icon: 'build/icon.ico'
  },
  mac: {
    target: 'dmg',
    icon: 'build/icon.icns',
    category: 'public.app-category.games'
  },
  steam: {
    appId: 'XXXXXXX' // Steam App ID
  }
};
```

### 8.2.2 Desktop Mode (Transparent Window)

Hellcrawler runs as a **desktop widget** with always-transparent background, similar to Desktop Heroes. The game displays as a horizontal strip docked to the bottom of the screen.

**Window Layout (Desktop Heroes Style):**
| Attribute | Value | Description |
|-----------|-------|-------------|
| Width | `workArea.width` | Full screen width |
| Height | 350px | Short horizontal strip |
| Position X | `workArea.x` | Left edge of work area |
| Position Y | `workArea.y + workArea.height - 350` | Bottom of work area |

**Note:** Uses `screen.getPrimaryDisplay().workArea` (not `workAreaSize`) to properly account for menu bars, taskbars, and docks on all platforms.

**BrowserWindow Configuration:**
```typescript
function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  const windowWidth = workArea.width;
  const windowHeight = 350;
  const windowX = workArea.x;
  const windowY = workArea.y + workArea.height - windowHeight;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: windowY,
    transparent: true,      // Always transparent
    frame: false,           // Required for transparency on Windows
    resizable: false,       // Transparent windows can't resize
    alwaysOnTop: true,      // Default ON, toggled via settings
    hasShadow: false,       // No window shadow for clean look
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: 'preload.js'
    }
  });
}
```

**Compact UI Dimensions:**
| Component | Value | Description |
|-----------|-------|-------------|
| Top Bar | 28px | Gold, XP, zone info |
| Bottom Bar | 60px | HP bar, module slots, wave progress |
| Sidebar | 40px wide | Panel toggle buttons |
| Ground Height | 60px | Gameplay ground level |
| Game Height | 350px | Full canvas height |
| Game Width | 1920px | Base canvas width (scales to screen) |

**Desktop Mode Settings:**
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| alwaysOnTop | boolean | true | Keep window above other applications |
| clickThroughEnabled | boolean | true | Pass clicks through transparent areas |
| showSkyLayer | boolean | true | Show bg-sky + bg-clouds |
| showMountainsLayer | boolean | true | Show bg-mountains + bg-mountains-lights |
| showFarBuildingsLayer | boolean | true | Show bg-far-buildings |
| showForegroundLayer | boolean | true | Show bg-forest + bg-town |

**Click-Through Behavior:**
- When cursor is over transparent areas (no game elements), clicks pass through to desktop
- Uses `setIgnoreMouseEvents(true, { forward: true })` for dynamic toggling
- Interactive elements (UI, tank, enemies) always receive mouse events

**IPC Channels:**
| Channel | Direction | Purpose |
|---------|-----------|---------|
| set-always-on-top | Renderer → Main | Toggle always-on-top state |
| set-click-through | Renderer → Main | Toggle click-through for transparent areas |
| get-window-state | Renderer → Main | Get current alwaysOnTop and clickThrough state |
| set-window-position | Renderer → Main | Set window position (for dragging) |
| get-window-position | Renderer → Main | Get current window position |
| minimize-window | Renderer → Main | Minimize window |
| close-window | Renderer → Main | Close window |

## 8.3 Steam Integration

Required SDK Features:
- Steamworks.js for Electron
- Achievements
- Cloud Save
- Overlay

```typescript
// steam.ts
import { init, achievement, cloud } from 'steamworks.js';

export function initSteam() {
  const client = init(STEAM_APP_ID);
  return client;
}

export function unlockAchievement(id: string) {
  achievement.activate(id);
}

export async function cloudSave(data: string) {
  await cloud.writeFile('save.json', data);
}

export async function cloudLoad(): Promise<string> {
  return await cloud.readFile('save.json');
}
```

## 8.4 Release Checklist

Pre-Release:
- [ ] All P1-P3 features complete
- [ ] Performance targets met
- [ ] No critical bugs
- [ ] Save system tested thoroughly
- [ ] Steam build uploaded
- [ ] Achievements configured
- [ ] Store page complete
- [ ] Marketing assets ready

Launch Day:
- [ ] Steam build set to live
- [ ] Announcement posted
- [ ] Monitor for critical issues
- [ ] Hotfix plan ready

---

# 9. TOOLS & MCP INTEGRATION

## 9.1 Development Tools

| Tool | Purpose |
|------|---------|
| Vite | Build tool, HMR |
| TypeScript | Type safety |
| ESLint | Code quality |
| Prettier | Code formatting |
| Vitest | Unit testing |

## 9.2 MCP Servers

### Phaser Editor MCP
```json
{
  "mcpServers": {
    "phaser-editor": {
      "command": "npx",
      "args": ["@phaserjs/editor-mcp-server"]
    }
  }
}
```

Use for:
- Scene editing
- Tilemap operations
- Asset management
- Level generation assistance

### Playwright MCP (Testing)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-playwright"]
    }
  }
}
```

Use for:
- E2E testing
- Visual regression
- Performance benchmarks

### Filesystem MCP
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/project/path"]
    }
  }
}
```

Use for:
- Asset organization
- Build script management
- Configuration updates

## 9.3 Recommended Workflow

1. **Scene Design:** Use Phaser Editor MCP for visual scene composition
2. **Code Generation:** Claude Code for TypeScript implementation
3. **Testing:** Playwright MCP for automated testing
4. **Asset Management:** Filesystem MCP for organization

---

# 10. RISK ASSESSMENT

## 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance issues with many entities | Medium | High | Object pooling, profiling |
| Save corruption | Low | Critical | Backup saves, validation |
| Steam SDK integration issues | Medium | Medium | Early integration, fallback |
| Memory leaks | Medium | High | Careful pool management |

## 10.2 Scope Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Feature creep | High | Medium | Strict phase boundaries |
| Art asset delays | Low | Medium | Placeholder system |
| Balance issues | High | Medium | Spreadsheet-driven, iterate |

## 10.3 Contingency Plans

**If MVP takes longer than 3 weeks:**
- Reduce to 1 zone (7 waves)
- Cut to 2 modules
- Simplify UI

**If performance targets not met:**
- Reduce max enemies to 20
- Simplify effects
- Lower target to 30 FPS fallback

**If Steam integration fails:**
- Release DRM-free on itch.io first
- Add Steam later as update

---

# APPENDICES

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Fodder | Weak enemies killed in 1-2 hits |
| Elite | Medium enemies with abilities |
| Super Elite | Mini-boss at zone midpoint |
| Module | Weapon/ability item that goes in slots |
| Slot | Permanent socket on tank |
| Near Death | State when HP reaches 0 |
| Paragon | Prestige system after Act 8 |

## Appendix B: API Reference

See separate TypeScript documentation generated from source.

## Appendix C: Config Files

### GameConfig.ts
```typescript
export const GAME_CONFIG = {
  // Display (Desktop Heroes style - bottom strip)
  WIDTH: 1920,
  HEIGHT: 350,        // Compact horizontal strip
  GROUND_HEIGHT: 60,  // Ground level from bottom
  FPS: 60,
  
  // Combat
  BASE_CRIT_MULTIPLIER: 2.0,
  DAMAGE_VARIANCE: 0.1,
  NEAR_DEATH_ATTACK_SPEED: 0.5,
  NEAR_DEATH_REVIVE_TIME: 60,
  
  // Progression
  MAX_TANK_LEVEL: 160,
  XP_BASE: 100,
  XP_EXPONENT: 1.15,
  
  // Economy
  SLOT_COSTS: [0, 10000, 50000, 500000, 2000000],
  STAT_UPGRADE_BASE_COST: 100,
  
  // Modules
  RARITY_STAT_COUNTS: { uncommon: 1, rare: 2, epic: 3, legendary: 4 },
  RARITY_STAT_RANGES: {
    uncommon: [1, 5],
    rare: [3, 8],
    epic: [5, 12],
    legendary: [8, 15]
  },
  
  // Waves
  WAVES_PER_ZONE: 7,
  ZONES_PER_ACT: 2,
  TOTAL_ACTS: 8,
  WAVE_PAUSE_DURATION: 2000
};
```

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Author:** Product Team
**Status:** APPROVED FOR DEVELOPMENT
