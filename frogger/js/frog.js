// Frog (player) class

const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

export class Frog {
  constructor(config) {
    this.startX = config.startX;    // grid column
    this.startY = config.startY;    // grid row
    this.x = this.startX;           // current grid column
    this.y = this.startY;           // current grid row
    this.direction = DIRECTIONS.UP; // facing direction
    this.isDead = false;
    this.isOnPlatform = false;
    this.platformId = null;         // ID of platform currently riding
  }

  /**
   * Move the frog one cell in the given direction.
   * Returns true if the move was valid.
   */
  move(direction, gridWidth, gridHeight) {
    if (this.isDead) return false;

    let newX = this.x;
    let newY = this.y;

    switch (direction) {
      case DIRECTIONS.UP:
        newY--;
        break;
      case DIRECTIONS.DOWN:
        newY++;
        break;
      case DIRECTIONS.LEFT:
        newX--;
        break;
      case DIRECTIONS.RIGHT:
        newX++;
        break;
      default:
        return false;
    }

    // Boundary check
    if (newX < 0 || newX >= gridWidth || newY < 0 || newY >= gridHeight) {
      return false;
    }

    this.x = newX;
    this.y = newY;
    this.direction = direction;
    this.isOnPlatform = false;
    this.platformId = null;
    return true;
  }

  /**
   * Apply conveyor movement from a platform.
   * @param {number} pixelsMoved - Horizontal pixels the platform moved
   * @param {number} cellSize - Pixel size of one grid cell
   */
  applyConveyor(pixelsMoved, cellSize) {
    // Track sub-cell horizontal offset for conveyor
    if (!this.conveyorOffset) this.conveyorOffset = 0;
    this.conveyorOffset += pixelsMoved;
  }

  /**
   * Get the pixel X offset from conveyor movement.
   */
  getConveyorOffset() {
    return this.conveyorOffset || 0;
  }

  /**
   * Reset conveyor offset (called on discrete move).
   */
  resetConveyorOffset() {
    this.conveyorOffset = 0;
  }

  /**
   * Reset frog to starting position.
   */
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.direction = DIRECTIONS.UP;
    this.isDead = false;
    this.isOnPlatform = false;
    this.platformId = null;
    this.conveyorOffset = 0;
  }

  /**
   * Get pixel position for rendering.
   */
  getPixelPosition(cellSize) {
    return {
      x: this.x * cellSize + (this.conveyorOffset || 0),
      y: this.y * cellSize,
    };
  }

  /**
   * Get bounding box for collision.
   */
  getBounds(cellSize, padding = 4) {
    const pos = this.getPixelPosition(cellSize);
    return {
      x: pos.x + padding,
      y: pos.y + padding,
      width: cellSize - padding * 2,
      height: cellSize - padding * 2,
    };
  }
}

export { DIRECTIONS };
