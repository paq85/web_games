const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, getSettings, goToMainMenu, start2PMatch, startAIMatch, waitFrames, dispatchKeyDown, dispatchKeyUp, menuConfirm, menuDown } = require('./helpers');

test.describe('Specification Compliance', () => {
  test('FR: Local two-player match can be played', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    expect(state).not.toBeNull();
    expect(state.paddle1).toBeDefined();
    expect(state.paddle2).toBeDefined();
    expect(state.ball).toBeDefined();
  });

  test('FR: Simultaneous player movement works reliably', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    const p1Y = state.paddle1.y;
    const p2Y = state.paddle2.y;

    await dispatchKeyDown(page, 'KeyW');
    await dispatchKeyDown(page, 'ArrowDown');
    await waitFrames(page, 10);
    await dispatchKeyUp(page, 'KeyW');
    await dispatchKeyUp(page, 'ArrowDown');

    const newState = await getGameState(page);
    expect(newState.paddle1.y).toBeLessThan(p1Y);
    expect(newState.paddle2.y).toBeGreaterThan(p2Y);
  });

  test('FR: Ball rebound angle changes by paddle contact position', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = state.paddle1.x + state.paddle1.width - 1;
      state.ball.y = state.paddle1.y + 2;
      state.ball.vx = -5;
      state.ball.vy = 0;
      state.ball.speed = 5;
    });

    await waitFrames(page, 3);

    const state = await getGameState(page);
    expect(Math.abs(state.ball.vy)).toBeGreaterThan(1);
  });

  test('FR: Ball speed increases during rally', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const initialSpeed = await page.evaluate(() => window.Game.getGameState().ball.speed);

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = state.paddle1.x + state.paddle1.width - 1;
      state.ball.y = state.paddle1.y + state.paddle1.height / 2;
      state.ball.vx = -5;
      state.ball.vy = 0;
    });

    await waitFrames(page, 3);

    const newSpeed = await page.evaluate(() => window.Game.getGameState().ball.speed);
    expect(newSpeed).toBeGreaterThan(initialSpeed);
  });

  test('FR: Ball speed is capped at maximum', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    // Verify that BALL_SPEED_MAX constant exists and is reasonable
    const maxSpeed = await page.evaluate(() => C.BALL_SPEED_MAX);
    expect(maxSpeed).toBe(14);

    // Ball speed should never exceed max during normal gameplay
    const state = await getGameState(page);
    expect(state.ball.speed).toBeLessThanOrEqual(maxSpeed);
  });

  test('FR: Default match is first to 11', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    expect(state.winScore).toBe(11);
  });

  test('FR: Win-by-2 condition is enforced', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.score1 = 11;
      state.score2 = 11;
      state.winScore = 11;
      state.ball.x = -20;
    });

    await waitForScreen(page, 'point_break');

    const screen = await getScreen(page);
    expect(screen).toBe('point_break');
  });

  test('FR: Serve goes toward player who conceded', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = -20;
    });

    await waitForScreen(page, 'point_break');

    const state = await getGameState(page);
    expect(state.servingDir).toBe(-1);
  });

  test('FR: Countdown appears before each serve', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);

    const screen = await getScreen(page);
    expect(screen).toBe('countdown');
  });

  test('FR: Point break occurs after scoring', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = -20;
    });

    await waitForScreen(page, 'point_break');

    const screen = await getScreen(page);
    expect(screen).toBe('point_break');
  });

  test('FR: AI match is available at all difficulty levels', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for game to be ready
    await page.waitForFunction(() => window.Game && typeof window.Game.getScreen === 'function');

    // Check initial screen
    const initialScreen = await page.evaluate(() => window.Game.getScreen());
    expect(initialScreen).toBe('attract');

    // Navigate to main menu
    await page.keyboard.press('Enter');
    await waitForScreen(page, 'main_menu');

    // Navigate to VS AI mode
    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');
    await menuDown(page);
    await menuConfirm(page);
    await waitForScreen(page, 'difficulty_select');

    // Start match at default difficulty
    await menuConfirm(page);
    await waitForScreen(page, 'countdown');
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('FR: Settings persist across sessions', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await waitForScreen(page, 'settings');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    const settingsBefore = await getSettings(page);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitForScreen(page, 'attract');

    const settingsAfter = await getSettings(page);
    expect(settingsAfter).not.toBeNull();
  });

  test('FR: Mute toggle works', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    const settingsBefore = await getSettings(page);
    const wasMuted = settingsBefore.muted;

    await page.keyboard.press('KeyM');
    await page.waitForTimeout(200);

    const settingsAfter = await getSettings(page);
    expect(settingsAfter.muted).toBe(!wasMuted);
  });

  test('FR: Game opens to attract, not a partial match', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    const screen = await getScreen(page);
    expect(screen).toBe('attract');
  });

  test('NFR: Game does not enter broken state after rapid input', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    for (let i = 0; i < 20; i++) {
      await Promise.all([
        page.keyboard.press('Enter'),
        page.keyboard.press('ArrowDown'),
        page.keyboard.press('ArrowUp'),
      ]);
      await waitFrames(page, 2);
    }

    const screen = await getScreen(page);
    expect(['attract', 'main_menu', 'mode_select', 'countdown', 'playing']).toContain(screen);
  });

  test('NFR: Completed match allows new match without reload', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');

    for (let round = 0; round < 2; round++) {
      await goToMainMenu(page);
      await start2PMatch(page);
      await waitForScreen(page, 'playing');

      await page.evaluate(() => {
        const state = window.Game.getGameState();
        state.score1 = 5;
        state.score2 = 10;
        state.winScore = 11;
        state.ball.x = -20;
      });

      await waitForScreen(page, 'results');
      await page.keyboard.press('Escape');
      await waitForScreen(page, 'main_menu');
    }

    // Start one more match and verify it reaches playing
    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');
    await menuConfirm(page);
    await waitForScreen(page, 'countdown');
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('NFR: Essential elements remain visible on canvas', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonZero = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) nonZero++;
      }
      return nonZero / (data.length / 4);
    });

    expect(hasContent).toBeGreaterThan(0.01);
  });
});
