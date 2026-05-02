// === Gameplay E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    // Focus canvas
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
  });

  test('game loads and shows menu', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    // Check game is initialized
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('MENU');
  });

  test('can start game from menu', async ({ page }) => {
    // Press Enter to select Play
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    // Should be in difficulty select
    let state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('DIFFICULTY');

    // Press Enter to select Medium
    await page.keyboard.press('Enter');
    // Should be in READY state
    await page.waitForFunction(() => {
      const s = window.__PACMAN_APP__?.getState();
      return s === 'READY' || s === 'PLAYING';
    }, { timeout: 5000 });

    // Wait for ready timer to finish
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });
    state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('PLAYING');
  });

  test('pacman can eat dots and score increases', async ({ page }) => {
    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    // Get initial score
    const initialScore = await page.evaluate(() => window.__PACMAN_APP__?.getScore());
    expect(initialScore).toBe(0);

    // Move left to eat dots
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1000);

    const newScore = await page.evaluate(() => window.__PACMAN_APP__?.getScore());
    expect(newScore).toBeGreaterThan(0);
  });

  test('lives decrease when caught by ghost', async ({ page }) => {
    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    const initialLives = await page.evaluate(() => window.__PACMAN_APP__?.getLives());
    expect(initialLives).toBe(3);

    // Force ghost collision
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      const blinky = game.ghosts[0];
      blinky.x = game.pacman.x;
      blinky.y = game.pacman.y;
      blinky.state = 'CHASE';
    });

    // Wait for death processing
    await page.waitForFunction(() => {
      const s = window.__PACMAN_APP__?.getState();
      return s === 'DYING' || s === 'READY';
    }, { timeout: 5000 });

    const lives = await page.evaluate(() => window.__PACMAN_APP__?.getLives());
    expect(lives).toBe(2);
  });

  test('game over when all lives lost', async ({ page }) => {
    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    // Simulate game over
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game.lives = 1;
      game.pacman.alive = true;
      // Position ghost on pacman
      game.ghosts[0].x = game.pacman.x;
      game.ghosts[0].y = game.pacman.y;
      game.ghosts[0].state = 'CHASE';
    });

    // Wait for death animation then game over
    await page.waitForFunction(
      () => window.__PACMAN_APP__?.getState() === 'GAME_OVER',
      { timeout: 5000 }
    );
    const state = await page.evaluate(() => window.__PACMAN_APP__?.getState());
    expect(state).toBe('GAME_OVER');
  });

  test('level advances when all dots are eaten', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    // Eat all dots programmatically
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      const maze = game.maze;
      for (let y = 0; y < 31; y++) {
        for (let x = 0; x < 28; x++) {
          if (maze.grid[y][x] === 2 || maze.grid[y][x] === 3) {
            maze.eatDot(x, y);
          }
        }
      }
    });

    // Wait for level complete or next level
    await page.waitForFunction(
      () => {
        const state = window.__PACMAN_APP__?.getState();
        return state === 'LEVEL_COMPLETE' || state === 'READY';
      },
      { timeout: 5000 }
    );
  });

  test('score persists across game over and restart', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });

    // Set score directly and end game
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game.score = 1500;
      game.lives = 1;
      game.ghosts[0].x = game.pacman.x;
      game.ghosts[0].y = game.pacman.y;
      game.ghosts[0].state = 'CHASE';
    });

    await page.waitForFunction(
      () => window.__PACMAN_APP__?.getState() === 'GAME_OVER',
      { timeout: 5000 }
    );

    // High score should have been saved
    const highScore = await page.evaluate(() => window.__PACMAN_APP__?.scores.getHighScore());
    expect(highScore).toBeGreaterThanOrEqual(1500);
  });
});
