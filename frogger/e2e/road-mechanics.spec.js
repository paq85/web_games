import { test, expect } from '@playwright/test';

test.describe('Road Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  });

  test('vehicles are rendered on road lanes', async ({ page }) => {
    // Verify vehicles (non-road-colored pixels) exist in road zone
    const hasVehicles = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const cs = Math.floor(canvas.width / 15);
      // Road zone: rows 10-13 (0-indexed: 9-12)
      const roadStart = 9 * cs;
      const roadEnd = 13 * cs;
      let vehiclePixels = 0;
      for (let y = roadStart; y < roadEnd; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          // Road is #2d2d2d, vehicles have distinct colors
          if ((r > 100 && g < 50) || (r > 100 && b > 100 && g < 100) ||
              (g > 100 && r < 80) || (r > 150 && g > 100 && b < 80)) {
            vehiclePixels++;
          }
        }
      }
      return vehiclePixels > 10;
    });
    expect(hasVehicles).toBe(true);
  });

  test('vehicles move between frames', async ({ page }) => {
    const roadPixels1 = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const cs = Math.floor(canvas.width / 15);
      const w = canvas.width;
      const y = 11 * cs + Math.floor(cs / 2);
      const pixels = [];
      for (let x = 0; x < w; x += 3) {
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
      for (let x = 0; x < w; x += 3) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        pixels.push(`${data[0]},${data[1]},${data[2]}`);
      }
      return pixels.join(';');
    });

    expect(roadPixels1).not.toBe(roadPixels2);
  });

  test('frog dies when hit by vehicle', async ({ page }) => {
    const livesBefore = await page.locator('#hud-lives').textContent();
    const initialFrogs = (livesBefore.match(/🐸/g) || []).length;

    // Move frog into road lane and wait for vehicle
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(5000);

    const livesAfter = await page.locator('#hud-lives').textContent();
    const remainingFrogs = (livesAfter.match(/🐸/g) || []).length;
    expect(remainingFrogs).toBeLessThan(initialFrogs);
  });

  test('frog resets to spawn position after death', async ({ page }) => {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(5000); // wait for death

    // After death animation, frog should reappear at spawn
    const frogAtSpawn = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const cs = Math.floor(canvas.width / 15);
      // Check spawn zone (bottom center) for frog pixels
      const frogY = 12 * cs;
      const frogStartX = 6 * cs;
      const frogEndX = 9 * cs;
      let frogPixels = 0;
      for (let y = frogY; y < canvas.height; y++) {
        for (let x = frogStartX; x < frogEndX; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 1] > 200 && data[idx] < 50 && data[idx + 2] > 100) {
            frogPixels++;
          }
        }
      }
      return frogPixels > 0;
    });
    expect(frogAtSpawn).toBe(true);
  });

  test('safe mid-zone has no vehicles', async ({ page }) => {
    // Safe zone is row 8 (0-indexed: 7)
    const safeZoneClear = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const cs = Math.floor(canvas.width / 15);
      const w = canvas.width;
      const safeY = 7 * cs;
      // Safe zone should be green (#1a3a1a) - no vehicle colors
      for (let x = 0; x < w; x += 5) {
        const data = ctx.getImageData(x, safeY + Math.floor(cs / 2), 1, 1).data;
        const r = data[0], g = data[1], b = data[2];
        // If we find bright colors (vehicles) in safe zone, that's wrong
        if (r > 100 || (g > 80 && g > r * 2)) return false;
      }
      return true;
    });
    expect(safeZoneClear).toBe(true);
  });
});
