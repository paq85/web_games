// River system - manages conveyor movement and drowning checks

import { LANE_TYPES, LANES } from './lane.js';
import { checkCollision } from './collision.js';

export class RiverSystem {
  constructor() {
    this.riverRows = LANES
      .filter(l => l.type === LANE_TYPES.RIVER)
      .map(l => l.row);
  }

  /**
   * Check if a given row is in the river.
   */
  isRiverRow(row) {
    return this.riverRows.includes(row);
  }

  /**
   * Check if the frog is on a platform.
   * Returns the platform object or null.
   */
  findPlatform(frogBounds, obstacles) {
    const riverObstacles = obstacles.filter(
      o => this.isRiverRow(o.row) && o.visible !== false
    );

    for (const obs of riverObstacles) {
      if (checkCollision(frogBounds, obs.getBounds())) {
        return obs;
      }
    }
    return null;
  }

  /**
   * Check if the frog is drowning (in river, not on platform).
   */
  isDrowning(frogRow, frogBounds, obstacles) {
    if (!this.isRiverRow(frogRow)) return false;
    return this.findPlatform(frogBounds, obstacles) === null;
  }

  /**
   * Apply conveyor movement to the frog based on the platform it's on.
   * Returns the horizontal pixels moved.
   */
  applyConveyor(frog, frogBounds, obstacles, delta, cellSize) {
    const platform = this.findPlatform(frogBounds, obstacles);

    if (platform) {
      frog.isOnPlatform = true;
      if (frog.platformId !== platform.id) {
        frog.platformId = platform.id;
      }
      const pixelsMoved = platform.direction * platform.speed * cellSize * delta;
      frog.applyConveyor(pixelsMoved, cellSize);
      return pixelsMoved;
    } else {
      frog.isOnPlatform = false;
      frog.platformId = null;
      return 0;
    }
  }

  /**
   * Check if the frog was carried off-screen by a platform.
   */
  isOffScreen(frog, canvasWidth, cellSize) {
    const pos = frog.getPixelPosition(cellSize);
    return pos.x < -cellSize * 0.5 || pos.x > canvasWidth + cellSize * 0.5;
  }
}
