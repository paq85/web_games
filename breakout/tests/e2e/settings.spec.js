import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('settings persist across page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="settings"]').click();
    // Change paddle size to large
    await page.selectOption('#setting-paddle-size', 'large');
    await page.locator('[data-action="save-settings"]').click();
    // Reload page
    await page.reload();
    await page.waitForTimeout(500);
    // Open settings again
    await page.locator('#overlay-main-menu [data-action="settings"]').click();
    const value = await page.locator('#setting-paddle-size').inputValue();
    expect(value).toBe('large');
  });

  test('mute toggle works', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="settings"]').click();
    const isChecked = await page.locator('#setting-mute').isChecked();
    await page.locator('#setting-mute').click();
    const isCheckedAfter = await page.locator('#setting-mute').isChecked();
    expect(isCheckedAfter).not.toBe(isChecked);
  });
});
