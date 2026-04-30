import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('canvas has role application', async ({ page }) => {
    await page.goto('/');
    const role = await page.locator('#game-canvas').getAttribute('role');
    expect(role).toBe('application');
  });

  test('canvas has aria-label', async ({ page }) => {
    await page.goto('/');
    const label = await page.locator('#game-canvas').getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label.length).toBeGreaterThan(10);
  });

  test('canvas is focusable', async ({ page }) => {
    await page.goto('/');
    const tabindex = await page.locator('#game-canvas').getAttribute('tabindex');
    expect(tabindex).toBe('0');
  });

  test('aria-live regions exist', async ({ page }) => {
    await page.goto('/');
    const polite = await page.locator('#aria-live-polite').getAttribute('aria-live');
    const assertive = await page.locator('#aria-live-assertive').getAttribute('aria-live');
    expect(polite).toBe('polite');
    expect(assertive).toBe('assertive');
  });

  test('buttons have aria-labels', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('#overlay-main-menu .neon-btn');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const label = await buttons.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });

  test('buttons meet 44px minimum touch target', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('#overlay-main-menu .neon-btn');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box).toBeTruthy();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
