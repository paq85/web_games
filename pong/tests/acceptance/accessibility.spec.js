const { test, expect } = require('@playwright/test');
const { waitForGameReady, waitForScreen, goToMainMenu, menuUp, menuDown, menuConfirm } = require('./helpers');

test.describe('Accessibility', () => {
  test('canvas has role="application" attribute', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    const role = await page.getAttribute('#game-canvas', 'role');
    expect(role).toBe('application');
  });

  test('canvas has aria-label attribute', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    const ariaLabel = await page.getAttribute('#game-canvas', 'aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel.length).toBeGreaterThan(0);
  });

  test('canvas has tabindex="0" attribute', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    const tabIndex = await page.getAttribute('#game-canvas', 'tabindex');
    expect(tabIndex).toBe('0');
  });

  test('aria-live polite region exists', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    const politeRegion = page.locator('[aria-live="polite"]');
    await expect(politeRegion).toHaveCount(1);
  });

  test('aria-live assertive region exists', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    const assertiveRegion = page.locator('[aria-live="assertive"]');
    await expect(assertiveRegion).toHaveCount(1);
  });

  test('canvas is focusable via Tab', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.id : null;
    });
    expect(focusedElement).toBe('game-canvas');
  });

  test('keyboard arrow keys navigate menu options', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await page.locator('#game-canvas').focus();

    await menuUp(page);
    await menuDown(page);
    await menuDown(page);

    const screen = await page.evaluate(() => window.Game.getScreen());
    expect(screen).toBe('main_menu');
  });

  test('keyboard Enter confirms menu selection', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');

    const screen = await page.evaluate(() => window.Game.getScreen());
    expect(screen).toBe('mode_select');
  });
});
