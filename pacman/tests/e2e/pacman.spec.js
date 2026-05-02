import { expect, test } from '@playwright/test';

test('renders the main menu with accessibility hooks', async ({ page }) => {
  await page.goto('/?test=1');
  await expect(page.getByRole('heading', { name: 'Pacman Arcade' })).toBeVisible();
  await expect(page.locator('#game-canvas')).toHaveAttribute('role', 'application');
  await expect(page.locator('#main-menu')).toBeVisible();
  await expect(page.locator('#screen-message')).toContainText('Press Play');
  await expect(page.locator('#screen-message')).toBeVisible();
});

test('keyboard flow can start, pause, and resume a game', async ({ page }) => {
  await page.goto('/?test=1');
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('#countdown-panel')).toBeVisible();
  await page.waitForFunction(() => window.__PACMAN_TEST_API__?.getState()?.phase === 'playing');
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-panel')).toBeHidden();
});

test('settings persist after a reload', async ({ page }) => {
  await page.goto('/?test=1');
  await page.locator('#difficulty-select').selectOption('hard');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('#master-volume').fill('65');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.reload();
  await expect(page.locator('#difficulty-select')).toHaveValue('hard');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#master-volume')).toHaveValue('65');
});

test('high scores update through the test api', async ({ page }) => {
  await page.goto('/?test=1');
  await page.evaluate(() => window.__PACMAN_TEST_API__.startGame({ difficultyKey: 'easy' }));
  await page.waitForFunction(() => window.__PACMAN_TEST_API__?.getState()?.phase === 'playing');
  await page.evaluate(() => window.__PACMAN_TEST_API__.setScore(4200));
  await page.evaluate(() => window.__PACMAN_TEST_API__.forceGameOver());
  await expect(page.locator('#gameover-panel')).toBeVisible();
  await expect(page.locator('#final-score')).toHaveText('4200');
  await page.getByRole('button', { name: 'Main menu' }).click();
  await page.getByRole('button', { name: 'High Scores' }).click();
  await expect(page.locator('#scores-list')).toContainText('4200');
});

test('touch controls steer the game on small screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?test=1');
  await page.evaluate(() => window.__PACMAN_TEST_API__.startGame({ difficultyKey: 'easy' }));
  await page.waitForFunction(() => window.__PACMAN_TEST_API__?.getState()?.phase === 'countdown');
  await page.getByRole('button', { name: 'Move right' }).click();
  await expect.poll(async () => page.evaluate(() => window.__PACMAN_TEST_API__.getState().pacman.bufferedDirection)).toBe('right');
});
