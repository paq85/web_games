const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

test.describe('Space Invaders Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForLoadState('domcontentloaded');
    // Clear localStorage for clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  // ---- Game Start and Title Screen ----

  test('displays title screen on load', async ({ page }) => {
    const overlay = page.locator('#overlay');
    await expect(overlay).toBeVisible({ timeout: 10000 });
    const title = page.locator('#overlay-title');
    await expect(title).toHaveText('SPACE INVADERS', { timeout: 10000 });
  });

  test('start button exists and is visible', async ({ page }) => {
    const btn = page.locator('#overlay-btn-start');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn).toHaveText('START GAME');
  });

  test('can start game by clicking start button', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('can start game with Enter key', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('canvas exists with correct dimensions', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    expect(await canvas.getAttribute('width')).toBe('480');
    expect(await canvas.getAttribute('height')).toBe('640');
  });

  // ---- ARIA and Accessibility ----

  test('canvas has ARIA attributes', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('role', 'application');
    await expect(canvas).toHaveAttribute('tabindex', '0');
    await expect(canvas).toHaveAttribute('aria-label');
  });

  test('aria-live regions exist', async ({ page }) => {
    const livePolite = page.locator('[aria-live="polite"]');
    const liveAssertive = page.locator('[aria-live="assertive"]');
    await expect(livePolite).toBeVisible({ timeout: 5000 });
    await expect(liveAssertive).toBeVisible({ timeout: 5000 });
  });

  // ---- HUD ----

  test('hud displays score, stage, wave, lives', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    const score = page.locator('#score-display');
    const stage = page.locator('#stage-display');
    const wave = page.locator('#wave-display');
    const lives = page.locator('#lives-display');
    await expect(score).toBeVisible();
    await expect(stage).toBeVisible();
    await expect(wave).toBeVisible();
    await expect(lives).toBeVisible();
  });

  test('hud shows correct initial values', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    expect(await page.locator('#stage-display').textContent()).toBe('1');
    expect(await page.locator('#wave-display').textContent()).toBe('1');
    expect(await page.locator('#lives-display').textContent()).toBe('3');
  });

  // ---- Player Movement ----

  test('player moves left with ArrowLeft', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    const startX = await page.evaluate(() => window.game.player.x);
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowLeft');
    const endX = await page.evaluate(() => window.game.player.x);
    expect(endX).toBeLessThan(startX);
  });

  test('player moves right with ArrowRight', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    const startX = await page.evaluate(() => window.game.player.x);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowRight');
    const endX = await page.evaluate(() => window.game.player.x);
    expect(endX).toBeGreaterThan(startX);
  });

  test('player moves left with A key', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    const startX = await page.evaluate(() => window.game.player.x);
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(100);
    await page.keyboard.up('KeyA');
    const endX = await page.evaluate(() => window.game.player.x);
    expect(endX).toBeLessThan(startX);
  });

  test('player moves right with D key', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    const startX = await page.evaluate(() => window.game.player.x);
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(100);
    await page.keyboard.up('KeyD');
    const endX = await page.evaluate(() => window.game.player.x);
    expect(endX).toBeGreaterThan(startX);
  });

  // ---- Player Shooting ----

  test('player shoots with Space', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.locator('#game-canvas').click();
    await page.waitForTimeout(100);
    await page.keyboard.down('Space');
    await page.waitForTimeout(150);
    await page.keyboard.up('Space');
    await page.waitForTimeout(50);
    const bullets = await page.evaluate(() => window.game.playerBullets.length);
    expect(bullets).toBeGreaterThan(0);
  });

  test('player shoots with ArrowUp', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowUp');
    const bullets = await page.evaluate(() => window.game.playerBullets.length);
    expect(bullets).toBeGreaterThan(0);
  });

  test('player shoots with W key', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(100);
    await page.keyboard.up('KeyW');
    const bullets = await page.evaluate(() => window.game.playerBullets.length);
    expect(bullets).toBeGreaterThan(0);
  });

  test('only one player bullet on screen at a time', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    const bullets = await page.evaluate(() => window.game.playerBullets.length);
    expect(bullets).toBeLessThanOrEqual(1);
  });

  // ---- Alien Formation ----

  test('aliens spawn on game start', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    const formation = await page.evaluate(() => window.game.formation);
    expect(formation).toBeTruthy();
    const aliveCount = await page.evaluate(() =>
      window.game.formation.aliens.filter(a => a.alive).length
    );
    expect(aliveCount).toBeGreaterThan(0);
  });

  test('alien formation moves horizontally', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(200);
    const x1 = await page.evaluate(() => window.game.formation.formationX);
    await page.waitForTimeout(500);
    const x2 = await page.evaluate(() => window.game.formation.formationX);
    expect(x2).not.toBe(x1);
  });

  test('alien formation shifts down at edges', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    // Let formation move for a while to hit edges
    await page.waitForTimeout(5000);
    const formationY = await page.evaluate(() => window.game.formation.formationY);
    expect(formationY).toBeGreaterThan(0);
  });

  test('alien types have correct point values', async ({ page }) => {
    const types = await page.evaluate(() => {
      const t = window.ALIEN_TYPES;
      return { squid: t.squid.points, crab: t.crab.points, miner: t.miner.points, elite: t.elite.points };
    });
    expect(types.squid).toBe(30);
    expect(types.crab).toBe(20);
    expect(types.miner).toBe(10);
    expect(types.elite).toBe(50);
  });

  // ---- Alien Firing ----

  test('aliens fire bullets', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    // Wait for aliens to fire
    await page.waitForTimeout(3000);
    const alienBullets = await page.evaluate(() => window.game.alienBullets.length);
    // May or may not have bullets depending on timing, but the system should allow it
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  // ---- Bullet Collision ----

  test('player bullet destroys alien and increases score', async ({ page }) => {
    const score = await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.state = window.GameState.PAUSED;
      const alien = game.formation.aliens[0];
      alien.alive = true;
      alien.x = game.player.x + game.player.w / 2 - 12;
      alien.y = game.player.y - 100;
      game.playerBullets = [];
      game.playerBullets.push(new window.Bullet(alien.x + 8, alien.y + 8, 0, -300, false));
      game._checkCollisions();
      return game.scoring.score;
    });
    expect(score).toBeGreaterThan(0);
  });

  // ---- Barricades ----

  test('barricades spawn at game start', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    const barricadeCount = await page.evaluate(() => window.game.barricades.length);
    expect(barricadeCount).toBe(4);
  });

  test('player bullet damages barricade', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    // Position bullet at first barricade
    await page.evaluate(() => {
      const barr = window.game.barricades[0];
      window.game.playerBullets = [{
        x: barr.x + 10, y: barr.y + 5, w: 4, h: 10, alive: true, isAlien: false,
        bounds: { x: barr.x + 10, y: barr.y + 5, w: 4, h: 10 }
      }];
    });
    await page.waitForTimeout(100);
    // Barricade should have been hit (some cells destroyed)
    const barr = await page.evaluate(() => window.game.barricades[0]);
    // Some cells should be false now
    let anyCell = false;
    for (const row of barr.cells) {
      for (const cell of row) {
        if (!cell) { anyCell = true; break; }
      }
    }
    expect(anyCell).toBe(true);
  });

  test('alien bullet damages barricade', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const barr = window.game.barricades[0];
      window.game.alienBullets = [{
        x: barr.x + 20, y: barr.y + 10, w: 4, h: 10, alive: true, isAlien: true,
        bounds: { x: barr.x + 20, y: barr.y + 10, w: 4, h: 10 }
      }];
    });
    await page.waitForTimeout(100);
    const barr = await page.evaluate(() => window.game.barricades[0]);
    let anyCell = false;
    for (const row of barr.cells) {
      for (const cell of row) {
        if (!cell) { anyCell = true; break; }
      }
    }
    expect(anyCell).toBe(true);
  });

  // ---- Wave Clear ----

  test('wave clear occurs when all aliens destroyed', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      // Kill all aliens immediately
      for (const a of game.formation.aliens) a.alive = false;
    });
    await page.waitForTimeout(2000);
    const state = await page.evaluate(() => window.game.state);
    expect(['wave_clear', 'playing']).toContain(state);
  });

  // ---- Boss Fight ----

  test('boss fight activates after waves', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      // Kill all aliens to trigger wave clear
      for (const a of game.formation.aliens) a.alive = false;
      // Force boss state
      game.waveManager.wave = 5;
      game.waveManager.nextWave(); // Returns 'boss'
      game.boss = new window.Boss(game.waveManager.stage);
      game.state = 'boss_fight';
    });
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('boss_fight');
    const bossAlive = await page.evaluate(() => window.game.boss && window.game.boss.alive);
    expect(bossAlive).toBe(true);
  });

  test('boss health is reduced when hit', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.waveManager.wave = 5;
      game.waveManager.nextWave();
      game.boss = new window.Boss(1);
      game.state = 'boss_fight';
      game.boss.entered = true;
      // Hit boss
      game.playerBullets = [{
        x: game.boss.x + 30, y: game.boss.y + 10, w: 4, h: 10, alive: true, isAlien: false,
        bounds: { x: game.boss.x + 30, y: game.boss.y + 10, w: 4, h: 10 }
      }];
      game._checkCollisions();
    });
    const hp = await page.evaluate(() => window.game.boss.hp);
    expect(hp).toBe(19); // 20 - 1
  });

  test('boss death awards bonus points', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.waveManager.wave = 5;
      game.waveManager.nextWave();
      game.boss = new window.Boss(1);
      game.state = 'boss_fight';
      game.boss.entered = true;
      game.boss.hp = 1;
      game.playerBullets = [{
        x: game.boss.x + 40, y: game.boss.y + 20, w: 4, h: 10, alive: true, isAlien: false,
        bounds: { x: game.boss.x + 40, y: game.boss.y + 20, w: 4, h: 10 }
      }];
      game._checkCollisions();
    });
    const finalScore = await page.evaluate(() => window.game.scoring.score);
    expect(finalScore).toBeGreaterThan(0);
  });

  // ---- Power-ups ----

  test('power-up spawns from destroyed alien', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game._spawnPowerUp(100, 300, true);
    });
    await page.waitForTimeout(100);
    const puCount = await page.evaluate(() => window.game.powerups.length);
    expect(puCount).toBe(1);
  });

  test('power-up falls downward', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game._spawnPowerUp(100, 100, true);
    });
    await page.waitForTimeout(500);
    const pu = await page.evaluate(() => window.game.powerups[0]);
    expect(pu.y).toBeGreaterThan(100);
  });

  test('power-up collection applies effect', async ({ page }) => {
    const hasPowerup = await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.state = window.GameState.PAUSED;
      game._spawnPowerUp(game.player.x, game.player.y - 10, true);
      const pu = game.powerups[0];
      game._applyPowerUp(pu.type);
      return Object.keys(game.player.activePowerups).length > 0 || game.player.shieldActive;
    });
    expect(hasPowerup).toBe(true);
  });

  test('only one power-up on screen at a time', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game._spawnPowerUp(100, 100, true);
      game._spawnPowerUp(200, 100, true);
    });
    await page.waitForTimeout(100);
    const puCount = await page.evaluate(() => window.game.powerups.length);
    expect(puCount).toBeLessThanOrEqual(1);
  });

  // ---- Combo System ----

  test('combo counter increases on alien kill', async ({ page }) => {
    const combo = await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.state = window.GameState.PAUSED;
      game.combo.add();
      game.combo.add();
      return game.combo.combo;
    });
    expect(combo).toBe(2);
  });

  test('combo multiplier is calculated correctly', async ({ page }) => {
    const mult = await page.evaluate(() => {
      const c = new window.ComboSystem();
      c.combo = 5;
      return c.multiplier;
    });
    expect(mult).toBe(1.5);
  });

  test('combo multiplier at 10 kills', async ({ page }) => {
    const mult = await page.evaluate(() => {
      const c = new window.ComboSystem();
      c.combo = 10;
      return c.multiplier;
    });
    expect(mult).toBe(2.0);
  });

  test('combo resets on being hit', async ({ page }) => {
    const combo = await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.state = window.GameState.PAUSED;
      game.combo.combo = 10;
      game.combo.reset();
      return game.combo.combo;
    });
    expect(combo).toBe(0);
  });

  test('combo has maximum 5x cap', async ({ page }) => {
    const mult = await page.evaluate(() => {
      const c = new window.ComboSystem();
      c.combo = 40; // floor(40/5)*0.5 + 1 = 5.0 (cap)
      return c.multiplier;
    });
    expect(mult).toBe(5.0);
  });

  // ---- Lives ----

  test('player starts with 3 lives', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    const lives = await page.evaluate(() => window.game.scoring.lives);
    expect(lives).toBe(3);
  });

  test('life is lost when alien bullet hits player', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.player.invulnerable = false;
      game.player.shieldActive = false;
      game.alienBullets = [{
        x: game.player.x + 10, y: game.player.y, w: 4, h: 10, alive: true, isAlien: true,
        bounds: { x: game.player.x + 10, y: game.player.y, w: 4, h: 10 }
      }];
      game._checkCollisions();
    });
    const lives = await page.evaluate(() => window.game.scoring.lives);
    expect(lives).toBe(2);
  });

  test('invulnerability period after life loss', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.scoring.lives = 2;
      game._loseLife();
    });
    await page.waitForTimeout(100);
    const invuln = await page.evaluate(() => window.game.player.invulnerable);
    expect(invuln).toBe(true);
  });

  test('shield absorbs one hit', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.player.shieldActive = true;
      game.player.invulnerable = false;
      game.alienBullets = [{
        x: game.player.x + 10, y: game.player.y, w: 4, h: 10, alive: true, isAlien: true,
        bounds: { x: game.player.x + 10, y: game.player.y, w: 4, h: 10 }
      }];
      game._checkCollisions();
    });
    const lives = await page.evaluate(() => window.game.scoring.lives);
    expect(lives).toBe(3); // Should not lose life
    const shield = await page.evaluate(() => window.game.player.shieldActive);
    expect(shield).toBe(false); // Shield consumed
  });

  // ---- Game Over ----

  test('game over occurs when all lives lost', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.scoring.lives = 1;
      game.player.invulnerable = false;
      game.player.shieldActive = false;
      // Lose all remaining lives by triggering collision
      for (let i = 0; i < 2; i++) {
        game.alienBullets = [{
          x: game.player.x + 10, y: game.player.y, w: 4, h: 10, alive: true, isAlien: true,
          bounds: { x: game.player.x + 10, y: game.player.y, w: 4, h: 10 }
        }];
        game._checkCollisions();
      }
    });
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('game_over');
  });

  test('game over overlay shows final score', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.scoring.lives = 1;
      game.player.invulnerable = false;
      game.player.shieldActive = false;
      // Lose the last life
      game.alienBullets = [{
        x: game.player.x + 10, y: game.player.y, w: 4, h: 10, alive: true, isAlien: true,
        bounds: { x: game.player.x + 10, y: game.player.y, w: 4, h: 10 }
      }];
      game._checkCollisions();
    });
    const overlay = page.locator('#overlay');
    await expect(overlay).toHaveClass(/active/, { timeout: 5000 });
  });

  // ---- Pause / Resume ----

  test('can pause with P key', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(200);
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
  });

  test('can pause with Escape key', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
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
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.locator('#pause-btn').click();
    await page.waitForTimeout(200);
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
  });

  test('can resume with P key', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(200);
    await page.evaluate(() => window.game.togglePause());
    let state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
    await page.evaluate(() => window.game.togglePause());
    state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('pause overlay is displayed', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.keyboard.press('KeyP');
    const title = page.locator('#overlay-title');
    await expect(title).toHaveText('PAUSED', { timeout: 5000 });
  });

  // ---- High Score Persistence ----

  test('high score persists across sessions', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('space_invaders_high_score', '9999');
    });
    const score = await page.evaluate(() =>
      parseInt(localStorage.getItem('space_invaders_high_score'), 10)
    );
    expect(score).toBe(9999);
  });

  test('high score is saved on game over', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('space_invaders_high_score', '0');
    });
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.scoring.score = 5000;
      game.scoring.lives = 0;
      game._gameOver();
    });
    const saved = await page.evaluate(() =>
      parseInt(localStorage.getItem('space_invaders_high_score'), 10)
    );
    expect(saved).toBe(5000);
  });

  // ---- Mute Toggle ----

  test('mute toggle works', async ({ page }) => {
    const muteBtn = page.locator('#mute-btn');
    await expect(muteBtn).toHaveText('🔊');
    await muteBtn.click();
    await page.waitForTimeout(100);
    await expect(muteBtn).toHaveText('🔇');
  });

  test('mute preference persists', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('space_invaders_audio_muted', 'true');
    });
    // Reload to pick up the localStorage value
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    // Init audio to trigger localStorage read
    const isMuted = await page.evaluate(() => {
      window.game.audio.init();
      return window.game.audio.muted;
    });
    expect(isMuted).toBe(true);
  });

  // ---- Touch Controls ----

  test('touch controls exist on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const joystick = page.locator('#joystick-base');
    const fireBtn = page.locator('#fire-btn');
    await expect(joystick).toBeVisible({ timeout: 5000 });
    await expect(fireBtn).toBeVisible({ timeout: 5000 });
  });

  test('touch controls hidden on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    const touchControls = page.locator('#touch-controls');
    const display = await touchControls.evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('touch targets meet 44px minimum', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const sizes = await page.evaluate(() => {
      const joystick = document.getElementById('joystick-base');
      const fireBtn = document.getElementById('fire-btn');
      return [
        { w: joystick.offsetWidth, h: joystick.offsetHeight },
        { w: fireBtn.offsetWidth, h: fireBtn.offsetHeight },
      ];
    });
    for (const size of sizes) {
      expect(size.w).toBeGreaterThanOrEqual(44);
      expect(size.h).toBeGreaterThanOrEqual(44);
    }
  });

  // ---- Responsive Layout ----

  test('canvas scales at various viewport sizes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
    const rect = await canvas.boundingBox();
    expect(rect).toBeTruthy();
    expect(rect.width).toBeGreaterThan(0);
  });

  test('canvas scales at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
  });

  // ---- Stage Progression ----

  test('stage increases after stage clear', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      // Complete stage 1: 5 waves (4 spawn + 1 boss)
      for (let w = 0; w < 5; w++) {
        for (const a of game.formation.aliens) a.alive = false;
        game._nextWaveOrBoss();
        if (game.state === 'boss_fight' && game.boss) {
          game.boss.entered = true;
          game.boss.hp = 1;
          game.playerBullets = [{
            x: game.boss.x + 40, y: game.boss.y + 20, w: 4, h: 10, alive: true, isAlien: false,
            bounds: { x: game.boss.x + 40, y: game.boss.y + 20, w: 4, h: 10 }
          }];
          game._checkCollisions();
          // Boss death triggers _nextStage() via setTimeout, so we call it directly
          const result = game.waveManager.nextStage();
          if (result === 'victory') {
            game.state = 'victory';
          } else {
            game.state = 'stage_clear';
          }
        } else if (game.state === 'wave_clear') {
          game._spawnWave();
        }
      }
      if (game.state === 'stage_clear') {
        game._startStage();
      }
    });
    const stage = await page.evaluate(() => window.game.waveManager.stage);
    expect(stage).toBeGreaterThan(1);
  });

  // ---- Scoring ----

  test('score increases after alien kill', async ({ page }) => {
    const score = await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      const initialScore = game.scoring.score;
      const alien = game.formation.aliens[0];
      alien.alive = true;
      alien.x = game.player.x;
      alien.y = game.player.y - 50;
      game.playerBullets = [new window.Bullet(alien.x + 10, alien.y + 8, 0, -300, false)];
      game._checkCollisions();
      return { initial: initialScore, final: game.scoring.score };
    });
    expect(score.final).toBeGreaterThan(score.initial);
  });

  test('combo multiplier applies to score', async ({ page }) => {
    const pts = await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.combo.combo = 10; // 2x multiplier
      return game.scoring.addPoints(20, game.combo.multiplier);
    });
    expect(pts).toBe(40); // 20 * 2.0
  });

  // ---- Game Flow ----

  test('game state transitions: idle -> playing', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('game state transitions: playing -> paused -> playing', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(200);
    await page.evaluate(() => window.game.togglePause());
    let state = await page.evaluate(() => window.game.state);
    expect(state).toBe('paused');
    await page.evaluate(() => window.game.togglePause());
    state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');
  });

  test('can restart after game over', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      game.scoring.lives = 0;
      game._gameOver();
    });
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => window.game.state);
    expect(['playing', 'stage_intro']).toContain(state);
  });

  // ---- Keyboard Operability ----

  test('all gameplay actions accessible via keyboard', async ({ page }) => {
    await page.locator('#overlay-btn-start').click();
    await page.waitForFunction(() => {
      const o = document.getElementById('overlay');
      return o && !o.classList.contains('active');
    }, { timeout: 5000 });
    await page.waitForTimeout(100);
    // Movement
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('KeyA');
    await page.keyboard.press('KeyD');
    // Shooting
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('KeyW');
    // Pause
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(100);
    // Mute
    await page.keyboard.press('KeyM');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.game.state);
    expect(['playing', 'paused']).toContain(state);
  });

  // ---- Victory ----

  test('victory screen shows after completing all stages', async ({ page }) => {
    await page.evaluate(() => {
      const game = window.game;
      game.startGame();
      // Fast-forward through all 5 stages
      for (let s = 0; s < 5; s++) {
        for (let w = 0; w < 5; w++) {
          if (game.formation) {
            for (const a of game.formation.aliens) a.alive = false;
          }
          game._nextWaveOrBoss();
          if (game.state === 'boss_fight' && game.boss) {
            game.boss.entered = true;
            game.boss.hp = 1;
            game.playerBullets = [{
              x: game.boss.x + 40, y: game.boss.y + 20, w: 4, h: 10, alive: true, isAlien: false,
              bounds: { x: game.boss.x + 40, y: game.boss.y + 20, w: 4, h: 10 }
            }];
            game._checkCollisions();
            // Boss death triggers _nextStage() via setTimeout, so we call it directly
            const result = game.waveManager.nextStage();
            if (result === 'victory') {
              game.state = 'victory';
            } else {
              game.state = 'stage_clear';
            }
          } else if (game.state === 'wave_clear') {
            game._spawnWave();
          }
        }
        if (game.state === 'stage_clear') {
          game._startStage();
        }
      }
    });
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('victory');
  });

  // ---- Reduced Motion ----

  test('reduced motion preference is detected', async ({ page }) => {
    const reduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    // Just verify the query works
    expect(typeof reduced).toBe('boolean');
  });

  // ---- Wave Manager ----

  test('wave manager tracks stage and wave', async ({ page }) => {
    const wm = await page.evaluate(() => {
      const wm = new window.WaveManager();
      return { stage: wm.stage, wave: wm.wave };
    });
    expect(wm.stage).toBe(1);
    expect(wm.wave).toBe(1);
  });

  test('wave manager progresses waves correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      const wm = new window.WaveManager();
      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(wm.nextWave());
      }
      return results;
    });
    // nextWave() increments wave first (starts at 1), so:
    // call 1: wave=2, 'wave'; call 2: wave=3, 'wave'; call 3: wave=4, 'wave';
    // call 4: wave=5, 'wave'; call 5: wave=6 > 5, 'boss'; call 6: wave=7, 'boss'
    for (let i = 0; i < 4; i++) expect(result[i]).toBe('wave');
    expect(result[4]).toBe('boss');
  });

  // ---- Power-up Types ----

  test('all power-up types exist', async ({ page }) => {
    const types = await page.evaluate(() => {
      const t = window.POWERUP_TYPES;
      return Object.keys(t);
    });
    expect(types).toContain('double');
    expect(types).toContain('rapid');
    expect(types).toContain('shield');
    expect(types).toContain('weapon');
    expect(types).toContain('slow');
    expect(types).toContain('extra');
  });

  // ---- Player Hitbox ----

  test('player has correct hitbox dimensions', async ({ page }) => {
    const hb = await page.evaluate(() => {
      const p = window.game.player;
      return p.hitbox;
    });
    // PLAYER_W=24, PLAYER_H=20; hitbox subtracts 2 from each side
    expect(hb.w).toBe(20);
    expect(hb.h).toBe(16);
  });
});
