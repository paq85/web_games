import { describe, it, expect, vi } from 'vitest';
import { Scoring } from '../js/scoring.js';

describe('Scoring', () => {
  let scoring;

  beforeEach(() => {
    scoring = new Scoring();
  });

  it('starts with correct defaults', () => {
    expect(scoring.score).toBe(0);
    expect(scoring.lives).toBe(3);
    expect(scoring.level).toBe(1);
    expect(scoring.frogsHome).toBe(0);
    expect(scoring.lowestRow).toBe(12); // 0-indexed, matches frog.startY
  });

  it('adds points correctly', () => {
    scoring.addPoints(50);
    expect(scoring.score).toBe(50);
  });

  it('scores move up when frog reaches higher row', () => {
    const points = scoring.scoreMoveUp(10);
    expect(points).toBe(10);
    expect(scoring.lowestRow).toBe(10);
  });

  it('does not score move up when frog stays or goes down', () => {
    scoring.lowestRow = 10;
    expect(scoring.scoreMoveUp(10)).toBe(0);
    expect(scoring.scoreMoveUp(12)).toBe(0);
  });

  it('scores home correctly', () => {
    const points = scoring.scoreHome(false);
    expect(points).toBe(50);
    expect(scoring.frogsHome).toBe(1);
  });

  it('scores bonus home correctly', () => {
    const points = scoring.scoreHome(true);
    expect(points).toBe(200);
    expect(scoring.frogsHome).toBe(1);
  });

  it('scores ladybug', () => {
    expect(scoring.scoreLadybug()).toBe(200);
  });

  it('scores level complete', () => {
    expect(scoring.scoreLevelComplete()).toBe(1000);
  });

  it('loses a life', () => {
    const alive = scoring.loseLife();
    expect(alive).toBe(true);
    expect(scoring.lives).toBe(2);
    expect(scoring.frogsHome).toBe(0);
    expect(scoring.lowestRow).toBe(12); // 0-indexed, matches frog.startY
  });

  it('game over when all lives lost', () => {
    scoring.loseLife();
    scoring.loseLife();
    const alive = scoring.loseLife();
    expect(alive).toBe(false);
    expect(scoring.isGameOver()).toBe(true);
  });

  it('advances to next level', () => {
    scoring.nextLevel();
    expect(scoring.level).toBe(2);
    expect(scoring.frogsHome).toBe(0);
    expect(scoring.lowestRow).toBe(12); // 0-indexed, matches frog.startY
  });

  it('resets all scoring state', () => {
    scoring.score = 500;
    scoring.lives = 1;
    scoring.level = 5;
    scoring.frogsHome = 3;

    scoring.reset();
    expect(scoring.score).toBe(0);
    expect(scoring.lives).toBe(3);
    expect(scoring.level).toBe(1);
    expect(scoring.frogsHome).toBe(0);
  });

  describe('High Score Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('loads high score from localStorage', () => {
      localStorage.setItem('frogger_high_score', '1500');
      const s = new Scoring();
      expect(s.highScore).toBe(1500);
    });

    it('saves high score when exceeded', () => {
      scoring.score = 2000;
      scoring.updateHighScore();
      expect(localStorage.getItem('frogger_high_score')).toBe('2000');
    });

    it('does not save when score is lower', () => {
      scoring.highScore = 1000;
      scoring.score = 500;
      scoring.updateHighScore();
      expect(localStorage.getItem('frogger_high_score')).toBeNull();
    });
  });
});
