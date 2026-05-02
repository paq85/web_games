import { expect, test } from '@playwright/test';

test('includes accessibility scaffolding for gameplay and settings', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('application')).toBeVisible();
  await expect(page.locator('#polite-live-region')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#assertive-live-region')).toHaveAttribute('aria-live', 'assertive');

  await page.getByTestId('entry-button').click();
  await page.getByTestId('settings-button').click();

  await expect(page.locator('#reduced-flash-toggle-input')).toBeVisible();
  await expect(page.getByTestId('bind-up-button')).toBeVisible();
  await expect(page.locator('#touch-controls button')).toHaveCount(4);
});
