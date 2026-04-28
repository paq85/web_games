import { describe, it } from 'node:test';
import strict from 'node:assert/strict';
import {
  createEmptyBoard,
  getWinner,
  isBoardFull,
  isGameOver,
  getAvailableMoves,
  makeMove,
  minimax,
  getBestMove,
  TicTacToeGame
} from '../js/game.js';

describe('createEmptyBoard', () => {
  it('returns an array of 9 null values', () => {
    const board = createEmptyBoard();
    strict.equal(board.length, 9);
    strict.ok(board.every(c => c === null));
  });
});

describe('getWinner', () => {
  it('returns null for empty board', () => {
    strict.equal(getWinner(createEmptyBoard()), null);
  });

  it('detects horizontal win for X', () => {
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    const result = getWinner(board);
    strict.equal(result.winner, 'X');
    strict.deepEqual(result.line, [0, 1, 2]);
  });

  it('detects horizontal win for O', () => {
    const board = [null, null, null, 'O', 'O', 'O', null, null, null];
    const result = getWinner(board);
    strict.equal(result.winner, 'O');
    strict.deepEqual(result.line, [3, 4, 5]);
  });

  it('detects vertical win', () => {
    const board = ['X', null, null, 'X', null, null, 'X', null, null];
    const result = getWinner(board);
    strict.equal(result.winner, 'X');
    strict.deepEqual(result.line, [0, 3, 6]);
  });

  it('detects diagonal win (top-left to bottom-right)', () => {
    const board = ['O', null, null, null, 'O', null, null, null, 'O'];
    const result = getWinner(board);
    strict.equal(result.winner, 'O');
    strict.deepEqual(result.line, [0, 4, 8]);
  });

  it('detects diagonal win (top-right to bottom-left)', () => {
    const board = [null, null, 'X', null, 'X', null, 'X', null, null];
    const result = getWinner(board);
    strict.equal(result.winner, 'X');
    strict.deepEqual(result.line, [2, 4, 6]);
  });

  it('returns null when no winner exists', () => {
    const board = ['X', 'O', null, 'O', 'X', null, null, null, null];
    strict.equal(getWinner(board), null);
  });
});

describe('isBoardFull', () => {
  it('returns false for empty board', () => {
    strict.equal(isBoardFull(createEmptyBoard()), false);
  });

  it('returns true when all cells are filled', () => {
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'];
    strict.equal(isBoardFull(board), true);
  });

  it('returns false when any cell is empty', () => {
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', null];
    strict.equal(isBoardFull(board), false);
  });
});

describe('isGameOver', () => {
  it('returns true when there is a winner', () => {
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    strict.equal(isGameOver(board), true);
  });

  it('returns true when board is full with no winner', () => {
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'];
    strict.equal(isGameOver(board), true);
  });

  it('returns false when game is still ongoing', () => {
    const board = ['X', 'O', null, null, 'X', null, null, null, null];
    strict.equal(isGameOver(board), false);
  });
});

describe('getAvailableMoves', () => {
  it('returns all indices for empty board', () => {
    strict.deepEqual(getAvailableMoves(createEmptyBoard()), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('returns only empty cell indices', () => {
    const board = ['X', null, 'O', null, 'X', null, 'O', null, 'X'];
    strict.deepEqual(getAvailableMoves(board), [1, 3, 5, 7]);
  });

  it('returns empty array for full board', () => {
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'];
    strict.deepEqual(getAvailableMoves(board), []);
  });
});

describe('makeMove', () => {
  it('places the player mark at the given index', () => {
    const board = createEmptyBoard();
    const newBoard = makeMove(board, 0, 'X');
    strict.equal(newBoard[0], 'X');
    strict.equal(board[0], null);
  });

  it('does not overwrite an occupied cell', () => {
    const board = ['X', null, null, null, null, null, null, null, null];
    const newBoard = makeMove(board, 0, 'O');
    strict.equal(newBoard[0], 'X');
  });
});

describe('getBestMove', () => {
  it('returns the winning move when available', () => {
    const board = ['O', 'O', null, null, null, null, null, null, null];
    strict.equal(getBestMove(board), 2);
  });

  it('blocks an opponent winning move', () => {
    const board = ['X', 'X', null, null, null, null, null, null, null];
    strict.equal(getBestMove(board), 2);
  });

  it('returns a valid move on empty board', () => {
    const board = createEmptyBoard();
    const move = getBestMove(board);
    strict.ok(move >= 0 && move <= 8);
  });

  it('returns -1 when no moves are available', () => {
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'];
    strict.equal(getBestMove(board), -1);
  });

  it('AI cannot be beaten from empty board', () => {
    const board = createEmptyBoard();
    board[0] = 'X';
    let aiBoard = [...board];
    let humanWon = false;

    for (let humanMove of getAvailableMoves(aiBoard)) {
      aiBoard = makeMove(aiBoard, humanMove, 'X');
      if (getWinner(aiBoard)) { humanWon = true; break; }

      const aiMove = getBestMove(aiBoard);
      if (aiMove >= 0) aiBoard = makeMove(aiBoard, aiMove, 'O');
      if (getWinner(aiBoard)) break;
    }
    strict.equal(humanWon, false);
  });
});

describe('TicTacToeGame', () => {
  it('starts with X as current player', () => {
    const game = new TicTacToeGame();
    strict.equal(game.currentPlayer, 'X');
  });

  it('alternates turns between X and O', () => {
    const game = new TicTacToeGame();
    game.play(0);
    strict.equal(game.currentPlayer, 'O');
    game.play(1);
    strict.equal(game.currentPlayer, 'X');
  });

  it('detects a win', () => {
    const game = new TicTacToeGame();
    game.play(0); game.play(1);
    game.play(3); game.play(2);
    game.play(6);
    strict.equal(game.winner, 'X');
    strict.deepEqual(game.winningLine, [0, 3, 6]);
  });

  it('detects a draw', () => {
    const game = new TicTacToeGame();
    const moves = [0, 2, 1, 3, 5, 4, 6, 7, 8];
    moves.forEach(m => game.play(m));
    strict.equal(game.isDraw, true);
    strict.equal(game.winner, null);
  });

  it('prevents playing after the game is over', () => {
    const game = new TicTacToeGame();
    game.play(0); game.play(1);
    game.play(3); game.play(2);
    game.play(6);
    strict.equal(game.play(4), false);
  });

  it('prevents playing on an occupied cell', () => {
    const game = new TicTacToeGame();
    game.play(0);
    strict.equal(game.play(0), false);
  });

  it('tracks scores correctly', () => {
    const game = new TicTacToeGame();
    game.resetScores();

    game.play(0); game.play(1);
    game.play(3); game.play(2);
    game.play(6);
    strict.equal(game.scores.x, 1);

    game.reset();
    const moves = [0, 2, 1, 3, 5, 4, 6, 7, 8];
    moves.forEach(m => game.play(m));
    strict.equal(game.scores.draws, 1);
  });

  it('resets the game state', () => {
    const game = new TicTacToeGame();
    game.play(0); game.play(1);
    game.play(3); game.play(2);
    game.play(6);
    strict.equal(game.winner, 'X');

    game.reset();
    strict.equal(game.winner, null);
    strict.equal(game.currentPlayer, 'X');
    strict.ok(game.boardArray.every(c => c === null));
  });

  it('returns correct status strings', () => {
    const game = new TicTacToeGame();
    strict.equal(game.status, "X's turn");

    game.play(0);
    strict.equal(game.status, "O's turn");

    game.play(1);
    game.play(3);
    game.play(2);
    game.play(6);
    strict.equal(game.status, 'X wins!');
  });
});
