# Combat System

This document covers the auto-combat mechanics, damage calculations, skills, and status effects.

## Combat Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMBAT LOOP                                 │
└─────────────────────────────────────────────────────────────────┘

    Character Movement          Enemy Detection           Attack
┌─────────────────────┐    ┌─────────────────────┐    ┌───────────┐
│ Walk right          │ -> │ Check attack range  │ -> │ Execute   │
│ (walk_speed stat)   │    │                     │    │ attack    │
└─────────────────────┘    └─────────────────────┘    └───────────┘
         ▲                                                   │
         │                                                   ▼
         │                 ┌─────────────────────┐    ┌───────────┐
         │                 │ Enemy dies          │ <- │ Deal      │
         │                 │ • Drop loot         │    │ damage    │
         │                 │ • Award XP/gold     │    └───────────┘
         │                 └─────────────────────┘
         │                          │
         └──────────────────────────┘
                    Continue walking
```

## Auto-Attack Mechanics

Characters automatically attack enemies within range:

```javascript
// Attack loop (conceptual)
class CombatSystem {
  update(delta) {
    // Check if enemy in range
    const nearestEnemy = this.findNearestEnemy();

    if (nearestEnemy && this.isInRange(nearestEnemy)) {
      // Stop walking
      this.character.setVelocityX(0);

      // Attack if cooldown ready
      if (this.attackReady) {
        this.performAttack(nearestEnemy);
        this.attackReady = false;

        // Calculate attack cooldown from agility
        const cooldown = this.baseAttackCooldown / this.character.stats.agility;
        this.scene.time.delayedCall(cooldown, () => {
          this.attackReady = true;
        });
      }
    } else {
      // Keep walking
      this.character.setVelocityX(this.character.stats.walk_speed * 50);
    }
  }
}
```

## Damage Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAMAGE FORMULA                                │
└─────────────────────────────────────────────────────────────────┘

    Base Damage = character.baseAttack * stats.attack

    Final Damage = Base Damage
                   * skill.multiplier (if skill)
                   * critical.multiplier (if crit)
                   - enemy.defense * enemy.stats.defense

    Post-Processing:
    ├── Apply vampiric (heal % of damage dealt)
    ├── Apply poison chance (DoT effect)
    ├── Apply burning chance (DoT effect)
    ├── Apply shock chance (stun)
    └── Apply slow chance (movement debuff)
```

### Stat Calculations

```javascript
// Stat formulas (conceptual)
const calculateDamage = (attacker, defender, skill = null) => {
  // Base attack with equipment multipliers
  let damage = attacker.baseAttack * attacker.stats.attack;

  // Skill multiplier
  if (skill) {
    damage *= skill.damageMultiplier;
  }

  // Critical hit (based on agility)
  const critChance = Math.min(attacker.stats.agility * 0.01, 0.5); // Max 50%
  if (Math.random() < critChance) {
    damage *= 2;
  }

  // Defense reduction
  const defense = defender.baseDefense * defender.stats.defense;
  damage = Math.max(1, damage - defense);

  return Math.floor(damage);
};

// Vampiric healing
const applyVampiric = (attacker, damageDealt) => {
  const healAmount = damageDealt * (attacker.stats.vampiric / 100);
  attacker.health = Math.min(attacker.maxHealth, attacker.health + healAmount);
};
```

## Stat Types

### Combat Stats

| Stat | Key | Effect |
|------|-----|--------|
| Attack | `entity_stat_attack` | Damage multiplier |
| Defense | `entity_stat_defense` | Damage reduction |
| Agility | `entity_stat_agility` | Attack speed, crit chance |
| Health Regen | `entity_stat_health_regen` | HP/second restoration |

### Effect Stats

| Stat | Key | Effect |
|------|-----|--------|
| Vampiric | `entity_stat_vampiric` | % of damage healed |
| Poison | `entity_stat_poison` | Poison DoT chance |
| Burning | `entity_stat_burning` | Fire DoT chance |
| Shock | `entity_stat_shock` | Stun chance |
| Slow | `entity_stat_slow` | Enemy speed reduction |
| Disarm | `entity_stat_disarm` | Disable enemy attacks |
| Shield Break | `entity_stat_shield_break` | Ignore defense % |

### Utility Stats

| Stat | Key | Effect |
|------|-----|--------|
| Walk Speed | `entity_stat_walk_speed` | Movement speed |
| Gold Income | `entity_stat_gold_income` | Gold drop multiplier |
| EXP Income | `entity_stat_exp_income` | XP gain multiplier |
| Drop Rate | `entity_stat_drop_rate` | Item drop chance |
| Dodge | `entity_stat_dodge` | Evade attack chance |
| Cooldown Reduction | `entity_stat_cooldown_reduction` | Skill cooldown reduction |
| AOE Range | `entity_stat_aoe_range` | Area effect radius |
| Charisma | `entity_stat_charisma` | Shop/NPC prices |

## Skill System

### Skill Bar

Each character class has 3 skill slots:

```
┌─────────────────────────────────────────────────────────────────┐
│                       SKILL BAR                                  │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Slot 1  │    │  Slot 2  │    │  Slot 3  │                  │
│  │          │    │          │    │          │                  │
│  │ [HP Pot] │    │ [Skill]  │    │ [Empty]  │                  │
│  │          │    │          │    │          │    autoSlots:    │
│  │ CD: 3s   │    │ CD: 10s  │    │          │    [false,true]  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Skill Types

```javascript
// Skill type definitions
const SKILL_TYPES = {
  skill_healing: {
    // Restores health
    effect: (character, skill) => {
      character.health += skill.impact;
      character.health = Math.min(character.health, character.maxHealth);
    }
  },

  skill_damage: {
    // Deals damage to enemies
    effect: (character, skill, targets) => {
      const damage = character.stats.attack * skill.multiplier;
      targets.forEach(enemy => enemy.takeDamage(damage));
    }
  },

  skill_buff: {
    // Temporarily boosts stats
    effect: (character, skill) => {
      character.addBuff(skill.buffType, skill.duration, skill.multiplier);
    }
  },

  skill_aoe: {
    // Area of effect damage
    effect: (character, skill, position) => {
      const range = skill.range * character.stats.aoe_range;
      const enemies = this.findEnemiesInRange(position, range);
      enemies.forEach(enemy => enemy.takeDamage(skill.damage));
    }
  }
};
```

### Skill Item Example

```json
{
  "item:hp_pot_1": {
    "key": "item:hp_pot_1",
    "name": "item_hp_pot_1",
    "displayValue": "1000",
    "icon": "hp_pot_1",
    "class": [
      "item_class:hp_pot",
      "item_class:consumable",
      "item_class:stackable",
      "item_class:skill_bar"
    ],
    "cooldown": 3000,
    "consume": {
      "skill": {
        "type": "skill_healing",
        "directCast": true,
        "characterAnimation": ["greet"],
        "impact": 1000,
        "audio": "heal",
        "icon": "effect_heal"
      }
    }
  }
}
```

## Status Effects

### Effect Application

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATUS EFFECT FLOW                            │
└─────────────────────────────────────────────────────────────────┘

    Attack Hit              Chance Check            Apply Effect
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Damage dealt  │ ---> │ Roll vs stat  │ ---> │ Add debuff    │
│               │      │ chance        │      │ to enemy      │
└───────────────┘      └───────────────┘      └───────────────┘
                                                     │
                                                     ▼
                                              ┌───────────────┐
                                              │ Effect tick   │
                                              │ (per second)  │
                                              └───────────────┘
                                                     │
                                                     ▼
                                              ┌───────────────┐
                                              │ Duration ends │
                                              │ Remove effect │
                                              └───────────────┘
```

### Effect Implementations

```javascript
// Status effect system (conceptual)
class StatusEffects {
  static POISON = {
    name: 'poison',
    tickRate: 1000, // 1 second
    duration: 5000, // 5 seconds
    onTick: (target, stacks) => {
      const damage = target.maxHealth * 0.02 * stacks; // 2% per stack
      target.takeDamage(damage, 'poison');
    }
  };

  static BURNING = {
    name: 'burning',
    tickRate: 500, // 0.5 seconds
    duration: 3000,
    onTick: (target, stacks) => {
      const damage = 50 * stacks;
      target.takeDamage(damage, 'fire');
    }
  };

  static SLOW = {
    name: 'slow',
    duration: 4000,
    onApply: (target, stacks) => {
      target.stats.walk_speed *= (1 - 0.2 * stacks); // 20% per stack
    },
    onRemove: (target, stacks) => {
      target.stats.walk_speed /= (1 - 0.2 * stacks);
    }
  };

  static SHOCK = {
    name: 'shock',
    duration: 1000, // 1 second stun
    onApply: (target) => {
      target.canAttack = false;
      target.canMove = false;
    },
    onRemove: (target) => {
      target.canAttack = true;
      target.canMove = true;
    }
  };
}
```

## Character Classes

### Class Definitions

| Class | ID | Primary Stat | Playstyle |
|-------|-----|--------------|-----------|
| Warrior | `warrior` | Attack, Defense | Melee tank |
| Hunter | `hunter` | Agility, Range | Ranged DPS |
| Assassin | `assassin` | Agility, Crit | Burst damage |
| Wizard | `wizard` | AOE, Effects | Magic/crowd control |

### Character Roster

| Character | ID | Default Class |
|-----------|-----|---------------|
| Edric | `char_edric` | Warrior |
| Serewyn | `char_serewyn` | Hunter |
| Corin | `char_corin` | Assassin |
| Alaric | `char_alaric` | Wizard |

## Enemy System

### Enemy Types (from progressStore)

```javascript
const ENEMY_TYPES = {
  // Basic enemies
  slime: { health: 100, damage: 10, speed: 30 },
  orc: { health: 200, damage: 25, speed: 40 },
  skeleton: { health: 150, damage: 20, speed: 50 },

  // Flying enemies
  bat: { health: 80, damage: 15, speed: 80, flying: true },

  // Bosses
  boss_slime: { health: 5000, damage: 100, speed: 20, boss: true },
  boss_orc: { health: 10000, damage: 200, speed: 30, boss: true }
};
```

### Difficulty Scaling

```javascript
// Enemy stats scale with map difficulty
const scaleEnemy = (baseEnemy, difficulty) => ({
  health: baseEnemy.health * (1 + difficulty * 0.5),
  damage: baseEnemy.damage * (1 + difficulty * 0.3),
  goldDrop: baseEnemy.goldDrop * (1 + difficulty * 0.4),
  expDrop: baseEnemy.expDrop * (1 + difficulty * 0.35)
});
```

## Combat Statistics Tracking

The progressStore tracks detailed combat metrics:

```javascript
// After each kill
progressStore.update({
  kill: {
    total: ++total,
    byMob: { [enemy.type]: ++count },
    byCharacter: { [character.id]: ++charKills },
    bySkill: { [usedSkill]: ++skillKills }
  },
  damage: {
    dealt: total + damageDealt,
    received: total + damageReceived,
    healed: total + amountHealed
  },
  goldEarned: {
    total: total + gold,
    kill: killGold + gold
  }
});
```

## Related Documentation

- [03-state-management.md](./03-state-management.md) - Combat stats in progressStore
- [05-progression.md](./05-progression.md) - Level scaling
- [07-inventory.md](./07-inventory.md) - Equipment stat bonuses
- [10-visual-effects.md](./10-visual-effects.md) - Damage flash shader
