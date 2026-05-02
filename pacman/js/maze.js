// === Maze Data & Management ===
import { COLS, ROWS, TILE } from './constants.js';

// Classic Pacman maze layout (28x31)
// 0=empty, 1=wall, 2=dot, 3=power_pellet, 4=ghost_house, 5=ghost_door, 6=tunnel
const MAZE_TEMPLATE = [
  // Row 0
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // Row 1
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  // Row 2
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  // Row 3
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  // Row 4
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  // Row 5
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  // Row 6
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  // Row 7
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  // Row 8
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  // Row 9
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  // Row 10
  [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
  // Row 11
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  // Row 12
  [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
  // Row 13
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  // Row 14
  [6,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,6],
  // Row 15
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  // Row 16
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  // Row 17
  [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
  // Row 18
  [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
  // Row 19
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  // Row 20
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  // Row 21
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  // Row 22
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  // Row 23
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  // Row 24
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  // Row 25
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  // Row 26
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  // Row 27
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  // Row 28
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  // Row 29
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  // Row 30
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export class Maze {
  constructor() {
    this.grid = [];
    this.totalDots = 0;
    this.dotsEaten = 0;
    this.reset();
  }

  reset() {
    this.grid = MAZE_TEMPLATE.map(row => [...row]);
    this.totalDots = 0;
    this.dotsEaten = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.grid[y][x] === TILE.DOT || this.grid[y][x] === TILE.POWER_PELLET) {
          this.totalDots++;
        }
      }
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return TILE.EMPTY;
    return this.grid[y][x];
  }

  isWall(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
    const tile = this.grid[y][x];
    return tile === TILE.WALL || tile === TILE.GHOST_HOUSE;
  }

  isWalkable(x, y, isGhost = false) {
    if (y < 0 || y >= ROWS) return false;
    // Handle tunnel wrapping
    if (x < 0 || x >= COLS) {
      return this.grid[y] && (this.grid[y][0] === TILE.TUNNEL || this.grid[y][COLS - 1] === TILE.TUNNEL);
    }
    const tile = this.grid[y][x];
    if (tile === TILE.WALL) return false;
    if (tile === TILE.GHOST_HOUSE) return isGhost;
    if (tile === TILE.GHOST_DOOR) return isGhost;
    return true;
  }

  eatDot(x, y) {
    const tile = this.grid[y][x];
    if (tile === TILE.DOT || tile === TILE.POWER_PELLET) {
      this.grid[y][x] = TILE.EMPTY;
      this.dotsEaten++;
      return tile;
    }
    return null;
  }

  getRemainingDots() {
    return this.totalDots - this.dotsEaten;
  }

  isLevelComplete() {
    return this.dotsEaten >= this.totalDots;
  }

  getPowerPelletPositions() {
    const positions = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.grid[y][x] === TILE.POWER_PELLET) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  getDotPositions() {
    const positions = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.grid[y][x] === TILE.DOT) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }
}

export function getMazeTemplate() {
  return MAZE_TEMPLATE;
}
