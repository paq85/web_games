import { test, expect } from '@playwright/test';

test.describe('Game State Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
  });

  test('game loop starts after space press', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // The game should be in PLAYING state - verify by checking canvas renders continuously
    // Take two snapshots with delay - if game loop runs, frame should update
    const frame1 = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data.toString().slice(0, 100);
    });
    await page.waitForTimeout(300);
    const frame2 = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data.toString().slice(0, 100);
    });
    // Frames should differ if game loop is running (water animation, vehicles move)
    // Note: if reduced motion is active, they might be same - but in headless Chrome it shouldn't be
    // Instead, check that timer is counting down
    const timerRatio1 = await page.evaluate(() => {
      const timerBar = document.getElementById('timer-bar');
      return parseFloat(timerBar.style.width);
    });
    await page.waitForTimeout(1000);
    const timerRatio2 = await page.evaluate(() => {
      const timerBar = document.getElementById('timer-bar');
      return parseFloat(timerBar.style.width);
    });
    expect(timerRatio2).toBeLessThan(timerRatio1);
  });

  test('frog pixel position changes after ArrowUp', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    // Get frog pixel position before move
    const frogPixelsBefore = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const cs = Math.floor(canvas.width / 15);
      // Find center of mass of frog-colored pixels in spawn zone
      let sumX = 0, sumY = 0, count = 0;
      for (let y = 10 * cs; y < canvas.height; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 1] > 200 && data[idx] < 50 && data[idx + 2] > 100) {
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }
      return count > 0 ? { cx: sumX / count, cy: sumY / count } : null;
    });
    expect(frogPixelsBefore).not.toBeNull();

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);

    const frogPixelsAfter = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      let sumX = 0, sumY = 0, count = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 1] > 200 && data[idx] < 50 && data[idx + 2] > 100) {
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }
      return count > 0 ? { cx: sumX / count, cy: sumY / count } : null;
    });
    expect(frogPixelsAfter).not.toBeNull();
    // Frog should have moved up (y decreased)
    expect(frogPixelsAfter.cy).toBeLessThan(frogPixelsBefore.cy);
  });

  test('frog pixel position changes after ArrowLeft', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const frogPixelsBefore = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      let sumX = 0, sumY = 0, count = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 1] > 200 && data[idx] < 50 && data[idx + 2] > 100) {
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }
      return count > 0 ? { cx: sumX / count, cy: sumY / count } : null;
    });
    expect(frogPixelsBefore).not.toBeNull();

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    const frogPixelsAfter = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      let sumX = 0, sumY = 0, count = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 1] > 200 && data[idx] < 50 && data[idx + 2] > 100) {
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }
      return count > 0 ? { cx: sumX / count, cy: sumY / count } : null;
    });
    expect(frogPixelsAfter).not.toBeNull();
    // Frog should have moved left (x decreased)
    expect(frogPixelsAfter.cx).toBeLessThan(frogPixelsBefore.cx);
  });

  test('score increases by approximately 10 after one move up', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const scoreBefore = await page.locator('#hud-score').textContent();
    const scoreNumBefore = parseInt(scoreBefore.replace('Score: ', ''));

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);

    const scoreAfter = await page.locator('#hud-score').textContent();
    const scoreNumAfter = parseInt(scoreAfter.replace('Score: ', ''));

    // Moving up should award 10 points
    expect(scoreNumAfter - scoreNumBefore).toBe(10);
  });

  test('lives decrease after frog dies in road', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const livesBefore = await page.locator('#hud-lives').textContent();
    const initialFrogs = (livesBefore.match(/🐸/g) || []).length;
    expect(initialFrogs).toBe(3);

    // Move frog up into road zone and wait for vehicle collision
    // The frog starts at row 13 (0-indexed: 12). Move up to enter road lanes.
    // Stay in road long enough that a vehicle MUST pass through the frog's column.
    // Frog spawns at column 7 (center). Wait long enough for vehicles to cycle.
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(5000);

    const livesAfter = await page.locator('#hud-lives').textContent();
    const remainingFrogs = (livesAfter.match(/🐸/g) || []).length;
    // After 5 seconds in road lane, at least one vehicle should have hit the frog
    expect(remainingFrogs).toBeLessThan(initialFrogs);
  });

  test('vehicles move between frames', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Sample road zone pixels at two points in time
    const roadPixels1 = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const cs = Math.floor(canvas.width / 15);
      const w = canvas.width;
      // Sample a horizontal line in road zone
      const y = 11 * cs + Math.floor(cs / 2);
      const pixels = [];
      for (let x = 0; x < w; x += 5) {
        const idx = (y * w + x) * 4;
        const data = ctx.getImageData(x, y, 1, 1).data;
        pixels.push(`${data[0]},${data[1]},${data[2]}`);
      }
      return pixels.join(';');
    });

    await page.waitForTimeout(500);

    const roadPixels2 = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const cs = Math.floor(canvas.width / 15);
      const w = canvas.width;
      const y = 11 * cs + Math.floor(cs / 2);
      const pixels = [];
      for (let x = 0; x < w; x += 5) {
        const idx = (y * w + x) * 4;
        const data = ctx.getImageData(x, y, 1, 1).data;
        pixels.push(`${data[0]},${data[1]},${data[2]}`);
      }
      return pixels.join(';');
    });

    // Vehicles should have moved, so road pixels should differ
    expect(roadPixels1).not.toBe(roadPixels2);
  });

  test('river water animates between frames', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    const riverPixels1 = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const cs = Math.floor(canvas.width / 15);
      const w = canvas.width;
      // Sample river zone (rows 2-6)
      const y = 4 * cs + Math.floor(cs * 0.5);
      const pixels = [];
      for (let x = 0; x < w; x += 5) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        pixels.push(`${data[0]},${data[1]},${data[2]}`);
      }
      return pixels.join(';');
    });

    await page.waitForTimeout(500);

    const riverPixels2 = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const cs = Math.floor(canvas.width / 15);
      const w = canvas.width;
      const y = 4 * cs + Math.floor(cs * 0.5);
      const pixels = [];
      for (let x = 0; x < w; x += 5) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        pixels.push(`${data[0]},${data[1]},${data[2]}`);
      }
      return pixels.join(';');
    });

    // Water animation should cause pixel differences
    expect(riverPixels1).not.toBe(riverPixels2);
  });
});
