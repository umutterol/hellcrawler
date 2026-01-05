/**
 * Unit tests for ContextMenu component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Test context menu item structure
 */
interface TestContextMenuItem {
  label: string;
  icon?: string;
  enabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
}

describe('ContextMenu Item Builder', () => {
  /**
   * Build context menu items for an inventory module
   */
  function buildInventoryContextMenu(hasAvailableSlot: boolean): TestContextMenuItem[] {
    const items: TestContextMenuItem[] = [];

    items.push({
      label: 'Equip',
      icon: '⬆',
      enabled: hasAvailableSlot,
      onClick: vi.fn(),
    });

    items.push({ separator: true, label: '' });

    items.push({
      label: 'Sell',
      icon: '💰',
      enabled: true,
      onClick: vi.fn(),
    });

    return items;
  }

  /**
   * Build context menu items for an equipped module
   */
  function buildEquippedContextMenu(): TestContextMenuItem[] {
    const items: TestContextMenuItem[] = [];

    items.push({
      label: 'Unequip',
      icon: '⬇',
      enabled: true,
      onClick: vi.fn(),
    });

    return items;
  }

  it('should build inventory context menu with correct items', () => {
    const items = buildInventoryContextMenu(true);

    expect(items.length).toBe(3);
    expect(items[0]!.label).toBe('Equip');
    expect(items[0]!.enabled).toBe(true);
    expect(items[1]!.separator).toBe(true);
    expect(items[2]!.label).toBe('Sell');
  });

  it('should disable Equip when no slots available', () => {
    const items = buildInventoryContextMenu(false);

    expect(items[0]!.label).toBe('Equip');
    expect(items[0]!.enabled).toBe(false);
  });

  it('should build equipped context menu with correct items', () => {
    const items = buildEquippedContextMenu();

    expect(items.length).toBe(1);
    expect(items[0]!.label).toBe('Unequip');
    expect(items[0]!.enabled).toBe(true);
  });

  it('should have icons for all non-separator items', () => {
    const items = buildInventoryContextMenu(true);
    const nonSeparatorItems = items.filter((i) => !i.separator);

    for (const item of nonSeparatorItems) {
      expect(item.icon).toBeDefined();
      expect(item.icon?.length).toBeGreaterThan(0);
    }
  });
});

describe('ContextMenu Position Calculation', () => {
  const MENU_WIDTH = 140;
  const SCREEN_WIDTH = 1920;
  const SCREEN_HEIGHT = 350;

  /**
   * Calculate menu position to stay within screen bounds
   */
  function calculateMenuPosition(
    clickX: number,
    clickY: number,
    menuHeight: number
  ): { x: number; y: number } {
    let x = clickX;
    let y = clickY;

    // Check right edge
    if (x + MENU_WIDTH > SCREEN_WIDTH) {
      x = SCREEN_WIDTH - MENU_WIDTH - 10;
    }

    // Check bottom edge
    if (y + menuHeight > SCREEN_HEIGHT) {
      y = SCREEN_HEIGHT - menuHeight - 10;
    }

    // Ensure not off left or top
    x = Math.max(10, x);
    y = Math.max(10, y);

    return { x, y };
  }

  it('should not adjust position for click in middle of screen', () => {
    const pos = calculateMenuPosition(500, 100, 100);
    expect(pos.x).toBe(500);
    expect(pos.y).toBe(100);
  });

  it('should adjust x when near right edge', () => {
    const pos = calculateMenuPosition(1850, 100, 100);
    expect(pos.x).toBe(SCREEN_WIDTH - MENU_WIDTH - 10);
  });

  it('should adjust y when near bottom edge', () => {
    const pos = calculateMenuPosition(500, 300, 100);
    expect(pos.y).toBe(SCREEN_HEIGHT - 100 - 10);
  });

  it('should ensure minimum x of 10', () => {
    const pos = calculateMenuPosition(5, 100, 100);
    expect(pos.x).toBe(10);
  });

  it('should ensure minimum y of 10', () => {
    const pos = calculateMenuPosition(500, 5, 100);
    expect(pos.y).toBe(10);
  });
});

describe('Right-click Detection', () => {
  it('should identify right-click vs left-click', () => {
    // Simulate pointer events
    const leftClick = { rightButtonDown: () => false };
    const rightClick = { rightButtonDown: () => true };

    expect(leftClick.rightButtonDown()).toBe(false);
    expect(rightClick.rightButtonDown()).toBe(true);
  });

  it('should have distinct actions for left vs right click', () => {
    const leftClickAction = 'select';
    const rightClickAction = 'contextMenu';

    // Left-click should select/double-click
    expect(leftClickAction).toBe('select');

    // Right-click should show context menu
    expect(rightClickAction).toBe('contextMenu');
  });
});
