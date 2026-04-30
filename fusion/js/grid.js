class Grid {
  constructor(size = 4) {
    this.size = size;
    this.cells = [];
    this._init();
  }

  _init() {
    this.cells = [];
    for (let r = 0; r < this.size; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.size; c++) {
        this.cells[r][c] = null;
      }
    }
  }

  spawnTile(value = null) {
    const empty = this.getEmptyCells();
    if (empty.length === 0) return null;
    const { row, col } = empty[Math.floor(Math.random() * empty.length)];

    if (value !== null) {
      const tile = Tile.createNormal(value, row, col);
      this.cells[row][col] = tile;
      return tile;
    }

    const tile = Tile.randomTile(row, col);
    this.cells[row][col] = tile;
    return tile;
  }

  spawnInitialTiles(count = 2) {
    for (let i = 0; i < count; i++) {
      this.spawnTile();
    }
  }

  getEmptyCells() {
    const result = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.cells[r][c]) result.push({ row: r, col: c });
      }
    }
    return result;
  }

  getHighestTile() {
    let highest = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.cells[r][c] && this.cells[r][c].value > highest) {
          highest = this.cells[r][c].value;
        }
      }
    }
    return highest;
  }

  hasMoves() {
    if (this.getEmptyCells().length > 0) return true;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.cells[r][c];
        if (!tile) continue;
        const right = c + 1 < this.size ? this.cells[r][c + 1] : null;
        const down = r + 1 < this.size ? this.cells[r + 1][c] : null;
        if (right && tile.canMergeWith(right)) return true;
        if (down && tile.canMergeWith(down)) return true;
      }
    }
    return false;
  }

  isFull() {
    return this.getEmptyCells().length === 0;
  }

  slide(direction) {
    const prevState = this.serialize();
    let score = 0;
    let merges = 0;
    let moved = false;

    const vectors = {
      up: { dr: -1, dc: 0 },
      down: { dr: 1, dc: 0 },
      left: { dr: 0, dc: -1 },
      right: { dr: 0, dc: 1 }
    };

    const vec = vectors[direction];
    if (!vec) return { score: 0, merges: 0, moved: false, prevState };

    const traversals = this._buildTraversals(vec);

    for (const r of traversals.rows) {
      for (const c of traversals.cols) {
        const result = this._slideCell(r, c, vec);
        if (result.moved) moved = true;
        score += result.score;
        merges += result.merges;
      }
    }

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.cells[r][c]) {
          this.cells[r][c].merged = false;
        }
      }
    }

    return { score, merges, moved, prevState };
  }

  _buildTraversals(vec) {
    const rows = [...Array(this.size).keys()];
    const cols = [...Array(this.size).keys()];

    if (vec.dr === 1) rows.reverse();
    if (vec.dc === 1) cols.reverse();

    return { rows, cols };
  }

  _slideCell(row, col, vec) {
    let score = 0;
    let merges = 0;
    let moved = false;

    const tile = this.cells[row][col];
    if (!tile) return { score, merges, moved };

    let { row: prevRow, col: prevCol } = { row, col };
    let { row: newRow, col: newCol } = this._findFarthest(row, col, vec);

    const next = this._getInDirection(newRow, newCol, vec);
    if (next && next.row >= 0 && next.row < this.size && next.col >= 0 && next.col < this.size &&
        this.cells[next.row][next.col] &&
        tile.canMergeWith(this.cells[next.row][next.col]) &&
        !this.cells[next.row][next.col].merged) {
      const mergedTile = this._mergeTiles(tile, this.cells[next.row][next.col], next.row, next.col);
      this.cells[next.row][next.col] = mergedTile;
      this.cells[next.row][next.col].merged = true;
      this.cells[row][col] = null;
      score += this.cells[next.row][next.col].value;
      merges++;
      moved = true;
      return { score, merges, moved };
    }

    if (prevRow !== newRow || prevCol !== newCol) {
      moved = true;
      this.cells[row][col] = null;
      this.cells[newRow][newCol] = tile;
      tile.row = newRow;
      tile.col = newCol;
    }

    return { score, merges, moved };
  }

  _findFarthest(row, col, vec) {
    let prev;
    do {
      prev = { row, col };
      ({ row, col } = this._getInDirection(row, col, vec));
    } while (row >= 0 && row < this.size && col >= 0 && col < this.size && !this.cells[row][col]);
    return prev;
  }

  _getInDirection(row, col, vec) {
    return { row: row + vec.dr, col: col + vec.dc };
  }

  _mergeTiles(a, b, targetRow, targetCol) {
    const newValue = a.mergeValue(b);
    let newType = Tile.TYPES.NORMAL;

    if (a.type === Tile.TYPES.FUSIONCORE || b.type === Tile.TYPES.FUSIONCORE) {
      newType = Tile.TYPES.FUSIONCORE;
    }

    const merged = new Tile(newValue, newType, targetRow, targetCol);
    return merged;
  }

  serialize() {
    const data = [];
    for (let r = 0; r < this.size; r++) {
      data[r] = [];
      for (let c = 0; c < this.size; c++) {
        data[r][c] = this.cells[r][c] ? this.cells[r][c].clone() : null;
      }
    }
    return data;
  }

  restore(data) {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.cells[r][c] = data[r][c];
      }
    }
  }

  shiftRow(rowIndex, direction = 1) {
    const row = this.cells[rowIndex];
    if (direction === 1) {
      const last = row.pop();
      row.unshift(last);
    } else {
      const first = row.shift();
      row.push(first);
    }
    for (let c = 0; c < this.size; c++) {
      if (this.cells[rowIndex][c]) {
        this.cells[rowIndex][c].col = c;
      }
    }
  }

  shiftCol(colIndex, direction = 1) {
    const col = [];
    for (let r = 0; r < this.size; r++) {
      col.push(this.cells[r][colIndex]);
    }
    if (direction === 1) {
      const last = col.pop();
      col.unshift(last);
    } else {
      const first = col.shift();
      col.push(first);
    }
    for (let r = 0; r < this.size; r++) {
      this.cells[r][colIndex] = col[r];
      if (col[r]) {
        col[r].row = r;
      }
    }
  }

  rotateQuadrant(quadrant, clockwise = true) {
    const offsets = {
      tl: { r0: 0, c0: 0 },
      tr: { r0: 0, c0: 2 },
      bl: { r0: 2, c0: 0 },
      br: { r0: 2, c0: 2 }
    };

    const off = offsets[quadrant];
    if (!off) return;

    const sub = [];
    for (let r = 0; r < 2; r++) {
      sub[r] = [];
      for (let c = 0; c < 2; c++) {
        sub[r][c] = this.cells[off.r0 + r][off.c0 + c];
      }
    }

    if (clockwise) {
      const rotated = [
        [sub[1][0], sub[0][0]],
        [sub[1][1], sub[0][1]]
      ];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          this.cells[off.r0 + r][off.c0 + c] = rotated[r][c];
          if (rotated[r][c]) {
            rotated[r][c].row = off.r0 + r;
            rotated[r][c].col = off.c0 + c;
          }
        }
      }
    } else {
      const rotated = [
        [sub[0][1], sub[1][1]],
        [sub[0][0], sub[1][0]]
      ];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          this.cells[off.r0 + r][off.c0 + c] = rotated[r][c];
          if (rotated[r][c]) {
            rotated[r][c].row = off.r0 + r;
            rotated[r][c].col = off.c0 + c;
          }
        }
      }
    }
  }

  clear() {
    this._init();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Grid };
}
if (typeof global !== 'undefined') {
  global.Grid = Grid;
}
