import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const PORT = 8765;
const BASE_URL = `http://localhost:${PORT}`;
const __dirname = dirname(fileURLToPath(import.meta.url));

let server;

test.beforeAll(async () => {
  server = spawn('npx', ['-y', 'http-server@14.1.1', '-p', String(PORT), '-s', '--cors'], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'pipe',
  });
  await new Promise((resolve) => setTimeout(resolve, 3000));
});

test.afterAll(async () => {
  if (server) server.kill();
});

test.describe('Tic Tac Toe - Accessibility - ARIA Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('all cells have aria-label with position and state', async ({ page }) => {
    const cells = page.locator('.cell');
    await expect(cells).toHaveCount(9);

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3) + 1;
      const col = (i % 3) + 1;
      const label = await cells.nth(i).getAttribute('aria-label');
      expect(label).toContain(`Row ${row}`);
      expect(label).toContain(`Column ${col}`);
    }
  });

  test('all cells have role="button"', async ({ page }) => {
    const cells = page.locator('.cell');
    for (let i = 0; i < 9; i++) {
      await expect(cells.nth(i)).toHaveAttribute('role', 'button');
    }
  });

  test('all cells have tabindex="0"', async ({ page }) => {
    const cells = page.locator('.cell');
    for (let i = 0; i < 9; i++) {
      await expect(cells.nth(i)).toHaveAttribute('tabindex', '0');
    }
  });

  test('aria-label updates when cell is taken', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(0).click();
    const label = await cells.nth(0).getAttribute('aria-label');
    expect(label).toContain('X');
  });

  test('status element has role="status" and aria-live="polite"', async ({ page }) => {
    const status = page.locator('#status');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('Tic Tac Toe - Accessibility - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('arrow keys move focus between cells in all directions', async ({ page }) => {
    const cells = page.locator('.cell');

    await cells.nth(4).focus();
    await expect(cells.nth(4)).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(cells.nth(7)).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(cells.nth(4)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(cells.nth(5)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(cells.nth(4)).toBeFocused();
  });

  test('arrow keys clamp at row boundaries', async ({ page }) => {
    const cells = page.locator('.cell');

    await cells.nth(4).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(cells.nth(3)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(cells.nth(3)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(cells.nth(5)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(cells.nth(5)).toBeFocused();
  });

  test('arrow keys clamp at column boundaries', async ({ page }) => {
    const cells = page.locator('.cell');

    await cells.nth(4).focus();

    await page.keyboard.press('ArrowUp');
    let focusedIndex = await page.evaluate(() => document.activeElement?.dataset?.index);
    expect(focusedIndex).toBe('1');

    await page.keyboard.press('ArrowUp');
    focusedIndex = await page.evaluate(() => document.activeElement?.dataset?.index);
    expect(focusedIndex).toBe('0');

    await page.keyboard.press('ArrowUp');
    focusedIndex = await page.evaluate(() => document.activeElement?.dataset?.index);
    expect(focusedIndex).toBe('0');
  });

  test('Enter key places a mark on focused cell', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(4).focus();
    await page.keyboard.press('Enter');
    await expect(cells.nth(4)).toHaveText('X');
  });

  test('Space key places a mark on focused cell', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(1).focus();
    await page.keyboard.press('Space');
    await expect(cells.nth(1)).toHaveText('X');
  });

  test('keyboard navigation does not place mark on occupied cell', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(0).focus();
    await page.keyboard.press('Enter');
    await expect(cells.nth(0)).toHaveText('X');

    await page.keyboard.press('Enter');
    await expect(cells.nth(0)).toHaveText('X');
  });

  test('keyboard navigation does not place mark after game over', async ({ page }) => {
    const cells = page.locator('.cell');

    for (let i = 0; i < 3; i++) {
      await cells.nth(i + 3).click();
      await cells.nth(i + 6).click();
    }
    await cells.nth(0).click();
    await cells.nth(3).click();
    await cells.nth(6).click();

    await expect(page.locator('#status')).toHaveText('X wins!');

    await cells.nth(1).focus();
    await page.keyboard.press('Enter');
    await expect(cells.nth(1)).toHaveText('');
  });
});

test.describe('Tic Tac Toe - Accessibility - Focus Styles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('mode buttons have :focus-visible styles', async ({ page }) => {
    const btnPvp = page.locator('#btn-pvp');
    const btnAi = page.locator('#btn-ai');

    await btnPvp.focus();
    const pvpStyle = await btnPvp.evaluate(el => getComputedStyle(el, ':focus-visible'));

    await btnAi.focus();
    const aiStyle = await btnAi.evaluate(el => getComputedStyle(el, ':focus-visible'));

    expect(pvpStyle.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(aiStyle.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('mode buttons focus-visible has orange outline', async ({ page }) => {
    const btnPvp = page.locator('#btn-pvp');
    await btnPvp.focus();
    const outlineColor = await btnPvp.evaluate(el => {
      return getComputedStyle(el).outlineColor;
    });
    expect(outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('cells have :focus-visible styles', async ({ page }) => {
    const hasFocusVisibleRules = await page.evaluate(() => {
      const rules = Array.from(document.styleSheets)
        .map(sheet => {
          try { return Array.from(sheet.cssRules); } catch { return []; }
        })
        .flat();
      const focusVisibleRules = rules.filter(r =>
        r.selectorText && r.selectorText.includes(':focus-visible') && r.selectorText.includes('.cell')
      );
      return {
        count: focusVisibleRules.length,
        styles: focusVisibleRules.map(r => ({
          borderColor: r.style.borderColor,
          boxShadow: r.style.boxShadow,
        })),
      };
    });

    expect(hasFocusVisibleRules.count).toBeGreaterThan(0);
    expect(hasFocusVisibleRules.styles[0].borderColor).not.toBe('');
    expect(hasFocusVisibleRules.styles[0].boxShadow).not.toBe('none');
  });
});

test.describe('Tic Tac Toe - Accessibility - Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('hint text has sufficient color contrast', async ({ page }) => {
    const hint = page.locator('.hint');
    const hintColor = await hint.evaluate(el => getComputedStyle(el).color);
    const bgColor = await page.locator('body').evaluate(el => getComputedStyle(el).background);

    const hintRgb = parseColor(hintColor);
    const bgRgb = parseColor(bgColor);

    const contrast = getContrastRatio(hintRgb, bgRgb);

    expect(contrast).toBeGreaterThanOrEqual(3);
  });

  test('hint text color is #999 or lighter', async ({ page }) => {
    const hint = page.locator('.hint');
    const hintColor = await hint.evaluate(el => getComputedStyle(el).color);

    const hintRgb = parseColor(hintColor);

    const luminance = relativeLuminance(hintRgb);

    expect(luminance).toBeGreaterThanOrEqual(0.14);
  });

  test('score labels have sufficient contrast against dark background', async ({ page }) => {
    const scoreLabel = page.locator('.score-label').first();
    const labelColor = await scoreLabel.evaluate(el => getComputedStyle(el).color);
    const bgColor = await page.locator('body').evaluate(el => getComputedStyle(el).background);

    const labelRgb = parseColor(labelColor);
    const bgRgb = parseColor(bgColor);

    const contrast = getContrastRatio(labelRgb, bgRgb);

    expect(contrast).toBeGreaterThanOrEqual(3);
  });
});

function parseColor(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) throw new Error(`Failed to parse color: ${colorStr}`);
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
  };
}

function relativeLuminance(rgb) {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
