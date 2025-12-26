# HELLCRAWLER - Quick Reference for Claude Code
## Implementation Cheatsheet

---

## 🚀 START HERE

### Tech Stack
```
Phaser 3.80+ | TypeScript | Vite | Electron | Steam SDK
```

### MVP Scope (Phase 1)
- Act 1 only (2 zones, 14 waves, 1 boss)
- 3 modules: Machine Gun, Missile Pod, Repair Drone
- Basic UI: HP bar, Gold, Module slots
- Save/Load on zone complete

---

## 📁 KEY FILES TO CREATE FIRST

```
src/
├── main.ts
├── config/GameConfig.ts
├── scenes/BootScene.ts
├── scenes/GameScene.ts
├── entities/Tank.ts
├── entities/Enemy.ts
├── systems/PoolManager.ts
├── systems/WaveSystem.ts
└── systems/CombatSystem.ts
```

---

## 🎯 CRITICAL REQUIREMENTS

### 1. OBJECT POOLING (MANDATORY)
```typescript
// Pool EVERYTHING that spawns frequently
- Enemies (50 per type)
- Projectiles (200 total)
- Damage numbers (100)
- Loot drops (30)
```

### 2. NEAR DEATH (NOT DEATH)
```typescript
// When HP <= 0:
tank.isNearDeath = true;
tank.attackSpeedMultiplier = 0.5;
// Tank CANNOT die, just crippled
// Revive after 60s OR manual button
```

### 3. MODULE = SOCKET + GEM
```typescript
// ModuleSlot = permanent, upgradeable
// ModuleItem = droppable, swappable, sellable
// Same module type CAN be equipped multiple times
```

---

## 📊 KEY FORMULAS

### XP Required
```typescript
xpRequired = Math.floor(100 * Math.pow(1.15, level));
```

### Damage Calculation
```typescript
finalDamage = baseDamage 
  * (1 + slotLevel * 0.01)           // Slot bonus
  * (1 + sumOfStatBonuses)           // Module stats
  * (isCrit ? 2.0 + critDmgBonus : 1) // Crit
  * randomRange(0.9, 1.1);           // Variance
```

### Defense Reduction
```typescript
reduction = defense / (defense + 100);
damageTaken = incomingDamage * (1 - reduction);
```

### Upgrade Cost
```typescript
cost = level * 100; // Both stats and slots
```

---

## 🎮 GAMEPLAY FLOW

```
1. Enemies spawn RIGHT → walk LEFT
2. Tank is STATIONARY (left side)
3. Built-in cannon fires every 2.5s (auto)
4. Modules fire independently (auto)
5. Skills: manual OR auto (10% dmg penalty)
6. Wave clears when all enemies dead
7. 7 waves = 1 zone
8. Zone 1 ends with Super Elite
9. Zone 2 ends with Boss
10. Save on zone complete
```

---

## 💰 ECONOMY QUICK REF

### Gold Sources
| Source | Gold |
|--------|------|
| Fodder | 1-5 |
| Elite | 10-50 |
| Super Elite | 100-500 |
| Lesser Evil | 5,000 |
| Prime Evil | 25,000 |
| Diaboros | 100,000 |

### Module Slots
| Slot | Cost | Unlock |
|------|------|--------|
| 1 | Free | Start |
| 2 | 10K | Start |
| 3 | 50K | Start |
| 4 | 500K | Beat Act 8 |
| 5 | 2M | Beat all Ubers |

---

## 📦 MODULE RARITIES

| Rarity | Stats | Range | Drop % |
|--------|-------|-------|--------|
| Uncommon | 1 | 1-5% | 10% |
| Rare | 2 | 3-8% | 3% |
| Epic | 3 | 5-12% | 0.5% |
| Legendary | 4 | 8-15% | 0.05% |

### Stat Pool (11 stats)
Damage, AttackSpeed, CritChance, CritDamage, CDR, AoE, Lifesteal, Multistrike, Range, GoldFind, XPBonus

---

## 🎯 MVP ENEMIES (Act 1)

| Enemy | Type | HP | Speed |
|-------|------|-----|-------|
| Imp | Fodder | 50 | Fast |
| Hellhound | Fodder | 75 | Medium |
| Possessed Soldier | Fodder | 60 | Slow (ranged) |
| Fire Skull | Elite | 300 | Medium |

### Boss: Corrupted Sentinel
- HP: 10,000
- Abilities: Laser Sweep, Summon Drones

---

## 🔧 MVP MODULES (3)

### 1. Machine Gun
- Type: Projectile
- Range: Medium (400px)
- Fire Rate: Fast
- Skills:
  - Overdrive (15s CD): +50% fire rate for 5s
  - Suppressing Fire (20s CD): Slow enemies 30% for 4s

### 2. Missile Pod
- Type: Homing
- Range: Long (600px)
- Fire Rate: Slow
- Skills:
  - Barrage (18s CD): Fire 5 missiles rapidly
  - Homing Swarm (25s CD): Perfect tracking for 8s

### 3. Repair Drone
- Type: Support
- Range: Self
- Skills:
  - Emergency Repair (30s CD): Heal 15% max HP
  - Regen Field (45s CD): +200% HP regen for 10s

---

## 🖥️ UI LAYOUT

```
┌────────────────────────────────────────────────┐
│ [Zone Name]                    [Flee] [Settings]│
├────────────────────────────────────────────────┤
│                                                │
│   [TANK] ←←← enemies ←←←          [ENEMIES]   │
│                                                │
│            Damage numbers float up             │
│                                                │
├────────────────────────────────────────────────┤
│ [HP ████████░░] 235K/300K      [Gold: 1.2M]   │
├────────────────────────────────────────────────┤
│ [Slot1] [Slot2] [Slot3] [Slot4] [Slot5]       │
└────────────────────────────────────────────────┘
```

---

## ⚡ PERFORMANCE TARGETS

- 60 FPS constant
- Max 30 enemies on screen
- Max 100 projectiles on screen
- <3 second load time
- Auto-save <500ms

---

## 📝 SAVE DATA STRUCTURE

```typescript
interface SaveData {
  version: string;
  tankLevel: number;
  tankXP: number;
  tankStats: { maxHP, defense, hpRegen, moveSpeed };
  moduleSlots: { unlocked: boolean[], levels: number[] };
  equippedModules: ModuleItemData[];
  moduleInventory: ModuleItemData[];
  gold: number;
  essences: Record<string, number>;
  currentAct: number;
  currentZone: number;
  bossesDefeated: string[];
}
```

---

## 🔫 FIRING POSITIONS

### Tank Cannon
```typescript
// File: src/entities/Tank.ts (lines 297-298)
const muzzleX = this.x + 70;
const muzzleY = this.y - 65;
```

### Module Slot Positions
```typescript
// File: src/config/GameConfig.ts
// Format: { x: offset from tank.x, y: offset from tank.y }
MODULE_SLOT_POSITIONS: [
  { x: 60, y: -70 },   // Slot 0: Top front turret
  { x: 45, y: -45 },   // Slot 1: Upper mid turret
  { x: 30, y: -25 },   // Slot 2: Lower mid turret
  { x: 50, y: -60 },   // Slot 3: Top rear turret
  { x: 35, y: -35 },   // Slot 4: Lower rear turret
]
```

### Enemy Hitboxes
```typescript
// File: src/entities/Enemy.ts (in activate())
// All enemies have tall hitboxes for consistent projectile hits
const spriteHeight = this.displayHeight || 32;  // Scaled height
const spriteWidth = this.displayWidth || 32;    // Scaled width
const hitboxHeight = spriteHeight * 2;          // 2x sprite height
const hitboxWidth = Math.max(24, spriteWidth * 0.6); // 60% width, min 24px

body.setSize(hitboxWidth, hitboxHeight);
body.setOffset(
  (spriteWidth - hitboxWidth) / 2,    // Center horizontally
  spriteHeight - hitboxHeight          // Align bottom with feet
);
// Hitbox extends from ground level upward (origin 0.5, 1)
```

---

## 🎨 ASSET LOCATIONS

Tank: `/public/assets/sprites/tank/tank.png`
Enemies: `/public/assets/sprites/enemies/act1/`
Modules: `/public/assets/sprites/modules/`
Effects: `/public/assets/sprites/effects/`
UI: `/public/assets/ui/`
Backgrounds: `/public/assets/backgrounds/`

---

## ✅ IMPLEMENTATION ORDER

1. Project setup (Vite + Phaser + TS)
2. PoolManager
3. Tank + Built-in Cannon
4. Enemy spawning + movement
5. Projectile system
6. Damage calculation
7. Wave system
8. XP + Gold
9. Module slots + items
10. 3 MVP modules
11. Module skills
12. UI (HP, Gold, Slots)
13. Near Death system
14. Save/Load
15. Act 1 content
16. Boss fight

---

**Ready to implement. Good luck!** 🎮
