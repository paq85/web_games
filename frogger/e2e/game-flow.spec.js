import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
  });

  test('shows idle screen with FROGGER title rendered', async ({ page }) => {
    // Verify idle screen actually renders content (not just blank canvas)
    const hasTitlePixels = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      // Title should be near top center - sample that region for green pixels (#00ff88)
      const startY = Math.floor(canvas.height * 0.15);
      const endY = Math.floor(canvas.height * 0.4);
      const startX = Math.floor(w * 0.2);
      const endX = Math.floor(w * 0.8);
      let greenPixels = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 1] > 200 && data[idx] < 50) greenPixels++;
        }
      }
      return greenPixels > 0;
    });
    expect(hasTitlePixels).toBe(true);
  });

  test('starts game on space press and renders playing state', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Verify game renders playing state with frog on canvas
    const frogPixelFound = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      // Frog color is #00ff88, search entire canvas
      let frogPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 50 && data[i + 1] > 200 && data[i + 2] > 100) {
          frogPixels++;
        }
      }
      return frogPixels > 10; // at least some frog pixels
    });
    expect(frogPixelFound).toBe(true);
  });

  test('score increases by exactly 10 after one move up', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const scoreBefore = await page.locator('#hud-score').textContent();
    const scoreNumBefore = parseInt(scoreBefore.replace('Score: ', ''));

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);

    const scoreAfter = await page.locator('#hud-score').textContent();
    const scoreNumAfter = parseInt(scoreAfter.replace('Score: ', ''));
    expect(scoreNumAfter - scoreNumBefore).toBe(10);
  });

  test('WASD controls move frog and award points', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const scoreBefore = await page.locator('#hud-score').textContent();
    const scoreNumBefore = parseInt(scoreBefore.replace('Score: ', ''));

    await page.keyboard.press('W');
    await page.waitForTimeout(200);
    await page.keyboard.press('A');
    await page.waitForTimeout(200);
    await page.keyboard.press('S');
    await page.waitForTimeout(200);
    await page.keyboard.press('D');
    await page.waitForTimeout(500);

    const scoreAfter = await page.locator('#hud-score').textContent();
    const scoreNumAfter = parseInt(scoreAfter.replace('Score: ', ''));
    // W (up) = 10pts, A (left) = 0, S (down) = 0, D (right) = 0
    expect(scoreNumAfter).toBeGreaterThan(scoreNumBefore);
  });

  test('pauses game with Escape and shows PAUSED overlay', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify PAUSED text is rendered on canvas
    const hasPausedOverlay = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      // Check for dark overlay (rgba(0,0,0,0.75)) in center region
      const cy = Math.floor(canvas.height / 2);
      const cx = Math.floor(w / 2);
      const idx = (cy * w + cx) * 4;
      // Overlay should make center dark with high alpha
      return data[idx + 3] > 200 && data[idx] < 50;
    });
    expect(hasPausedOverlay).toBe(true);

    const assertive = page.locator('#aria-live-assertive');
    await expect(assertive).toHaveText(/paused/i, { timeout: 3000 });
  });

  test('resumes game with Escape and timer continues', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Timer should be frozen while paused
    const timerWhilePaused = await page.evaluate(() => {
      const timerBar = document.getElementById('timer-bar');
      return parseFloat(timerBar.style.width);
    });
    await page.waitForTimeout(1000);
    const timerStillPaused = await page.evaluate(() => {
      const timerBar = document.getElementById('timer-bar');
      return parseFloat(timerBar.style.width);
    });
    expect(timerStillPaused).toBeCloseTo(timerWhilePaused, 0);

    // Resume
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Timer should now decrease again
    const timerAfterResume = await page.evaluate(() => {
      const timerBar = document.getElementById('timer-bar');
      return parseFloat(timerBar.style.width);
    });
    await page.waitForTimeout(1000);
    const timerDecreased = await page.evaluate(() => {
      const timerBar = document.getElementById('timer-bar');
      return parseFloat(timerBar.style.width);
    });
    expect(timerDecreased).toBeLessThan(timerAfterResume);
  });

  test('pauses with P key', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('P');
    await page.waitForTimeout(1000);

    const assertive = page.locator('#aria-live-assertive');
    await expect(assertive).toHaveText(/paused/i, { timeout: 3000 });
  });
});
