import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
  });

  test('canvas has proper ARIA attributes', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('role', 'application');
    await expect(canvas).toHaveAttribute('tabindex', '0');
    const label = await canvas.getAttribute('aria-label');
    expect(label).toContain('arrow keys');
    expect(label).toContain('WASD');
  });

  test('aria-live regions are present and hidden visually', async ({ page }) => {
    const polite = page.locator('#aria-live-polite');
    const assertive = page.locator('#aria-live-assertive');

    await expect(polite).toHaveAttribute('aria-live', 'polite');
    await expect(assertive).toHaveAttribute('aria-live', 'assertive');
    await expect(polite).toHaveClass(/sr-only/);
    await expect(assertive).toHaveClass(/sr-only/);
  });

  test('canvas receives focus on load', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeFocused();
  });

  test('mute button has aria-label', async ({ page }) => {
    const muteBtn = page.locator('#mute-btn');
    const label = await muteBtn.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('D-pad buttons have aria-labels on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const dpad = page.locator('#dpad');
    await expect(dpad).toBeVisible();

    const buttons = dpad.locator('.dpad-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const label = await buttons.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });

  test('D-pad is hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const dpad = page.locator('#dpad');
    await expect(dpad).not.toBeVisible();
  });

  test('game announces state changes to screen readers', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    const assertive = page.locator('#aria-live-assertive');
    const text = await assertive.textContent();
    expect(text.toLowerCase()).toContain('started');
  });

  test('game announces pause to screen readers', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const assertive = page.locator('#aria-live-assertive');
    const text = await assertive.textContent();
    expect(text.toLowerCase()).toContain('paused');
  });
});
