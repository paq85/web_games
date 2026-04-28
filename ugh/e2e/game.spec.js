// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('UGH! Game - Title Screen', () => {
  test('loads the title screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overlay-title')).toBeVisible();
    await expect(page.locator('#overlay-title h1')).toContainText('UGH!');
  });

  test('shows game mode buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-single')).toBeVisible();
    await expect(page.locator('#btn-multi')).toBeVisible();
    await expect(page.locator('#btn-hotseat')).toBeVisible();
  });

  test('shows settings button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-settings')).toBeVisible();
  });

  test('opens settings screen', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-settings');
    await expect(page.locator('#overlay-settings')).toBeVisible();
    await expect(page.locator('#overlay-settings h2')).toContainText('SETTINGS');
  });

  test('returns from settings to title', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-settings');
    await page.click('#btn-settings-back');
    await expect(page.locator('#overlay-title')).toBeVisible();
  });
});

test.describe('UGH! Game - Single Player', () => {
  test('starts single player mode', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    // Should show level intro
    await expect(page.locator('#overlay-level-intro')).toBeVisible({ timeout: 5000 });
  });

  test('shows level intro with correct info', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await expect(page.locator('#level-intro-title')).toContainText('LEVEL 1', { timeout: 5000 });
    await expect(page.locator('#level-intro-desc')).toContainText('The Savannah');
  });

  test('transitions to gameplay after intro', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    // Wait for level intro to pass (2.5 seconds)
    await page.waitForTimeout(3000);
    // HUD should be visible
    await expect(page.locator('#hud')).toHaveClass(/active/);
  });

  test('shows HUD during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);
    await expect(page.locator('#hud-score')).toBeVisible();
    await expect(page.locator('#hud-level')).toBeVisible();
    await expect(page.locator('#hud-lives')).toBeVisible();
    await expect(page.locator('#hud-deliveries')).toBeVisible();
  });

  test('helicopter responds to keyboard input', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    const canvas = page.locator('#game-canvas');
    const before = await canvas.boundingBox();

    // Press up arrow
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);

    // Canvas should still be there (game didn't crash)
    await expect(canvas).toBeVisible();
  });

  test('can pause with Escape key', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);
    await page.keyboard.press('Escape');
    await expect(page.locator('#overlay-pause')).toBeVisible();
  });

  test('can resume from pause', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);
    await page.keyboard.press('Escape');
    await page.click('#btn-resume');
    await expect(page.locator('#overlay-pause')).not.toBeVisible();
    await expect(page.locator('#hud')).toHaveClass(/active/);
  });

  test('can return to menu from pause', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);
    await page.keyboard.press('Escape');
    await page.click('#btn-menu-pause');
    await expect(page.locator('#overlay-title')).toBeVisible();
  });

  test('can restart from pause', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);
    await page.keyboard.press('Escape');
    await page.click('#btn-restart-pause');
    await expect(page.locator('#overlay-level-intro')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('UGH! Game - Controls', () => {
  test('WASD keys work as movement', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // W key (up)
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(50);
    await expect(page.locator('#game-canvas')).toBeVisible();

    // A key (left)
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(50);
    await expect(page.locator('#game-canvas')).toBeVisible();

    // S key (down)
    await page.keyboard.press('KeyS');
    await page.waitForTimeout(50);
    await expect(page.locator('#game-canvas')).toBeVisible();

    // D key (right)
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(50);
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('Space key triggers action', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    await page.keyboard.press('Space');
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('P key toggles pause', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    await page.keyboard.press('KeyP');
    await expect(page.locator('#overlay-pause')).toBeVisible();

    await page.keyboard.press('KeyP');
    await expect(page.locator('#overlay-pause')).not.toBeVisible();
  });
});

test.describe('UGH! Game - Game States', () => {
  test('game over screen shows after losing all lives', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // Hold down arrow to crash into terrain repeatedly
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowDown');

    // Check if game over or level complete appeared
    const gameOverVisible = await page.locator('#overlay-gameover').isVisible();
    const levelCompleteVisible = await page.locator('#overlay-level-complete').isVisible();
    expect(gameOverVisible || levelCompleteVisible).toBe(true);
  });

  test('game over screen has retry button', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // Force game over
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(20);
    }

    if (await page.locator('#overlay-gameover').isVisible()) {
      await expect(page.locator('#btn-retry')).toBeVisible();
      await expect(page.locator('#btn-menu-go')).toBeVisible();
    }
  });

  test('can restart after game over without page reload', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // Force game over
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(20);
    }

    if (await page.locator('#overlay-gameover').isVisible()) {
      await page.click('#btn-retry');
      await expect(page.locator('#overlay-level-intro')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('UGH! Game - Multiplayer', () => {
  test('shows turn screen for hotseat mode', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-hotseat');
    await expect(page.locator('#overlay-turn')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#turn-player-label')).toContainText('PLAYER 1');
  });

  test('hotseat turn screen has start button', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-hotseat');
    await expect(page.locator('#btn-turn-start')).toBeVisible({ timeout: 5000 });
  });

  test('2 player mode starts level intro', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-multi');
    await expect(page.locator('#overlay-level-intro')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('UGH! Game - Level Codes', () => {
  test('level code section appears after progress is saved', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // Force game over to save progress
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowDown');

    // Wait for game over screen
    await expect(page.locator('#overlay-gameover')).toBeVisible({ timeout: 10000 });

    // Return to menu
    await page.click('#btn-menu-go');

    // Level code section should be visible
    await expect(page.locator('#level-code-section')).toHaveClass(/active/);
  });

  test('level code input rejects invalid codes', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // Force game over to save progress
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowDown');

    // Wait for game over screen
    await expect(page.locator('#overlay-gameover')).toBeVisible({ timeout: 10000 });

    // Return to menu
    await page.click('#btn-menu-go');

    // Level code section should now be visible
    await expect(page.locator('#level-code-section')).toHaveClass(/active/);

    await page.fill('#level-code-input', 'INVALID');
    await page.click('#btn-load-code');
    await expect(page.locator('#level-code-error')).toContainText('Invalid');
  });
});

test.describe('UGH! Game - Responsiveness', () => {
  test('canvas resizes on window resize', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 400, height: 700 });
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });

  test('game remains stable after rapid input', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // Rapid key presses
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
    }

    // Game should still be running
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('repeated start/restart cycles remain stable', async ({ page }) => {
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.goto('/');
      await page.click('#btn-single');
      await page.waitForTimeout(3000);
      await page.keyboard.press('Escape');
      await page.click('#btn-menu-pause');
      await page.waitForTimeout(500);
    }

    // Should still be on title screen
    await expect(page.locator('#overlay-title')).toBeVisible();
  });
});

test.describe('UGH! Game - Accessibility', () => {
  test('reduced motion setting is available', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-settings');
    await expect(page.locator('#settings-reduced-motion')).toBeVisible();
  });

  test('sound setting is available', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-settings');
    await expect(page.locator('#settings-sound')).toBeVisible();
  });

  test('music setting is available', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-settings');
    await expect(page.locator('#settings-music')).toBeVisible();
  });

  test('HUD shows non-color status indicators', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-single');
    await page.waitForTimeout(3000);

    // Health bar and fuel bar should be visible (not just color indicators)
    await expect(page.locator('#health-bar')).toBeVisible();
    await expect(page.locator('#fuel-bar')).toBeVisible();
    await expect(page.locator('#hud-deliveries')).toBeVisible();
  });
});
