// Base obstacle class for vehicles, logs, and turtles

export class Obstacle {
  constructor(config) {
    this.id = config.id;
    this.x = config.x;           // pixel x position
    this.y = config.y;           // pixel y position (centered in lane)
    this.width = config.width;   // pixel width
    this.height = config.height; // pixel height
    this.speed = config.speed;   // cells per second
    this.direction = config.direction; // 1 = right, -1 = left
    this.type = config.type;     // 'car', 'truck', 'bulldozer', 'log', 'turtle'
    this.visible = true;
    this.row = config.row;       // grid row index
  }

  /**
   * Move the obstacle by delta seconds.
   * @param {number} delta - Time elapsed in seconds
   * @param {number} cellSize - Pixel size of one grid cell
   * @param {number} canvasWidth - Total canvas width in pixels
   */
  update(delta, cellSize, canvasWidth) {
    if (this.direction === 0) return;

    const pixelsPerSecond = this.speed * cellSize;
    this.x += this.direction * pixelsPerSecond * delta;

    // Wrap around screen edges
    if (this.direction > 0 && this.x > canvasWidth) {
      this.x = -this.width;
    } else if (this.direction < 0 && this.x + this.width < 0) {
      this.x = canvasWidth;
    }
  }

  /**
   * Get the bounding box for collision detection.
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
