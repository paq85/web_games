const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, goToMainMenu, menuUp, menuDown, menuConfirm } = require('./helpers');

test.describe('Menu Navigation', () => {
  test('pressing Enter from attract goes to main menu', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    await goToMainMenu(page);

    const screen = await getScreen(page);
    expect(screen).toBe('main_menu');
  });

  test('pressing Space from attract goes to main menu', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    await page.keyboard.press('Space');
    await waitForScreen(page, 'main_menu');

    const screen = await getScreen(page);
    expect(screen).toBe('main_menu');
  });

  test('main menu allows navigating down', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuDown(page);
    await page.waitForTimeout(100);

    const selectedIndex = await page.evaluate(() => {
      return window.Game.getScreen() === 'main_menu' ? 'ok' : 'fail';
    });
    expect(selectedIndex).toBe('ok');
  });

  test('main menu allows navigating up', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuDown(page);
    await menuDown(page);
    await menuUp(page);
    await page.waitForTimeout(100);

    const screen = await getScreen(page);
    expect(screen).toBe('main_menu');
  });

  test('selecting PLAY goes to mode select', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');

    const screen = await getScreen(page);
    expect(screen).toBe('mode_select');
  });

  test('selecting SETTINGS goes to settings screen', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuDown(page);
    await menuDown(page);
    await menuConfirm(page);
    await waitForScreen(page, 'settings');

    const screen = await getScreen(page);
    expect(screen).toBe('settings');
  });

  test('selecting DEMO MODE returns to attract', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuDown(page);
    await menuDown(page);
    await menuDown(page);
    await menuConfirm(page);
    await waitForScreen(page, 'attract');

    const screen = await getScreen(page);
    expect(screen).toBe('attract');
  });

  test('mode select shows game mode options', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');

    await menuDown(page);
    await menuDown(page);
    await menuDown(page);

    const screen = await getScreen(page);
    expect(screen).toBe('mode_select');
  });

  test('pressing Escape from mode select returns to main menu', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'main_menu');

    const screen = await getScreen(page);
    expect(screen).toBe('main_menu');
  });

  test('pressing Escape from settings returns to main menu', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuDown(page);
    await menuDown(page);
    await menuConfirm(page);
    await waitForScreen(page, 'settings');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'main_menu');

    const screen = await getScreen(page);
    expect(screen).toBe('main_menu');
  });

  test('selecting 2 PLAYERS starts a match with countdown', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');
    await menuConfirm(page);
    await waitForScreen(page, 'countdown');

    const screen = await getScreen(page);
    expect(screen).toBe('countdown');
  });

  test('selecting PRACTICE starts a match with countdown', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');
    await menuDown(page);
    await menuDown(page);
    await menuConfirm(page);
    await waitForScreen(page, 'countdown');

    const screen = await getScreen(page);
    expect(screen).toBe('countdown');
  });
});
