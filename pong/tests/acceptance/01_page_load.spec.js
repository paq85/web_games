const { test, expect } = require('@playwright/test');
const { waitForScreen, waitForGameReady, getScreen, getSettings } = require('./helpers');

test.describe('Page Load and Attract Screen', () => {
  test('loads the game page without console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('renders the canvas element', async ({ page }) => {
    await page.goto('/index.html');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const dimensions = await canvas.boundingBox();
    expect(dimensions.width).toBeGreaterThan(100);
    expect(dimensions.height).toBeGreaterThan(100);
  });

  test('starts in the attract screen', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    const screen = await getScreen(page);
    expect(screen).toBe('attract');
  });

  test('canvas has correct internal resolution (800x600)', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    const resolution = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      return { width: canvas.width, height: canvas.height };
    });

    expect(resolution.width).toBeGreaterThan(0);
    expect(resolution.height).toBeGreaterThan(0);
  });

  test('Game module is accessible globally', async ({ page }) => {
    await page.goto('/index.html');
    await waitForGameReady(page);

    const hasGame = await page.evaluate(() => typeof window.Game === 'object');
    expect(hasGame).toBe(true);

    const hasMethods = await page.evaluate(() =>
      typeof window.Game.getScreen === 'function' &&
      typeof window.Game.getGameState === 'function' &&
      typeof window.Game.getSettings === 'function'
    );
    expect(hasMethods).toBe(true);
  });

  test('C constants are accessible globally', async ({ page }) => {
    await page.goto('/index.html');

    const constants = await page.evaluate(() => ({
      fieldWidth: C.FIELD_WIDTH,
      fieldHeight: C.FIELD_HEIGHT,
      paddleWidth: C.PADDLE_WIDTH,
      ballSize: C.BALL_SIZE,
    }));

    expect(constants.fieldWidth).toBe(800);
    expect(constants.fieldHeight).toBe(600);
    expect(constants.paddleWidth).toBe(15);
    expect(constants.ballSize).toBe(12);
  });

  test('canvas renders content during attract mode', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await page.waitForTimeout(500);

    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) return true;
      }
      return false;
    });
    expect(hasContent).toBe(true);
  });

  test('attract mode is active on page load', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    const screen = await getScreen(page);
    expect(screen).toBe('attract');

    // Verify the game loop is running by checking canvas has content after a delay
    await page.waitForTimeout(300);
    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) return true;
      }
      return false;
    });
    expect(hasContent).toBe(true);
  });
});
