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

test.describe('Tic Tac Toe - Basic Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('displays an empty 3x3 board', async ({ page }) => {
    const cells = page.locator('.cell');
    await expect(cells).toHaveCount(9);
    for (let i = 0; i < 9; i++) {
      await expect(cells.nth(i)).toHaveText('');
    }
  });

  test('shows X turn initially', async ({ page }) => {
    await expect(page.locator('#status')).toHaveText("X's turn");
  });

  test('X can place a mark by clicking a cell', async ({ page }) => {
    await page.click('.cell:nth-child(1)');
    await expect(page.locator('.cell:nth-child(1)')).toHaveText('X');
  });

  test('turns alternate between X and O', async ({ page }) => {
    await page.click('.cell:nth-child(1)');
    await expect(page.locator('#status')).toHaveText("O's turn");
    await page.click('.cell:nth-child(2)');
    await expect(page.locator('#status')).toHaveText("X's turn");
  });

  test('detects horizontal win for X', async ({ page }) => {
    const cells = page.locator('.cell');
    for (let i = 0; i < 3; i++) {
      await cells.nth(i).click();
      await cells.nth(i + 3).click();
    }
    await cells.nth(0).click();
    await cells.nth(3).click();
    await cells.nth(6).click();
    await expect(page.locator('#status')).toHaveText('X wins!');
  });

  test('winning cells are highlighted', async ({ page }) => {
    const cells = page.locator('.cell');
    for (let i = 0; i < 3; i++) {
      await cells.nth(i).click();
      await cells.nth(i + 3).click();
    }
    await cells.nth(0).click();
    await cells.nth(3).click();
    await cells.nth(6).click();
    await expect(cells.nth(0)).toHaveClass(/winner-cell/);
    await expect(cells.nth(1)).toHaveClass(/winner-cell/);
    await expect(cells.nth(2)).toHaveClass(/winner-cell/);
  });

  test('cannot place a mark on an occupied cell', async ({ page }) => {
    const cell = page.locator('.cell:nth-child(1)');
    await cell.click();
    await expect(cell).toHaveText('X');
    await cell.click();
    await expect(cell).toHaveText('X');
    await expect(page.locator('#status')).not.toHaveText('O wins!');
  });

  test('cannot play after game is over', async ({ page }) => {
    const cells = page.locator('.cell');
    for (let i = 0; i < 3; i++) {
      await cells.nth(i).click();
      await cells.nth(i + 3).click();
    }
    await cells.nth(0).click();
    await cells.nth(3).click();
    await cells.nth(6).click();
    await expect(page.locator('#status')).toHaveText('X wins!');
    await cells.nth(7).click();
    await expect(cells.nth(7)).toHaveText('');
  });

  test('detects a draw', async ({ page }) => {
    const cells = page.locator('.cell');
    const sequence = [0, 2, 1, 3, 5, 4, 6, 7, 8];
    for (const i of sequence) {
      await cells.nth(i).click();
    }
    await expect(page.locator('#status')).toContainText('draw');
  });
});

test.describe('Tic Tac Toe - New Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('New Game button resets the board', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(0).click();
    await cells.nth(1).click();
    await page.click('#btn-new-game');
    for (let i = 0; i < 9; i++) {
      await expect(cells.nth(i)).toHaveText('');
    }
    await expect(page.locator('#status')).toHaveText("X's turn");
  });
});

test.describe('Tic Tac Toe - Scoreboard', () => {
  test('scoreboard starts at zero', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
    await expect(page.locator('#score-x')).toHaveText('0');
    await expect(page.locator('#score-o')).toHaveText('0');
    await expect(page.locator('#score-draw')).toHaveText('0');
  });

  test('scoreboard updates after a win', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
    const cells = page.locator('.cell');

    for (let i = 0; i < 3; i++) {
      await cells.nth(i + 3).click();
      await cells.nth(i + 6).click();
    }
    await cells.nth(0).click();
    await cells.nth(3).click();
    await cells.nth(6).click();

    await expect(page.locator('#score-x')).toHaveText('1');
  });
});

test.describe('Tic Tac Toe - AI Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
    await page.click('#btn-ai');
    await expect(page.locator('#btn-ai')).toHaveClass(/active/);
  });

  test('AI responds after human move', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(0).click();
    await expect(cells.nth(0)).toHaveText('X');

    await page.waitForTimeout(AI_DELAY + 200);
    const oCount = await page.locator('.cell.o').count();
    expect(oCount).toBeGreaterThanOrEqual(1);
  });

  test('AI mode is indicated in UI', async ({ page }) => {
    await expect(page.locator('#btn-ai')).toHaveClass(/active/);
    await expect(page.locator('#btn-pvp')).not.toHaveClass(/active/);
  });
});

test.describe('Tic Tac Toe - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('Enter key places a mark on focused cell', async ({ page }) => {
    await page.locator('.cell:nth-child(1)').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.cell:nth-child(1)')).toHaveText('X');
  });

  test('Arrow keys move focus between cells', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(4).focus();
    await page.keyboard.press('ArrowDown');
    await expect(cells.nth(7)).toBeFocused();
  });

  test('N key starts new game', async ({ page }) => {
    const cells = page.locator('.cell');
    await cells.nth(0).click();
    await page.keyboard.press('N');
    await expect(cells.nth(0)).toHaveText('');
  });

  test('M key toggles mode', async ({ page }) => {
    await expect(page.locator('#btn-pvp')).toHaveClass(/active/);
    await page.keyboard.press('M');
    await expect(page.locator('#btn-ai')).toHaveClass(/active/);
  });
});

test.describe('Tic Tac Toe - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');
  });

  test('cells have aria-labels', async ({ page }) => {
    const label = await page.locator('.cell:nth-child(1)').getAttribute('aria-label');
    await expect(label).toContain('Row 1');
    await expect(label).toContain('Column 1');
  });

  test('status has role=status and aria-live', async ({ page }) => {
    await expect(page.locator('#status')).toHaveAttribute('role', 'status');
    await expect(page.locator('#status')).toHaveAttribute('aria-live', 'polite');
  });

  test('cells are keyboard focusable', async ({ page }) => {
    const cells = await page.locator('.cell').all();
    for (const cell of cells) {
      await expect(cell).toHaveAttribute('tabindex', '0');
    }
  });
});

test.describe('Tic Tac Toe - Responsive', () => {
  test('board is usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector('.cell');

    const cells = page.locator('.cell');
    await expect(cells).toHaveCount(9);

    await cells.nth(4).click();
    await expect(cells.nth(4)).toHaveText('X');
  });
});

const AI_DELAY = 300;
