// === Ghost AI E2E Tests ===
import { test, expect } from '@playwright/test';

test.describe('Ghost AI', () => {
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

  test('four ghosts are present', async ({ page }) => {
    const ghostCount = await page.evaluate(() => window.__PACMAN_APP__?.ghosts.length);
    expect(ghostCount).toBe(4);
  });

  test('ghosts have distinct names', async ({ page }) => {
    const names = await page.evaluate(() =>
      window.__PACMAN_APP__?.ghosts.map(g => g.name)
    );
    expect(names).toContain('blinky');
    expect(names).toContain('pinky');
    expect(names).toContain('inky');
    expect(names).toContain('clyde');
  });

  test('ghosts have distinct colors', async ({ page }) => {
    const colors = await page.evaluate(() =>
      window.__PACMAN_APP__?.ghosts.map(g => g.color)
    );
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });

  test('blinky starts outside ghost house', async ({ page }) => {
    const blinkyState = await page.evaluate(() => window.__PACMAN_APP__?.ghosts[0].state);
    expect(blinkyState).toBe('SCATTER');
  });

  test('other ghosts start in house', async ({ page }) => {
    const states = await page.evaluate(() =>
      window.__PACMAN_APP__?.ghosts.slice(1).map(g => g.state)
    );
    for (const state of states) {
      expect(state).toBe('IN_HOUSE');
    }
  });

  test('ghosts become frightened after power pellet', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game._activatePowerMode();
    });

    const states = await page.evaluate(() =>
      window.__PACMAN_APP__?.ghosts.map(g => g.state)
    );
    // At least blinky (outside) should be frightened
    expect(states[0]).toBe('FRIGHTENED');
  });

  test('frightened ghosts return to normal after timer', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      // Short frighten time
      for (const ghost of game.ghosts) {
        ghost.frighten(0.1);
      }
    });

    // Wait for frighten to expire
    await page.waitForTimeout(500);

    const blinkyState = await page.evaluate(() => window.__PACMAN_APP__?.ghosts[0].state);
    expect(blinkyState).not.toBe('FRIGHTENED');
  });

  test('eaten ghost returns to house', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      const blinky = game.ghosts[0];
      blinky.state = 'FRIGHTENED';
      blinky.frightenedTimer = 10;
      game._eatGhost(blinky);
    });

    const blinkyState = await page.evaluate(() => window.__PACMAN_APP__?.ghosts[0].state);
    expect(blinkyState).toBe('EATEN');
  });

  test('ghosts are released as dots are eaten', async ({ page }) => {
    // Eat enough dots to release inky
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      // Simulate eating 30 dots
      for (let i = 0; i < 35; i++) {
        const dots = game.maze.getDotPositions();
        if (dots.length > 0) {
          game.maze.eatDot(dots[0].x, dots[0].y);
        }
      }
      game._checkGhostRelease();
    });

    await page.waitForTimeout(100);

    // At least pinky should be released
    const pinkyReleased = await page.evaluate(() => window.__PACMAN_APP__?.ghosts[1].released);
    expect(pinkyReleased).toBe(true);
  });

  test('ghosts move during gameplay', async ({ page }) => {
    const initialPos = await page.evaluate(() => ({
      x: window.__PACMAN_APP__?.ghosts[0].x,
      y: window.__PACMAN_APP__?.ghosts[0].y,
    }));

    await page.waitForTimeout(1000);

    const newPos = await page.evaluate(() => ({
      x: window.__PACMAN_APP__?.ghosts[0].x,
      y: window.__PACMAN_APP__?.ghosts[0].y,
    }));

    // Ghost should have moved
    expect(newPos.x !== initialPos.x || newPos.y !== initialPos.y).toBe(true);
  });

  test('scatter/chase mode alternation works', async ({ page }) => {
    // Fast-forward mode timer
    await page.evaluate(() => {
      const game = window.__PACMAN_APP__;
      game.modeTimer = 0.01;
    });

    await page.waitForTimeout(200);

    // Mode should have advanced
    const modeIndex = await page.evaluate(() => window.__PACMAN_APP__?.modeIndex);
    expect(modeIndex).toBeGreaterThanOrEqual(1);
  });
});
