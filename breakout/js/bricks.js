/**
 * Brick types and brick grid management
 */

export const BRICK_TYPES = {
  STANDARD: 'standard',
  REINFORCED: 'reinforced',
  UNBREAKABLE: 'unbreakable',
};

export const BRICK_COLORS = {
  // Row colors for standard bricks
  row: [
    '#ff0044', // row 0 - red
    '#ff8800', // row 1 - orange
    '#ffff00', // row 2 - yellow
    '#00ff88', // row 3 - green
    '#00ffff', // row 4 - cyan
    '#4488ff', // row 5 - blue
    '#ff00ff', // row 6 - magenta
    '#ff44aa', // row 7 - pink
  ],
  reinforced: '#888888',
  reinforcedDamaged: '#555555',
  unbreakable: '#333333',
};

export class Brick {
  constructor(x, y, width, height, type, hits) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.maxHits = hits;
    this.hits = hits;
    this.alive = true;
    this.color = this._getColor();
  }

  _getColor() {
    if (this.type === BRICK_TYPES.UNBREAKABLE) {
      return BRICK_COLORS.unbreakable;
    }
    if (this.type === BRICK_TYPES.REINFORCED) {
      return this.hits <= 1 ? BRICK_COLORS.reinforcedDamaged : BRICK_COLORS.reinforced;
    }
    return BRICK_COLORS.row[this.y % BRICK_COLORS.row.length] || BRICK_COLORS.row[0];
  }

  hit() {
    if (this.type === BRICK_TYPES.UNBREAKABLE) return false;
    this.hits--;
    if (this.hits <= 0) {
      this.alive = false;
      this.color = BRICK_COLORS.row[Math.floor(Math.random() * BRICK_COLORS.row.length)];
      return true; // destroyed
    }
    this.color = this._getColor();
    return false; // damaged but alive
  }

  getScore() {
    if (this.type === BRICK_TYPES.STANDARD) return 10;
    if (this.type === BRICK_TYPES.REINFORCED) return 20;
    return 0;
  }
}

/**
 * Brick grid - manages rows of bricks for a level
 */
export class BrickGrid {
  constructor(columns, rows, brickWidth, brickHeight, padding, offsetX, offsetY) {
    this.columns = columns;
    this.rows = rows;
    this.brickWidth = brickWidth;
    this.brickHeight = brickHeight;
    this.padding = padding;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.bricks = [];
  }

  /**
   * Create bricks from a pattern matrix.
   * Matrix values: 0=empty, 1=standard, 2=reinforced, 3=unbreakable
   */
  createFromMatrix(matrix) {
    this.bricks = [];
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        const val = matrix[r][c];
        if (val === 0) continue;
        const x = this.offsetX + c * (this.brickWidth + this.padding);
        const y = this.offsetY + r * (this.brickHeight + this.padding);
        let type = BRICK_TYPES.STANDARD;
        let hits = 1;
        if (val === 2) { type = BRICK_TYPES.REINFORCED; hits = 2; }
        if (val === 3) { type = BRICK_TYPES.UNBREAKABLE; hits = 999; }
        this.bricks.push(new Brick(x, y, this.brickWidth, this.brickHeight, type, hits));
      }
    }
  }

  getAliveCount() {
    return this.bricks.filter(b => b.alive).length;
  }

  getDestructibleCount() {
    return this.bricks.filter(b => b.alive && b.type !== BRICK_TYPES.UNBREAKABLE).length;
  }

  getAllDestructibleCount() {
    return this.bricks.filter(b => b.type !== BRICK_TYPES.UNBREAKABLE).length;
  }

  /**
   * Check ball collision with all alive bricks.
   * Returns the first brick hit and whether it was destroyed.
   */
  checkCollision(ball) {
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (ball.collidesWithRect(brick.x, brick.y, brick.width, brick.height)) {
        ball.bounceOffBrick(brick.x, brick.y, brick.width, brick.height);
        const destroyed = brick.hit();
        return { brick, destroyed };
      }
    }
    return null;
  }

  /**
   * Check if a laser projectile hits any brick.
   */
  checkLaserCollision(laserX, laserY, laserWidth, laserHeight) {
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (laserX < brick.x + brick.width &&
          laserX + laserWidth > brick.x &&
          laserY < brick.y + brick.height &&
          laserY + laserHeight > brick.y) {
        const destroyed = brick.hit();
        return { brick, destroyed };
      }
    }
    return null;
  }
}
