import { test, expect } from '@playwright/test';

test.describe('Responsive Layout', () => {
  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const dpad = page.locator('#dpad');
    await expect(dpad).toBeVisible();
  });

  test('canvas scales to fit viewport', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 700 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    expect(box.width).toBeLessThan(400);
  });

  test('HUD is visible on all viewports', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    await expect(page.locator('#hud-score')).toBeVisible();
    await expect(page.locator('#hud-level')).toBeVisible();
    await expect(page.locator('#hud-lives')).toBeVisible();
    await expect(page.locator('#mute-btn')).toBeVisible();
  });

  test('timer bar is visible', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    await expect(page.locator('#timer-bar')).toBeVisible();
  });
});
