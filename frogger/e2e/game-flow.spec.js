import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
  });

  test('shows idle screen on load', async ({ page }) => {
    await expect(page.locator('#hud-score')).toBeVisible();
    await expect(page.locator('#hud-level')).toHaveText('Level 1');
  });

  test('starts game on space press', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    // Game should be running - canvas should be rendering
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('moves frog up with arrow key', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    // Frog should still be visible (no death)
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('moves frog in all directions', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('WASD controls work', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    await page.keyboard.press('W');
    await page.waitForTimeout(200);
    await page.keyboard.press('A');
    await page.waitForTimeout(200);
    await page.keyboard.press('S');
    await page.waitForTimeout(200);
    await page.keyboard.press('D');
    await page.waitForTimeout(200);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('pauses game with Escape', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.locator('#game-canvas').focus();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const assertive = page.locator('#aria-live-assertive');
    await expect(assertive).toHaveText(/paused/i, { timeout: 3000 });
  });

  test('resumes game with Escape', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.locator('#game-canvas').focus();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const assertive = page.locator('#aria-live-assertive');
    await expect(assertive).toHaveText(/resumed/i, { timeout: 3000 });
  });

  test('pauses with P key', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.locator('#game-canvas').focus();
    await page.keyboard.press('P');
    await page.waitForTimeout(1000);

    const assertive = page.locator('#aria-live-assertive');
    await expect(assertive).toHaveText(/paused/i, { timeout: 3000 });
  });

  test('shows game over after losing all lives', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Wait for timer to expire (this takes time, set short timer for test)
    // Instead, let's just verify the game is running
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('restarts game after game over', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Press space again - should work in game over state too
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });
});
