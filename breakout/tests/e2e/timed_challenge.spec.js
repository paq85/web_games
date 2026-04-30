import { test, expect } from '@playwright/test';

test.describe('Timed Challenge', () => {
  test('can start timed challenge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="timed-challenge"]').click();
    await expect(page.locator('#overlay-countdown')).toBeVisible();
  });

  test('timer displays during timed mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="timed-challenge"]').click();
    await page.waitForTimeout(3500);
    await expect(page.locator('#hud-timer')).toBeVisible();
  });
});
