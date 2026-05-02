import { expect, test } from '@playwright/test';

test('persists theme settings and does not resume an in-progress run after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('entry-button').click();
  await page.getByTestId('start-game-button').click();
  await page.getByTestId('difficulty-medium').click();
  await page.waitForFunction(() => window.__PACMAN_APP__.currentSession?.phase === 'playing');

  await page.evaluate(() => {
    window.__PACMAN_APP__.currentSession.score = 4321;
  });

  await page.getByTestId('settings-button').click();
  await page.locator('#theme-select').selectOption('neon');
  await expect(page.locator('#app-shell')).toHaveClass(/theme-neon/);

  await page.reload();
  await expect(page.getByTestId('entry-overlay')).toBeVisible();
  await page.getByTestId('entry-button').click();
  await expect(page.getByTestId('score-value')).toHaveText('0');
  await expect(page.getByTestId('mode-value')).toHaveText('Menu');

  await page.getByTestId('settings-button').click();
  await expect(page.locator('#theme-select')).toHaveValue('neon');
});
