// === Settings E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
    // Navigate to settings
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
  });

  test('settings screen is displayed', async ({ page }) => {
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('SETTINGS');
  });

  test('can adjust volume with left/right keys', async ({ page }) => {
    const initialVolume = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('masterVolume'));
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    const newVolume = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('masterVolume'));
    expect(newVolume).toBeGreaterThan(initialVolume);
  });

  test('can decrease volume', async ({ page }) => {
    const initialVolume = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('masterVolume'));
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    const newVolume = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('masterVolume'));
    expect(newVolume).toBeLessThan(initialVolume);
  });

  test('can toggle CRT effect', async ({ page }) => {
    // Navigate to CRT setting (index 4)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
    }
    const initialValue = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('crtOverlay'));
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    const newValue = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('crtOverlay'));
    expect(newValue).not.toBe(initialValue);
  });

  test('settings persist after page reload', async ({ page }) => {
    // Change master volume
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    const volume = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('masterVolume'));

    // Reload page
    await page.reload();
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(500);

    const restoredVolume = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('masterVolume'));
    expect(restoredVolume).toBeCloseTo(volume, 1);
  });

  test('mute toggle persists', async ({ page }) => {
    // Navigate to mute (index 3)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    const muted = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('muted'));
    expect(muted).toBe(true);

    // Reload and check
    await page.reload();
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(500);

    const restoredMuted = await page.evaluate(() => window.__PACMAN_APP__?.settings.get('muted'));
    expect(restoredMuted).toBe(true);
  });
});
