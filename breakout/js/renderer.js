/**
 * Canvas renderer - neon glow, themes, visual effects
 */

import { BRICK_COLORS, BRICK_TYPES } from './bricks.js';
import { POWERUP_CONFIG, POWERUP_TYPES } from './powerups.js';

const GLOW_VALUES = {
  low: 4,
  normal: 12,
  high: 20,
};

// Theme color overrides
const THEMES = {
  neon: {
    paddle: '#00ffff',
    ball: '#ffffff',
    bg: '#0a0a1a',
    bgGrid: 'rgba(0, 255, 136, 0.03)',
  },
  retro: {
    paddle: '#00ff41',
    ball: '#00ff41',
    bg: '#0a0a0a',
    bgGrid: 'rgba(0, 255, 65, 0.04)',
  },
  pastel: {
    paddle: '#88ddff',
    ball: '#ffffff',
    bg: '#1a1a2e',
    bgGrid: 'rgba(136, 221, 255, 0.03)',
  },
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.glowIntensity = 'normal';
    this.theme = 'neon';
    this.reducedFlash = false;
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';
  }

  setTheme(theme) {
    this.theme = THEMES[theme] ? theme : 'neon';
  }

  setGlowIntensity(intensity) {
    this.glowIntensity = GLOW_VALUES[intensity] ? intensity : 'normal';
  }

  get glow() {
    return GLOW_VALUES[this.glowIntensity] || 12;
  }

  get themeColors() {
    return THEMES[this.theme] || THEMES.neon;
  }

  /**
   * Trigger screen flash effect
   */
  flash(color, alpha = 0.15) {
    if (this.reducedFlash) return;
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  /**
   * Render the full game frame
   */
  render(paddle, balls, brickGrid, powerUps, lasers, particles, settings) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const theme = this.themeColors;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = theme.bgGrid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Bricks
    for (const brick of brickGrid.bricks) {
      if (!brick.alive) continue;
      this.renderBrick(ctx, brick);
    }

    // Power-ups
    for (const pu of powerUps) {
      if (!pu.alive) continue;
      this.renderPowerUp(ctx, pu);
    }

    // Lasers
    for (const laser of lasers) {
      if (!laser.alive) continue;
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = this.glow;
      ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    }
    ctx.shadowBlur = 0;

    // Paddle
    this.renderPaddle(ctx, paddle);

    // Balls
    for (const ball of balls) {
      if (!ball.alive) continue;
      this.renderBall(ctx, ball);
    }

    // Particles
    particles.render(ctx);

    // Flash overlay
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      this.flashAlpha *= 0.85;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }
  }

  renderBrick(ctx, brick) {
    const glow = this.glow;

    if (brick.type === BRICK_TYPES.UNBREAKABLE) {
      ctx.fillStyle = BRICK_COLORS.unbreakable;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#333';
      ctx.shadowBlur = 0;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
      // X mark
      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(brick.x + 4, brick.y + 4);
      ctx.lineTo(brick.x + brick.width - 4, brick.y + brick.height - 4);
      ctx.moveTo(brick.x + brick.width - 4, brick.y + 4);
      ctx.lineTo(brick.x + 4, brick.y + brick.height - 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = brick.color;
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = glow * 0.5;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 3);

      // Reinforced crack indicator
      if (brick.type === BRICK_TYPES.REINFORCED && brick.hits <= 1) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(brick.x + brick.width * 0.3, brick.y);
        ctx.lineTo(brick.x + brick.width * 0.5, brick.y + brick.height * 0.5);
        ctx.lineTo(brick.x + brick.width * 0.7, brick.y + brick.height);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
  }

  renderPaddle(ctx, paddle) {
    const theme = this.themeColors;
    ctx.fillStyle = theme.paddle;
    ctx.shadowColor = theme.paddle;
    ctx.shadowBlur = this.glow;

    // Rounded paddle
    const r = paddle.height / 2;
    ctx.beginPath();
    ctx.moveTo(paddle.x + r, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - r, paddle.y);
    ctx.arc(paddle.x + paddle.width - r, paddle.y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(paddle.x + r, paddle.y + paddle.height);
    ctx.arc(paddle.x + r, paddle.y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(paddle.x + 4, paddle.y + 1, paddle.width - 8, paddle.height / 3);

    ctx.shadowBlur = 0;
  }

  renderBall(ctx, ball) {
    const theme = this.themeColors;
    ctx.fillStyle = theme.ball;
    ctx.shadowColor = theme.ball;
    ctx.shadowBlur = this.glow;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(ball.x - 1, ball.y - 1, ball.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  renderPowerUp(ctx, pu) {
    const config = POWERUP_CONFIG[pu.type];
    if (!config) return;

    ctx.fillStyle = config.color;
    ctx.shadowColor = config.color;
    ctx.shadowBlur = this.glow * 0.6;

    // Rounded rectangle
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(pu.x + r, pu.y);
    ctx.lineTo(pu.x + pu.width - r, pu.y);
    ctx.arc(pu.x + pu.width - r, pu.y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(pu.x + r, pu.y + pu.height);
    ctx.arc(pu.x + r, pu.y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.symbol, pu.x + pu.width / 2, pu.y + pu.height / 2);

    ctx.shadowBlur = 0;
  }

  /**
   * Render attract/demo mode - simple animation
   */
  renderAttract(paddle, balls, brickGrid, powerUps, lasers, particles) {
    this.render(paddle, balls, brickGrid, powerUps, lasers, particles, {});

    // "PRESS TO START" text
    const ctx = this.ctx;
    const w = this.canvas.width;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = this.glow;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRESS TO START', w / 2, this.canvas.height / 2 + 60);
    ctx.shadowBlur = 0;
  }
}
