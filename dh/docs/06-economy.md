# Economy System

This document covers currencies, resource generation, crafting materials, and economic balancing.

## Currency Types

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENCIES                                   │
└─────────────────────────────────────────────────────────────────┘

    PRIMARY CURRENCIES
    ├── Gold (main currency)
    │   ├── Source: Enemy kills, selling items
    │   └── Use: Equipment, upgrades, crafting
    │
    └── Experience (XP)
        ├── Source: Enemy kills, quests
        └── Use: Character leveling

    SECONDARY CURRENCIES
    ├── Fairy Points
    │   ├── Source: Special activities
    │   └── Use: Fairy upgrades
    │
    └── Dice (multiple tiers)
        ├── Source: Random drops
        └── Use: Gambling/rerolling
```

## Gold Economy

### Sources of Gold

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOLD SOURCES                                  │
│                                                                  │
│  Enemy Kills (Primary)                                           │
│  ├── Base drop: 10-100 gold per enemy                           │
│  ├── Modified by: gold_income stat                               │
│  ├── Modified by: difficulty multiplier                          │
│  └── Modified by: fairy bonus                                    │
│                                                                  │
│  Selling Items (Secondary)                                       │
│  ├── Junk items: 10-50 gold                                      │
│  ├── Common items: 100-500 gold                                  │
│  ├── Rare items: 500-2000 gold                                   │
│  └── Modified by: charisma stat                                  │
│                                                                  │
│  Boss Kills (Bonus)                                              │
│  ├── 10x normal enemy gold                                       │
│  └── Guaranteed item drop                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Gold Tracking

```json
// progressStore.goldEarned
{
  "total": 436800000,    // ~437M total gold earned
  "kill": 400000000,     // 400M from kills (92%)
  "sell": 36800000       // 37M from selling (8%)
}
```

### Gold Sinks

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOLD SINKS                                    │
│                                                                  │
│  Equipment Purchase                                              │
│  ├── Weapons: 1,000 - 1,000,000 gold                            │
│  ├── Armor: 500 - 500,000 gold                                  │
│  └── Accessories: 2,000 - 2,000,000 gold                        │
│                                                                  │
│  Crafting Costs                                                  │
│  ├── Potion crafting: 100 gold + materials                      │
│  └── Equipment upgrades: scaling gold cost                       │
│                                                                  │
│  Skill Purchases                                                 │
│  ├── Basic skills: 5,000 gold                                   │
│  ├── Advanced skills: 50,000 gold                               │
│  └── Ultimate skills: 500,000 gold                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Crafting Materials

### Material Types

| Material | Icon | Rarity | Source |
|----------|------|--------|--------|
| Red Herb | `red_herb` | Common | Enemy drops |
| Yellow Herb | `yellow_herb` | Common | Enemy drops |
| Blue Herb | `blue_herb` | Uncommon | Enemy drops |
| Magic Orb | `magic_orb` | Rare | Boss drops |
| Dice (1-8) | `dice_*` | Various | Random drops |

### Material Example

```json
{
  "item:red_herb": {
    "key": "item:red_herb",
    "name": "item_red_herb",
    "description": "item_red_herb_description",
    "type": "number",
    "icon": "red_herb",
    "class": [
      "item_class:stackable",
      "item_class:ingredient"
    ],
    "defaultChestType": "shared",
    "amount": 1035
  }
}
```

## Crafting System

### Recipe Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRAFTING RECIPES                              │
│                                                                  │
│  Health Potion Tier 1                                            │
│  ├── Input: 2x Red Herb                                          │
│  ├── Output: 1x HP Potion (heals 1000)                          │
│  └── Cooldown: 3 seconds                                         │
│                                                                  │
│  Health Potion Tier 2                                            │
│  ├── Input: 3x Red Herb + 1x Yellow Herb                        │
│  ├── Output: 1x HP Potion (heals 2500)                          │
│  └── Cooldown: 3 seconds                                         │
│                                                                  │
│  Health Potion Tier 3                                            │
│  ├── Input: 5x Red Herb + 2x Blue Herb                          │
│  ├── Output: 1x HP Potion (heals 5000)                          │
│  └── Cooldown: 3 seconds                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Crafting Flow

```
    Materials              Crafting Table           Output
┌───────────────┐      ┌─────────────────┐      ┌───────────────┐
│ 2x Red Herb   │ ---> │ Recipe check    │ ---> │ HP Potion x1  │
│ (from shared) │      │ Consume inputs  │      │ (to shared)   │
└───────────────┘      └─────────────────┘      └───────────────┘
```

## Drop System

### Drop Rate Calculation

```javascript
// Item drop calculation (conceptual)
const calculateDrop = (enemy, character) => {
  const baseDropRate = enemy.dropRate || 0.1; // 10% base
  const dropModifier = character.stats.drop_rate;
  const difficultyBonus = 1 + (difficulty - 1) * 0.1;

  const finalDropRate = baseDropRate * dropModifier * difficultyBonus;

  if (Math.random() < finalDropRate) {
    return generateDrop(enemy.lootTable);
  }
  return null;
};

// Loot table selection
const generateDrop = (lootTable) => {
  const roll = Math.random();
  let cumulative = 0;

  for (const [item, weight] of Object.entries(lootTable)) {
    cumulative += weight;
    if (roll < cumulative) {
      return item;
    }
  }
};
```

### Loot Tables

```javascript
// Example loot table structure
const LOOT_TABLES = {
  slime: {
    'item:red_herb': 0.4,      // 40%
    'item:yellow_herb': 0.2,   // 20%
    'gold_small': 0.3,         // 30%
    'nothing': 0.1             // 10%
  },

  boss_slime: {
    'item:magic_orb': 0.5,     // 50%
    'weapon_common': 0.3,      // 30%
    'gold_large': 0.2          // 20%
    // Bosses always drop something
  }
};
```

## Economic Balance

### Gold Generation Rate

```
┌─────────────────────────────────────────────────────────────────┐
│               GOLD PER HOUR ESTIMATES                            │
│                                                                  │
│  Difficulty │ Kills/Hour │ Gold/Kill │ Gold/Hour                │
│  ───────────┼────────────┼───────────┼────────────              │
│       1     │    500     │    50     │    25,000                │
│      10     │    400     │   250     │   100,000                │
│      25     │    300     │   750     │   225,000                │
│      50     │    200     │  2,000    │   400,000                │
│                                                                  │
│  Notes:                                                          │
│  - Higher difficulty = harder enemies = slower kills            │
│  - But reward scaling outpaces difficulty                        │
│  - Optimal farming depends on kill speed                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Price Scaling

Equipment prices scale exponentially with tier:

```javascript
const equipmentPrice = (baseTier) => {
  return Math.floor(1000 * Math.pow(2.5, baseTier));
};

// Examples:
// Tier 1: 1,000 gold
// Tier 5: 97,656 gold
// Tier 10: 9,536,743 gold
// Tier 15: 931,322,574 gold
```

## Dice System

### Dice Tiers

| Dice | Tier | Drop Rate | Use |
|------|------|-----------|-----|
| `dice_1` | 1 | Common | Small reroll |
| `dice_2` | 2 | Common | Small reroll |
| `dice_3` | 3 | Uncommon | Medium reroll |
| `dice_4` | 4 | Uncommon | Medium reroll |
| `dice_5` | 5 | Rare | Large reroll |
| `dice_6` | 6 | Rare | Large reroll |
| `dice_7` | 7 | Very Rare | Premium reroll |
| `dice_8` | 8 | Legendary | Maximum reroll |

### Dice Usage

```
┌─────────────────────────────────────────────────────────────────┐
│                    DICE MECHANICS                                │
│                                                                  │
│  Use Case 1: Equipment Reroll                                    │
│  ├── Consume dice                                                │
│  ├── Reroll equipment stats                                      │
│  └── Higher tier = better outcome range                          │
│                                                                  │
│  Use Case 2: Gambling                                            │
│  ├── Bet gold + dice                                             │
│  ├── Roll for multiplier                                         │
│  └── Risk/reward based on dice tier                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Stat Modifiers

### Income Stats

| Stat | Effect | Max |
|------|--------|-----|
| `gold_income` | Gold drop multiplier | 10x |
| `exp_income` | XP gain multiplier | 10x |
| `drop_rate` | Item drop multiplier | 5x |
| `dice_rate` | Dice drop chance | 3x |
| `charisma` | Sell price multiplier | 2x |

### Example Calculation

```javascript
// Gold from kill with modifiers
const goldFromKill = (baseGold, character, difficulty) => {
  let gold = baseGold;

  // Apply gold_income stat
  gold *= character.stats.gold_income;

  // Apply difficulty multiplier
  gold *= 1 + (difficulty - 1) * 0.4;

  // Apply fairy bonus (if active)
  if (gameStore.fairyActive) {
    gold *= 1 + gameStore.fairyLevel * 0.05;
  }

  return Math.floor(gold);
};
```

## Economy Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECONOMY FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

    ┌───────────┐
    │  COMBAT   │
    └─────┬─────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌───────┐   ┌───────┐
│ GOLD  │   │ ITEMS │
└───┬───┘   └───┬───┘
    │           │
    │     ┌─────┴─────┐
    │     ▼           ▼
    │ ┌───────┐   ┌───────┐
    │ │ EQUIP │   │ SELL  │──────────┐
    │ └───┬───┘   └───────┘          │
    │     │                          │
    │     ▼                          │
    │ ┌───────────┐                  │
    │ │ STAT BOOST│                  │
    │ └───────────┘                  │
    │                                │
    ▼                                ▼
┌─────────────────────────────────────┐
│            GOLD POOL                │
└─────────────────────────────────────┘
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
┌────────┐   ┌──────────┐   ┌──────────┐
│ SHOP   │   │ CRAFTING │   │ UPGRADES │
│ (buy)  │   │ (recipes)│   │ (skills) │
└────────┘   └──────────┘   └──────────┘
```

## Related Documentation

- [04-combat-system.md](./04-combat-system.md) - Gold/XP from kills
- [05-progression.md](./05-progression.md) - Difficulty scaling
- [07-inventory.md](./07-inventory.md) - Item management
