class Renderer {
    constructor(rootElement) {
        this.root = rootElement;
        this.cellElements = [];
        this.elements = {};
    }

    init() {
        this.root.innerHTML = '';

        this._createTitleScreen();
        this._createHUD();
        this._createBoard();
        this._createMobileToolbar();
        this._createPauseOverlay();
        this._createGameOverOverlay();
        this._createVictoryOverlay();
        this._createSettingsPanel();

        this.titleScreen = this.$('#title-screen');
        this.hud = this.$('#hud');
        this.boardWrapper = this.$('#board-wrapper');

        this.titleScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
    }

    $(selector) {
        return this.root.querySelector(selector);
    }

    $$(selector) {
        return this.root.querySelectorAll(selector);
    }

    _createTitleScreen() {
        const overlay = document.createElement('div');
        overlay.id = 'title-screen';
        overlay.className = 'overlay';

        overlay.innerHTML = `
            <h1>MINESWEEPER</h1>
            <div id="difficulty-buttons">
                <button data-difficulty="beginner">Beginner (9x9, 10 mines)</button>
                <button data-difficulty="intermediate">Intermediate (16x16, 40 mines)</button>
                <button data-difficulty="expert">Expert (30x16, 99 mines)</button>
                <button data-difficulty="custom">Custom</button>
            </div>
            <div id="best-times"></div>
            <div id="custom-settings" class="custom-settings hidden">
                <div class="custom-row">
                    <label for="custom-rows">Rows:</label>
                    <input type="number" id="custom-rows" min="5" max="30" value="9">
                </div>
                <div class="custom-row">
                    <label for="custom-cols">Columns:</label>
                    <input type="number" id="custom-cols" min="5" max="50" value="9">
                </div>
                <div class="custom-row">
                    <label for="custom-mines">Mines:</label>
                    <input type="number" id="custom-mines" min="1" max="999" value="10">
                </div>
                <div class="custom-buttons">
                    <button id="custom-start">Start</button>
                    <button id="custom-back">Back</button>
                </div>
            </div>
        `;

        this.root.appendChild(overlay);
    }

    _createHUD() {
        const hud = document.createElement('div');
        hud.id = 'hud';
        hud.className = 'hidden';

        hud.innerHTML = `
            <div id="mine-counter" class="segment-display">
                <span class="digit">0</span><span class="digit">0</span><span class="digit">0</span>
            </div>
            <button id="face-button">🙂</button>
            <div id="timer-display" class="segment-display">
                <span class="digit">0</span><span class="digit">0</span><span class="digit">0</span>
            </div>
        `;

        this.root.appendChild(hud);
        this.elements.mineDigits = Array.from(hud.querySelectorAll('#mine-counter .digit'));
        this.elements.timerDigits = Array.from(hud.querySelectorAll('#timer-display .digit'));
        this.elements.faceButton = hud.querySelector('#face-button');
    }

    _createBoard() {
        const wrapper = document.createElement('div');
        wrapper.id = 'board-wrapper';

        const container = document.createElement('div');
        container.id = 'board-container';
        container.setAttribute('role', 'grid');

        wrapper.appendChild(container);
        this.root.appendChild(wrapper);
        this.elements.boardContainer = container;
    }

    _createMobileToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'mobile-toolbar';
        toolbar.className = 'hidden';

        toolbar.innerHTML = `
            <button id="mobile-flag" aria-label="Toggle flag mode">🚩</button>
            <button id="mobile-pause" aria-label="Pause">⏸</button>
            <button id="mobile-restart" aria-label="Restart">🔄</button>
            <button id="mobile-settings" aria-label="Settings">⚙</button>
        `;

        this.root.appendChild(toolbar);
    }

    _createPauseOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'pause-overlay';
        overlay.className = 'overlay hidden';

        overlay.innerHTML = `
            <h1>PAUSED</h1>
            <button id="resume-button">Resume</button>
            <button id="pause-restart">Restart</button>
        `;

        this.root.appendChild(overlay);
    }

    _createGameOverOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.className = 'overlay hidden';

        overlay.innerHTML = `
            <h1>GAME OVER</h1>
            <button id="game-over-again">Try Again</button>
            <button id="game-over-menu">Main Menu</button>
        `;

        this.root.appendChild(overlay);
    }

    _createVictoryOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'victory-overlay';
        overlay.className = 'overlay hidden';

        overlay.innerHTML = `
            <h1>YOU WIN!</h1>
            <div id="victory-stats">
                <div id="victory-time"></div>
                <div id="victory-best"></div>
                <div id="victory-new-record" class="hidden">NEW RECORD!</div>
            </div>
            <button id="victory-again">Play Again</button>
            <button id="victory-menu">Main Menu</button>
        `;

        this.root.appendChild(overlay);
    }

    _createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.className = 'settings-overlay hidden';

        panel.innerHTML = `
            <div class="card">
                <h2>Settings</h2>
                <label><input type="checkbox" id="setting-question-mode"> Question mode</label>
                <label><input type="checkbox" id="setting-mute"> Mute audio</label>
                <button id="settings-back">Back</button>
            </div>
        `;

        this.root.appendChild(panel);
    }

    renderBoard(board) {
        const container = this.elements.boardContainer;
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${board.getCols()}, var(--cell-size, 30px))`;

        this.cellElements = [];
        for (let r = 0; r < board.getRows(); r++) {
            this.cellElements[r] = [];
            for (let c = 0; c < board.getCols(); c++) {
                const cell = document.createElement('div');
                cell.className = 'cell cell-hidden';
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('data-row', r);
                cell.setAttribute('data-col', c);
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}, Hidden`);
                container.appendChild(cell);
                this.cellElements[r][c] = cell;
            }
        }
    }

    updateCell(cell) {
        const el = this.cellElements[cell.row][cell.col];
        if (!el) return;

        el.className = 'cell';
        el.textContent = '';
        el.removeAttribute('data-number');

        const labelBase = `Row ${cell.row + 1}, Column ${cell.col + 1}`;

        switch (cell.state) {
            case 'hidden':
                el.classList.add('cell-hidden');
                el.setAttribute('aria-label', `${labelBase}, Hidden`);
                break;

            case 'flagged':
                el.classList.add('cell-hidden', 'cell-flagged');
                el.textContent = '🚩';
                el.setAttribute('aria-label', `${labelBase}, Flagged`);
                break;

            case 'question':
                el.classList.add('cell-hidden', 'cell-question');
                el.textContent = '?';
                el.setAttribute('aria-label', `${labelBase}, Question`);
                break;

            case 'misflagged':
                el.classList.add('cell-revealed', 'cell-misflagged');
                el.textContent = '❌';
                el.setAttribute('aria-label', `${labelBase}, Misflagged`);
                break;

            case 'revealed':
                if (cell.isMine) {
                    el.classList.add('cell-revealed', 'cell-mine');
                    el.textContent = '💣';
                    el.setAttribute('aria-label', `${labelBase}, Mine`);
                } else if (cell.adjacentMines > 0) {
                    el.classList.add('cell-revealed', 'cell-number');
                    el.textContent = cell.adjacentMines;
                    el.setAttribute('data-number', cell.adjacentMines);
                    el.setAttribute('aria-label', `${labelBase}, ${cell.adjacentMines} mines`);
                } else {
                    el.classList.add('cell-revealed');
                    el.setAttribute('aria-label', `${labelBase}, Empty`);
                }
                break;
        }
    }

    updateCells(cells) {
        for (const cell of cells) {
            this.updateCell(cell);
        }
    }

    updateMineCounter(count) {
        const display = count < 0 ? `-${String(Math.abs(count)).padStart(2, '0')}` : String(count).padStart(3, '0');
        for (let i = 0; i < 3; i++) {
            this.elements.mineDigits[i].textContent = display[i] || '0';
        }
    }

    updateTimerDisplay(seconds, totalSeconds) {
        // Write to window for debugging
        window.__debug_renderer_call = true;
        window.__debug_renderer_seconds = seconds;
        window.__debug_renderer_timerDigits = this.elements.timerDigits;

        if (!this.elements.timerDigits) {
            window.__debug_renderer_error = 'timerDigits not initialized!';
            return;
        }
        const clamped = Math.min(seconds, 999);
        const str = String(clamped).padStart(3, '0');
        // Write to window for debugging
        window.__debug_digits = Array.from(this.elements.timerDigits).map(d => ({
            textContent: d.textContent,
            datasetValue: d.dataset.value
        }));
        // Update the digits
        for (let i = 0; i < 3; i++) {
            this.elements.timerDigits[i].textContent = str[i];
            this.elements.timerDigits[i].dataset.value = str[i];
        }
        // Write to window for debugging
        window.__debug_timer_display = str;
        if (totalSeconds !== undefined) {
            const totalStr = String(totalSeconds).padStart(3, '0');
            this.elements.timerDigits.forEach((digit, i) => {
                digit.dataset.total = totalStr[i] || '0';
            });
        }
    }

    updateCountdownDisplay(seconds, totalSeconds) {
        const remaining = totalSeconds - seconds;
        const clamped = Math.max(0, Math.min(remaining, 999));
        const str = String(clamped).padStart(3, '0');
        for (let i = 0; i < 3; i++) {
            this.elements.timerDigits[i].textContent = str[i];
        }
    }

    setFaceExpression(expr) {
        const faces = {
            neutral: '🙂',
            worried: '😮',
            sunglasses: '😎',
            dead: '😵'
        };
        this.elements.faceButton.textContent = faces[expr] || faces.neutral;
    }

    setCellFocus(row, col) {
        const el = this.cellElements[row] && this.cellElements[row][col];
        if (el) {
            for (let r = 0; r < this.cellElements.length; r++) {
                for (let c = 0; c < this.cellElements[r].length; c++) {
                    this.cellElements[r][c].setAttribute('tabindex', '-1');
                }
            }
            el.setAttribute('tabindex', '0');
            el.focus();
        }
    }

    showOverlay(id) {
        const el = this.$('#' + id);
        if (el) el.classList.remove('hidden');
    }

    hideOverlay(id) {
        const el = this.$('#' + id);
        if (el) el.classList.add('hidden');
    }

    showTitleScreen(bestTimes) {
        this.hideAllOverlays();
        this.hideHUD();
        this.hideBoard();
        this.showOverlay('title-screen');

        const bestDiv = this.$('#best-times');
        if (bestDiv && bestTimes) {
            bestDiv.innerHTML = '<h2>Best Times</h2>' +
                (bestTimes.beginner ? `<p>Beginner: ${bestTimes.beginner}s</p>` : '') +
                (bestTimes.intermediate ? `<p>Intermediate: ${bestTimes.intermediate}s</p>` : '') +
                (bestTimes.expert ? `<p>Expert: ${bestTimes.expert}s</p>` : '');
        }
    }

    showGameOver() {
        this.hideAllOverlays();
        this.showOverlay('game-over-overlay');
    }

    showVictory(time, bestTime, isNewBest) {
        this.hideAllOverlays();

        const timeEl = this.$('#victory-time');
        if (timeEl) timeEl.textContent = `Time: ${time}s`;

        const bestEl = this.$('#victory-best');
        if (bestEl) bestEl.textContent = bestTime ? `Best: ${bestTime}s` : '';

        const recordEl = this.$('#victory-new-record');
        if (recordEl) {
            if (isNewBest) {
                recordEl.classList.remove('hidden');
            } else {
                recordEl.classList.add('hidden');
            }
        }

        this.showOverlay('victory-overlay');
    }

    showPause() {
        this.hideAllOverlays();
        this.showOverlay('pause-overlay');
    }

    hideAllOverlays() {
        ['title-screen', 'pause-overlay', 'game-over-overlay', 'victory-overlay', 'settings-panel'].forEach(id => {
            this.hideOverlay(id);
        });
    }

    showHUD() {
        this.hud.classList.remove('hidden');
    }

    hideHUD() {
        this.hud.classList.add('hidden');
    }

    showBoard() {
        this.boardWrapper.classList.remove('hidden');
    }

    hideBoard() {
        this.boardWrapper.classList.add('hidden');
    }

    getBoardContainer() {
        return this.elements.boardContainer;
    }

    getCellElement(row, col) {
        return this.cellElements[row] && this.cellElements[row][col];
    }

    renderGameOverBoard(board, detonatedCell) {
        const cells = board.getCells();

        for (let r = 0; r < board.getRows(); r++) {
            for (let c = 0; c < board.getCols(); c++) {
                const cell = cells[r][c];
                if (cell.isMine && cell.state !== 'revealed' && cell.state !== 'flagged') {
                    board.setCellState(r, c, 'revealed');
                    this.updateCell(cell);
                }

                if (detonatedCell && r === detonatedCell.row && c === detonatedCell.col) {
                    const el = this.cellElements[r][c];
                    el.classList.add('cell-detonated');
                }
            }
        }

        const flaggedCells = board.getFlaggedCells();
        for (const cell of flaggedCells) {
            if (!cell.isMine) {
                board.setCellState(cell.row, cell.col, 'misflagged');
                this.updateCell(cell);
            }
        }
    }

    renderCustomSettings(settings) {
        const rowsInput = this.$('#custom-rows');
        const colsInput = this.$('#custom-cols');
        const minesInput = this.$('#custom-mines');
        if (rowsInput) rowsInput.value = settings.rows || 9;
        if (colsInput) colsInput.value = settings.cols || 9;
        if (minesInput) minesInput.value = settings.mines || 10;
    }
}

if (typeof module !== 'undefined') module.exports = { Renderer };
