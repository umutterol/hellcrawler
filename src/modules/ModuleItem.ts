import { ModuleType, ModuleItemData, ModuleStat, ModuleSkill } from '../types/ModuleTypes';
import { Rarity, StatType } from '../types/GameTypes';

/**
 * Stat roll ranges per rarity
 * GDD: Uncommon 1-5%, Rare 3-8%, Epic 5-12%, Legendary 8-15%
 */
const STAT_RANGES: Record<Rarity, { min: number; max: number; count: number }> = {
  [Rarity.Uncommon]: { min: 1, max: 5, count: 1 },
  [Rarity.Rare]: { min: 3, max: 8, count: 2 },
  [Rarity.Epic]: { min: 5, max: 12, count: 3 },
  [Rarity.Legendary]: { min: 8, max: 15, count: 4 },
};

/**
 * All possible stat types for modules (11 stats per GDD)
 */
const STAT_POOL: StatType[] = [
  StatType.Damage,
  StatType.AttackSpeed,
  StatType.CritChance,
  StatType.CritDamage,
  StatType.CDR,
  StatType.AoE,
  StatType.Lifesteal,
  StatType.Multistrike,
  StatType.Range,
  StatType.GoldFind,
  StatType.XPBonus,
];

/**
 * Sell values per rarity (in gold)
 * This is the SINGLE SOURCE OF TRUTH for module sell values
 */
export const MODULE_SELL_VALUES: Record<Rarity, number> = {
  [Rarity.Uncommon]: 50,
  [Rarity.Rare]: 200,
  [Rarity.Epic]: 1000,
  [Rarity.Legendary]: 5000,
};

/**
 * ModuleItem - Droppable equipment with random stats
 *
 * Modules are loot that can be equipped to module slots.
 * Each module has:
 * - Type (MachineGun, MissilePod, etc.)
 * - Rarity (determines # of stats and stat ranges)
 * - Randomly rolled stats
 * - Two skills (based on module type)
 */
export class ModuleItem {
  private data: ModuleItemData;

  private static idCounter: number = 0;

  constructor(data: ModuleItemData) {
    this.data = data;
  }

  /**
   * Generate a new random module
   */
  public static generate(type: ModuleType, rarity: Rarity): ModuleItem {
    const id = `module_${type}_${++ModuleItem.idCounter}_${Date.now()}`;
    const stats = ModuleItem.rollStats(rarity);
    const skills = ModuleItem.getSkillsForType(type);

    return new ModuleItem({
      id,
      type,
      rarity,
      stats,
      skills,
    });
  }

  /**
   * Roll random stats based on rarity
   */
  private static rollStats(rarity: Rarity): ModuleStat[] {
    const range = STAT_RANGES[rarity];
    const stats: ModuleStat[] = [];
    const availableStats = [...STAT_POOL];

    for (let i = 0; i < range.count; i++) {
      if (availableStats.length === 0) break;

      // Pick random stat type
      const statIndex = Math.floor(Math.random() * availableStats.length);
      const statType = availableStats.splice(statIndex, 1)[0]!;

      // Roll value within rarity range
      const value = range.min + Math.floor(Math.random() * (range.max - range.min + 1));

      stats.push({
        type: statType,
        value,
      });
    }

    return stats;
  }

  /**
   * Get skills for a specific module type
   * Each module type has 2 skills
   */
  private static getSkillsForType(type: ModuleType): ModuleSkill[] {
    switch (type) {
      case ModuleType.MachineGun:
        return [
          {
            name: 'Overdrive',
            cooldown: 15,
            duration: 5,
            description: '+50% fire rate for 5 seconds',
          },
          {
            name: 'Suppressing Fire',
            cooldown: 20,
            duration: 4,
            description: 'Slow enemies in cone by 30% for 4 seconds',
          },
        ];

      case ModuleType.MissilePod:
        return [
          {
            name: 'Barrage',
            cooldown: 18,
            duration: 0,
            description: 'Fire 5 missiles in rapid succession',
          },
          {
            name: 'Homing Swarm',
            cooldown: 25,
            duration: 8,
            description: 'All missiles gain perfect tracking for 8 seconds',
          },
        ];

      case ModuleType.RepairDrone:
        return [
          {
            name: 'Emergency Repair',
            cooldown: 30,
            duration: 0,
            description: 'Instantly heal 15% of max HP',
          },
          {
            name: 'Regeneration Field',
            cooldown: 45,
            duration: 10,
            description: '+200% HP regen for 10 seconds',
          },
        ];

      case ModuleType.ShieldGenerator:
        return [
          {
            name: 'Energy Barrier',
            cooldown: 25,
            duration: 0,
            description: 'Block the next 3 instances of damage',
          },
          {
            name: 'Reflect Shield',
            cooldown: 35,
            duration: 5,
            description: 'Return 30% of damage taken for 5 seconds',
          },
        ];

      case ModuleType.LaserCutter:
        return [
          {
            name: 'Focused Beam',
            cooldown: 20,
            duration: 3,
            description: 'Channel for 3s, damage increases each second',
          },
          {
            name: 'Thermal Overload',
            cooldown: 25,
            duration: 4,
            description: 'Enemies hit burn for 50% damage over 4 seconds',
          },
        ];

      case ModuleType.TeslaCoil:
        return [
          {
            name: 'Chain Lightning',
            cooldown: 12,
            duration: 0,
            description: 'Lightning jumps to 4 additional enemies',
          },
          {
            name: 'Static Field',
            cooldown: 30,
            duration: 6,
            description: 'Enemies take 20% more damage for 6 seconds',
          },
        ];

      case ModuleType.Flamethrower:
        return [
          {
            name: 'Napalm',
            cooldown: 15,
            duration: 5,
            description: 'Leave burning ground dealing DoT for 5 seconds',
          },
          {
            name: 'Inferno',
            cooldown: 25,
            duration: 4,
            description: 'Triple flame width and damage for 4 seconds',
          },
        ];

      case ModuleType.EMPEmitter:
        return [
          {
            name: 'Pulse',
            cooldown: 20,
            duration: 3,
            description: 'Stun all enemies for 3 seconds',
          },
          {
            name: 'Overcharge',
            cooldown: 40,
            duration: 0,
            description: 'Deal massive damage to all enemies',
          },
        ];

      case ModuleType.Mortar:
        return [
          {
            name: 'Artillery Strike',
            cooldown: 18,
            duration: 0,
            description: 'Fire 3 shells at random enemy positions',
          },
          {
            name: 'Carpet Bombing',
            cooldown: 35,
            duration: 0,
            description: 'Bombard a wide area for heavy AoE damage',
          },
        ];

      case ModuleType.MainCannon:
        return [
          {
            name: 'Piercing Shot',
            cooldown: 20,
            duration: 0,
            description: 'Shot pierces through all enemies',
          },
          {
            name: 'Critical Strike',
            cooldown: 30,
            duration: 0,
            description: 'Guaranteed critical hit with +100% damage',
          },
        ];

      default:
        return [];
    }
  }

  // Getters

  public getId(): string {
    return this.data.id;
  }

  public getType(): ModuleType {
    return this.data.type;
  }

  public getRarity(): Rarity {
    return this.data.rarity;
  }

  public getStats(): ModuleStat[] {
    return [...this.data.stats];
  }

  public getSkills(): ModuleSkill[] {
    return [...this.data.skills];
  }

  public getData(): ModuleItemData {
    return { ...this.data };
  }

  /**
   * Get total value for a specific stat type
   */
  public getStatValue(statType: StatType): number {
    const stat = this.data.stats.find((s) => s.type === statType);
    return stat?.value ?? 0;
  }

  /**
   * Get combined bonus from all damage-related stats
   */
  public getTotalDamageBonus(): number {
    let bonus = 0;
    for (const stat of this.data.stats) {
      if (stat.type === StatType.Damage) {
        bonus += stat.value;
      }
    }
    return bonus;
  }

  /**
   * Get sell value in gold
   */
  public getSellValue(): number {
    return MODULE_SELL_VALUES[this.data.rarity];
  }

  /**
   * Get display color for rarity
   */
  public getRarityColor(): number {
    switch (this.data.rarity) {
      case Rarity.Uncommon:
        return 0x00ff00; // Green
      case Rarity.Rare:
        return 0x0088ff; // Blue
      case Rarity.Epic:
        return 0xaa00ff; // Purple
      case Rarity.Legendary:
        return 0xff8800; // Orange
      default:
        return 0xffffff;
    }
  }

  /**
   * Get human-readable rarity name
   */
  public getRarityName(): string {
    return this.data.rarity.charAt(0).toUpperCase() + this.data.rarity.slice(1);
  }

  /**
   * Get human-readable module type name
   */
  public getTypeName(): string {
    // Convert camelCase to Title Case with spaces
    return this.data.type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
