import { describe, it, expect } from 'vitest';
import { GameTimer } from '../js/timer.js';

describe('GameTimer', () => {
  it('starts with correct time', () => {
    const timer = new GameTimer(30);
    expect(timer.timeLeft).toBe(30);
    expect(timer.running).toBe(false);
  });

  it('starts the timer', () => {
    const timer = new GameTimer(30);
    timer.start();
    expect(timer.running).toBe(true);
    expect(timer.timeLeft).toBe(30);
  });

  it('counts down correctly', () => {
    const timer = new GameTimer(30);
    timer.start();
    timer.update(5);
    expect(timer.timeLeft).toBe(25);
  });

  it('expires when time reaches zero', () => {
    const timer = new GameTimer(10);
    timer.start();
    const expired = timer.update(15);
    expect(expired).toBe(true);
    expect(timer.timeLeft).toBe(0);
    expect(timer.running).toBe(false);
  });

  it('does not count down when stopped', () => {
    const timer = new GameTimer(30);
    timer.start();
    timer.stop();
    timer.update(10);
    expect(timer.timeLeft).toBe(30);
  });

  it('returns ratio correctly', () => {
    const timer = new GameTimer(30);
    timer.start();
    timer.update(15);
    expect(timer.getRatio()).toBe(0.5);
  });

  it('detects danger zone', () => {
    const timer = new GameTimer(30);
    timer.start();
    timer.update(26);
    expect(timer.isDanger()).toBe(true);
  });

  it('is not in danger when time is above 5', () => {
    const timer = new GameTimer(30);
    timer.start();
    timer.update(20);
    expect(timer.isDanger()).toBe(false);
  });

  it('resets with same max time', () => {
    const timer = new GameTimer(30);
    timer.start();
    timer.update(20);
    timer.reset();
    expect(timer.timeLeft).toBe(30);
    expect(timer.running).toBe(true);
  });

  it('starts with custom max time', () => {
    const timer = new GameTimer(30);
    timer.start(20);
    expect(timer.timeLeft).toBe(20);
    expect(timer.maxTime).toBe(20);
  });
});
