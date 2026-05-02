import { expect, test } from '@playwright/test';

test('supports practice mode and demo takeover', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('entry-button').click();
  await page.getByTestId('practice-button').click();

  await page.waitForFunction(() => window.__PACMAN_APP__.currentSession?.phase === 'playing');
  await expect(page.getByTestId('lives-value')).toHaveText('∞');
  await expect(page.getByTestId('mode-value')).toHaveText('Practice');

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Quit to menu' }).click();
  await expect(page.getByTestId('start-game-button')).toBeVisible();

  await page.getByTestId('demo-button').click();
  await page.waitForFunction(() => window.__PACMAN_APP__.stateMachine.state === 'demo');
  await expect(page.locator('#demo-banner')).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => window.__PACMAN_APP__.stateMachine.state === 'playing');
  await expect(page.getByTestId('mode-value')).toHaveText('Arcade');
});
