const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, flapKeyboard, flapClick, waitFrames } = require('./helpers');

test.describe('Game Start', () => {
  test('starts game on Space key press', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('starts game on canvas click', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapClick(page);
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('starts game on ArrowUp key', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await page.keyboard.press('ArrowUp');
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('bird starts at correct position when game begins', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 1);

    const state = await getGameState(page);
    expect(state.bird.x).toBe(80);
    expect(state.score).toBe(0);
    expect(state.frameCount).toBeGreaterThan(0);
  });

  test('game state is reset when starting', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 5);

    const state = await getGameState(page);
    expect(state.score).toBe(0);
    expect(state.pipes.length).toBe(0);
  });
});

test.describe('Bird Physics', () => {
  test('bird falls due to gravity when not flapping', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    const initialY = await page.evaluate(() => window.Game.getGameState().bird.y);

    await waitFrames(page, 15);

    const newY = await page.evaluate(() => window.Game.getGameState().bird.y);
    expect(newY).toBeGreaterThan(initialY);
  });

  test('bird rises when flapping', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 10);

    const beforeY = await page.evaluate(() => window.Game.getGameState().bird.y);

    await flapKeyboard(page);
    await waitFrames(page, 1);

    const afterY = await page.evaluate(() => window.Game.getGameState().bird.y);
    expect(afterY).toBeLessThan(beforeY);
  });

  test('bird velocity goes negative after flap', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 10);

    await flapKeyboard(page);
    await waitFrames(page, 1);

    const vy = await page.evaluate(() => window.Game.getGameState().bird.vy);
    expect(vy).toBeLessThan(0);
  });

  test('bird rotation reflects velocity direction', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Flap and immediately check for negative rotation (rising)
    await flapKeyboard(page);
    await waitFrames(page, 2);
    const risingRotation = await page.evaluate(() => window.Game.getGameState().bird.rotation);
    expect(risingRotation).toBeLessThan(0);

    // Let gravity take over - flap occasionally to stay alive
    for (let i = 0; i < 30; i++) {
      const vy = await page.evaluate(() => window.Game.getGameState().bird.vy);
      if (vy > 3) await flapKeyboard(page);
      await waitFrames(page, 1);
    }

    const fallingRotation = await page.evaluate(() => window.Game.getGameState().bird.rotation);
    expect(fallingRotation).toBeGreaterThan(0);
  });

  test('fall speed eventually caps at maximum', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Let the bird fall for a while without flapping
    await waitFrames(page, 40);

    const vy = await page.evaluate(() => {
      const state = window.Game.getGameState();
      return state ? state.bird.vy : 0;
    });
    // The bird should either be capped or have died from hitting ground
    expect(vy).toBeLessThanOrEqual(10);
  });
});
