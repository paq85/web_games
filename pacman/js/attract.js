// === Attract (Demo) Mode ===
import { DIR, COLS, ROWS } from './constants.js';

export class AttractMode {
  constructor() {
    this.active = false;
    this.timer = 0;
    this.dirTimer = 0;
    this.currentDir = DIR.RIGHT;
  }

  start() {
    this.active = true;
    this.timer = 0;
    this.dirTimer = 0;
    this.currentDir = DIR.RIGHT;
  }

  stop() {
    this.active = false;
  }

  update(dt, pacman, maze) {
    if (!this.active) return null;

    this.timer += dt;
    this.dirTimer += dt;

    // Simple AI: change direction at intersections
    if (this.dirTimer > 0.3) {
      this.dirTimer = 0;
      const dir = this._chooseBestDirection(pacman, maze);
      if (dir) {
        this.currentDir = dir;
      }
    }

    return this.currentDir;
  }

  _chooseBestDirection(pacman, maze) {
    const tx = pacman.getTileX();
    const ty = pacman.getTileY();
    const directions = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

    // Filter walkable directions
    const valid = directions.filter(d => {
      const nx = tx + d.x;
      const ny = ty + d.y;
      return maze.isWalkable(nx, ny, false);
    });

    if (valid.length === 0) return this.currentDir;

    // Prefer directions toward nearest dot
    let bestDir = valid[0];
    let bestDist = Infinity;

    const dotPositions = maze.getDotPositions();
    if (dotPositions.length === 0) return valid[Math.floor(Math.random() * valid.length)];

    // Find nearest dot
    let nearestDot = dotPositions[0];
    let nearDist = Infinity;
    for (const dot of dotPositions) {
      const d = Math.abs(dot.x - tx) + Math.abs(dot.y - ty);
      if (d < nearDist) {
        nearDist = d;
        nearestDot = dot;
      }
    }

    // Choose direction toward nearest dot
    for (const d of valid) {
      const nx = tx + d.x;
      const ny = ty + d.y;
      const dist = Math.abs(nx - nearestDot.x) + Math.abs(ny - nearestDot.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }

    return bestDir;
  }
}
