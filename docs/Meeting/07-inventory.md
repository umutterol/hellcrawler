# Inventory System

This document covers equipment, item storage, chest categories, and the crafting table.

## Inventory Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY SYSTEM                              │
└─────────────────────────────────────────────────────────────────┘

                    inventoryStore
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────┐         ┌───────────┐         ┌──────────┐
│ chests  │         │ autoSlots │         │ version  │
│ (items) │         │ (skills)  │         │          │
└─────────┘         └───────────┘         └──────────┘
    │
    ├── shared (main inventory)
    ├── backpack (character-specific)
    ├── gear (equipped items)
    ├── skill_bar (active skills)
    ├── crafting_table (in-progress)
    └── ... (21 categories total)
```

## Chest Categories

| Chest ID | Purpose | Shared |
|----------|---------|--------|
| `shared` | Main inventory, all items | Yes |
| `backpack` | Character-specific storage | No |
| `gear` | Equipped items | No |
| `skill_bar` | Active skill slots | No |
| `crafting_table` | Items being crafted | Yes |
| `fairy` | Fairy items | Yes |
| `quest` | Quest items | Yes |
| `junk` | Items for selling | Yes |

## Equipment System

### Equipment Slots

```
┌─────────────────────────────────────────────────────────────────┐
│                    EQUIPMENT SLOTS                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      CHARACTER                              ││
│  │                                                             ││
│  │        ┌────────┐                      ┌────────┐          ││
│  │        │ Weapon │                      │ Helmet │          ││
│  │        │  slot  │                      │  slot  │          ││
│  │        └────────┘                      └────────┘          ││
│  │                                                             ││
│  │   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ││
│  │   │ Ring 1 │    │ Armor  │    │ Armor  │    │ Ring 2 │    ││
│  │   │  slot  │    │ (body) │    │ (legs) │    │  slot  │    ││
│  │   └────────┘    └────────┘    └────────┘    └────────┘    ││
│  │                                                             ││
│  │                      ┌────────┐                            ││
│  │                      │ Boots  │                            ││
│  │                      │  slot  │                            ││
│  │                      └────────┘                            ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Equipment Item Structure

```json
{
  "warrior_weapon_4": {
    "key": "warrior_weapon_4",
    "name": "weapon_sword_4",
    "description": "weapon_sword_4_description",
    "type": "equipment",
    "slot": "weapon",
    "icon": "weapon_sword_4",
    "class": [
      "item_class:weapon",
      "item_class:warrior",
      "item_class:equippable"
    ],
    "stats": {
      "entity_stat_attack": 5.5,
      "entity_stat_agility": 1.2
    },
    "requirements": {
      "level": 20,
      "class": "warrior"
    }
  }
}
```

### Stat Multipliers from Equipment

```javascript
// Equipment stat calculation
const calculateEquipmentStats = (character) => {
  const equippedItems = inventoryStore.chests.gear;
  const totalStats = { ...baseStats };

  for (const item of equippedItems) {
    for (const [stat, multiplier] of Object.entries(item.stats)) {
      totalStats[stat] = (totalStats[stat] || 1) * multiplier;
    }
  }

  return totalStats;
};

// Example with equipment from save:
// warrior_weapon_4: attack = 5.5x
// warrior_armor_7: defense = 5.8x
// ring_15: vampiric = 1.54x
```

## Item Types

### Item Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                    ITEM CLASSES                                  │
│                                                                  │
│  item_class:stackable                                            │
│  ├── Can have multiple of same item                              │
│  └── Uses "amount" field                                         │
│                                                                  │
│  item_class:consumable                                           │
│  ├── Used on activation                                          │
│  ├── Has cooldown                                                │
│  └── Reduces amount by 1                                         │
│                                                                  │
│  item_class:equippable                                           │
│  ├── Can be equipped to gear slot                                │
│  ├── Provides stat bonuses                                       │
│  └── Unique (not stackable)                                      │
│                                                                  │
│  item_class:ingredient                                           │
│  ├── Used in crafting recipes                                    │
│  └── Consumed when crafting                                      │
│                                                                  │
│  item_class:craftable                                            │
│  ├── Can be created via crafting                                 │
│  └── Has "buy" field with recipe                                 │
│                                                                  │
│  item_class:skill_bar                                            │
│  ├── Can be placed in skill bar                                  │
│  └── Usable during combat                                        │
│                                                                  │
│  item_class:pet_item                                             │
│  ├── Can be used by fairy/pet                                    │
│  └── Automatic usage                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Item Examples

#### Consumable (Health Potion)

```json
{
  "item:hp_pot_1": {
    "key": "item:hp_pot_1",
    "name": "item_hp_pot_1",
    "description": "item_hp_pot_description",
    "displayValue": "1000",
    "order": 1,
    "type": "number",
    "icon": "hp_pot_1",
    "class": [
      "item_class:hp_pot",
      "item_class:consumable",
      "item_class:stackable",
      "item_class:craftable",
      "item_class:pet_item",
      "item_class:skill_bar"
    ],
    "defaultChestType": "shared",
    "cooldown": 3000,
    "consume": {
      "skill": {
        "type": "skill_healing",
        "directCast": true,
        "characterAnimation": ["greet"],
        "impact": 1000,
        "triggerRange": null,
        "affectRange": null,
        "audio": "heal",
        "icon": "effect_heal"
      }
    },
    "amount": 50
  }
}
```

#### Ingredient (Red Herb)

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

## Skill Bar System

### Skill Bar Configuration

```json
// autoSlots structure
{
  "warrior_skill_bar": [false, true, false],
  "hunter_skill_bar": [],
  "assassin_skill_bar": [],
  "wizard_skill_bar": []
}
```

The boolean array indicates auto-use for each slot:
- `false`: Manual activation only
- `true`: Automatic use when available

### Skill Bar Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL BAR FLOW                                │
└─────────────────────────────────────────────────────────────────┘

    Inventory                Skill Bar               Combat
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ HP Potion x50 │ ───>  │ [Slot 1]      │ ───>  │ Use potion    │
│ (drag/drop)   │       │ Cooldown: 3s  │       │ Heal 1000 HP  │
└───────────────┘       └───────────────┘       └───────────────┘
                               │
                               ▼
                        ┌───────────────┐
                        │ Auto-use?     │
                        │ If autoSlot[0]│
                        │ = true        │
                        └───────────────┘
```

## Crafting Table

### Crafting Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRAFTING FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

    Select Recipe          Check Materials         Craft
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ HP Potion Tier 1│ -> │ 2x Red Herb?   │ -> │ Consume herbs   │
│                 │    │ Check inventory │    │ Create potion   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              │ No materials           │
                              ▼                        ▼
                       ┌─────────────┐         ┌─────────────┐
                       │ Show error  │         │ Add to      │
                       │ "Need more" │         │ shared chest│
                       └─────────────┘         └─────────────┘
```

### Recipe Example

```json
{
  "item:hp_pot_1": {
    "buy": {
      "item:red_herb": 2
    }
  },
  "item:hp_pot_2": {
    "buy": {
      "item:red_herb": 3,
      "item:yellow_herb": 1
    }
  },
  "item:hp_pot_3": {
    "buy": {
      "item:red_herb": 5,
      "item:blue_herb": 2
    }
  }
}
```

## Auto-Equip System

### Auto-Equip Logic

```javascript
// Auto-equip when picking up equipment (conceptual)
const autoEquip = (newItem, character) => {
  const slot = newItem.slot;
  const currentItem = getEquippedItem(character, slot);

  if (!currentItem) {
    // Slot empty, equip directly
    equipItem(character, newItem);
    return;
  }

  // Compare stats
  const newPower = calculateItemPower(newItem);
  const currentPower = calculateItemPower(currentItem);

  if (newPower > currentPower) {
    // New item is better
    unequipItem(character, currentItem);
    equipItem(character, newItem);
    moveToInventory(currentItem);
  } else {
    // Keep current, store new
    moveToInventory(newItem);
  }
};
```

## Inventory UI Operations

### Drag and Drop

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRAG & DROP OPERATIONS                        │
│                                                                  │
│  Inventory → Gear Slot                                           │
│  └── Equip item (if requirements met)                           │
│                                                                  │
│  Gear Slot → Inventory                                           │
│  └── Unequip item                                                │
│                                                                  │
│  Inventory → Skill Bar                                           │
│  └── Assign consumable to slot                                   │
│                                                                  │
│  Inventory → Trash                                               │
│  └── Destroy item (with confirmation)                           │
│                                                                  │
│  Inventory → Sell Area                                           │
│  └── Sell item for gold                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Item Stacking

```javascript
// Stack same items (conceptual)
const addToInventory = (item, chest) => {
  if (item.class.includes('item_class:stackable')) {
    // Find existing stack
    const existing = chest.find(i => i.key === item.key);

    if (existing) {
      existing.amount += item.amount;
      return;
    }
  }

  // Add as new item
  chest.push(item);
};
```

## Cooldown System

### Item Cooldowns

```json
// itemCooldowns in progressStore
{
  "item:hp_pot_1": 1704067200000,
  "item:skill_attack": 1704067205000
}
```

### Cooldown Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COOLDOWN FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

    Use Item               Start Cooldown          Available
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Click HP Pot  │ ---> │ Save timestamp│ ---> │ After 3s      │
│               │      │ + cooldown    │      │ Can use again │
└───────────────┘      └───────────────┘      └───────────────┘
         │                    │
         │                    ▼
         │             ┌───────────────┐
         │             │ Show cooldown │
         │             │ overlay on UI │
         │             └───────────────┘
         │
         ▼
   [Item effect triggers]
```

## Sorting and Filtering

### Sort Options

| Sort By | Description |
|---------|-------------|
| Type | Group by item type |
| Rarity | Legendary → Common |
| Value | Highest value first |
| Recent | Newest acquisitions |
| Name | Alphabetical |

### Filter Options

| Filter | Description |
|--------|-------------|
| Class | Warrior/Hunter/etc. |
| Type | Weapon/Armor/Consumable |
| Rarity | Filter by rarity tier |
| Equipped | Show only equipped |

## Related Documentation

- [03-state-management.md](./03-state-management.md) - inventoryStore schema
- [04-combat-system.md](./04-combat-system.md) - Equipment stats in combat
- [06-economy.md](./06-economy.md) - Crafting and selling
- [09-ui-system.md](./09-ui-system.md) - Inventory UI components
