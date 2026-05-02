// === Ghost Base Class ===
import { DIR, COLS, ROWS, GHOST_STATE, GHOST_HOUSE, BASE_SPEED, SCATTER_TARGETS, MODE_TIMINGS } from './constants.js';

export class Ghost {
  constructor(name, color, startPos, scatterTarget) {
    this.name = name;
    this.color = color;
    this.startPos = startPos;
    this.scatterTarget = scatterTarget;
    this.reset();
  }

  reset() {
    this.x = this.startPos.x;
    this.y = this.startPos.y;
    this.dir = DIR.LEFT;
    this.nextDir = DIR.NONE;
    this.speed = 0;
    this.state = this.name === 'blinky' ? GHOST_STATE.SCATTER : GHOST_STATE.IN_HOUSE;
    this.frightenedTimer = 0;
    this.animFrame = 0;
    this.dotCounter = 0;
    this.released = this.name === 'blinky';
    this.flashing = false;
  }

  setSpeed(speedPercent) {
    this.speed = BASE_SPEED * speedPercent;
  }

  setState(state) {
    // Don't reverse if entering frightened from eaten
    const shouldReverse = (
      (this.state === GHOST_STATE.CHASE || this.state === GHOST_STATE.SCATTER) &&
      (state === GHOST_STATE.CHASE || state === GHOST_STATE.SCATTER || state === GHOST_STATE.FRIGHTENED)
    );
    this.state = state;
    if (shouldReverse && this.dir) {
      this.reverseDirection();
    }
  }

  reverseDirection() {
    if (this.dir === DIR.UP) this.dir = DIR.DOWN;
    else if (this.dir === DIR.DOWN) this.dir = DIR.UP;
    else if (this.dir === DIR.LEFT) this.dir = DIR.RIGHT;
    else if (this.dir === DIR.RIGHT) this.dir = DIR.LEFT;
  }

  frighten(duration) {
    if (this.state === GHOST_STATE.EATEN) return;
    if (this.state === GHOST_STATE.IN_HOUSE || this.state === GHOST_STATE.LEAVING_HOUSE) return;
    this.setState(GHOST_STATE.FRIGHTENED);
    this.frightenedTimer = duration;
    this.flashing = false;
  }

  eat() {
    this.state = GHOST_STATE.EATEN;
    this.flashing = false;
  }

  update(dt, maze, pacman, blinky) {
    if (this.state === GHOST_STATE.IN_HOUSE) {
      this._updateInHouse(dt);
      return;
    }

    if (this.state === GHOST_STATE.LEAVING_HOUSE) {
      this._updateLeavingHouse(dt, maze);
      return;
    }

    if (this.state === GHOST_STATE.FRIGHTENED) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.state = GHOST_STATE.SCATTER; // Will be corrected by game mode timer
        this.flashing = false;
      } else if (this.frightenedTimer < 2) {
        this.flashing = true;
      }
    }

    if (this.state === GHOST_STATE.EATEN) {
      this._updateEaten(dt, maze);
      return;
    }

    // Get target tile based on state and ghost personality
    const target = this.getTarget(pacman, blinky);

    // Move toward target
    this._move(dt, maze, target);
  }

  getTarget(pacman, blinky) {
    switch (this.state) {
      case GHOST_STATE.SCATTER:
        return this.scatterTarget;
      case GHOST_STATE.CHASE:
        return this.getChaseTarget(pacman, blinky);
      case GHOST_STATE.FRIGHTENED:
        // Random target (effectively random movement at intersections)
        return { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      default:
        return this.scatterTarget;
    }
  }

  // Override in subclasses
  getChaseTarget(pacman, blinky) {
    return { x: pacman.getTileX(), y: pacman.getTileY() };
  }

  _move(dt, maze, target) {
    const speed = this._getCurrentSpeed();
    const moveAmount = speed * dt;

    // Check if at intersection (center of tile)
    const tileX = Math.round(this.x);
    const tileY = Math.round(this.y);
    const atCenter = Math.abs(this.x - tileX) < 0.05 && Math.abs(this.y - tileY) < 0.05;

    if (atCenter) {
      this.x = tileX;
      this.y = tileY;

      // Handle tunnel
      if (this.x <= 0 && this.dir === DIR.LEFT) {
        this.x = COLS - 1;
      } else if (this.x >= COLS - 1 && this.dir === DIR.RIGHT) {
        this.x = 0;
      }

      // Choose best direction at intersection
      const newDir = this._chooseDirection(maze, target);
      if (newDir) {
        this.dir = newDir;
      }
    }

    // Apply movement
    if (this.dir) {
      this.x += this.dir.x * moveAmount;
      this.y += this.dir.y * moveAmount;
    }

    // Animation
    this.animFrame++;
  }

  _getCurrentSpeed() {
    return this.speed;
  }

  _chooseDirection(maze, target) {
    const tileX = Math.round(this.x);
    const tileY = Math.round(this.y);

    // Get possible directions (exclude reverse unless no other option)
    const directions = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT];
    const reverse = this._getReverse();

    const possible = directions.filter(d => {
      if (d === reverse) return false;
      const nx = tileX + d.x;
      const ny = tileY + d.y;
      return maze.isWalkable(nx, ny, true);
    });

    if (possible.length === 0) {
      // Must reverse
      return reverse;
    }

    if (possible.length === 1) {
      return possible[0];
    }

    if (this.state === GHOST_STATE.FRIGHTENED) {
      // Random direction when frightened
      return possible[Math.floor(Math.random() * possible.length)];
    }

    // Choose direction closest to target
    let bestDir = possible[0];
    let bestDist = Infinity;

    for (const d of possible) {
      const nx = tileX + d.x;
      const ny = tileY + d.y;
      const dist = (nx - target.x) ** 2 + (ny - target.y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }

    return bestDir;
  }

  _getReverse() {
    if (this.dir === DIR.UP) return DIR.DOWN;
    if (this.dir === DIR.DOWN) return DIR.UP;
    if (this.dir === DIR.LEFT) return DIR.RIGHT;
    if (this.dir === DIR.RIGHT) return DIR.LEFT;
    return null;
  }

  _updateInHouse(dt) {
    // Bob up and down in ghost house
    this.animFrame++;
    const bobSpeed = 2;
    this.y = this.startPos.y + Math.sin(this.animFrame * 0.1) * 0.3;
  }

  _updateLeavingHouse(dt) {
    // Move to door position then out
    const doorX = GHOST_HOUSE.doorX + 0.5;
    const doorY = GHOST_HOUSE.doorY;
    const speed = BASE_SPEED * 0.5;

    // First align X to door
    if (Math.abs(this.x - doorX) > 0.1) {
      this.x += (doorX > this.x ? 1 : -1) * speed * dt;
    }
    // Then move up to door
    else if (this.y > doorY - 1) {
      this.y -= speed * dt;
    }
    // Then move above door
    else if (this.y > doorY - 2) {
      this.y -= speed * dt;
    } else {
      // Finished leaving
      this.y = doorY - 2;
      this.x = doorX;
      this.state = GHOST_STATE.SCATTER;
      this.dir = DIR.LEFT;
    }
  }

  _updateEaten(dt, maze) {
    // Move back to ghost house quickly
    const houseX = GHOST_HOUSE.doorX + 0.5;
    const houseY = GHOST_HOUSE.doorY;
    const speed = BASE_SPEED * 2;

    const target = { x: houseX, y: houseY };
    const tileX = Math.round(this.x);
    const tileY = Math.round(this.y);
    const atCenter = Math.abs(this.x - tileX) < 0.1 && Math.abs(this.y - tileY) < 0.1;

    // Check if reached ghost house
    if (Math.abs(this.x - houseX) < 0.5 && Math.abs(this.y - houseY) < 1) {
      // Enter house
      this.x = this.startPos.x;
      this.y = this.startPos.y;
      this.state = GHOST_STATE.LEAVING_HOUSE;
      return;
    }

    if (atCenter) {
      this.x = tileX;
      this.y = tileY;

      // Handle tunnel
      if (this.x <= 0 && this.dir === DIR.LEFT) {
        this.x = COLS - 1;
      } else if (this.x >= COLS - 1 && this.dir === DIR.RIGHT) {
        this.x = 0;
      }

      const newDir = this._chooseDirectionEaten(maze, target);
      if (newDir) this.dir = newDir;
    }

    if (this.dir) {
      this.x += this.dir.x * speed * dt;
      this.y += this.dir.y * speed * dt;
    }
  }

  _chooseDirectionEaten(maze, target) {
    const tileX = Math.round(this.x);
    const tileY = Math.round(this.y);
    const directions = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT];
    const reverse = this._getReverse();

    const possible = directions.filter(d => {
      if (d === reverse) return false;
      const nx = tileX + d.x;
      const ny = tileY + d.y;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
      return maze.isWalkable(nx, ny, true);
    });

    if (possible.length === 0) return reverse;

    let bestDir = possible[0];
    let bestDist = Infinity;
    for (const d of possible) {
      const nx = tileX + d.x;
      const ny = tileY + d.y;
      const dist = (nx - target.x) ** 2 + (ny - target.y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }
    return bestDir;
  }

  release() {
    if (this.state === GHOST_STATE.IN_HOUSE) {
      this.state = GHOST_STATE.LEAVING_HOUSE;
      this.released = true;
    }
  }

  getTileX() {
    return Math.round(this.x);
  }

  getTileY() {
    return Math.round(this.y);
  }
}

// === Blinky (Red) - Direct chaser ===
export class Blinky extends Ghost {
  constructor() {
    super('blinky', '#FF0000', { x: 13.5, y: 11 }, SCATTER_TARGETS.blinky);
  }

  getChaseTarget(pacman) {
    return { x: pacman.getTileX(), y: pacman.getTileY() };
  }
}

// === Pinky (Pink) - Ambusher ===
export class Pinky extends Ghost {
  constructor() {
    super('pinky', '#FFB8FF', { x: 13.5, y: 14 }, SCATTER_TARGETS.pinky);
  }

  getChaseTarget(pacman) {
    // Target 4 tiles ahead of Pacman
    const dir = pacman.dir || DIR.RIGHT;
    let tx = pacman.getTileX() + dir.x * 4;
    let ty = pacman.getTileY() + dir.y * 4;
    // Classic bug: when facing up, also offset 4 left
    if (dir === DIR.UP) {
      tx -= 4;
    }
    return { x: tx, y: ty };
  }
}

// === Inky (Cyan) - Unpredictable ===
export class Inky extends Ghost {
  constructor() {
    super('inky', '#00FFFF', { x: 11.5, y: 14 }, SCATTER_TARGETS.inky);
  }

  getChaseTarget(pacman, blinky) {
    // Vector from Blinky to 2 tiles ahead of Pacman, doubled
    const dir = pacman.dir || DIR.RIGHT;
    const aheadX = pacman.getTileX() + dir.x * 2;
    const aheadY = pacman.getTileY() + dir.y * 2;

    if (!blinky) return { x: aheadX, y: aheadY };

    const bx = blinky.getTileX();
    const by = blinky.getTileY();
    return {
      x: aheadX + (aheadX - bx),
      y: aheadY + (aheadY - by),
    };
  }
}

// === Clyde (Orange) - Wanderer ===
export class Clyde extends Ghost {
  constructor() {
    super('clyde', '#FFB852', { x: 15.5, y: 14 }, SCATTER_TARGETS.clyde);
  }

  getChaseTarget(pacman) {
    // Chase when far (>8 tiles), scatter when close
    const dx = this.getTileX() - pacman.getTileX();
    const dy = this.getTileY() - pacman.getTileY();
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 8) {
      return { x: pacman.getTileX(), y: pacman.getTileY() };
    }
    return this.scatterTarget;
  }
}
