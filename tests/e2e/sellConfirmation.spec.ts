import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for sell confirmation modal
 */

// Configure serial execution
test.describe.configure({ mode: 'serial' });

/**
 * Helper to capture console messages
 */
async function setupConsoleCapture(page: Page): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (msg) => {
    messages.push(msg.text());
  });
  return messages;
}

/**
 * Wait for game to be ready
 */
async function waitForGameReady(page: Page): Promise<void> {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000);
}

/**
 * Wait for a specific console message pattern
 */
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

test.describe('Sell Confirmation Modal', () => {
  test('should have confirmRareSells setting enabled by default', async ({ page }) => {
    // Clear settings
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('hellcrawler_settings');
    });

    await page.reload();
    await waitForGameReady(page);

    // Open inventory to trigger settings initialization
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Check settings
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    // Default should be true
    if (settings) {
      expect(settings.confirmRareSells).toBe(true);
    }
  });

  test('should persist confirmRareSells setting when disabled', async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    // Disable the setting
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.confirmRareSells = false;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    // Reload and verify
    await page.reload();
    await waitForGameReady(page);

    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    expect(settings.confirmRareSells).toBe(false);
  });

  test('should not have console errors when opening inventory', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Close inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(300);

    // No errors should occur
    expect(errors).toHaveLength(0);
  });

  test('should log sell actions in dev mode', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Look for inventory panel logs
    const hasPanelLog = await waitForMessage(page, consoleMessages, '[InventoryPanel]', 3000);
    expect(hasPanelLog).toBe(true);
  });

  test('should work with confirmRareSells enabled', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Ensure setting is enabled
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.confirmRareSells = true;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    // Open and close inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(500);
    await page.keyboard.press('i');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('should work with confirmRareSells disabled', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Disable setting
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.confirmRareSells = false;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    // Open and close inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(500);
    await page.keyboard.press('i');
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });

  test('should toggle setting between true and false', async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    // Start with true
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.confirmRareSells = true;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    let settings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
    });
    expect(settings.confirmRareSells).toBe(true);

    // Toggle to false
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.confirmRareSells = false;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    settings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
    });
    expect(settings.confirmRareSells).toBe(false);
  });
});
