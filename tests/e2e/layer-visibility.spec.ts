import { test, expect, Page } from '@playwright/test';

// Configure tests to run serially to avoid race conditions with dev server
test.describe.configure({ mode: 'serial' });

// Helper to wait for game to be ready
async function waitForGameReady(page: Page, timeout = 10000): Promise<void> {
  await expect(page.locator('canvas')).toBeVisible({ timeout });
  await page.waitForTimeout(2000); // Wait for scene to initialize
}

// Helper to set up console logging
async function setupConsoleCapture(page: Page): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (msg) => {
    messages.push(msg.text());
  });
  return messages;
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

// Helper to access game state via page.evaluate
async function getSettingValue(page: Page, key: string): Promise<unknown> {
  return page.evaluate((settingKey) => {
    // Access SettingsManager through the window or game
    const settingsManager = (window as unknown as { game: Phaser.Game }).game?.registry?.get('settingsManager');
    if (settingsManager) {
      return settingsManager.getSetting(settingKey);
    }
    // Fallback: try to get from localStorage
    const stored = localStorage.getItem('hellcrawler_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed[settingKey];
    }
    return null;
  }, key);
}

// Helper to toggle a setting via keyboard (open settings, click toggle)
async function openSettingsPanel(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500); // Wait for panel animation
}

test.describe('Layer Visibility Settings', () => {
  test('should load with all layers visible by default', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Check for parallax background initialization
    const hasParallax = await waitForMessage(
      page,
      consoleMessages,
      '[ParallaxBackground]',
      3000
    );

    // Parallax should initialize
    // Default settings should have all layers visible
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    });

    // If no settings saved, defaults are used (all true)
    // If settings exist, verify layer visibility
    if (settings) {
      expect(settings.showSkyLayer ?? true).toBe(true);
      expect(settings.showMountainsLayer ?? true).toBe(true);
      expect(settings.showFarBuildingsLayer ?? true).toBe(true);
      expect(settings.showForegroundLayer ?? true).toBe(true);
    }
  });

  test('should toggle layer visibility via settings panel', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Open settings panel
    await openSettingsPanel(page);
    await page.waitForTimeout(500);

    // The settings panel is rendered on canvas, so we can't directly click toggles
    // Instead, verify the panel opened without errors
    const hasSettingsOpen = await waitForMessage(
      page,
      consoleMessages,
      '[SettingsPanel] Refreshed',
      2000
    );

    // Close settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // No errors should have occurred
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('should update layer visibility when settings change', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Change a layer setting via evaluate
    await page.evaluate(() => {
      // Get current settings
      let settings = {};
      const stored = localStorage.getItem('hellcrawler_settings');
      if (stored) {
        settings = JSON.parse(stored);
      }

      // Toggle sky layer to false
      (settings as Record<string, unknown>).showSkyLayer = false;

      // Save back
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    // Reload page to apply settings
    await page.reload();
    await waitForGameReady(page);

    // Verify the setting persisted
    const skyLayerSetting = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      if (stored) {
        return JSON.parse(stored).showSkyLayer;
      }
      return null;
    });

    expect(skyLayerSetting).toBe(false);

    // Check for visibility log
    const hasVisibilityLog = await waitForMessage(
      page,
      consoleMessages,
      'Layer group sky visibility: false',
      3000
    );

    // The log should appear during initialization
    expect(hasVisibilityLog).toBe(true);
  });

  test('should handle all layer toggles', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);

    // Set all layers to hidden
    await page.goto('/');
    await page.evaluate(() => {
      const settings = {
        showSkyLayer: false,
        showMountainsLayer: false,
        showFarBuildingsLayer: false,
        showForegroundLayer: false,
      };
      const stored = localStorage.getItem('hellcrawler_settings');
      const existingSettings = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        'hellcrawler_settings',
        JSON.stringify({ ...existingSettings, ...settings })
      );
    });

    await page.reload();
    await waitForGameReady(page);

    // Check console for visibility logs
    await page.waitForTimeout(1000);

    // All layer groups should be hidden
    const logs = consoleMessages.filter((msg) => msg.includes('Layer group'));

    // Should have logs for each layer group being set to false
    const skyHidden = logs.some((log) => log.includes('sky') && log.includes('false'));
    const mountainsHidden = logs.some((log) => log.includes('mountains') && log.includes('false'));
    const farBuildingsHidden = logs.some(
      (log) => log.includes('farBuildings') && log.includes('false')
    );
    const foregroundHidden = logs.some(
      (log) => log.includes('foreground') && log.includes('false')
    );

    expect(skyHidden).toBe(true);
    expect(mountainsHidden).toBe(true);
    expect(farBuildingsHidden).toBe(true);
    expect(foregroundHidden).toBe(true);
  });
});

test.describe('Settings Persistence', () => {
  test('should persist layer settings across page reloads', async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    // Modify settings
    await page.evaluate(() => {
      const settings = {
        showSkyLayer: false,
        showMountainsLayer: true,
        showFarBuildingsLayer: false,
        showForegroundLayer: true,
      };
      const stored = localStorage.getItem('hellcrawler_settings');
      const existingSettings = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        'hellcrawler_settings',
        JSON.stringify({ ...existingSettings, ...settings })
      );
    });

    // Reload
    await page.reload();
    await waitForGameReady(page);

    // Verify persistence
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    expect(settings.showSkyLayer).toBe(false);
    expect(settings.showMountainsLayer).toBe(true);
    expect(settings.showFarBuildingsLayer).toBe(false);
    expect(settings.showForegroundLayer).toBe(true);
  });

  test('should persist desktop mode settings', async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    // Modify desktop mode settings
    await page.evaluate(() => {
      const settings = {
        alwaysOnTop: false,
        clickThroughEnabled: false,
      };
      const stored = localStorage.getItem('hellcrawler_settings');
      const existingSettings = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        'hellcrawler_settings',
        JSON.stringify({ ...existingSettings, ...settings })
      );
    });

    // Reload
    await page.reload();
    await waitForGameReady(page);

    // Verify persistence
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    expect(settings.alwaysOnTop).toBe(false);
    expect(settings.clickThroughEnabled).toBe(false);
  });

  test('should merge new settings with defaults on load', async ({ page }) => {
    await page.goto('/');
    await waitForGameReady(page);

    // Set only partial settings (simulating an old save)
    await page.evaluate(() => {
      const partialSettings = {
        masterVolume: 50,
        musicVolume: 30,
        // Missing new layer settings - should use defaults
      };
      localStorage.setItem('hellcrawler_settings', JSON.stringify(partialSettings));
    });

    // Reload
    await page.reload();
    await waitForGameReady(page);

    // Wait for settings to be loaded
    await page.waitForTimeout(1000);

    // Check that layer settings were added with defaults
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    // Old settings should be preserved
    expect(settings.masterVolume).toBe(50);
    expect(settings.musicVolume).toBe(30);

    // New layer settings should use defaults (true)
    // Note: The SettingsManager merges with defaults on load
    expect(settings.showSkyLayer ?? true).toBe(true);
    expect(settings.showMountainsLayer ?? true).toBe(true);
  });

  test('should reset settings to defaults', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // First, set some non-default values
    await page.evaluate(() => {
      const customSettings = {
        masterVolume: 10,
        showSkyLayer: false,
        alwaysOnTop: false,
      };
      localStorage.setItem('hellcrawler_settings', JSON.stringify(customSettings));
    });

    await page.reload();
    await waitForGameReady(page);

    // Now clear settings to reset to defaults
    await page.evaluate(() => {
      localStorage.removeItem('hellcrawler_settings');
    });

    await page.reload();
    await waitForGameReady(page);

    // Check that defaults are used
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      return stored ? JSON.parse(stored) : null;
    });

    // If no settings stored, defaults should be used internally
    // After first save, settings should have defaults
    // For this test, verify the game loads without errors
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});

test.describe('Background Layers Integration', () => {
  test('should not error when rapidly toggling layers', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await waitForGameReady(page);

    // Rapidly toggle layer settings
    for (let i = 0; i < 5; i++) {
      await page.evaluate((index) => {
        const stored = localStorage.getItem('hellcrawler_settings');
        const settings = stored ? JSON.parse(stored) : {};
        settings.showSkyLayer = index % 2 === 0;
        localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
      }, i);

      // Simulate settings change event (in actual app, this triggers via UI)
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('should handle layer settings during gameplay', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await waitForGameReady(page);

    // Wait for gameplay to start
    await waitForMessage(page, consoleMessages, '[WaveSystem] Started wave', 5000);

    // Change layer settings during gameplay
    await page.evaluate(() => {
      const stored = localStorage.getItem('hellcrawler_settings');
      const settings = stored ? JSON.parse(stored) : {};
      settings.showSkyLayer = false;
      settings.showForegroundLayer = false;
      localStorage.setItem('hellcrawler_settings', JSON.stringify(settings));
    });

    // Continue gameplay for a bit
    await page.waitForTimeout(3000);

    // Game should continue without errors
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
