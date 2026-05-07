class Board {
    constructor(rows, cols, mines) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.cells = this._createEmptyGrid();
    }

    _createEmptyGrid() {
        const grid = [];
        for (let r = 0; r < this.rows; r++) {
            grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                grid[r][c] = { row: r, col: c, isMine: false, adjacentMines: 0, state: 'hidden' };
            }
        }
        return grid;
    }

    getCells() {
        return this.cells;
    }

    getRows() {
        return this.rows;
    }

    getCols() {
        return this.cols;
    }

    getMineCount() {
        return this.mines;
    }

    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        return this.cells[row][col];
    }

    getNeighbors(row, col) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    neighbors.push({ row: nr, col: nc });
                }
            }
        }
        return neighbors;
    }

    placeMines(safeRow, safeCol) {
        const safeSet = new Set();
        safeSet.add(safeRow + ',' + safeCol);
        for (const n of this.getNeighbors(safeRow, safeCol)) {
            safeSet.add(n.row + ',' + n.col);
        }

        const candidates = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!safeSet.has(r + ',' + c)) {
                    candidates.push({ row: r, col: c });
                }
            }
        }

        this._shuffle(candidates);

        for (let i = 0; i < this.mines && i < candidates.length; i++) {
            this.cells[candidates[i].row][candidates[i].col].isMine = true;
        }

        this.computeAdjacentMines();
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    computeAdjacentMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].isMine) continue;
                let count = 0;
                for (const n of this.getNeighbors(r, c)) {
                    if (this.cells[n.row][n.col].isMine) count++;
                }
                this.cells[r][c].adjacentMines = count;
            }
        }
    }

    revealCell(row, col) {
        const cell = this.getCell(row, col);
        if (!cell) return { revealed: [], hitMine: false, detonatedAt: null };
        if (cell.state !== 'hidden') return { revealed: [], hitMine: false, detonatedAt: null };

        if (cell.isMine) {
            cell.state = 'revealed';
            return { revealed: [cell], hitMine: true, detonatedAt: { row, col } };
        }

        const revealed = [];
        cell.state = 'revealed';
        revealed.push(cell);

        if (cell.adjacentMines === 0) {
            const queue = this.getNeighbors(row, col);
            const visited = new Set();
            visited.add(row + ',' + col);

            while (queue.length > 0) {
                const n = queue.shift();
                const key = n.row + ',' + n.col;
                if (visited.has(key)) continue;
                visited.add(key);

                const neighbor = this.cells[n.row][n.col];
                if (neighbor.state !== 'hidden') continue;

                neighbor.state = 'revealed';
                revealed.push(neighbor);

                if (neighbor.adjacentMines === 0) {
                    for (const nn of this.getNeighbors(n.row, n.col)) {
                        const nnKey = nn.row + ',' + nn.col;
                        if (!visited.has(nnKey)) {
                            queue.push(nn);
                        }
                    }
                }
            }
        }

        return { revealed, hitMine: false, detonatedAt: null };
    }

    chord(row, col) {
        const cell = this.getCell(row, col);
        if (!cell || cell.state !== 'revealed' || cell.adjacentMines === 0) {
            return { revealed: [], hitMine: false, detonatedAt: null };
        }

        let flaggedCount = 0;
        const neighbors = this.getNeighbors(row, col);
        for (const n of neighbors) {
            if (this.cells[n.row][n.col].state === 'flagged') flaggedCount++;
        }

        if (flaggedCount !== cell.adjacentMines) {
            return { revealed: [], hitMine: false, detonatedAt: null };
        }

        const allRevealed = [];
        for (const n of neighbors) {
            const nc = this.cells[n.row][n.col];
            if (nc.state === 'hidden') {
                const result = this.revealCell(n.row, n.col);
                allRevealed.push(...result.revealed);
                if (result.hitMine) {
                    return { revealed: allRevealed, hitMine: true, detonatedAt: result.detonatedAt };
                }
            }
        }

        return { revealed: allRevealed, hitMine: false, detonatedAt: null };
    }

    cycleFlag(row, col, questionMode) {
        const cell = this.getCell(row, col);
        if (!cell || cell.state !== 'hidden' && cell.state !== 'flagged' && cell.state !== 'question') return null;
        if (cell.state === 'hidden') {
            cell.state = 'flagged';
        } else if (cell.state === 'flagged') {
            cell.state = questionMode ? 'question' : 'hidden';
        } else if (cell.state === 'question') {
            cell.state = 'hidden';
        }
        return cell.state;
    }

    setCellState(row, col, state) {
        const cell = this.getCell(row, col);
        if (cell) cell.state = state;
    }

    hasWon() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.cells[r][c].isMine && this.cells[r][c].state !== 'revealed') {
                    return false;
                }
            }
        }
        return true;
    }

    autoFlagOnWin() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].isMine && this.cells[r][c].state !== 'flagged') {
                    this.cells[r][c].state = 'flagged';
                }
            }
        }
    }

    getRemainingMines() {
        let flagged = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].state === 'flagged') flagged++;
            }
        }
        return this.mines - flagged;
    }

    getAllMines() {
        const mines = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].isMine) mines.push(this.cells[r][c]);
            }
        }
        return mines;
    }

    getFlaggedCells() {
        const flagged = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].state === 'flagged') flagged.push(this.cells[r][c]);
            }
        }
        return flagged;
    }
}

if (typeof module !== 'undefined') module.exports = { Board };
