import { TicTacToeGame, getBestMove } from './game.js';

const AI_DELAY = 300;

class UI {
  constructor() {
    this.game = new TicTacToeGame();
    this.vsAI = false;
    this.cursorPos = 4;
    this.aiThinking = false;

    this.boardEl = document.getElementById('board');
    this.statusEl = document.getElementById('status');
    this.scoreXEl = document.getElementById('score-x');
    this.scoreOEl = document.getElementById('score-o');
    this.scoreDrawEl = document.getElementById('score-draw');
    this.pvpBtn = document.getElementById('btn-pvp');
    this.aiBtn = document.getElementById('btn-ai');
    this.newGameBtn = document.getElementById('btn-new-game');
    this.resetScoresBtn = document.getElementById('btn-reset-scores');

    this.cells = [];
    for (let i = 0; i < 9; i++) {
      this.cells.push(document.createElement('div'));
      this.cells[i].className = 'cell';
      this.cells[i].setAttribute('role', 'button');
      this.cells[i].setAttribute('tabindex', '0');
      this.cells[i].dataset.index = i;
      this.boardEl.appendChild(this.cells[i]);
    }

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.cells.forEach((cell, i) => {
      cell.addEventListener('click', () => this.handleCellClick(i));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleCellClick(i);
        }
      });
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.newGameBtn.addEventListener('click', () => this.newGame());
    this.resetScoresBtn.addEventListener('click', () => this.resetScores());
    this.pvpBtn.addEventListener('click', () => this.setMode(false));
    this.aiBtn.addEventListener('click', () => this.setMode(true));
  }

  handleKeydown(e) {
    if (this.aiThinking) return;

    const key = e.key.toLowerCase();

    if (key === 'n') {
      this.newGame();
      return;
    }

    if (key === 'm') {
      this.setMode(!this.vsAI);
      return;
    }

    let newPos = this.cursorPos;

    if (key === 'arrowup' || key === 'w') newPos = Math.max(0, this.cursorPos - 3);
    else if (key === 'arrowdown' || key === 's') newPos = Math.min(8, this.cursorPos + 3);
    else if (key === 'arrowleft' || key === 'a') newPos = Math.max(this.cursorPos - 1, Math.floor(this.cursorPos / 3) * 3);
    else if (key === 'arrowright' || key === 'd') newPos = Math.min(this.cursorPos + 1, Math.floor(this.cursorPos / 3) * 3 + 2);
    else if (key === 'enter' || key === ' ') {
      e.preventDefault();
      this.handleCellClick(this.cursorPos);
      return;
    } else {
      return;
    }

    e.preventDefault();
    this.cursorPos = newPos;
    this.updateCursor();
  }

  handleCellClick(index) {
    if (this.aiThinking) return;

    const success = this.game.play(index);
    if (!success) return;

    this.render();

    if (this.vsAI && !this.game.winner && !this.game.isDraw) {
      this.aiThinking = true;
      setTimeout(() => {
        const move = getBestMove(this.game.boardArray);
        if (move >= 0) {
          this.game.play(move);
        }
        this.aiThinking = false;
        this.render();
      }, AI_DELAY);
    }
  }

  setMode(vsAI) {
    this.vsAI = vsAI;
    this.newGame();
  }

  newGame() {
    this.game.reset();
    this.aiThinking = false;
    this.cursorPos = 4;
    this.render();
  }

  resetScores() {
    this.game.resetScores();
    this.renderScores();
  }

  updateCursor() {
    this.cells.forEach((cell, i) => {
      if (i === this.cursorPos) {
        cell.focus();
      }
    });
  }

  render() {
    const board = this.game.boardArray;
    const gameOver = this.game.winner || this.game.isDraw;

    this.cells.forEach((cell, i) => {
      const value = board[i];
      cell.textContent = value || '';
      cell.className = 'cell';

      if (value) {
        cell.classList.add('taken', value.toLowerCase());
      }

      if (gameOver) {
        cell.classList.add('game-over');
        if (this.game.winningLine && this.game.winningLine.includes(i)) {
          cell.classList.add('winner-cell');
        }
      }

      const row = Math.floor(i / 3) + 1;
      const col = (i % 3) + 1;
      const state = value ? `${value}` : 'empty';
      cell.setAttribute('aria-label', `Row ${row}, Column ${col} — ${state}`);
    });

    this.statusEl.textContent = this.game.status;
    this.statusEl.className = 'status';
    if (this.game.winner) this.statusEl.classList.add('win');
    if (this.game.isDraw) this.statusEl.classList.add('draw');

    this.renderScores();
    this.updateCursor();

    this.pvpBtn.classList.toggle('active', !this.vsAI);
    this.aiBtn.classList.toggle('active', this.vsAI);
  }

  renderScores() {
    this.scoreXEl.textContent = this.game.scores.x;
    this.scoreOEl.textContent = this.game.scores.o;
    this.scoreDrawEl.textContent = this.game.scores.draws;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new UI();
});
