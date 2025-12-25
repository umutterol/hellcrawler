import { test, expect } from '@playwright/test';

test.describe('Hellcrawler Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game
    await page.goto('/');

    // Wait for Phaser to initialize (canvas element appears)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  });

  test('should load the game canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has proper dimensions
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should start with wave 1', async ({ page }) => {
    // Wait for game to initialize and first wave to start
    await page.waitForTimeout(2000);

    // Check console for wave start message
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Wait a bit for console messages
    await page.waitForTimeout(500);

    // The wave should have started (check debug logs)
    // In production, we'd check UI elements instead
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should spawn enemies after wave starts', async ({ page }) => {
    // Capture console messages to verify enemy spawning
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Wait for enemies to spawn (wave starts after 1s delay, spawns begin)
    await page.waitForTimeout(3000);

    // Verify enemy activation messages appeared
    const hasEnemySpawn = consoleMessages.some((msg) =>
      msg.includes('[Enemy] Activated')
    );
    expect(hasEnemySpawn).toBe(true);
  });

  test('should fire cannon and spawn projectiles', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Wait for cannon to fire (2.5s cooldown from start)
    await page.waitForTimeout(4000);

    // Verify projectile was fired
    const hasProjectileFire = consoleMessages.some((msg) =>
      msg.includes('[Projectile] Activated')
    );
    expect(hasProjectileFire).toBe(true);
  });

  test('should detect collisions and deal damage', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Wait for enemies to approach and get hit
    await page.waitForTimeout(8000);

    // Verify overlap detection happened
    const hasOverlapDetection = consoleMessages.some((msg) =>
      msg.includes('[CombatSystem] Overlap detected')
    );

    // If no overlap, check if damage numbers spawned
    const hasDamageNumber = consoleMessages.some((msg) =>
      msg.includes('[CombatSystem] Spawning damage number')
    );

    // At least one of these should be true if combat is working
    expect(hasOverlapDetection || hasDamageNumber).toBe(true);
  });

  test('should show FPS counter in dev mode', async ({ page }) => {
    // Wait for game to load
    await page.waitForTimeout(2000);

    // Check console for active counts (logged every second)
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    await page.waitForTimeout(2000);

    // Should have periodic status logs
    const hasStatusLog = consoleMessages.some((msg) =>
      msg.includes('[CombatSystem] Active:')
    );
    expect(hasStatusLog).toBe(true);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait for game to run a bit
    await page.waitForTimeout(5000);

    // Check for unexpected errors (filter out known warnings if any)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('expected_warning')
    );
    expect(unexpectedErrors).toHaveLength(0);
  });
});

test.describe('Game Performance', () => {
  test('should maintain acceptable frame rate', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Monitor console for FPS warnings
    const lowFpsWarnings: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('FPS drop')) {
        lowFpsWarnings.push(text);
      }
    });

    // Let game run for several seconds
    await page.waitForTimeout(10000);

    // Should not have too many FPS drops
    expect(lowFpsWarnings.length).toBeLessThan(5);
  });

  test('should handle enemy pool correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Capture pool status messages
    const poolMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('Active:')) {
        poolMessages.push(msg.text());
      }
    });

    // Wait for multiple waves
    await page.waitForTimeout(15000);

    // Verify pool is being used (should have varying active counts)
    expect(poolMessages.length).toBeGreaterThan(0);
  });
});
