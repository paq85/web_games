const SPECIAL_TYPES = {
  WILDCARD: 'wildcard',
  BOMB: 'bomb',
  SHIELD: 'shield',
  MULTIPLIER: 'multiplier',
  FUSION_CORE: 'fusion_core'
};

const SPECIAL_PROBABILITIES = {
  [SPECIAL_TYPES.WILDCARD]: 0.03,
  [SPECIAL_TYPES.BOMB]: 0.02,
  [SPECIAL_TYPES.SHIELD]: 0.02,
  [SPECIAL_TYPES.MULTIPLIER]: 0.015,
  [SPECIAL_TYPES.FUSION_CORE]: 0.005
};

const SPECIAL_ICONS = {
  [SPECIAL_TYPES.WILDCARD]: '\u2605',
  [SPECIAL_TYPES.BOMB]: '\uD83D\uDCA5',
  [SPECIAL_TYPES.SHIELD]: '\uD83D\uDEE1',
  [SPECIAL_TYPES.MULTIPLIER]: '\u00D72',
  [SPECIAL_TYPES.FUSION_CORE]: '\u26A1'
};

const SPECIAL_COLORS = {
  [SPECIAL_TYPES.WILDCARD]: '#00e5ff',
  [SPECIAL_TYPES.BOMB]: '#ff1744',
  [SPECIAL_TYPES.SHIELD]: '#00e676',
  [SPECIAL_TYPES.MULTIPLIER]: '#ffd600',
  [SPECIAL_TYPES.FUSION_CORE]: '#d500f9'
};

class SpecialTiles {
  static isSpecial(tile) {
    return tile && tile.type && Object.values(SPECIAL_TYPES).includes(tile.type);
  }

  static isNormal(tile) {
    return tile && !tile.type;
  }

  static createSpecialTile(level = 1) {
    const rand = Math.random();
    let cumulative = 0;
    const bonus = Math.max(0, (level - 1) * 0.002);

    for (const [type, baseProb] of Object.entries(SPECIAL_PROBABILITIES)) {
      cumulative += baseProb + bonus;
      if (rand < cumulative) {
        return {
          value: type === SPECIAL_TYPES.FUSION_CORE ? 8 : 2,
          type,
          icon: SPECIAL_ICONS[type],
          color: SPECIAL_COLORS[type],
          shieldMovesLeft: type === SPECIAL_TYPES.SHIELD ? 1 : 0,
          id: Math.random().toString(36).substring(2, 9)
        };
      }
    }
    return null;
  }

  static getMergeResult(tileA, tileB) {
    const aSpecial = SpecialTiles.isSpecial(tileA);
    const bSpecial = SpecialTiles.isSpecial(tileB);

    if (!aSpecial && !bSpecial) {
      if (tileA.value === tileB.value) {
        return { value: tileA.value * 2, type: null };
      }
      return null;
    }

    if (aSpecial && tileA.type === SPECIAL_TYPES.BOMB) return null;
    if (bSpecial && tileB.type === SPECIAL_TYPES.BOMB) return null;

    if (aSpecial && tileA.type === SPECIAL_TYPES.MULTIPLIER) return null;
    if (bSpecial && tileB.type === SPECIAL_TYPES.MULTIPLIER) return null;

    if (aSpecial && tileA.shieldMovesLeft > 0) return null;
    if (bSpecial && tileB.shieldMovesLeft > 0) return null;

    if (aSpecial && tileA.type === SPECIAL_TYPES.WILDCARD && bSpecial && tileB.type === SPECIAL_TYPES.WILDCARD) {
      return { value: 4, type: null };
    }

    if (aSpecial && tileA.type === SPECIAL_TYPES.WILDCARD) {
      return { value: tileB.value, type: null };
    }
    if (bSpecial && tileB.type === SPECIAL_TYPES.WILDCARD) {
      return { value: tileA.value, type: null };
    }

    if (aSpecial && tileA.type === SPECIAL_TYPES.FUSION_CORE && !bSpecial && tileA.value === tileB.value) {
      return { value: tileA.value * 3, type: null };
    }
    if (bSpecial && tileB.type === SPECIAL_TYPES.FUSION_CORE && !aSpecial && tileA.value === tileB.value) {
      return { value: tileA.value * 3, type: null };
    }

    if (aSpecial && tileA.type === SPECIAL_TYPES.FUSION_CORE && bSpecial && tileB.type === SPECIAL_TYPES.WILDCARD) {
      return { value: 4, type: SPECIAL_TYPES.FUSION_CORE, icon: SPECIAL_ICONS[SPECIAL_TYPES.FUSION_CORE], color: SPECIAL_COLORS[SPECIAL_TYPES.FUSION_CORE], id: Math.random().toString(36).substring(2, 9) };
    }
    if (bSpecial && tileB.type === SPECIAL_TYPES.FUSION_CORE && aSpecial && tileA.type === SPECIAL_TYPES.WILDCARD) {
      return { value: 4, type: SPECIAL_TYPES.FUSION_CORE, icon: SPECIAL_ICONS[SPECIAL_TYPES.FUSION_CORE], color: SPECIAL_COLORS[SPECIAL_TYPES.FUSION_CORE], id: Math.random().toString(36).substring(2, 9) };
    }

    return null;
  }

  static checkBombChains(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const exploded = new Set();
    let chainActive = true;

    while (chainActive) {
      chainActive = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${r},${c}`;
          if (exploded.has(key)) continue;
          const tile = grid[r][c];
          if (!tile || !SpecialTiles.isSpecial(tile) || tile.type !== SPECIAL_TYPES.BOMB) continue;

          const neighbors = [
            { r: r - 1, c },
            { r: r + 1, c },
            { r, c: c - 1 },
            { r, c: c + 1 }
          ];

          for (const n of neighbors) {
            if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && grid[n.r][n.c]) {
              exploded.add(key);
              exploded.add(`${n.r},${n.c}`);
              chainActive = true;
              break;
            }
          }
        }
      }
    }

    const result = grid.map(row => [...row]);
    for (const key of exploded) {
      const [r, c] = key.split(',').map(Number);
      result[r][c] = null;
    }
    return result;
  }

  static checkMultipliers(grid, mergeRow, mergeCol) {
    const rows = grid.length;
    const cols = grid[0].length;
    let multiplier = 1;
    const consumed = [];

    const neighbors = [
      { r: mergeRow - 1, c: mergeCol },
      { r: mergeRow + 1, c: mergeCol },
      { r: mergeRow, c: mergeCol - 1 },
      { r: mergeRow, c: mergeCol + 1 }
    ];

    for (const n of neighbors) {
      if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols) {
        const tile = grid[n.r][n.c];
        if (tile && SpecialTiles.isSpecial(tile) && tile.type === SPECIAL_TYPES.MULTIPLIER) {
          multiplier *= 2;
          consumed.push({ r: n.r, c: n.c });
        }
      }
    }

    return { multiplier, consumed };
  }

  static expireShields(grid) {
    const result = grid.map(row => row.map(tile => {
      if (!tile) return null;
      if (SpecialTiles.isSpecial(tile) && tile.type === SPECIAL_TYPES.SHIELD) {
        const remaining = tile.shieldMovesLeft - 1;
        if (remaining <= 0) {
          return { value: tile.value, id: tile.id };
        }
        return { ...tile, shieldMovesLeft: remaining };
      }
      return tile;
    }));
    return result;
  }

  static getSpawnProbability(type, level = 1) {
    const base = SPECIAL_PROBABILITIES[type] || 0;
    const bonus = Math.max(0, (level - 1) * 0.002);
    return base + bonus;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpecialTiles, SPECIAL_TYPES, SPECIAL_ICONS, SPECIAL_COLORS };
}
