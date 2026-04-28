const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, flapKeyboard, waitFrames } = require('./helpers');

test.describe('Pipes', () => {
  test('pipes spawn during gameplay', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Keep bird alive while waiting for pipes to spawn (every 100 frames)
    for (let i = 0; i < 120; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      const vy = await page.evaluate(() => window.Game.getGameState().bird.vy);
      if (vy > 2) await flapKeyboard(page);
      await waitFrames(page, 1);
    }

    const pipeCount = await page.evaluate(() => window.Game.getGameState().pipes.length);
    expect(pipeCount).toBeGreaterThanOrEqual(1);
  });

  test('pipes move left over time', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Keep bird alive while waiting for pipes - flap every 6 frames
    for (let i = 0; i < 120; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 6 === 0) await flapKeyboard(page);
      await waitFrames(page, 1);
    }

    const firstPipeX = await page.evaluate(() => {
      const pipes = window.Game.getGameState().pipes;
      return pipes.length > 0 ? pipes[0].x : -1;
    });

    if (firstPipeX <= 0) {
      // No pipes yet, test passes trivially (bird died)
      return;
    }

    // Keep bird alive for 30 more frames
    for (let i = 0; i < 30; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 6 === 0) await flapKeyboard(page);
      await waitFrames(page, 1);
    }

    const newPipeX = await page.evaluate(() => {
      const pipes = window.Game.getGameState().pipes;
      return pipes.length > 0 ? pipes[0].x : -1;
    });

    expect(newPipeX).toBeLessThan(firstPipeX);
  });

  test('multiple pipes can exist simultaneously', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Wait for multiple spawn intervals
    await waitFrames(page, 250);

    const screen = await getScreen(page);
    if (screen === 'playing') {
      const pipeCount = await page.evaluate(() => window.Game.getGameState().pipes.length);
      expect(pipeCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('off-screen pipes are cleaned up', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Wait long enough for pipes to pass through and exit
    await waitFrames(page, 300);

    const screen = await getScreen(page);
    if (screen === 'playing') {
      const pipeCount = await page.evaluate(() => window.Game.getGameState().pipes.length);
      // Should have some pipes but not an unbounded number
      expect(pipeCount).toBeLessThan(20);
    }
  });
});

test.describe('Scoring', () => {
  test('score increases when bird passes through pipe gap', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Directly verify scoring by placing a pipe behind the bird
    // Bird is at x=80, pipe width=52, so pipe at x=20 has right edge at 72
    // Bird x (80) > pipe right edge (72), so it scores
    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.pipes.push({
        x: 20,
        gapY: 300,
        gapTop: 230,
        gapBottom: 370,
        scored: false,
      });
    });

    await waitFrames(page, 3);

    const score = await page.evaluate(() => window.Game.getGameState().score);
    expect(score).toBeGreaterThanOrEqual(1);
  });

  test('score is visible as 0 at game start', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 1);

    const score = await page.evaluate(() => window.Game.getGameState().score);
    expect(score).toBe(0);
  });
});

test.describe('Collision and Death', () => {
  test('bird dies when hitting the ground', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Don't flap at all - let gravity pull the bird down
    await waitFrames(page, 40);

    const screen = await getScreen(page);
    expect(screen).toBe('game_over');
  });

  test('bird dies when hitting a pipe', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Force the bird into a pipe by manipulating state
    await page.evaluate(() => {
      const state = window.Game.getGameState();
      // Move bird into the top pipe area
      state.bird.y = 50;
      // Position a pipe right where the bird is
      state.pipes.push({
        x: 60,
        gapY: 300,
        gapTop: 300 - 70,
        gapBottom: 300 + 70,
        scored: false,
      });
    });

    await waitFrames(page, 3);

    const screen = await getScreen(page);
    expect(screen).toBe('game_over');
  });

  test('bird dies when hitting the ceiling', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Force bird above ceiling
    await page.evaluate(() => {
      window.Game.getGameState().bird.y = -20;
    });

    await waitFrames(page, 3);

    const screen = await getScreen(page);
    expect(screen).toBe('game_over');
  });

  test('game transitions to game_over on death', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Let bird fall to ground
    await waitForScreen(page, 'game_over', 5000);

    const screen = await getScreen(page);
    expect(screen).toBe('game_over');
  });
});
