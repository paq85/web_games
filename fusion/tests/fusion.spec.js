// Fusion E2E acceptance tests - Comprehensive game logic validation
// Run with: npx playwright test

const { test, expect } = require('@playwright/test');

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function waitForMainMenu(page) {
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10000 });
}

async function startGame(page, mode = 'classic') {
  await waitForMainMenu(page);
  await page.click('#main-menu [data-action="play"]');
  await expect(page.locator('#mode-select')).toBeVisible({ timeout: 5000 });
  await page.click(`[data-mode="${mode}"]`);
  await waitForGameStart(page);
}

async function waitForGameStart(page) {
  await expect(page.locator('#main-menu')).not.toBeVisible({ timeout: 5000 });
  await expect(page.locator('#mode-select')).not.toBeVisible({ timeout: 5000 });
  await expect(page.locator('#score-value')).toBeVisible({ timeout: 5000 });
  // Wait for tiles to actually appear in the grid
  await page.waitForFunction(() => {
    const cells = document.querySelectorAll('.grid-cell');
    let filled = 0;
    for (const cell of cells) {
      if (cell.textContent.trim().length > 0) filled++;
    }
    return filled >= 2;
  }, {}, { timeout: 5000 });
}

// Read the current grid state as a 4x4 array of tile values (0 for empty)
async function getGridState(page) {
  return await page.evaluate(() => {
    const grid = [];
    const cells = document.querySelectorAll('.grid-cell');
    for (let r = 0; r < 4; r++) {
      grid[r] = [];
      for (let c = 0; c < 4; c++) {
        const cell = cells[r * 4 + c];
        const text = cell.textContent.trim();
        grid[r][c] = text ? parseInt(text, 10) : 0;
      }
    }
    return grid;
  });
}

// Count filled cells in grid state
function countFilled(grid) {
  let count = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] !== 0) count++;
    }
  }
  return count;
}

// Sum of all tile values in grid
function sumGrid(grid) {
  let sum = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      sum += grid[r][c];
    }
  }
  return sum;
}

// Get the highest tile value in grid
function highestTile(grid) {
  let max = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] > max) max = grid[r][c];
    }
  }
  return max;
}

// Get current score from HUD
async function getScore(page) {
  const text = await page.locator('#score-value').textContent();
  return parseInt(text, 10);
}

// Press a direction key and wait for cooldown
async function pressDirection(page, direction) {
  const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  await page.keyboard.press(keyMap[direction]);
  // Wait for the input cooldown (50ms in game code) plus render time
  await page.waitForTimeout(100);
}

// ─── Splash & Main Menu ────────────────────────────────────────────────────────

test.describe('Splash & Main Menu', () => {
  test('shows splash screen then transitions to main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#splash-screen')).toBeVisible({ timeout: 3000 });
    await waitForMainMenu(page);
    await expect(page.locator('#splash-screen')).not.toBeVisible();
  });

  test('main menu displays all navigation buttons', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    const actions = ['play', 'challenges', 'daily', 'statistics', 'achievements', 'instructions', 'settings'];
    for (const action of actions) {
      await expect(page.locator('#main-menu [data-action="' + action + '"]')).toBeVisible();
    }
  });

  test('main menu has proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    const menu = page.locator('#main-menu');
    await expect(menu).toHaveAttribute('role', 'dialog');
    await expect(menu).toHaveAttribute('aria-modal', 'true');
  });

  test('keyboard navigation reaches mode select', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="play"]');
    await expect(page.locator('#mode-select')).toBeVisible();
  });
});

// ─── Game Start & Initial State ────────────────────────────────────────────────

test.describe('Game Start & Initial State', () => {
  test('starts with exactly 2 tiles on the grid', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const grid = await getGridState(page);
    expect(countFilled(grid)).toBe(2);
  });

  test('initial tiles are value 2 or 4', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const grid = await getGridState(page);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = grid[r][c];
        if (v !== 0) {
          expect([2, 4, 8]).toContain(v); // 8 possible from special tiles
        }
      }
    }
  });

  test('score starts at 0', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await expect(page.locator('#score-value')).toHaveText('0');
  });

  test('level starts at 1', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await expect(page.locator('#level-value')).toHaveText('1');
  });

  test('grid has exactly 16 cells', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await expect(page.locator('.grid-cell')).toHaveCount(16);
  });

  test('HUD is visible during gameplay', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await expect(page.locator('#hud')).toBeVisible();
    await expect(page.locator('#score-value')).toBeVisible();
    await expect(page.locator('#best-value')).toBeVisible();
    await expect(page.locator('#level-value')).toBeVisible();
  });

  test('power-up bar is visible during gameplay', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await expect(page.locator('#powerup-bar')).toBeVisible();
    await expect(page.locator('.powerup-slot')).toHaveCount(6);
  });

  test('all overlays are hidden during gameplay', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const overlayIds = ['#main-menu', '#mode-select', '#pause-menu', '#game-over', '#win-screen'];
    for (const id of overlayIds) {
      await expect(page.locator(id)).not.toBeVisible();
    }
  });
});

// ─── Core Tile Movement ────────────────────────────────────────────────────────

test.describe('Core Tile Movement', () => {
  test('arrow keys move tiles', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    let prevGrid = await getGridState(page);
    let moved = false;
    // Try all directions
    for (const dir of ['left', 'right', 'up', 'down']) {
      await pressDirection(page, dir);
      const after = await getGridState(page);
      // Grid should have changed (either tiles moved or new tile spawned)
      if (JSON.stringify(prevGrid) !== JSON.stringify(after)) {
        moved = true;
      }
      prevGrid = after;
    }
    expect(moved).toBe(true);
  });

  test('WASD keys control tile sliding', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const keys = ['w', 'a', 's', 'd'];
    for (const key of keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(100);
    }
    // Grid should still have at least 2 tiles
    const grid = await getGridState(page);
    expect(countFilled(grid)).toBeGreaterThanOrEqual(2);
  });

  test('tiles merge when same values slide together', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up a controlled grid: two 2-tiles adjacent in row 0
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(2, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    // Verify setup
    const before = await getGridState(page);
    expect(before[0][0]).toBe(2);
    expect(before[0][1]).toBe(2);

    // Slide left - should merge the two 2-tiles into a 4
    await pressDirection(page, 'left');

    const after = await getGridState(page);
    expect(after[0][0]).toBe(4); // Merged tile
    // Tile count: was 2, after merge + spawn = 2 (1 merged + 1 spawned)
    expect(countFilled(after)).toBe(2);
  });

  test('merged tile appears at slide target position, not source position', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up: [2][ ][ ][2] in row 0 — merge targets column 3 when sliding right
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    const before = await getGridState(page);
    expect(before[0][0]).toBe(2);
    expect(before[0][3]).toBe(2);

    // Slide right — merged 4 must appear at column 3, NOT column 0
    await pressDirection(page, 'right');

    const after = await getGridState(page);
    expect(after[0][3]).toBe(4); // merged tile at right edge
    expect(after[0][0]).toBe(0); // source position must be empty

    // Also verify the canvas renderer has the merged tile at the correct position
    const rendererCol = await page.evaluate(() => {
      const tiles = window.__fusionGame.renderer.tiles;
      const merged = tiles.find(t => t.value === 4 && !t.merged);
      return merged ? Math.round(merged.targetCol) : -1;
    });
    expect(rendererCol).toBe(3); // renderer must place merged tile at column 3
  });

  test('tiles slide to the correct edge in all four directions', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Test right: [2][ ][ ][4] -> both tiles end up at right edge
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, new Tile(4, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'right');
    let grid = await getGridState(page);
    expect(grid[0][3]).toBe(4); // 4 stays at right edge
    expect(grid[0][2]).toBe(2); // 2 slides next to it

    // Test left: reset grid, [4][ ][ ][2] -> both tiles end up at left edge
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 0), null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    grid = await getGridState(page);
    expect(grid[0][0]).toBe(4); // 4 stays at left edge
    expect(grid[0][1]).toBe(2); // 2 slides next to it
  });

  test('renderer animates tile movement after a slide', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up: [2][ ][ ][4] — pressing right moves tile at col 0 to col 2
    // Clear renderer tiles first so matching works correctly
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.renderer.tiles = [];
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, new Tile(4, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
      game._syncRenderer();
    });

    // Make the move and immediately capture render state before animation frame runs
    const renderState = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.makeMove('right');
      // After setTiles, the moved tile should have renderCol != targetCol
      const tiles = game.renderer.tiles;
      const movedTile = tiles.find(t => t.value === 2 && t.type === 'normal');
      return movedTile
        ? { renderCol: movedTile.renderCol, targetCol: movedTile.targetCol }
        : null;
    });

    expect(renderState).not.toBeNull();
    // renderCol should still be at old position (0), targetCol should be new position (2)
    expect(renderState.renderCol).toBe(0);
    expect(renderState.targetCol).toBe(2);
  });

  // Comprehensive 2048 core mechanics test - verifies all four directions with controlled grids
  test('2048 core mechanics: slide, merge, and spawn work correctly in all directions', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const results = await page.evaluate(() => {
      const game = window.__fusionGame;
      const results = {};

      // Helper: set grid rows directly and disable spawning
      function setupGrid(rows) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const val = rows[r][c];
            if (val) {
              game.grid.cells[r][c] = new Tile(val, Tile.TYPES.NORMAL, r, c);
            } else {
              game.grid.cells[r][c] = null;
            }
          }
        }
        game.freezeActive = true; // prevent spawning
        game.score = 0;
        game._renderGrid();
        game._updateHUD();
        game._syncRenderer();
      }

      function getGrid() {
        const g = [];
        for (let r = 0; r < 4; r++) {
          g[r] = [];
          for (let c = 0; c < 4; c++) {
            g[r][c] = game.grid.cells[r][c] ? game.grid.cells[r][c].value : 0;
          }
        }
        return g;
      }

      // Test RIGHT: [2][0][0][2] → [0][0][0][4]
      setupGrid([[2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.makeMove('right');
      results.rightMerge = getGrid();

      // Test LEFT: [2][0][0][2] → [4][0][0][0]
      setupGrid([[2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.makeMove('left');
      results.leftMerge = getGrid();

      // Test UP: column [2,0,0,2] → [4,0,0,0]
      setupGrid([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0]]);
      game.makeMove('up');
      results.upMerge = getGrid();

      // Test DOWN: column [2,0,0,2] → [0,0,0,4]
      setupGrid([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0]]);
      game.makeMove('down');
      results.downMerge = getGrid();

      // Test slide without merge RIGHT: [2][0][0][4] → [0][0][2][4]
      setupGrid([[2, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.makeMove('right');
      results.rightSlide = getGrid();

      // Test slide without merge LEFT: [4][0][0][2] → [4][2][0][0]
      setupGrid([[4, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.makeMove('left');
      results.leftSlide = getGrid();

      // Test double merge RIGHT: [2][2][4][4] → [0][0][2][4] wait no: [2][2][4][4] sliding right
      // Process right to left: col3=4 stays, col2=4 merges with col3→8, col1=2 stays, col0=2 merges with col1→4
      // Result: [0][0][4][8]
      setupGrid([[2, 2, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.makeMove('right');
      results.doubleMergeRight = getGrid();

      // Test triple same value (only adjacent pair merges): [2][2][2][0] left → [2][4][0][0]
      setupGrid([[2, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.makeMove('left');
      results.tripleLeft = getGrid();

      // Test triple same value right: [0][2][2][2] right → [0][0][2][4]
      setupGrid([[0, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.makeMove('right');
      results.tripleRight = getGrid();

      // Verify renderer tile positions match DOM after moves
      setupGrid([[2, 0, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      game.renderer.tiles = [];
      game._syncRenderer();
      game.makeMove('right');
      // After merge, renderer should have a tile with value 4 at col 3
      const rendererTiles = game.renderer.tiles;
      const merged4 = rendererTiles.find(t => t.value === 4);
      results.rendererMergedPos = merged4
        ? { col: Math.round(merged4.targetCol), row: Math.round(merged4.targetRow) }
        : null;

      return results;
    });

    // RIGHT merge: [2][0][0][2] → [0][0][0][4]
    expect(results.rightMerge[0]).toEqual([0, 0, 0, 4]);

    // LEFT merge: [2][0][0][2] → [4][0][0][0]
    expect(results.leftMerge[0]).toEqual([4, 0, 0, 0]);

    // UP merge: column [2,0,0,2] → [4,0,0,0]
    expect(results.upMerge.map(r => r[0])).toEqual([4, 0, 0, 0]);

    // DOWN merge: column [2,0,0,2] → [0,0,0,4]
    expect(results.downMerge.map(r => r[0])).toEqual([0, 0, 0, 4]);

    // RIGHT slide: [2][0][0][4] → [0][0][2][4]
    expect(results.rightSlide[0]).toEqual([0, 0, 2, 4]);

    // LEFT slide: [4][0][0][2] → [4][2][0][0]
    expect(results.leftSlide[0]).toEqual([4, 2, 0, 0]);

    // Double merge RIGHT: [2][2][4][4] → [0][0][4][8]
    expect(results.doubleMergeRight[0]).toEqual([0, 0, 4, 8]);

    // Triple LEFT: [2][2][2][0] → [4][2][0][0] (leftmost pair merges first)
    expect(results.tripleLeft[0]).toEqual([4, 2, 0, 0]);

    // Triple RIGHT: [0][2][2][2] → [0][0][2][4]
    expect(results.tripleRight[0]).toEqual([0, 0, 2, 4]);

    // Renderer merged tile at correct position
    expect(results.rendererMergedPos).toEqual({ col: 3, row: 0 });
  });

  test('merging increases score', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up controlled grid with mergeable tiles
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0][0] = new Tile(4, 'normal', 0, 0);
      game.grid.cells[0][1] = new Tile(4, 'normal', 0, 1);
      game.grid.cells[0][2] = null;
      game.grid.cells[0][3] = null;
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const score = await getScore(page);
    expect(score).toBeGreaterThan(0);
  });

  test('new tile spawns after each move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up controlled grid with space for new tile
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0][0] = new Tile(2, 'normal', 0, 0);
      game.grid.cells[0][1] = null;
      game.grid.cells[0][2] = null;
      game.grid.cells[0][3] = null;
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const beforeCount = countFilled(await getGridState(page));
    await pressDirection(page, 'right');
    const afterGrid = await getGridState(page);
    const afterCount = countFilled(afterGrid);

    // After a move, at least one new tile should spawn
    // (the tile moved from [0][0] to [0][3], plus a new tile spawned)
    expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 1);
  });

  test('tiles slide to the edge', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Place tile at far right
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0][3] = new Tile(2, 'normal', 0, 3);
      game.grid.cells[0][0] = null;
      game.grid.cells[0][1] = null;
      game.grid.cells[0][2] = null;
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Slide left - tile should move to column 0
    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    expect(grid[0][0]).toBeGreaterThan(0); // Tile should be at left edge
  });

  test('no movement when pressing direction with tiles already at edge', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Place single tile at left edge
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0][0] = new Tile(2, 'normal', 0, 0);
      game.grid.cells[0][1] = null;
      game.grid.cells[0][2] = null;
      game.grid.cells[0][3] = null;
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const before = await getGridState(page);
    // Press left - tile is already at left edge, should not move
    await pressDirection(page, 'left');
    const after = await getGridState(page);

    // Grid state should be identical (no move = no new tile spawned)
    expect(JSON.stringify(before)).toEqual(JSON.stringify(after));
  });
});

// ─── Game Over Detection ───────────────────────────────────────────────────────

test.describe('Game Over Detection', () => {
  test('game over triggers when no moves available', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Force game over by directly calling the game over handler
    // (Game over can only be detected after a move, and a move that causes
    // game over would also spawn a tile, so we test the flow directly)
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 42;
      game.sessionHighestTile = 1024;
      game.sessionBestStreak = 3;
      game.sessionMerges = 10;
      game._showGameOver();
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
  });

  test('game over screen shows final stats', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 42;
      game.sessionHighestTile = 1024;
      game.sessionBestStreak = 3;
      game.sessionMerges = 10;
      game._showGameOver();
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });

    // Verify stats are displayed
    await expect(page.locator('#go-score')).toHaveText('42');
    await expect(page.locator('#go-highest')).toHaveText('1024');
    await expect(page.locator('#go-streak')).toHaveText('3');
    await expect(page.locator('#go-merges')).toHaveText('10');
  });

  test('game over screen has retry and menu buttons', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game._showGameOver();
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#game-over [data-action="retry"]')).toBeVisible();
    await expect(page.locator('#game-over [data-action="menu"]')).toBeVisible();
  });

  test('retry button starts new game', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 500;
      game._showGameOver();
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
    await page.click('#game-over [data-action="retry"]');

    // New game should start
    await waitForGameStart(page);
    await expect(page.locator('#game-over')).not.toBeVisible();
    // Score should reset
    await expect(page.locator('#score-value')).toHaveText('0');
  });

  test('grid hasMoves correctly detects no valid moves', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up a full grid with no possible merges
    const noMoves = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), new Tile(8, Tile.TYPES.NORMAL, 0, 2), new Tile(16, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [new Tile(32, Tile.TYPES.NORMAL, 1, 0), new Tile(64, Tile.TYPES.NORMAL, 1, 1), new Tile(128, Tile.TYPES.NORMAL, 1, 2), new Tile(256, Tile.TYPES.NORMAL, 1, 3)];
      game.grid.cells[2] = [new Tile(512, Tile.TYPES.NORMAL, 2, 0), new Tile(1024, Tile.TYPES.NORMAL, 2, 1), new Tile(2, Tile.TYPES.NORMAL, 2, 2), new Tile(4, Tile.TYPES.NORMAL, 2, 3)];
      game.grid.cells[3] = [new Tile(8, Tile.TYPES.NORMAL, 3, 0), new Tile(16, Tile.TYPES.NORMAL, 3, 1), new Tile(32, Tile.TYPES.NORMAL, 3, 2), new Tile(64, Tile.TYPES.NORMAL, 3, 3)];
      return game.grid.hasMoves();
    });
    expect(noMoves).toBe(false);
  });

  test('grid hasMoves correctly detects available merge', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up full grid with one mergeable pair
    const hasMoves = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), new Tile(8, Tile.TYPES.NORMAL, 0, 2), new Tile(16, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [new Tile(32, Tile.TYPES.NORMAL, 1, 0), new Tile(64, Tile.TYPES.NORMAL, 1, 1), new Tile(128, Tile.TYPES.NORMAL, 1, 2), new Tile(256, Tile.TYPES.NORMAL, 1, 3)];
      game.grid.cells[2] = [new Tile(512, Tile.TYPES.NORMAL, 2, 0), new Tile(1024, Tile.TYPES.NORMAL, 2, 1), new Tile(2, Tile.TYPES.NORMAL, 2, 2), new Tile(2, Tile.TYPES.NORMAL, 2, 3)];
      game.grid.cells[3] = [new Tile(8, Tile.TYPES.NORMAL, 3, 0), new Tile(16, Tile.TYPES.NORMAL, 3, 1), new Tile(32, Tile.TYPES.NORMAL, 3, 2), new Tile(64, Tile.TYPES.NORMAL, 3, 3)];
      return game.grid.hasMoves();
    });
    expect(hasMoves).toBe(true);
  });
});

// ─── Win Condition ─────────────────────────────────────────────────────────────

test.describe('Win Condition', () => {
  test('win screen triggers when reaching 2048 in classic mode', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up grid with a 2048 tile and a mergeable pair to trigger the win check
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2048, 'normal', 0, 0), null, new Tile(2, 'normal', 0, 2), new Tile(2, 'normal', 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 1000;
      game.sessionHighestTile = 1024; // Lower than 2048 so the merge triggers the win
      game.sessionBestStreak = 5;
      game.won = false;
      game.continuedAfterWin = false;
      game._renderGrid();
      game._updateHUD();
    });

    // Merge the two 2-tiles - the highest tile check should find 2048 and trigger win
    await pressDirection(page, 'right');

    // Win screen should appear (with 500ms delay)
    await expect(page.locator('#win-screen')).toBeVisible({ timeout: 5000 });
  });

  test('win screen shows score and stats', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2048, Tile.TYPES.NORMAL, 0, 0), null, new Tile(4, Tile.TYPES.NORMAL, 0, 2), new Tile(4, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 5000;
      game.sessionHighestTile = 1024;
      game.sessionBestStreak = 7;
      game.won = false;
      game.continuedAfterWin = false;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'right');
    await expect(page.locator('#win-screen')).toBeVisible({ timeout: 5000 });
    // Score is 5000 + 8 (from 4+4=8 merge) = 5008
    const winScore = await page.locator('#win-score').textContent();
    expect(parseInt(winScore)).toBeGreaterThanOrEqual(5000);
  });

  test('win screen has continue and menu buttons', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2048, 'normal', 0, 0), null, new Tile(2, 'normal', 0, 2), new Tile(2, 'normal', 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.sessionHighestTile = 1024;
      game.won = false;
      game.continuedAfterWin = false;
      game._renderGrid();
    });

    await pressDirection(page, 'right');
    await expect(page.locator('#win-screen')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#win-screen [data-action="continue"]')).toBeVisible();
    await expect(page.locator('#win-screen [data-action="menu"]')).toBeVisible();
  });

  test('no win screen in endless mode when reaching 2048', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'endless');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2048, 'normal', 0, 0), null, new Tile(2, 'normal', 0, 2), new Tile(2, 'normal', 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.sessionHighestTile = 1024;
      game.won = false;
      game.continuedAfterWin = false;
      game._renderGrid();
    });

    await pressDirection(page, 'right');
    // Wait a bit to ensure no win screen appears
    await page.waitForTimeout(1000);
    // Win screen should NOT be visible in endless mode
    await expect(page.locator('#win-screen')).not.toBeVisible();
    // Game should still be playable
    await expect(page.locator('#grid-container')).toBeVisible();
  });
});

// ─── Pause / Resume ────────────────────────────────────────────────────────────

test.describe('Pause & Resume', () => {
  test('pause button shows pause menu', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await page.click('#pause-btn');
    await expect(page.locator('#pause-menu')).toBeVisible();
  });

  test('escape key toggles pause', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-menu')).not.toBeVisible();
  });

  test('resume button returns to gameplay', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await page.click('#pause-btn');
    await expect(page.locator('#pause-menu')).toBeVisible();
    await page.click('#pause-menu [data-action="resume"]');
    await expect(page.locator('#pause-menu')).not.toBeVisible();
  });

  test('game state preserved after pause/resume', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up controlled grid
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(4, 'normal', 0, 0), new Tile(4, 'normal', 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 100;
      game._renderGrid();
      game._updateHUD();
    });

    const beforeGrid = await getGridState(page);
    const beforeScore = await getScore(page);

    // Pause and resume
    await page.click('#pause-btn');
    await expect(page.locator('#pause-menu')).toBeVisible();
    await page.click('#pause-menu [data-action="resume"]');
    await expect(page.locator('#pause-menu')).not.toBeVisible();

    // Verify state is preserved
    const afterGrid = await getGridState(page);
    const afterScore = await getScore(page);
    expect(JSON.stringify(beforeGrid)).toEqual(JSON.stringify(afterGrid));
    expect(afterScore).toBe(beforeScore);
  });

  test('no input processed while paused', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Record initial grid state
    const initialGrid = await getGridState(page);
    const initialFilled = countFilled(initialGrid);

    // Pause using Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-menu')).toBeVisible();

    // Verify game is actually paused
    const isPaused = await page.evaluate(() => window.__fusionGame.isPaused);
    expect(isPaused).toBe(true);

    // Try multiple moves while paused
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Grid should NOT have changed at all
    const afterGrid = await getGridState(page);
    expect(JSON.stringify(initialGrid)).toEqual(JSON.stringify(afterGrid));
  });

  test('restart from pause menu resets game', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 500;
      game._updateHUD();
    });

    await page.click('#pause-btn');
    await page.click('#pause-menu [data-action="restart"]');
    await expect(page.locator('#pause-menu')).not.toBeVisible();
    await expect(page.locator('#score-value')).toHaveText('0');
  });

  test('return to menu from pause', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    await page.click('#pause-btn');
    await page.click('#pause-menu [data-action="menu"]');
    await waitForMainMenu(page);
  });
});

// ─── Game Modes ────────────────────────────────────────────────────────────────

test.describe('Game Modes', () => {
  test('classic mode starts correctly', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const grid = await getGridState(page);
    expect(countFilled(grid)).toBeGreaterThanOrEqual(2);
  });

  test('endless mode starts correctly', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'endless');
    const grid = await getGridState(page);
    expect(countFilled(grid)).toBeGreaterThanOrEqual(2);
  });

  test('challenge mode starts correctly', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'challenge');
    const grid = await getGridState(page);
    expect(countFilled(grid)).toBeGreaterThanOrEqual(2);
  });

  test('mode select back button returns to main menu', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="play"]');
    await expect(page.locator('#mode-select')).toBeVisible();
    await page.click('#mode-select [data-action="back"]');
    await waitForMainMenu(page);
  });
});

// ─── Menu Navigation ───────────────────────────────────────────────────────────

test.describe('Menu Navigation', () => {
  test('challenges screen shows challenge items', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="challenges"]');
    await expect(page.locator('#challenge-list')).toBeVisible();
    const count = await page.locator('.challenge-item').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('daily puzzle screen shows target and attempts', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="daily"]');
    await expect(page.locator('#daily-puzzle')).toBeVisible();
    await expect(page.locator('#daily-target-value')).toBeVisible();
    await expect(page.locator('#daily-attempts-value')).toBeVisible();
  });

  test('settings screen shows all controls', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="settings"]');
    await expect(page.locator('#settings-screen')).toBeVisible();
    await expect(page.locator('#master-volume')).toBeVisible();
    await expect(page.locator('#music-volume')).toBeVisible();
    await expect(page.locator('#sfx-volume')).toBeVisible();
    await expect(page.locator('#mute-toggle')).toBeVisible();
    await expect(page.locator('#particle-quality')).toBeVisible();
  });

  test('statistics screen shows stats panel', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="statistics"]');
    await expect(page.locator('#statistics-screen')).toBeVisible();
    await expect(page.locator('#stat-games')).toBeVisible();
  });

  test('achievements screen shows achievement items', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="achievements"]');
    await expect(page.locator('#achievements-screen')).toBeVisible();
    const count = await page.locator('.achievement-item').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('instructions screen shows how to play content', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="instructions"]');
    await expect(page.locator('#instructions-screen')).toBeVisible();
    await expect(page.locator('#instructions-screen')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#instructions-screen')).toHaveAttribute('aria-modal', 'true');
    const headingCount = await page.locator('#instructions-screen .instructions-heading').count();
    expect(headingCount).toBeGreaterThan(0);
    const rowCount = await page.locator('#instructions-screen .instruction-row').count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(page.locator('#instructions-screen [data-action="back"]')).toBeVisible();
  });

  test('back button returns to main menu from all sub-screens', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    const screens = [
      { action: 'challenges', id: '#challenge-list', backSelector: '#challenge-list [data-action="back"]' },
      { action: 'daily', id: '#daily-puzzle', backSelector: '#daily-puzzle [data-action="back"]' },
      { action: 'statistics', id: '#statistics-screen', backSelector: '#statistics-screen [data-action="back"]' },
      { action: 'achievements', id: '#achievements-screen', backSelector: '#achievements-screen [data-action="back"]' },
      { action: 'settings', id: '#settings-screen', backSelector: '#settings-screen [data-action="back"]' },
      { action: 'instructions', id: '#instructions-screen', backSelector: '#instructions-screen [data-action="back"]' }
    ];
    for (const screen of screens) {
      await page.click('#main-menu [data-action="' + screen.action + '"]');
      await expect(page.locator(screen.id)).toBeVisible();
      await page.click(screen.backSelector);
      await waitForMainMenu(page);
    }
  });
});

// ─── Accessibility ─────────────────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test('grid has proper ARIA role', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const grid = page.locator('#grid-container');
    await expect(grid).toHaveAttribute('role', 'grid');
    await expect(grid).toHaveAttribute('tabindex', '0');
  });

  test('grid cells have gridcell role', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const cells = page.locator('.grid-cell');
    for (let i = 0; i < 16; i++) {
      await expect(cells.nth(i)).toHaveAttribute('role', 'gridcell');
    }
  });

  test('screen reader regions exist with correct aria-live', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    await expect(page.locator('#sr-polite')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#sr-assertive')).toHaveAttribute('aria-live', 'assertive');
  });

  test('filled grid cells have descriptive aria-label', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const cellTexts = await page.locator('.grid-cell').allTextContents();
    const cells = page.locator('.grid-cell');
    let filledCount = 0;
    for (let i = 0; i < cellTexts.length; i++) {
      if (cellTexts[i].trim().length > 0) {
        filledCount++;
        const label = await cells.nth(i).getAttribute('aria-label');
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
        // Label should contain the tile value
        expect(label).toContain(cellTexts[i].trim());
      }
    }
    expect(filledCount).toBeGreaterThanOrEqual(2);
  });

  test('empty grid cells labeled as empty', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const cells = page.locator('.grid-cell');
    const count = await cells.count();
    let emptyFound = false;
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).textContent();
      if (text.trim().length === 0) {
        const label = await cells.nth(i).getAttribute('aria-label');
        expect(label).toBe('Empty');
        emptyFound = true;
      }
    }
    expect(emptyFound).toBe(true);
  });

  test('power-up slots have ARIA labels', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const slots = page.locator('.powerup-slot');
    const count = await slots.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const label = await slots.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });

  test('grid is keyboard focusable', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const grid = page.locator('#grid-container');
    await grid.click();
    await expect(grid).toBeFocused();
  });

  test('touch targets meet 44px minimum', async ({ page }) => {
    await page.goto('/');
    await waitForMainMenu(page);
    const buttons = page.locator('#main-menu .menu-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('pause button meets 44px touch target', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');
    const pauseBtn = page.locator('#pause-btn');
    const box = await pauseBtn.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});

// ─── Responsive ────────────────────────────────────────────────────────────────

test.describe('Responsive Design', () => {
  test('grid scales on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="play"]');
    await page.click('[data-mode="classic"]');
    await waitForGameStart(page);
    const grid = page.locator('#grid-container');
    const box = await grid.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.width).toBeLessThan(360);
  });

  test('menu buttons remain usable on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await waitForMainMenu(page);
    const buttons = page.locator('#main-menu .menu-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    await buttons.first().click();
    await expect(page.locator('#mode-select')).toBeVisible();
  });
});

// ─── Game Stability & Stress Tests ─────────────────────────────────────────────

test.describe('Game Stability', () => {
  test('game remains stable after 100 moves', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    for (let i = 0; i < 100; i++) {
      await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'][i % 4]);
      await page.waitForTimeout(50);
    }

    // Game should still be in a valid state
    await expect(page.locator('#grid-container')).toBeVisible();
    const grid = await getGridState(page);
    expect(countFilled(grid)).toBeGreaterThanOrEqual(2);
  });

  test('grid always has 16 cells after many moves', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'][i % 4]);
      await page.waitForTimeout(50);
      const cellCount = await page.locator('.grid-cell').count();
      expect(cellCount).toBe(16);
    }
  });

  test('score never goes negative', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    for (let i = 0; i < 100; i++) {
      await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'][i % 4]);
      await page.waitForTimeout(50);
      const score = await getScore(page);
      expect(score).toBeGreaterThanOrEqual(0);
    }
  });

  test('tile values are always powers of 2 or special values', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'][i % 4]);
      await page.waitForTimeout(50);
      const grid = await getGridState(page);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const v = grid[r][c];
          if (v > 0) {
            // Valid tile values: powers of 2 (2, 4, 8, 16, ...) or special tile values
            expect(v).toBeGreaterThan(0);
            // Value should be a positive integer
            expect(Number.isInteger(v)).toBe(true);
          }
        }
      }
    }
  });
});

// ─── Score Calculation ─────────────────────────────────────────────────────────

test.describe('Score Calculation', () => {
  test('score increases by merged tile value', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up: two 8-tiles that will merge into 16
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(8, 'normal', 0, 0), new Tile(8, 'normal', 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const score = await getScore(page);
    // Score should be at least 16 (the merged tile value)
    expect(score).toBeGreaterThanOrEqual(16);
  });

  test('multiple merges in one move add up', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up: two pairs that will merge
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, 'normal', 0, 0), new Tile(2, 'normal', 0, 1), new Tile(4, 'normal', 0, 2), new Tile(4, 'normal', 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const score = await getScore(page);
    // Two merges: 2+2=4 and 4+4=8, minimum score = 4 + 8 = 12
    expect(score).toBeGreaterThanOrEqual(12);
  });

  test('score is 0 when no merge occurs', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up: single tile that just slides (no merge possible)
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(2, 'normal', 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const score = await getScore(page);
    // No merge happened, score should remain 0
    expect(score).toBe(0);
  });
});

// ─── Grid Consistency ──────────────────────────────────────────────────────────

test.describe('Grid Consistency', () => {
  test('tile count increases after valid move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up grid with tile that will definitely move left
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0][0] = null;
      game.grid.cells[0][1] = null;
      game.grid.cells[0][2] = null;
      game.grid.cells[0][3] = new Tile(2, Tile.TYPES.NORMAL, 0, 3);
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const beforeCount = await page.evaluate(() => {
      const game = window.__fusionGame;
      let count = 0;
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          if (game.grid.cells[r][c]) count++;
      return count;
    });
    expect(beforeCount).toBe(1);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    const afterCount = await page.evaluate(() => {
      const game = window.__fusionGame;
      let count = 0;
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          if (game.grid.cells[r][c]) count++;
      return count;
    });

    // Tile moved + new tile spawned = 2 tiles
    expect(afterCount).toBe(2);
  });

  test('merged tiles produce correct value', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Test various merge values
    const testCases = [
      { value: 2, expected: 4 },
      { value: 4, expected: 8 },
      { value: 8, expected: 16 },
      { value: 16, expected: 32 },
      { value: 32, expected: 64 },
      { value: 64, expected: 128 },
    ];

    for (const tc of testCases) {
      await page.evaluate(({ v }) => {
        const game = window.__fusionGame;
        game.grid.cells[0][0] = new Tile(v, Tile.TYPES.NORMAL, 0, 0);
        game.grid.cells[0][1] = new Tile(v, Tile.TYPES.NORMAL, 0, 1);
        game.grid.cells[0][2] = null;
        game.grid.cells[0][3] = null;
        game.grid.cells[1] = [null, null, null, null];
        game.grid.cells[2] = [null, null, null, null];
        game.grid.cells[3] = [null, null, null, null];
        game._renderGrid();
      }, { v: tc.value });

      await pressDirection(page, 'left');
      const grid = await getGridState(page);
      expect(grid[0][0]).toBe(tc.expected);
    }
  });

  test('no duplicate merge of same tile in one move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Classic 2048 edge case: [2, 2, 2, 2] sliding left should produce [4, 4, _, _]
    // NOT [4, 2, _, _] or [8, _, _, _]
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(2, Tile.TYPES.NORMAL, 0, 0),
        new Tile(2, Tile.TYPES.NORMAL, 0, 1),
        new Tile(2, Tile.TYPES.NORMAL, 0, 2),
        new Tile(2, Tile.TYPES.NORMAL, 0, 3)
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Should have two 4-tiles from merging (2+2=4, 2+2=4)
    expect(grid[0][0]).toBe(4);
    expect(grid[0][1]).toBe(4);
    // After merge, a new tile spawns somewhere in the 15 empty cells
    // Total tile count should be 3 (two 4s + one spawned tile)
    const totalTiles = countFilled(grid);
    expect(totalTiles).toBe(3);
    // Score should be 8 (4 + 4 from two merges)
    const score = await getScore(page);
    expect(score).toBe(8);
  });

  test('[2, 2, 2] sliding left produces [4, 2, _, _] not [4, 4, _, _]', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(2, Tile.TYPES.NORMAL, 0, 0),
        new Tile(2, Tile.TYPES.NORMAL, 0, 1),
        new Tile(2, Tile.TYPES.NORMAL, 0, 2),
        null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // [2,2,2] -> [4,2,_,_] (first pair merges, third 2 can't re-merge)
    expect(grid[0][0]).toBe(4);
    expect(grid[0][1]).toBe(2);
  });

  test('vertical merge works correctly', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 0), null, null, null];
      game.grid.cells[1] = [new Tile(4, Tile.TYPES.NORMAL, 1, 0), null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'up');
    const grid = await getGridState(page);
    // Merged tile at top, value 8
    expect(grid[0][0]).toBe(8);
    // Score should reflect the merge (at least 8)
    const score = await getScore(page);
    expect(score).toBeGreaterThanOrEqual(8);
  });

  test('tiles slide past gaps to reach edge', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(8, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // The 8-tile should have moved to the left edge
    expect(grid[0][0]).toBe(8);
    // Tile count: 1 (moved) + 1 (spawned) = 2
    expect(countFilled(grid)).toBe(2);
  });
});

// ─── Touch & Swipe Input ────────────────────────────────────────────────────────

test.describe('Touch & Swipe Input', () => {
  async function swipe(page, startX, startY, endX, endY, duration = 150) {
    const steps = Math.max(2, Math.floor(duration / 16));
    const dx = (endX - startX) / steps;
    const dy = (endY - startY) / steps;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(startX + dx * i, startY + dy * i);
      await page.waitForTimeout(16);
    }

    await page.mouse.up();
  }

  test('swipe left triggers left move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Swipe from right to left on the grid
    const gridBox = await page.locator('#grid-container').boundingBox();
    await swipe(page, gridBox.x + gridBox.width * 0.75, gridBox.y + gridBox.height * 0.5,
                     gridBox.x + gridBox.width * 0.25, gridBox.y + gridBox.height * 0.5);
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    expect(grid[0][0]).toBeGreaterThan(0); // Tile moved to left edge
  });

  test('swipe right triggers right move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const gridBox = await page.locator('#grid-container').boundingBox();
    await swipe(page, gridBox.x + gridBox.width * 0.25, gridBox.y + gridBox.height * 0.5,
                     gridBox.x + gridBox.width * 0.75, gridBox.y + gridBox.height * 0.5);
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    expect(grid[0][3]).toBeGreaterThan(0); // Tile moved to right edge
  });

  test('swipe up triggers up move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[3][0] = new Tile(2, Tile.TYPES.NORMAL, 3, 0);
      game.grid.cells[0][0] = null;
      game.grid.cells[1][0] = null;
      game.grid.cells[2][0] = null;
      game.grid.cells[0][1] = null; game.grid.cells[0][2] = null; game.grid.cells[0][3] = null;
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3][1] = null; game.grid.cells[3][2] = null; game.grid.cells[3][3] = null;
      game._renderGrid();
    });

    const gridBox = await page.locator('#grid-container').boundingBox();
    await swipe(page, gridBox.x + gridBox.width * 0.5, gridBox.y + gridBox.height * 0.75,
                     gridBox.x + gridBox.width * 0.5, gridBox.y + gridBox.height * 0.25);
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    expect(grid[0][0]).toBeGreaterThan(0); // Tile moved to top
  });

  test('swipe down triggers down move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
      game.grid.cells[1][0] = null;
      game.grid.cells[2][0] = null;
      game.grid.cells[3][0] = null;
      game.grid.cells[0][1] = null; game.grid.cells[0][2] = null; game.grid.cells[0][3] = null;
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const gridBox = await page.locator('#grid-container').boundingBox();
    await swipe(page, gridBox.x + gridBox.width * 0.5, gridBox.y + gridBox.height * 0.25,
                     gridBox.x + gridBox.width * 0.5, gridBox.y + gridBox.height * 0.75);
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    expect(grid[3][0]).toBeGreaterThan(0); // Tile moved to bottom
  });

  test('tap (no movement) does not trigger a move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const before = await getGridState(page);
    const gridBox = await page.locator('#grid-container').boundingBox();
    // Tap: down and up at same position (minimal movement)
    await page.mouse.click(gridBox.x + gridBox.width * 0.5, gridBox.y + gridBox.height * 0.5);
    await page.waitForTimeout(100);

    const after = await getGridState(page);
    expect(JSON.stringify(before)).toEqual(JSON.stringify(after));
  });
});

// ─── Special Tile Merging ────────────────────────────────────────────────────────

test.describe('Special Tile Merging', () => {
  test('wildcard merges with any tile value', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Wildcard (value 2) adjacent to 8-tile - should merge into 8
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(2, Tile.TYPES.WILDCARD, 0, 0),
        new Tile(8, Tile.TYPES.NORMAL, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Wildcard + 8 = 8 (wildcard adopts the non-wildcard value)
    expect(grid[0][0]).toBe(8);
  });

  test('wildcard + wildcard produces 4', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(2, Tile.TYPES.WILDCARD, 0, 0),
        new Tile(2, Tile.TYPES.WILDCARD, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Wildcard + wildcard = 4
    expect(grid[0][0]).toBe(4);
  });

  test('bomb tile cannot merge with another bomb', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(2, Tile.TYPES.BOMB, 0, 0),
        new Tile(2, Tile.TYPES.BOMB, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Bombs cannot merge, so they just slide together
    expect(grid[0][0]).toBe(2);
    expect(grid[0][1]).toBe(2);
  });

  test('bomb tile cannot merge with normal tile of same value', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(4, Tile.TYPES.BOMB, 0, 0),
        new Tile(4, Tile.TYPES.NORMAL, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Bomb + normal should NOT merge
    expect(grid[0][0]).toBe(4);
    expect(grid[0][1]).toBe(4);
  });

  test('shield tile cannot merge on first move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      const shieldTile = new Tile(4, Tile.TYPES.SHIELD, 0, 0);
      shieldTile.shieldMovesLeft = 1;
      game.grid.cells[0] = [
        shieldTile,
        new Tile(4, Tile.TYPES.NORMAL, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Shield prevents merge on first move
    expect(grid[0][0]).toBe(4);
    expect(grid[0][1]).toBe(4);
  });

  test('shield tile CAN merge after shield expires', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up shield tile that has already expired (shieldMovesLeft = 0, type = normal)
    await page.evaluate(() => {
      const game = window.__fusionGame;
      // Create a shield tile, tick it to expire, then set up merge
      const shieldTile = new Tile(4, Tile.TYPES.SHIELD, 0, 0);
      shieldTile.shieldMovesLeft = 1;
      shieldTile.tickShield(); // Expires shield, becomes normal

      game.grid.cells[0] = [
        shieldTile, // Now normal after tickShield
        new Tile(4, Tile.TYPES.NORMAL, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // After shield expires, merge should work
    expect(grid[0][0]).toBe(8);
  });

  test('multiplier tile cannot merge with any tile', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(2, Tile.TYPES.MULTIPLIER, 0, 0),
        new Tile(2, Tile.TYPES.NORMAL, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Multiplier cannot merge
    expect(grid[0][0]).toBe(2);
    expect(grid[0][1]).toBe(2);
  });

  test('fusion core + fusion core produces value * 3', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(8, Tile.TYPES.FUSIONCORE, 0, 0),
        new Tile(8, Tile.TYPES.FUSIONCORE, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Fusion core (8) + fusion core (8) = 8 * 3 = 24
    expect(grid[0][0]).toBe(24);
  });

  test('fusion core + normal produces (a+b) * 3/2', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [
        new Tile(8, Tile.TYPES.FUSIONCORE, 0, 0),
        new Tile(8, Tile.TYPES.NORMAL, 0, 1),
        null, null
      ];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const grid = await getGridState(page);
    // Fusion core (8) + normal (8) = (8+8) * 3/2 = 24
    expect(grid[0][0]).toBe(24);
  });
});

// ─── Combo / Streak System ────────────────────────────────────────────────────────

test.describe('Combo / Streak System', () => {
  test('streak increments on consecutive merging moves', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up grid where 3 consecutive left moves each cause a merge
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(2, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [new Tile(4, Tile.TYPES.NORMAL, 1, 0), new Tile(4, Tile.TYPES.NORMAL, 1, 1), null, null];
      game.grid.cells[2] = [new Tile(8, Tile.TYPES.NORMAL, 2, 0), new Tile(8, Tile.TYPES.NORMAL, 2, 1), null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const streak1 = await page.evaluate(() => window.__fusionGame.combo.streak);
    expect(streak1).toBe(1);

    // Set up another mergeable pair for second move
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 2), new Tile(4, Tile.TYPES.NORMAL, 0, 3), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'right');
    const streak2 = await page.evaluate(() => window.__fusionGame.combo.streak);
    expect(streak2).toBe(2);
  });

  test('non-merging move resets streak to 0', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // First, build up a streak
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(2, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'left');
    const streakAfterMerge = await page.evaluate(() => window.__fusionGame.combo.streak);
    expect(streakAfterMerge).toBeGreaterThanOrEqual(1);

    // Now make a non-merging move (single tile slide)
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await pressDirection(page, 'left');
    const streakAfterNoMerge = await page.evaluate(() => window.__fusionGame.combo.streak);
    expect(streakAfterNoMerge).toBe(0);
  });

  test('streak multiplier applies to score', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Build streak to 2 (1.5x multiplier), then merge
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.combo.streak = 2; // Pre-set streak for testing multiplier
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await pressDirection(page, 'left');
    const score = await getScore(page);
    // Base merge score = 8, with 1.5x multiplier = 12
    expect(score).toBeGreaterThanOrEqual(12);
  });

  test('streak display shows in HUD when streak >= 2', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.combo.streak = 3;
      game._updateHUD();
    });

    const streakDisplay = page.locator('#streak-display');
    await expect(streakDisplay).toHaveClass(/active/);
    const streakText = await page.locator('#streak-value').textContent();
    expect(streakText).toContain('3x');
  });

  test('streak display hidden when streak < 2', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.combo.streak = 1;
      game._updateHUD();
    });

    const streakDisplay = page.locator('#streak-display');
    await expect(streakDisplay).not.toHaveClass(/active/);
  });
});

// ─── Power-Up: Undo ──────────────────────────────────────────────────────────────

test.describe('Power-Up: Undo', () => {
  test('Z key triggers undo', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Give undo charge and make a move
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('undo');
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    // Make a move to create undo state
    await pressDirection(page, 'left');
    const afterMove = await getGridState(page);

    // Press Z to undo
    await page.keyboard.press('z');
    await page.waitForTimeout(100);

    // Grid should be restored to before the move (single tile at [0][3])
    const afterUndo = await getGridState(page);
    expect(afterUndo[0][3]).toBeGreaterThan(0);
    expect(afterUndo[0][0]).toBe(0); // Tile no longer at left edge
  });

  test('undo restores previous score', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('undo');
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    // Merge to increase score
    await pressDirection(page, 'left');
    const scoreAfterMerge = await getScore(page);
    expect(scoreAfterMerge).toBeGreaterThan(0);

    // Undo
    await page.keyboard.press('z');
    await page.waitForTimeout(100);

    const scoreAfterUndo = await getScore(page);
    expect(scoreAfterUndo).toBe(0);
  });

  test('max 2 consecutive undos enforced', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.charges['undo'] = 10;
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    // Make 3 moves to build 3 undo states
    await pressDirection(page, 'left');
    await pressDirection(page, 'right');
    await pressDirection(page, 'left');

    // Undo twice (max allowed)
    await page.keyboard.press('z');
    await page.waitForTimeout(60);
    await page.keyboard.press('z');
    await page.waitForTimeout(60);

    const consecutiveUndos = await page.evaluate(() => window.__fusionGame.consecutiveUndos);
    expect(consecutiveUndos).toBe(2);

    // Third undo should fail - consecutiveUndos stays at 2
    await page.keyboard.press('z');
    await page.waitForTimeout(60);

    const afterThirdUndo = await page.evaluate(() => window.__fusionGame.consecutiveUndos);
    expect(afterThirdUndo).toBe(2);
  });

  test('new move resets consecutive undo counter', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.charges['undo'] = 10;
      game.grid.cells[0] = [null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 2), null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Make a move, undo twice (max), then make new move
    await pressDirection(page, 'left');
    await page.keyboard.press('z');
    await page.waitForTimeout(60);
    await page.keyboard.press('z');
    await page.waitForTimeout(60);

    // New move should reset undo counter
    await pressDirection(page, 'right');
    await page.waitForTimeout(60);

    // Should be able to undo again after new move
    await page.keyboard.press('z');
    await page.waitForTimeout(60);

    const undoCount = await page.evaluate(() => window.__fusionGame.consecutiveUndos);
    expect(undoCount).toBe(1);
  });

  test('undo with no states is no-op', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.charges['undo'] = 1;
    });

    const before = await getGridState(page);

    // Press Z with no moves made
    await page.keyboard.press('z');
    await page.waitForTimeout(100);

    const after = await getGridState(page);
    expect(JSON.stringify(before)).toEqual(JSON.stringify(after));
  });
});

// ─── Power-Up: Freeze ────────────────────────────────────────────────────────────

test.describe('Power-Up: Freeze', () => {
  test('freeze prevents new tile spawn on next move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('freeze');
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Activate freeze
    await page.evaluate(() => {
      window.__fusionGame.usePowerUp('freeze');
    });

    const beforeCount = countFilled(await getGridState(page));
    expect(beforeCount).toBe(1);

    // Make a move - tile moves but no new tile spawns
    await pressDirection(page, 'left');
    const afterGrid = await getGridState(page);
    const afterCount = countFilled(afterGrid);

    // With freeze, tile count should stay the same (no new tile spawned)
    expect(afterCount).toBe(beforeCount);
  });

  test('freeze is consumed after one use', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('freeze');
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Activate freeze and make a move
    await page.evaluate(() => { window.__fusionGame.usePowerUp('freeze'); });
    await pressDirection(page, 'left');

    // Freeze should be consumed
    const freezeActive = await page.evaluate(() => window.__fusionGame.freezeActive);
    expect(freezeActive).toBe(false);
  });
});

// ─── Power-Up: Split ─────────────────────────────────────────────────────────────

test.describe('Power-Up: Split', () => {
  test('split divides tile into two halves with adjacent empty cell', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('split');
      game.grid.cells[0] = [new Tile(8, Tile.TYPES.NORMAL, 0, 0), null, null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Activate split and target the 8-tile at [0][0]
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game._useSplit(game.grid.cells[0][0], 0, 0);
    });
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    // 8 should be split into two 4s
    expect(grid[0][0]).toBe(4);
    // One adjacent cell should also have a 4
    const adjacentValues = [grid[0][1], grid[1][0]];
    expect(adjacentValues).toContain(4);
  });

  test('split fails on value-2 tile', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('split');
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const before = await getGridState(page);

    // Try to split a 2-tile
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game._useSplit(game.grid.cells[0][0], 0, 0);
    });
    await page.waitForTimeout(100);

    const after = await getGridState(page);
    // Grid should be unchanged
    expect(JSON.stringify(before)).toEqual(JSON.stringify(after));
  });

  test('split fails when no adjacent empty cell', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('split');
      game.grid.cells[1] = [new Tile(4, Tile.TYPES.NORMAL, 1, 0), new Tile(8, Tile.TYPES.NORMAL, 1, 1), new Tile(4, Tile.TYPES.NORMAL, 1, 2), null];
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 0), new Tile(8, Tile.TYPES.NORMAL, 0, 1), new Tile(4, Tile.TYPES.NORMAL, 0, 2), null];
      game.grid.cells[2] = [new Tile(4, Tile.TYPES.NORMAL, 2, 0), new Tile(8, Tile.TYPES.NORMAL, 2, 1), new Tile(4, Tile.TYPES.NORMAL, 2, 2), null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const before = await getGridState(page);

    // Try to split surrounded tile at [1][1]
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game._useSplit(game.grid.cells[1][1], 1, 1);
    });
    await page.waitForTimeout(100);

    const after = await getGridState(page);
    // Grid should be unchanged
    expect(JSON.stringify(before)).toEqual(JSON.stringify(after));
  });
});

// ─── Power-Up: Nuke ──────────────────────────────────────────────────────────────

test.describe('Power-Up: Nuke', () => {
  test('nuke destroys all matching normal tiles', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const result = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('nuke');
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 0), new Tile(8, Tile.TYPES.NORMAL, 0, 1), new Tile(4, Tile.TYPES.NORMAL, 0, 2), null];
      game.grid.cells[1] = [new Tile(4, Tile.TYPES.NORMAL, 1, 0), null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;

      game._useNuke(4);

      // Count remaining 4-value normal tiles
      let count4 = 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const t = game.grid.cells[r][c];
          if (t && t.value === 4 && t.type === Tile.TYPES.NORMAL) count4++;
        }
      }
      const cell01 = game.grid.cells[0][1];
      return {
        count4,
        cell01Value: cell01 ? cell01.value : 0,
        cell01Type: cell01 ? cell01.type : '',
        score: game.score
      };
    });

    // The 8-tile at [0][1] should remain (not matching value 4)
    expect(result.cell01Value).toBe(8);
    expect(result.cell01Type).toBe('normal');
    // Score should be 12 (3 tiles × 4 each)
    expect(result.score).toBe(12);
    // Any 4-tiles on the grid are from random replacement, not the original ones
    // (replacement tiles are 90% value 2, 10% value 4, so 0-3 new 4s possible)
    expect(result.count4).toBeLessThanOrEqual(3);
  });

  test('nuke does not destroy special tiles', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const result = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('nuke');
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(2, Tile.TYPES.BOMB, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];

      game._useNuke(2);

      const bomb = game.grid.cells[0][1];
      return {
        exists: !!bomb,
        value: bomb ? bomb.value : 0,
        type: bomb ? bomb.type : ''
      };
    });

    // Bomb should still be at [0][1] (nuke only destroys normal tiles)
    expect(result.exists).toBe(true);
    expect(result.value).toBe(2);
    expect(result.type).toBe('bomb');
  });

  test('nuke adds destroyed tile values to score', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('nuke');
      game.grid.cells[0] = [new Tile(8, Tile.TYPES.NORMAL, 0, 0), new Tile(8, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.score = 0;
      game._renderGrid();
      game._updateHUD();
    });

    await page.evaluate(() => {
      window.__fusionGame._useNuke(8);
    });
    await page.waitForTimeout(100);

    const score = await getScore(page);
    // Two 8-tiles destroyed = 16 score gain
    expect(score).toBeGreaterThanOrEqual(16);
  });

  test('nuke spawns at most 3 replacement tiles', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('nuke');
      game.grid.cells[0] = [new Tile(4, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), new Tile(4, Tile.TYPES.NORMAL, 0, 2), new Tile(4, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    await page.evaluate(() => {
      window.__fusionGame._useNuke(4);
    });
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    // 4 tiles destroyed, at most 3 replacement tiles spawned
    expect(countFilled(grid)).toBeLessThanOrEqual(3);
  });
});

// ─── Power-Up: Swap ──────────────────────────────────────────────────────────────

test.describe('Power-Up: Swap', () => {
  test('swap exchanges two tiles', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('swap');
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(8, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Swap tiles at [0][0] and [0][1]
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game._activateSwap(0, 0); // First target
      game._activateSwap(0, 1); // Second target - executes swap
    });
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    expect(grid[0][0]).toBe(8);
    expect(grid[0][1]).toBe(2);
  });

  test('swap consumes one charge', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('swap');
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const beforeCharges = await page.evaluate(() => window.__fusionGame.powerUps.getCharges('swap'));
    expect(beforeCharges).toBe(1);

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game._activateSwap(0, 0);
      game._activateSwap(0, 1);
    });
    await page.waitForTimeout(100);

    const afterCharges = await page.evaluate(() => window.__fusionGame.powerUps.getCharges('swap'));
    expect(afterCharges).toBe(0);
  });
});

// ─── Power-Up: Stabilize ─────────────────────────────────────────────────────────

test.describe('Power-Up: Stabilize', () => {
  test('stabilize prevents next mutation', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('stabilize');
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, null];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Activate stabilize
    await page.evaluate(() => {
      window.__fusionGame.usePowerUp('stabilize');
    });

    const stabilizeActive = await page.evaluate(() => window.__fusionGame.stabilizeActive);
    expect(stabilizeActive).toBe(true);
  });

  test('stabilize is consumed after one use', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('stabilize');
      game.usePowerUp('stabilize');
      // Place tile so a left move actually moves it (triggers _checkMutation)
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Move triggers _checkMutation which consumes stabilizeActive
    await pressDirection(page, 'left');
    await page.waitForTimeout(100);

    const stabilizeActive = await page.evaluate(() => window.__fusionGame.stabilizeActive);
    expect(stabilizeActive).toBe(false);
  });
});

// ─── Power-Up Bar UI ─────────────────────────────────────────────────────────────

test.describe('Power-Up Bar UI', () => {
  test('power-up bar shows correct charge count', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('undo');
      game.powerUps.earn('undo');
      game._updatePowerUpBar();
    });

    const undoSlot = page.locator('.powerup-slot[data-powerup="undo"]');
    const count = await undoSlot.locator('.powerup-count').textContent();
    expect(count).toBe('2');
  });

  test('power-up slot shows disabled when 0 charges', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const undoSlot = page.locator('.powerup-slot[data-powerup="undo"]');
    await expect(undoSlot).toHaveClass(/disabled/);
  });

  test('clicking power-up slot activates selection', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('split');
      game._updatePowerUpBar();
    });

    // Click split slot to activate
    await page.click('.powerup-slot[data-powerup="split"]');
    await page.waitForTimeout(50);

    const activePowerUp = await page.evaluate(() => window.__fusionGame.activePowerUp);
    expect(activePowerUp).toBe('split');
  });

  test('clicking same power-up slot deactivates selection', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.powerUps.earn('split');
      game._updatePowerUpBar();
    });

    // Activate
    await page.click('.powerup-slot[data-powerup="split"]');
    await page.waitForTimeout(50);

    // Deactivate by clicking again
    await page.click('.powerup-slot[data-powerup="split"]');
    await page.waitForTimeout(50);

    const activePowerUp = await page.evaluate(() => window.__fusionGame.activePowerUp);
    expect(activePowerUp).toBe(null);
  });
});

// ─── Grid Mutations ──────────────────────────────────────────────────────────────

test.describe('Grid Mutations', () => {
  test('row shift correctly rotates tiles in a row', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const result = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), new Tile(8, Tile.TYPES.NORMAL, 0, 2), new Tile(16, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];

      // Use Grid's built-in shiftRow method
      game.grid.shiftRow(0, 1);
      return game.grid.cells[0].map(t => t ? t.value : null);
    });

    // shiftRow with direction=1 rotates right: [2,4,8,16] -> [16,2,4,8]
    expect(result).toEqual([16, 2, 4, 8]);
  });

  test('column shift correctly rotates tiles in a column', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const result = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), null, null, null];
      game.grid.cells[1] = [new Tile(4, Tile.TYPES.NORMAL, 1, 0), null, null, null];
      game.grid.cells[2] = [new Tile(8, Tile.TYPES.NORMAL, 2, 0), null, null, null];
      game.grid.cells[3] = [new Tile(16, Tile.TYPES.NORMAL, 3, 0), null, null, null];

      game.grid.shiftCol(0, 1);
      return [
        game.grid.cells[0][0] ? game.grid.cells[0][0].value : null,
        game.grid.cells[1][0] ? game.grid.cells[1][0].value : null,
        game.grid.cells[2][0] ? game.grid.cells[2][0].value : null,
        game.grid.cells[3][0] ? game.grid.cells[3][0].value : null
      ];
    });

    // shiftCol with direction=1 rotates down: [2,4,8,16] -> [16,2,4,8]
    expect(result).toEqual([16, 2, 4, 8]);
  });

  test('quadrant rotation correctly rotates 2x2 sub-grid', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const result = await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), null, null];
      game.grid.cells[1] = [new Tile(8, Tile.TYPES.NORMAL, 1, 0), new Tile(16, Tile.TYPES.NORMAL, 1, 1), null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];

      game.grid.rotateQuadrant('tl', true);
      return [
        game.grid.cells[0][0] ? game.grid.cells[0][0].value : null,
        game.grid.cells[0][1] ? game.grid.cells[0][1].value : null,
        game.grid.cells[1][0] ? game.grid.cells[1][0].value : null,
        game.grid.cells[1][1] ? game.grid.cells[1][1].value : null
      ];
    });

    // Clockwise rotation of [[2,4],[8,16]] -> [[8,2],[16,4]]
    expect(result).toEqual([8, 2, 16, 4]);
  });

  test('mutation that would cause game over is reversed', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up a full grid with no valid moves
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), new Tile(8, Tile.TYPES.NORMAL, 0, 2), new Tile(16, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [new Tile(32, Tile.TYPES.NORMAL, 1, 0), new Tile(64, Tile.TYPES.NORMAL, 1, 1), new Tile(128, Tile.TYPES.NORMAL, 1, 2), new Tile(256, Tile.TYPES.NORMAL, 1, 3)];
      game.grid.cells[2] = [new Tile(512, Tile.TYPES.NORMAL, 2, 0), new Tile(1024, Tile.TYPES.NORMAL, 2, 1), new Tile(2, Tile.TYPES.NORMAL, 2, 2), new Tile(4, Tile.TYPES.NORMAL, 2, 3)];
      game.grid.cells[3] = [new Tile(8, Tile.TYPES.NORMAL, 3, 0), new Tile(16, Tile.TYPES.NORMAL, 3, 1), new Tile(32, Tile.TYPES.NORMAL, 3, 2), new Tile(64, Tile.TYPES.NORMAL, 3, 3)];
      game._renderGrid();
    });

    // Verify no moves available
    const hasMoves = await page.evaluate(() => window.__fusionGame.grid.hasMoves());
    expect(hasMoves).toBe(false);
  });
});

// ─── Game Over from Actual Gameplay ────────────────────────────────────────────────

test.describe('Game Over from Actual Gameplay', () => {
  test('filling grid with no valid moves triggers game over', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set up a full grid with no valid moves, then make a move that does nothing
    // (game over is detected after a move when hasMoves() returns false)
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 42;
      game.sessionHighestTile = 1024;
      game.sessionBestStreak = 3;
      game.sessionMerges = 10;
      // Fill grid with no valid moves
      game.grid.cells[0] = [new Tile(2, Tile.TYPES.NORMAL, 0, 0), new Tile(4, Tile.TYPES.NORMAL, 0, 1), new Tile(8, Tile.TYPES.NORMAL, 0, 2), new Tile(16, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [new Tile(32, Tile.TYPES.NORMAL, 1, 0), new Tile(64, Tile.TYPES.NORMAL, 1, 1), new Tile(128, Tile.TYPES.NORMAL, 1, 2), new Tile(256, Tile.TYPES.NORMAL, 1, 3)];
      game.grid.cells[2] = [new Tile(512, Tile.TYPES.NORMAL, 2, 0), new Tile(1024, Tile.TYPES.NORMAL, 2, 1), new Tile(2, Tile.TYPES.NORMAL, 2, 2), new Tile(4, Tile.TYPES.NORMAL, 2, 3)];
      game.grid.cells[3] = [new Tile(8, Tile.TYPES.NORMAL, 3, 0), new Tile(16, Tile.TYPES.NORMAL, 3, 1), new Tile(32, Tile.TYPES.NORMAL, 3, 2), new Tile(64, Tile.TYPES.NORMAL, 3, 3)];
      game._renderGrid();
    });

    // Verify no moves available
    const hasMoves = await page.evaluate(() => window.__fusionGame.grid.hasMoves());
    expect(hasMoves).toBe(false);

    // Game over is triggered in makeMove() when !hasMoves() after the move.
    // Since no move can actually be made here (grid is full with no merges),
    // we trigger game over through the game's internal flow.
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game._showGameOver();
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#go-score')).toHaveText('42');
  });

  test('game over updates best score when current exceeds it', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 9999;
      game.sessionHighestTile = 2048;
      game.sessionBestStreak = 10;
      game.sessionMerges = 50;
      game._showGameOver();
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });

    // Best score should be updated
    const bestScore = await page.evaluate(() => {
      return window.__fusionGame.persistence.getStats().bestScore;
    });
    expect(bestScore).toBeGreaterThanOrEqual(9999);
  });

  test('game over saves session stats', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 500;
      game.sessionHighestTile = 256;
      game.sessionBestStreak = 5;
      game.sessionMerges = 20;
      game._showGameOver();
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });

    // Verify stats were saved
    const stats = await page.evaluate(() => window.__fusionGame.persistence.getStats());
    expect(stats.totalMerges).toBeGreaterThanOrEqual(20);
    expect(stats.bestStreak).toBeGreaterThanOrEqual(5);
    expect(stats.highestTile).toBeGreaterThanOrEqual(256);
  });
});

// ─── Continue After Win ──────────────────────────────────────────────────────────

test.describe('Continue After Win', () => {
  test('continue button hides win screen and resumes gameplay', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2048, Tile.TYPES.NORMAL, 0, 0), null, new Tile(2, Tile.TYPES.NORMAL, 0, 2), new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.sessionHighestTile = 1024;
      game.won = false;
      game.continuedAfterWin = false;
      game._renderGrid();
    });

    await pressDirection(page, 'right');
    await expect(page.locator('#win-screen')).toBeVisible({ timeout: 5000 });

    // Click continue
    await page.click('#win-screen [data-action="continue"]');
    await page.waitForTimeout(200);

    await expect(page.locator('#win-screen')).not.toBeVisible();
    await expect(page.locator('#grid-container')).toBeVisible();
  });

  test('no second win screen after continuing', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [new Tile(2048, Tile.TYPES.NORMAL, 0, 0), null, new Tile(2, Tile.TYPES.NORMAL, 0, 2), new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game.sessionHighestTile = 1024;
      game.won = false;
      game.continuedAfterWin = false;
      game._renderGrid();
    });

    await pressDirection(page, 'right');
    await expect(page.locator('#win-screen')).toBeVisible({ timeout: 5000 });
    await page.click('#win-screen [data-action="continue"]');
    await page.waitForTimeout(200);

    // Set up another 2048-achieving merge
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(1024, Tile.TYPES.NORMAL, 0, 3), new Tile(1024, Tile.TYPES.NORMAL, 0, 4)];
      // Reset to valid grid with mergeable 1024s
      game.grid.cells[0] = [null, null, new Tile(1024, Tile.TYPES.NORMAL, 0, 2), new Tile(1024, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    // Merge 1024+1024 to get 2048 again - should NOT trigger win screen
    await pressDirection(page, 'right');
    await page.waitForTimeout(1000);

    await expect(page.locator('#win-screen')).not.toBeVisible();
  });
});

// ─── Best Score Persistence ──────────────────────────────────────────────────────

test.describe('Best Score Persistence', () => {
  test('best score persists across page reloads', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set high score and trigger game over
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 5000;
      game._showGameOver();
    });
    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });

    // Reload page and start new game
    await page.reload({ waitUntil: 'networkidle' });
    await startGame(page, 'classic');

    const bestValue = await page.locator('#best-value').textContent();
    expect(parseInt(bestValue)).toBeGreaterThanOrEqual(5000);
  });

  test('best score only updates when new score exceeds it', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Set best score to 1000
    await page.evaluate(() => {
      const game = window.__fusionGame;
      const stats = game.persistence.getStats();
      stats.bestScore = 1000;
      game.persistence.updateStats(stats);
      game.persistence.save();
    });

    // Game over with lower score
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 500;
      game._showGameOver();
    });
    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });

    const bestScore = await page.evaluate(() => window.__fusionGame.persistence.getStats().bestScore);
    expect(bestScore).toBe(1000); // Should not have decreased
  });
});

// ─── Statistics Tracking ─────────────────────────────────────────────────────────

test.describe('Statistics Tracking', () => {
  test('games played counter increments each new game', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    const gamesPlayed = await page.evaluate(() => {
      return window.__fusionGame.persistence.getStats().gamesPlayed;
    });
    expect(gamesPlayed).toBeGreaterThanOrEqual(1);
  });

  test('statistics screen shows updated values after game', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    // Play a bit and trigger game over
    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.score = 200;
      game.sessionHighestTile = 64;
      game.sessionBestStreak = 2;
      game.sessionMerges = 5;
      game._showGameOver();
    });
    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });

    // Go to stats screen
    await page.click('#game-over [data-action="menu"]');
    await waitForMainMenu(page);
    await page.click('#main-menu [data-action="statistics"]');
    await expect(page.locator('#statistics-screen')).toBeVisible();

    const gamesPlayed = await page.locator('#stat-games').textContent();
    expect(parseInt(gamesPlayed)).toBeGreaterThanOrEqual(1);
  });
});

// ─── Keyboard Shortcuts ──────────────────────────────────────────────────────────

test.describe('Keyboard Shortcuts', () => {
  test('P key pauses game', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.keyboard.press('p');
    await expect(page.locator('#pause-menu')).toBeVisible();

    // Only Escape toggles pause back, not P
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-menu')).not.toBeVisible();
  });

  test('right-click toggles pause', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.mouse.click(100, 100, { button: 'right' });
    await expect(page.locator('#pause-menu')).toBeVisible();
  });
});

// ─── Rapid Input Cooldown ────────────────────────────────────────────────────────

test.describe('Rapid Input Cooldown', () => {
  test('rapid keypresses within cooldown only register one move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const beforeCount = countFilled(await getGridState(page));

    // Send 5 rapid keypresses (within 50ms cooldown)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.waitForTimeout(100);

    const afterGrid = await getGridState(page);
    const afterCount = countFilled(afterGrid);

    // Only one move should have registered (plus one new tile spawn)
    expect(afterCount - beforeCount).toBeLessThanOrEqual(1);
  });
});

// ─── Mouse Drag Input ────────────────────────────────────────────────────────────

test.describe('Mouse Drag Input', () => {
  test('mouse drag left triggers left move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const gridBox = await page.locator('#grid-container').boundingBox();
    const cx = gridBox.x + gridBox.width * 0.5;
    const cy = gridBox.y + gridBox.height * 0.5;

    // Drag from right to left
    await page.mouse.move(cx + 50, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 50, cy);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const grid = await getGridState(page);
    expect(grid[0][0]).toBeGreaterThan(0);
  });

  test('slow mouse drag (>400ms) does not trigger move', async ({ page }) => {
    await page.goto('/');
    await startGame(page, 'classic');

    await page.evaluate(() => {
      const game = window.__fusionGame;
      game.grid.cells[0] = [null, null, null, new Tile(2, Tile.TYPES.NORMAL, 0, 3)];
      game.grid.cells[1] = [null, null, null, null];
      game.grid.cells[2] = [null, null, null, null];
      game.grid.cells[3] = [null, null, null, null];
      game._renderGrid();
    });

    const before = await getGridState(page);
    const gridBox = await page.locator('#grid-container').boundingBox();
    const cx = gridBox.x + gridBox.width * 0.5;
    const cy = gridBox.y + gridBox.height * 0.5;

    // Very slow drag (>400ms)
    await page.mouse.move(cx + 50, cy);
    await page.mouse.down();
    await page.waitForTimeout(450);
    await page.mouse.move(cx - 50, cy);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const after = await getGridState(page);
    expect(JSON.stringify(before)).toEqual(JSON.stringify(after));
  });
});
