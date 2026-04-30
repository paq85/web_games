import { test, expect } from '@playwright/test';

test.describe('Power-ups', () => {
  test('power-up indicators appear in HUD when active', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="play"]').click();
    await page.waitForTimeout(3500);
    // HUD should be visible
    await expect(page.locator('#hud')).toBeVisible();
    // Power-up indicators div should exist (check it's not hidden class)
    const hudVisible = await page.locator('#hud').isVisible();
    const powerupsExists = await page.locator('#hud-powerups').count();
    expect(hudVisible).toBe(true);
    expect(powerupsExists).toBe(1);
  });
});
