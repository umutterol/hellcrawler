/**
 * Unit tests for module compare feature (tooltip-based comparison)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ModuleItemData structure
interface MockModuleStat {
  type: string;
  value: number;
}

interface MockModuleItemData {
  id: string;
  type: string;
  rarity: string;
  stats: MockModuleStat[];
}

describe('Module Compare - Stat Difference Calculation (Tooltip)', () => {
  /**
   * Calculate stat differences between two modules
   */
  function calculateStatDifferences(
    left: MockModuleItemData,
    right: MockModuleItemData
  ): Map<string, { left: number; right: number; diff: number }> {
    const allStats = new Map<string, { left: number; right: number; diff: number }>();

    // Add left module stats
    for (const stat of left.stats || []) {
      allStats.set(stat.type, { left: stat.value, right: 0, diff: -stat.value });
    }

    // Add/merge right module stats
    for (const stat of right.stats || []) {
      const existing = allStats.get(stat.type);
      if (existing) {
        existing.right = stat.value;
        existing.diff = stat.value - existing.left;
      } else {
        allStats.set(stat.type, { left: 0, right: stat.value, diff: stat.value });
      }
    }

    return allStats;
  }

  it('should calculate positive difference when right has higher stat', () => {
    const left: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'uncommon',
      stats: [{ type: 'damage', value: 10 }],
    };
    const right: MockModuleItemData = {
      id: 'module-2',
      type: 'MachineGun',
      rarity: 'rare',
      stats: [{ type: 'damage', value: 25 }],
    };

    const diffs = calculateStatDifferences(left, right);
    const damageDiff = diffs.get('damage');

    expect(damageDiff).toBeDefined();
    expect(damageDiff?.diff).toBe(15);
  });

  it('should calculate negative difference when right has lower stat', () => {
    const left: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'epic',
      stats: [{ type: 'fireRate', value: 30 }],
    };
    const right: MockModuleItemData = {
      id: 'module-2',
      type: 'MachineGun',
      rarity: 'rare',
      stats: [{ type: 'fireRate', value: 15 }],
    };

    const diffs = calculateStatDifferences(left, right);
    const fireRateDiff = diffs.get('fireRate');

    expect(fireRateDiff).toBeDefined();
    expect(fireRateDiff?.diff).toBe(-15);
  });

  it('should handle stats that only exist on one module', () => {
    const left: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'uncommon',
      stats: [{ type: 'damage', value: 10 }],
    };
    const right: MockModuleItemData = {
      id: 'module-2',
      type: 'MissilePod',
      rarity: 'rare',
      stats: [{ type: 'aoeRadius', value: 20 }],
    };

    const diffs = calculateStatDifferences(left, right);

    // Left has damage that right doesn't have
    const damageDiff = diffs.get('damage');
    expect(damageDiff?.left).toBe(10);
    expect(damageDiff?.right).toBe(0);
    expect(damageDiff?.diff).toBe(-10);

    // Right has aoeRadius that left doesn't have
    const aoeDiff = diffs.get('aoeRadius');
    expect(aoeDiff?.left).toBe(0);
    expect(aoeDiff?.right).toBe(20);
    expect(aoeDiff?.diff).toBe(20);
  });

  it('should handle modules with multiple stats', () => {
    const left: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'epic',
      stats: [
        { type: 'damage', value: 15 },
        { type: 'fireRate', value: 20 },
        { type: 'critChance', value: 5 },
      ],
    };
    const right: MockModuleItemData = {
      id: 'module-2',
      type: 'MachineGun',
      rarity: 'legendary',
      stats: [
        { type: 'damage', value: 25 },
        { type: 'fireRate', value: 15 },
        { type: 'critDamage', value: 30 },
      ],
    };

    const diffs = calculateStatDifferences(left, right);

    expect(diffs.size).toBe(4); // damage, fireRate, critChance, critDamage
    expect(diffs.get('damage')?.diff).toBe(10); // 25 - 15 = +10
    expect(diffs.get('fireRate')?.diff).toBe(-5); // 15 - 20 = -5
    expect(diffs.get('critChance')?.diff).toBe(-5); // 0 - 5 = -5
    expect(diffs.get('critDamage')?.diff).toBe(30); // 30 - 0 = +30
  });

  it('should handle empty stats arrays', () => {
    const left: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'common',
      stats: [],
    };
    const right: MockModuleItemData = {
      id: 'module-2',
      type: 'MachineGun',
      rarity: 'common',
      stats: [],
    };

    const diffs = calculateStatDifferences(left, right);
    expect(diffs.size).toBe(0);
  });
});

describe('Module Compare - Tooltip Comparison Logic', () => {
  /**
   * Get module to compare against when hovering
   * Returns the selected module if different from hovered module
   */
  function getCompareModule(
    hoveredModule: MockModuleItemData,
    selectedModule: MockModuleItemData | null
  ): MockModuleItemData | undefined {
    if (!selectedModule) return undefined;
    if (selectedModule.id === hoveredModule.id) return undefined;
    return selectedModule;
  }

  it('should not compare when no module is selected', () => {
    const hoveredModule: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'rare',
      stats: [{ type: 'damage', value: 10 }],
    };

    const compareWith = getCompareModule(hoveredModule, null);
    expect(compareWith).toBeUndefined();
  });

  it('should not compare module with itself', () => {
    const module: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'rare',
      stats: [{ type: 'damage', value: 10 }],
    };

    const compareWith = getCompareModule(module, module);
    expect(compareWith).toBeUndefined();
  });

  it('should return selected module when hovering different module', () => {
    const selectedModule: MockModuleItemData = {
      id: 'module-1',
      type: 'MachineGun',
      rarity: 'rare',
      stats: [],
    };
    const hoveredModule: MockModuleItemData = {
      id: 'module-2',
      type: 'MissilePod',
      rarity: 'epic',
      stats: [],
    };

    const compareWith = getCompareModule(hoveredModule, selectedModule);
    expect(compareWith).toBe(selectedModule);
  });
});

describe('Module Compare - Short Stat Names', () => {
  /**
   * Get abbreviated stat name for display
   */
  function getShortStatName(statType: string): string {
    const shortNames: Record<string, string> = {
      damage: 'DMG',
      fireRate: 'FR',
      critChance: 'CRIT',
      critDamage: 'CDMG',
      aoeRadius: 'AOE',
      projectileSpeed: 'SPD',
      range: 'RNG',
      piercing: 'PIER',
      lifesteal: 'LIFE',
      armorPenetration: 'PEN',
      slowEffect: 'SLOW',
    };
    return shortNames[statType] || statType.substring(0, 4).toUpperCase();
  }

  it('should return correct short names for known stats', () => {
    expect(getShortStatName('damage')).toBe('DMG');
    expect(getShortStatName('fireRate')).toBe('FR');
    expect(getShortStatName('critChance')).toBe('CRIT');
    expect(getShortStatName('critDamage')).toBe('CDMG');
    expect(getShortStatName('aoeRadius')).toBe('AOE');
    expect(getShortStatName('lifesteal')).toBe('LIFE');
  });

  it('should abbreviate unknown stats', () => {
    expect(getShortStatName('unknownStat')).toBe('UNKN');
    expect(getShortStatName('fooBar')).toBe('FOOB');
  });
});
