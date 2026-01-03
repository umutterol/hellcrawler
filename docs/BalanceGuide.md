# Hellcrawler Balance Guide

> Concrete numbers for enemy stats, scaling formulas, and progression balance.
> Based on Desktop Heroes patterns, adapted for Hellcrawler's tank combat.

---

## 1. Core Formulas (from GDD)

### XP Required per Level
```javascript
xpForLevel = Math.floor(100 * Math.pow(1.15, level));

// Examples:
// Level 1:   100 XP
// Level 10:  405 XP
// Level 50:  10,836 XP
// Level 100: 1,174,313 XP
```

### Defense Damage Reduction
```javascript
reduction = defense / (defense + 100);
damageTaken = incomingDamage * (1 - reduction);

// Examples:
// 0 defense:   0% reduction
// 50 defense:  33% reduction
// 100 defense: 50% reduction
// 200 defense: 67% reduction
```

### Upgrade Costs
```javascript
// Tank stats
tankStatCost = 100 * Math.pow(currentLevel, 1.5);

// Slot stats (Damage, Attack Speed, CDR)
slotStatCost = (currentLevel + 1) * 50;
```

---

## 2. Base Enemy Stats (Act 1 Baseline)

All enemies scale from these Act 1 base values.

### Fodder Enemies

| Enemy | HP | Damage | Speed | Attack Rate | XP | Gold |
|-------|-----|--------|-------|-------------|-----|------|
| Imp | 50 | 5 | 80 | 1.0s | 5 | 2 |
| Hellhound | 40 | 8 | 120 | 0.8s | 7 | 3 |
| Possessed Soldier | 60 | 10 | 60 | 1.5s (ranged) | 8 | 4 |

### Elite Enemies

| Enemy | HP | Damage | Speed | Attack Rate | XP | Gold | Special |
|-------|-----|--------|-------|-------------|-----|------|---------|
| Fire Skull | 300 | 15 | 50 | 2.0s | 35 | 25 | Explodes on death (30 AoE dmg) |

### Super Elite (Act 1, Zone 1 - Wave 7)

| Enemy | HP | Damage | Speed | XP | Gold |
|-------|-----|--------|-------|-----|------|
| Infernal Imp Lord | 1,500 | 25 | 60 | 150 | 300 |

### Boss (Act 1, Zone 2 - Wave 7)

| Boss | HP | Damage | XP | Gold |
|------|-----|--------|-----|------|
| Corrupted Sentinel | 10,000 | 40 | 500 | 5,000 |

---

## 3. Per-Act Scaling

Enemy stats multiply per act. This creates exponential difficulty similar to Desktop Heroes.

### Act Multipliers

| Act | HP Mult | Damage Mult | Gold Mult | XP Mult |
|-----|---------|-------------|-----------|---------|
| 1 | 1.0x | 1.0x | 1.0x | 1.0x |
| 2 | 1.8x | 1.5x | 1.6x | 1.5x |
| 3 | 3.2x | 2.2x | 2.5x | 2.2x |
| 4 | 5.8x | 3.0x | 4.0x | 3.0x |
| 5 | 10x | 4.0x | 6.5x | 4.0x |
| 6 | 18x | 5.5x | 10x | 5.5x |
| 7 | 32x | 7.5x | 16x | 7.5x |
| 8 | 58x | 10x | 25x | 10x |

### Formula
```javascript
function getActMultiplier(act) {
  return {
    hp: Math.pow(1.8, act - 1),
    damage: Math.pow(1.4, act - 1),
    gold: Math.pow(1.6, act - 1),
    xp: Math.pow(1.5, act - 1)
  };
}

function scaleEnemy(baseStats, act) {
  const mult = getActMultiplier(act);
  return {
    hp: Math.floor(baseStats.hp * mult.hp),
    damage: Math.floor(baseStats.damage * mult.damage),
    gold: Math.floor(baseStats.gold * mult.gold),
    xp: Math.floor(baseStats.xp * mult.xp),
    speed: baseStats.speed, // Speed doesn't scale
    attackRate: baseStats.attackRate // Attack rate doesn't scale
  };
}
```

### Example: Imp Across Acts

| Act | HP | Damage | Gold | XP |
|-----|-----|--------|------|-----|
| 1 | 50 | 5 | 2 | 5 |
| 2 | 90 | 7 | 3 | 7 |
| 3 | 160 | 11 | 5 | 11 |
| 4 | 290 | 15 | 8 | 15 |
| 5 | 500 | 20 | 13 | 20 |
| 6 | 900 | 27 | 20 | 27 |
| 7 | 1,600 | 37 | 32 | 37 |
| 8 | 2,900 | 50 | 50 | 50 |

---

## 4. Per-Zone Scaling (Within Acts)

Each act has 2 zones. Zone 2 enemies are slightly stronger.

```javascript
const zoneMultiplier = {
  1: 1.0,  // First zone of act
  2: 1.25  // Second zone of act (boss zone)
};
```

---

## 5. Per-Wave Scaling (Within Zones)

Waves 1-7 have slight scaling within a zone.

```javascript
function getWaveMultiplier(waveNumber) {
  // Waves 1-6: gradual increase
  // Wave 7: boss/super elite (uses separate stats)
  return 1 + (waveNumber - 1) * 0.05; // +5% per wave
}

// Wave 1: 1.00x
// Wave 2: 1.05x
// Wave 3: 1.10x
// Wave 4: 1.15x
// Wave 5: 1.20x
// Wave 6: 1.25x
```

---

## 6. Module Base Damage

Modules deal damage independent of tank stats. Slot upgrades multiply this.

### Module Base Stats

| Module | Base DPS | Fire Rate | Damage/Hit | Range |
|--------|----------|-----------|------------|-------|
| Machine Gun | 50 | 0.15s | 7.5 | 400px |
| Missile Pod | 40 | 1.5s | 60 | 600px |
| Repair Drone | - | 2.0s | +20 HP | Self |
| Shield Generator | - | - | 50 absorb | Self |
| Laser Cutter | 60 | Continuous | 3/tick | 400px |
| Tesla Coil | 45 | 0.8s | 36 | 400px |
| Flamethrower | 80 | Continuous | 4/tick | 200px |
| EMP Emitter | 30 | 2.0s | 60 | 400px |
| Mortar | 35 | 3.0s | 105 | 600px |
| Main Cannon | 25 | 4.0s | 100 | 600px |

### Built-in Cannon (Always Active)

| Attribute | Value |
|-----------|-------|
| Fire Rate | 2.5s |
| Base Damage | 80 + (TankLevel * 5) |
| Range | Full screen |
| Pierces | Up to 3 fodder |

---

## 7. Tank Scaling

### Base Tank Stats (Level 1)

| Stat | Base Value | Per Upgrade |
|------|------------|-------------|
| Max HP | 100 | +10 |
| Defense | 0 | +1 |
| HP Regen | 1/s | +0.5/s |
| Enemy Slow | 0% | +1% |

### Recommended Stat Progression

| Tank Level | Suggested HP Lvl | Defense Lvl | Regen Lvl | Slow Lvl |
|------------|------------------|-------------|-----------|----------|
| 10 | 10 | 5 | 3 | 2 |
| 25 | 25 | 15 | 10 | 5 |
| 50 | 50 | 30 | 20 | 15 |
| 100 | 100 | 60 | 40 | 30 |
| 160 | 160 | 100 | 70 | 50 |

---

## 8. Slot Power Scaling

Each slot has 3 upgradeable stats. Combined with module stats for final power.

### Slot Stat Formulas

```javascript
// Damage multiplier from slot
slotDamageMultiplier = 1 + (slotDamageLevel * 0.01);

// Attack speed multiplier from slot
slotAttackSpeedMultiplier = 1 + (slotAttackSpeedLevel * 0.01);

// Cooldown reduction from slot (capped at 90%)
slotCDR = Math.min(slotCDRLevel * 0.01, 0.90);
```

### Example: Level 50 Slot

| Stat | Level | Effect |
|------|-------|--------|
| Damage | 50 | +50% damage |
| Attack Speed | 50 | +50% fire rate |
| CDR | 50 | -50% skill cooldowns |

**Machine Gun in Level 50 Slot:**
- Base: 7.5 damage @ 0.15s = 50 DPS
- With slot: 11.25 damage @ 0.1s = 112.5 DPS

---

## 9. Module Rarity Stat Ranges

| Rarity | # Stats | Roll Range | Total Bonus Range |
|--------|---------|------------|-------------------|
| Uncommon | 1 | 1-5% | 1-5% |
| Rare | 2 | 3-8% | 6-16% |
| Epic | 3 | 5-12% | 15-36% |
| Legendary | 4 | 8-15% | 32-60% |

---

## 10. Drop Rate Scaling

### Module Drop Rates

```javascript
function getModuleDropChance(tankLevel, enemyType) {
  const baseChance = {
    fodder: 0.01,      // 1%
    elite: 0.05,       // 5%
    superElite: 1.0,   // 100% (guaranteed)
    boss: 1.0          // 100% (guaranteed)
  };

  // Level bonus: +0.1% per 10 levels
  const levelBonus = Math.floor(tankLevel / 10) * 0.001;

  return Math.min(baseChance[enemyType] + levelBonus, 0.25);
}
```

### Rarity Distribution (When Drop Occurs)

```javascript
function rollRarity(tankLevel) {
  const roll = Math.random() * 100;

  // Base rates shift with level
  const legendaryChance = 0.05 + (tankLevel / 10) * 0.05;  // 0.05% to 0.85%
  const epicChance = 0.5 + (tankLevel / 10) * 0.2;         // 0.5% to 3.7%
  const rareChance = 3 + (tankLevel / 10) * 0.5;           // 3% to 11%
  const uncommonChance = 10 + (tankLevel / 10) * 1;        // 10% to 26%

  if (roll < legendaryChance) return 'legendary';
  if (roll < legendaryChance + epicChance) return 'epic';
  if (roll < legendaryChance + epicChance + rareChance) return 'rare';
  if (roll < legendaryChance + epicChance + rareChance + uncommonChance) return 'uncommon';
  return null; // No drop
}
```

---

## 11. Gold Economy Balance

### Target Progression Times

| Milestone | Target Time | Gold Needed | Gold/Hour Required |
|-----------|-------------|-------------|-------------------|
| Slot 2 | 30 min | 10,000 | 20,000 |
| Slot 3 | 2 hours | 50,000 | 25,000 |
| Beat Act 4 | 4 hours | - | - |
| Slot 4 | 8 hours | 500,000 | 62,500 |
| Beat Act 8 | 15 hours | - | - |
| Slot 5 | 30 hours | 2,000,000 | 66,666 |

### Gold Per Hour by Act (Estimated)

| Act | Kills/Hour | Avg Gold/Kill | Gold/Hour |
|-----|------------|---------------|-----------|
| 1 | 600 | 3 | 1,800 |
| 2 | 550 | 5 | 2,750 |
| 3 | 500 | 8 | 4,000 |
| 4 | 450 | 12 | 5,400 |
| 5 | 400 | 20 | 8,000 |
| 6 | 350 | 30 | 10,500 |
| 7 | 300 | 48 | 14,400 |
| 8 | 250 | 75 | 18,750 |

> **Note:** Wave clears and zone clears add significant bonus gold on top of kills.

---

## 12. XP Economy Balance

### Target Level Progression

| Act | Entry Level | Exit Level | Hours in Act |
|-----|-------------|------------|--------------|
| 1 | 1 | 10 | 0.5 |
| 2 | 10 | 20 | 1.0 |
| 3 | 20 | 35 | 1.5 |
| 4 | 35 | 50 | 2.0 |
| 5 | 50 | 70 | 3.0 |
| 6 | 70 | 95 | 4.0 |
| 7 | 95 | 125 | 5.0 |
| 8 | 125 | 160 | 8.0+ |

---

## 13. Combat Pacing

### Damage-Per-Second Targets

Player should kill fodder in 2-4 seconds, elites in 10-15 seconds.

| Act | Player DPS Needed | Fodder TTK | Elite TTK |
|-----|-------------------|------------|-----------|
| 1 | 25 | 2s | 12s |
| 2 | 45 | 2s | 12s |
| 3 | 80 | 2s | 12s |
| 4 | 145 | 2s | 12s |
| 5 | 250 | 2s | 12s |
| 6 | 450 | 2s | 12s |
| 7 | 800 | 2s | 12s |
| 8 | 1,450 | 2s | 12s |

### Enemy DPS vs Tank

Tank should lose ~5-10% HP per wave (before Near Death).

```javascript
// Incoming DPS calculation
function getIncomingDPS(act, enemyCount) {
  const baseDPS = 5 * act;  // Roughly 5 DPS per act per enemy
  return baseDPS * enemyCount;
}

// Tank should have enough HP + regen to survive 7 waves
// Approximately: Tank HP = Act * 100 + (Act^2 * 10)
```

---

## 14. Boss HP Reference

| Boss | Act | Base HP | Uber HP (3x) |
|------|-----|---------|--------------|
| Corrupted Sentinel | 1 | 10,000 | 30,000 |
| Gargoyle | 2 | 25,000 | 75,000 |
| Siege Beast | 3 | 50,000 | 150,000 |
| Tunnel Wyrm | 4 | 100,000 | 300,000 |
| Hell Beast | 5 | 200,000 | 600,000 |
| The Infernal | 6 | 400,000 | 1,200,000 |
| Void Dragon | 7 | 750,000 | 2,250,000 |
| Diaboros | 8 | 1,500,000 | 4,500,000 |

---

## 15. Implementation Constants

Add to `src/config/GameConfig.ts`:

```typescript
export const BALANCE = {
  // Base fodder stats (Act 1)
  FODDER_BASE_HP: 50,
  FODDER_BASE_DAMAGE: 5,
  FODDER_BASE_SPEED: 80,
  FODDER_BASE_XP: 5,
  FODDER_BASE_GOLD: 2,

  // Base elite stats (Act 1)
  ELITE_BASE_HP: 300,
  ELITE_BASE_DAMAGE: 15,
  ELITE_BASE_XP: 35,
  ELITE_BASE_GOLD: 25,

  // Scaling exponents
  ACT_HP_SCALE: 1.8,      // HP multiplies by this per act
  ACT_DAMAGE_SCALE: 1.4,  // Damage multiplies by this per act
  ACT_GOLD_SCALE: 1.6,    // Gold multiplies by this per act
  ACT_XP_SCALE: 1.5,      // XP multiplies by this per act

  // Zone within act
  ZONE_2_MULTIPLIER: 1.25,

  // Wave within zone
  WAVE_SCALE_PER_WAVE: 0.05, // +5% per wave

  // Module power
  SLOT_DAMAGE_PER_LEVEL: 0.01,   // +1% per level
  SLOT_SPEED_PER_LEVEL: 0.01,    // +1% per level
  SLOT_CDR_PER_LEVEL: 0.01,      // +1% per level (cap 90%)
  SLOT_CDR_CAP: 0.90,

  // Tank built-in cannon
  CANNON_BASE_DAMAGE: 80,
  CANNON_DAMAGE_PER_LEVEL: 5,
  CANNON_FIRE_RATE: 2500, // ms

  // Drop rates
  MODULE_DROP_FODDER: 0.01,
  MODULE_DROP_ELITE: 0.05,
  MODULE_DROP_SUPER_ELITE: 1.0,
  MODULE_DROP_BOSS: 1.0,
};
```

---

## Changelog

### v1.0 - January 2025
- Initial balance guide based on Desktop Heroes patterns
- Defined base enemy stats for Act 1
- Created per-act scaling formulas
- Established gold/XP economy targets
- Added implementation constants
