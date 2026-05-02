// === Renderer (Canvas) ===
import { COLS, ROWS, TILE_SIZE, TILE, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, GHOST_STATE, PELLET_BLINK_SPEED } from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.frameCount = 0;
    this.crtEnabled = true;
    this.particlesEnabled = true;
    this.screenShakeEnabled = true;
    this.shakeAmount = 0;
    this.shakeTimer = 0;
  }

  clear() {
    this.ctx.fillStyle = COLORS.BLACK;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  beginFrame() {
    this.frameCount++;
    this.ctx.save();

    // Screen shake
    if (this.shakeTimer > 0 && this.screenShakeEnabled) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      this.ctx.translate(sx, sy);
      this.shakeTimer--;
    }
  }

  endFrame() {
    this.ctx.restore();
    if (this.crtEnabled) {
      this._drawCRT();
    }
  }

  shake(amount, duration) {
    if (!this.screenShakeEnabled) return;
    this.shakeAmount = amount;
    this.shakeTimer = duration;
  }

  drawMaze(maze) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = maze.getTile(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        switch (tile) {
          case TILE.WALL:
            this._drawWall(x, y, maze);
            break;
          case TILE.DOT:
            this._drawDot(px, py);
            break;
          case TILE.POWER_PELLET:
            this._drawPowerPellet(px, py);
            break;
          case TILE.GHOST_DOOR:
            this.ctx.fillStyle = COLORS.GHOST_DOOR;
            this.ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
            break;
        }
      }
    }
  }

  _drawWall(x, y, maze) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const ctx = this.ctx;

    ctx.fillStyle = COLORS.WALL;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Draw border lines for wall edges
    ctx.strokeStyle = COLORS.WALL_BORDER;
    ctx.lineWidth = 2;

    const isWall = (tx, ty) => {
      if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
      const t = maze.getTile(tx, ty);
      return t === TILE.WALL;
    };

    // Draw rounded borders on non-wall adjacent sides
    if (!isWall(x, y - 1)) {
      ctx.beginPath();
      ctx.moveTo(px + 2, py + 2);
      ctx.lineTo(px + TILE_SIZE - 2, py + 2);
      ctx.stroke();
    }
    if (!isWall(x, y + 1)) {
      ctx.beginPath();
      ctx.moveTo(px + 2, py + TILE_SIZE - 2);
      ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE - 2);
      ctx.stroke();
    }
    if (!isWall(x - 1, y)) {
      ctx.beginPath();
      ctx.moveTo(px + 2, py + 2);
      ctx.lineTo(px + 2, py + TILE_SIZE - 2);
      ctx.stroke();
    }
    if (!isWall(x + 1, y)) {
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE - 2, py + 2);
      ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE - 2);
      ctx.stroke();
    }
  }

  _drawDot(px, py) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.DOT;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawPowerPellet(px, py) {
    // Blinking power pellet
    if (Math.floor(this.frameCount / PELLET_BLINK_SPEED) % 2 === 0) {
      const ctx = this.ctx;
      ctx.fillStyle = COLORS.POWER_PELLET;
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPacman(pacman) {
    if (!pacman.alive) {
      this._drawPacmanDeath(pacman);
      return;
    }

    const ctx = this.ctx;
    const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
    const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 1;
    const angle = pacman.getAngle();
    const mouthAngle = pacman.mouthOpen * 0.4; // Max mouth opening

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    ctx.fillStyle = COLORS.PACMAN;
    ctx.beginPath();
    ctx.arc(0, 0, radius, mouthAngle, Math.PI * 2 - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawPacmanDeath(pacman) {
    const ctx = this.ctx;
    const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
    const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 1;
    const progress = Math.min(pacman.deathFrame / 60, 1);
    const startAngle = Math.PI * progress;
    const endAngle = Math.PI * 2 - Math.PI * progress;

    if (progress < 1) {
      ctx.fillStyle = COLORS.PACMAN;
      ctx.beginPath();
      ctx.arc(px, py, radius, startAngle, endAngle);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawGhost(ghost) {
    const ctx = this.ctx;
    const px = ghost.x * TILE_SIZE + TILE_SIZE / 2;
    const py = ghost.y * TILE_SIZE + TILE_SIZE / 2;
    const size = TILE_SIZE / 2 - 1;

    let color;
    if (ghost.state === GHOST_STATE.FRIGHTENED) {
      if (ghost.flashing && Math.floor(this.frameCount / 8) % 2 === 0) {
        color = COLORS.FRIGHTENED_FLASH;
      } else {
        color = COLORS.FRIGHTENED;
      }
    } else if (ghost.state === GHOST_STATE.EATEN) {
      // Just draw eyes
      this._drawGhostEyes(px, py, ghost.dir);
      return;
    } else {
      color = ghost.color;
    }

    // Ghost body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py - 2, size, Math.PI, 0);
    ctx.lineTo(px + size, py + size - 2);
    // Wavy bottom
    const wave = Math.sin(this.frameCount * 0.3) * 2;
    for (let i = size; i >= -size; i -= size / 2) {
      const wy = py + size - 2 + (i % 2 === 0 ? wave : -wave);
      ctx.lineTo(px + i, wy);
    }
    ctx.closePath();
    ctx.fill();

    // Eyes
    if (ghost.state !== GHOST_STATE.FRIGHTENED) {
      this._drawGhostEyes(px, py, ghost.dir);
    } else {
      // Frightened face
      this._drawFrightenedFace(px, py);
    }
  }

  _drawGhostEyes(px, py, dir) {
    const ctx = this.ctx;
    const eyeOffset = 3;
    const pupilOffset = dir ? { x: dir.x * 2, y: dir.y * 2 } : { x: 0, y: 0 };

    // White of eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(px - eyeOffset, py - 3, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + eyeOffset, py - 3, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#0000FF';
    ctx.beginPath();
    ctx.arc(px - eyeOffset + pupilOffset.x, py - 3 + pupilOffset.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + eyeOffset + pupilOffset.x, py - 3 + pupilOffset.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawFrightenedFace(px, py) {
    const ctx = this.ctx;
    // Simple dot eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(px - 3, py - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 3, py - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Wavy mouth
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 5, py + 3);
    for (let i = -5; i <= 5; i += 2) {
      ctx.lineTo(px + i, py + 3 + (i % 4 === 0 ? -2 : 2));
    }
    ctx.stroke();
  }

  drawFruit(fruit) {
    if (!fruit || !fruit.active) return;
    const ctx = this.ctx;
    const px = fruit.x * TILE_SIZE + TILE_SIZE / 2;
    const py = fruit.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.fillStyle = fruit.color;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#00AA00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py - 6);
    ctx.lineTo(px + 2, py - 9);
    ctx.stroke();
  }

  drawHUD(score, highScore, lives, level) {
    const ctx = this.ctx;
    ctx.font = '12px "Courier New", monospace';

    // Score
    ctx.fillStyle = COLORS.SCORE;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 8, 12);

    // High score
    ctx.fillStyle = COLORS.HIGH_SCORE_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText(`HIGH SCORE: ${highScore}`, CANVAS_WIDTH / 2, 12);

    // Lives (Pacman icons)
    for (let i = 0; i < lives - 1; i++) {
      const lx = 20 + i * 20;
      const ly = CANVAS_HEIGHT - 10;
      ctx.fillStyle = COLORS.PACMAN;
      ctx.beginPath();
      ctx.arc(lx, ly, 6, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(lx, ly);
      ctx.closePath();
      ctx.fill();
    }

    // Level
    ctx.fillStyle = COLORS.HUD;
    ctx.textAlign = 'right';
    ctx.fillText(`LVL ${level}`, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 6);
  }

  drawScore(x, y, points) {
    const ctx = this.ctx;
    ctx.fillStyle = '#00FFFF';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(points.toString(), x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
  }

  drawReady() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.READY;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('READY!', CANVAS_WIDTH / 2, 17 * TILE_SIZE + TILE_SIZE / 2);
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.GAME_OVER;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME  OVER', CANVAS_WIDTH / 2, 17 * TILE_SIZE + TILE_SIZE / 2);
  }

  drawPaused() {
    const ctx = this.ctx;
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.READY;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = COLORS.MENU_TEXT;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  }

  drawMenu(selectedIndex, items) {
    const ctx = this.ctx;
    this.clear();

    // Title
    ctx.fillStyle = COLORS.PACMAN;
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAC-MAN', CANVAS_WIDTH / 2, 80);

    // Pacman icon
    const iconY = 120;
    ctx.fillStyle = COLORS.PACMAN;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, iconY, 20, 0.3, Math.PI * 2 - 0.3);
    ctx.lineTo(CANVAS_WIDTH / 2, iconY);
    ctx.closePath();
    ctx.fill();

    // Menu items
    const startY = 180;
    const lineHeight = 30;
    items.forEach((item, i) => {
      if (i === selectedIndex) {
        ctx.fillStyle = COLORS.MENU_HIGHLIGHT;
        ctx.fillText('> ' + item + ' <', CANVAS_WIDTH / 2, startY + i * lineHeight);
      } else {
        ctx.fillStyle = COLORS.MENU_TEXT;
        ctx.fillText(item, CANVAS_WIDTH / 2, startY + i * lineHeight);
      }
    });

    // Footer
    ctx.fillStyle = COLORS.MENU_DIM;
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('Arrow keys to navigate, Enter to select', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  drawDifficultySelect(selectedIndex) {
    const ctx = this.ctx;
    this.clear();

    ctx.fillStyle = COLORS.PACMAN;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT DIFFICULTY', CANVAS_WIDTH / 2, 80);

    const items = ['Easy', 'Medium', 'Hard'];
    const descriptions = [
      'Slower ghosts, longer power-ups',
      'Standard Pac-Man challenge',
      'Faster ghosts, shorter power-ups',
    ];
    const startY = 160;
    const lineHeight = 50;

    items.forEach((item, i) => {
      const y = startY + i * lineHeight;
      if (i === selectedIndex) {
        ctx.fillStyle = COLORS.MENU_HIGHLIGHT;
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('> ' + item + ' <', CANVAS_WIDTH / 2, y);
      } else {
        ctx.fillStyle = COLORS.MENU_TEXT;
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(item, CANVAS_WIDTH / 2, y);
      }
      ctx.fillStyle = COLORS.MENU_DIM;
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(descriptions[i], CANVAS_WIDTH / 2, y + 18);
    });

    ctx.fillStyle = COLORS.MENU_DIM;
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('ESC to go back', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  drawGameOverScreen(score, highScore, isNewHigh) {
    const ctx = this.ctx;
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    ctx.fillStyle = COLORS.GAME_OVER;
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 100);

    if (isNewHigh) {
      ctx.fillStyle = COLORS.PACMAN;
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 140);
    }

    ctx.fillStyle = COLORS.SCORE;
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 180);
    ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, 210);

    ctx.fillStyle = COLORS.MENU_HIGHLIGHT;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('Press ENTER to play again', CANVAS_WIDTH / 2, 280);
    ctx.fillStyle = COLORS.MENU_DIM;
    ctx.fillText('Press ESC for menu', CANVAS_WIDTH / 2, 310);
  }

  drawHighScores(scores) {
    const ctx = this.ctx;
    this.clear();

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.PACMAN;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('HIGH SCORES', CANVAS_WIDTH / 2, 50);

    ctx.font = '12px "Courier New", monospace';
    const startY = 100;
    const lineHeight = 25;

    if (scores.length === 0) {
      ctx.fillStyle = COLORS.MENU_DIM;
      ctx.fillText('No scores yet!', CANVAS_WIDTH / 2, startY);
    } else {
      scores.slice(0, 10).forEach((entry, i) => {
        ctx.fillStyle = i === 0 ? COLORS.PACMAN : COLORS.MENU_TEXT;
        const rank = `${i + 1}.`.padStart(3);
        const pts = entry.score.toString().padStart(8);
        const lvl = `LVL ${entry.level}`;
        ctx.fillText(`${rank} ${pts}  ${lvl}`, CANVAS_WIDTH / 2, startY + i * lineHeight);
      });
    }

    ctx.fillStyle = COLORS.MENU_DIM;
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('Press ESC to go back', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  drawSettings(settings, selectedIndex, items) {
    const ctx = this.ctx;
    this.clear();

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.PACMAN;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('SETTINGS', CANVAS_WIDTH / 2, 50);

    const startY = 100;
    const lineHeight = 30;

    items.forEach((item, i) => {
      const y = startY + i * lineHeight;
      const isSelected = i === selectedIndex;
      ctx.fillStyle = isSelected ? COLORS.MENU_HIGHLIGHT : COLORS.MENU_TEXT;
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, 60, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.value, CANVAS_WIDTH - 60, y);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.MENU_DIM;
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('Up/Down to navigate, Left/Right to change', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    ctx.fillText('ESC to go back', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  drawLevelComplete(flashOn) {
    if (flashOn) {
      // Flash maze white
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  drawPowerUpTimer(remainingTime, totalTime) {
    if (remainingTime <= 0) return;
    const ctx = this.ctx;
    const barWidth = 100;
    const barHeight = 4;
    const x = (CANVAS_WIDTH - barWidth) / 2;
    const y = CANVAS_HEIGHT - 18;
    const fill = remainingTime / totalTime;

    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = fill > 0.3 ? COLORS.FRIGHTENED : COLORS.FRIGHTENED_FLASH;
    ctx.fillRect(x, y, barWidth * fill, barHeight);
  }

  _drawCRT() {
    const ctx = this.ctx;
    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    }
    // Vignette
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  resizeToFit() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const maxW = container.clientWidth;
    const maxH = container.clientHeight;
    const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT, 2);

    this.canvas.style.width = Math.floor(CANVAS_WIDTH * scale) + 'px';
    this.canvas.style.height = Math.floor(CANVAS_HEIGHT * scale) + 'px';
  }
}
