// === Menu Navigation E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Menus', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
  });

  test('starts on main menu', async ({ page }) => {
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('MENU');
  });

  test('can navigate menu with arrow keys', async ({ page }) => {
    const initialIdx = await page.evaluate(() => window.__PACMAN_APP__?.menuIndex);
    expect(initialIdx).toBe(0);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    const newIdx = await page.evaluate(() => window.__PACMAN_APP__?.menuIndex);
    expect(newIdx).toBe(1);

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    const backIdx = await page.evaluate(() => window.__PACMAN_APP__?.menuIndex);
    expect(backIdx).toBe(0);
  });

  test('menu wraps around', async ({ page }) => {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    const idx = await page.evaluate(() => window.__PACMAN_APP__?.menuIndex);
    // Should wrap to last item
    expect(idx).toBe(3);
  });

  test('can access difficulty select', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('DIFFICULTY');
  });

  test('can navigate difficulty options', async ({ page }) => {
    await page.keyboard.press('Enter'); // Enter difficulty select
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowUp'); // Move to Easy
    await page.waitForTimeout(100);
    const idx = await page.evaluate(() => window.__PACMAN_APP__?.difficultyIndex);
    expect(idx).toBe(0);
  });

  test('can go back from difficulty with escape', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('MENU');
  });

  test('can access high scores', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('SCORES');
  });

  test('can return from high scores', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('MENU');
  });

  test('can access settings', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('SETTINGS');
  });

  test('can navigate settings', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    const idx = await page.evaluate(() => window.__PACMAN_APP__?.settingsIndex);
    expect(idx).toBe(1);
  });

  test('can return from settings', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('MENU');
  });

  test('pause menu works during gameplay', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('PAUSED');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const resumed = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(resumed).toBe('PLAYING');
  });

  test('practice mode can be selected', async ({ page }) => {
    await page.keyboard.press('ArrowDown'); // Practice
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('DIFFICULTY');

    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });
    const practiceMode = await page.evaluate(() => window.__PACMAN_APP__?.practiceMode);
    expect(practiceMode).toBe(true);
  });
});
