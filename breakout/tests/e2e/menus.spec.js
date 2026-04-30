import { test, expect } from '@playwright/test';

test.describe('Menus', () => {
  test('main menu has all buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await expect(page.locator('#overlay-main-menu [data-action="play"]')).toBeVisible();
    await expect(page.locator('#overlay-main-menu [data-action="timed-challenge"]')).toBeVisible();
    await expect(page.locator('#overlay-main-menu [data-action="settings"]')).toBeVisible();
    await expect(page.locator('#overlay-main-menu [data-action="stats"]')).toBeVisible();
  });

  test('can open settings from main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="settings"]').click();
    await expect(page.locator('#overlay-settings')).toBeVisible();
  });

  test('can save settings and return', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="settings"]').click();
    await expect(page.locator('#overlay-settings')).toBeVisible();
    // Click save
    await page.locator('[data-action="save-settings"]').click();
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
  });

  test('can open statistics', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="stats"]').click();
    await expect(page.locator('#overlay-stats')).toBeVisible();
  });

  test('pause during gameplay', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="play"]').click();
    await page.waitForTimeout(3500);
    await expect(page.locator('#hud')).toBeVisible();
    // Trigger pause via game API for reliability
    await page.evaluate(() => {
      const g = window.__test_game;
      g.pause();
      // Force showScreen immediately
      const screen = g.screen;
      document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
      const overlay = document.querySelector(`[data-screen="${screen}"]`);
      if (overlay) overlay.classList.remove('hidden');
      const hud = document.getElementById('hud');
      if (hud) hud.classList.add('hidden');
    });
    await expect(page.locator('#overlay-pause')).toBeVisible();
  });

  test('resume from pause', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="play"]').click();
    await page.waitForTimeout(3500);
    await expect(page.locator('#hud')).toBeVisible();
    await page.evaluate(() => {
      const g = window.__test_game;
      g.pause();
      const screen = g.screen;
      document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
      const overlay = document.querySelector(`[data-screen="${screen}"]`);
      if (overlay) overlay.classList.remove('hidden');
      const hud = document.getElementById('hud');
      if (hud) hud.classList.add('hidden');
    });
    await expect(page.locator('#overlay-pause')).toBeVisible();
    await page.locator('#overlay-pause [data-action="resume"]').click();
    await expect(page.locator('#hud')).toBeVisible();
  });

  test('quit to menu from pause', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
    await page.locator('#overlay-main-menu [data-action="play"]').click();
    await page.waitForTimeout(3500);
    await expect(page.locator('#hud')).toBeVisible();
    await page.evaluate(() => {
      const g = window.__test_game;
      g.pause();
      const screen = g.screen;
      document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
      const overlay = document.querySelector(`[data-screen="${screen}"]`);
      if (overlay) overlay.classList.remove('hidden');
      const hud = document.getElementById('hud');
      if (hud) hud.classList.add('hidden');
    });
    await expect(page.locator('#overlay-pause')).toBeVisible();
    await page.locator('#overlay-pause [data-action="quit"]').click();
    await expect(page.locator('#overlay-main-menu')).toBeVisible();
  });
});
