// === Game Unit Tests ===
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../js/game.js';
import { STATE, TILE } from '../../js/constants.js';

// Mock canvas
function createMockCanvas() {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    globalAlpha: 1,
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  };
  const canvas = {
    getContext: () => ctx,
    width: 448,
    height: 496,
    style: {},
    parentElement: { clientWidth: 800, clientHeight: 600 },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    focus: vi.fn(),
  };
  return canvas;
}

// Mock DOM
function setupDOM() {
  document.body.innerHTML = `
    <div id="game-container">
      <canvas id="game-canvas"></canvas>
      <div id="aria-score"></div>
      <div id="aria-status"></div>
    </div>
  `;
}

describe('Game', () => {
  let game;
  let canvas;

  beforeEach(() => {
    setupDOM();
    canvas = createMockCanvas();
    game = new Game(canvas);
  });

  it('initializes in MENU state', () => {
    expect(game.getState()).toBe(STATE.MENU);
  });

  it('starts with correct score', () => {
    expect(game.getScore()).toBe(0);
  });

  it('starts with correct lives', () => {
    expect(game.getLives()).toBe(3);
  });

  it('starts at level 1', () => {
    expect(game.getLevel()).toBe(1);
  });

  it('has maze initialized', () => {
    expect(game.maze).toBeDefined();
    expect(game.maze.totalDots).toBeGreaterThan(0);
  });

  it('has ghosts array', () => {
    expect(game.ghosts).toBeDefined();
  });

  it('has pacman initialized', () => {
    expect(game.pacman).toBeDefined();
    expect(game.pacman.alive).toBe(true);
  });

  it('transitions to difficulty select on play', () => {
    // Simulate menu selection
    game.menuIndex = 0;
    game.input.confirmQueue = 1;
    game._updateMenu(0.016);
    expect(game.getState()).toBe(STATE.DIFFICULTY);
  });

  it('transitions to high scores', () => {
    game.menuIndex = 2;
    game.input.confirmQueue = 1;
    game._updateMenu(0.016);
    expect(game.getState()).toBe(STATE.SCORES);
  });

  it('transitions to settings', () => {
    game.menuIndex = 3;
    game.input.confirmQueue = 1;
    game._updateMenu(0.016);
    expect(game.getState()).toBe(STATE.SETTINGS);
  });

  it('starts game after difficulty selection', () => {
    game.state = STATE.DIFFICULTY;
    game.difficultyIndex = 1;
    game.input.confirmQueue = 1;
    game._updateDifficulty(0.016);
    expect(game.getState()).toBe(STATE.READY);
  });

  it('transitions from ready to playing after timer', () => {
    game.state = STATE.READY;
    game.stateTimer = 0.01;
    game.audio.init = vi.fn();
    game.audio.startGameMusic = vi.fn();
    game._updateReady(0.02);
    expect(game.getState()).toBe(STATE.PLAYING);
  });

  it('pauses on escape during play', () => {
    game.state = STATE.PLAYING;
    game.input.pauseQueue = 1;
    game.audio.playPause = vi.fn();
    game.audio.stopMusic = vi.fn();
    game._updatePlaying(0.016);
    expect(game.getState()).toBe(STATE.PAUSED);
  });

  it('resumes on escape during pause', () => {
    game.state = STATE.PAUSED;
    game.input.pauseQueue = 1;
    game.audio.playPause = vi.fn();
    game.audio.startGameMusic = vi.fn();
    game._updatePaused(0.016);
    expect(game.getState()).toBe(STATE.PLAYING);
  });
});
