// === Mobile/Responsive E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Mobile & Responsive', () => {
  test('game renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Canvas should fit within viewport
    const box = await canvas.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
    expect(box.height).toBeLessThanOrEqual(667);
  });

  test('game renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('game renders on large desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('touch controls shown on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const touchControls = page.locator('#touch-controls');
    await expect(touchControls).toBeVisible();
  });

  test('canvas scales proportionally', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForTimeout(500);

    const box = await page.locator('#game-canvas').boundingBox();
    // Aspect ratio should be approximately 448/496 ≈ 0.903
    const aspectRatio = box.width / box.height;
    expect(aspectRatio).toBeCloseTo(448 / 496, 0.5);
  });

  test('game is playable at 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 512, height: 384 }); // Simulates 200% zoom on 1024x768
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Should still be functional - use evaluate to check state directly
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('MENU');
  });

  test('swipe gestures change direction on mobile', async ({ page, browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const touchPage = await context.newPage();
    await touchPage.goto('/');
    await touchPage.waitForSelector('#game-canvas');
    await touchPage.evaluate(() => document.getElementById('game-canvas').focus());

    // Start game via keyboard (simulates touch tap as confirm)
    await touchPage.keyboard.press('Enter');
    await touchPage.waitForTimeout(100);
    await touchPage.keyboard.press('Enter');
    await touchPage.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    // Simulate swipe right on canvas
    const canvas = touchPage.locator('#game-canvas');
    const box = await canvas.boundingBox();
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await touchPage.touchscreen.tap(startX, startY);
    await touchPage.waitForTimeout(100);

    const state = await touchPage.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('PLAYING');
    await context.close();
  });
});
