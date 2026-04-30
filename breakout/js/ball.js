/**
 * Ball - physics, bouncing, speed management
 */

export class Ball {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.radius = 6;
    this.baseSpeed = speed;
    this.speed = speed;
    this.maxSpeed = speed * 2.2;
    this.vx = 0;
    this.vy = 0;
    this.launched = false;
    this.color = '#ffffff';
    this.alive = true;
  }

  launch(angle, speed) {
    this.launched = true;
    this.speed = speed || this.baseSpeed;
    this.vx = Math.sin(angle) * this.speed;
    this.vy = -Math.cos(angle) * this.speed;
  }

  launchUp(speed) {
    this.launched = true;
    this.speed = speed || this.baseSpeed;
    // Slight random angle
    const angle = (Math.random() - 0.5) * 0.5;
    this.vx = Math.sin(angle) * this.speed;
    this.vy = -Math.cos(angle) * this.speed;
  }

  update() {
    if (!this.launched || !this.alive) return;
    this.x += this.vx;
    this.y += this.vy;
  }

  bounceOffWall(playfieldWidth, playfieldHeight) {
    // Left wall
    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
      return 'left';
    }
    // Right wall
    if (this.x + this.radius >= playfieldWidth) {
      this.x = playfieldWidth - this.radius;
      this.vx = -Math.abs(this.vx);
      return 'right';
    }
    // Top wall
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
      return 'top';
    }
    return null;
  }

  /**
   * Bounce off paddle with angle variation.
   */
  bounceOffPaddle(paddle) {
    const angle = paddle.reflectAngle(this);
    this.speed = Math.min(this.speed + 0.3, this.maxSpeed);
    this.vx = Math.sin(angle) * this.speed;
    this.vy = -Math.cos(angle) * this.speed;
    // Ensure ball is above paddle
    this.y = paddle.y - this.radius;
  }

  /**
   * Increase speed slightly (on paddle hit).
   */
  increaseSpeed(increment) {
    this.speed = Math.min(this.speed + increment, this.maxSpeed);
    // Re-normalize velocity
    const currentVx = this.vx;
    const currentVy = this.vy;
    const mag = Math.sqrt(currentVx * currentVx + currentVy * currentVy);
    if (mag > 0) {
      this.vx = (currentVx / mag) * this.speed;
      this.vy = (currentVy / mag) * this.speed;
    }
  }

  resetSpeed() {
    this.speed = this.baseSpeed;
  }

  /**
   * Reduce speed (slow ball power-up).
   */
  slowDown(factor) {
    this.speed = this.baseSpeed * factor;
    const currentVx = this.vx;
    const currentVy = this.vy;
    const mag = Math.sqrt(currentVx * currentVx + currentVy * currentVy);
    if (mag > 0) {
      this.vx = (currentVx / mag) * this.speed;
      this.vy = (currentVy / mag) * this.speed;
    }
  }

  /**
   * Check if ball falls below playfield.
   */
  isOutOfBounds(playfieldHeight) {
    return this.y - this.radius > playfieldHeight;
  }

  /**
   * Check collision with rectangle (brick).
   */
  collidesWithRect(rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(this.x, rx + rw));
    const closestY = Math.max(ry, Math.min(this.y, ry + rh));
    const dx = this.x - closestX;
    const dy = this.y - closestY;
    return (dx * dx + dy * dy) < (this.radius * this.radius);
  }

  /**
   * Bounce off brick rectangle - determine which side was hit.
   */
  bounceOffBrick(rx, ry, rw, rh) {
    const ballLeft = this.x - this.radius;
    const ballRight = this.x + this.radius;
    const ballTop = this.y - this.radius;
    const ballBottom = this.y + this.radius;

    const brickLeft = rx;
    const brickRight = rx + rw;
    const brickTop = ry;
    const brickBottom = ry + rh;

    // Determine overlap on each axis
    const overlapLeft = ballRight - brickLeft;
    const overlapRight = ballLeft - brickRight;
    const overlapTop = ballBottom - brickTop;
    const overlapBottom = ballTop - brickBottom;

    // Find minimum overlap
    const minOverlapX = Math.min(overlapLeft, -overlapRight);
    const minOverlapY = Math.min(overlapTop, -overlapBottom);

    if (minOverlapX < minOverlapY) {
      // Hit from left or right
      this.vx = -this.vx;
      if (overlapLeft > 0) {
        this.x = brickLeft - this.radius;
      } else {
        this.x = brickRight + this.radius;
      }
    } else {
      // Hit from top or bottom
      this.vy = -this.vy;
      if (overlapTop > 0) {
        this.y = brickTop - this.radius;
      } else {
        this.y = brickBottom + this.radius;
      }
    }
  }

  reset(x, y, speed) {
    this.x = x;
    this.y = y;
    this.baseSpeed = speed;
    this.speed = speed;
    this.maxSpeed = speed * 2.2;
    this.vx = 0;
    this.vy = 0;
    this.launched = false;
    this.alive = true;
  }
}
