/**
 * Paddle - horizontal movement, collision surface
 */

export class Paddle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.baseWidth = width;
    this.speed = 8;
    this.color = '#00ffff';
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.x + this.width;
  }

  update(input, playfieldWidth) {
    const horizontal = input.getHorizontalInput();
    if (horizontal !== null) {
      this.x = horizontal - this.width / 2;
    } else {
      if (input.isLeft()) {
        this.x -= this.speed;
      }
      if (input.isRight()) {
        this.x += this.speed;
      }
    }
    // Clamp to playfield
    this.x = Math.max(0, Math.min(this.x, playfieldWidth - this.width));
  }

  resetPosition(playfieldWidth) {
    this.x = (playfieldWidth - this.width) / 2;
  }

  resetSize() {
    this.width = this.baseWidth;
  }

  extend(multiplier) {
    this.width = this.baseWidth * multiplier;
  }

  /**
   * Calculate ball reflection angle based on where ball hits paddle.
   * Center hit = shallow angle (~0 radians), edge hit = steep angle (~±PI/3).
   */
  reflectAngle(ball) {
    const hitPos = (ball.x - this.x) / this.width; // 0..1
    const normalized = hitPos * 2 - 1; // -1..1
    return normalized * (Math.PI / 3); // max ±60 degrees
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
}
