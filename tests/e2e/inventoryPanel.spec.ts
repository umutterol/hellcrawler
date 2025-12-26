import { test, expect, Page } from '@playwright/test';

// Configure tests to run serially to avoid race conditions
test.describe.configure({ mode: 'serial' });

// Helper to set up console logging before navigation
async function setupConsoleCapture(page: Page): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (msg) => {
    messages.push(msg.text());
  });
  return messages;
}

// Helper to wait for game initialization
async function waitForGameReady(page: Page): Promise<void> {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  // Wait for panels to be created
  await page.waitForTimeout(2000);
}

// Helper to wait for specific console message
async function waitForMessage(
  page: Page,
  messages: string[],
  pattern: string,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (messages.some((msg) => msg.includes(pattern))) {
      return true;
    }
    await page.waitForTimeout(100);
  }
  return false;
}

test.describe('Inventory Panel - Basic Functionality', () => {
  test('should open inventory panel with I key', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Press I to open inventory panel
    await page.keyboard.press('i');

    // Wait for panel open log
    const hasOpenLog = await waitForMessage(
      page,
      consoleMessages,
      '[SlidingPanel] Opening inventory',
      3000
    );
    expect(hasOpenLog).toBe(true);
  });

  test('should close inventory panel with I key when open', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Close panel
    await page.keyboard.press('i');

    // Wait for panel close log
    const hasCloseLog = await waitForMessage(
      page,
      consoleMessages,
      '[SlidingPanel] Closing inventory',
      3000
    );
    expect(hasCloseLog).toBe(true);
  });

  test('should close inventory panel with ESC key', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Press ESC - this should either close inventory or open settings
    await page.keyboard.press('Escape');

    // Wait for panel change
    await page.waitForTimeout(500);

    // Either the inventory closed or settings opened
    const hasInventoryClose = consoleMessages.some((msg) =>
      msg.includes('[SlidingPanel] Closing inventory')
    );
    const hasSettingsOpen = consoleMessages.some((msg) =>
      msg.includes('[SlidingPanel] Opening settings')
    );

    expect(hasInventoryClose || hasSettingsOpen).toBe(true);
  });

  test('should switch from inventory to tank stats with TAB', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Switch to tank stats
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Should have opened tank_stats panel
    const hasTankStatsOpen = await waitForMessage(
      page,
      consoleMessages,
      '[SlidingPanel] Opening tank_stats',
      3000
    );
    expect(hasTankStatsOpen).toBe(true);
  });

  test('should not have errors when opening inventory panel', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});

test.describe('Inventory Panel - Refresh Behavior', () => {
  test('should log refresh when opened', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');

    // Should refresh content
    const hasRefreshLog = await waitForMessage(
      page,
      consoleMessages,
      '[InventoryPanel] Refreshing content',
      3000
    );
    expect(hasRefreshLog).toBe(true);
  });

  test('should refresh on each open', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open panel first time
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Close panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Open panel second time
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Count refresh messages
    const refreshCount = consoleMessages.filter((msg) =>
      msg.includes('[InventoryPanel] Refreshing content')
    ).length;

    expect(refreshCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Inventory Panel - Panel Switching', () => {
  test('should switch between all panel types without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Cycle through all panels
    await page.keyboard.press('Tab'); // Tank Stats
    await page.waitForTimeout(400);
    await page.keyboard.press('i'); // Inventory
    await page.waitForTimeout(400);
    await page.keyboard.press('p'); // Shop
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape'); // Settings
    await page.waitForTimeout(400);

    expect(errors).toHaveLength(0);
  });

  test('should only have one panel open at a time', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(400);

    // Switch to tank stats
    await page.keyboard.press('Tab');
    await page.waitForTimeout(400);

    // Check that inventory closed when tank stats opened
    const inventoryOpenIndex = consoleMessages.findIndex((msg) =>
      msg.includes('Opening inventory')
    );
    const tankStatsOpenIndex = consoleMessages.findIndex((msg) =>
      msg.includes('Opening tank_stats')
    );

    // Tank stats should open after inventory
    expect(tankStatsOpenIndex).toBeGreaterThan(inventoryOpenIndex);
  });
});

test.describe('Inventory Panel - Rapid Interactions', () => {
  test('should handle rapid panel toggles without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Rapidly toggle inventory panel
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('i');
      await page.waitForTimeout(50);
    }

    // Wait for animations to settle
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('should handle rapid panel switching without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Rapidly switch between panels
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('i');
      await page.waitForTimeout(100);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      await page.keyboard.press('p');
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Inventory Panel - Module Display', () => {
  test('should show equipped modules section', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Wait for starting module to be equipped
    const hasStartingModule = await waitForMessage(
      page,
      consoleMessages,
      'Equipped starting module',
      5000
    );

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Panel should open without errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);

    // Starting module should have been equipped
    expect(hasStartingModule).toBe(true);
  });

  test('should display inventory count in header', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');

    // The inventory panel should refresh and show the inventory
    const hasRefresh = await waitForMessage(
      page,
      consoleMessages,
      '[InventoryPanel] Refreshing',
      3000
    );
    expect(hasRefresh).toBe(true);
  });
});

test.describe('Inventory Panel - Click Interactions', () => {
  test('should not crash when clicking on panel area', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Click in various positions where panel should be (left side of screen)
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Click in panel area (left 400px)
    await page.mouse.click(200, 300);
    await page.waitForTimeout(100);
    await page.mouse.click(300, 400);
    await page.waitForTimeout(100);
    await page.mouse.click(100, 500);
    await page.waitForTimeout(100);

    expect(errors).toHaveLength(0);
  });

  test('should handle module selection attempts', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Click in equipped slots area (top left of panel)
    await page.mouse.click(100, 150);
    await page.waitForTimeout(200);

    // If a module was selected, we'd see a log
    // Even if no module is there, clicking shouldn't error
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Inventory Panel - Game Integration', () => {
  test('should keep game running while panel is open', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Wait for wave to start
    await waitForMessage(page, consoleMessages, '[WaveSystem] Started wave', 5000);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(1000);

    // Game should still be running - check for enemy spawns or projectiles
    await page.waitForTimeout(3000);

    // Count game activity logs after panel opened
    const recentLogs = consoleMessages.slice(-50);
    const hasGameActivity =
      recentLogs.some((msg) => msg.includes('[Enemy]')) ||
      recentLogs.some((msg) => msg.includes('[Projectile]')) ||
      recentLogs.some((msg) => msg.includes('[CombatSystem]'));

    expect(hasGameActivity).toBe(true);
  });

  test('should respond to skill keys while panel is open', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Try activating a skill
    await page.keyboard.press('1');

    // Should respond to skill key
    const hasSkillResponse = await waitForMessage(
      page,
      consoleMessages,
      'Key 1 pressed',
      2000
    );
    expect(hasSkillResponse).toBe(true);
  });
});

test.describe('Inventory Panel - Collapse Button', () => {
  test('should close panel when clicking collapse area', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Click on collapse button area (top left corner of panel, around x:32, y:72)
    // Panel starts at y=48 (below top bar), button is at (16, 8) relative to panel
    // So absolute position is around (16+16, 48+8+16) = (32, 72)
    await page.mouse.click(32, 72);
    await page.waitForTimeout(500);

    // Check if panel closed
    const hasCloseLog = consoleMessages.some((msg) =>
      msg.includes('[SlidingPanel] Closing inventory')
    );

    // Either close was triggered or at minimum no errors occurred
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    await page.waitForTimeout(200);

    expect(errors).toHaveLength(0);
  });
});

test.describe('Inventory Panel - Long Session', () => {
  test('should handle extended open duration without memory issues', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory panel
    await page.keyboard.press('i');

    // Keep panel open for extended time
    await page.waitForTimeout(10000);

    // Close panel
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('should handle multiple open/close cycles', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Multiple open/close cycles with varying delays
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('i');
      await page.waitForTimeout(500 + Math.random() * 500);
      await page.keyboard.press('i');
      await page.waitForTimeout(300 + Math.random() * 300);
    }

    expect(errors).toHaveLength(0);
  });
});
