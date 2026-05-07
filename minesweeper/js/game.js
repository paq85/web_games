class Game {
    constructor(renderer, audio, timer, storage) {
        this.renderer = renderer;
        this.audio = audio;
        this.timer = timer;
        this.storage = storage;

        this.state = 'title';
        this.difficulty = 'beginner';
        this.customSettings = null;
        this.board = null;
        this.firstClick = true;
        this.detonatedCell = null;

        this.onStateChange = null;
        this.onCellRevealed = null;
        this.onMineHit = null;
        this.onWin = null;
        this.onGameOver = null;
    }

    setDifficulty(key) {
        this.difficulty = key;
        this.storage.setLastDifficulty(key);
        this.state = 'title';
        if (this.onStateChange) this.onStateChange(this.state);
    }

    setCustomDifficulty(rows, cols, mines) {
        if (mines > rows * cols - 9) {
            mines = rows * cols - 9;
        }
        this.customSettings = { rows, cols, mines };
        this.storage.setCustomSettings(this.customSettings);
        this.difficulty = 'custom';
        this.storage.setLastDifficulty('custom');
        this.state = 'title';
        if (this.onStateChange) this.onStateChange(this.state);
    }

    _getDifficultyConfig() {
        if (this.difficulty === 'custom' && this.customSettings) {
            return this.customSettings;
        }
        return Game.DIFFICULTIES[this.difficulty];
    }

    startGame() {
        const config = this._getDifficultyConfig();
        this.board = new Board(config.rows, config.cols, config.mines);
        this.firstClick = true;
        this.detonatedCell = null;
        this.timer.reset();
        this.state = 'playing';
        if (this.onStateChange) this.onStateChange(this.state);
    }

    handleReveal(row, col, inputType) {
        if (this.state !== 'playing') return;

        const cell = this.board.getCell(row, col);
        if (!cell || cell.state !== 'hidden') return;

        if (this.firstClick) {
            this.board.placeMines(row, col);
            this.firstClick = false;
            this.timer.start();
        }

        const result = this.board.revealCell(row, col);

        if (result.hitMine) {
            this.detonatedCell = result.detonatedAt;
            this.state = 'game_over';
            this.timer.stop();
            if (this.onMineHit) this.onMineHit(row, col);
            if (this.onCellRevealed) this.onCellRevealed(result.revealed, inputType);
            if (this.onGameOver) this.onGameOver();
            return;
        }

        if (result.revealed.length > 0 && this.onCellRevealed) {
            this.onCellRevealed(result.revealed, inputType);
        }

        if (this.board.hasWon()) {
            this.state = 'victory';
            this.timer.stop();
            this.board.autoFlagOnWin();
            if (this.onWin) this.onWin();
        }
    }

    handleFlag(row, col) {
        if (this.state !== 'playing') return;

        const cell = this.board.getCell(row, col);
        if (!cell || (cell.state !== 'hidden' && cell.state !== 'flagged' && cell.state !== 'question')) return;

        const wasFlagged = cell.state === 'flagged';
        this.board.cycleFlag(row, col, this.getQuestionMode());
        if (this.onCellRevealed) this.onCellRevealed([cell], 'flag');
        this.renderer.updateMineCounter(this.getRemainingMines());
        return !wasFlagged; // returns true if newly flagged
    }

    handleChord(row, col) {
        if (this.state !== 'playing') return;

        const result = this.board.chord(row, col);
        if (result.revealed.length === 0) return;

        if (result.hitMine) {
            this.detonatedCell = result.detonatedAt;
            this.state = 'game_over';
            this.timer.stop();
            if (this.onMineHit) this.onMineHit(result.detonatedAt.row, result.detonatedAt.col);
            if (this.onCellRevealed) this.onCellRevealed(result.revealed, 'chord');
            if (this.onGameOver) this.onGameOver();
            return;
        }

        if (this.onCellRevealed) this.onCellRevealed(result.revealed, 'chord');

        if (this.board.hasWon()) {
            this.state = 'victory';
            this.timer.stop();
            this.board.autoFlagOnWin();
            if (this.onWin) this.onWin();
        }
    }

    togglePause() {
        if (this.state === 'playing' && !this.firstClick) {
            this.state = 'paused';
            if (this.onStateChange) this.onStateChange(this.state);
        } else if (this.state === 'paused') {
            this.state = 'playing';
            if (this.onStateChange) this.onStateChange(this.state);
        }
    }

    restart() {
        this.startGame();
    }

    showTitleScreen() {
        this.state = 'title';
        this.timer.stop();
        if (this.onStateChange) this.onStateChange(this.state);
    }

    getState() {
        return this.state;
    }

    getBoard() {
        return this.board;
    }

    getRemainingMines() {
        if (!this.board) return 0;
        return this.board.getRemainingMines();
    }

    getElapsed() {
        return this.timer.getElapsed();
    }

    getBestTime() {
        return this.storage.getBestTime(this.difficulty);
    }

    getDetonatedCell() {
        return this.detonatedCell;
    }

    getQuestionMode() {
        return this.storage.getQuestionMode();
    }

    setQuestionMode(enabled) {
        this.storage.setQuestionMode(enabled);
    }

    isMuted() {
        return this.storage.getMuted();
    }

    setMuted(muted) {
        this.storage.setMuted(muted);
    }

    getDifficulty() {
        return this.difficulty;
    }

    getTimeLimit() {
        const config = this._getDifficultyConfig();
        return config.timeLimit || 600;
    }

    setTimeLimit(seconds) {
        const config = this._getDifficultyConfig();
        config.timeLimit = seconds;
        this.storage.setCustomSettings(this.customSettings);
    }
}

Game.DIFFICULTIES = {
    beginner: { rows: 9, cols: 9, mines: 10, timeLimit: 600 },
    intermediate: { rows: 16, cols: 16, mines: 40, timeLimit: 420 },
    expert: { rows: 16, cols: 30, mines: 99, timeLimit: 300 },
};

if (typeof module !== 'undefined') module.exports = { Game };
