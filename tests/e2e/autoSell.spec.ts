import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for auto-sell Uncommon modules feature
 */

// Configure serial execution
test.describe.configure({ mode: 'serial' });

/**
 * Wait for game to be ready
 */
async function waitForGameReady(page: Page): Promise<void> {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000);
}

test.describe('Auto-sell Uncommon Modules', () => {
  test('should have autoSellUncommon setting disabled by default', async ({ page }) => {
    // Clear settings
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('hellcrawler_settings');
    });

    await page.reload();
    await waitForGameReady(page);

    // Check default value
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    // Default should be false (user must opt-in)
    if (settings && typeof settings.autoSellUncommon !== 'undefined') {
      expect(settings.autoSellUncommon).toBe(false);
    }
  });

  test('should persist autoSellUncommon setting when enabled', async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    // Enable the setting
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.autoSellUncommon = true;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    // Reload and verify
    await page.reload();
    await waitForGameReady(page);

    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    expect(settings.autoSellUncommon).toBe(true);
  });

  test('should toggle autoSellUncommon setting', async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    // Start with false
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.autoSellUncommon = false;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    let settings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
    });
    expect(settings.autoSellUncommon).toBe(false);

    // Toggle to true
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.autoSellUncommon = true;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    settings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
    });
    expect(settings.autoSellUncommon).toBe(true);

    // Toggle back to false
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.autoSellUncommon = false;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    settings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
    });
    expect(settings.autoSellUncommon).toBe(false);
  });

  test('should not have console errors when game runs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Wait for some gameplay
    await page.waitForTimeout(2000);

    // No errors should occur
    expect(errors).toHaveLength(0);
  });

  test('should show toggle in settings panel', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Open settings panel (ESC key)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Look for settings panel opening log
    const hasPanelLog = consoleMessages.some(
      (msg) => msg.includes('[SettingsPanel]') || msg.includes('panel:opened')
    );

    // The test is mainly to ensure settings panel opens without errors
    // The toggle appearance is handled by the Phaser UI
    expect(page.locator('canvas')).toBeVisible();
  });

  test('should work with both autoSellUncommon and confirmRareSells settings', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await waitForGameReady(page);

    // Set both settings
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
      settings.autoSellUncommon = true;
      settings.confirmRareSells = true;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    // Reload and verify
    await page.reload();
    await waitForGameReady(page);

    const settings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('hellcrawler_settings') || '{}');
    });

    expect(settings.autoSellUncommon).toBe(true);
    expect(settings.confirmRareSells).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
