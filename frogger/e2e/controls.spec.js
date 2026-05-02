import { test, expect } from '@playwright/test';

test.describe('Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
  });

  test('arrow keys move frog to new pixel position', async ({ page }) => {
    const getFrogCenter = async () => {
      return page.evaluate(() => {
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
    };

    const pos0 = await getFrogCenter();
    expect(pos0).not.toBeNull();

    // Move left/right first (safe — stays in spawn zone, no vehicles)
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    const pos1 = await getFrogCenter();
    expect(pos1).not.toBeNull();
    expect(pos1.cx).toBeLessThan(pos0.cx);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const pos2 = await getFrogCenter();
    expect(pos2).not.toBeNull();
    expect(pos2.cx).toBeGreaterThan(pos1.cx);

    // Move up (may enter road, but we verify the move happened)
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    const pos3 = await getFrogCenter();
    expect(pos3).not.toBeNull();
    expect(pos3.cy).toBeLessThan(pos2.cy);
  });

  test('WASD moves frog to new pixel position', async ({ page }) => {
    const getFrogCenter = async () => {
      return page.evaluate(() => {
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
    };

    const pos0 = await getFrogCenter();
    expect(pos0).not.toBeNull();

    await page.keyboard.press('W');
    await page.waitForTimeout(200);
    const pos1 = await getFrogCenter();
    expect(pos1.cy).toBeLessThan(pos0.cy);
  });

  test('mute toggle with M key changes button icon', async ({ page }) => {
    const muteBtn = page.locator('#mute-btn');
    const iconBefore = await muteBtn.textContent();
    expect(iconBefore).toBe('🔊');

    await page.keyboard.press('M');
    await page.waitForTimeout(200);

    const iconAfter = await muteBtn.textContent();
    expect(iconAfter).toBe('🔇');
  });

  test('canvas is focusable', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeFocused();
  });

  test('canvas has role application', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('role', 'application');
  });

  test('canvas has aria-label', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    const label = await canvas.getAttribute('aria-label');
    expect(label).toContain('Frogger');
  });

  test('aria-live regions exist', async ({ page }) => {
    const polite = page.locator('#aria-live-polite');
    const assertive = page.locator('#aria-live-assertive');
    await expect(polite).toHaveAttribute('aria-live', 'polite');
    await expect(assertive).toHaveAttribute('aria-live', 'assertive');
  });

  test('swipe up moves frog', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const getFrogCenter = async () => {
      return page.evaluate(() => {
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
    };

    const posBefore = await getFrogCenter();
    expect(posBefore).not.toBeNull();

    // Dispatch touch events directly (page.mouse doesn't fire touchstart/touchend)
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      const midX = box.x + box.width / 2;
      const midY = box.y + box.height / 2;
      const upY = box.y + box.height / 4;

      await page.evaluate(
        ({ x1, y1, x2, y2 }) => {
          const canvas = document.getElementById('game-canvas');

          const startTouch = new Touch({
            identifier: 0,
            target: canvas,
            clientX: x1,
            clientY: y1,
            pageX: x1,
            pageY: y1,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0,
            force: 1,
          });

          const endTouch = new Touch({
            identifier: 0,
            target: canvas,
            clientX: x2,
            clientY: y2,
            pageX: x2,
            pageY: y2,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0,
            force: 1,
          });

          const touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [startTouch],
            changedTouches: [startTouch],
          });
          canvas.dispatchEvent(touchStartEvent);

          const touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            changedTouches: [endTouch],
          });
          canvas.dispatchEvent(touchEndEvent);
        },
        { x1: midX, y1: midY, x2: midX, y2: upY }
      );
      await page.waitForTimeout(300);
    }

    const posAfter = await getFrogCenter();
    expect(posAfter).not.toBeNull();
    expect(posAfter.cy).toBeLessThan(posBefore.cy);
  });

  test('tap starts game from idle', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#game-canvas');

    const canvas = page.locator('#game-canvas');
    await canvas.click();
    await page.waitForTimeout(500);

    // Verify game started - frog should be rendered
    const frogPixelFound = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let frogPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 50 && data[i + 1] > 200 && data[i + 2] > 100) {
          frogPixels++;
        }
      }
      return frogPixels > 0;
    });
    expect(frogPixelFound).toBe(true);
  });
});
