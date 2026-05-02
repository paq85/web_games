/**
 * Ghost AI Module for Pacman
 *
 * Implements four distinct ghost types (Blinky, Pinky, Inky, Clyde) with
 * unique targeting behaviors, state machine (Chase / Scatter / Frightened / Eaten),
 * and classic ghost rendering.
 *
 * Vanilla JS — ES module exports. No dependencies.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GHOST_COLORS = {
  blinky: '#FF0000',
  pinky: '#FFB8FF',
  inky: '#00FFFF',
  clyde: '#FFB852',
};

export const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];

export const GHOST_TARGET_CORNERS = {
  blinky: { x: 25, y: 0 },
  pinky:  { x: 2,  y: 0 },
  inky:   { x: 25, y: 30 },
  clyde:  { x: 2,  y: 30 },
};

// Ghost house position (classic Pacman)
const GHOST_HOUSE_X = 14;
const GHOST_HOUSE_Y = 14;

// Direction vectors
const DIRECTIONS = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};

const DIRECTION_KEYS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

// Opposite direction lookup
const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

// ---------------------------------------------------------------------------
// Ghost class
// ---------------------------------------------------------------------------

export class Ghost {
  /**
   * @param {string} name          - One of 'blinky', 'pinky', 'inky', 'clyde'
   * @param {string} color         - Hex colour for this ghost's body
   * @param {number} startX        - Starting grid X
   * @param {number} startY        - Starting grid Y
   * @param {number} cellSize      - Pixel size of a single maze cell
   * @param {{x:number,y:number}} scatterCorner - Target corner for scatter mode
   */
  constructor(name, color, startX, startY, cellSize, scatterCorner) {
    this.name = name;
    this.color = color;
    this.scatterCorner = scatterCorner;

    // Grid position
    this.gridX = startX;
    this.gridY = startY;

    // Pixel position (for smooth animation)
    this.pixelX = startX * cellSize;
    this.pixelY = startY * cellSize;

    this.cellSize = cellSize;

    // Movement
    this.direction = 'UP';          // Current movement direction
    this.nextDirection = null;      // Buffered direction change

    // State
    this._state = 'CHASE';          // CHASE | SCATTER | FRIGHTENED | EATEN

    // Ghost house tracking
    this._inHouse = true;
    this._houseTimer = 0;           // Turns remaining before leaving house

    // Inky needs Pacman's position 2 cells ago
    this._pacmanPos2Ago = { x: 0, y: 0 };

    // Frightened flash timer
    this._frightenedBlinkTimer = 0;
  }

  // -----------------------------------------------------------------------
  // State helpers
  // -----------------------------------------------------------------------

  /** @returns {'CHASE'|'SCATTER'|'FRIGHTENED'|'EATEN'} */
  get state() {
    return this._state;
  }
  set state(value) {
    this._state = value;
  }

  /** Transition to frightened (blue/vulnerable) state. */
  setFrightened() {
    this.state = 'FRIGHTENED';
    this._frightenedBlinkTimer = 0;
    // Reverse direction on entering frightened
    if (this.direction && OPPOSITE[this.direction]) {
      this.direction = OPPOSITE[this.direction];
    }
  }

  /** Transition to eaten (eyes-only, returning to house) state. */
  setEaten() {
    this.state = 'EATEN';
    // Reverse direction so ghost heads back toward house
    if (this.direction && OPPOSITE[this.direction]) {
      this.direction = OPPOSITE[this.direction];
    }
  }

  /**
   * Reset ghost to starting position.
   * @param {number} startX
   * @param {number} startY
   * @param {boolean} inHouse - Whether the ghost starts inside the ghost house
   */
  reset(startX, startY, inHouse = true) {
    this.gridX = startX;
    this.gridY = startY;
    this.pixelX = startX * this.cellSize;
    this.pixelY = startY * this.cellSize;
    this.direction = 'UP';
    this.nextDirection = null;
    this.state = 'CHASE';
    this._inHouse = inHouse;
    this._houseTimer = inHouse ? 30 : 0;
    this._pacmanPos2Ago = { x: 0, y: 0 };
  }

  /** @returns {boolean} Whether the ghost is still inside the ghost house. */
  isInHouse() {
    return this._inHouse;
  }

  // -----------------------------------------------------------------------
  // Target calculation  (AI brain)
  // -----------------------------------------------------------------------

  /**
   * Compute the target grid position based on ghost type and current state.
   *
   * @param {object} pacman - { gridX, gridY, direction }
   * @param {Ghost|null} blinky - Reference to Blinky (needed by Inky)
   * @returns {{x:number, y:number}}
   */
  getTargetPosition(pacman, blinky) {
    // When eaten, target is the ghost house entrance
    if (this.state === 'EATEN') {
      return { x: GHOST_HOUSE_X, y: GHOST_HOUSE_Y };
    }

    // Scatter mode — head to assigned corner
    if (this.state === 'SCATTER') {
      return { ...this.scatterCorner };
    }

    // Frightened — no meaningful target; random movement handled in move()
    if (this.state === 'FRIGHTENED') {
      return { x: 0, y: 0 };
    }

    // Chase mode — type-specific targeting
    switch (this.name) {
      case 'blinky': {
        // Direct chase — target Pacman's current position
        return { x: pacman.gridX, y: pacman.gridY };
      }

      case 'pinky': {
        // Ambush — target 4 cells ahead of Pacman's direction
        const dir = DIRECTIONS[pacman.direction] || DIRECTIONS.RIGHT;
        return {
          x: pacman.gridX + dir.x * 4,
          y: pacman.gridY + dir.y * 4,
        };
      }

      case 'inky': {
        // Unpredictable — vector-based using Blinky + Pacman's position 2 cells ago
        // Target = pacmanPos2Ago + 2 * (pacmanCurrent - blinkyCurrent)
        const pacman2AgoX = this._pacmanPos2Ago.x;
        const pacman2AgoY = this._pacmanPos2Ago.y;
        const blinkyX = blinky ? blinky.gridX : pacman.gridX;
        const blinkyY = blinky ? blinky.gridY : pacman.gridY;
        return {
          x: pacman2AgoX + 2 * (pacman.gridX - blinkyX),
          y: pacman2AgoY + 2 * (pacman.gridY - blinkyY),
        };
      }

      case 'clyde': {
        // Switch between chase and scatter based on distance to Pacman
        const dist = manhattanDist(this.gridX, this.gridY, pacman.gridX, pacman.gridY);
        if (dist <= 8) {
          // Too close — scatter to corner
          return { ...this.scatterCorner };
        }
        // Normal chase
        return { x: pacman.gridX, y: pacman.gridY };
      }

      default:
        return { x: pacman.gridX, y: pacman.gridY };
    }
  }

  // -----------------------------------------------------------------------
  // Movement
  // -----------------------------------------------------------------------

  /**
   * Advance the ghost one step using AI targeting.
   *
   * @param {object} mazeData - Maze interface: { MAZE_WIDTH, MAZE_HEIGHT, getCell, isWalkable }
   * @param {object} pacman   - { gridX, gridY, direction }
   * @param {Ghost|null} blinky - Reference to Blinky ghost (for Inky)
   * @param {number} speed    - Pixels per frame (1.0 = normal, 0.5 = frightened, 2.0 = eaten)
   * @param {number} level    - Current game level (for future difficulty scaling)
   */
  move(mazeData, pacman, blinky, speed = 1.0, level = 1) {
    // Handle ghost house — release ghost gradually
    if (this._inHouse) {
      this._houseTimer -= 1;
      if (this._houseTimer <= 0) {
        this._inHouse = false;
        this.gridX = GHOST_HOUSE_X;
        this.gridY = GHOST_HOUSE_Y;
        this.pixelX = this.gridX * this.cellSize;
        this.pixelY = this.gridY * this.cellSize;
        this.direction = 'UP';
      }
      return;
    }

    // Update Inky's stored Pacman position (2 cells ago) every move
    if (this.name === 'inky') {
      this._pacmanPos2Ago = { x: pacman.gridX, y: pacman.gridY };
    }

    // Smooth pixel movement
    this.pixelX += DIRECTIONS[this.direction].x * speed * this.cellSize;
    this.pixelY += DIRECTIONS[this.direction].y * speed * this.cellSize;

    // Snap to grid when close enough
    const snapThreshold = speed * 0.5;
    const dx = Math.abs(this.pixelX - this.gridX * this.cellSize);
    const dy = Math.abs(this.pixelY - this.gridY * this.cellSize);

    if (dx < snapThreshold && dy < snapThreshold) {
      // We've reached a grid cell — decide next direction
      this.gridX = Math.round(this.pixelX / this.cellSize);
      this.gridY = Math.round(this.pixelY / this.cellSize);
      this.pixelX = this.gridX * this.cellSize;
      this.pixelY = this.gridY * this.cellSize;

      // Handle warp tunnel (left/right edges)
      if (this.gridX < 0) {
        this.gridX = mazeData.MAZE_WIDTH - 1;
        this.pixelX = this.gridX * this.cellSize;
      } else if (this.gridX >= mazeData.MAZE_WIDTH) {
        this.gridX = 0;
        this.pixelX = 0;
      }

      // If eaten and reached ghost house, return to chase
      if (this.state === 'EATEN') {
        if (this.gridX === GHOST_HOUSE_X && this.gridY === GHOST_HOUSE_Y) {
          this.state = 'CHASE';
          this._inHouse = true;
          this._houseTimer = 30;
          return;
        }
      }

      // Select next direction at this intersection
      const target = this.getTargetPosition(pacman, blinky);
      this.direction = this.selectDirection(mazeData, target.x, target.y);
    }
  }

  /**
   * Choose the best direction at an intersection to reach the target.
   *
   * @param {object} mazeData
   * @param {number} targetX
   * @param {number} targetY
   * @returns {string} Direction key ('UP', 'DOWN', 'LEFT', 'RIGHT')
   */
  selectDirection(mazeData, targetX, targetY) {
    const currentDir = this.direction;
    const oppositeDir = OPPOSITE[currentDir];

    // Collect valid directions (walkable cells, no reversing except in frightened)
    const validDirs = [];
    for (const dirKey of DIRECTION_KEYS) {
      // Cannot reverse direction (except in frightened state)
      if (dirKey === oppositeDir && this.state !== 'FRIGHTENED') {
        continue;
      }

      const dir = DIRECTIONS[dirKey];
      const nx = this.gridX + dir.x;
      const ny = this.gridY + dir.y;

      // Check bounds
      if (nx < 0 || nx >= mazeData.MAZE_WIDTH) {
        // Allow tunnel wrap
        validDirs.push(dirKey);
        continue;
      }
      if (ny < 0 || ny >= mazeData.MAZE_HEIGHT) {
        continue;
      }

      // Check walkability
      if (mazeData.isWalkable(nx, ny)) {
        validDirs.push(dirKey);
      }
    }

    // Frightened state — pick random valid direction
    if (this.state === 'FRIGHTENED' && validDirs.length > 0) {
      return validDirs[Math.floor(Math.random() * validDirs.length)];
    }

    // No valid moves — stay put
    if (validDirs.length === 0) {
      return currentDir;
    }

    // Only one option
    if (validDirs.length === 1) {
      return validDirs[0];
    }

    // Choose direction that minimises Manhattan distance to target
    let bestDir = validDirs[0];
    let bestDist = Infinity;

    for (const dirKey of validDirs) {
      const dir = DIRECTIONS[dirKey];
      const nx = this.gridX + dir.x;
      const ny = this.gridY + dir.y;
      const dist = manhattanDist(nx, ny, targetX, targetY);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dirKey;
      }
    }

    return bestDir;
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  /**
   * Render the ghost on a canvas context.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} offsetX   - Canvas X offset for maze placement
   * @param {number} offsetY   - Canvas Y offset for maze placement
   * @param {number} cellSize  - Pixel size of a maze cell
   * @param {number} time      - Millisecond timestamp (for animations)
   */
  render(ctx, offsetX, offsetY, cellSize, time = 0) {
    const x = offsetX + this.pixelX;
    const y = offsetY + this.pixelY;
    const cs = cellSize;

    // If ghost is in house, render at house position with bobbing
    let renderX = x;
    let renderY = y;
    if (this._inHouse) {
      renderX = offsetX + GHOST_HOUSE_X * cs;
      renderY = offsetY + GHOST_HOUSE_Y * cs + Math.sin(time / 200) * 4;
    }

    // Eaten state — only eyes
    if (this.state === 'EATEN') {
      this._renderEyes(ctx, renderX, renderY, cs);
      return;
    }

    // Determine body color
    let bodyColor = this.color;
    if (this.state === 'FRIGHTENED') {
      // Flash white when frightened timer is low
      this._frightenedBlinkTimer += 1;
      if (this._frightenedBlinkTimer % 20 < 10) {
        bodyColor = '#FFFFFF';
      } else {
        bodyColor = '#2121DE'; // Classic frightened blue
      }
    }

    // Draw ghost body
    this._renderBody(ctx, renderX, renderY, cs, bodyColor);

    // Draw eyes
    if (this.state === 'FRIGHTENED') {
      // Frightened eyes — flashing white
      const eyeColor = (this._frightenedBlinkTimer % 20 < 10) ? '#FFFFFF' : '#FFFFFF';
      this._renderEyes(ctx, renderX, renderY, cs, eyeColor);
    } else {
      this._renderEyes(ctx, renderX, renderY, cs);
    }

    // Ghost name label for color independence (accessibility)
    this._renderNameLabel(ctx, renderX, renderY, cs);
  }

  /** Render ghost name label (first letter of name) above the ghost. */
  _renderNameLabel(ctx, x, y, cs) {
    const label = this.name.charAt(0).toUpperCase();
    const fontSize = Math.max(6, cs * 0.5);
    const labelY = y - 2;

    ctx.save();
    ctx.font = `bold ${fontSize}px monospace`;
    const tw = ctx.measureText(label).width;

    // Background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const px = 2;
    ctx.beginPath();
    this._roundRect(ctx, x + cs / 2 - tw / 2 - px, labelY - fontSize - px, tw + px * 2, fontSize + px * 2, 2);
    ctx.fill();

    // Letter
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x + cs / 2, labelY - fontSize);
    ctx.restore();
  }

  /** Draw a rounded rectangle path (helper for name label). */
  _roundRect(ctx, x, y, w, h, r) {
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

  /**
   * Render the classic ghost body shape (dome top, wavy bottom).
   */
  _renderBody(ctx, x, y, cs, color) {
    const r = cs / 2;
    const cx = x + r;
    const cy = y + r;

    ctx.fillStyle = color;
    ctx.beginPath();

    // Dome top (semicircle)
    ctx.arc(cx, cy - r * 0.15, r, Math.PI, 0, false);

    // Right side down
    ctx.lineTo(x + cs, cy + r * 0.7);

    // Wavy bottom (3 bumps)
    const waveSegments = 3;
    const waveWidth = cs / waveSegments;
    for (let i = waveSegments - 1; i >= 0; i--) {
      const bx = x + cs - i * waveWidth;
      const cp1x = bx - waveWidth * 0.25;
      const cp2x = bx - waveWidth * 0.5;
      ctx.quadraticCurveTo(cp1x, cy + r * 0.3, bx - waveWidth * 0.5, cy + r * 0.7);
      ctx.quadraticCurveTo(cp2x, cy + r, bx - waveWidth, cy + r * 0.7);
    }

    // Left side up
    ctx.lineTo(x, cy - r * 0.15);

    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render ghost eyes in the direction of movement.
   */
  _renderEyes(ctx, x, y, cs, eyeColor = '#FFFFFF') {
    const r = cs / 2;
    const eyeSize = cs * 0.15;
    const pupilSize = cs * 0.08;

    // Eye offset from center based on direction
    const dir = DIRECTIONS[this.direction] || DIRECTIONS.RIGHT;
    const pupilOffsetX = dir.x * pupilSize * 0.5;
    const pupilOffsetY = dir.y * pupilSize * 0.5;

    // Left eye
    const leftEyeX = x + r * 0.55;
    const leftEyeY = y + r * 0.65;

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(leftEyeX, leftEyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left pupil
    ctx.fillStyle = '#2121DE';
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    const rightEyeX = x + r * 1.45;
    const rightEyeY = y + r * 0.65;

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(rightEyeX, rightEyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right pupil
    ctx.fillStyle = '#2121DE';
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Manhattan distance between two grid positions. */
function manhattanDist(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
