/**
 * Pacman character module.
 *
 * Grid-based movement with smooth pixel interpolation, mouth animation,
 * direction buffering, lives management, death animation, and collision
 * detection against maze cells (walls, dots, power pellets, fruits, ghosts).
 *
 * Expects a maze module that exports:
 *   MAZE_WIDTH, MAZE_HEIGHT, CELL_TYPES, getCell(x, y), isWalkable(x, y)
 *
 * Vanilla JS — ES module export.
 */

// ---------------------------------------------------------------------------
// Direction constants (shared so callers can use the same values)
// ---------------------------------------------------------------------------
export const UP = { dx: 0, dy: -1 };
export const DOWN = { dx: 0, dy: 1 };
export const LEFT = { dx: -1, dy: 0 };
export const RIGHT = { dx: 1, dy: 0 };

/** Opposite direction lookup */
const OPPOSITE = new Map();
OPPOSITE.set(UP, DOWN);
OPPOSITE.set(DOWN, UP);
OPPOSITE.set(LEFT, RIGHT);
OPPOSITE.set(RIGHT, LEFT);

/** Rotation in radians for rendering (0 = right, clockwise) */
const DIRECTION_ANGLE = new Map();
DIRECTION_ANGLE.set(RIGHT, 0);
DIRECTION_ANGLE.set(DOWN, Math.PI / 2);
DIRECTION_ANGLE.set(LEFT, Math.PI);
DIRECTION_ANGLE.set(UP, -Math.PI / 2);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if two direction objects are the same */
function sameDir(a, b) {
	return a && b && a.dx === b.dx && a.dy === b.dy;
}

/** Wrap x coordinate for tunnel effect */
function wrapX(x, mazeWidth) {
	if (x < 0) return mazeWidth - 1;
	if (x >= mazeWidth) return 0;
	return x;
}

// ---------------------------------------------------------------------------
// Pacman class
// ---------------------------------------------------------------------------
export class Pacman {
	// -- Construction -------------------------------------------------------
	/**
	 * @param {number} startX - Grid column of spawn position
	 * @param {number} startY - Grid row of spawn position
	 * @param {number} cellSize - Pixel size of one maze cell
	 */
	constructor(startX, startY, cellSize) {
		this._startX = startX;
		this._startY = startY;
		this.cellSize = cellSize;

		this.gridX = startX;
		this.gridY = startY;
		this.pixelX = startX * cellSize;
		this.pixelY = startY * cellSize;

		this.direction = LEFT; // initial facing direction
		this.nextDirection = null;

		this.lives = 3;

		this.mouthAngle = 0; // radians (0 = fully open)
		this.mouthMaxAngle = Math.PI / 4;
		this.mouthSpeed = 8; // radians per second

		this.isMoving = false;
		this.isDying = false;
		this.deathProgress = 0; // 0 → 1

		// Pixel offset inside current cell (0-1), used to know when centered
		this._cellProgress = 0; // 0 = snapped to cell, 1 = reached next cell
	}

	// -- Direction control --------------------------------------------------

	/**
	 * Set or queue a movement direction.
	 * If the direction is opposite to current movement, it cancels nextDirection
	 * and stops Pacman at the next cell boundary.
	 */
	setDirection(dir) {
		if (!dir) return;

		// Reversing: cancel queued direction and stop at cell edge
		if (this.isMoving && OPPOSITE.get(dir) === this.direction) {
			this.nextDirection = null;
			this.direction = dir;
			return;
		}

		// Exact same direction — no-op
		if (sameDir(dir, this.direction)) return;

		// Queue for the next opportunity
		this.nextDirection = dir;
	}

	// -- Movement -----------------------------------------------------------

	/**
	 * Advance Pacman's position by one tick.
	 *
	 * @param {object} mazeData - The maze module ({ MAZE_WIDTH, isWalkable })
	 * @param {number} speed - Pixels to move this tick
	 * @returns {{ dots: number, powerPellets: number }} collected items
	 */
	move(mazeData, speed) {
		// If dying, skip movement
		if (this.isDying) return { dots: 0, powerPellets: 0 };

		const { MAZE_WIDTH, isWalkable, CELL_TYPES, getCell } = mazeData;

		// --- Try to apply nextDirection if we are centred on a cell --------
		if (this.nextDirection && !this.isMoving) {
			const nx = this.gridX + this.nextDirection.dx;
			const ny = this.gridY + this.nextDirection.dy;
			if (isWalkable(nx, ny)) {
				this.direction = this.nextDirection;
				this.nextDirection = null;
			}
		}

		// --- Start moving if not already moving ----------------------------
		if (!this.isMoving) {
			const nx = this.gridX + this.direction.dx;
			const ny = this.gridY + this.direction.dy;
			if (!isWalkable(nx, ny)) {
				return { dots: 0, powerPellets: 0 };
			}
			this.isMoving = true;
			this._cellProgress = 0;
		}

		// --- Advance pixel position ----------------------------------------
		this._cellProgress += speed / this.cellSize;

		// Clamp to 1 (reached next cell)
		if (this._cellProgress >= 1) {
			this._cellProgress = 1;
		}

		// Interpolate pixel position
		const targetGridX = this.gridX + this.direction.dx;
		const targetGridY = this.gridY + this.direction.dy;
		this.pixelX = this.gridX * this.cellSize + this.direction.dx * this.cellSize * this._cellProgress;
		this.pixelY = this.gridY * this.cellSize + this.direction.dy * this.cellSize * this._cellProgress;

		// --- Reached next cell? --------------------------------------------
		if (this._cellProgress >= 1) {
			this.gridX = wrapX(targetGridX, MAZE_WIDTH);
			this.gridY = targetGridY;
			this.pixelX = this.gridX * this.cellSize;
			this.pixelY = this.gridY * this.cellSize;
			this.isMoving = false;
			this._cellProgress = 0;

			// Check what's in the new cell
			const cell = getCell(this.gridX, this.gridY);
			let dots = 0;
			let powerPellets = 0;
			if (cell === CELL_TYPES.DOT) {
				dots = 1;
			} else if (cell === CELL_TYPES.POWER_PELLET) {
				powerPellets = 1;
			}
			return { dots, powerPellets };
		}

		return { dots: 0, powerPellets: 0 };
	}

	// -- Position queries ---------------------------------------------------

	/** @returns {{ x: number, y: number }} Current pixel position */
	getPixelPos() {
		return { x: this.pixelX, y: this.pixelY };
	}

	/** @returns {boolean} True when snapped to the centre of current cell */
	hasReachedCell() {
		return !this.isMoving;
	}

	// -- Lives & death ------------------------------------------------------

	/** Decrement lives and start death animation. Returns true if lives > 0. */
	loseLife() {
		this.lives--;
		this.isDying = true;
		this.deathProgress = 0;
		return this.lives > 0;
	}

	/** Reset Pacman to the starting grid position (called after death). */
	resetPosition(startX, startY) {
		this.gridX = startX !== undefined ? startX : this._startX;
		this.gridY = startY !== undefined ? startY : this._startY;
		this.pixelX = this.gridX * this.cellSize;
		this.pixelY = this.gridY * this.cellSize;
		this.direction = LEFT;
		this.nextDirection = null;
		this.isMoving = false;
		this.isDying = false;
		this.deathProgress = 0;
		this._cellProgress = 0;
	}

	// -- Collision helpers --------------------------------------------------

	/**
	 * Check whether Pacman currently occupies the same cell as (gx, gy).
	 */
	isAtGrid(gx, gy) {
		return this.gridX === gx && this.gridY === gy;
	}

	/**
	 * Check if Pacman collides with a ghost at pixel coordinates.
	 * Uses a simple distance check with a tolerance.
	 */
	collidesWithGhost(ghostPixelX, ghostPixelY, tolerance) {
		const dx = this.pixelX - ghostPixelX;
		const dy = this.pixelY - ghostPixelY;
		const dist = Math.sqrt(dx * dx + dy * dy);
		return dist <= (tolerance || this.cellSize * 0.8);
	}

	// -- Animation update ---------------------------------------------------

	/**
	 * Update mouth angle and death animation progress.
	 * Call every frame with dt (seconds since last frame).
	 */
	updateAnimation(dt) {
		if (this.isDying) {
			// Death animation: 0.5 s duration
			this.deathProgress = Math.min(1, this.deathProgress + dt / 0.5);
			// Mouth opens wider during death
			this.mouthAngle = this.mouthMaxAngle * (1 + this.deathProgress);
			return;
		}

		// Mouth animates only while moving
		if (this.isMoving) {
			this.mouthAngle += this.mouthSpeed * dt;
			// Bounce between 0 and mouthMaxAngle
			if (this.mouthAngle >= this.mouthMaxAngle || this.mouthAngle <= 0) {
				this.mouthSpeed = -this.mouthSpeed;
			}
			// Clamp
			this.mouthAngle = Math.max(0, Math.min(this.mouthMaxAngle, this.mouthAngle));
		} else {
			// When stopped, mouth stays slightly open
			this.mouthAngle = this.mouthMaxAngle * 0.5;
		}
	}

	// -- Rendering ----------------------------------------------------------

	/**
	 * Render Pacman onto the given canvas context.
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} offsetX - Canvas X offset for maze origin
	 * @param {number} offsetY - Canvas Y offset for maze origin
	 * @param {number} cellSize - Pixel size of a maze cell
	 * @param {number} time - Global time (ms) — used for power-pellet flicker, etc.
	 */
	render(ctx, offsetX, offsetY, cellSize, _time) {
		const cx = offsetX + this.pixelX + cellSize / 2;
		const cy = offsetY + this.pixelY + cellSize / 2;
		const radius = cellSize / 2 - 2;

		// Death fade
		let alpha = 1;
		if (this.isDying) {
			alpha = 1 - this.deathProgress;
		}

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.translate(cx, cy);
		ctx.rotate(DIRECTION_ANGLE.get(this.direction) || 0);

		// Body — yellow arc with wedge mouth
		ctx.beginPath();
		ctx.arc(0, 0, radius, this.mouthAngle, 2 * Math.PI - this.mouthAngle);
		ctx.lineTo(0, 0);
		ctx.closePath();

		ctx.fillStyle = '#FFFF00';
		ctx.fill();

		// Subtle outline for contrast
		ctx.strokeStyle = '#E6D000';
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.restore();
	}
}
