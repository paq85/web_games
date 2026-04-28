const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState } = require('./helpers');

test.describe('Page Load and Start Screen', () => {
  test('loads the game page without errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/flappy_bird/index.html');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('renders the canvas element', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const dimensions = await canvas.boundingBox();
    expect(dimensions.width).toBeGreaterThan(100);
    expect(dimensions.height).toBeGreaterThan(100);
  });

  test('starts in the start screen', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    const screen = await getScreen(page);
    expect(screen).toBe('start');
  });

  test('canvas has correct aspect ratio (400x600 = 2:3)', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await page.waitForTimeout(500);

    const aspectRatio = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      return canvas.width / canvas.height;
    });

    expect(aspectRatio).toBeCloseTo(400 / 600, 2);
  });

  test('Game module is accessible globally', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const hasGame = await page.evaluate(() => typeof window.Game === 'object');
    expect(hasGame).toBe(true);

    const hasMethods = await page.evaluate(() =>
      typeof window.Game.getScreen === 'function' &&
      typeof window.Game.getGameState === 'function'
    );
    expect(hasMethods).toBe(true);
  });

  test('C constants are accessible globally', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const constants = await page.evaluate(() => ({
      fieldWidth: C.FIELD_WIDTH,
      fieldHeight: C.FIELD_HEIGHT,
      gravity: C.GRAVITY,
      pipeGap: C.PIPE_GAP,
    }));

    expect(constants.fieldWidth).toBe(400);
    expect(constants.fieldHeight).toBe(600);
    expect(constants.gravity).toBeGreaterThan(0);
    expect(constants.pipeGap).toBe(140);
  });
});
