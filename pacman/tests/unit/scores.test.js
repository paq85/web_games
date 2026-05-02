// === Scores Unit Tests ===
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Scores } from '../../js/scores.js';

describe('Scores', () => {
  let scores;

  beforeEach(() => {
    localStorage.clear();
    scores = new Scores();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with empty high scores', () => {
    expect(scores.getTopScores()).toHaveLength(0);
  });

  it('starts with zero high score', () => {
    expect(scores.getHighScore()).toBe(0);
  });

  it('adds and retrieves scores', () => {
    scores.addScore(1000, 3);
    expect(scores.getHighScore()).toBe(1000);
    expect(scores.getTopScores()).toHaveLength(1);
    expect(scores.getTopScores()[0].score).toBe(1000);
    expect(scores.getTopScores()[0].level).toBe(3);
  });

  it('sorts scores in descending order', () => {
    scores.addScore(500, 1);
    scores.addScore(2000, 5);
    scores.addScore(1000, 3);
    const top = scores.getTopScores();
    expect(top[0].score).toBe(2000);
    expect(top[1].score).toBe(1000);
    expect(top[2].score).toBe(500);
  });

  it('limits to top 10 scores', () => {
    for (let i = 0; i < 15; i++) {
      scores.addScore(i * 100, i);
    }
    expect(scores.getTopScores()).toHaveLength(10);
  });

  it('detects if score qualifies as high score', () => {
    expect(scores.isHighScore(100)).toBe(true);
    scores.addScore(1000, 1);
    expect(scores.isHighScore(500)).toBe(true);
    expect(scores.isHighScore(0)).toBe(false);
  });

  it('persists across instances', () => {
    scores.addScore(5000, 10);
    const scores2 = new Scores();
    expect(scores2.getHighScore()).toBe(5000);
  });

  it('tracks statistics', () => {
    scores.updateStats({ score: 1000, level: 3, ghostsEaten: 5, fruitsCollected: 2, dotsEaten: 100 });
    const stats = scores.getStats();
    expect(stats.totalGamesPlayed).toBe(1);
    expect(stats.totalScore).toBe(1000);
    expect(stats.highestLevel).toBe(3);
    expect(stats.totalGhostsEaten).toBe(5);
    expect(stats.totalFruitsCollected).toBe(2);
    expect(stats.totalDotsEaten).toBe(100);
  });

  it('accumulates statistics', () => {
    scores.updateStats({ score: 1000, level: 3, ghostsEaten: 5, fruitsCollected: 2, dotsEaten: 100 });
    scores.updateStats({ score: 2000, level: 5, ghostsEaten: 3, fruitsCollected: 1, dotsEaten: 200 });
    const stats = scores.getStats();
    expect(stats.totalGamesPlayed).toBe(2);
    expect(stats.totalScore).toBe(3000);
    expect(stats.highestLevel).toBe(5);
    expect(stats.totalGhostsEaten).toBe(8);
  });

  it('reset clears everything', () => {
    scores.addScore(5000, 10);
    scores.updateStats({ score: 5000, level: 10, ghostsEaten: 10, fruitsCollected: 5, dotsEaten: 244 });
    scores.reset();
    expect(scores.getHighScore()).toBe(0);
    expect(scores.getTopScores()).toHaveLength(0);
    expect(scores.getStats().totalGamesPlayed).toBe(0);
  });
});
