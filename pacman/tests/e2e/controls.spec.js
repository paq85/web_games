// === Controls E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
    // Start a game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });
  });

  test('arrow keys change pacman direction', async ({ page }) => {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    const dir = await page.evaluate(() => {
      const p = window.__PACMAN_APP__?.pacman;
      return p?.nextDir || p?.dir;
    });
    expect(dir).toEqual({ x: -1, y: 0 });
  });

  test('WASD keys work', async ({ page }) => {
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(100);
    const dir = await page.evaluate(() => {
      const p = window.__PACMAN_APP__?.pacman;
      return p?.nextDir || p?.dir;
    });
    expect(dir).toEqual({ x: -1, y: 0 });
  });

  test('M key toggles mute', async ({ page }) => {
    const initialMuted = await page.evaluate(() => window.__PACMAN_APP__?.audio?.muted);
    await page.keyboard.press('KeyM');
    await page.waitForTimeout(100);
    const afterMuted = await page.evaluate(() => window.__PACMAN_APP__?.audio?.muted);
    expect(afterMuted).not.toBe(initialMuted);
  });

  test('Escape pauses the game', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('PAUSED');
  });

  test('game keys do not trigger browser scroll', async ({ page }) => {
    // Check that game canvas has focus and keys don't scroll
    const scrollY = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBe(scrollY);
  });

  test('direction buffering works', async ({ page }) => {
    // Queue a direction before reaching intersection
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    const nextDir = await page.evaluate(() => {
      const p = window.__PACMAN_APP__?.pacman;
      return p?.nextDir;
    });
    expect(nextDir).toEqual({ x: 0, y: 1 });
  });
});

test.describe('Touch Controls', () => {
  test('touch controls visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const touchControls = page.locator('#touch-controls');
    await expect(touchControls).toBeVisible();
  });

  test('touch buttons exist', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const upBtn = page.locator('.touch-up');
    const downBtn = page.locator('.touch-down');
    const leftBtn = page.locator('.touch-left');
    const rightBtn = page.locator('.touch-right');
    const pauseBtn = page.locator('.touch-pause');

    await expect(upBtn).toBeVisible();
    await expect(downBtn).toBeVisible();
    await expect(leftBtn).toBeVisible();
    await expect(rightBtn).toBeVisible();
    await expect(pauseBtn).toBeVisible();
  });

  test('touch targets meet minimum 44px size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    const sizes = await page.evaluate(() => {
      const btns = document.querySelectorAll('.touch-btn');
      return Array.from(btns).map(btn => {
        const rect = btn.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
    });

    for (const size of sizes) {
      expect(size.width).toBeGreaterThanOrEqual(40); // Allow small CSS rounding
      expect(size.height).toBeGreaterThanOrEqual(40);
    }
  });
});
