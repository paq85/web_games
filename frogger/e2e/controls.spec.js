import { test, expect } from '@playwright/test';

test.describe('Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
  });

  test('arrow keys move frog', async ({ page }) => {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('WASD moves frog', async ({ page }) => {
    await page.keyboard.press('W');
    await page.waitForTimeout(100);
    await page.keyboard.press('A');
    await page.waitForTimeout(100);
    await page.keyboard.press('S');
    await page.waitForTimeout(100);
    await page.keyboard.press('D');
    await page.waitForTimeout(100);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('mute toggle with M key', async ({ page }) => {
    await page.keyboard.press('M');
    await page.waitForTimeout(100);

    const muteBtn = page.locator('#mute-btn');
    await expect(muteBtn).toBeVisible();
  });

  test('canvas is focusable', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeFocused();
  });

  test('canvas has role application', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('role', 'application');
  });

  test('canvas has aria-label', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    const label = await canvas.getAttribute('aria-label');
    expect(label).toContain('Frogger');
  });

  test('aria-live regions exist', async ({ page }) => {
    const polite = page.locator('#aria-live-polite');
    const assertive = page.locator('#aria-live-assertive');
    await expect(polite).toHaveAttribute('aria-live', 'polite');
    await expect(assertive).toHaveAttribute('aria-live', 'assertive');
  });

  test('swipe up moves frog', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 4);
      await page.mouse.up();
      await page.waitForTimeout(200);
    }
  });

  test('tap starts game from idle', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await canvas.click();
    await page.waitForTimeout(300);

    await expect(canvas).toBeVisible();
  });
});
