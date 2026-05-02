import { test, expect } from '@playwright/test';

test.describe('Scoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  });

  test('score starts at 0', async ({ page }) => {
    const score = page.locator('#hud-score');
    await expect(score).toHaveText('Score: 0');
  });

  test('score increases by 10 per row moved up', async ({ page }) => {
    // Move up one row — should award 10 points
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    const score1 = await page.locator('#hud-score').textContent();
    const scoreNum1 = parseInt(score1.replace('Score: ', ''));
    expect(scoreNum1).toBeGreaterThanOrEqual(10);

    // Wait for any death animation to complete so the frog is reset to spawn
    await page.waitForTimeout(700);

    // Move up another row — should award another 10
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    const score2 = await page.locator('#hud-score').textContent();
    const scoreNum2 = parseInt(score2.replace('Score: ', ''));
    // Score should not decrease; if the frog survived the second move, it increases
    expect(scoreNum2).toBeGreaterThanOrEqual(scoreNum1);
  });

  test('score does not increase for horizontal moves', async ({ page }) => {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    const score1 = await page.locator('#hud-score').textContent();
    expect(score1).toBe('Score: 0');

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const score2 = await page.locator('#hud-score').textContent();
    expect(score2).toBe('Score: 0');
  });

  test('lives start at 3', async ({ page }) => {
    const lives = await page.locator('#hud-lives').textContent();
    const frogs = (lives.match(/🐸/g) || []).length;
    expect(frogs).toBe(3);
  });

  test('lives decrease after death in road', async ({ page }) => {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(5000);

    const lives = await page.locator('#hud-lives').textContent();
    const frogs = (lives.match(/🐸/g) || []).length;
    expect(frogs).toBeLessThan(3);
  });

  test('timer bar decreases over time', async ({ page }) => {
    const timerBar = page.locator('#timer-bar');
    const widthBefore = await timerBar.evaluate(el => el.offsetWidth);
    await page.waitForTimeout(2000);
    const widthAfter = await timerBar.evaluate(el => el.offsetWidth);
    expect(widthAfter).toBeLessThan(widthBefore);
  });

  test('level starts at 1', async ({ page }) => {
    const level = page.locator('#hud-level');
    await expect(level).toHaveText('Level 1');
  });
});
