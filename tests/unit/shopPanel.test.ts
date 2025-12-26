/**
 * Shop Panel Unit Tests
 *
 * Tests for slot purchase logic, cost calculations, and requirement checking.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Copy slot costs here to avoid importing GameConfig which pulls in Phaser
// These must match GAME_CONFIG.SLOT_COSTS in src/config/GameConfig.ts
const SLOT_COSTS = [0, 10_000, 50_000, 500_000, 2_000_000] as const;

// Mock GameState for testing
interface MockModuleSlot {
  unlocked: boolean;
  level: number;
  equipped: null;
}

class MockGameState {
  private gold: number = 0;
  private moduleSlots: MockModuleSlot[] = [];
  private bossesDefeated: string[] = [];
  private ubersDefeated: string[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.gold = 0;
    // Slot 0 always unlocked
    this.moduleSlots = [
      { unlocked: true, level: 1, equipped: null },
      { unlocked: false, level: 1, equipped: null },
      { unlocked: false, level: 1, equipped: null },
      { unlocked: false, level: 1, equipped: null },
      { unlocked: false, level: 1, equipped: null },
    ];
    this.bossesDefeated = [];
    this.ubersDefeated = [];
  }

  getGold(): number {
    return this.gold;
  }

  setGold(amount: number): void {
    this.gold = amount;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  getModuleSlots(): MockModuleSlot[] {
    return this.moduleSlots;
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  getBossesDefeated(): string[] {
    return this.bossesDefeated;
  }

  getUbersDefeated(): string[] {
    return this.ubersDefeated;
  }

  defeatBoss(boss: string): void {
    this.bossesDefeated.push(boss);
  }

  defeatUber(uber: string): void {
    this.ubersDefeated.push(uber);
  }

  unlockSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 5) return false;

    const slot = this.moduleSlots[slotIndex];
    if (!slot || slot.unlocked) return false;

    const cost = SLOT_COSTS[slotIndex] ?? 0;
    if (!this.canAfford(cost)) return false;

    this.gold -= cost;
    slot.unlocked = true;
    return true;
  }
}

describe('Slot Costs Configuration', () => {
  it('should have 5 slot costs defined', () => {
    expect(SLOT_COSTS).toHaveLength(5);
  });

  it('should have slot 1 free (cost 0)', () => {
    expect(SLOT_COSTS[0]).toBe(0);
  });

  it('should have increasing costs for each slot', () => {
    for (let i = 1; i < SLOT_COSTS.length; i++) {
      expect(SLOT_COSTS[i]).toBeGreaterThan(SLOT_COSTS[i - 1]);
    }
  });

  it('should have expected costs for each slot', () => {
    expect(SLOT_COSTS[0]).toBe(0);
    expect(SLOT_COSTS[1]).toBe(10_000);
    expect(SLOT_COSTS[2]).toBe(50_000);
    expect(SLOT_COSTS[3]).toBe(500_000);
    expect(SLOT_COSTS[4]).toBe(2_000_000);
  });
});

describe('Slot Purchase Logic', () => {
  let gameState: MockGameState;

  beforeEach(() => {
    gameState = new MockGameState();
  });

  describe('Basic Purchase Flow', () => {
    it('should start with slot 1 unlocked', () => {
      const slots = gameState.getModuleSlots();
      expect(slots[0].unlocked).toBe(true);
    });

    it('should start with slots 2-5 locked', () => {
      const slots = gameState.getModuleSlots();
      expect(slots[1].unlocked).toBe(false);
      expect(slots[2].unlocked).toBe(false);
      expect(slots[3].unlocked).toBe(false);
      expect(slots[4].unlocked).toBe(false);
    });

    it('should unlock slot 2 when player has enough gold', () => {
      gameState.setGold(10_000);
      const result = gameState.unlockSlot(1);
      expect(result).toBe(true);
      expect(gameState.getModuleSlots()[1].unlocked).toBe(true);
    });

    it('should deduct cost when slot is purchased', () => {
      gameState.setGold(15_000);
      gameState.unlockSlot(1);
      expect(gameState.getGold()).toBe(5_000);
    });

    it('should fail to unlock slot when insufficient gold', () => {
      gameState.setGold(5_000);
      const result = gameState.unlockSlot(1);
      expect(result).toBe(false);
      expect(gameState.getModuleSlots()[1].unlocked).toBe(false);
      expect(gameState.getGold()).toBe(5_000);
    });

    it('should fail to unlock already unlocked slot', () => {
      gameState.setGold(20_000);
      gameState.unlockSlot(1);
      const goldAfterFirst = gameState.getGold();

      const result = gameState.unlockSlot(1);
      expect(result).toBe(false);
      expect(gameState.getGold()).toBe(goldAfterFirst);
    });
  });

  describe('All Slots Purchase', () => {
    it('should be able to unlock all slots with enough gold', () => {
      // Total cost: 0 + 10K + 50K + 500K + 2M = 2,560,000
      gameState.setGold(3_000_000);

      gameState.unlockSlot(1);
      gameState.unlockSlot(2);
      gameState.unlockSlot(3);
      gameState.unlockSlot(4);

      const slots = gameState.getModuleSlots();
      expect(slots.every((s) => s.unlocked)).toBe(true);
    });

    it('should calculate total unlock cost correctly', () => {
      const totalCost = SLOT_COSTS.reduce((sum, cost) => sum + cost, 0);
      expect(totalCost).toBe(2_560_000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid slot index', () => {
      gameState.setGold(1_000_000);
      expect(gameState.unlockSlot(-1)).toBe(false);
      expect(gameState.unlockSlot(5)).toBe(false);
      expect(gameState.unlockSlot(100)).toBe(false);
    });

    it('should handle exact gold amount', () => {
      gameState.setGold(10_000);
      const result = gameState.unlockSlot(1);
      expect(result).toBe(true);
      expect(gameState.getGold()).toBe(0);
    });

    it('should handle zero gold', () => {
      gameState.setGold(0);
      const result = gameState.unlockSlot(1);
      expect(result).toBe(false);
    });
  });
});

describe('Slot Requirements', () => {
  const SLOT_REQUIREMENTS: (string | null)[] = [
    null, // Slot 1: Always unlocked
    null, // Slot 2: Gold only
    null, // Slot 3: Gold only
    'Defeat Diaboros (Act 8)', // Slot 4: Boss requirement
    'Defeat all Uber Bosses', // Slot 5: Boss requirement
  ];

  it('should have no requirement for slots 1-3', () => {
    expect(SLOT_REQUIREMENTS[0]).toBeNull();
    expect(SLOT_REQUIREMENTS[1]).toBeNull();
    expect(SLOT_REQUIREMENTS[2]).toBeNull();
  });

  it('should have Diaboros requirement for slot 4', () => {
    expect(SLOT_REQUIREMENTS[3]).toBe('Defeat Diaboros (Act 8)');
  });

  it('should have Uber Bosses requirement for slot 5', () => {
    expect(SLOT_REQUIREMENTS[4]).toBe('Defeat all Uber Bosses');
  });

  describe('Requirement Checking', () => {
    let gameState: MockGameState;

    const checkRequirement = (slotIndex: number): boolean => {
      const requirement = SLOT_REQUIREMENTS[slotIndex];
      if (requirement === null) return true;

      if (slotIndex === 3) {
        return gameState.getBossesDefeated().includes('diaboros');
      } else if (slotIndex === 4) {
        return gameState.getUbersDefeated().length >= 8;
      }
      return false;
    };

    beforeEach(() => {
      gameState = new MockGameState();
    });

    it('should always pass requirement check for slots 1-3', () => {
      expect(checkRequirement(0)).toBe(true);
      expect(checkRequirement(1)).toBe(true);
      expect(checkRequirement(2)).toBe(true);
    });

    it('should fail slot 4 requirement without defeating Diaboros', () => {
      expect(checkRequirement(3)).toBe(false);
    });

    it('should pass slot 4 requirement after defeating Diaboros', () => {
      gameState.defeatBoss('diaboros');
      expect(checkRequirement(3)).toBe(true);
    });

    it('should fail slot 5 requirement without defeating all Ubers', () => {
      expect(checkRequirement(4)).toBe(false);
    });

    it('should fail slot 5 requirement with partial Uber defeats', () => {
      gameState.defeatUber('uber1');
      gameState.defeatUber('uber2');
      expect(checkRequirement(4)).toBe(false);
    });

    it('should pass slot 5 requirement after defeating all 8 Ubers', () => {
      for (let i = 1; i <= 8; i++) {
        gameState.defeatUber(`uber${i}`);
      }
      expect(checkRequirement(4)).toBe(true);
    });
  });
});

describe('Gold Formatting', () => {
  const formatGold = (amount: number): string => {
    if (amount >= 1_000_000) {
      return (amount / 1_000_000).toFixed(1) + 'M';
    } else if (amount >= 1_000) {
      return (amount / 1_000).toFixed(1) + 'K';
    }
    return amount.toString();
  };

  it('should format small amounts as-is', () => {
    expect(formatGold(0)).toBe('0');
    expect(formatGold(100)).toBe('100');
    expect(formatGold(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatGold(1_000)).toBe('1.0K');
    expect(formatGold(10_000)).toBe('10.0K');
    expect(formatGold(50_000)).toBe('50.0K');
    expect(formatGold(500_000)).toBe('500.0K');
  });

  it('should format millions with M suffix', () => {
    expect(formatGold(1_000_000)).toBe('1.0M');
    expect(formatGold(2_000_000)).toBe('2.0M');
    expect(formatGold(2_560_000)).toBe('2.6M');
  });

  it('should format slot costs correctly', () => {
    expect(formatGold(SLOT_COSTS[0])).toBe('0');
    expect(formatGold(SLOT_COSTS[1])).toBe('10.0K');
    expect(formatGold(SLOT_COSTS[2])).toBe('50.0K');
    expect(formatGold(SLOT_COSTS[3])).toBe('500.0K');
    expect(formatGold(SLOT_COSTS[4])).toBe('2.0M');
  });
});

describe('Affordability Display Logic', () => {
  let gameState: MockGameState;

  beforeEach(() => {
    gameState = new MockGameState();
  });

  const calculateGoldNeeded = (cost: number): number => {
    return Math.max(0, cost - gameState.getGold());
  };

  it('should calculate gold needed for slot 2', () => {
    gameState.setGold(5_000);
    expect(calculateGoldNeeded(10_000)).toBe(5_000);
  });

  it('should show 0 gold needed when can afford', () => {
    gameState.setGold(15_000);
    expect(calculateGoldNeeded(10_000)).toBe(0);
  });

  it('should calculate gold needed for expensive slots', () => {
    gameState.setGold(100_000);
    expect(calculateGoldNeeded(500_000)).toBe(400_000);
    expect(calculateGoldNeeded(2_000_000)).toBe(1_900_000);
  });
});

describe('Slot Card State Machine', () => {
  // States: owned, locked (boss requirement), available (can purchase), unaffordable
  type SlotState = 'owned' | 'locked' | 'available' | 'unaffordable';

  const SLOT_REQUIREMENTS: (string | null)[] = [
    null,
    null,
    null,
    'Defeat Diaboros (Act 8)',
    'Defeat all Uber Bosses',
  ];

  const getSlotState = (
    slotIndex: number,
    isUnlocked: boolean,
    meetsRequirement: boolean,
    canAfford: boolean
  ): SlotState => {
    if (isUnlocked) return 'owned';
    if (SLOT_REQUIREMENTS[slotIndex] !== null && !meetsRequirement) return 'locked';
    if (!canAfford) return 'unaffordable';
    return 'available';
  };

  it('should return owned for unlocked slot', () => {
    expect(getSlotState(0, true, true, true)).toBe('owned');
    expect(getSlotState(1, true, true, false)).toBe('owned');
  });

  it('should return locked for slot with unmet requirement', () => {
    expect(getSlotState(3, false, false, true)).toBe('locked');
    expect(getSlotState(4, false, false, true)).toBe('locked');
  });

  it('should return unaffordable when cannot afford', () => {
    expect(getSlotState(1, false, true, false)).toBe('unaffordable');
    expect(getSlotState(2, false, true, false)).toBe('unaffordable');
  });

  it('should return available when can purchase', () => {
    expect(getSlotState(1, false, true, true)).toBe('available');
    expect(getSlotState(2, false, true, true)).toBe('available');
  });

  it('should return available for slots 4-5 when requirement met and can afford', () => {
    expect(getSlotState(3, false, true, true)).toBe('available');
    expect(getSlotState(4, false, true, true)).toBe('available');
  });
});
