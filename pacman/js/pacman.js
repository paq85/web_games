// === Pacman Character ===
import { DIR, COLS, TILE, PACMAN_START, PACMAN_ANIM_SPEED, BASE_SPEED } from './constants.js';

export class Pacman {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = PACMAN_START.x;
    this.y = PACMAN_START.y;
    this.dir = DIR.NONE;
    this.nextDir = DIR.NONE;
    this.speed = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.mouthOpen = 0; // 0 to 1 (mouth angle)
    this.alive = true;
    this.deathFrame = 0;
    this.moving = false;
  }

  setSpeed(speedPercent) {
    this.speed = BASE_SPEED * speedPercent;
  }

  queueDirection(dir) {
    if (dir) {
      this.nextDir = dir;
    }
  }

  update(dt, maze) {
    if (!this.alive) return;

    // Try to change direction
    if (this.nextDir && this.nextDir !== this.dir) {
      if (this.canMove(this.nextDir, maze)) {
        this.dir = this.nextDir;
        // Snap to grid when turning
        this.x = Math.round(this.x * 2) / 2;
        this.y = Math.round(this.y * 2) / 2;
      }
    }

    // Move in current direction
    if (this.dir && this.canMove(this.dir, maze)) {
      const moveAmount = this.speed * dt;
      this.x += this.dir.x * moveAmount;
      this.y += this.dir.y * moveAmount;
      this.moving = true;

      // Handle tunnel wrapping
      if (this.x < -0.5) {
        this.x = COLS - 0.5;
      } else if (this.x >= COLS - 0.5) {
        this.x = -0.5;
      }

      // Snap to center of tile when passing through
      this.snapToGrid();
    } else {
      this.moving = false;
    }

    // Animation
    this.animTimer += dt;
    if (this.moving) {
      this.animFrame = (this.animFrame + 1) % (PACMAN_ANIM_SPEED * 2);
      this.mouthOpen = Math.abs(Math.sin(this.animTimer * 10));
    }
  }

  canMove(dir, maze) {
    if (!dir) return false;
    // Check the next tile in the given direction
    const nextX = Math.round(this.x + dir.x * 0.55);
    const nextY = Math.round(this.y + dir.y * 0.55);

    // Handle tunnel
    if (nextX < 0 || nextX >= COLS) return true;

    return maze.isWalkable(nextX, nextY, false);
  }

  snapToGrid() {
    // Snap to grid center when close enough (prevents floating point drift)
    if (this.dir) {
      if (this.dir.x !== 0) {
        // Moving horizontally, snap Y
        this.y = Math.round(this.y);
      }
      if (this.dir.y !== 0) {
        // Moving vertically, snap X
        this.x = Math.round(this.x);
      }
    }
  }

  getTileX() {
    return Math.round(this.x);
  }

  getTileY() {
    return Math.round(this.y);
  }

  getAngle() {
    if (!this.dir || this.dir === DIR.NONE) return 0;
    if (this.dir === DIR.RIGHT) return 0;
    if (this.dir === DIR.DOWN) return Math.PI / 2;
    if (this.dir === DIR.LEFT) return Math.PI;
    if (this.dir === DIR.UP) return -Math.PI / 2;
    return 0;
  }

  die() {
    this.alive = false;
    this.deathFrame = 0;
    this.moving = false;
  }
}
