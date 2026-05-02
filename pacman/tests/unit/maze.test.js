// === Maze Unit Tests ===
import { describe, it, expect, beforeEach } from 'vitest';
import { Maze } from '../../js/maze.js';
import { TILE, COLS, ROWS } from '../../js/constants.js';

describe('Maze', () => {
  let maze;

  beforeEach(() => {
    maze = new Maze();
  });

  it('initializes with correct dimensions', () => {
    expect(maze.grid.length).toBe(ROWS);
    expect(maze.grid[0].length).toBe(COLS);
  });

  it('counts total dots correctly', () => {
    expect(maze.totalDots).toBeGreaterThan(0);
    expect(maze.dotsEaten).toBe(0);
  });

  it('has power pellets', () => {
    const pellets = maze.getPowerPelletPositions();
    expect(pellets.length).toBe(4);
  });

  it('identifies walls correctly', () => {
    // Top-left corner is wall
    expect(maze.isWall(0, 0)).toBe(true);
    // Position (1,1) should be a dot (walkable)
    expect(maze.isWall(1, 1)).toBe(false);
  });

  it('identifies walkable tiles', () => {
    // A dot tile is walkable
    expect(maze.isWalkable(1, 1)).toBe(true);
    // A wall is not walkable
    expect(maze.isWalkable(0, 0)).toBe(false);
  });

  it('ghost house is walkable only for ghosts', () => {
    // Find a ghost house tile
    let ghostHousePos = null;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (maze.grid[y][x] === TILE.GHOST_HOUSE) {
          ghostHousePos = { x, y };
          break;
        }
      }
      if (ghostHousePos) break;
    }
    expect(ghostHousePos).not.toBeNull();
    expect(maze.isWalkable(ghostHousePos.x, ghostHousePos.y, false)).toBe(false);
    expect(maze.isWalkable(ghostHousePos.x, ghostHousePos.y, true)).toBe(true);
  });

  it('eats dots and tracks count', () => {
    // Find a dot position
    let dotPos = null;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (maze.grid[y][x] === TILE.DOT) {
          dotPos = { x, y };
          break;
        }
      }
      if (dotPos) break;
    }
    expect(dotPos).not.toBeNull();

    const result = maze.eatDot(dotPos.x, dotPos.y);
    expect(result).toBe(TILE.DOT);
    expect(maze.dotsEaten).toBe(1);
    expect(maze.grid[dotPos.y][dotPos.x]).toBe(TILE.EMPTY);
  });

  it('eating power pellet returns correct type', () => {
    const pellets = maze.getPowerPelletPositions();
    expect(pellets.length).toBeGreaterThan(0);
    const p = pellets[0];
    const result = maze.eatDot(p.x, p.y);
    expect(result).toBe(TILE.POWER_PELLET);
  });

  it('eating empty tile returns null', () => {
    // Eat dot first, then try again
    const pellets = maze.getPowerPelletPositions();
    const p = pellets[0];
    maze.eatDot(p.x, p.y);
    const result = maze.eatDot(p.x, p.y);
    expect(result).toBeNull();
  });

  it('detects level completion', () => {
    expect(maze.isLevelComplete()).toBe(false);
    // Eat all dots
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (maze.grid[y][x] === TILE.DOT || maze.grid[y][x] === TILE.POWER_PELLET) {
          maze.eatDot(x, y);
        }
      }
    }
    expect(maze.isLevelComplete()).toBe(true);
  });

  it('reset restores all dots', () => {
    // Eat some dots
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (maze.grid[y][x] === TILE.DOT) {
          maze.eatDot(x, y);
          break;
        }
      }
      break;
    }
    maze.reset();
    expect(maze.dotsEaten).toBe(0);
    expect(maze.totalDots).toBeGreaterThan(0);
  });

  it('out of bounds returns wall', () => {
    expect(maze.isWall(-1, 0)).toBe(true);
    expect(maze.isWall(COLS, 0)).toBe(true);
    expect(maze.isWall(0, -1)).toBe(true);
    expect(maze.isWall(0, ROWS)).toBe(true);
  });

  it('has tunnel tiles', () => {
    // Row 14 should have tunnel tiles at edges
    expect(maze.getTile(0, 14)).toBe(TILE.TUNNEL);
    expect(maze.getTile(27, 14)).toBe(TILE.TUNNEL);
  });
});
