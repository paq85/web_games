class MinesweeperApp {
    constructor() {
        this.storage = new GameStorage('minesweeper');
        this.audio = new AudioManager();
        window.__minesweeper_app = this;
        this.timer = new GameTimer(
            (seconds) => {
                window.__debug_timer_callback_called = true;
                window.__debug_timer_callback_value = seconds;
                if (!this.renderer) {
                    console.error('[MAIN] renderer not defined in timer callback!');
                    return;
                }
                console.log('[MAIN] updateTimerDisplay called with seconds:', seconds);
                // Use setTimeout to ensure DOM is ready and this context is preserved
                setTimeout(() => {
                    const timerDisplay = document.getElementById('timer-display');
                    const digits = timerDisplay ? timerDisplay.querySelectorAll('.digit') : [];
                    const clamped = Math.min(seconds, 999);
                    const str = String(clamped).padStart(3, '0');
                    for (let i = 0; i < 3; i++) {
                        if (digits[i]) {
                            digits[i].textContent = str[i];
                            digits[i].dataset.value = str[i];
                        }
                    }
                    window.__debug_timer_display = str;
                }, 0);
            },
            (seconds) => {
                console.log('[MAIN] TICK callback called with seconds:', seconds);
                this.renderer.updateCountdownDisplay(seconds, this.timer.getTotal());
            }
        );

        const root = document.getElementById('app');
        this.renderer = new Renderer(root);
        this.game = new Game(this.renderer, this.audio, this.timer, this.storage);
        this.input = new InputHandler(this.game, this.renderer, this.audio);

        this.game.onStateChange = (state) => {
            console.log('[MAIN] State changed to:', state);
            this.onStateChange(state);
        };
        this.game.onCellRevealed = (cells, type) => this.onCellRevealed(cells, type);
        this.game.onMineHit = () => this.onMineHit();
        this.game.onWin = () => this.onWin();
        this.game.onGameOver = () => this.onGameOver();

        if (this.storage.getMuted()) {
            this.audio.setMuted(true);
        }

        this.renderer.init();
        this.input.bind();
        this.renderer.showTitleScreen(this.storage.getBestTimes());
    }

    onStateChange(state) {
        switch (state) {
            case 'title':
                this.renderer.showTitleScreen(this.storage.getBestTimes());
                this.renderer.setFaceExpression('neutral');
                this.renderer.hideHUD();
                this.renderer.hideBoard();
                break;
            case 'playing':
                this.renderer.showHUD();
                this.renderer.hideAllOverlays();
                this.renderer.setFaceExpression('neutral');
                this.renderer.showBoard();
                this.renderer.renderBoard(this.game.getBoard());
                this.renderer.updateMineCounter(this.game.getRemainingMines());
                const config = this.game._getDifficultyConfig();
                console.log('[MAIN] Starting timer with', config.timeLimit || 600);
                this.timer.start(config.timeLimit || 600);
                this.renderer.setCellFocus(0, 0);
                break;
            case 'paused':
                this.renderer.showHUD();
                this.renderer.showPause();
                this.renderer.setFaceExpression('worried');
                this.renderer.hideBoard();
                break;
        }
    }

    onCellRevealed(cells, type) {
        this.renderer.updateCells(cells);
        this.renderer.updateMineCounter(this.game.getRemainingMines());

        if (type === 'flag') {
            this.audio.playFlag();
        } else if (type === 'chord') {
            this.audio.playChord();
        } else {
            this.audio.playReveal();
        }

        for (const cell of cells) {
            if (cell.adjacentMines > 0) {
                this.audio.playNumberReveal(cell.adjacentMines);
            }
        }
    }

    onMineHit() {
        this.renderer.setFaceExpression('dead');
        this.audio.playDetonate();
    }

    onGameOver() {
        this.renderer.renderGameOverBoard(this.game.getBoard(), this.game.getDetonatedCell());
        this.renderer.showGameOver();
        this.audio.playGameOver();
    }

    onWin() {
        this.renderer.setFaceExpression('sunglasses');

        const time = this.game.getElapsed();
        const bestTime = this.game.getBestTime();
        let isNewBest = false;

        if (!bestTime || time < bestTime) {
            this.storage.setBestTime(this.game.getDifficulty(), time);
            isNewBest = true;
        }

        this.renderer.showVictory(time, bestTime, isNewBest);
        this.audio.playVictory();
    }

    handleMuteToggle() {
        const muted = !this.audio.isMuted();
        this.audio.setMuted(muted);
        this.game.setMuted(muted);
    }
}

if (typeof module !== 'undefined') module.exports = { MinesweeperApp };

const app = new MinesweeperApp();
window.__minesweeperApp = app;
