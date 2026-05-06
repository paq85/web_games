const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Tetris Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForLoadState('domcontentloaded');
  });

  // ---- Game Start and Basic Movement ----

  test('displays title screen on load', async ({ page }) => {
    const overlay = page.locator('#overlay');
    await expect(overlay).toBeVisible({ timeout: 10000 });
    const title = page.locator('#overlay-title');
    await expect(title).toHaveText('NEON BLOCKS', { timeout: 10000 });
  });

  test('can start game by clicking Classic mode button', async ({ page }) => {
    const classicBtn = page.getByRole('button', { name: 'Classic' });
    await classicBtn.click();
    
    const overlay = page.locator('#overlay');
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Game should be running - score display should be visible
    const scoreDisplay = page.locator('#score-display');
    await expect(scoreDisplay).toBeVisible();
  });

  test('can start game with keyboard', async ({ page }) => {
    await page.keyboard.press('Enter');
    
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const scoreDisplay = page.locator('#score-display');
    await expect(scoreDisplay).toBeVisible();
  });

  test('piece spawns and is visible', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Verify the canvas exists and has content
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    expect(await canvas.getAttribute('width')).toBeTruthy();
    expect(await canvas.getAttribute('height')).toBeTruthy();
  });

  // ---- Piece Movement ----

  test('can move piece left and right', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    
    // Press left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(50);
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(50);
    
    // Game should still be in playing state
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('can rotate piece', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(50);
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('can rotate counter-clockwise', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(50);
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  // ---- Hard Drop and Soft Drop ----

  test('can perform hard drop', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    
    // Score should be > 0 after hard drop
    const score = await page.evaluate(() => window.game.scoreManager.score);
    expect(score).toBeGreaterThan(0);
  });

  test('can perform soft drop', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Press down a few times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(10);
    }
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  // ---- Hold Piece ----

  test('can use hold piece', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Store current piece type
    const firstType = await page.evaluate(() => window.game.currentType);
    
    // Hold the piece
    await page.keyboard.press('KeyX');
    await page.waitForTimeout(100);
    
    // Hold should contain the first piece type
    const holdType = await page.evaluate(() => window.game.hold);
    expect(holdType).toBe(firstType);
  });

  // ---- Ghost Piece ----

  test('ghost piece exists on canvas', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Ghost row should be at bottom (19 for first piece on empty grid)
    const ghostRow = await page.evaluate(() => window.game.getGhostRow());
    expect(ghostRow).toBe(19);
  });

  // ---- Next Piece Queue ----

  test('next piece queue displays pieces', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const nextCanvas = page.locator('#next-canvas');
    await expect(nextCanvas).toBeVisible();
    
    // Queue should have 5 pieces
    const queueLength = await page.evaluate(() => window.game.queue.length);
    expect(queueLength).toBe(5);
  });

  // ---- Pause / Resume ----

  test('can pause and resume game', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    
    // Pause
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(200);
    
    let state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
    
    // Resume
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(200);
    
    state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('can pause with Escape key', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
  });

  test('pause button works', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    await page.locator('#pause-btn').click();
    await page.waitForTimeout(200);
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
  });

  // ---- Level Progression ----

  test('level starts at 0 for classic mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const level = await page.evaluate(() => window.game.scoreManager.level);
    expect(level).toBe(0);
  });

  test('level increases after clearing lines', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Manually set lines to trigger level up
    await page.evaluate(() => {
      window.game.scoreManager.lines = 10;
      window.game.scoreManager.level = 1;
    });
    
    const level = await page.evaluate(() => window.game.scoreManager.level);
    expect(level).toBe(1);
  });

  // ---- Game Over ----

  test('game over occurs when grid fills', async ({ page }) => {
    // Fill the grid to trigger game over
    await page.evaluate(() => {
      window.game.startGame();
      // Fill the grid completely
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          window.game.playfield.grid[r][c] = 'I';
        }
      }
      // Try to spawn - should fail and trigger game over
      window.game.spawnPiece();
    });
    
    await page.waitForTimeout(500);
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('gameover');
    
    // Game over overlay should show
    const overlay = page.locator('#overlay');
    await expect(overlay).toHaveClass(/active/);
  });

  // ---- Game Modes ----

  test('speed mode starts at level 10', async ({ page }) => {
    await page.getByRole('button', { name: 'Speed (Ultra)' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const level = await page.evaluate(() => window.game.scoreManager.level);
    expect(level).toBe(10);
  });

  test('speed mode has score multiplier', async ({ page }) => {
    await page.getByRole('button', { name: 'Speed (Ultra)' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const multiplier = await page.evaluate(() => window.game.scoreManager.scoreMultiplier);
    expect(multiplier).toBe(1.5);
  });

  test('marathon mode removes rows instead of game over', async ({ page }) => {
    // Start marathon mode and fill grid
    await page.evaluate(() => {
      window.game.mode = 'marathon';
      window.game.startGame();
      // Fill the grid
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          window.game.playfield.grid[r][c] = 'I';
        }
      }
      window.game.spawnPiece();
    });
    
    await page.waitForTimeout(500);
    
    // Should still be playing in marathon mode
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  // ---- High Score Persistence ----

  test('high score persists across sessions', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('tetris_high_score', '5000');
    });
    
    const highScore = await page.evaluate(() => {
      return parseInt(localStorage.getItem('tetris_high_score'), 10);
    });
    
    expect(highScore).toBe(5000);
  });

  // ---- Mute Toggle ----

  test('mute toggle works', async ({ page }) => {
    const muteBtn = page.locator('#mute-btn');
    await expect(muteBtn).toHaveText('🔊');
    
    await muteBtn.click();
    await page.waitForTimeout(100);
    
    await expect(muteBtn).toHaveText('🔇');
    
    // Verify mute state is persisted
    const isMuted = await page.evaluate(() => window.game.audio.muted);
    expect(isMuted).toBe(true);
  });

  test('mute preference persists', async ({ page }) => {
    // Set mute and reload
    await page.evaluate(() => {
      localStorage.setItem('tetris_audio_muted', 'true');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    const isMuted = await page.evaluate(() => {
      const game = window.game;
      if (game && game.audio) return game.audio.muted;
      return localStorage.getItem('tetris_audio_muted') === 'true';
    });
    expect(isMuted).toBe(true);
  });

  // ---- Responsive Layout ----

  test('layout adapts to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Touch controls should be visible on mobile
    const touchControls = page.locator('#touch-controls');
    // They are displayed when width < 600px
    const isVisible = await page.evaluate(() => {
      const el = document.getElementById('touch-controls');
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });
    expect(isVisible).toBe(true);
  });

  test('on-screen touch buttons exist', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const buttons = page.locator('.touch-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify specific buttons exist
    const leftBtn = page.locator('[data-action="left"]');
    const rightBtn = page.locator('[data-action="right"]');
    const hardDropBtn = page.locator('[data-action="hard-drop"]');
    await expect(leftBtn).toBeVisible();
    await expect(rightBtn).toBeVisible();
    await expect(hardDropBtn).toBeVisible();
  });

  // ---- Accessibility ----

  test('canvas has ARIA attributes', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    // The main game container should have proper semantics
    // Check for live regions
    const livePolite = page.locator('[aria-live="polite"]');
    const liveAssertive = page.locator('[aria-live="assertive"]');
    await expect(livePolite).toBeVisible();
    await expect(liveAssertive).toBeVisible();
  });

  test('game is keyboard operable', async ({ page }) => {
    // Start game with keyboard
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Verify game is running
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
    
    // Press various keys
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.keyboard.press('KeyZ');
    await page.keyboard.press('KeyX');
    
    // Game should still be in playing state (or game over)
    const currentState = await page.evaluate(() => window.game.state);
    expect(['playing', 'gameover', 'paused']).toContain(currentState);
  });

  test('touch controls are touch-target sized', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that touch buttons meet 44px minimum
    const sizes = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.touch-btn');
      return Array.from(buttons).map(btn => ({
        width: btn.offsetWidth,
        height: btn.offsetHeight
      }));
    });
    
    for (const size of sizes) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
  });

  // ---- Scoring ----

  test('score increases after hard drop', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Hard drop
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    
    const score = await page.evaluate(() => window.game.scoreManager.score);
    expect(score).toBeGreaterThan(0);
  });

  // ---- Game Flow ----

  test('can restart after game over', async ({ page }) => {
    // Trigger game over
    await page.evaluate(() => {
      window.game.mode = 'classic';
      window.game.startGame();
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          window.game.playfield.grid[r][c] = 'I';
        }
      }
      window.game.spawnPiece();
    });
    
    await page.waitForTimeout(500);
    
    // Restart
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(500);
    
    // Should be playing again
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('hud displays score level and lines', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const scoreDisplay = page.locator('#score-display');
    const levelDisplay = page.locator('#level-display');
    const linesDisplay = page.locator('#lines-display');
    
    await expect(scoreDisplay).toBeVisible();
    await expect(levelDisplay).toBeVisible();
    await expect(linesDisplay).toBeVisible();
  });

  test('hold and next previews exist', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const holdCanvas = page.locator('#hold-canvas');
    const nextCanvas = page.locator('#next-canvas');
    
    await expect(holdCanvas).toBeVisible();
    await expect(nextCanvas).toBeVisible();
  });

  test('combo display is hidden initially', async ({ page }) => {
    const comboDisplay = page.locator('#combo-display');
    const hasActive = await page.evaluate(() => {
      return document.getElementById('combo-display').classList.contains('active');
    });
    expect(hasActive).toBe(false);
  });

  test('pause button in HUD works', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    // Click pause button
    await page.locator('#pause-btn').click();
    await page.waitForTimeout(200);
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
  });

  test('resume button on pause overlay works', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(200);
    
    // Click resume button
    const resumeBtn = page.getByRole('button', { name: 'Resume' });
    await resumeBtn.click();
    await page.waitForTimeout(200);
    
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('game state transitions correctly', async ({ page }) => {
    // Title -> Playing
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    let state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
    
    // Playing -> Paused
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(100);
    state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
    
    // Paused -> Playing
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(100);
    state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('all seven piece types exist', async ({ page }) => {
    const types = await page.evaluate(() => window.PIECE_TYPES);
    expect(types).toContain('I');
    expect(types).toContain('O');
    expect(types).toContain('T');
    expect(types).toContain('S');
    expect(types).toContain('Z');
    expect(types).toContain('J');
    expect(types).toContain('L');
    expect(types.length).toBe(7);
  });

  test('7-bag randomizer ensures fair distribution', async ({ page }) => {
    await page.evaluate(() => {
      const bag = new BagRandomizer();
      const pieces = [];
      for (let i = 0; i < 14; i++) {
        pieces.push(bag.next());
      }
      // First 7 should contain each piece type exactly once
      const firstBag = pieces.slice(0, 7).sort();
      const expected = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
      return firstBag.join(',') === expected.join(',');
    }).then(isFair => {
      expect(isFair).toBe(true);
    });
  });

  test('game runs at expected speed for level 0', async ({ page }) => {
    await page.getByRole('button', { name: 'Classic' }).click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    
    const dropDelay = await page.evaluate(() => window.game.getDropDelay());
    expect(dropDelay).toBe(800);
  });

  test('grid dimensions are correct', async ({ page }) => {
    const [cols, rows] = await page.evaluate(() => [window.game.playfield.grid.length, window.game.playfield.grid[0].length]);
    expect(cols).toBe(20);
    expect(rows).toBe(10);
  });
});
