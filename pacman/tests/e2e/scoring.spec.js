// === Scoring E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Scoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(100);
    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__PACMAN_APP__?.getState() === 'PLAYING', { timeout: 5000 });
  });

  test('dots award 10 points each', async ({ page }) => {
    // Move to eat a dot
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);

    const score = await page.evaluate(() => window.__PACMAN_APP__?.getScore());
    // Should be a multiple of 10
    expect(score % 10).toBe(0);
    expect(score).toBeGreaterThan(0);
  });

  test('power pellet awards 50 points', async ({ page }) => {
    // Programmatically eat a power pellet
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game.score = 0;
      // Find and "eat" a power pellet
      const pellets = game.maze.getPowerPelletPositions();
      if (pellets.length > 0) {
        game.pacman.x = pellets[0].x;
        game.pacman.y = pellets[0].y;
      }
    });
    await page.waitForTimeout(200);

    // Trigger dot check
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game._checkDotEating();
    });

    const score = await page.evaluate(() => window.__PACMAN_APP__?.getScore());
    expect(score).toBe(50);
  });

  test('ghost eating cascade scoring works (200, 400, 800, 1600)', async ({ page }) => {
    // Set up ghost eating scenario
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game.score = 0;
      game.ghostsEatenCombo = 0;

      // Make all ghosts frightened
      for (const ghost of game.ghosts) {
        ghost.state = 'FRIGHTENED';
        ghost.frightenedTimer = 10;
        ghost.x = game.pacman.x;
        ghost.y = game.pacman.y;
      }
    });

    // Eat ghosts one by one
    const expectedScores = [200, 600, 1400, 3000]; // Cumulative
    for (let i = 0; i < 4; i++) {
      await page.evaluate((idx) => {
        const game = window.__PACMAN_APP__;
        const ghost = game.ghosts[idx];
        if (ghost.state === 'FRIGHTENED') {
          game._eatGhost(ghost);
        }
      }, i);
    }

    const finalScore = await page.evaluate(() => window.__PACMAN_APP__?.getScore());
    // 200 + 400 + 800 + 1600 = 3000
    expect(finalScore).toBe(3000);
  });

  test('high scores persist across sessions', async ({ page }) => {
    // Add a score
    await page.evaluate(() => {
      window.__PACMAN_APP__.scores.addScore(5000, 3);
    });

    // Reload page
    await page.reload();
    await page.waitForSelector('#game-canvas');
    await page.click('#game-canvas');
    await page.waitForTimeout(500);

    const highScore = await page.evaluate(() => window.__PACMAN_APP__?.scores.getHighScore());
    expect(highScore).toBe(5000);
  });

  test('high score table shows top 10', async ({ page }) => {
    // Add multiple scores
    await page.evaluate(() => {
      const scores = window.__PACMAN_APP__.scores;
      for (let i = 1; i <= 12; i++) {
        scores.addScore(i * 1000, i);
      }
    });

    const topScores = await page.evaluate(() => window.__PACMAN_APP__?.scores.getTopScores());
    expect(topScores.length).toBe(10);
    expect(topScores[0].score).toBe(12000);
  });

  test('extra life at 10000 points', async ({ page }) => {
    const initialLives = await page.evaluate(() => window.__PACMAN_APP__?.getLives());

    // Set score just below threshold and then cross it
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game.score = 9990;
      game.score += 10;
      game._checkExtraLife();
    });

    const newLives = await page.evaluate(() => window.__PACMAN_APP__?.getLives());
    expect(newLives).toBe(initialLives + 1);
  });
});
