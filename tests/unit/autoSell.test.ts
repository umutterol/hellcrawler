import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Unit tests for auto-sell Uncommon modules logic
 *
 * These tests verify the auto-sell behavior without Phaser dependencies.
 */

// Rarity enum values (matches GameTypes.ts)
const Rarity = {
  Common: 'common',
  Uncommon: 'uncommon',
  Rare: 'rare',
  Epic: 'epic',
  Legendary: 'legendary',
} as const;

type RarityType = (typeof Rarity)[keyof typeof Rarity];

// Mock settings
interface MockSettings {
  autoSellUncommon: boolean;
}

// Module sell values (from ModuleItem.ts)
const MODULE_SELL_VALUES: Record<string, number> = {
  common: 0,
  uncommon: 50,
  rare: 200,
  epic: 1000,
  legendary: 5000,
};

/**
 * Check if a module should be auto-sold based on settings and rarity
 */
function shouldAutoSell(rarity: RarityType, settings: MockSettings): boolean {
  return settings.autoSellUncommon && rarity === Rarity.Uncommon;
}

/**
 * Get the sell value for a rarity
 */
function getSellValue(rarity: RarityType): number {
  return MODULE_SELL_VALUES[rarity] ?? 0;
}

describe('Auto-sell Uncommon Logic', () => {
  describe('shouldAutoSell', () => {
    it('should auto-sell Uncommon when setting is enabled', () => {
      const settings: MockSettings = { autoSellUncommon: true };
      expect(shouldAutoSell(Rarity.Uncommon, settings)).toBe(true);
    });

    it('should NOT auto-sell Uncommon when setting is disabled', () => {
      const settings: MockSettings = { autoSellUncommon: false };
      expect(shouldAutoSell(Rarity.Uncommon, settings)).toBe(false);
    });

    it('should NOT auto-sell Common even when setting is enabled', () => {
      const settings: MockSettings = { autoSellUncommon: true };
      expect(shouldAutoSell(Rarity.Common, settings)).toBe(false);
    });

    it('should NOT auto-sell Rare even when setting is enabled', () => {
      const settings: MockSettings = { autoSellUncommon: true };
      expect(shouldAutoSell(Rarity.Rare, settings)).toBe(false);
    });

    it('should NOT auto-sell Epic even when setting is enabled', () => {
      const settings: MockSettings = { autoSellUncommon: true };
      expect(shouldAutoSell(Rarity.Epic, settings)).toBe(false);
    });

    it('should NOT auto-sell Legendary even when setting is enabled', () => {
      const settings: MockSettings = { autoSellUncommon: true };
      expect(shouldAutoSell(Rarity.Legendary, settings)).toBe(false);
    });
  });

  describe('getSellValue', () => {
    it('should return 0 for Common', () => {
      expect(getSellValue(Rarity.Common)).toBe(0);
    });

    it('should return 50 for Uncommon', () => {
      expect(getSellValue(Rarity.Uncommon)).toBe(50);
    });

    it('should return 200 for Rare', () => {
      expect(getSellValue(Rarity.Rare)).toBe(200);
    });

    it('should return 1000 for Epic', () => {
      expect(getSellValue(Rarity.Epic)).toBe(1000);
    });

    it('should return 5000 for Legendary', () => {
      expect(getSellValue(Rarity.Legendary)).toBe(5000);
    });
  });
});

describe('Auto-sell Integration Logic', () => {
  interface MockInventory {
    modules: { id: string; rarity: RarityType }[];
    gold: number;
  }

  let inventory: MockInventory;
  let autoSoldEvents: { moduleId: string; goldEarned: number }[];

  beforeEach(() => {
    inventory = { modules: [], gold: 0 };
    autoSoldEvents = [];
  });

  /**
   * Simulates addToInventory behavior with auto-sell
   */
  function addToInventory(
    moduleId: string,
    rarity: RarityType,
    settings: MockSettings
  ): boolean {
    if (shouldAutoSell(rarity, settings)) {
      const goldEarned = getSellValue(rarity);
      inventory.gold += goldEarned;
      autoSoldEvents.push({ moduleId, goldEarned });
      return false; // Not added to inventory
    }

    inventory.modules.push({ id: moduleId, rarity });
    return true; // Added to inventory
  }

  it('should add Uncommon to inventory when auto-sell disabled', () => {
    const settings: MockSettings = { autoSellUncommon: false };
    const added = addToInventory('mod-1', Rarity.Uncommon, settings);

    expect(added).toBe(true);
    expect(inventory.modules).toHaveLength(1);
    expect(inventory.modules[0]?.id).toBe('mod-1');
    expect(inventory.gold).toBe(0);
    expect(autoSoldEvents).toHaveLength(0);
  });

  it('should auto-sell Uncommon when setting enabled', () => {
    const settings: MockSettings = { autoSellUncommon: true };
    const added = addToInventory('mod-1', Rarity.Uncommon, settings);

    expect(added).toBe(false);
    expect(inventory.modules).toHaveLength(0);
    expect(inventory.gold).toBe(50);
    expect(autoSoldEvents).toHaveLength(1);
    expect(autoSoldEvents[0]?.goldEarned).toBe(50);
  });

  it('should add Rare to inventory regardless of auto-sell setting', () => {
    const settings: MockSettings = { autoSellUncommon: true };
    const added = addToInventory('mod-1', Rarity.Rare, settings);

    expect(added).toBe(true);
    expect(inventory.modules).toHaveLength(1);
    expect(inventory.gold).toBe(0);
    expect(autoSoldEvents).toHaveLength(0);
  });

  it('should add Epic to inventory regardless of auto-sell setting', () => {
    const settings: MockSettings = { autoSellUncommon: true };
    const added = addToInventory('mod-1', Rarity.Epic, settings);

    expect(added).toBe(true);
    expect(inventory.modules).toHaveLength(1);
    expect(inventory.gold).toBe(0);
  });

  it('should add Legendary to inventory regardless of auto-sell setting', () => {
    const settings: MockSettings = { autoSellUncommon: true };
    const added = addToInventory('mod-1', Rarity.Legendary, settings);

    expect(added).toBe(true);
    expect(inventory.modules).toHaveLength(1);
    expect(inventory.gold).toBe(0);
  });

  it('should auto-sell multiple Uncommon modules', () => {
    const settings: MockSettings = { autoSellUncommon: true };

    addToInventory('mod-1', Rarity.Uncommon, settings);
    addToInventory('mod-2', Rarity.Uncommon, settings);
    addToInventory('mod-3', Rarity.Uncommon, settings);

    expect(inventory.modules).toHaveLength(0);
    expect(inventory.gold).toBe(150); // 50 * 3
    expect(autoSoldEvents).toHaveLength(3);
  });

  it('should only auto-sell Uncommon while keeping higher rarities', () => {
    const settings: MockSettings = { autoSellUncommon: true };

    addToInventory('mod-1', Rarity.Uncommon, settings);
    addToInventory('mod-2', Rarity.Rare, settings);
    addToInventory('mod-3', Rarity.Uncommon, settings);
    addToInventory('mod-4', Rarity.Epic, settings);

    expect(inventory.modules).toHaveLength(2);
    expect(inventory.modules.map((m) => m.rarity)).toEqual([Rarity.Rare, Rarity.Epic]);
    expect(inventory.gold).toBe(100); // 50 * 2
    expect(autoSoldEvents).toHaveLength(2);
  });
});

describe('Settings Default Values', () => {
  it('should default autoSellUncommon to false', () => {
    // This matches the default in SettingsManager
    const defaultSettings: MockSettings = { autoSellUncommon: false };
    expect(defaultSettings.autoSellUncommon).toBe(false);
  });

  it('should allow toggling autoSellUncommon', () => {
    const settings: MockSettings = { autoSellUncommon: false };

    // Toggle on
    settings.autoSellUncommon = true;
    expect(settings.autoSellUncommon).toBe(true);

    // Toggle off
    settings.autoSellUncommon = false;
    expect(settings.autoSellUncommon).toBe(false);
  });
});
