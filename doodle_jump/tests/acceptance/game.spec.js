const { test, expect } = require('@playwright/test');

test.describe('Doodle Jump - Main Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#main-menu', { timeout: 5000 });
  });

  test('should display the main menu', async ({ page }) => {
    await expect(page.locator('#main-menu')).toBeVisible();
    await expect(page.locator('.game-title')).toBeVisible();
    await expect(page.locator('.game-title')).toHaveText('Doodle Jump');
  });

  test('should have Play, High Scores, and Settings buttons', async ({ page }) => {
    await expect(page.locator('#btn-play')).toBeVisible();
    await expect(page.locator('#btn-highscores')).toBeVisible();
    await expect(page.locator('#btn-settings')).toBeVisible();
  });

  test('should start game when Play button is clicked', async ({ page }) => {
    await page.locator('#btn-play').click();
    await expect(page.locator('#countdown')).toBeVisible();
  });

  test('should show high scores screen', async ({ page }) => {
    await page.locator('#btn-highscores').click();
    await expect(page.locator('#highscores-menu')).toBeVisible();
    await expect(page.locator('#highscores-menu h2')).toHaveText('High Scores');
  });

  test('should show settings screen', async ({ page }) => {
    await page.locator('#btn-settings').click();
    await expect(page.locator('#settings-menu')).toBeVisible();
    await expect(page.locator('#settings-menu h2')).toHaveText('Settings');
  });
});

test.describe('Doodle Jump - Gameplay', () => {
  test('should show countdown before game starts', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await expect(page.locator('#countdown')).toBeVisible();
  });

  test('should display score during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    
    // Wait for countdown to finish
    await page.waitForSelector('#hud', { timeout: 5000 });
    await expect(page.locator('#score-display')).toBeVisible();
  });

  test('should have pause button visible during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });
    await expect(page.locator('#pause-btn')).toBeVisible();
  });

  test('should pause game with pause button', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });
    
    await page.locator('#pause-btn').click();
    await expect(page.locator('#pause-menu')).toBeVisible();
  });

  test('should resume game from pause', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });
    
    await page.locator('#pause-btn').click();
    await expect(page.locator('#pause-menu')).toBeVisible();
    
    await page.locator('#btn-resume').click();
    await expect(page.locator('#pause-menu')).not.toBeVisible();
  });

  test('should quit to menu from pause', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });
    
    await page.locator('#pause-btn').click();
    await page.locator('#btn-pause-quit').click();
    await expect(page.locator('#main-menu')).toBeVisible();
  });
});

test.describe('Doodle Jump - Game Over', () => {
  test('should show game over screen after falling', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();

    // Wait for countdown
    await page.waitForSelector('#hud', { timeout: 5000 });

    // Force player below screen to trigger game over
    await page.evaluate(() => {
      window.player.y = 1000;
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
  });

  test('game over screen should show score', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });

    await page.evaluate(() => {
      window.player.y = 1000;
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#game-over-score')).toBeVisible();
  });

  test('should have rematch button on game over', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });

    await page.evaluate(() => {
      window.player.y = 1000;
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#btn-rematch')).toBeVisible();
  });

  test('should return to menu from game over', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });

    await page.evaluate(() => {
      window.player.y = 1000;
    });

    await expect(page.locator('#game-over')).toBeVisible({ timeout: 5000 });
    await page.locator('#btn-go-menu').click();
    await expect(page.locator('#main-menu')).toBeVisible();
  });
});

test.describe('Doodle Jump - Settings', () => {
  test('should display volume controls', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    await expect(page.locator('#master-volume')).toBeVisible();
    await expect(page.locator('#music-volume')).toBeVisible();
    await expect(page.locator('#sfx-volume')).toBeVisible();
  });

  test('should have mute checkbox', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    await expect(page.locator('#mute-checkbox')).toBeVisible();
  });

  test('should have reduced motion option', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    await expect(page.locator('#reduced-motion')).toBeVisible();
  });

  test('should have reduced effects option', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    await expect(page.locator('#reduced-effects')).toBeVisible();
  });

  test('should have paper texture option', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    await expect(page.locator('#paper-texture')).toBeVisible();
  });

  test('should have control rebinding buttons', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    await expect(page.locator('#rebind-left')).toBeVisible();
    await expect(page.locator('#rebind-right')).toBeVisible();
    await expect(page.locator('#rebind-pause')).toBeVisible();
  });

  test('should go back to menu from settings', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    await page.locator('#btn-settings-back').click();
    await expect(page.locator('#main-menu')).toBeVisible();
  });

  test('volume sliders should update display values', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    const masterVol = page.locator('#master-volume');
    const masterVal = page.locator('#master-volume-val');
    
    await masterVol.fill('50');
    await expect(masterVal).toContainText('50');
  });
});

test.describe('Doodle Jump - High Scores', () => {
  test('should display high scores list', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-highscores').click();
    
    await expect(page.locator('#highscores-list')).toBeVisible();
  });

  test('should display player stats', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-highscores').click();
    
    await expect(page.locator('#stats-section')).toBeVisible();
  });

  test('should go back to menu from high scores', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-highscores').click();
    await page.locator('#btn-hs-back').click();
    await expect(page.locator('#main-menu')).toBeVisible();
  });
});

test.describe('Doodle Jump - Accessibility', () => {
  test('canvas should have role application', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('role', 'application');
  });

  test('canvas should have aria-label', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('aria-label');
  });

  test('canvas should be focusable', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('tabindex');
  });

  test('should have aria-live polite region', async ({ page }) => {
    await page.goto('/');
    const announcer = page.locator('#announcer');
    await expect(announcer).toHaveAttribute('aria-live', 'polite');
  });

  test('should have aria-live assertive region', async ({ page }) => {
    await page.goto('/');
    const urgentAnnouncer = page.locator('#urgent-announcer');
    await expect(urgentAnnouncer).toHaveAttribute('aria-live', 'assertive');
  });

  test('menu buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through buttons
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBeTruthy();
  });

  test('touch controls should be present on touch devices', async ({ page }) => {
    await page.goto('/');
    // Touch controls exist in DOM but may be hidden on non-touch devices
    await expect(page.locator('#touch-controls')).toHaveCount(1);
  });
});

test.describe('Doodle Jump - Responsiveness', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('#main-menu')).toBeVisible();
    await expect(page.locator('.game-title')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('#main-menu')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    await expect(page.locator('#main-menu')).toBeVisible();
  });
});

test.describe('Doodle Jump - Keyboard Controls', () => {
  test('should respond to keyboard input', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });
    
    // Press left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    // Press pause
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-menu')).toBeVisible();
  });

  test('should respond to WASD input', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });
    
    // Press A key
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(100);
    
    // Press D key
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(100);
  });

  test('P key should pause game', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-play').click();
    await page.waitForSelector('#hud', { timeout: 5000 });
    
    await page.keyboard.press('KeyP');
    await expect(page.locator('#pause-menu')).toBeVisible();
  });
});

test.describe('Doodle Jump - Mute Functionality', () => {
  test('should show mute indicator when muted', async ({ page }) => {
    await page.goto('/');
    
    // Mute via keyboard
    await page.keyboard.press('KeyM');
    
    const indicator = page.locator('#mute-indicator');
    await expect(indicator).toBeVisible();
  });

  test('should mute via settings checkbox', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-settings').click();
    
    await page.locator('#mute-checkbox').check();
    
    const checked = await page.locator('#mute-checkbox').isChecked();
    expect(checked).toBe(true);
  });
});
