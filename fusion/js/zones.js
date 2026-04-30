const ZONE_TYPES = {
  GRAVITY_WELL: 'gravity_well',
  FROZEN: 'frozen',
  BOOST: 'boost',
  SWAP: 'swap'
};

const ZONE_ICONS = {
  [ZONE_TYPES.GRAVITY_WELL]: '\u2B07',
  [ZONE_TYPES.FROZEN]: '\u2744',
  [ZONE_TYPES.BOOST]: '\u25B2',
  [ZONE_TYPES.SWAP]: '\u21C4'
};

const ZONE_COLORS = {
  [ZONE_TYPES.GRAVITY_WELL]: '#1a237e',
  [ZONE_TYPES.FROZEN]: '#80deea',
  [ZONE_TYPES.BOOST]: '#ff6d00',
  [ZONE_TYPES.SWAP]: '#e040fb'
};

class Zones {
  constructor() {
    this.zones = [];
    this.nextId = 1;
  }

  addZone(type, cells, remainingMoves = 5) {
    const zone = {
      id: this.nextId++,
      type,
      cells: cells.map(c => ({ ...c })),
      remainingMoves,
      icon: ZONE_ICONS[type],
      color: ZONE_COLORS[type],
      swapUsed: false
    };
    this.zones.push(zone);
    return zone;
  }

  removeZone(id) {
    const idx = this.zones.findIndex(z => z.id === id);
    if (idx !== -1) {
      this.zones.splice(idx, 1);
      return true;
    }
    return false;
  }

  removeExpired() {
    this.zones = this.zones.filter(z => z.remainingMoves > 0);
  }

  getZoneAt(row, col) {
    return this.zones.filter(zone =>
      zone.cells.some(cell => cell.row === row && cell.col === col)
    );
  }

  getZoneAtById(row, col, zoneId) {
    return this.zones.find(zone =>
      zone.id === zoneId && zone.cells.some(cell => cell.row === row && cell.col === col)
    );
  }

  applyGravityWells(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const result = grid.map(row => [...row]);
    const gravityZones = this.zones.filter(z => z.type === ZONE_TYPES.GRAVITY_WELL);

    for (const zone of gravityZones) {
      const zoneCols = [...new Set(zone.cells.map(c => c.col))];
      const zoneRows = new Set(zone.cells.map(c => c.row));

      for (const col of zoneCols) {
        const colTiles = [];
        for (let r = 0; r < rows; r++) {
          if (zoneRows.has(r) && result[r][col]) {
            colTiles.push({ tile: result[r][col], row: r });
            result[r][col] = null;
          }
        }

        for (let i = colTiles.length - 1; i >= 0; i--) {
          let targetRow = rows - 1;
          while (targetRow >= 0 && result[targetRow][col] !== null) {
            const below = result[targetRow][col];
            const above = colTiles[i].tile;
            if (below.value === above.value && !below.merged && !above.merged) {
              result[targetRow][col] = {
                value: below.value * 2,
                id: Math.random().toString(36).substring(2, 9),
                merged: true
              };
              colTiles.splice(i, 1);
              targetRow--;
              break;
            }
            targetRow--;
          }
          if (targetRow >= 0 && colTiles[i]) {
            result[targetRow][col] = colTiles[i].tile;
          }
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (result[r][c] && result[r][c].merged) {
          result[r][c] = { ...result[r][c], merged: false };
        }
      }
    }

    return result;
  }

  isFrozen(row, col) {
    return this.zones.some(zone =>
      zone.type === ZONE_TYPES.FROZEN && zone.cells.some(cell => cell.row === row && cell.col === col)
    );
  }

  isBoost(row, col) {
    return this.zones.some(zone =>
      zone.type === ZONE_TYPES.BOOST && zone.cells.some(cell => cell.row === row && cell.col === col)
    );
  }

  getBoostMultiplier(row, col) {
    const boostZones = this.zones.filter(zone =>
      zone.type === ZONE_TYPES.BOOST && zone.cells.some(cell => cell.row === row && cell.col === col)
    );
    return Math.pow(2, boostZones.length);
  }

  getSwapZone() {
    return this.zones.find(z => z.type === ZONE_TYPES.SWAP && !z.swapUsed);
  }

  useSwapZone(zoneId) {
    const zone = this.zones.find(z => z.id === zoneId && z.type === ZONE_TYPES.SWAP);
    if (zone) {
      zone.swapUsed = true;
      return true;
    }
    return false;
  }

  resetSwapZones() {
    for (const zone of this.zones) {
      if (zone.type === ZONE_TYPES.SWAP) {
        zone.swapUsed = false;
      }
    }
  }

  tickAllZones() {
    for (const zone of this.zones) {
      zone.remainingMoves -= 1;
    }
    this.removeExpired();
  }

  applyZoneEffects(grid) {
    let result = grid;
    result = this.applyGravityWells(result);
    return result;
  }

  getFrozenCells() {
    const frozenZones = this.zones.filter(z => z.type === ZONE_TYPES.FROZEN);
    const cells = new Set();
    for (const zone of frozenZones) {
      for (const cell of zone.cells) {
        cells.add(`${cell.row},${cell.col}`);
      }
    }
    return cells;
  }

  canTileMove(row, col) {
    return !this.isFrozen(row, col);
  }

  getAllZoneCells() {
    const cells = new Map();
    for (const zone of this.zones) {
      for (const cell of zone.cells) {
        const key = `${cell.row},${cell.col}`;
        if (!cells.has(key)) {
          cells.set(key, []);
        }
        cells.get(key).push(zone);
      }
    }
    return cells;
  }

  reset() {
    this.zones = [];
    this.nextId = 1;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Zones, ZONE_TYPES, ZONE_ICONS, ZONE_COLORS };
}
