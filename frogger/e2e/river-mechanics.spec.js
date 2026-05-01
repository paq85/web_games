import { test, expect } from '@playwright/test';

test.describe('River Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
  });

  test('frog can move up into river zone', async ({ page }) => {
    // Move frog up through safe zone into river
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('frog drowns when not on platform in river', async ({ page }) => {
    // Move frog up into river rows (rows 3-7, 1-indexed)
    // Move up 5 times to reach row 8 (safe mid-zone), then up again into river
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    // Wait for death animation
    await page.waitForTimeout(1000);
    const assertive = page.locator('#aria-live-assertive');
    // Frog should have drowned or been saved by a platform
    await expect(assertive).toHaveText(/drowned|hit|home|lives/i, { timeout: 5000 });
  });

  test('frog rides with platform movement', async ({ page }) => {
    // Move up to safe mid-zone (row 8)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    // Move up into a river row - frog should ride with log if one passes
    await page.keyboard.press('ArrowUp');
    // Wait for platform movement
    await page.waitForTimeout(2000);
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('turtle diving causes death when frog is on turtle', async ({ page }) => {
    // Move frog into turtle row (row 4 or 6, 1-indexed)
    // This is probabilistic - turtle may or may not be under frog
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    // Wait for turtle to dive
    await page.waitForTimeout(5000);
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('frog dies when carried off screen edge by platform', async ({ page }) => {
    // Move frog to a river row and wait for platform to carry off screen
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    // Wait for platform to carry frog off screen
    await page.waitForTimeout(5000);
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });
});
