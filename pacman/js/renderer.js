import { COLORS, TILE } from './constants.js';
import { getGhostVisualMode } from './ghosts.js';
import { isInGhostHouse } from './maze.js';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function entityPosition(entity) {
  return {
    x: lerp(entity.from.x, entity.to.x, entity.stepProgress),
    y: lerp(entity.from.y, entity.to.y, entity.stepProgress)
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class PacmanRenderer {
  constructor(canvas, settings = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.settings = settings;
    this.dpr = 1;
    this.layout = {
      tileSize: 24,
      offsetX: 0,
      offsetY: 0,
      boardWidth: 0,
      boardHeight: 0
    };
    this.elapsed = 0;
    this.lastClientWidth = 0;
    this.lastClientHeight = 0;
    this.lastMazeKey = '';
  }

  updateSettings(settings) {
    this.settings = settings;
  }

  resize(maze) {
    if (!maze) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || this.canvas.clientWidth || 1);
    const height = Math.max(1, rect.height || this.canvas.clientHeight || 1);
    if (width === this.lastClientWidth && height === this.lastClientHeight && this.lastMazeKey === `${maze.width}x${maze.height}`) {
      return;
    }
    this.lastClientWidth = width;
    this.lastClientHeight = height;
    this.lastMazeKey = `${maze.width}x${maze.height}`;
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pixelWidth = Math.floor(width * this.dpr);
    const pixelHeight = Math.floor(height * this.dpr);
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    const tileSize = Math.floor(Math.min(pixelWidth / maze.width, pixelHeight / maze.height));
    const boardWidth = tileSize * maze.width;
    const boardHeight = tileSize * maze.height;
    this.layout = {
      tileSize,
      offsetX: Math.floor((pixelWidth - boardWidth) / 2),
      offsetY: Math.floor((pixelHeight - boardHeight) / 2),
      boardWidth,
      boardHeight
    };
  }

  render(state, dt = 16) {
    if (!state || !state.maze) {
      return;
    }
    this.elapsed += dt;
    this.resize(state.maze);
    const ctx = this.ctx;
    const { width, height, grid } = state.maze;
    const tileSize = this.layout.tileSize;
    const offsetX = this.layout.offsetX;
    const offsetY = this.layout.offsetY;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    this.drawBackdrop(ctx);
    this.drawMaze(ctx, grid, width, height, offsetX, offsetY, tileSize, state);
    this.drawFruit(ctx, state, offsetX, offsetY, tileSize);
    this.drawGhosts(ctx, state, offsetX, offsetY, tileSize);
    this.drawPacman(ctx, state, offsetX, offsetY, tileSize);
    this.drawOverlayEffects(ctx, state);
    ctx.restore();
    this.canvas.setAttribute('aria-label', `Pacman game board, level ${state.level}, score ${state.score}, ${state.phase}`);
  }

  drawBackdrop(ctx) {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#050713');
    gradient.addColorStop(0.5, '#02030a');
    gradient.addColorStop(1, '#060812');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (this.settings.crtOverlay && !this.settings.reduceEffects) {
      ctx.fillStyle = 'rgba(61, 101, 255, 0.05)';
      for (let line = 0; line < height; line += 4) {
        ctx.fillRect(0, line, width, 1);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, 0, width, 2);
    }
  }

  drawMaze(ctx, grid, width, height, offsetX, offsetY, tileSize, state) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const tile = grid[y][x];
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;
        if (tile === TILE.WALL) {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.fillStyle = COLORS.wallGlow;
          ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
          continue;
        }
        if (tile === TILE.DOOR) {
          ctx.fillStyle = COLORS.door;
          ctx.fillRect(px + tileSize * 0.2, py + tileSize * 0.42, tileSize * 0.6, tileSize * 0.18);
          continue;
        }
        if (tile === TILE.HOUSE) {
          ctx.fillStyle = 'rgba(94, 113, 196, 0.15)';
          ctx.fillRect(px, py, tileSize, tileSize);
          continue;
        }
        if (tile === TILE.GHOST) {
          ctx.fillStyle = 'rgba(135, 155, 255, 0.12)';
          ctx.fillRect(px, py, tileSize, tileSize);
        }
        if (tile === TILE.PATH || tile === TILE.START || tile === TILE.EMPTY) {
          const pulse = this.settings.reduceMotion ? 0 : 0.5 + 0.5 * Math.sin((this.elapsed + x * 60 + y * 40) / 500);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
          ctx.fillRect(px, py, tileSize, tileSize);
          if (tile === TILE.START) {
            ctx.fillStyle = 'rgba(255, 217, 77, 0.1)';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
          }
          if (tile === TILE.PATH) {
            ctx.beginPath();
            ctx.fillStyle = COLORS.pellet;
            ctx.arc(px + tileSize / 2, py + tileSize / 2, clamp(tileSize * 0.12, 1.8, 3.2), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (tile === TILE.POWER) {
          const pulse = this.settings.reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(this.elapsed / 130);
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 241, 165, ${pulse})`;
          ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.24, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (state.frightenedTimer > 0 && !this.settings.reduceEffects) {
      ctx.fillStyle = 'rgba(67, 104, 255, 0.08)';
      ctx.fillRect(offsetX, offsetY, width * tileSize, height * tileSize);
    }
  }

  drawFruit(ctx, state, offsetX, offsetY, tileSize) {
    if (!state.fruit) {
      return;
    }
    const fruit = state.fruit;
    const px = offsetX + fruit.x * tileSize;
    const py = offsetY + fruit.y * tileSize;
    const symbolSize = Math.max(12, tileSize * 0.52);
    ctx.save();
    ctx.translate(px + tileSize / 2, py + tileSize / 2);
    ctx.fillStyle = fruit.data.color;
    ctx.beginPath();
    ctx.arc(0, 0, tileSize * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fruit.data.accent;
    ctx.beginPath();
    ctx.arc(-tileSize * 0.12, -tileSize * 0.12, tileSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.fruitText;
    ctx.font = `700 ${symbolSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fruit.data.symbol, 0, 1);
    ctx.restore();
  }

  drawPacman(ctx, state, offsetX, offsetY, tileSize) {
    const pacman = state.pacman;
    const pos = entityPosition(pacman);
    const px = offsetX + pos.x * tileSize + tileSize / 2;
    const py = offsetY + pos.y * tileSize + tileSize / 2;
    const radius = tileSize * 0.42;
    const mouth = state.phase === 'paused' || state.phase === 'countdown'
      ? 0.08
      : (this.settings.reduceMotion ? 0.16 : 0.22 + 0.12 * Math.abs(Math.sin(this.elapsed / 90)));
    const direction = pacman.direction || pacman.bufferedDirection || 'right';
    const angleMap = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    const angle = angleMap[direction] ?? 0;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = COLORS.pacman;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, mouth * Math.PI, (2 - mouth) * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawGhosts(ctx, state, offsetX, offsetY, tileSize) {
    for (const ghost of state.ghosts) {
      const pos = entityPosition(ghost);
      const px = offsetX + pos.x * tileSize + tileSize / 2;
      const py = offsetY + pos.y * tileSize + tileSize / 2;
      const mode = getGhostVisualMode(ghost);
      const bodyColor = mode === 'frightened' || mode === 'frightened-blink' ? COLORS.frightened : ghost.color;
      const shouldBlink = mode === 'frightened-blink';
      const isEaten = ghost.mode === 'eaten';
      ctx.save();
      ctx.translate(px, py);
      if (isEaten) {
        this.drawGhostEyes(ctx, tileSize * 0.85, true);
        ctx.restore();
        continue;
      }
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(-tileSize * 0.35, tileSize * 0.25);
      ctx.arc(0, -tileSize * 0.05, tileSize * 0.35, Math.PI, 0, false);
      ctx.lineTo(tileSize * 0.35, tileSize * 0.28);
      for (let index = 0; index < 4; index += 1) {
        const waveX = tileSize * 0.35 - (index * tileSize * 0.175);
        const waveY = tileSize * 0.28 + (index % 2 === 0 ? 0 : tileSize * 0.08);
        ctx.lineTo(waveX, waveY);
      }
      ctx.closePath();
      ctx.fill();

      if (!shouldBlink) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-tileSize * 0.12, -tileSize * 0.04, tileSize * 0.1, 0, Math.PI * 2);
        ctx.arc(tileSize * 0.12, -tileSize * 0.04, tileSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a2b66';
        ctx.beginPath();
        ctx.arc(-tileSize * 0.12, -tileSize * 0.01, tileSize * 0.05, 0, Math.PI * 2);
        ctx.arc(tileSize * 0.12, -tileSize * 0.01, tileSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#fff7d7';
        ctx.beginPath();
        ctx.arc(-tileSize * 0.12, -tileSize * 0.04, tileSize * 0.06, 0, Math.PI * 2);
        ctx.arc(tileSize * 0.12, -tileSize * 0.04, tileSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      this.drawGhostEyes(ctx, tileSize, false, shouldBlink);
      ctx.restore();
    }
  }

  drawGhostEyes(ctx, tileSize, eaten = false, frightenedBlink = false) {
    ctx.fillStyle = '#ffffff';
    const eyeRadius = tileSize * (eaten ? 0.07 : 0.09);
    ctx.beginPath();
    ctx.arc(-tileSize * 0.12, -tileSize * 0.04, eyeRadius, 0, Math.PI * 2);
    ctx.arc(tileSize * 0.12, -tileSize * 0.04, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = frightenedBlink ? '#f7f1d6' : '#2341a8';
    ctx.beginPath();
    ctx.arc(-tileSize * 0.1, -tileSize * 0.02, eyeRadius * 0.45, 0, Math.PI * 2);
    ctx.arc(tileSize * 0.14, -tileSize * 0.02, eyeRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOverlayEffects(ctx, state) {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    if (state.phase === 'paused') {
      ctx.fillStyle = 'rgba(4, 6, 18, 0.45)';
      ctx.fillRect(0, 0, width, height);
    }
    if (state.powerFlash > 0 && !this.settings.reduceEffects) {
      ctx.fillStyle = 'rgba(255, 241, 165, 0.08)';
      ctx.fillRect(0, 0, width, height);
    }
    if (this.settings.crtOverlay && !this.settings.reduceEffects) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let index = 0; index < height; index += 7) {
        ctx.beginPath();
        ctx.moveTo(0, index + 0.5);
        ctx.lineTo(width, index + 0.5);
        ctx.stroke();
      }
    }
  }
}
