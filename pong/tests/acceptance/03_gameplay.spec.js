const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, goToMainMenu, start2PMatch, p1UpFor, p1DownFor, p2UpFor, p2DownFor, waitFrames, dispatchKeyDown, dispatchKeyUp } = require('./helpers');

test.describe('Gameplay', () => {
  test('countdown transitions to playing screen', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);

    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('game state is valid when playing', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    expect(state).not.toBeNull();
    expect(state.score1).toBe(0);
    expect(state.score2).toBe(0);
    expect(state.ball).toBeDefined();
    expect(state.paddle1).toBeDefined();
    expect(state.paddle2).toBeDefined();
  });

  test('ball starts at center of field', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    expect(state.ball.x).toBe(400);
    expect(state.ball.y).toBe(300);
  });

  test('player 1 paddle moves up with W key', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    const initialY = state.paddle1.y;

    await p1UpFor(page, 10);

    const newState = await getGameState(page);
    expect(newState.paddle1.y).toBeLessThan(initialY);
  });

  test('player 1 paddle moves down with S key', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    const initialY = state.paddle1.y;

    await p1DownFor(page, 10);

    const newState = await getGameState(page);
    expect(newState.paddle1.y).toBeGreaterThan(initialY);
  });

  test('player 2 paddle moves up with ArrowUp', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    const initialY = state.paddle2.y;

    await p2UpFor(page, 10);

    const newState = await getGameState(page);
    expect(newState.paddle2.y).toBeLessThan(initialY);
  });

  test('player 2 paddle moves down with ArrowDown', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    const initialY = state.paddle2.y;

    await p2DownFor(page, 10);

    const newState = await getGameState(page);
    expect(newState.paddle2.y).toBeGreaterThan(initialY);
  });

  test('paddle is clamped at top boundary', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await p1UpFor(page, 100);

    const state = await getGameState(page);
    expect(state.paddle1.y).toBeGreaterThanOrEqual(0);
  });

  test('paddle is clamped at bottom boundary', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await p1DownFor(page, 100);

    const state = await getGameState(page);
    const maxY = 600 - state.paddle1.height;
    expect(state.paddle1.y).toBeLessThanOrEqual(maxY);
  });

  test('ball moves during gameplay', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    const state1 = await getGameState(page);
    await waitFrames(page, 20);
    const state2 = await getGameState(page);

    expect(state2.ball.x).not.toBe(state1.ball.x);
  });

  test('ball bounces off top wall', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.y = 10;
      state.ball.vy = -5;
      state.ball.vx = 0;
    });

    await waitFrames(page, 5);

    const state = await getGameState(page);
    expect(state.ball.y).toBeGreaterThanOrEqual(0);
  });

  test('ball bounces off bottom wall', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.y = 590;
      state.ball.vy = 5;
      state.ball.vx = 0;
    });

    await waitFrames(page, 5);

    const state = await getGameState(page);
    expect(state.ball.y).toBeLessThanOrEqual(600);
  });

  test('ball reflects off paddle on contact', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = state.paddle1.x + state.paddle1.width - 1;
      state.ball.y = state.paddle1.y + state.paddle1.height / 2;
      state.ball.vx = -5;
      state.ball.vy = 0;
      state.ball.speed = 5;
    });

    await waitFrames(page, 3);

    const state = await getGameState(page);
    expect(state.ball.vx).toBeGreaterThan(0);
  });

  test('ball speed increases after paddle hit', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.ball.x = state.paddle1.x + state.paddle1.width - 1;
      state.ball.y = state.paddle1.y + state.paddle1.height / 2;
      state.ball.vx = -5;
      state.ball.vy = 0;
      state.ball.speed = 5;
    });

    await waitFrames(page, 3);

    const state = await getGameState(page);
    expect(state.ball.speed).toBeGreaterThan(5);
  });

  test('both paddles can move simultaneously', async ({ page }) => {
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
});
