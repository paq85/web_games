const POWERUP_TYPES = {
  UNDO: 'undo',
  SPLIT: 'split',
  NUKE: 'nuke',
  FREEZE: 'freeze',
  SWAP: 'swap',
  STABILIZE: 'stabilize'
};

const POWERUP_ICONS = {
  [POWERUP_TYPES.UNDO]: '\u21BA',
  [POWERUP_TYPES.SPLIT]: '\u2757',
  [POWERUP_TYPES.NUKE]: '\uD83D\uDCA3',
  [POWERUP_TYPES.FREEZE]: '\uD83E\uDEAF',
  [POWERUP_TYPES.SWAP]: '\uD83D\uDD03',
  [POWERUP_TYPES.STABILIZE]: '\uD83D\uDD12'
};

const MAX_CHARGES = 3;
const POINTS_PER_CHARGE = 500;
const MAX_CONSECUTIVE_UNDO = 2;
const STABILIZE_EXPIRY_MOVES = 3;

class PowerUps {
  constructor() {
    this.charges = {};
    this.consecutiveUndoCount = 0;
    this.stabilizeMovesLeft = 0;
    this.freezeActive = false;
    this.totalPointsForCharges = 0;
    this.callbacks = {};
  }

  setCallback(event, callback) {
    this.callbacks[event] = callback;
  }

  triggerCallback(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  earn(type) {
    if (!this.charges[type]) this.charges[type] = 0;
    if (this.charges[type] >= MAX_CHARGES) return false;

    this.charges[type] += 1;
    this.triggerCallback('powerup_earned', { type, charges: this.charges[type] });
    return true;
  }

  earnFromPoints(pointsEarned) {
    this.totalPointsForCharges += pointsEarned;
    const chargesEarned = Math.floor(this.totalPointsForCharges / POINTS_PER_CHARGE);

    for (let i = 0; i < chargesEarned; i++) {
      this.totalPointsForCharges %= POINTS_PER_CHARGE;
      const type = this.pickPassivePowerup();
      this.earn(type);
    }
  }

  pickPassivePowerup() {
    const rand = Math.random();
    if (rand < 0.35) return POWERUP_TYPES.UNDO;
    if (rand < 0.55) return POWERUP_TYPES.SPLIT;
    if (rand < 0.7) return POWERUP_TYPES.NUKE;
    if (rand < 0.85) return POWERUP_TYPES.FREEZE;
    if (rand < 0.95) return POWERUP_TYPES.SWAP;
    return POWERUP_TYPES.STABILIZE;
  }

  use(type, target) {
    if (!this.canUse(type)) return null;

    this.charges[type] -= 1;

    switch (type) {
      case POWERUP_TYPES.UNDO:
        return this.useUndo(target);
      case POWERUP_TYPES.SPLIT:
        return this.useSplit(target);
      case POWERUP_TYPES.NUKE:
        return this.useNuke(target);
      case POWERUP_TYPES.FREEZE:
        return this.useFreeze(target);
      case POWERUP_TYPES.SWAP:
        return this.useSwap(target);
      case POWERUP_TYPES.STABILIZE:
        return this.useStabilize(target);
      default:
        return null;
    }
  }

  useUndo(target) {
    if (this.consecutiveUndoCount >= MAX_CONSECUTIVE_UNDO) return null;
    this.consecutiveUndoCount += 1;
    this.triggerCallback('powerup_used', { type: POWERUP_TYPES.UNDO, consecutiveCount: this.consecutiveUndoCount });
    return { action: 'undo', consecutiveCount: this.consecutiveUndoCount };
  }

  useSplit(target) {
    if (!target || !target.grid || !target.tileRow !== undefined) return null;
    const { grid, tileRow, tileCol, direction } = target;
    const tile = grid[tileRow][tileCol];

    if (!tile || tile.value < 4) return null;

    const halfValue = tile.value / 2;
    const adj = this.getAdjacentEmptyCell(grid, tileRow, tileCol, direction);
    if (!adj) return null;

    grid[tileRow][tileCol] = { value: halfValue, id: Math.random().toString(36).substring(2, 9) };
    grid[adj.row][adj.col] = { value: halfValue, id: Math.random().toString(36).substring(2, 9) };

    this.triggerCallback('powerup_used', { type: POWERUP_TYPES.SPLIT });
    return { action: 'split', grid };
  }

  getAdjacentEmptyCell(grid, row, col, direction) {
    const dirs = {
      up: { r: -1, c: 0 },
      down: { r: 1, c: 0 },
      left: { r: 0, c: -1 },
      right: { r: 0, c: 1 }
    };

    const candidates = [];
    const d = dirs[direction] || null;

    if (d) {
      const nr = row + d.r;
      const nc = col + d.c;
      if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && !grid[nr][nc]) {
        return { row: nr, col: nc };
      }
    } else {
      const neighbors = [
        { r: row - 1, c: col },
        { r: row + 1, c: col },
        { r: row, c: col - 1 },
        { r: row, c: col + 1 }
      ];
      for (const n of neighbors) {
        if (n.r >= 0 && n.r < grid.length && n.c >= 0 && n.c < grid[0].length && !grid[n.r][n.c]) {
          candidates.push({ row: n.r, col: n.c });
        }
      }
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return null;
  }

  useNuke(target) {
    if (!target || !target.grid || target.value === undefined) return null;
    const { grid, value } = target;
    const rows = grid.length;
    const cols = grid[0].length;
    let score = 0;
    let destroyed = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] && grid[r][c].value === value) {
          score += grid[r][c].value;
          grid[r][c] = null;
          destroyed++;
        }
      }
    }

    this.triggerCallback('powerup_used', { type: POWERUP_TYPES.NUKE, destroyed, score });
    return { action: 'nuke', score, destroyed };
  }

  useFreeze(target) {
    this.freezeActive = true;
    this.triggerCallback('powerup_used', { type: POWERUP_TYPES.FREEZE });
    return { action: 'freeze' };
  }

  useSwap(target) {
    if (!target || !target.a || !target.b) return null;
    const { grid, a, b } = target;
    const temp = grid[a.row][a.col];
    grid[a.row][a.col] = grid[b.row][b.col];
    grid[b.row][b.col] = temp;

    this.triggerCallback('powerup_used', { type: POWERUP_TYPES.SWAP });
    return { action: 'swap' };
  }

  useStabilize(target) {
    this.stabilizeMovesLeft = STABILIZE_EXPIRY_MOVES;
    this.triggerCallback('powerup_used', { type: POWERUP_TYPES.STABILIZE });
    return { action: 'stabilize', movesLeft: this.stabilizeMovesLeft };
  }

  getCharges(type) {
    return this.charges[type] || 0;
  }

  getAllCharges() {
    const result = {};
    for (const type of Object.values(POWERUP_TYPES)) {
      result[type] = this.getCharges(type);
    }
    return result;
  }

  canUse(type) {
    switch (type) {
      case POWERUP_TYPES.UNDO:
        return this.getCharges(type) > 0 && this.consecutiveUndoCount < MAX_CONSECUTIVE_UNDO;
      case POWERUP_TYPES.SPLIT:
        return this.getCharges(type) > 0;
      case POWERUP_TYPES.NUKE:
        return this.getCharges(type) > 0;
      case POWERUP_TYPES.FREEZE:
        return this.getCharges(type) > 0;
      case POWERUP_TYPES.SWAP:
        return this.getCharges(type) > 0;
      case POWERUP_TYPES.STABILIZE:
        return this.getCharges(type) > 0 || this.stabilizeMovesLeft > 0;
      default:
        return false;
    }
  }

  tickStabilize() {
    if (this.stabilizeMovesLeft > 0) {
      this.stabilizeMovesLeft -= 1;
      if (this.stabilizeMovesLeft <= 0) {
        this.triggerCallback('stabilize_expired', {});
      }
    }
  }

  resetConsecutiveUndo() {
    this.consecutiveUndoCount = 0;
  }

  deactivateFreeze() {
    this.freezeActive = false;
  }

  isFreezeActive() {
    return this.freezeActive;
  }

  isStabilizeActive() {
    return this.stabilizeMovesLeft > 0;
  }

  reset() {
    this.charges = {};
    this.consecutiveUndoCount = 0;
    this.stabilizeMovesLeft = 0;
    this.freezeActive = false;
    this.totalPointsForCharges = 0;
    this.callbacks = {};
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PowerUps, POWERUP_TYPES, POWERUP_ICONS, MAX_CHARGES, POINTS_PER_CHARGE };
}
