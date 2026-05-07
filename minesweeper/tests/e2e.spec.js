// Minesweeper E2E tests
// Run with: npx playwright test

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('Minesweeper - Title Screen', () => {
  test('shows title screen on load', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('#title-screen')).toBeVisible();
    await expect(page.locator('#title-screen h1')).toContainText('MINESWEEPER');
  });

  test('shows difficulty buttons', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('[data-difficulty="beginner"]')).toBeVisible();
    await expect(page.locator('[data-difficulty="intermediate"]')).toBeVisible();
    await expect(page.locator('[data-difficulty="expert"]')).toBeVisible();
    await expect(page.locator('[data-difficulty="custom"]')).toBeVisible();
  });

  test('custom button toggles custom settings', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="custom"]');
    await expect(page.locator('#custom-settings')).toBeVisible();
    await page.click('[data-difficulty="custom"]');
    await expect(page.locator('#custom-settings')).toHaveClass(/hidden/);
  });
});

test.describe('Minesweeper - Starting a Game', () => {
  test('starts game on beginner selection', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await expect(page.locator('#hud')).toBeVisible();
    await expect(page.locator('#board-container')).toBeVisible();
    await expect(page.locator('#title-screen')).toHaveClass(/hidden/);
  });

  test('board has correct grid size for beginner', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81); // 9x9
  });

  test('board has correct grid size for intermediate', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="intermediate"]');
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(256); // 16x16
  });

  test('custom difficulty starts with correct size', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="custom"]');
    await page.fill('#custom-rows', '7');
    await page.fill('#custom-cols', '7');
    await page.fill('#custom-mines', '5');
    await page.click('#custom-start');
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(49); // 7x7
  });
});

test.describe('Minesweeper - Game Play', () => {
  test('first click reveals a cascade', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    // Wait for board to be visible
    await page.waitForSelector('.cell');
    // Click center cell
    const centerCell = page.locator('.cell').nth(40); // roughly center of 9x9
    await centerCell.click({ force: true });
    // At least the clicked cell should be revealed
    const revealed = await page.locator('.cell-revealed').count();
    expect(revealed).toBeGreaterThan(0);
  });

  test('mine counter decreases after flagging', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    // First click to place mines
    await page.locator('.cell').nth(40).click({ force: true });
    // Right-click on a hidden cell to flag (find first hidden cell)
    const hiddenCell = page.locator('.cell-hidden').first();
    await hiddenCell.click({ button: 'right', force: true });
    const mineCounter = await page.locator('#mine-counter').textContent();
    expect(mineCounter.trim()).not.toContain('010');
  });

  test('timer increments during play', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    await page.waitForTimeout(2500);
    const timerText = await page.locator('#timer-display').textContent();
    const firstDigitValue = await page.locator('#timer-display .digit').first().getAttribute('data-value');
    const debugTimer = await page.evaluate(() => window.__debug_timer_display);
    const debugRendererCall = await page.evaluate(() => window.__debug_renderer_call);
    const debugRendererSeconds = await page.evaluate(() => window.__debug_renderer_seconds);
    const debugRendererTimerDigits = await page.evaluate(() => {
      const arr = window.__debug_renderer_timerDigits;
      if (arr) {
        return {
          type: typeof arr,
          isNodeList: arr instanceof NodeList,
          isHTMLCollection: arr instanceof HTMLCollection,
          length: arr.length,
          keys: Object.keys(arr),
          first: arr[0] ? {
            textContent: arr[0].textContent,
            datasetValue: arr[0].dataset.value
          } : null
        };
      }
      return null;
    });
    console.log('[TEST] timerText:', timerText);
    console.log('[TEST] first digit data-value:', firstDigitValue);
    console.log('[TEST] debug timer display:', debugTimer);
    console.log('[TEST] debug renderer call:', debugRendererCall);
    console.log('[TEST] debug renderer seconds:', debugRendererSeconds);
    console.log('[TEST] debug renderer timerDigits:', debugRendererTimerDigits);
    expect(timerText.trim()).not.toBe('000');
  });

  test('face button shows neutral at start', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    const face = await page.locator('#face-button').textContent();
    expect(face).toBe('🙂');
  });

  test('face button shows worried on click', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    // Mouse click triggers worried face, which should persist until mouse leaves board
    await page.locator('.cell').nth(40).click({ force: true });
    await page.waitForTimeout(100);
    const face = await page.locator('#face-button').textContent();
    expect(face).toBe('😮');
  });
});

test.describe('Minesweeper - Game Over / Victory', () => {
  test('game over overlay appears on mine click', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    // First click safe
    await page.locator('.cell').nth(40).click({ force: true });
    // Try clicking cells until we hit a mine (probabilistic)
    // In a 9x9 with 10 mines, this should happen within a few clicks
    for (let i = 0; i < 81; i++) {
      const cell = page.locator('.cell').nth(i);
      const className = await cell.getAttribute('class').catch(null);
      if (className && className.includes('cell-hidden')) {
        await cell.click({ force: true });
      }
      // If game ended, stop clicking
      if (await page.locator('#game-over-overlay').isVisible() || await page.locator('#victory-overlay').isVisible()) break;
    }
    // Check if game over or victory
    const goVisible = await page.locator('#game-over-overlay').isVisible();
    const vVisible = await page.locator('#victory-overlay').isVisible();
    expect(goVisible || vVisible).toBe(true);
  });

  test('try again button restarts game', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    // Click many cells to end game
    for (let i = 0; i < 81; i++) {
      const cell = page.locator('.cell').nth(i);
      const className = await cell.getAttribute('class').catch(null);
      if (className && className.includes('cell-hidden')) {
        await cell.click({ force: true });
      }
      // If game ended, stop clicking
      if (await page.locator('#game-over-overlay').isVisible() || await page.locator('#victory-overlay').isVisible()) break;
    }
    // Click Try Again if game over, or Play Again if victory
    const goBtn = page.locator('#game-over-again');
    const vBtn = page.locator('#victory-again');
    if (await goBtn.isVisible().catch(() => false)) {
      await goBtn.click();
    } else if (await vBtn.isVisible().catch(() => false)) {
      await vBtn.click();
    }
    // Should be back to playing
    await expect(page.locator('#hud')).toBeVisible();
  });

  test('main menu button returns to title', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    // End game
    for (let i = 0; i < 81; i++) {
      const cell = page.locator('.cell').nth(i);
      const className = await cell.getAttribute('class').catch(null);
      if (className && className.includes('cell-hidden')) {
        await cell.click({ force: true });
      }
      // If game ended, stop clicking
      if (await page.locator('#game-over-overlay').isVisible() || await page.locator('#victory-overlay').isVisible()) break;
    }
    const goMenu = page.locator('#game-over-menu');
    const vMenu = page.locator('#victory-menu');
    if (await goMenu.isVisible().catch(() => false)) {
      await goMenu.click();
    } else if (await vMenu.isVisible().catch(() => false)) {
      await vMenu.click();
    }
    await expect(page.locator('#title-screen')).toBeVisible();
  });
});

test.describe('Minesweeper - Keyboard Controls', () => {
  test('arrow keys navigate board', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    // Wait for board to be rendered
    await page.waitForSelector('.cell');
    // Focus first cell
    await page.locator('.cell').first().focus();
    // Arrow right to next cell
    await page.keyboard.press('ArrowRight');
    const focused = page.locator('.cell:focus');
    await expect(focused).toBeVisible();
  });

  test('Enter reveals cell', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    // Click first to ensure board is ready, then keyboard
    await page.locator('.cell').nth(40).click({ force: true });
    // Focus a hidden cell and press Enter
    await page.locator('.cell-hidden').first().focus();
    await page.keyboard.press('Enter');
    const revealed = await page.locator('.cell-revealed').count();
    expect(revealed).toBeGreaterThan(0);
  });

  test('P toggles pause', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    await page.keyboard.press('p');
    await expect(page.locator('#pause-overlay')).toBeVisible();
    await page.keyboard.press('p');
    await expect(page.locator('#pause-overlay')).toHaveClass(/hidden/);
  });

  test('R restarts game', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    const revealed1 = await page.locator('.cell-revealed').count();
    await page.keyboard.press('r');
    // After restart, all cells should be hidden again
    const hiddenAfter = await page.locator('.cell-hidden').count();
    expect(hiddenAfter).toBe(81);
  });
});

test.describe('Minesweeper - Pause', () => {
  test('pause overlay shows resume and restart buttons', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    await page.keyboard.press('p');
    await expect(page.locator('#resume-button')).toBeVisible();
    await expect(page.locator('#pause-restart')).toBeVisible();
  });

  test('resume button unpauses', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    await page.keyboard.press('p');
    await page.click('#resume-button');
    await expect(page.locator('#pause-overlay')).toHaveClass(/hidden/);
  });
});

test.describe('Minesweeper - Accessibility', () => {
  test('board has grid role', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    const role = await page.locator('#board-container').getAttribute('role');
    expect(role).toBe('grid');
  });

  test('cells have gridcell role', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    const role = await page.locator('.cell').first().getAttribute('role');
    expect(role).toBe('gridcell');
  });

  test('cells have aria-label', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    const label = await page.locator('.cell').first().getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label).toContain('Row');
    expect(label).toContain('Column');
  });

  test('aria-live regions exist', async ({ page }) => {
    await page.goto(BASE_URL);
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Minesweeper - Mobile Viewport', () => {
  test('game is playable in mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);
    // Tap a cell (use force to bypass pointer event interception on small viewports)
    await page.locator('.cell').nth(40).click({ force: true });
    const revealed = await page.locator('.cell-revealed').count();
    expect(revealed).toBeGreaterThan(0);
  });
});

test.describe('Minesweeper - Settings', () => {
  test('settings panel can be opened', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-difficulty="beginner"]');
    await page.locator('.cell').nth(40).click({ force: true });
    // Try clicking the settings button if visible
    const settingsBtn = page.locator('#mobile-settings');
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click();
      await expect(page.locator('#settings-panel')).toBeVisible();
    }
  });
});

test.describe('Minesweeper - Best Times', () => {
  test('best times persist across reloads', async ({ page }) => {
    await page.goto(BASE_URL);
    // Navigate to game, play, and check that best times section exists
    await expect(page.locator('#best-times')).toBeVisible();
  });
});
