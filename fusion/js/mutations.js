const MUTATION_TYPES = {
  ROW_SHIFT: 'row_shift',
  COLUMN_SHIFT: 'column_shift',
  QUADRANT_ROTATION: 'quadrant_rotation'
};

class Mutations {
  constructor() {
    this.lastMutation = null;
    this.isWarningActive = false;
    this.warningCallback = null;
    this.undoCallback = null;
  }

  setWarningCallback(callback) {
    this.warningCallback = callback;
  }

  setUndoCallback(callback) {
    this.undoCallback = callback;
  }

  shouldMutate(level) {
    const chance = Math.min(0.3, Math.max(0, (level - 1) * 0.03));
    return Math.random() < chance;
  }

  getMutationChance(level) {
    return Math.min(0.3, Math.max(0, (level - 1) * 0.03));
  }

  warnMutation() {
    this.isWarningActive = true;
    if (this.warningCallback) {
      this.warningCallback();
    }
    setTimeout(() => {
      this.isWarningActive = false;
    }, 1500);
  }

  executeMutation(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const mutationType = this.pickMutationType();
    const result = grid.map(row => row ? { ...row } : null);

    let mutation;
    switch (mutationType) {
      case MUTATION_TYPES.ROW_SHIFT:
        mutation = this.executeRowShift(result);
        break;
      case MUTATION_TYPES.COLUMN_SHIFT:
        mutation = this.executeColumnShift(result);
        break;
      case MUTATION_TYPES.QUADRANT_ROTATION:
        mutation = this.executeQuadrantRotation(result);
        break;
    }

    this.lastMutation = {
      type: mutationType,
      details: mutation.details,
      previousGrid: grid.map(row => row ? { ...row } : null)
    };

    return { grid: mutation.result, type: mutationType };
  }

  executeRowShift(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const result = grid.map(row => [...row]);
    const rowIdx = Math.floor(Math.random() * rows);
    const direction = Math.random() < 0.5 ? 1 : -1;

    const row = result[rowIdx];
    if (direction === 1) {
      const last = row.pop();
      row.unshift(last);
    } else {
      const first = row.shift();
      row.push(first);
    }

    return {
      result,
      details: { row: rowIdx, direction }
    };
  }

  executeColumnShift(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const result = grid.map(row => [...row]);
    const colIdx = Math.floor(Math.random() * cols);
    const direction = Math.random() < 0.5 ? 1 : -1;

    const column = [];
    for (let r = 0; r < rows; r++) {
      column.push(result[r][colIdx]);
    }

    if (direction === 1) {
      const last = column.pop();
      column.unshift(last);
    } else {
      const first = column.shift();
      column.push(first);
    }

    for (let r = 0; r < rows; r++) {
      result[r][colIdx] = column[r];
    }

    return {
      result,
      details: { col: colIdx, direction }
    };
  }

  executeQuadrantRotation(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const result = grid.map(row => [...row]);

    const quadrants = [
      { startRow: 0, startCol: 0 },
      { startRow: 0, startCol: Math.floor(cols / 2) },
      { startRow: Math.floor(rows / 2), startCol: 0 },
      { startRow: Math.floor(rows / 2), startCol: Math.floor(cols / 2) }
    ];

    const qIdx = Math.floor(Math.random() * quadrants.length);
    const q = quadrants[qIdx];
    const size = 2;

    const quadrant = [];
    for (let r = 0; r < size; r++) {
      quadrant.push([]);
      for (let c = 0; c < size; c++) {
        quadrant[r][c] = result[q.startRow + r][q.startCol + c];
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[q.startRow + c][q.startCol + (size - 1 - r)] = quadrant[r][c];
      }
    }

    return {
      result,
      details: { quadrant: qIdx, startRow: q.startRow, startCol: q.startCol }
    };
  }

  pickMutationType() {
    const rand = Math.random();
    if (rand < 0.4) return MUTATION_TYPES.ROW_SHIFT;
    if (rand < 0.7) return MUTATION_TYPES.COLUMN_SHIFT;
    return MUTATION_TYPES.QUADRANT_ROTATION;
  }

  reverseMutation(grid) {
    if (!this.lastMutation) return grid;

    const rows = grid.length;
    const cols = grid[0].length;
    const result = grid.map(row => [...row]);
    const { type, details } = this.lastMutation;

    switch (type) {
      case MUTATION_TYPES.ROW_SHIFT: {
        const row = result[details.row];
        if (details.direction === 1) {
          const first = row.shift();
          row.push(first);
        } else {
          const last = row.pop();
          row.unshift(last);
        }
        break;
      }
      case MUTATION_TYPES.COLUMN_SHIFT: {
        const column = [];
        for (let r = 0; r < rows; r++) {
          column.push(result[r][details.col]);
        }
        if (details.direction === 1) {
          const first = column.shift();
          column.push(first);
        } else {
          const last = column.pop();
          column.unshift(last);
        }
        for (let r = 0; r < rows; r++) {
          result[r][details.col] = column[r];
        }
        break;
      }
      case MUTATION_TYPES.QUADRANT_ROTATION: {
        const size = 2;
        const quadrant = [];
        for (let r = 0; r < size; r++) {
          quadrant.push([]);
          for (let c = 0; c < size; c++) {
            quadrant[r][c] = result[details.startRow + r][details.startCol + c];
          }
        }
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            result[details.startRow + (size - 1 - c)][details.startCol + r] = quadrant[r][c];
          }
        }
        break;
      }
    }

    this.lastMutation = null;
    return result;
  }

  hasValidMoves(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!grid[r][c]) return true;

        if (c < cols - 1 && grid[r][c + 1] && grid[r][c].value === grid[r][c + 1].value) return true;
        if (r < rows - 1 && grid[r + 1][c] && grid[r][c].value === grid[r + 1][c].value) return true;
      }
    }
    return false;
  }

  safeMutate(grid, level) {
    if (!this.shouldMutate(level)) return grid;

    this.warnMutation();
    const mutated = this.executeMutation(grid);

    if (!this.hasValidMoves(mutated)) {
      const reversed = this.reverseMutation(mutated);
      if (this.undoCallback) {
        this.undoCallback();
      }
      return reversed;
    }

    return mutated;
  }

  reset() {
    this.lastMutation = null;
    this.isWarningActive = false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Mutations, MUTATION_TYPES };
}
