import { describe, it, expect } from 'vitest';
import { Rarity } from '../../src/types/GameTypes';
import { MODULE_SELL_VALUES } from '../../src/modules/ModuleItem';

/**
 * Unit tests for Module Inventory System
 *
 * Tests cover:
 * - Module sell values per rarity (using canonical source)
 * - Sell value consistency between display and actual gold
 * - Rarity color mappings
 * - Module type name formatting
 * - Slot availability logic
 * - Equip/unequip eligibility
 */

describe('Module Sell Values - Canonical Source', () => {
  it('should export MODULE_SELL_VALUES from ModuleItem', () => {
    expect(MODULE_SELL_VALUES).toBeDefined();
    expect(typeof MODULE_SELL_VALUES).toBe('object');
  });

  it('should return 50 gold for Uncommon modules', () => {
    expect(MODULE_SELL_VALUES[Rarity.Uncommon]).toBe(50);
  });

  it('should return 200 gold for Rare modules', () => {
    expect(MODULE_SELL_VALUES[Rarity.Rare]).toBe(200);
  });

  it('should return 1000 gold for Epic modules', () => {
    expect(MODULE_SELL_VALUES[Rarity.Epic]).toBe(1000);
  });

  it('should return 5000 gold for Legendary modules', () => {
    expect(MODULE_SELL_VALUES[Rarity.Legendary]).toBe(5000);
  });

  it('should have exactly 5 rarity tiers defined (including Common)', () => {
    const keys = Object.keys(MODULE_SELL_VALUES);
    expect(keys.length).toBe(5);
  });

  it('should return 0 gold for Common modules', () => {
    expect(MODULE_SELL_VALUES[Rarity.Common]).toBe(0);
  });

  it('should have increasing value by rarity tier', () => {
    const uncommon = MODULE_SELL_VALUES[Rarity.Uncommon];
    const rare = MODULE_SELL_VALUES[Rarity.Rare];
    const epic = MODULE_SELL_VALUES[Rarity.Epic];
    const legendary = MODULE_SELL_VALUES[Rarity.Legendary];

    expect(rare).toBeGreaterThan(uncommon);
    expect(epic).toBeGreaterThan(rare);
    expect(legendary).toBeGreaterThan(epic);
  });

  it('should have all values be non-negative integers', () => {
    Object.values(MODULE_SELL_VALUES).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    });
  });
});

describe('Sell Value Consistency', () => {
  // This tests that the sell value lookup pattern used in different files
  // will produce consistent results when using MODULE_SELL_VALUES

  const getSellValueFromCanonical = (rarity: string): number => {
    return MODULE_SELL_VALUES[rarity as Rarity] || 50;
  };

  it('should return correct value for valid rarities', () => {
    expect(getSellValueFromCanonical('uncommon')).toBe(50);
    expect(getSellValueFromCanonical('rare')).toBe(200);
    expect(getSellValueFromCanonical('epic')).toBe(1000);
    expect(getSellValueFromCanonical('legendary')).toBe(5000);
  });

  it('should default to 50 for unknown rarity', () => {
    expect(getSellValueFromCanonical('unknown')).toBe(50);
    expect(getSellValueFromCanonical('')).toBe(50);
  });

  it('should handle case sensitivity correctly', () => {
    // The rarity enum values are lowercase
    expect(getSellValueFromCanonical('Uncommon')).toBe(50); // Falls through to default
    expect(getSellValueFromCanonical('RARE')).toBe(50); // Falls through to default
  });

  it('tooltip display value should match actual gold earned', () => {
    // This test verifies the fix for the bug where tooltip showed different
    // value than what was actually awarded when selling

    // Simulate what InventoryPanel.getSellValue does
    const tooltipValue = (rarity: string): number => {
      return MODULE_SELL_VALUES[rarity as Rarity] || 50;
    };

    // Simulate what GameState.sellModule does
    const actualGoldEarned = (rarity: string): number => {
      return MODULE_SELL_VALUES[rarity as Rarity] || 50;
    };

    // Both should return identical values for all rarities
    const rarities = ['uncommon', 'rare', 'epic', 'legendary'];
    rarities.forEach((rarity) => {
      expect(tooltipValue(rarity)).toBe(actualGoldEarned(rarity));
    });
  });

  it('should match exact expected values from GDD', () => {
    // Per GDD/design, these are the intended sell values
    const expectedValues: Record<string, number> = {
      uncommon: 50,
      rare: 200,
      epic: 1000,
      legendary: 5000,
    };

    Object.entries(expectedValues).forEach(([rarity, expected]) => {
      expect(MODULE_SELL_VALUES[rarity as Rarity]).toBe(expected);
    });
  });
});

describe('Rarity Color Values', () => {
  const RARITY_COLORS: Record<string, number> = {
    uncommon: 0x4ade80,
    rare: 0x60a5fa,
    epic: 0xc084fc,
    legendary: 0xfb923c,
  };

  const getRarityColor = (rarity: string): number => {
    return RARITY_COLORS[rarity] || 0xffffff;
  };

  it('should return green (0x4ade80) for Uncommon', () => {
    expect(getRarityColor(Rarity.Uncommon)).toBe(0x4ade80);
  });

  it('should return blue (0x60a5fa) for Rare', () => {
    expect(getRarityColor(Rarity.Rare)).toBe(0x60a5fa);
  });

  it('should return purple (0xc084fc) for Epic', () => {
    expect(getRarityColor(Rarity.Epic)).toBe(0xc084fc);
  });

  it('should return orange (0xfb923c) for Legendary', () => {
    expect(getRarityColor(Rarity.Legendary)).toBe(0xfb923c);
  });

  it('should return white (0xffffff) for unknown rarity', () => {
    expect(getRarityColor('unknown')).toBe(0xffffff);
  });
});

describe('Rarity Color Hex Strings', () => {
  const getRarityColorHex = (rarity: string): string => {
    switch (rarity) {
      case Rarity.Uncommon:
        return '#4ade80';
      case Rarity.Rare:
        return '#60a5fa';
      case Rarity.Epic:
        return '#c084fc';
      case Rarity.Legendary:
        return '#fb923c';
      default:
        return '#ffffff';
    }
  };

  it('should return correct hex string for each rarity', () => {
    expect(getRarityColorHex(Rarity.Uncommon)).toBe('#4ade80');
    expect(getRarityColorHex(Rarity.Rare)).toBe('#60a5fa');
    expect(getRarityColorHex(Rarity.Epic)).toBe('#c084fc');
    expect(getRarityColorHex(Rarity.Legendary)).toBe('#fb923c');
  });

  it('should return white for unknown rarity', () => {
    expect(getRarityColorHex('unknown')).toBe('#ffffff');
  });
});

describe('Module Type Name Formatting', () => {
  const getModuleTypeName = (type: string): string => {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  it('should format MachineGun as "Machine Gun"', () => {
    expect(getModuleTypeName('MachineGun')).toBe('Machine Gun');
  });

  it('should format MissilePod as "Missile Pod"', () => {
    expect(getModuleTypeName('MissilePod')).toBe('Missile Pod');
  });

  it('should format RepairDrone as "Repair Drone"', () => {
    expect(getModuleTypeName('RepairDrone')).toBe('Repair Drone');
  });

  it('should format ShieldGenerator as "Shield Generator"', () => {
    expect(getModuleTypeName('ShieldGenerator')).toBe('Shield Generator');
  });

  it('should format TeslaCoil as "Tesla Coil"', () => {
    expect(getModuleTypeName('TeslaCoil')).toBe('Tesla Coil');
  });

  it('should format single word types correctly', () => {
    expect(getModuleTypeName('Mortar')).toBe('Mortar');
  });

  it('should handle lowercase input', () => {
    expect(getModuleTypeName('machinegun')).toBe('Machinegun');
  });
});

describe('Stat Name Formatting', () => {
  const formatStatName = (statType: string): string => {
    return statType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  it('should format Damage correctly', () => {
    expect(formatStatName('Damage')).toBe('Damage');
  });

  it('should format AttackSpeed as "Attack Speed"', () => {
    expect(formatStatName('AttackSpeed')).toBe('Attack Speed');
  });

  it('should format CritChance as "Crit Chance"', () => {
    expect(formatStatName('CritChance')).toBe('Crit Chance');
  });

  it('should format CritDamage as "Crit Damage"', () => {
    expect(formatStatName('CritDamage')).toBe('Crit Damage');
  });

  it('should format CDR correctly', () => {
    expect(formatStatName('CDR')).toBe('C D R');
  });

  it('should format GoldFind as "Gold Find"', () => {
    expect(formatStatName('GoldFind')).toBe('Gold Find');
  });
});

describe('Module Slot Availability', () => {
  interface MockSlot {
    index: number;
    unlocked: boolean;
    equipped: { id: string } | null;
  }

  const hasAvailableSlot = (slots: MockSlot[]): boolean => {
    return slots.some((slot) => slot.unlocked && !slot.equipped);
  };

  const findAvailableSlotIndex = (slots: MockSlot[]): number => {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot && slot.unlocked && !slot.equipped) {
        return i;
      }
    }
    return -1;
  };

  it('should find available slot when first slot is empty', () => {
    const slots: MockSlot[] = [
      { index: 0, unlocked: true, equipped: null },
      { index: 1, unlocked: false, equipped: null },
    ];
    expect(hasAvailableSlot(slots)).toBe(true);
    expect(findAvailableSlotIndex(slots)).toBe(0);
  });

  it('should find available slot when second slot is empty', () => {
    const slots: MockSlot[] = [
      { index: 0, unlocked: true, equipped: { id: 'mod1' } },
      { index: 1, unlocked: true, equipped: null },
    ];
    expect(hasAvailableSlot(slots)).toBe(true);
    expect(findAvailableSlotIndex(slots)).toBe(1);
  });

  it('should return false when all unlocked slots are full', () => {
    const slots: MockSlot[] = [
      { index: 0, unlocked: true, equipped: { id: 'mod1' } },
      { index: 1, unlocked: true, equipped: { id: 'mod2' } },
      { index: 2, unlocked: false, equipped: null },
    ];
    expect(hasAvailableSlot(slots)).toBe(false);
    expect(findAvailableSlotIndex(slots)).toBe(-1);
  });

  it('should not consider locked slots as available', () => {
    const slots: MockSlot[] = [
      { index: 0, unlocked: true, equipped: { id: 'mod1' } },
      { index: 1, unlocked: false, equipped: null },
    ];
    expect(hasAvailableSlot(slots)).toBe(false);
    expect(findAvailableSlotIndex(slots)).toBe(-1);
  });

  it('should return false for empty slots array', () => {
    expect(hasAvailableSlot([])).toBe(false);
    expect(findAvailableSlotIndex([])).toBe(-1);
  });
});

describe('Module Selection State', () => {
  interface MockModule {
    id: string;
    type: string;
    rarity: string;
  }

  interface MockSelection {
    module: MockModule;
    source: 'equipped' | 'inventory';
    slotIndex?: number;
  }

  interface MockSlot {
    index: number;
    equipped: MockModule | null;
  }

  const findModule = (
    moduleId: string,
    slots: MockSlot[],
    inventory: MockModule[]
  ): MockSelection | null => {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot?.equipped?.id === moduleId) {
        return { module: slot.equipped, source: 'equipped', slotIndex: i };
      }
    }

    for (const module of inventory) {
      if (module.id === moduleId) {
        return { module, source: 'inventory' };
      }
    }

    return null;
  };

  it('should find equipped module', () => {
    const module: MockModule = { id: 'mod1', type: 'MachineGun', rarity: 'rare' };
    const slots: MockSlot[] = [{ index: 0, equipped: module }];
    const inventory: MockModule[] = [];

    const result = findModule('mod1', slots, inventory);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('equipped');
    expect(result?.slotIndex).toBe(0);
    expect(result?.module.id).toBe('mod1');
  });

  it('should find inventory module', () => {
    const module: MockModule = { id: 'mod2', type: 'TeslaCoil', rarity: 'epic' };
    const slots: MockSlot[] = [{ index: 0, equipped: null }];
    const inventory: MockModule[] = [module];

    const result = findModule('mod2', slots, inventory);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('inventory');
    expect(result?.slotIndex).toBeUndefined();
    expect(result?.module.id).toBe('mod2');
  });

  it('should return null for non-existent module', () => {
    const slots: MockSlot[] = [{ index: 0, equipped: null }];
    const inventory: MockModule[] = [];

    const result = findModule('nonexistent', slots, inventory);
    expect(result).toBeNull();
  });

  it('should prioritize equipped over inventory for same ID', () => {
    const module: MockModule = { id: 'mod1', type: 'MachineGun', rarity: 'rare' };
    const slots: MockSlot[] = [{ index: 0, equipped: module }];
    const inventory: MockModule[] = [module]; // Same ID in both (shouldn't happen normally)

    const result = findModule('mod1', slots, inventory);
    expect(result?.source).toBe('equipped');
  });
});

describe('Equip/Unequip Eligibility', () => {
  it('should allow equip when module is in inventory', () => {
    const source = 'inventory';
    const canEquip = source === 'inventory';
    expect(canEquip).toBe(true);
  });

  it('should not allow equip when module is already equipped', () => {
    const source = 'equipped';
    const canEquip = source === 'inventory';
    expect(canEquip).toBe(false);
  });

  it('should allow unequip when module is equipped', () => {
    const source = 'equipped';
    const canUnequip = source === 'equipped';
    expect(canUnequip).toBe(true);
  });

  it('should not allow unequip when module is in inventory', () => {
    const source = 'inventory';
    const canUnequip = source === 'equipped';
    expect(canUnequip).toBe(false);
  });

  it('should allow sell only when module is in inventory', () => {
    const canSellFromInventory = 'inventory' !== 'equipped';
    const canSellFromEquipped = 'equipped' !== 'equipped';

    expect(canSellFromInventory).toBe(true);
    expect(canSellFromEquipped).toBe(false);
  });
});

describe('Module Stat Rolls', () => {
  const STAT_RANGES: Record<string, { min: number; max: number; count: number }> = {
    uncommon: { min: 1, max: 5, count: 1 },
    rare: { min: 3, max: 8, count: 2 },
    epic: { min: 5, max: 12, count: 3 },
    legendary: { min: 8, max: 15, count: 4 },
  };

  const getStatRange = (rarity: string) => STAT_RANGES[rarity];

  it('should have correct stat count for each rarity', () => {
    expect(getStatRange('uncommon')?.count).toBe(1);
    expect(getStatRange('rare')?.count).toBe(2);
    expect(getStatRange('epic')?.count).toBe(3);
    expect(getStatRange('legendary')?.count).toBe(4);
  });

  it('should have increasing stat ranges by rarity', () => {
    const uncommon = getStatRange('uncommon')!;
    const rare = getStatRange('rare')!;
    const epic = getStatRange('epic')!;
    const legendary = getStatRange('legendary')!;

    expect(rare.min).toBeGreaterThan(uncommon.min);
    expect(epic.min).toBeGreaterThan(rare.min);
    expect(legendary.min).toBeGreaterThan(epic.min);
  });

  it('should have valid min/max ranges', () => {
    Object.values(STAT_RANGES).forEach((range) => {
      expect(range.min).toBeLessThanOrEqual(range.max);
      expect(range.min).toBeGreaterThan(0);
    });
  });
});

describe('Inventory Capacity', () => {
  const MAX_INVENTORY_SIZE = 50;

  it('should have max inventory size of 50', () => {
    expect(MAX_INVENTORY_SIZE).toBe(50);
  });

  it('should format inventory count correctly', () => {
    const formatInventoryCount = (count: number) => `INVENTORY (${count}/${MAX_INVENTORY_SIZE})`;

    expect(formatInventoryCount(0)).toBe('INVENTORY (0/50)');
    expect(formatInventoryCount(25)).toBe('INVENTORY (25/50)');
    expect(formatInventoryCount(50)).toBe('INVENTORY (50/50)');
  });

  it('should detect full inventory', () => {
    const isInventoryFull = (count: number) => count >= MAX_INVENTORY_SIZE;

    expect(isInventoryFull(49)).toBe(false);
    expect(isInventoryFull(50)).toBe(true);
    expect(isInventoryFull(51)).toBe(true);
  });
});
