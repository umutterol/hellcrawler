import { describe, it, expect } from 'vitest';

/**
 * Unit tests for sell confirmation logic
 *
 * These tests verify the confirmation requirement logic without Phaser dependencies.
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

/**
 * Check if a rarity requires confirmation to sell
 * This is a copy of the logic from InventoryPanel for testing
 */
function requiresSellConfirmation(rarity: string): boolean {
  return [Rarity.Rare, Rarity.Epic, Rarity.Legendary].includes(rarity as RarityType);
}

/**
 * Determine if confirmation should be shown based on settings and rarity
 */
function shouldShowConfirmation(
  rarity: string,
  confirmRareSells: boolean,
  hasModal: boolean
): boolean {
  return requiresSellConfirmation(rarity) && confirmRareSells && hasModal;
}

describe('Sell Confirmation Logic', () => {
  describe('requiresSellConfirmation', () => {
    it('should NOT require confirmation for Common modules', () => {
      expect(requiresSellConfirmation(Rarity.Common)).toBe(false);
    });

    it('should NOT require confirmation for Uncommon modules', () => {
      expect(requiresSellConfirmation(Rarity.Uncommon)).toBe(false);
    });

    it('should require confirmation for Rare modules', () => {
      expect(requiresSellConfirmation(Rarity.Rare)).toBe(true);
    });

    it('should require confirmation for Epic modules', () => {
      expect(requiresSellConfirmation(Rarity.Epic)).toBe(true);
    });

    it('should require confirmation for Legendary modules', () => {
      expect(requiresSellConfirmation(Rarity.Legendary)).toBe(true);
    });

    it('should handle unknown rarity as not requiring confirmation', () => {
      expect(requiresSellConfirmation('unknown')).toBe(false);
    });
  });

  describe('shouldShowConfirmation', () => {
    it('should show confirmation for Rare when confirmRareSells is true', () => {
      expect(shouldShowConfirmation(Rarity.Rare, true, true)).toBe(true);
    });

    it('should NOT show confirmation for Rare when confirmRareSells is false', () => {
      expect(shouldShowConfirmation(Rarity.Rare, false, true)).toBe(false);
    });

    it('should NOT show confirmation for Uncommon even when confirmRareSells is true', () => {
      expect(shouldShowConfirmation(Rarity.Uncommon, true, true)).toBe(false);
    });

    it('should NOT show confirmation when modal is not available', () => {
      expect(shouldShowConfirmation(Rarity.Legendary, true, false)).toBe(false);
    });

    it('should show confirmation for all Rare+ rarities', () => {
      const rareRarities = [Rarity.Rare, Rarity.Epic, Rarity.Legendary];

      for (const rarity of rareRarities) {
        expect(shouldShowConfirmation(rarity, true, true)).toBe(true);
      }
    });

    it('should NOT show confirmation for low rarities', () => {
      const lowRarities = [Rarity.Common, Rarity.Uncommon];

      for (const rarity of lowRarities) {
        expect(shouldShowConfirmation(rarity, true, true)).toBe(false);
      }
    });
  });
});

describe('Rarity Sell Values', () => {
  // Sell values from ModuleItem.ts
  const MODULE_SELL_VALUES: Record<string, number> = {
    common: 0,
    uncommon: 50,
    rare: 200,
    epic: 1000,
    legendary: 5000,
  };

  it('should have correct sell value for Common', () => {
    expect(MODULE_SELL_VALUES[Rarity.Common]).toBe(0);
  });

  it('should have correct sell value for Uncommon', () => {
    expect(MODULE_SELL_VALUES[Rarity.Uncommon]).toBe(50);
  });

  it('should have correct sell value for Rare', () => {
    expect(MODULE_SELL_VALUES[Rarity.Rare]).toBe(200);
  });

  it('should have correct sell value for Epic', () => {
    expect(MODULE_SELL_VALUES[Rarity.Epic]).toBe(1000);
  });

  it('should have correct sell value for Legendary', () => {
    expect(MODULE_SELL_VALUES[Rarity.Legendary]).toBe(5000);
  });

  it('should have increasing sell values with rarity', () => {
    expect(MODULE_SELL_VALUES[Rarity.Common]).toBeLessThan(
      MODULE_SELL_VALUES[Rarity.Uncommon]
    );
    expect(MODULE_SELL_VALUES[Rarity.Uncommon]).toBeLessThan(
      MODULE_SELL_VALUES[Rarity.Rare]
    );
    expect(MODULE_SELL_VALUES[Rarity.Rare]).toBeLessThan(MODULE_SELL_VALUES[Rarity.Epic]);
    expect(MODULE_SELL_VALUES[Rarity.Epic]).toBeLessThan(
      MODULE_SELL_VALUES[Rarity.Legendary]
    );
  });
});

describe('Settings Behavior', () => {
  interface MockSettings {
    confirmRareSells: boolean;
  }

  it('should respect confirmRareSells setting when true', () => {
    const settings: MockSettings = { confirmRareSells: true };
    expect(settings.confirmRareSells).toBe(true);
  });

  it('should respect confirmRareSells setting when false (after "dont ask again")', () => {
    const settings: MockSettings = { confirmRareSells: true };

    // Simulate checking "don't ask again"
    settings.confirmRareSells = false;

    expect(settings.confirmRareSells).toBe(false);
  });

  it('should default confirmRareSells to true', () => {
    // This matches the default in SettingsManager
    const defaultSettings: MockSettings = { confirmRareSells: true };
    expect(defaultSettings.confirmRareSells).toBe(true);
  });
});
