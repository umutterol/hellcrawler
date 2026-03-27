# State Management

This document covers the game's state stores, save/load system, and data persistence.

## Store Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                            │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  gameStore    │    │inventoryStore │    │ progressStore │
│               │    │               │    │               │
│ • Characters  │    │ • Chests      │    │ • Map progress│
│ • Active char │    │ • Equipment   │    │ • Kill counts │
│ • Fairy data  │    │ • Skills      │    │ • Gold earned │
│ • Sidekicks   │    │ • Auto-slots  │    │ • Damage stats│
└───────────────┘    └───────────────┘    └───────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ settingsStore │
                    │               │
                    │ • Audio levels│
                    │ • Graphics    │
                    │ • Language    │
                    │ • Window size │
                    └───────────────┘
```

## Store Schemas

### gameStore

Manages character state and active selections:

```json
{
  "version": "2.4.1",
  "fairyActive": true,
  "fairyLevel": 3,
  "fairyThreshold": 40,
  "character": "char_edric",
  "sideKicks": [],
  "sideKicksLimit": 3,
  "characters": {
    "char_edric": {
      "location": "map:water",
      "level": 96,
      "exp": 120453,
      "health": 618669,
      "stats": {
        "entity_stat_attack": 81,
        "entity_stat_defense": 5,
        "entity_stat_agility": 9,
        "entity_stat_gold_income": 1,
        "entity_stat_exp_income": 1,
        "entity_stat_drop_rate": 1,
        "entity_stat_walk_speed": 1,
        "entity_stat_dice_rate": 1,
        "entity_stat_vampiric": 0,
        "entity_stat_dodge": 0,
        "entity_stat_health_regen": 0,
        "entity_stat_slow": 0,
        "entity_stat_burning": 0,
        "entity_stat_poison": 0,
        "entity_stat_shock": 0,
        "entity_stat_disarm": 0,
        "entity_stat_shield_break": 0,
        "entity_stat_cooldown_reduction": 1,
        "entity_stat_effect_duration": 1,
        "entity_stat_aoe_range": 1,
        "entity_stat_charisma": 1,
        "entity_stat_skill_replacement": 0
      }
    },
    "char_serewyn": { /* ... */ },
    "char_corin": { /* ... */ },
    "char_alaric": { /* ... */ }
  }
}
```

### inventoryStore

Manages items, equipment, and skill assignments:

```json
{
  "version": "2.4.1",
  "autoSlots": {
    "warrior_skill_bar": [false, true, false],
    "hunter_skill_bar": [],
    "assassin_skill_bar": [],
    "wizard_skill_bar": []
  },
  "chests": {
    "shared": [
      {
        "item:red_herb": {
          "key": "item:red_herb",
          "name": "item_red_herb",
          "description": "item_red_herb_description",
          "type": "number",
          "icon": "red_herb",
          "class": ["item_class:stackable", "item_class:ingredient"],
          "defaultChestType": "shared",
          "amount": 1035
        }
      },
      {
        "item:hp_pot_1": {
          "key": "item:hp_pot_1",
          "name": "item_hp_pot_1",
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
          "cooldown": 3000,
          "consume": {
            "skill": {
              "type": "skill_healing",
              "directCast": true,
              "impact": 1000
            }
          }
        }
      }
    ],
    "gear": [ /* equipped items */ ],
    "backpack": [ /* character-specific items */ ],
    "skill_bar": [ /* active skills */ ],
    "crafting_table": [ /* crafting in progress */ ]
  }
}
```

### progressStore

Tracks gameplay statistics and map completion:

```json
{
  "version": "2.4.1",
  "map": {
    "char_edric": {
      "map:forest": {
        "difficulty": 50,
        "maxDifficulty": 50,
        "killCount": 3003,
        "distance": 15420
      },
      "map:desert": {
        "difficulty": 1,
        "maxDifficulty": 50,
        "killCount": 2,
        "distance": 100
      }
    }
  },
  "damage": {
    "dealt": 19800000000,
    "received": 436800000,
    "healed": 12500000
  },
  "kill": {
    "total": 2917,
    "byMob": {
      "slime": 450,
      "orc": 320,
      "skeleton": 280
    },
    "byCharacter": {
      "char_edric": 2900,
      "char_serewyn": 17
    },
    "bySkill": {
      "melee": 2639,
      "swipe": 257,
      "projectile": 21
    }
  },
  "goldEarned": {
    "total": 436800000,
    "kill": 400000000,
    "sell": 36800000
  },
  "itemCooldowns": {},
  "skillUse": {},
  "itemUse": {}
}
```

### settingsStore

Stores user preferences:

```json
{
  "version": "2.4.1",
  "audio": {
    "sfxVolume": 0.8,
    "musicVolume": 0.5,
    "muted": false
  },
  "graphics": {
    "quality": "high",
    "particles": true,
    "shaders": true
  },
  "window": {
    "sizeStep": 6,
    "display": 0,
    "clickThrough": false
  },
  "language": "en",
  "showTutorial": false
}
```

## Save File Format

### File Structure

Save files use the `.pxt` extension and are Base64-encoded JSON:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SAVE FILE FORMAT                             │
└─────────────────────────────────────────────────────────────────┘

    Raw JSON                    Base64 Encoded              File
┌─────────────┐              ┌─────────────────┐       ┌──────────┐
│ {           │   encode()   │ eyJwdHgiOjMyODY │  -->  │ save-    │
│   "ptx":...,│  ────────>   │ 1nViYTp4y...    │       │ data-    │
│   "game...  │              │                 │       │ 96.pxt   │
│ }           │              └─────────────────┘       └──────────┘
└─────────────┘
```

### Encoding/Decoding

```javascript
// Save file structure
const saveData = {
  ptx: Date.now(),  // Save timestamp
  gameStore: { /* ... */ },
  inventoryStore: { /* ... */ },
  progressStore: { /* ... */ },
  settingsStore: { /* ... */ }
};

// Encode to save
const encoded = btoa(JSON.stringify(saveData));
fs.writeFileSync('save/save-data-96.pxt', encoded);

// Decode to load
const decoded = JSON.parse(atob(fs.readFileSync('save/save-data-96.pxt')));
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

    Game Action              Store Update             Persistence
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ Enemy killed    │ ---> │ progressStore   │ --> │ Auto-save       │
│                 │      │ .kill.total++   │     │ (debounced)     │
└─────────────────┘      └─────────────────┘     └─────────────────┘

┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ Equip item      │ ---> │ inventoryStore  │ --> │ electron-store  │
│                 │      │ .chests.gear    │     │                 │
└─────────────────┘      └─────────────────┘     └─────────────────┘

┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ Level up        │ ---> │ gameStore       │ --> │ Save to file    │
│                 │      │ .characters     │     │ (.pxt)          │
└─────────────────┘      └─────────────────┘     └─────────────────┘
```

## Version Migration

The save system handles version migrations:

```javascript
// Version check on load
function loadSave(saveData) {
  const currentVersion = "2.4.13";
  const saveVersion = saveData.gameStore.version;

  if (saveVersion !== currentVersion) {
    // Run migrations
    saveData = migrateFrom(saveVersion, saveData);
  }

  return saveData;
}

// Example migration
function migrateFrom241To242(saveData) {
  // Add new stat introduced in 2.4.2
  for (const char of Object.values(saveData.gameStore.characters)) {
    char.stats.entity_stat_skill_replacement ??= 0;
  }
  saveData.gameStore.version = "2.4.2";
  return saveData;
}
```

## Offline Progress Calculation

When the game resumes after being closed:

```
┌─────────────────────────────────────────────────────────────────┐
│                   OFFLINE PROGRESS                               │
└─────────────────────────────────────────────────────────────────┘

    Last Save                Current Time              Calculate
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ ptx: 1704067200 │      │ Date.now()      │ --> │ offlineMs =     │
│ (timestamp)     │      │ 1704153600      │     │ 86,400,000      │
└─────────────────┘      └─────────────────┘     │ (24 hours)      │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                              ┌─────────────────────────────────────┐
                              │ Calculate offline earnings:         │
                              │                                     │
                              │ goldPerSecond = baseGold *          │
                              │   goldIncome * difficulty           │
                              │                                     │
                              │ offlineGold = goldPerSecond *       │
                              │   (offlineMs / 1000) * efficiency   │
                              │                                     │
                              │ efficiency = 0.5 (50% of active)    │
                              └─────────────────────────────────────┘
```

## Auto-Save System

```javascript
// Auto-save implementation (conceptual)
class SaveManager {
  private saveTimeout: number | null = null;
  private readonly DEBOUNCE_MS = 5000; // 5 seconds

  // Called when any store changes
  onStoreChange() {
    // Debounce saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.performSave();
    }, this.DEBOUNCE_MS);
  }

  performSave() {
    const saveData = {
      ptx: Date.now(),
      gameStore: gameStore.getState(),
      inventoryStore: inventoryStore.getState(),
      progressStore: progressStore.getState(),
      settingsStore: settingsStore.getState()
    };

    const encoded = btoa(JSON.stringify(saveData));
    const slot = gameStore.get('activeSlot') || 96;

    fs.writeFileSync(`save/save-data-${slot}.pxt`, encoded);
  }
}
```

## Save Slots

The game supports multiple save slots:

```
save/
├── save-data-32.pxt   # Slot 32
├── save-data-40.pxt   # Slot 40
├── save-data-50.pxt   # Slot 50
├── save-data-60.pxt   # Slot 60
├── save-data-65.pxt   # Slot 65
├── save-data-70.pxt   # Slot 70
├── save-data-75.pxt   # Slot 75
├── save-data-80.pxt   # Slot 80
├── save-data-85.pxt   # Slot 85
├── save-data-90.pxt   # Slot 90
└── save-data-96.pxt   # Slot 96 (current)
```

## electron-store Integration

For settings that need immediate persistence:

```javascript
const Store = require('electron-store');

const store = new Store({
  name: 'desktop-heroes-settings',
  defaults: {
    windowBounds: { width: 800, height: 600 },
    sizeStep: 6,
    display: 0
  }
});

// Get value
const sizeStep = store.get('sizeStep');

// Set value (persists immediately)
store.set('sizeStep', 8);

// Watch for changes
store.onDidChange('sizeStep', (newValue, oldValue) => {
  resizeWindow(newValue);
});
```

## Related Documentation

- [04-combat-system.md](./04-combat-system.md) - Stats tracked in progressStore
- [07-inventory.md](./07-inventory.md) - Chest system details
- [12-platform.md](./12-platform.md) - Electron persistence
