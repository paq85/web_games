import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Paddle } from '../../js/paddle.js';

describe('Paddle', () => {
  let paddle;
  let input;

  beforeEach(() => {
    paddle = new Paddle(250, 700, 100, 12);
    input = {
      getHorizontalInput: vi.fn(() => null),
      isLeft: vi.fn(() => false),
      isRight: vi.fn(() => false),
    };
  });

  it('has correct initial position and dimensions', () => {
    expect(paddle.x).toBe(250);
    expect(paddle.y).toBe(700);
    expect(paddle.width).toBe(100);
    expect(paddle.height).toBe(12);
  });

  it('calculates centerX correctly', () => {
    expect(paddle.centerX).toBe(300);
  });

  it('moves left with keyboard input', () => {
    input.isLeft.mockReturnValue(true);
    paddle.update(input, 600);
    expect(paddle.x).toBe(242);
  });

  it('moves right with keyboard input', () => {
    input.isRight.mockReturnValue(true);
    paddle.update(input, 600);
    expect(paddle.x).toBe(258);
  });

  it('moves to mouse position', () => {
    input.getHorizontalInput.mockReturnValue(350);
    paddle.update(input, 600);
    expect(paddle.x).toBe(300); // 350 - 100/2
  });

  it('clamps to left boundary', () => {
    paddle.x = 5;
    input.isLeft.mockReturnValue(true);
    paddle.update(input, 600);
    expect(paddle.x).toBe(0);
  });

  it('clamps to right boundary', () => {
    paddle.x = 550;
    input.isRight.mockReturnValue(true);
    paddle.update(input, 600);
    expect(paddle.x).toBe(500);
  });

  it('reflectAngle returns 0 at center', () => {
    const ball = { x: paddle.x + paddle.width / 2 };
    const angle = paddle.reflectAngle(ball);
    expect(Math.abs(angle)).toBeLessThan(0.001);
  });

  it('reflectAngle returns positive angle at right edge', () => {
    const ball = { x: paddle.x + paddle.width };
    const angle = paddle.reflectAngle(ball);
    expect(angle).toBeCloseTo(Math.PI / 3);
  });

  it('reflectAngle returns negative angle at left edge', () => {
    const ball = { x: paddle.x };
    const angle = paddle.reflectAngle(ball);
    expect(angle).toBeCloseTo(-Math.PI / 3);
  });

  it('extend increases paddle width', () => {
    paddle.extend(1.5);
    expect(paddle.width).toBe(150);
  });

  it('resetSize restores base width', () => {
    paddle.extend(1.5);
    paddle.resetSize();
    expect(paddle.width).toBe(100);
  });

  it('resetPosition centers paddle', () => {
    paddle.x = 0;
    paddle.resetPosition(600);
    expect(paddle.x).toBe(250);
  });

  it('containsPoint returns true for point on paddle', () => {
    expect(paddle.containsPoint(300, 706)).toBe(true);
  });

  it('containsPoint returns false for point above paddle', () => {
    expect(paddle.containsPoint(300, 690)).toBe(false);
  });

  it('containsPoint returns false for point to the right', () => {
    expect(paddle.containsPoint(400, 706)).toBe(false);
  });
});
