class InputHandler {
    constructor(game, renderer, audio) {
        this.game = game;
        this.renderer = renderer;
        this.audio = audio;

        this.flagMode = false;
        this.focusedRow = 0;
        this.focusedCol = 0;
        this.mouseDownButton = -1;
        this.longPressTimer = null;
        this.touchStartTime = 0;
        this.touchStartPos = null;

        this._boundMethods = {
            onMouseDown: this.onMouseDown.bind(this),
            onMouseUp: this.onMouseUp.bind(this),
            onContextMenu: this.onContextMenu.bind(this),
            onMouseLeave: this.onMouseLeave.bind(this),
            onKeyDown: this.onKeyDown.bind(this),
            onTouchStart: this.onTouchStart.bind(this),
            onTouchEnd: this.onTouchEnd.bind(this),
            onTouchMove: this.onTouchMove.bind(this),
        };
    }

    bind() {
        const board = this.renderer.getBoardContainer();
        board.addEventListener('mousedown', this._boundMethods.onMouseDown, { passive: false });
        board.addEventListener('mouseup', this._boundMethods.onMouseUp, { passive: false });
        board.addEventListener('contextmenu', this._boundMethods.onContextMenu, { passive: false });
        document.addEventListener('mouseleave', this._boundMethods.onMouseLeave);
        document.addEventListener('keydown', this._boundMethods.onKeyDown);
        board.addEventListener('touchstart', this._boundMethods.onTouchStart, { passive: false });
        board.addEventListener('touchend', this._boundMethods.onTouchEnd, { passive: false });
        board.addEventListener('touchmove', this._boundMethods.onTouchMove, { passive: false });

        this.bindMobileToolbar();
        this.bindTitleScreen();
        this.bindOverlayButtons();
    }

    unbind() {
        const board = this.renderer.getBoardContainer();
        board.removeEventListener('mousedown', this._boundMethods.onMouseDown);
        board.removeEventListener('mouseup', this._boundMethods.onMouseUp);
        board.removeEventListener('contextmenu', this._boundMethods.onContextMenu);
        document.removeEventListener('mouseleave', this._boundMethods.onMouseLeave);
        document.removeEventListener('keydown', this._boundMethods.onKeyDown);
        board.removeEventListener('touchstart', this._boundMethods.onTouchStart);
        board.removeEventListener('touchend', this._boundMethods.onTouchEnd);
        board.removeEventListener('touchmove', this._boundMethods.onTouchMove);
    }

    // ---- Mouse Events ----

    onMouseDown(e) {
        if (e.button === 1 || e.button === 2) {
            e.preventDefault();
        }
        this.mouseDownButton = e.button;
        if (e.button === 0) {
            this.renderer.setFaceExpression('worried');
        }
        if (e.button === 1) {
            const cell = this._getCellFromTarget(e.target);
            if (cell) {
                this.game.handleChord(cell.row, cell.col);
            }
        }
    }

    onMouseUp(e) {
        const cell = this._getCellFromTarget(e.target);
        if (e.button === 0 && cell) {
            this.game.handleReveal(cell.row, cell.col, 'mouse');
        }
        if (e.button === 2 && cell) {
            this.game.handleFlag(cell.row, cell.col);
        }
        this.mouseDownButton = -1;
    }

    onMouseLeave() {
        if (this.mouseDownButton !== -1) {
            this.renderer.setFaceExpression('neutral');
            this.mouseDownButton = -1;
        }
    }

    onContextMenu(e) {
        e.preventDefault();
    }

    onMouseLeave() {
        if (this.mouseDownButton !== -1) {
            this.renderer.setFaceExpression('neutral');
        }
    }

    // ---- Keyboard Events ----

    onKeyDown(e) {
        const state = this.game.getState();
        const focused = document.activeElement;
        const isCellFocused = focused && (focused.classList.contains('cell') || focused.id === 'board-container');

        if (state === 'title') {
            if (['1', '2', '3', '4'].includes(e.key)) {
                const keys = ['1', '2', '3', '4'];
                const difficulties = ['beginner', 'intermediate', 'expert', 'custom'];
                const idx = keys.indexOf(e.key);
                if (idx >= 0) {
                    this.game.setDifficulty(difficulties[idx]);
                    if (difficulties[idx] !== 'custom') {
                        this.game.startGame();
                    }
                }
            }
            return;
        }

        if (isCellFocused && state === 'playing') {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusedRow = (this.focusedRow - 1 + this.game.getBoard().getRows()) % this.game.getBoard().getRows();
                    this.renderer.setCellFocus(this.focusedRow, this.focusedCol);
                    return;
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusedRow = (this.focusedRow + 1) % this.game.getBoard().getRows();
                    this.renderer.setCellFocus(this.focusedRow, this.focusedCol);
                    return;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.focusedCol = (this.focusedCol - 1 + this.game.getBoard().getCols()) % this.game.getBoard().getCols();
                    this.renderer.setCellFocus(this.focusedRow, this.focusedCol);
                    return;
                case 'ArrowRight':
                    e.preventDefault();
                    this.focusedCol = (this.focusedCol + 1) % this.game.getBoard().getCols();
                    this.renderer.setCellFocus(this.focusedRow, this.focusedCol);
                    return;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.game.handleFlag(this.focusedRow, this.focusedCol);
                    } else if (e.ctrlKey) {
                        this.game.handleChord(this.focusedRow, this.focusedCol);
                    } else {
                        this.game.handleReveal(this.focusedRow, this.focusedCol, 'keyboard');
                    }
                    return;
            }
        }

        switch (e.key) {
            case 'p':
            case 'P':
            case 'Escape':
                this.game.togglePause();
                break;
            case 'r':
            case 'R':
                if (['playing', 'game_over', 'victory'].includes(state)) {
                    this.game.restart();
                }
                break;
            case 'm':
            case 'M':
                const muted = !this.game.isMuted();
                this.game.setMuted(muted);
                this.audio.setMuted(muted);
                break;
        }
    }

    // ---- Touch Events ----

    onTouchStart(e) {
        e.preventDefault();
        this.touchStartTime = Date.now();
        const touches = e.touches;

        if (touches.length === 1) {
            const t = touches[0];
            this.touchStartPos = { x: t.clientX, y: t.clientY };
            this._twoFingerTouch = false;

            const cell = this._getCellFromTarget(t.target || e.target);
            this._touchCell = cell;

            this.longPressTimer = setTimeout(() => {
                if (this._touchCell) {
                    this.game.handleFlag(this._touchCell.row, this._touchCell.col);
                    this.longPressTimer = null;
                }
            }, 500);
        } else if (touches.length === 2) {
            this._twoFingerTouch = true;
            const t = touches[0];
            this.touchStartPos = { x: t.clientX, y: t.clientY };
            const cell = this._getCellFromTarget(t.target || e.target);
            this._touchCell = cell;
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (!this._touchCell) return;

        if (this._twoFingerTouch) {
            this.game.handleChord(this._touchCell.row, this._touchCell.col);
        } else {
            const elapsed = Date.now() - this.touchStartTime;
            if (elapsed >= 500) {
                // Long press already handled by timer; do nothing extra.
            } else {
                if (this.flagMode) {
                    this.game.handleFlag(this._touchCell.row, this._touchCell.col);
                } else {
                    this.game.handleReveal(this._touchCell.row, this._touchCell.col, 'touch');
                }
            }
        }

        this._touchCell = null;
        this._twoFingerTouch = false;
    }

    onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length >= 1 && this.touchStartPos) {
            const t = e.touches[0];
            const dx = t.clientX - this.touchStartPos.x;
            const dy = t.clientY - this.touchStartPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > 10) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }
        }
    }

    // ---- Mobile Toolbar ----

    bindMobileToolbar() {
        const flagBtn = this.renderer.$('#mobile-flag');
        if (flagBtn) {
            flagBtn.addEventListener('click', () => {
                this.flagMode = !this.flagMode;
                flagBtn.classList.toggle('active', this.flagMode);
            });
        }

        const pauseBtn = this.renderer.$('#mobile-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.game.togglePause());
        }

        const restartBtn = this.renderer.$('#mobile-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.game.restart());
        }

        const settingsBtn = this.renderer.$('#mobile-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.renderer.showOverlay('settings-panel'));
        }
    }

    // ---- Title Screen ----

    bindTitleScreen() {
        const root = this.renderer.root;

        root.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-difficulty]');
            if (btn) {
                const key = btn.getAttribute('data-difficulty');
                if (key === 'custom') {
                    const customDiv = this.renderer.$('#custom-settings');
                    if (customDiv) {
                        const isVisible = customDiv.classList.toggle('visible');
                        customDiv.classList.toggle('hidden', !isVisible);
                    }
                    return;
                }
                this.game.setDifficulty(key);
                this.game.startGame();
                return;
            }

            if (e.target.id === 'custom-start') {
                const rows = parseInt(this.renderer.$('#custom-rows').value, 10);
                const cols = parseInt(this.renderer.$('#custom-cols').value, 10);
                const mines = parseInt(this.renderer.$('#custom-mines').value, 10);
                if (rows >= 5 && cols >= 5 && mines >= 1) {
                    this.game.setCustomDifficulty(rows, cols, mines);
                    this.game.startGame();
                }
                return;
            }

            if (e.target.id === 'custom-back') {
                const customDiv = this.renderer.$('#custom-settings');
                if (customDiv) {
                    customDiv.classList.remove('visible');
                    customDiv.classList.add('hidden');
                }
            }
        });
    }

    // ---- Overlay Buttons ----

    bindOverlayButtons() {
        const root = this.renderer.root;

        const faceBtn = this.renderer.$('#face-button');
        if (faceBtn) faceBtn.addEventListener('click', () => this.game.restart());

        const resumeBtn = this.renderer.$('#resume-button');
        if (resumeBtn) resumeBtn.addEventListener('click', () => this.game.togglePause());

        const pauseRestart = this.renderer.$('#pause-restart');
        if (pauseRestart) pauseRestart.addEventListener('click', () => this.game.restart());

        const gameOverAgain = this.renderer.$('#game-over-again');
        if (gameOverAgain) gameOverAgain.addEventListener('click', () => this.game.restart());

        const gameOverMenu = this.renderer.$('#game-over-menu');
        if (gameOverMenu) gameOverMenu.addEventListener('click', () => this.game.showTitleScreen());

        const victoryAgain = this.renderer.$('#victory-again');
        if (victoryAgain) victoryAgain.addEventListener('click', () => this.game.restart());

        const victoryMenu = this.renderer.$('#victory-menu');
        if (victoryMenu) victoryMenu.addEventListener('click', () => this.game.showTitleScreen());

        const settingsBack = this.renderer.$('#settings-back');
        if (settingsBack) {
            settingsBack.addEventListener('click', () => this.renderer.hideOverlay('settings-panel'));
        }

        const questionCheckbox = this.renderer.$('#setting-question-mode');
        if (questionCheckbox) {
            questionCheckbox.checked = this.game.getQuestionMode();
            questionCheckbox.addEventListener('change', () => {
                this.game.setQuestionMode(questionCheckbox.checked);
            });
        }

        const muteCheckbox = this.renderer.$('#setting-mute');
        if (muteCheckbox) {
            muteCheckbox.checked = this.game.isMuted();
            muteCheckbox.addEventListener('change', () => {
                const muted = muteCheckbox.checked;
                this.game.setMuted(muted);
                this.audio.setMuted(muted);
            });
        }
    }

    // ---- Helper ----

    _getCellFromTarget(target) {
        let el = target;
        while (el) {
            if (el.classList && el.classList.contains('cell')) {
                const row = parseInt(el.getAttribute('data-row'), 10);
                const col = parseInt(el.getAttribute('data-col'), 10);
                if (!isNaN(row) && !isNaN(col)) {
                    return { row, col };
                }
            }
            el = el.parentElement;
        }
        return null;
    }
}

if (typeof module !== 'undefined') module.exports = { InputHandler };
