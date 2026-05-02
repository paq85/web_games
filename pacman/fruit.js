/**
 * Pacman Bonus Fruit Module
 *
 * Handles bonus fruit spawning, rendering, collection, and particle effects.
 * Fruits appear near the maze center periodically and award bonus points.
 *
 * Expects a maze module that exports:
 *   MAZE_WIDTH, MAZE_HEIGHT
 *
 * Vanilla JS — ES module export.
 */

// ── Fruit type definitions ───────────────────────────────────────────────────

export const FRUIT_TYPES = [
  {
    name: 'cherry',
    points: 100,
    color: '#FF0000',
    levels: [1, 2],
  },
  {
    name: 'strawberry',
    points: 300,
    color: '#FF1493',
    levels: [3, 4],
  },
  {
    name: 'orange',
    points: 500,
    color: '#FF8C00',
    levels: [5, 6],
  },
  {
    name: 'apple',
    points: 700,
    color: '#FF0000',
    levels: [7, 8],
  },
  {
    name: 'melon',
    points: 1000,
    color: '#00CC00',
    levels: [9, 10],
  },
  {
    name: 'galaxy',
    points: 3000,
    color: '#FF69B4',
    levels: [11, 12, 13, 14, 15, 16],
  },
];

// ── Constants ────────────────────────────────────────────────────────────────

/** Grid position where fruit spawns (near maze center, below ghost house) */
const FRUIT_GRID_X = 14;
const FRUIT_GRID_Y = 19;

/** How long a fruit stays on screen before disappearing (seconds) */
const FRUIT_DISPLAY_TIME = 6;

/** Dots eaten thresholds for the 2 fruits per level */
const DOT_THRESHOLDS = [50, 170];

/** Maximum number of fruits that can appear per level */
const MAX_FRUITS_PER_LEVEL = 2;

/** Particle lifetime on collection (seconds) */
const PARTICLE_LIFETIME = 0.5;

// ── Fruit class ──────────────────────────────────────────────────────────────

export class Fruit {
  /**
   * @param {number} gridX - Grid column position
   * @param {number} gridY - Grid row position
   * @param {number} cellSize - Pixel size of one maze cell
   * @param {object} fruitType - Fruit type object from FRUIT_TYPES
   */
  constructor(gridX, gridY, cellSize, fruitType) {
    this.type = fruitType;
    this.gridX = gridX;
    this.gridY = gridY;
    this.cellSize = cellSize;
    this.pixelX = gridX * cellSize;
    this.pixelY = gridY * cellSize;
    this.active = true;
    this.timeRemaining = FRUIT_DISPLAY_TIME;
    this.collected = false;
    this.particles = [];
  }

  /** Advance timers and particles by dt seconds. */
  update(dt) {
    if (this.collected) {
      // Only update particles after collection
      this.particles = this.particles.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / PARTICLE_LIFETIME);
        return p.life > 0;
      });
      if (this.particles.length === 0) {
        this.active = false;
      }
    } else {
      this.timeRemaining -= dt;
    }
  }

  /** Mark fruit as collected and spawn particle burst. */
  collect() {
    if (this.collected) return;
    this.collected = true;
    this.timeRemaining = 0;

    const cx = this.pixelX + this.cellSize / 2;
    const cy = this.pixelY + this.cellSize / 2;
    const colors = [this.type.color, '#FFFFFF', '#FFFF00'];

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: PARTICLE_LIFETIME,
        alpha: 1,
        color: colors[i % colors.length],
        size: 2 + Math.random() * 2,
      });
    }
  }

  /** @returns {boolean} True if the fruit's display time has expired. */
  isExpired() {
    return !this.collected && this.timeRemaining <= 0;
  }

  /** @returns {boolean} True if the fruit has been collected. */
  isCollected() {
    return this.collected;
  }

  // ── Rendering ──────────────────────────────────────────────────────────

  /**
   * Render the fruit shape and any active particles.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} offsetX - Canvas X offset for maze origin
   * @param {number} offsetY - Canvas Y offset for maze origin
   * @param {number} cellSize - Pixel size of a maze cell
   * @param {number} time - Global elapsed time (ms)
   */
  render(ctx, offsetX, offsetY, _cellSize, time) {
    const cx = offsetX + this.pixelX + this.cellSize / 2;
    const cy = offsetY + this.pixelY + this.cellSize / 2;
    const s = this.cellSize;

    // Gentle bob animation
    const bob = Math.sin(time / 200) * 2;

    if (!this.collected) {
      ctx.save();
      ctx.translate(cx, cy + bob);

      // Draw fruit shape based on type
      switch (this.type.name) {
        case 'cherry':
          this._drawCherry(ctx, s);
          break;
        case 'strawberry':
          this._drawStrawberry(ctx, s);
          break;
        case 'orange':
          this._drawOrange(ctx, s);
          break;
        case 'apple':
          this._drawApple(ctx, s);
          break;
        case 'melon':
          this._drawMelon(ctx, s);
          break;
        case 'galaxy':
          this._drawGalaxy(ctx, s);
          break;
      }

      ctx.restore();
    }

    // Render particles (always, even after collection)
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(offsetX + p.x, offsetY + p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Pixel-art fruit shapes ─────────────────────────────────────────────

  _drawCherry(ctx, s) {
    const r = s * 0.25;
    const offset = s * 0.12;

    // Two red circles
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(-offset, r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(offset, r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(-offset - r * 0.3, r * 0.2, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(offset - r * 0.3, r * 0.2, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Green stems
    ctx.strokeStyle = '#00AA00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-offset, -r * 0.3);
    ctx.quadraticCurveTo(-offset * 0.5, -s * 0.35, 0, -s * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offset, -r * 0.3);
    ctx.quadraticCurveTo(offset * 0.5, -s * 0.35, 0, -s * 0.3);
    ctx.stroke();
  }

  _drawStrawberry(ctx, s) {
    const w = s * 0.2;
    const h = s * 0.3;

    // Red body (triangle-ish shape)
    ctx.fillStyle = '#FF1493';
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.quadraticCurveTo(w, -h * 0.2, w * 0.8, h * 0.5);
    ctx.quadraticCurveTo(0, h * 0.8, -w * 0.8, h * 0.5);
    ctx.quadraticCurveTo(-w, -h * 0.2, 0, -h);
    ctx.closePath();
    ctx.fill();

    // Green leafy top
    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.moveTo(-w * 0.7, -h * 0.6);
    ctx.quadraticCurveTo(-w, -h * 1.1, 0, -h * 0.8);
    ctx.quadraticCurveTo(w, -h * 1.1, w * 0.7, -h * 0.6);
    ctx.closePath();
    ctx.fill();

    // Yellow seeds
    ctx.fillStyle = '#FFFF00';
    const seeds = [
      [0, -h * 0.2],
      [-w * 0.4, h * 0.1],
      [w * 0.4, h * 0.1],
      [-w * 0.2, h * 0.4],
      [w * 0.2, h * 0.4],
    ];
    for (const [sx, sy] of seeds) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawOrange(ctx, s) {
    const r = s * 0.3;

    // Orange circle
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Texture dots
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Green leaf
    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.5, -r * 1.3, r * 0.3, -r * 1.1);
    ctx.quadraticCurveTo(r * 0.1, -r * 0.9, 0, -r);
    ctx.closePath();
    ctx.fill();
  }

  _drawApple(ctx, s) {
    const w = s * 0.22;
    const h = s * 0.25;

    // Red body
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.6);
    ctx.quadraticCurveTo(w, -h, w, -h * 0.1);
    ctx.quadraticCurveTo(w * 0.9, h * 0.7, 0, h * 0.6);
    ctx.quadraticCurveTo(-w * 0.9, h * 0.7, -w, -h * 0.1);
    ctx.quadraticCurveTo(-w, -h, 0, -h * 0.6);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(-w * 0.35, -h * 0.25, w * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Brown stem
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.6);
    ctx.lineTo(0, -h * 1.1);
    ctx.stroke();

    // Green leaf
    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.9);
    ctx.quadraticCurveTo(w * 0.6, -h * 1.3, w * 0.5, -h * 1.1);
    ctx.quadraticCurveTo(w * 0.3, -h * 0.9, 0, -h * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  _drawMelon(ctx, s) {
    const rx = s * 0.15;
    const ry = s * 0.3;

    // Green oval body
    ctx.fillStyle = '#00CC00';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Darker stripes
    ctx.fillStyle = '#008800';
    const stripePositions = [-rx * 0.5, 0, rx * 0.5];
    for (const sx of stripePositions) {
      ctx.beginPath();
      ctx.ellipse(sx, 0, rx * 0.15, ry * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.3, -ry * 0.4, rx * 0.3, ry * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawGalaxy(ctx, s) {
    const r = s * 0.25;

    // Outer glow
    ctx.fillStyle = 'rgba(255,105,180,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Planet body (pink/purple)
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Ring
    ctx.strokeStyle = '#DDA0DD';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.6, r * 0.4, -0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Star sparkles
    ctx.fillStyle = '#FFFFFF';
    const sparklePositions = [
      [r * 0.3, -r * 0.3],
      [-r * 0.4, r * 0.2],
      [r * 0.5, r * 0.4],
    ];
    for (const [sx, sy] of sparklePositions) {
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── FruitSpawner class ───────────────────────────────────────────────────────

export class FruitSpawner {
  constructor() {
    this.currentFruit = null;
    this.fruitsSpawned = 0;
    this.dotsEatenThreshold = DOT_THRESHOLDS[0];
  }

  /**
   * Get the fruit type that should appear at a given level.
   * @param {number} level - Current game level (1-indexed)
   * @returns {object} Fruit type object from FRUIT_TYPES
   */
  getFruitForLevel(level) {
    for (const ft of FRUIT_TYPES) {
      if (ft.levels.includes(level)) {
        return ft;
      }
    }
    // Default to galaxy for levels beyond defined range
    return FRUIT_TYPES[FRUIT_TYPES.length - 1];
  }

  /**
   * Check if a fruit should spawn based on dots eaten and level.
   * @param {number} dotsEaten - Total dots eaten in current level
   * @param {number} level - Current game level (1-indexed)
   * @param {number} cellSize - Pixel size of one maze cell
   * @returns {Fruit|null} New fruit if it should spawn, null otherwise
   */
  checkSpawn(dotsEaten, level, cellSize) {
    // Don't spawn if max fruits already appeared this level
    if (this.fruitsSpawned >= MAX_FRUITS_PER_LEVEL) {
      return null;
    }

    // Don't spawn if a fruit is already active and not expired/collected
    if (
      this.currentFruit &&
      !this.currentFruit.isExpired() &&
      !this.currentFruit.isCollected()
    ) {
      return null;
    }

    // Don't spawn if dots haven't reached the threshold
    if (dotsEaten < this.dotsEatenThreshold) {
      return null;
    }

    // Spawn the fruit
    const fruitType = this.getFruitForLevel(level);
    this.currentFruit = new Fruit(
      FRUIT_GRID_X,
      FRUIT_GRID_Y,
      cellSize,
      fruitType
    );
    this.fruitsSpawned++;

    // Set next threshold
    const nextIndex = this.fruitsSpawned;
    this.dotsEatenThreshold =
      nextIndex < DOT_THRESHOLDS.length
        ? DOT_THRESHOLDS[nextIndex]
        : Infinity;

    return this.currentFruit;
  }

  /** Reset spawner state for a new level. */
  resetForLevel(_level) {
    this.currentFruit = null;
    this.fruitsSpawned = 0;
    this.dotsEatenThreshold = DOT_THRESHOLDS[0];
  }

  /**
   * Remove the current fruit (after collection or expiration).
   * Call this once the fruit is no longer needed.
   */
  clearFruit() {
    this.currentFruit = null;
  }
}
