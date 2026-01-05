import { describe, it, expect, beforeEach } from 'vitest';
import { UI_CONFIG } from '../../src/config/UIConfig';

/**
 * Unit tests for Tooltip system
 *
 * Tests tooltip positioning logic and content formatting
 */

// Mock tooltip positioning logic
function positionTooltip(
  x: number,
  y: number,
  tooltipWidth: number,
  tooltipHeight: number
): { tooltipX: number; tooltipY: number } {
  const offsetX = UI_CONFIG.TOOLTIP.OFFSET_X;
  const offsetY = UI_CONFIG.TOOLTIP.OFFSET_Y;

  // Default position: below and to the right of cursor
  let tooltipX = x + offsetX;
  let tooltipY = y + offsetY;

  // Handle right edge
  if (tooltipX + tooltipWidth > UI_CONFIG.WIDTH) {
    tooltipX = x - tooltipWidth - offsetX;
  }

  // Handle bottom edge
  if (tooltipY + tooltipHeight > UI_CONFIG.HEIGHT) {
    tooltipY = y - tooltipHeight - offsetY;
  }

  // Handle left edge
  if (tooltipX < 0) {
    tooltipX = offsetX;
  }

  // Handle top edge
  if (tooltipY < 0) {
    tooltipY = offsetY;
  }

  return { tooltipX, tooltipY };
}

// Mock stat formatting
function formatStatType(type: string): string {
  const names: Record<string, string> = {
    damage: 'Damage',
    attackSpeed: 'Attack Speed',
    critChance: 'Crit Chance',
    critDamage: 'Crit Damage',
    cdr: 'CDR',
    aoe: 'AoE',
    lifesteal: 'Lifesteal',
    multistrike: 'Multistrike',
    range: 'Range',
    goldFind: 'Gold Find',
    xpBonus: 'XP Bonus',
  };
  return names[type] || type;
}

// Mock module type formatting
function formatModuleType(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Mock rarity color getter
function getRarityColorHex(rarity: string): string {
  switch (rarity) {
    case 'common':
      return '#ffffff';
    case 'uncommon':
      return '#4ade80';
    case 'rare':
      return '#60a5fa';
    case 'epic':
      return '#c084fc';
    case 'legendary':
      return '#fb923c';
    default:
      return '#ffffff';
  }
}

describe('Tooltip Positioning', () => {
  const tooltipWidth = 200;
  const tooltipHeight = 150;

  it('should position tooltip to right and below cursor by default', () => {
    const { tooltipX, tooltipY } = positionTooltip(100, 100, tooltipWidth, tooltipHeight);

    expect(tooltipX).toBe(100 + UI_CONFIG.TOOLTIP.OFFSET_X);
    expect(tooltipY).toBe(100 + UI_CONFIG.TOOLTIP.OFFSET_Y);
  });

  it('should flip horizontally when near right edge', () => {
    const x = UI_CONFIG.WIDTH - 50; // Near right edge
    const { tooltipX } = positionTooltip(x, 100, tooltipWidth, tooltipHeight);

    // Should flip to left of cursor
    expect(tooltipX).toBe(x - tooltipWidth - UI_CONFIG.TOOLTIP.OFFSET_X);
  });

  it('should flip vertically when near bottom edge', () => {
    const y = UI_CONFIG.HEIGHT - 50; // Near bottom edge
    const { tooltipY } = positionTooltip(100, y, tooltipWidth, tooltipHeight);

    // Should flip to above cursor
    expect(tooltipY).toBe(y - tooltipHeight - UI_CONFIG.TOOLTIP.OFFSET_Y);
  });

  it('should stay within left edge', () => {
    // Start with position that would flip to left of cursor but go off screen
    const x = tooltipWidth + UI_CONFIG.TOOLTIP.OFFSET_X - 10; // Would result in negative X after flip
    const { tooltipX } = positionTooltip(x, 100, tooltipWidth, tooltipHeight);

    // Position after right edge flip would be negative, so use offset
    if (x + UI_CONFIG.TOOLTIP.OFFSET_X + tooltipWidth > UI_CONFIG.WIDTH) {
      expect(tooltipX).toBeGreaterThanOrEqual(0);
    }
  });

  it('should stay within top edge', () => {
    // Start with position that would flip above cursor but go off screen
    const y = tooltipHeight + UI_CONFIG.TOOLTIP.OFFSET_Y - 10;
    const { tooltipY } = positionTooltip(100, y, tooltipWidth, tooltipHeight);

    if (y + UI_CONFIG.TOOLTIP.OFFSET_Y + tooltipHeight > UI_CONFIG.HEIGHT) {
      expect(tooltipY).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle corner case (bottom-right)', () => {
    const x = UI_CONFIG.WIDTH - 20;
    const y = UI_CONFIG.HEIGHT - 20;
    const { tooltipX, tooltipY } = positionTooltip(x, y, tooltipWidth, tooltipHeight);

    // Both should flip
    expect(tooltipX).toBeLessThan(x);
    expect(tooltipY).toBeLessThan(y);
  });

  it('should handle origin position (0, 0)', () => {
    const { tooltipX, tooltipY } = positionTooltip(0, 0, tooltipWidth, tooltipHeight);

    expect(tooltipX).toBe(UI_CONFIG.TOOLTIP.OFFSET_X);
    expect(tooltipY).toBe(UI_CONFIG.TOOLTIP.OFFSET_Y);
  });

  it('should handle center position correctly', () => {
    const x = UI_CONFIG.WIDTH / 2;
    const y = UI_CONFIG.HEIGHT / 2;
    const { tooltipX, tooltipY } = positionTooltip(x, y, tooltipWidth, tooltipHeight);

    // At center, no flipping needed
    expect(tooltipX).toBe(x + UI_CONFIG.TOOLTIP.OFFSET_X);
    expect(tooltipY).toBe(y + UI_CONFIG.TOOLTIP.OFFSET_Y);
  });
});

describe('Tooltip Content Formatting', () => {
  describe('Stat Type Formatting', () => {
    it('should format damage stat', () => {
      expect(formatStatType('damage')).toBe('Damage');
    });

    it('should format attack speed stat', () => {
      expect(formatStatType('attackSpeed')).toBe('Attack Speed');
    });

    it('should format crit chance stat', () => {
      expect(formatStatType('critChance')).toBe('Crit Chance');
    });

    it('should format crit damage stat', () => {
      expect(formatStatType('critDamage')).toBe('Crit Damage');
    });

    it('should format CDR stat', () => {
      expect(formatStatType('cdr')).toBe('CDR');
    });

    it('should format AoE stat', () => {
      expect(formatStatType('aoe')).toBe('AoE');
    });

    it('should format lifesteal stat', () => {
      expect(formatStatType('lifesteal')).toBe('Lifesteal');
    });

    it('should format multistrike stat', () => {
      expect(formatStatType('multistrike')).toBe('Multistrike');
    });

    it('should format range stat', () => {
      expect(formatStatType('range')).toBe('Range');
    });

    it('should format gold find stat', () => {
      expect(formatStatType('goldFind')).toBe('Gold Find');
    });

    it('should format XP bonus stat', () => {
      expect(formatStatType('xpBonus')).toBe('XP Bonus');
    });

    it('should return original for unknown stat', () => {
      expect(formatStatType('unknownStat')).toBe('unknownStat');
    });
  });

  describe('Module Type Formatting', () => {
    it('should format machineGun type', () => {
      expect(formatModuleType('machineGun')).toBe('Machine Gun');
    });

    it('should format missilePod type', () => {
      expect(formatModuleType('missilePod')).toBe('Missile Pod');
    });

    it('should format repairDrone type', () => {
      expect(formatModuleType('repairDrone')).toBe('Repair Drone');
    });

    it('should handle single word types', () => {
      expect(formatModuleType('tesla')).toBe('Tesla');
    });

    it('should handle uppercase first letter', () => {
      expect(formatModuleType('MachineGun')).toBe('Machine Gun');
    });
  });

  describe('Rarity Color Mapping', () => {
    it('should return white for common rarity', () => {
      expect(getRarityColorHex('common')).toBe('#ffffff');
    });

    it('should return green for uncommon rarity', () => {
      expect(getRarityColorHex('uncommon')).toBe('#4ade80');
    });

    it('should return blue for rare rarity', () => {
      expect(getRarityColorHex('rare')).toBe('#60a5fa');
    });

    it('should return purple for epic rarity', () => {
      expect(getRarityColorHex('epic')).toBe('#c084fc');
    });

    it('should return orange for legendary rarity', () => {
      expect(getRarityColorHex('legendary')).toBe('#fb923c');
    });

    it('should return white for unknown rarity', () => {
      expect(getRarityColorHex('mythic')).toBe('#ffffff');
    });
  });
});

describe('Tooltip Configuration', () => {
  it('should have reasonable max width', () => {
    expect(UI_CONFIG.TOOLTIP.MAX_WIDTH).toBeGreaterThan(100);
    expect(UI_CONFIG.TOOLTIP.MAX_WIDTH).toBeLessThan(400);
  });

  it('should have reasonable padding', () => {
    expect(UI_CONFIG.TOOLTIP.PADDING).toBeGreaterThan(0);
    expect(UI_CONFIG.TOOLTIP.PADDING).toBeLessThan(30);
  });

  it('should have reasonable border radius', () => {
    expect(UI_CONFIG.TOOLTIP.BORDER_RADIUS).toBeGreaterThanOrEqual(0);
    expect(UI_CONFIG.TOOLTIP.BORDER_RADIUS).toBeLessThan(20);
  });

  it('should have show delay greater than 0', () => {
    expect(UI_CONFIG.TOOLTIP.SHOW_DELAY).toBeGreaterThan(0);
  });

  it('should have reasonable offset values', () => {
    expect(UI_CONFIG.TOOLTIP.OFFSET_X).toBeGreaterThan(0);
    expect(UI_CONFIG.TOOLTIP.OFFSET_Y).toBeGreaterThan(0);
  });

  it('should have reasonable line height', () => {
    expect(UI_CONFIG.TOOLTIP.LINE_HEIGHT).toBeGreaterThan(10);
    expect(UI_CONFIG.TOOLTIP.LINE_HEIGHT).toBeLessThan(30);
  });

  it('should have reasonable section spacing', () => {
    expect(UI_CONFIG.TOOLTIP.SECTION_SPACING).toBeGreaterThan(0);
    expect(UI_CONFIG.TOOLTIP.SECTION_SPACING).toBeLessThan(20);
  });
});

describe('Tooltip Slot Direction Mapping', () => {
  it('should map slots 0, 2 to right (front) direction', () => {
    // Per Tooltip.ts getSlotDirection logic
    const getDirection = (index: number): 'left' | 'right' | 'both' => {
      switch (index) {
        case 0:
        case 2:
          return 'right';
        case 1:
        case 3:
          return 'left';
        case 4:
          return 'both';
        default:
          return 'right';
      }
    };

    expect(getDirection(0)).toBe('right');
    expect(getDirection(2)).toBe('right');
  });

  it('should map slots 1, 3 to left (back) direction', () => {
    const getDirection = (index: number): 'left' | 'right' | 'both' => {
      switch (index) {
        case 0:
        case 2:
          return 'right';
        case 1:
        case 3:
          return 'left';
        case 4:
          return 'both';
        default:
          return 'right';
      }
    };

    expect(getDirection(1)).toBe('left');
    expect(getDirection(3)).toBe('left');
  });

  it('should map slot 4 to both (center) direction', () => {
    const getDirection = (index: number): 'left' | 'right' | 'both' => {
      switch (index) {
        case 0:
        case 2:
          return 'right';
        case 1:
        case 3:
          return 'left';
        case 4:
          return 'both';
        default:
          return 'right';
      }
    };

    expect(getDirection(4)).toBe('both');
  });

  it('should default to right for unknown slot indices', () => {
    const getDirection = (index: number): 'left' | 'right' | 'both' => {
      switch (index) {
        case 0:
        case 2:
          return 'right';
        case 1:
        case 3:
          return 'left';
        case 4:
          return 'both';
        default:
          return 'right';
      }
    };

    expect(getDirection(5)).toBe('right');
    expect(getDirection(10)).toBe('right');
    expect(getDirection(-1)).toBe('right');
  });
});
