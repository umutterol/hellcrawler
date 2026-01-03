# Progression System

This document covers character leveling, map difficulty scaling, and long-term progression mechanics.

## Progression Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROGRESSION LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

    Layer 1: Character Level
    ├── Gain XP from kills
    ├── Level up → Unlock stat points
    └── Max level: 100+

    Layer 2: Map Difficulty
    ├── Each map has difficulty 1-50
    ├── Higher difficulty = stronger enemies
    └── Better rewards at higher difficulty

    Layer 3: Equipment Power
    ├── Find/craft better gear
    ├── Equipment provides stat multipliers
    └── Exponential power scaling

    Layer 4: Companion Systems
    ├── Fairy companion (separate progression)
    └── Sidekicks (up to 3 active)
```

## Character Leveling

### XP to Level Curve

```
┌─────────────────────────────────────────────────────────────────┐
│                    XP REQUIREMENTS                               │
│                                                                  │
│  Level │ XP Required │ Total XP    │ Notes                      │
│  ──────┼─────────────┼─────────────┼──────────────────────────  │
│    1   │      0      │      0      │ Starting level             │
│    5   │    500      │   1,250     │                            │
│   10   │  1,500      │   7,500     │                            │
│   25   │  6,250      │  78,125     │                            │
│   50   │ 25,000      │ 625,000     │ Mid-game milestone         │
│   75   │ 56,250      │ 2.1M        │                            │
│   96   │ 92,160      │ 4.4M        │ Example character level    │
│  100   │100,000      │ 5.0M        │ Soft cap                   │
└─────────────────────────────────────────────────────────────────┘
```

### Level-Up Formula

```javascript
// XP required for next level (conceptual)
const xpForLevel = (level) => {
  // Quadratic scaling
  return Math.floor(level * level * 10);
};

// Check level up
const checkLevelUp = (character) => {
  while (character.exp >= xpForLevel(character.level + 1)) {
    character.exp -= xpForLevel(character.level + 1);
    character.level++;

    // Apply level-up bonuses
    character.maxHealth += 100;
    character.baseAttack += 1;

    // Trigger level-up event
    events.emit('levelUp', character);
  }
};
```

### Level-Up Rewards

```
┌─────────────────────────────────────────────────────────────────┐
│                   LEVEL UP REWARDS                               │
│                                                                  │
│  Every Level:                                                    │
│  ├── +100 Max Health                                            │
│  ├── +1 Base Attack                                             │
│  └── +0.5 Base Defense                                          │
│                                                                  │
│  Every 5 Levels:                                                 │
│  ├── Unlock new skill slot                                      │
│  └── Bonus stat points                                          │
│                                                                  │
│  Every 10 Levels:                                                │
│  ├── Unlock new map                                             │
│  └── Equipment tier upgrade                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Map Progression

### Available Maps

| Map | ID | Starting Difficulty | Max Difficulty | Unlock Level |
|-----|-----|---------------------|----------------|--------------|
| Forest | `map:forest` | 1 | 50 | 1 |
| Desert | `map:desert` | 1 | 50 | 5 |
| Jungle | `map:jungle` | 1 | 50 | 10 |
| Water | `map:water` | 1 | 50 | 15 |
| Village | `map:village` | 1 | 50 | 20 |
| Graveyard | `map:graveyard` | 1 | 50 | 25 |
| Swamp | `map:swamp` | 1 | 50 | 30 |
| Castle | `map:castle` | 1 | 50 | 40 |
| Dungeon | `map:dungeon` | 1 | 50 | 50 |
| Cave | `map:cave` | 1 | 50 | 60 |
| Inferno | `map:inferno` | 1 | 50 | 70 |
| Snow | `map:snow` | 1 | 50 | 80 |
| Mountain | `map:mountain` | 1 | 50 | 90 |

### Difficulty Scaling

```javascript
// Difficulty affects enemy stats
const getDifficultyMultiplier = (difficulty) => ({
  health: 1 + (difficulty - 1) * 0.5,    // +50% per level
  damage: 1 + (difficulty - 1) * 0.3,    // +30% per level
  gold: 1 + (difficulty - 1) * 0.4,      // +40% per level
  exp: 1 + (difficulty - 1) * 0.35,      // +35% per level
  dropRate: 1 + (difficulty - 1) * 0.1   // +10% per level
});

// Example: Difficulty 50
// health: 25.5x, damage: 15.7x, gold: 20.6x, exp: 18.15x
```

### Map Progress Tracking

```json
// progressStore.map structure
{
  "char_edric": {
    "map:forest": {
      "difficulty": 50,      // Current difficulty
      "maxDifficulty": 50,   // Highest reached
      "killCount": 3003,     // Total kills on this map
      "distance": 15420      // Total distance walked (pixels)
    },
    "map:desert": {
      "difficulty": 1,
      "maxDifficulty": 50,
      "killCount": 2,
      "distance": 100
    }
  }
}
```

### Difficulty Advancement

```
┌─────────────────────────────────────────────────────────────────┐
│                 DIFFICULTY ADVANCEMENT                           │
└─────────────────────────────────────────────────────────────────┘

    Kill enemies            Reach boss              Defeat boss
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Progress bar    │ -> │ Boss spawns     │ -> │ Difficulty + 1  │
│ fills           │    │ at map end      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                            │
         │                                            ▼
         │                                   ┌─────────────────┐
         └─────────────────────────────────> │ Map resets to   │
                 Continue farming            │ start position  │
                                             └─────────────────┘
```

## Fairy Companion System

### Fairy Progression

```json
// gameStore fairy data
{
  "fairyActive": true,
  "fairyLevel": 3,
  "fairyThreshold": 40
}
```

### Fairy Abilities

```
┌─────────────────────────────────────────────────────────────────┐
│                    FAIRY LEVELS                                  │
│                                                                  │
│  Level 1: Basic collection                                       │
│  ├── Auto-collect gold drops                                    │
│  └── Small gold bonus (+5%)                                     │
│                                                                  │
│  Level 2: Enhanced collection                                    │
│  ├── Auto-collect items                                         │
│  └── Gold bonus (+10%)                                          │
│                                                                  │
│  Level 3: Combat assist                                          │
│  ├── Occasional attacks                                         │
│  └── Gold bonus (+15%)                                          │
│                                                                  │
│  Level 4+: Advanced abilities                                    │
│  ├── More frequent attacks                                      │
│  ├── Status effect applications                                 │
│  └── Higher gold/drop bonuses                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Sidekick System

### Sidekick Configuration

```json
// gameStore sidekick data
{
  "sideKicks": [],
  "sideKicksLimit": 3
}
```

### Sidekick Mechanics

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIDEKICK SYSTEM                               │
│                                                                  │
│  Main Character                                                  │
│       │                                                          │
│       ├── Sidekick 1 (unlocked at level 20)                     │
│       │   └── Fights alongside, shares XP                       │
│       │                                                          │
│       ├── Sidekick 2 (unlocked at level 40)                     │
│       │   └── Additional DPS/support                            │
│       │                                                          │
│       └── Sidekick 3 (unlocked at level 60)                     │
│           └── Full party of 4                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Power Scaling

### Exponential Growth

The game features exponential power scaling typical of idle games:

```
┌─────────────────────────────────────────────────────────────────┐
│                   POWER CURVE                                    │
│                                                                  │
│  Damage │                                              ▲        │
│         │                                           ▲▲▲         │
│         │                                        ▲▲▲            │
│         │                                     ▲▲▲               │
│         │                                  ▲▲▲                  │
│         │                              ▲▲▲▲                     │
│         │                          ▲▲▲▲                         │
│         │                     ▲▲▲▲▲                             │
│         │               ▲▲▲▲▲▲                                  │
│         │         ▲▲▲▲▲▲                                        │
│         │   ▲▲▲▲▲▲                                              │
│         ▲▲▲▲                                                    │
│         └───────────────────────────────────────────────────    │
│                              Level                               │
│                                                                  │
│  Growth Sources:                                                 │
│  1. Base stat growth (linear)                                    │
│  2. Equipment multipliers (multiplicative)                       │
│  3. Skill bonuses (additive then multiplicative)                │
│  4. Fairy/sidekick bonuses (multiplicative)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Example Power Breakdown

```javascript
// Level 96 character example (from save file)
const characterPower = {
  // Base stats
  baseAttack: 1,
  baseDefense: 1,

  // Stat multipliers from levels/equipment
  stats: {
    attack: 81,      // 81x damage multiplier
    defense: 5,      // 5x defense multiplier
    agility: 9       // 9x attack speed
  },

  // Equipment bonuses (conceptual)
  equipment: {
    weapon: { attack: 5.5 },    // warrior_weapon_4
    armor: { defense: 5.8 },    // warrior_armor_7
    ring: { vampiric: 1.54 }    // ring_15
  },

  // Calculated final stats
  finalAttack: 1 * 81 * 5.5,     // = 445.5
  finalDefense: 1 * 5 * 5.8,     // = 29
  attackSpeed: 1 * 9              // = 9 attacks/second
};
```

## Prestige/Reset Systems

While not explicitly visible in the save data, idle games typically feature:

```
┌─────────────────────────────────────────────────────────────────┐
│               POTENTIAL PRESTIGE LAYERS                          │
│                                                                  │
│  Layer 1: Character Prestige                                     │
│  ├── Reset character level                                       │
│  ├── Keep permanent bonuses                                      │
│  └── Unlock new character classes                                │
│                                                                  │
│  Layer 2: World Prestige                                         │
│  ├── Reset all map progress                                      │
│  ├── Keep equipment/inventory                                    │
│  └── Unlock new worlds/biomes                                    │
│                                                                  │
│  Layer 3: Full Reset                                             │
│  ├── Reset everything                                            │
│  ├── Gain prestige currency                                      │
│  └── Permanent multipliers                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Achievements

Likely tracked via Steam integration:

- Character milestones (level 10, 25, 50, 100)
- Map completion (clear all difficulties)
- Kill count milestones
- Gold earned milestones
- Equipment collection

## Related Documentation

- [03-state-management.md](./03-state-management.md) - Progress data storage
- [04-combat-system.md](./04-combat-system.md) - XP from combat
- [06-economy.md](./06-economy.md) - Gold rewards
- [12-platform.md](./12-platform.md) - Steam achievements
