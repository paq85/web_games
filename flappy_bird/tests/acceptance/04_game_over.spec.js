const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, flapKeyboard, flapClick, waitFrames } = require('./helpers');

test.describe('Game Over Screen', () => {
  test('shows final score on game over', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Score some points then die
    for (let i = 0; i < 150; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 6 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }

    await waitForScreen(page, 'game_over', 5000);

    const state = await getGameState(page);
    // Score should be preserved
    expect(state.score).toBeGreaterThanOrEqual(0);
  });

  test('shows best score on game over', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Let the bird die
    await waitForScreen(page, 'game_over', 5000);

    const state = await getGameState(page);
    expect(state.bestScore).toBeGreaterThanOrEqual(0);
  });

  test('best score updates when new high score is achieved', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Clear any existing best score
    await page.evaluate(() => {
      try { localStorage.removeItem('flappy_best_score'); } catch(e) {}
    });

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Try to score some points
    for (let i = 0; i < 200; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 7 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }

    await waitForScreen(page, 'game_over', 5000);

    const state = await getGameState(page);
    expect(state.bestScore).toBeGreaterThanOrEqual(state.score);
  });
});

test.describe('Restart', () => {
  test('can restart after game over with Space', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // First run
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitForScreen(page, 'game_over', 10000);

    // Restart
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('can restart after game over with click', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // First run
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitForScreen(page, 'game_over', 10000);

    // Restart with click
    await flapClick(page);
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('score resets to 0 on restart', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Score some points
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    for (let i = 0; i < 200; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 7 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }
    await waitForScreen(page, 'game_over', 10000);

    const scoreBeforeRestart = await page.evaluate(() => window.Game.getGameState().score);

    // Restart
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 1);

    const scoreAfterRestart = await page.evaluate(() => window.Game.getGameState().score);
    expect(scoreAfterRestart).toBe(0);
    if (scoreBeforeRestart > 0) {
      // Best score should be preserved
      const bestScore = await page.evaluate(() => window.Game.getGameState().bestScore);
      expect(bestScore).toBeGreaterThanOrEqual(scoreBeforeRestart);
    }
  });

  test('bird resets to starting position on restart', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Run and die
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitForScreen(page, 'game_over', 10000);

    // Restart
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Check immediately - bird starts at (80, 300) before any physics
    const bird = await page.evaluate(() => {
      const state = window.Game.getGameState();
      return state ? state.bird : null;
    });
    expect(bird.x).toBe(80);
    // Y might have moved slightly due to physics, but should be close to 300
    expect(bird.y).toBeCloseTo(300, 0);
  });

  test('pipes are cleared on restart', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Run until pipes appear
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 150);

    // Die
    await waitForScreen(page, 'game_over', 10000);

    // Restart
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 1);

    const pipeCount = await page.evaluate(() => window.Game.getGameState().pipes.length);
    expect(pipeCount).toBe(0);
  });

  test('can play multiple consecutive sessions', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    for (let round = 0; round < 3; round++) {
      await flapKeyboard(page);
      await waitForScreen(page, 'playing');

      // Play for a bit
      for (let i = 0; i < 50; i++) {
        const screen = await getScreen(page);
        if (screen === 'game_over') break;
        if (i % 5 === 0) await flapKeyboard(page);
        await waitFrames(page, 3);
      }

      await waitForScreen(page, 'game_over', 10000);
    }

    // Should be able to restart again
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    expect(await getScreen(page)).toBe('playing');
  });
});

test.describe('Best Score Persistence', () => {
  test('best score persists across page reloads', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Clear existing score
    await page.evaluate(() => {
      try { localStorage.removeItem('flappy_best_score'); } catch(e) {}
    });

    // Play and score
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    for (let i = 0; i < 300; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 6 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }
    await waitForScreen(page, 'game_over', 10000);

    const scoreAfterFirstRun = await page.evaluate(() => window.Game.getGameState().score);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitForScreen(page, 'start');

    const bestScoreAfterReload = await page.evaluate(() => window.Game.getGameState().bestScore);
    expect(bestScoreAfterReload).toBeGreaterThanOrEqual(scoreAfterFirstRun);
  });
});
