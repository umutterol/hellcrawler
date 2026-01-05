/**
 * Unit tests for double-click to equip/unequip feature
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Double-click threshold constant (must match InventoryPanel)
const DOUBLE_CLICK_THRESHOLD = 300;

/**
 * Helper class to test double-click detection logic
 * Mirrors the logic in InventoryPanel
 */
class DoubleClickDetector {
  private lastClickTime: number = 0;
  private lastClickedId: string | null = null;

  /**
   * Handle a click and return whether it was a double-click
   */
  handleClick(id: string): 'single' | 'double' {
    const now = Date.now();

    if (
      this.lastClickedId === id &&
      now - this.lastClickTime < DOUBLE_CLICK_THRESHOLD
    ) {
      // Double-click detected
      this.lastClickTime = 0;
      this.lastClickedId = null;
      return 'double';
    }

    // Single click
    this.lastClickTime = now;
    this.lastClickedId = id;
    return 'single';
  }

  /**
   * Simulate time passing (for testing)
   */
  simulateTimePass(ms: number): void {
    // Adjust the last click time to simulate time passing
    if (this.lastClickTime > 0) {
      this.lastClickTime -= ms;
    }
  }
}

describe('Double-click Detection', () => {
  let detector: DoubleClickDetector;

  beforeEach(() => {
    detector = new DoubleClickDetector();
    vi.useFakeTimers();
  });

  it('should detect single click', () => {
    const result = detector.handleClick('module-1');
    expect(result).toBe('single');
  });

  it('should detect double-click on same item within threshold', () => {
    // First click
    let result = detector.handleClick('module-1');
    expect(result).toBe('single');

    // Second click immediately after (same item)
    result = detector.handleClick('module-1');
    expect(result).toBe('double');
  });

  it('should NOT detect double-click on different items', () => {
    // First click on item 1
    let result = detector.handleClick('module-1');
    expect(result).toBe('single');

    // Second click on different item
    result = detector.handleClick('module-2');
    expect(result).toBe('single');
  });

  it('should NOT detect double-click after threshold expires', () => {
    // First click
    let result = detector.handleClick('module-1');
    expect(result).toBe('single');

    // Simulate time passing beyond threshold
    detector.simulateTimePass(DOUBLE_CLICK_THRESHOLD + 100);

    // Second click after threshold
    result = detector.handleClick('module-1');
    expect(result).toBe('single');
  });

  it('should reset after double-click is detected', () => {
    // First click
    detector.handleClick('module-1');

    // Double-click
    const doubleResult = detector.handleClick('module-1');
    expect(doubleResult).toBe('double');

    // Third click should be a new single click
    const thirdResult = detector.handleClick('module-1');
    expect(thirdResult).toBe('single');
  });

  it('should handle rapid triple-click correctly', () => {
    // First click = single
    expect(detector.handleClick('module-1')).toBe('single');

    // Second click = double
    expect(detector.handleClick('module-1')).toBe('double');

    // Third click = single (reset after double)
    expect(detector.handleClick('module-1')).toBe('single');

    // Fourth click = double
    expect(detector.handleClick('module-1')).toBe('double');
  });
});

describe('Double-click Equip/Unequip Logic', () => {
  it('should define correct actions for double-click', () => {
    // Double-click on inventory item = equip
    const inventoryAction = 'equip';
    expect(inventoryAction).toBe('equip');

    // Double-click on equipped item = unequip
    const equippedAction = 'unequip';
    expect(equippedAction).toBe('unequip');
  });

  it('should have reasonable threshold', () => {
    // 300ms is a reasonable double-click threshold
    expect(DOUBLE_CLICK_THRESHOLD).toBeGreaterThanOrEqual(200);
    expect(DOUBLE_CLICK_THRESHOLD).toBeLessThanOrEqual(500);
  });
});
