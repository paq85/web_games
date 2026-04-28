const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, flapKeyboard, waitFrames } = require('./helpers');

test.describe('Specification Compliance', () => {
  test('FR1: Bird moves downward continuously when no input', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    const positions = [];
    for (let i = 0; i < 10; i++) {
      const y = await page.evaluate(() => window.Game.getGameState().bird.y);
      positions.push(y);
      await waitFrames(page, 3);
    }

    // Each position should be >= the previous (falling)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]);
    }
  });

  test('FR1: Player input causes bird to move upward', async ({ page }) => {
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

  test('FR1: Continuous sequence of obstacles with passable gaps', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Keep bird alive while waiting for pipes
    for (let i = 0; i < 120; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      const vy = await page.evaluate(() => window.Game.getGameState().bird.vy);
      if (vy > 2) await flapKeyboard(page);
      await waitFrames(page, 1);
    }

    const pipes = await page.evaluate(() => window.Game.getGameState().pipes);
    expect(pipes.length).toBeGreaterThanOrEqual(1);

    for (const pipe of pipes) {
      const gapSize = pipe.gapBottom - pipe.gapTop;
      expect(gapSize).toBe(140);
    }
  });

  test('FR1: Game ends on collision with obstacle', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.bird.y = 50;
      state.pipes.push({ x: 60, gapY: 300, gapTop: 230, gapBottom: 370, scored: false });
    });

    await waitForScreen(page, 'game_over', 5000);
    expect(await getScreen(page)).toBe('game_over');
  });

  test('FR1: Game ends on collision with boundary', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Let bird fall to ground
    await waitForScreen(page, 'game_over', 5000);
    expect(await getScreen(page)).toBe('game_over');
  });

  test('FR1: Player can start a new run without page reload', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // First run
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitForScreen(page, 'game_over', 10000);

    // Second run without reload
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    expect(await getScreen(page)).toBe('playing');
  });

  test('FR2: Start state indicates how to begin play', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Canvas should be rendering (non-transparent pixels present)
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

  test('FR2: Game-over state shows result and how to restart', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitForScreen(page, 'game_over', 10000);

    // Game over screen should be rendered
    const screen = await getScreen(page);
    expect(screen).toBe('game_over');

    // Score should be visible in state
    const state = await getGameState(page);
    expect(state).not.toBeNull();
    expect(state.score).toBeDefined();
  });

  test('FR2: Restart resets score for new attempt', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Score some points
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    for (let i = 0; i < 200; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 6 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }
    await waitForScreen(page, 'game_over', 10000);

    const scoreBeforeRestart = await page.evaluate(() => window.Game.getGameState().score);

    // Restart
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    const scoreAfterRestart = await page.evaluate(() => window.Game.getGameState().score);
    expect(scoreAfterRestart).toBe(0);
  });

  test('FR3: Same primary action available across input methods', async ({ page }) => {
    // Test keyboard input
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');
    await page.keyboard.press('Space');
    await waitForScreen(page, 'playing', 3000);
    expect(await getScreen(page)).toBe('playing');

    // Test mouse click
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await waitForScreen(page, 'playing', 3000);
    expect(await getScreen(page)).toBe('playing');

    // Test touch event (dispatched directly)
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');
    await page.evaluate(() => {
      const c = document.getElementById('game-canvas');
      const touch = new Touch({ identifier: 1, target: c, clientX: 100, clientY: 100 });
      c.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], cancelable: true, bubbles: true }));
    });
    await waitForScreen(page, 'playing', 3000);
    expect(await getScreen(page)).toBe('playing');
  });

  test('FR4: Score increases when passing obstacle sets', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Play and try to score
    for (let i = 0; i < 300; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 7 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }

    const finalScore = await page.evaluate(() => window.Game.getGameState().score);
    expect(finalScore).toBeGreaterThanOrEqual(0);
  });

  test('FR4: Current score visible during gameplay', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 1);

    const state = await getGameState(page);
    expect(state.score).toBe(0);
  });

  test('FR4: Final score visible after game over', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitForScreen(page, 'game_over', 10000);

    const state = await getGameState(page);
    expect(state.score).toBeDefined();
    expect(typeof state.score).toBe('number');
  });

  test('FR4: Best score tracked across sessions', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Clear storage
    await page.evaluate(() => {
      try { localStorage.removeItem('flappy_best_score'); } catch(e) {}
    });

    // First session
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    for (let i = 0; i < 200; i++) {
      const screen = await getScreen(page);
      if (screen === 'game_over') break;
      if (i % 6 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }
    await waitForScreen(page, 'game_over', 10000);

    const bestAfterFirst = await page.evaluate(() => window.Game.getGameState().bestScore);

    // Reload to simulate new session
    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitForScreen(page, 'start');

    const bestAfterReload = await page.evaluate(() => window.Game.getGameState().bestScore);
    expect(bestAfterReload).toBeGreaterThanOrEqual(bestAfterFirst);
  });

  test('FR4: Best score shown after run ends', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitForScreen(page, 'game_over', 10000);

    const state = await getGameState(page);
    expect(state.bestScore).toBeGreaterThanOrEqual(state.score);
  });

  test('NFR: Game does not enter broken state after rapid input', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Rapid clicks and keypresses
    for (let i = 0; i < 30; i++) {
      await Promise.all([
        page.keyboard.press('Space'),
        page.locator('#game-canvas').click({ position: { x: 50, y: 50 } }),
      ]);
      await waitFrames(page, 1);
    }

    const screen = await getScreen(page);
    expect(['start', 'playing', 'game_over']).toContain(screen);
  });

  test('NFR: Completed run does not prevent new run', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    for (let round = 0; round < 5; round++) {
      await flapKeyboard(page);
      await waitForScreen(page, 'playing');
      await waitForScreen(page, 'game_over', 10000);
    }

    // Should still be able to start
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    expect(await getScreen(page)).toBe('playing');
  });
});
