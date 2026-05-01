// Renderer - draws all game elements on canvas

import { LANE_TYPES, LANES } from './lane.js';
import { DIRECTIONS } from './frog.js';

// Color palette
const COLORS = {
  road: '#2d2d2d',
  roadLine: '#444444',
  river: '#1a3a5c',
  riverWave: '#1e4470',
  safeZone: '#1a3a1a',
  homeZone: '#2a4a2a',
  spawn: '#1a3a1a',
  frog: '#00ff88',
  frogDark: '#00cc6a',
  car1: '#ff4444',
  car2: '#ffcc00',
  car3: '#4488ff',
  truck1: '#ff6633',
  truck2: '#8844cc',
  bulldozer: '#885522',
  log: '#664422',
  logLight: '#886633',
  turtle: '#33aa55',
  turtleShell: '#228844',
  turtleDiving: '#556655',
  ladybug: '#ff3333',
  ladybugSpot: '#222222',
  homeFrog: '#00ff88',
  homeEmpty: '#1a4a1a',
  homeBonus: '#ffcc00',
  hudText: '#ffffff',
  hudTextDim: '#888888',
  timerSafe: '#00ff88',
  timerDanger: '#ff4444',
  deathFlash: '#ff0000',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = 40;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.deathTimer = 0;
    this.deathType = null; // 'road' or 'river'
    this.levelCompleteTimer = 0;
    this.levelCompleteStartTime = 0;
    this.idleAnimPhase = 0;
    this.reducedMotion = false;
  }

  /**
   * Resize canvas and recalculate cell size.
   */
  resize(maxWidth, maxHeight) {
    const ctx = this.ctx;

    // Get the container size
    const container = this.canvas.parentElement || document.body;
    const containerWidth = Math.min(maxWidth, container.clientWidth - 20);
    const containerHeight = Math.min(maxHeight, container.clientHeight - 120);

    // Calculate cell size to fit 15 columns
    const cellSize = Math.floor(containerWidth / 15);
    this.cellSize = Math.max(20, Math.min(cellSize, Math.floor(containerHeight / 13)));

    this.canvasWidth = this.cellSize * 15;
    this.canvasHeight = this.cellSize * 13;

    // Set display size
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.canvas.style.width = this.canvasWidth + 'px';
    this.canvas.style.height = this.canvasHeight + 'px';
  }

  /**
   * Draw the background zones.
   */
  drawBackground() {
    const ctx = this.ctx;
    const cs = this.cellSize;

    for (const lane of LANES) {
      const y = (lane.row - 1) * cs;

      switch (lane.type) {
        case LANE_TYPES.ROAD:
          ctx.fillStyle = COLORS.road;
          ctx.fillRect(0, y, this.canvasWidth, cs);
          // Road lane markings
          ctx.strokeStyle = COLORS.roadLine;
          ctx.lineWidth = 1;
          ctx.setLineDash([cs / 4, cs / 4]);
          ctx.beginPath();
          ctx.moveTo(0, y + cs);
          ctx.lineTo(this.canvasWidth, y + cs);
          ctx.stroke();
          ctx.setLineDash([]);
          break;

        case LANE_TYPES.RIVER:
          ctx.fillStyle = COLORS.river;
          ctx.fillRect(0, y, this.canvasWidth, cs);
          // Water wave effect
          ctx.fillStyle = COLORS.riverWave;
          const waveOffset = (Date.now() / 500) % (cs * 2);
          for (let wx = -cs * 2 + (waveOffset % (cs * 2)); wx < this.canvasWidth + cs; wx += cs * 2) {
            ctx.fillRect(wx, y + cs * 0.3, cs * 0.4, 2);
            ctx.fillRect(wx + cs, y + cs * 0.6, cs * 0.4, 2);
          }
          break;

        case LANE_TYPES.SAFE:
        case LANE_TYPES.SPAWN:
          ctx.fillStyle = COLORS.safeZone;
          ctx.fillRect(0, y, this.canvasWidth, cs);
          break;

        case LANE_TYPES.HOME:
          ctx.fillStyle = COLORS.homeZone;
          ctx.fillRect(0, y, this.canvasWidth, cs);
          break;
      }
    }
  }

  /**
   * Draw home slots.
   */
  drawHomeSlots(homeSlots) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const y = 0; // row 1

    for (const slot of homeSlots.slots) {
      const x = slot.cols[0] * cs;
      const w = slot.cols.length * cs;

      if (slot.filled) {
        // Filled slot with frog
        ctx.fillStyle = COLORS.homeEmpty;
        ctx.fillRect(x, y, w, cs);
        this.drawFrogSprite(x + cs * 0.5, y + cs * 0.5, cs, DIRECTIONS.UP, COLORS.homeFrog);
      } else if (slot.hasBonus) {
        // Bonus slot (blinking)
        const blink = Math.sin(Date.now() / 200) > 0;
        ctx.fillStyle = blink ? COLORS.homeBonus : COLORS.homeEmpty;
        ctx.fillRect(x, y, w, cs);
        // Draw bonus icon (star)
        if (blink) {
          this.drawStar(x + cs, y + cs * 0.5, cs * 0.3, COLORS.homeBonus);
        }
      } else {
        // Empty slot
        ctx.fillStyle = COLORS.homeEmpty;
        ctx.fillRect(x, y, w, cs);
        ctx.strokeStyle = '#3a6a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, w - 4, cs - 4);
      }
    }
  }

  /**
   * Draw a star shape.
   */
  drawStar(cx, cy, size, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw obstacles (vehicles, logs, turtles).
   */
  drawObstacles(obstacles) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    for (const obs of obstacles) {
      if (obs.visible === false) continue;

      const bounds = obs.getBounds();
      const padding = cs * 0.1;

      switch (obs.type) {
        case 'car':
          this.drawCar(bounds.x + padding, bounds.y + padding,
            bounds.width - padding * 2, bounds.height - padding * 2);
          break;
        case 'truck':
          this.drawTruck(bounds.x + padding, bounds.y + padding,
            bounds.width - padding * 2, bounds.height - padding * 2);
          break;
        case 'bulldozer':
          this.drawBulldozer(bounds.x + padding, bounds.y + padding,
            bounds.width - padding * 2, bounds.height - padding * 2);
          break;
        case 'log':
          this.drawLog(bounds.x + padding, bounds.y + padding,
            bounds.width - padding * 2, bounds.height - padding * 2);
          break;
        case 'turtle':
          this.drawTurtle(bounds.x + padding, bounds.y + padding,
            bounds.width - padding * 2, bounds.height - padding * 2, obs);
          break;
      }

      // Draw ladybug if present
      if (obs.ladybug && obs.ladybug.active) {
        const bob = this.reducedMotion ? 0 : Math.sin(Date.now() / 300 + (obs.ladybug.bobPhase || 0)) * 3;
        this.drawLadybug(
          obs.x + obs.width / 2 - cs * 0.15,
          obs.y - cs * 0.2 + bob,
          cs * 0.3
        );
      }
    }
  }

  /**
   * Draw a car.
   */
  drawCar(x, y, w, h) {
    const ctx = this.ctx;
    const colors = [COLORS.car1, COLORS.car2, COLORS.car3];
    ctx.fillStyle = colors[Math.floor(Math.abs(x) / 100) % 3];
    this.roundRect(x, y, w, h, h * 0.25);
    ctx.fill();
    // Windshield
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(x + w * 0.6, y + h * 0.2, w * 0.2, h * 0.6);
    // Wheels
    ctx.fillStyle = '#222';
    ctx.fillRect(x + w * 0.1, y - 2, w * 0.15, 4);
    ctx.fillRect(x + w * 0.7, y - 2, w * 0.15, 4);
    ctx.fillRect(x + w * 0.1, y + h - 2, w * 0.15, 4);
    ctx.fillRect(x + w * 0.7, y + h - 2, w * 0.15, 4);
  }

  /**
   * Draw a truck.
   */
  drawTruck(x, y, w, h) {
    const ctx = this.ctx;
    const colors = [COLORS.truck1, COLORS.truck2];
    ctx.fillStyle = colors[Math.floor(Math.abs(x) / 150) % 2];
    this.roundRect(x, y, w, h, h * 0.2);
    ctx.fill();
    // Cab
    ctx.fillStyle = '#333';
    ctx.fillRect(x + w * 0.7, y + h * 0.1, w * 0.25, h * 0.8);
    // Windshield
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(x + w * 0.75, y + h * 0.2, w * 0.15, h * 0.4);
    // Wheels
    ctx.fillStyle = '#222';
    ctx.fillRect(x + w * 0.05, y - 2, w * 0.12, 4);
    ctx.fillRect(x + w * 0.4, y - 2, w * 0.12, 4);
    ctx.fillRect(x + w * 0.75, y - 2, w * 0.12, 4);
    ctx.fillRect(x + w * 0.05, y + h - 2, w * 0.12, 4);
    ctx.fillRect(x + w * 0.4, y + h - 2, w * 0.12, 4);
    ctx.fillRect(x + w * 0.75, y + h - 2, w * 0.12, 4);
  }

  /**
   * Draw a bulldozer.
   */
  drawBulldozer(x, y, w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.bulldozer;
    this.roundRect(x, y, w, h, h * 0.15);
    ctx.fill();
    // Track lines
    ctx.strokeStyle = '#553311';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    // Blade
    ctx.fillStyle = '#aa8844';
    ctx.fillRect(x + (ctx.canvas?.width > 0 ? 0 : w * 0.8), y + h * 0.1, w * 0.15, h * 0.8);
  }

  /**
   * Draw a log.
   */
  drawLog(x, y, w, h) {
    const ctx = this.ctx;
    // Main log body
    ctx.fillStyle = COLORS.log;
    this.roundRect(x, y, w, h, h * 0.3);
    ctx.fill();
    // Log texture
    ctx.strokeStyle = COLORS.logLight;
    ctx.lineWidth = 1;
    for (let lx = x + w * 0.2; lx < x + w * 0.8; lx += w * 0.2) {
      ctx.beginPath();
      ctx.moveTo(lx, y + 2);
      ctx.lineTo(lx, y + h - 2);
      ctx.stroke();
    }
    // End circles
    ctx.fillStyle = COLORS.logLight;
    ctx.beginPath();
    ctx.ellipse(x + 3, y + h / 2, 3, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 3, y + h / 2, 3, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw turtles.
   */
  drawTurtle(x, y, w, h, obs) {
    const ctx = this.ctx;

    if (obs.isDiving) {
      // Submerged turtles - show shells
      ctx.fillStyle = COLORS.turtleDiving;
      const turtleW = w / 3;
      for (let i = 0; i < 3; i++) {
        const tx = x + i * turtleW + turtleW * 0.1;
        const ty = y + h * 0.15;
        const tw = turtleW * 0.8;
        const th = h * 0.7;
        ctx.beginPath();
        ctx.ellipse(tx + tw / 2, ty + th / 2, tw / 2, th / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Surface turtles
      const turtleW = w / 3;
      for (let i = 0; i < 3; i++) {
        const tx = x + i * turtleW;
        // Shell
        ctx.fillStyle = COLORS.turtleShell;
        ctx.beginPath();
        ctx.ellipse(tx + turtleW / 2, y + h / 2, turtleW * 0.4, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // Shell pattern
        ctx.fillStyle = COLORS.turtle;
        ctx.beginPath();
        ctx.ellipse(tx + turtleW / 2, y + h / 2, turtleW * 0.25, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = COLORS.turtle;
        ctx.beginPath();
        ctx.arc(
          tx + (obs.direction > 0 ? turtleW * 0.85 : turtleW * 0.15),
          y + h / 2,
          turtleW * 0.12, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  /**
   * Draw a ladybug.
   */
  drawLadybug(x, y, size) {
    const ctx = this.ctx;
    // Body
    ctx.fillStyle = COLORS.ladybug;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    // Spots
    ctx.fillStyle = COLORS.ladybugSpot;
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.65, y + size * 0.45, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.15, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw the frog.
   */
  drawFrog(frog) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    if (frog.isDead) return;

    const pos = frog.getPixelPosition(cs);
    this.drawFrogSprite(pos.x + cs / 2, pos.y + cs / 2, cs, frog.direction, COLORS.frog);
  }

  /**
   * Draw a frog sprite at given position.
   */
  drawFrogSprite(cx, cy, size, direction, color) {
    const ctx = this.ctx;
    const s = size * 0.8;
    const half = s / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Rotate based on direction
    switch (direction) {
      case DIRECTIONS.LEFT:
        ctx.rotate(-Math.PI / 2);
        break;
      case DIRECTIONS.RIGHT:
        ctx.rotate(Math.PI / 2);
        break;
      case DIRECTIONS.DOWN:
        ctx.rotate(Math.PI);
        break;
    }

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, half * 0.6, half * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Darker center
    ctx.fillStyle = COLORS.frogDark;
    ctx.beginPath();
    ctx.ellipse(0, 0, half * 0.35, half * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-half * 0.25, -half * 0.45, half * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(half * 0.25, -half * 0.45, half * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-half * 0.25, -half * 0.5, half * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(half * 0.25, -half * 0.5, half * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    // Back legs
    ctx.beginPath();
    ctx.moveTo(-half * 0.5, half * 0.2);
    ctx.lineTo(-half * 0.7, half * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(half * 0.5, half * 0.2);
    ctx.lineTo(half * 0.7, half * 0.5);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw death effect.
   */
  drawDeathEffect() {
    const ctx = this.ctx;
    const elapsed = Date.now() - this.deathStartTime;
    const duration = 500;

    if (elapsed > duration) return;

    const progress = elapsed / duration;

    if (this.deathType === 'river') {
      // Splash effect
      ctx.fillStyle = `rgba(100, 180, 255, ${1 - progress})`;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = progress * 30;
        const x = this.deathX + Math.cos(angle) * radius;
        const y = this.deathY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(x, y, 4 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }
      // Center splash
      ctx.fillStyle = `rgba(150, 200, 255, ${1 - progress})`;
      ctx.beginPath();
      ctx.arc(this.deathX, this.deathY, 15 * (1 + progress), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Road death - red flash
      ctx.fillStyle = `rgba(255, 0, 0, ${0.5 * (1 - progress)})`;
      ctx.fillRect(this.deathX - 20, this.deathY - 20, 40, 40);

      // X mark
      ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
      ctx.lineWidth = 3;
      const s = 15 * (1 + progress * 0.5);
      ctx.beginPath();
      ctx.moveTo(this.deathX - s, this.deathY - s);
      ctx.lineTo(this.deathX + s, this.deathY + s);
      ctx.moveTo(this.deathX + s, this.deathY - s);
      ctx.lineTo(this.deathX - s, this.deathY + s);
      ctx.stroke();
    }
  }

  /**
   * Draw the HUD (score, lives, level, timer).
   */
  drawHUD(scoring, timer) {
    const ctx = this.ctx;
    // HUD is drawn outside canvas in HTML, but we draw the timer bar here
  }

  /**
   * Draw timer bar.
   */
  drawTimerBar(x, y, width, height, timer) {
    const ctx = this.ctx;
    const ratio = timer.getRatio();

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);

    // Timer fill
    ctx.fillStyle = timer.isDanger() ? COLORS.timerDanger : COLORS.timerSafe;
    ctx.fillRect(x, y, width * ratio, height);

    // Border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  /**
   * Draw idle screen.
   */
  drawIdleScreen() {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const cs = this.cellSize;

    // Title
    ctx.fillStyle = COLORS.frog;
    ctx.font = `bold ${cs * 1.5}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('FROGGER', w / 2, h * 0.25);

    // Subtitle
    ctx.fillStyle = COLORS.hudTextDim;
    ctx.font = `${cs * 0.6}px 'Courier New', monospace`;
    ctx.fillText('TRAFFIC & RIVER CROSSING', w / 2, h * 0.33);

    // Animated frog
    this.idleAnimPhase += 0.05;
    const idleY = h * 0.55 + Math.sin(this.idleAnimPhase) * 5;
    this.drawFrogSprite(w / 2, idleY, cs * 2, DIRECTIONS.UP, COLORS.frog);

    // Instructions
    ctx.fillStyle = COLORS.hudText;
    ctx.font = `${cs * 0.5}px 'Courier New', monospace`;
    ctx.fillText('Arrow Keys / WASD to move', w / 2, h * 0.75);
    ctx.fillText('Space / Enter to start', w / 2, h * 0.82);

    // High score
    ctx.fillStyle = COLORS.hudTextDim;
    ctx.font = `${cs * 0.45}px 'Courier New', monospace`;
  }

  /**
   * Draw paused overlay.
   */
  drawPausedOverlay() {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = `bold ${this.cellSize * 1.2}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', w / 2, h / 2 - this.cellSize);

    ctx.font = `${this.cellSize * 0.5}px 'Courier New', monospace`;
    ctx.fillText('Press P or Escape to resume', w / 2, h / 2 + this.cellSize * 0.5);
  }

  /**
   * Draw game over overlay.
   */
  drawGameOverOverlay(score, highScore) {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ff4444';
    ctx.font = `bold ${this.cellSize * 1.2}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', w / 2, h * 0.3);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = `${this.cellSize * 0.6}px 'Courier New', monospace`;
    ctx.fillText(`Score: ${score}`, w / 2, h * 0.45);
    ctx.fillText(`High Score: ${highScore}`, w / 2, h * 0.55);

    ctx.fillStyle = COLORS.hudTextDim;
    ctx.font = `${this.cellSize * 0.45}px 'Courier New', monospace`;
    ctx.fillText('Press Space or Enter to restart', w / 2, h * 0.75);
  }

  /**
   * Draw level complete overlay with staggered frog animation.
   */
  drawLevelCompleteOverlay(level) {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const cs = this.cellSize;

    // Track start time for animation
    if (!this.levelCompleteStartTime) {
      this.levelCompleteStartTime = Date.now();
    }

    const elapsed = Date.now() - this.levelCompleteStartTime;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 50, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    // Title text at top
    ctx.fillStyle = COLORS.frog;
    ctx.font = `bold ${cs * 1}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level} COMPLETE!`, w / 2, h * 0.2);

    // Animate frog icons filling home slots with stagger
    const staggerMs = 200;
    const animateDuration = 400; // ms for each frog to fully appear

    // Home row is row 1 (y=0), home slots are roughly at columns 2-4, 6-8, 10-12 (1-indexed)
    const homeSlotPositions = [
      { cols: [2, 3, 4] },
      { cols: [6, 7, 8] },
      { cols: [10, 11, 12] },
    ];

    for (let i = 0; i < homeSlotPositions.length; i++) {
      const slotDelay = i * staggerMs;
      const frogElapsed = elapsed - slotDelay;

      if (frogElapsed <= 0) continue;

      // Scale and alpha based on elapsed time for this frog
      const progress = Math.min(frogElapsed / animateDuration, 1);
      const scale = progress;
      const alpha = progress;

      const slotCols = homeSlotPositions[i].cols;
      const centerX = ((slotCols[0] + slotCols[slotCols.length - 1]) / 2) * cs;
      const centerY = cs * 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawFrogSprite(centerX, centerY, cs * scale, DIRECTIONS.UP, COLORS.homeFrog);
      ctx.restore();
    }
  }

  /**
   * Utility: draw a rounded rectangle.
   */
  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
