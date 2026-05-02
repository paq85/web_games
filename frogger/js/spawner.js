// Obstacle spawner - creates initial obstacles for each lane

import { Obstacle } from './obstacle.js';
import { LANES } from './lane.js';

let _idCounter = 0;

export class ObstacleSpawner {
  constructor() {
    this.obstacles = [];
  }

  /**
   * Initialize obstacles for all lanes.
   */
  init(canvasWidth, cellSize) {
    this.obstacles = [];
    _idCounter = 0;

    for (const lane of LANES) {
      if (lane.obstacleType) {
        this.spawnLane(lane, canvasWidth, cellSize);
      }
    }
  }

  /**
   * Spawn obstacles for a single lane.
   */
  spawnLane(lane, canvasWidth, cellSize) {
    const count = lane.obstacleCount || 2;
    const width = (lane.obstacleWidth || 1) * cellSize;
    const height = cellSize;
    const y = (lane.row - 1) * cellSize;

    // Distribute obstacles evenly across the lane
    const totalWidth = count * width;
    const gap = Math.max(cellSize, (canvasWidth - totalWidth) / (count + 1));

    for (let i = 0; i < count; i++) {
      const x = gap + i * (width + gap);
      const obsId = `obs_${_idCounter++}`;
      const obs = new Obstacle({
        id: obsId,
        x,
        y,
        width,
        height,
        speed: lane.speed,
        direction: lane.direction,
        type: lane.obstacleType,
        row: lane.row,
        isDiver: lane.isDiver || false,
      });

      // Assign a fixed color index per obstacle so colors don't change while moving
      obs.colorIndex = Math.abs(obsId.charCodeAt(obsId.length - 1)) % 3;

      // Initialize turtle dive state — alternating lanes:
      // Row 4 turtles start at phase 0, row 6 turtles start at phase 1.5 (half interval)
      // so that when one lane dives, the other surfaces.
      if (lane.isDiver) {
        obs.diveCycle = lane.row === 4 ? 0 : 1.5;
        obs.diveInterval = 3;
        obs.isDiving = false;
      }

      // Ladybug on logs
      if (lane.hasLadybugs && Math.random() < 0.3) {
        obs.ladybug = {
          active: true,
          bobPhase: Math.random() * Math.PI * 2,
        };
      }

      this.obstacles.push(obs);
    }
  }

  /**
   * Get all obstacles for a given row.
   */
  getObstaclesForRow(row) {
    return this.obstacles.filter(o => o.row === row);
  }

  /**
   * Get all obstacles.
   */
  getAll() {
    return this.obstacles;
  }

  /**
   * Reset all obstacles to initial positions.
   */
  reset(canvasWidth, cellSize) {
    this.init(canvasWidth, cellSize);
  }

  /**
   * Increase speeds for next level.
   */
  increaseSpeeds(multiplier) {
    for (const obs of this.obstacles) {
      obs.speed *= multiplier;
      if (obs.isDiver) {
        obs.diveInterval *= 0.9;
        obs.diveInterval = Math.max(obs.diveInterval, 1);
      }
    }
  }
}
