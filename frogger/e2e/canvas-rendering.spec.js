import { test, expect } from '@playwright/test';

test.describe('Canvas Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
  });

  test('canvas has non-zero dimensions after load', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    const width = await canvas.evaluate(el => el.width);
    const height = await canvas.evaluate(el => el.height);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test('canvas has 2D context', async ({ page }) => {
    const hasContext = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      return canvas.getContext('2d') !== null;
    });
    expect(hasContext).toBe(true);
  });

  test('idle screen renders pixel content (not blank)', async ({ page }) => {
    // Capture canvas pixels - if game is broken, canvas will be blank
    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      // Check if any pixel has alpha > 0 (i.e., something was drawn)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return true;
      }
      return false;
    });
    expect(hasContent).toBe(true);
  });

  test('idle screen contains FROGGER title text', async ({ page }) => {
    // The idle screen draws "FROGGER" text - sample pixels where title should be
    const hasTitlePixels = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      // Title should be near top center - sample that region
      const startY = Math.floor(canvas.height * 0.2);
      const endY = Math.floor(canvas.height * 0.35);
      const startX = Math.floor(w * 0.3);
      const endX = Math.floor(w * 0.7);
      let greenPixels = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * w + x) * 4;
          // FROGGER title is drawn in #00ff88 (green)
          if (data[idx + 1] > 200 && data[idx] < 50) {
            greenPixels++;
          }
        }
      }
      return greenPixels > 0;
    });
    expect(hasTitlePixels).toBe(true);
  });

  test('background lanes are drawn with correct colors', async ({ page }) => {
    const laneColors = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const cs = Math.floor(canvas.width / 15);
      // Sample center pixel of each row
      const colors = [];
      for (let row = 0; row < 13; row++) {
        const y = row * cs + Math.floor(cs / 2);
        const x = Math.floor(canvas.width / 2);
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        colors.push({ r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] });
      }
      return colors;
    });
    // Row 0 (home zone) should be green-ish (#2a4a2a)
    expect(laneColors[0].g).toBeGreaterThan(laneColors[0].r);
    // Road rows (9-12) should be dark (#2d2d2d)
    expect(laneColors[9].r).toBeCloseTo(laneColors[9].g, 0);
    // River rows (2-6) should be blue-ish (#1a3a5c)
    expect(laneColors[3].b).toBeGreaterThan(laneColors[3].r);
  });

  test('playing state renders obstacles on canvas', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    const hasObstacles = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      // Road zone is rows 10-13 (0-indexed: 9-12)
      const cs = Math.floor(canvas.width / 15);
      const roadStart = 9 * cs;
      const roadEnd = 13 * cs;
      let coloredPixels = 0;
      for (let y = roadStart; y < roadEnd; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          // Road is dark gray (#2d2d2d), look for non-road colors (vehicles)
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          if (r > 80 || g > 80 || b > 80) {
            coloredPixels++;
          }
        }
      }
      return coloredPixels > 10; // At least some vehicle pixels
    });
    expect(hasObstacles).toBe(true);
  });

  test('frog is rendered on canvas after game starts', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    const frogPixelFound = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      // Frog starts at bottom center, frog color is #00ff88
      const cs = Math.floor(canvas.width / 15);
      // Frog spawn area: row 12-13, center columns
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
    expect(frogPixelFound).toBe(true);
  });
});
