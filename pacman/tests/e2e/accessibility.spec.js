// === Accessibility E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
  });

  test('canvas has proper ARIA attributes', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('role', 'application');
    await expect(canvas).toHaveAttribute('aria-label', 'Pac-Man game');
    await expect(canvas).toHaveAttribute('tabindex', '0');
  });

  test('aria-live regions exist', async ({ page }) => {
    const scoreRegion = page.locator('#aria-score');
    const statusRegion = page.locator('#aria-status');
    await expect(scoreRegion).toHaveAttribute('aria-live', 'polite');
    await expect(statusRegion).toHaveAttribute('aria-live', 'assertive');
  });

  test('canvas is focusable', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await canvas.focus();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('game-canvas');
  });

  test('game is fully keyboard operable', async ({ page }) => {
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
    // Navigate menu
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    // Difficulty
    await page.keyboard.press('Enter');
    // Wait for gameplay
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });
    // Move
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    // Pause
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('PAUSED');
  });

  test('aria-live score updates during gameplay', async ({ page }) => {
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    // Move to eat dots
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1000);

    const scoreText = await page.locator('#aria-score').textContent();
    expect(scoreText).toContain('Score:');
  });

  test('status region announces important events', async ({ page }) => {
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    // The level announcement should have happened
    const statusText = await page.locator('#aria-status').textContent();
    expect(statusText.length).toBeGreaterThan(0);
  });

  test('focus indicator visible on canvas', async ({ page }) => {
    await page.click('#game-canvas');
    const boxShadow = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      canvas.focus();
      return getComputedStyle(canvas).boxShadow;
    });
    // Should have a visible focus indicator
    expect(boxShadow).not.toBe('none');
  });

  test('prefers-reduced-motion is respected', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(500);

    const settings = await page.evaluate(() => window.__PACMAN_APP__?.settings?.getAll());
    expect(settings.reducedMotion).toBe(true);
    expect(settings.screenShake).toBe(false);
  });

  test('touch controls have aria labels', async ({ page }) => {
    const upBtn = page.locator('.touch-up');
    const leftBtn = page.locator('.touch-left');
    const rightBtn = page.locator('.touch-right');
    const downBtn = page.locator('.touch-down');
    const pauseBtn = page.locator('.touch-pause');

    await expect(upBtn).toHaveAttribute('aria-label', 'Move up');
    await expect(leftBtn).toHaveAttribute('aria-label', 'Move left');
    await expect(rightBtn).toHaveAttribute('aria-label', 'Move right');
    await expect(downBtn).toHaveAttribute('aria-label', 'Move down');
    await expect(pauseBtn).toHaveAttribute('aria-label', 'Pause game');
  });

  test('touch controls are aria-hidden', async ({ page }) => {
    const controls = page.locator('#touch-controls');
    await expect(controls).toHaveAttribute('aria-hidden', 'true');
  });

  test('page has proper language attribute', async ({ page }) => {
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });
});
