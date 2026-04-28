const { test, expect } = require('@playwright/test');
const { waitForScreen, getScreen, getGameState, flapKeyboard, flapClick, waitFrames } = require('./helpers');

test.describe('Input Methods', () => {
  test('Space key triggers flap during gameplay', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');
    await waitFrames(page, 10);

    const beforeY = await page.evaluate(() => window.Game.getGameState().bird.y);

    await page.keyboard.press('Space');
    await waitFrames(page, 1);

    const afterY = await page.evaluate(() => window.Game.getGameState().bird.y);
    expect(afterY).toBeLessThan(beforeY);
  });

  test('ArrowUp key triggers flap during gameplay', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await page.keyboard.press('ArrowUp');
    await waitForScreen(page, 'playing');
    await waitFrames(page, 10);

    const beforeY = await page.evaluate(() => window.Game.getGameState().bird.y);

    await page.keyboard.press('ArrowUp');
    await waitFrames(page, 1);

    const afterY = await page.evaluate(() => window.Game.getGameState().bird.y);
    expect(afterY).toBeLessThan(beforeY);
  });

  test('mouse click triggers flap during gameplay', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Start with keyboard (reliable)
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Click to flap immediately after starting (bird is at safe position)
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();

    const beforeY = await page.evaluate(() => window.Game.getGameState().bird.y);

    // Click center of canvas
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await waitFrames(page, 2);

    const afterY = await page.evaluate(() => window.Game.getGameState().bird.y);
    expect(afterY).toBeLessThan(beforeY);
  });

  test('touch input triggers flap during gameplay', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Start game via keyboard (reliable)
    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Wait a bit then use touch to flap
    await waitFrames(page, 3);
    const screen = await getScreen(page);
    if (screen !== 'playing') {
      await flapKeyboard(page);
      await waitForScreen(page, 'playing');
    }

    const canvas = page.locator('#game-canvas');
    const beforeY = await page.evaluate(() => window.Game.getGameState().bird.y);

    // Dispatch a touchstart event directly on the canvas
    await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const touch = new Touch({ identifier: 1, target: canvas, clientX: 100, clientY: 100 });
      const event = new TouchEvent('touchstart', { touches: [touch], cancelable: true, bubbles: true });
      canvas.dispatchEvent(event);
    });
    await waitFrames(page, 1);

    const afterY = await page.evaluate(() => window.Game.getGameState().bird.y);
    expect(afterY).toBeLessThan(beforeY);
  });

  test('rapid flapping does not crash the game', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Rapid flapping
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Space');
      await waitFrames(page, 1);
    }

    const screen = await getScreen(page);
    // Should still be playing (bird keeps going up with rapid flaps)
    // or game_over if it hit the ceiling
    expect(['playing', 'game_over']).toContain(screen);
  });

  test('Space key does not scroll the page during gameplay', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    const scrollY1 = await page.evaluate(() => window.scrollY);

    await page.keyboard.press('Space');
    await waitFrames(page, 5);

    const scrollY2 = await page.evaluate(() => window.scrollY);
    expect(scrollY2).toBe(scrollY1);
  });
});

test.describe('Responsive Behavior', () => {
  test('canvas resizes on viewport change', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await page.waitForTimeout(500);

    const initialSize = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      return { width: canvas.width, height: canvas.height };
    });

    await page.setViewportSize({ width: 320, height: 480 });
    await page.waitForTimeout(300);

    const newSize = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      return { width: canvas.width, height: canvas.height };
    });

    // Canvas should have resized
    expect(newSize.width).toBeGreaterThan(0);
    expect(newSize.height).toBeGreaterThan(0);
    // Aspect ratio should be preserved
    const initialAspect = initialSize.width / initialSize.height;
    const newAspect = newSize.width / newSize.height;
    expect(newAspect).toBeCloseTo(initialAspect, 1);
  });

  test('game is playable at mobile viewport size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapClick(page);
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });

  test('game is playable at landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    const screen = await getScreen(page);
    expect(screen).toBe('playing');
  });
});

test.describe('Stability', () => {
  test('game remains stable after extended play', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    // Play multiple rounds
    for (let round = 0; round < 5; round++) {
      await flapKeyboard(page);
      await waitForScreen(page, 'playing');

      // Play for a bit
      for (let i = 0; i < 30; i++) {
        const screen = await getScreen(page);
        if (screen === 'game_over') break;
        if (i % 4 === 0) await flapKeyboard(page);
        await waitFrames(page, 2);
      }
      await waitForScreen(page, 'game_over', 5000);
    }

    // Page should still be functional
    const screen = await getScreen(page);
    expect(['start', 'playing', 'game_over']).toContain(screen);
  });

  test('no JavaScript errors during normal gameplay', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    for (let i = 0; i < 100; i++) {
      if (i % 6 === 0) await flapKeyboard(page);
      await waitFrames(page, 3);
    }

    await waitForScreen(page, 'game_over', 10000);

    expect(errors).toHaveLength(0);
  });

  test('game handles being hidden and shown', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');
    await waitForScreen(page, 'start');

    await flapKeyboard(page);
    await waitForScreen(page, 'playing');

    // Simulate tab being hidden
    await page.evaluate(() => document.body.style.display = 'none');
    await page.waitForTimeout(200);
    await page.evaluate(() => document.body.style.display = '');
    await page.waitForTimeout(200);

    const screen = await getScreen(page);
    expect(['playing', 'game_over']).toContain(screen);
  });
});
