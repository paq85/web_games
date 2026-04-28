const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, goToMainMenu, start2PMatch, waitFrames, menuConfirm, menuDown } = require('./helpers');

test.describe('Scoring and Match End', () => {
  test('player 2 scores when ball passes left edge', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = -20;
      state.ball.y = 300;
      state.ball.vx = -5;
      state.ball.vy = 0;
      state.ball.speed = 5;
    });

    await waitFrames(page, 5);

    const state = await getGameState(page);
    expect(state.score2).toBe(1);
    expect(state.score1).toBe(0);
  });

  test('player 1 scores when ball passes right edge', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = 820;
      state.ball.y = 300;
      state.ball.vx = 5;
      state.ball.vy = 0;
      state.ball.speed = 5;
    });

    await waitFrames(page, 5);

    const state = await getGameState(page);
    expect(state.score1).toBe(1);
    expect(state.score2).toBe(0);
  });

  test('after scoring, game enters point break then countdown', async ({ page }) => {
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
    await waitForScreen(page, 'countdown');

    const screen = await getScreen(page);
    expect(screen).toBe('countdown');
  });

  test('rally hits reset after scoring', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.rallyHits = 10;
      state.ball.x = -20;
    });

    await waitForScreen(page, 'point_break');

    const state = await getGameState(page);
    expect(state.rallyHits).toBe(0);
  });

  test('ball resets to center after scoring', async ({ page }) => {
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
    expect(state.ball.x).toBe(400);
    expect(state.ball.y).toBe(300);
  });

  test('serve direction goes toward player who conceded', async ({ page }) => {
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

  test('match ends when a player reaches win score with margin', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
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

    const screen = await getScreen(page);
    expect(screen).toBe('results');
  });

  test('match does not end when scores are tied at win score', async ({ page }) => {
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

  test('match requires win-by-2 after tie', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.score1 = 12;
      state.score2 = 11;
      state.winScore = 11;
      state.ball.x = -20;
    });

    await waitForScreen(page, 'point_break');

    const screen = await getScreen(page);
    expect(screen).toBe('point_break');
  });

  test('results screen allows rematch with Enter', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
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

    await page.keyboard.press('Enter');
    await waitForScreen(page, 'countdown');

    const screen = await getScreen(page);
    expect(screen).toBe('countdown');
  });

  test('results screen returns to main menu with Escape', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
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

    const screen = await getScreen(page);
    expect(screen).toBe('main_menu');
  });

  test('practice mode does not end the match', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);

    await menuConfirm(page);
    await waitForScreen(page, 'mode_select');
    await menuDown(page);
    await menuDown(page);
    await menuConfirm(page);
    await waitForScreen(page, 'countdown');
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.score1 = 20;
      state.score2 = 0;
      state.winScore = 5;
      state.ball.x = -20;
    });

    await waitForScreen(page, 'point_break');

    const screen = await getScreen(page);
    expect(screen).toBe('point_break');
  });
});
