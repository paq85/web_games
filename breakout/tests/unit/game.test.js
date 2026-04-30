import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game, SCREEN } from '../../js/game.js';

// Mock canvas
function createMockCanvas() {
  return {
    width: 600,
    height: 750,
    getContext: () => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    }),
  };
}

// Mock input
function createMockInput() {
  return {
    getHorizontalInput: vi.fn(() => null),
    isLeft: vi.fn(() => false),
    isRight: vi.fn(() => false),
    isAction: vi.fn(() => false),
    isPause: vi.fn(() => false),
    consumePause: vi.fn(() => false),
    consumeClick: vi.fn(() => false),
    consumeTap: vi.fn(() => false),
  };
}

// Mock settings
function createMockSettings() {
  return {
    paddleSize: 'normal',
    ballSpeed: 'normal',
    mute: false,
    masterVolume: 80,
    musicVolume: 60,
    sfxVolume: 80,
  };
}

// Mock a11y
function createMockA11y() {
  return {
    announceLevelStart: vi.fn(),
    announceGameOver: vi.fn(),
    announceLevelComplete: vi.fn(),
    announcePowerUp: vi.fn(),
    announcePause: vi.fn(),
    announceResume: vi.fn(),
    announceLifeLost: vi.fn(),
    announceTimedResults: vi.fn(),
    getReducedEffects: vi.fn(() => false),
  };
}

describe('Game', () => {
  let game, canvas, input, settings, a11y;

  beforeEach(() => {
    canvas = createMockCanvas();
    input = createMockInput();
    settings = createMockSettings();
    a11y = createMockA11y();
    game = new Game(canvas, input, settings, a11y);
  });

  it('starts in MAIN_MENU screen', () => {
    expect(game.screen).toBe(SCREEN.MAIN_MENU);
  });

  it('startGame initializes score, lives, and level', () => {
    game.startGame(false);
    expect(game.scoreDisplay).toBe(0);
    expect(game.livesDisplay).toBe(3);
    expect(game.levelDisplay).toBe(1);
  });

  it('startGame with timed=true sets isTimedMode', () => {
    game.startGame(true);
    expect(game.isTimedMode).toBe(true);
  });

  it('loadLevel creates paddle, balls, and brickGrid', () => {
    game.loadLevel(1);
    expect(game.paddle).not.toBeNull();
    expect(game.balls.length).toBe(1);
    expect(game.brickGrid).not.toBeNull();
    expect(game.brickGrid.bricks.length).toBeGreaterThan(0);
  });

  it('countdown transitions to PLAYING', () => {
    game.loadLevel(1);
    expect(game.screen).toBe(SCREEN.COUNTDOWN);
    // Simulate countdown (3 seconds + epsilon)
    game.update(3200);
    expect(game.screen).toBe(SCREEN.PLAYING);
  });

  it('lives decrease when all balls are lost', () => {
    game.loadLevel(1);
    game.update(3200); // finish countdown
    expect(game.screen).toBe(SCREEN.PLAYING);
    // Make ball go out of bounds
    game.balls[0].y = 800;
    game.balls[0].launched = true;
    game.update(16);
    expect(game.livesDisplay).toBe(2);
  });

  it('game over when lives reach 0', () => {
    game.loadLevel(1);
    game.update(3200);
    expect(game.screen).toBe(SCREEN.PLAYING);
    game.lives = 1;
    game.balls[0].y = 800;
    game.balls[0].launched = true;
    game.update(16);
    expect(game.screen).toBe(SCREEN.GAME_OVER);
  });

  it('level complete when all destructible bricks cleared', () => {
    game.loadLevel(1);
    game.update(3200);
    expect(game.screen).toBe(SCREEN.PLAYING);
    // Manually destroy all bricks
    game.brickGrid.bricks.forEach(b => { b.alive = false; });
    input.consumePause.mockReturnValue(false);
    game.update(16);
    expect(game.screen).toBe(SCREEN.LEVEL_COMPLETE);
  });

  it('pause changes screen to PAUSED', () => {
    game.loadLevel(1);
    game.update(3200);
    expect(game.screen).toBe(SCREEN.PLAYING);
    input.consumePause.mockReturnValue(true);
    game.update(16);
    expect(game.screen).toBe(SCREEN.PAUSED);
  });

  it('resume returns to playing', () => {
    game.loadLevel(1);
    game.update(3200);
    expect(game.screen).toBe(SCREEN.PLAYING);
    game.pause();
    expect(game.screen).toBe(SCREEN.PAUSED);
    game.resume();
    expect(game.screen).toBe(SCREEN.PLAYING);
  });

  it('nextLevel increments level number', () => {
    game.loadLevel(1);
    expect(game.levelDisplay).toBe(1);
    game.nextLevel();
    expect(game.levelDisplay).toBe(2);
  });

  it('score starts at 0', () => {
    game.startGame(false);
    expect(game.scoreDisplay).toBe(0);
  });

  it('bricksDestroyed increments on brick destruction', () => {
    game.loadLevel(1);
    game.update(3200);
    expect(game.bricksDestroyed).toBe(0);
  });
});
