const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export function createEmptyBoard() {
  return Array(9).fill(null);
}

export function getWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

export function isBoardFull(board) {
  return board.every(cell => cell !== null);
}

export function isGameOver(board) {
  return getWinner(board) !== null || isBoardFull(board);
}

export function getAvailableMoves(board) {
  const moves = [];
  board.forEach((cell, i) => {
    if (cell === null) moves.push(i);
  });
  return moves;
}

export function makeMove(board, index, player) {
  if (board[index] !== null) return board;
  const newBoard = [...board];
  newBoard[index] = player;
  return newBoard;
}

export function minimax(board, depth, isMaximizing, alpha, beta) {
  const result = getWinner(board);
  if (result) {
    return result.winner === 'O' ? 10 - depth : depth - 10;
  }
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of getAvailableMoves(board)) {
      const score = minimax(makeMove(board, move, 'O'), depth + 1, false, alpha, beta);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of getAvailableMoves(board)) {
      const score = minimax(makeMove(board, move, 'X'), depth + 1, true, alpha, beta);
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBestMove(board) {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return -1;

  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const score = minimax(makeMove(board, move, 'O'), 0, false, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export class TicTacToeGame {
  constructor() {
    this.board = createEmptyBoard();
    this.currentPlayer = 'X';
    this.winner = null;
    this.winningLine = null;
    this.isDraw = false;
    this.scores = this.loadScores();
  }

  loadScores() {
    try {
      const saved = localStorage.getItem('ttt_scores');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 0, o: 0, draws: 0 };
  }

  saveScores() {
    try {
      localStorage.setItem('ttt_scores', JSON.stringify(this.scores));
    } catch {}
  }

  resetScores() {
    this.scores = { x: 0, o: 0, draws: 0 };
    this.saveScores();
  }

  get boardArray() {
    return [...this.board];
  }

  get status() {
    if (this.winner) return `${this.winner} wins!`;
    if (this.isDraw) return "It's a draw!";
    return `${this.currentPlayer}'s turn`;
  }

  play(index) {
    if (this.winner || this.isDraw || this.board[index] !== null) return false;

    this.board[index] = this.currentPlayer;
    const result = getWinner(this.board);

    if (result) {
      this.winner = result.winner;
      this.winningLine = result.line;
      this.scores[result.winner.toLowerCase()]++;
      this.saveScores();
    } else if (isBoardFull(this.board)) {
      this.isDraw = true;
      this.scores.draws++;
      this.saveScores();
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    return true;
  }

  reset() {
    this.board = createEmptyBoard();
    this.currentPlayer = 'X';
    this.winner = null;
    this.winningLine = null;
    this.isDraw = false;
  }
}
