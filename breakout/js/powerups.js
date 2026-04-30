/**
 * Power-up types and management
 */

export const POWERUP_TYPES = {
  PADDLE_EXTEND: 'paddle_extend',
  MULTIBALL: 'multiball',
  LASER: 'laser',
  SLOW_BALL: 'slow_ball',
};

export const POWERUP_CONFIG = {
  [POWERUP_TYPES.PADDLE_EXTEND]: {
    color: '#00ff88',
    symbol: '↔',
    duration: 15000, // 15 seconds
    dropChance: 0.25,
  },
  [POWERUP_TYPES.MULTIBALL]: {
    color: '#00ffff',
    symbol: '●●●',
    duration: 0, // instant effect
    dropChance: 0.04,
  },
  [POWERUP_TYPES.LASER]: {
    color: '#ff4444',
    symbol: '↑',
    duration: 12000, // 12 seconds
    dropChance: 0.15,
  },
  [POWERUP_TYPES.SLOW_BALL]: {
    color: '#ffff00',
    symbol: '⏱',
    duration: 10000, // 10 seconds
    dropChance: 0.25,
  },
};

export const POWERUP_DROP_RATE = 0.10; // 10% chance any destroyed brick drops a powerup

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 14;
    this.type = type;
    this.speed = 2;
    this.alive = true;
    this.color = POWERUP_CONFIG[type].color;
    this.symbol = POWERUP_CONFIG[type].symbol;
  }

  update() {
    this.y += this.speed;
  }

  isOutOfBounds(playfieldHeight) {
    return this.y > playfieldHeight;
  }

  collidesWithPaddle(paddle) {
    return this.x + this.width > paddle.x &&
           this.x < paddle.x + paddle.width &&
           this.y + this.height > paddle.y &&
           this.y < paddle.y + paddle.height;
  }
}

/**
 * Active power-up with timer tracking
 */
export class ActivePowerUp {
  constructor(type, duration) {
    this.type = type;
    this.duration = duration;
    this.remaining = duration;
    this.started = false;
  }

  start() {
    this.started = true;
    this.remaining = this.duration;
  }

  update(dt) {
    if (!this.started || this.duration === 0) return;
    this.remaining = Math.max(0, this.remaining - dt);
  }

  get progress() {
    if (this.duration === 0) return 1;
    return this.remaining / this.duration;
  }

  get expired() {
    return this.started && this.duration > 0 && this.remaining <= 0;
  }

  get active() {
    return this.started && !this.expired;
  }
}
