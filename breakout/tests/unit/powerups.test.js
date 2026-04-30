import { describe, it, expect } from 'vitest';
import { PowerUp, ActivePowerUp, POWERUP_TYPES, POWERUP_CONFIG, POWERUP_DROP_RATE } from '../../js/powerups.js';
import { Paddle } from '../../js/paddle.js';

describe('PowerUp', () => {
  it('falls vertically', () => {
    const pu = new PowerUp(100, 50, POWERUP_TYPES.PADDLE_EXTEND);
    pu.update();
    expect(pu.y).toBe(52);
  });

  it('collidesWithPaddle detects overlap', () => {
    const pu = new PowerUp(280, 690, POWERUP_TYPES.LASER);
    const paddle = new Paddle(250, 700, 100, 12);
    expect(pu.collidesWithPaddle(paddle)).toBe(true);
  });

  it('collidesWithPaddle returns false when not overlapping', () => {
    const pu = new PowerUp(100, 50, POWERUP_TYPES.LASER);
    const paddle = new Paddle(250, 700, 100, 12);
    expect(pu.collidesWithPaddle(paddle)).toBe(false);
  });

  it('isOutOfBounds returns true when below playfield', () => {
    const pu = new PowerUp(100, 800, POWERUP_TYPES.LASER);
    expect(pu.isOutOfBounds(750)).toBe(true);
  });

  it('isOutOfBounds returns false when in playfield', () => {
    const pu = new PowerUp(100, 400, POWERUP_TYPES.LASER);
    expect(pu.isOutOfBounds(750)).toBe(false);
  });

  it('has correct color and symbol for type', () => {
    const pu = new PowerUp(0, 0, POWERUP_TYPES.MULTIBALL);
    expect(pu.color).toBe('#00ffff');
    expect(pu.symbol).toBe('●●●');
  });
});

describe('ActivePowerUp', () => {
  it('tracks remaining time', () => {
    const ap = new ActivePowerUp(POWERUP_TYPES.PADDLE_EXTEND, 10000);
    ap.start();
    expect(ap.remaining).toBe(10000);
  });

  it('decrements remaining time on update', () => {
    const ap = new ActivePowerUp(POWERUP_TYPES.PADDLE_EXTEND, 10000);
    ap.start();
    ap.update(100);
    expect(ap.remaining).toBe(9900);
  });

  it('is expired when remaining reaches 0', () => {
    const ap = new ActivePowerUp(POWERUP_TYPES.PADDLE_EXTEND, 100);
    ap.start();
    ap.update(200);
    expect(ap.expired).toBe(true);
  });

  it('is not expired before time runs out', () => {
    const ap = new ActivePowerUp(POWERUP_TYPES.PADDLE_EXTEND, 10000);
    ap.start();
    ap.update(5000);
    expect(ap.expired).toBe(false);
    expect(ap.active).toBe(true);
  });

  it('progress is 1 when just started', () => {
    const ap = new ActivePowerUp(POWERUP_TYPES.PADDLE_EXTEND, 10000);
    ap.start();
    expect(ap.progress).toBe(1);
  });

  it('progress decreases over time', () => {
    const ap = new ActivePowerUp(POWERUP_TYPES.PADDLE_EXTEND, 10000);
    ap.start();
    ap.update(5000);
    expect(ap.progress).toBe(0.5);
  });

  it('instant power-ups have progress 1', () => {
    const ap = new ActivePowerUp(POWERUP_TYPES.MULTIBALL, 0);
    ap.start();
    expect(ap.progress).toBe(1);
    expect(ap.expired).toBe(false);
  });
});

describe('PowerUp Config', () => {
  it('has all four power-up types', () => {
    expect(POWERUP_CONFIG[POWERUP_TYPES.PADDLE_EXTEND]).toBeDefined();
    expect(POWERUP_CONFIG[POWERUP_TYPES.MULTIBALL]).toBeDefined();
    expect(POWERUP_CONFIG[POWERUP_TYPES.LASER]).toBeDefined();
    expect(POWERUP_CONFIG[POWERUP_TYPES.SLOW_BALL]).toBeDefined();
  });

  it('drop rate is 0.10', () => {
    expect(POWERUP_DROP_RATE).toBe(0.10);
  });
});
