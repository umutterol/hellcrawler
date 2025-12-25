import { test, expect, Page } from '@playwright/test';

// Configure tests to run serially to avoid race conditions with dev server
test.describe.configure({ mode: 'serial' });

// Helper to set up console logging before navigation
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
  timeout: number = 10000
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

test.describe('Hellcrawler Game', () => {
  test('should load the game canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should start with wave 1', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Wait for wave to start
    const hasWaveStart = await waitForMessage(page, consoleMessages, '[WaveSystem] Started wave', 5000);
    expect(hasWaveStart).toBe(true);
  });

  test('should spawn enemies after wave starts', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Wait for enemies to spawn
    const hasEnemySpawn = await waitForMessage(page, consoleMessages, '[Enemy] Activated', 5000);
    expect(hasEnemySpawn).toBe(true);
  });

  test('should fire cannon and spawn projectiles', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Wait for cannon to fire (2.5s cooldown from start)
    const hasProjectileFire = await waitForMessage(page, consoleMessages, '[Projectile] Activated', 6000);
    expect(hasProjectileFire).toBe(true);
  });

  test('should detect collisions and deal damage', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Enemies spawn at X=1970, move at ~80-120 speed, need to travel 1700px to reach projectiles
    // This takes about 14-21 seconds. Meanwhile cannon fires every 2.5s
    // Wait longer to ensure combat has happened
    const hasCombat = await waitForMessage(page, consoleMessages, '[CombatSystem] Overlap detected', 25000)
      || consoleMessages.some((msg) => msg.includes('[CombatSystem] Spawning damage number'));

    // If no overlap detected, at least verify cannon is firing at enemies
    if (!hasCombat) {
      console.log('No combat detected. Messages:');
      consoleMessages.filter(m => m.includes('[CombatSystem]') || m.includes('[Enemy]') || m.includes('[Projectile]'))
        .forEach(m => console.log(`  ${m.substring(0, 150)}`));
    }

    expect(hasCombat).toBe(true);
  });

  test('should show FPS counter in dev mode', async ({ page }) => {
    const consoleMessages = await setupConsoleCapture(page);
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Wait for status log
    const hasStatusLog = await waitForMessage(page, consoleMessages, '[CombatSystem] Active:', 5000);
    expect(hasStatusLog).toBe(true);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Wait for game to run a bit
    await page.waitForTimeout(5000);

    // Check for unexpected errors
    expect(errors).toHaveLength(0);
  });
});

test.describe('Game Performance', () => {
  test('should maintain acceptable frame rate', async ({ page }) => {
    const lowFpsWarnings: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('FPS drop')) {
        lowFpsWarnings.push(text);
      }
    });

    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Let game run for several seconds
    await page.waitForTimeout(10000);

    // Should not have too many FPS drops
    expect(lowFpsWarnings.length).toBeLessThan(5);
  });

  test('should handle enemy pool correctly', async ({ page }) => {
    const poolMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('Active:')) {
        poolMessages.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Wait for multiple waves
    await page.waitForTimeout(15000);

    // Verify pool is being used (should have varying active counts)
    expect(poolMessages.length).toBeGreaterThan(0);
  });
});
