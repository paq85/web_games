import { expect, test } from '@playwright/test';

async function enterArcade(page) {
  await page.goto('/');
  await page.getByTestId('entry-button').click();
}

test('starts a run and supports pause/resume', async ({ page }) => {
  await enterArcade(page);
  await page.getByTestId('start-game-button').click();
  await page.getByTestId('difficulty-medium').click();

  await page.waitForFunction(() => window.__PACMAN_APP__.currentSession?.phase === 'playing');
  await expect(page.getByTestId('mode-value')).toHaveText('Arcade');
  await expect(page.getByTestId('score-value')).not.toHaveText('0');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Catch your breath' })).toBeVisible();
  await page.getByTestId('resume-button').click();
  await page.waitForFunction(() => window.__PACMAN_APP__.stateMachine.state === 'playing');
  await expect(page.getByTestId('mode-value')).toHaveText('Arcade');
});
