const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, goToMainMenu, start2PMatch, waitFrames, dispatchKeyDown, dispatchKeyUp } = require('./helpers');

test.describe('Pause and Resume', () => {
  test('pressing Escape during gameplay pauses the game', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'paused');

    const screen = await getScreen(page);
    expect(screen).toBe('paused');
  });

  test('pressing Escape again resumes the game', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'paused');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('pressing Enter while paused resumes the game', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'paused');

    await page.keyboard.press('Enter');
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('pressing Space while paused resumes the game', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'paused');

    await page.keyboard.press('Space');
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('game state is preserved after pause and resume', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.evaluate(() => {
      const state = window.Game.getGameState();
      state.score1 = 3;
      state.score2 = 2;
      state.ball.x = 500;
      state.ball.y = 250;
    });

    await waitFrames(page, 5);

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'paused');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'playing');

    const state = await getGameState(page);
    expect(state.score1).toBe(3);
    expect(state.score2).toBe(2);
  });

  test('paddle controls do not work while paused', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    await page.keyboard.press('Escape');
    await waitForScreen(page, 'paused');

    const state = await getGameState(page);
    const p1Y = state.paddle1.y;

    await dispatchKeyDown(page, 'KeyW');
    await waitFrames(page, 10);
    await dispatchKeyUp(page, 'KeyW');

    const newState = await getGameState(page);
    expect(newState.paddle1.y).toBe(p1Y);
  });

  test('can pause and resume multiple times', async ({ page }) => {
    await page.goto('/index.html');
    await waitForScreen(page, 'attract');
    await goToMainMenu(page);
    await start2PMatch(page);
    await waitForScreen(page, 'playing');

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await waitForScreen(page, 'paused');

      await page.keyboard.press('Escape');
      await waitForScreen(page, 'playing');
    }

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });
});
