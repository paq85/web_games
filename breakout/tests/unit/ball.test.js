import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ball } from '../../js/ball.js';
import { Paddle } from '../../js/paddle.js';

describe('Ball', () => {
  let ball;

  beforeEach(() => {
    ball = new Ball(300, 700, 4);
  });

  it('starts unlaunched', () => {
    expect(ball.launched).toBe(false);
    expect(ball.vx).toBe(0);
    expect(ball.vy).toBe(0);
  });

  it('launchUp sets velocity upward', () => {
    ball.launchUp();
    expect(ball.launched).toBe(true);
    expect(ball.vy).toBeLessThan(0);
  });

  it('launch sets velocity based on angle', () => {
    ball.launch(0, 5);
    expect(ball.launched).toBe(true);
    expect(ball.vx).toBeCloseTo(0);
    expect(ball.vy).toBeCloseTo(-5);
  });

  it('update moves ball when launched', () => {
    ball.launchUp();
    const startX = ball.x;
    const startY = ball.y;
    ball.update();
    expect(ball.x).not.toBe(startX);
    expect(ball.y).not.toBe(startY);
  });

  it('update does not move unlaunched ball', () => {
    ball.update();
    expect(ball.x).toBe(300);
    expect(ball.y).toBe(700);
  });

  it('bounceOffWall bounces off left wall', () => {
    ball.x = 2;
    ball.vx = -3;
    ball.launchUp();
    const wall = ball.bounceOffWall(600, 750);
    expect(wall).toBe('left');
    expect(ball.vx).toBeGreaterThan(0);
  });

  it('bounceOffWall bounces off right wall', () => {
    ball.x = 598;
    ball.vx = 3;
    ball.launchUp();
    const wall = ball.bounceOffWall(600, 750);
    expect(wall).toBe('right');
    expect(ball.vx).toBeLessThan(0);
  });

  it('bounceOffWall bounces off top wall', () => {
    ball.y = 2;
    ball.vy = -3;
    ball.launchUp();
    const wall = ball.bounceOffWall(600, 750);
    expect(wall).toBe('top');
    expect(ball.vy).toBeGreaterThan(0);
  });

  it('bounceOffPaddle changes angle based on paddle position', () => {
    ball.launchUp();
    ball.vy = 3;
    const paddle = new Paddle(250, 700, 100, 12);
    ball.x = paddle.x; // left edge
    ball.bounceOffPaddle(paddle);
    expect(ball.vy).toBeLessThan(0);
    expect(ball.vx).toBeLessThan(0);
  });

  it('increaseSpeed caps at maxSpeed', () => {
    ball.launchUp();
    ball.speed = ball.maxSpeed;
    ball.increaseSpeed(10);
    expect(ball.speed).toBeLessThanOrEqual(ball.maxSpeed);
  });

  it('resetSpeed restores base speed', () => {
    ball.launchUp();
    ball.speed = 10;
    ball.resetSpeed();
    expect(ball.speed).toBe(4);
  });

  it('slowDown reduces speed', () => {
    ball.launchUp();
    ball.slowDown(0.6);
    expect(ball.speed).toBeCloseTo(4 * 0.6);
  });

  it('isOutOfBounds returns true when below playfield', () => {
    ball.y = 800;
    expect(ball.isOutOfBounds(750)).toBe(true);
  });

  it('isOutOfBounds returns false when in playfield', () => {
    ball.y = 400;
    expect(ball.isOutOfBounds(750)).toBe(false);
  });

  it('collidesWithRect detects collision', () => {
    ball.x = 100;
    ball.y = 100;
    expect(ball.collidesWithRect(90, 90, 30, 20)).toBe(true);
  });

  it('collidesWithRect returns false when not colliding', () => {
    ball.x = 100;
    ball.y = 100;
    expect(ball.collidesWithRect(200, 200, 30, 20)).toBe(false);
  });

  it('reset restores initial state', () => {
    ball.launchUp();
    ball.x = 500;
    ball.reset(300, 700, 4);
    expect(ball.x).toBe(300);
    expect(ball.y).toBe(700);
    expect(ball.launched).toBe(false);
    expect(ball.speed).toBe(4);
  });
});
