class Tile {
  static TYPES = {
    NORMAL: 'normal',
    WILDCARD: 'wildcard',
    BOMB: 'bomb',
    SHIELD: 'shield',
    MULTIPLIER: 'multiplier',
    FUSIONCORE: 'fusioncore'
  };

  static SPAWN_RATES = {
    wildcard: 0.03,
    bomb: 0.02,
    shield: 0.02,
    multiplier: 0.015,
    fusioncore: 0.005
  };

  constructor(value, type = Tile.TYPES.NORMAL, row = 0, col = 0) {
    this.value = value;
    this.type = type;
    this.row = row;
    this.col = col;
    this.shieldMovesLeft = type === Tile.TYPES.SHIELD ? 1 : 0;
    this.merged = false;
    this.id = Tile._nextId++;
  }

  static _nextId = 0;

  static createNormal(value, row, col) {
    return new Tile(value, Tile.TYPES.NORMAL, row, col);
  }

  static createWildcard(row, col) {
    return new Tile(2, Tile.TYPES.WILDCARD, row, col);
  }

  static createBomb(row, col) {
    return new Tile(2, Tile.TYPES.BOMB, row, col);
  }

  static createShield(value, row, col) {
    const tile = new Tile(value, Tile.TYPES.SHIELD, row, col);
    tile.shieldMovesLeft = 1;
    return tile;
  }

  static createMultiplier(row, col) {
    return new Tile(2, Tile.TYPES.MULTIPLIER, row, col);
  }

  static createFusionCore(value, row, col) {
    return new Tile(value, Tile.TYPES.FUSIONCORE, row, col);
  }

  static randomTile(row, col, level = 1) {
    const rand = Math.random();
    const rateMult = 1 + (level - 1) * 0.2;
    const cumulative = [];
    let sum = 0;

    for (const [type, baseRate] of Object.entries(Tile.SPAWN_RATES)) {
      sum += baseRate * rateMult;
      cumulative.push({ type, threshold: sum });
    }

    for (let i = cumulative.length - 1; i >= 0; i--) {
      if (rand < cumulative[i].threshold) {
        switch (cumulative[i].type) {
          case 'wildcard': return Tile.createWildcard(row, col);
          case 'bomb': return Tile.createBomb(row, col);
          case 'shield': return Tile.createShield(Math.random() < 0.9 ? 2 : 4, row, col);
          case 'multiplier': return Tile.createMultiplier(row, col);
          case 'fusioncore': return Tile.createFusionCore(8, row, col);
        }
      }
    }

    return Tile.createNormal(Math.random() < 0.9 ? 2 : 4, row, col);
  }

  canMerge() {
    if (this.type === Tile.TYPES.BOMB || this.type === Tile.TYPES.MULTIPLIER) return false;
    if (this.type === Tile.TYPES.SHIELD && this.shieldMovesLeft > 0) return false;
    return true;
  }

  canMergeWith(other) {
    if (this.type === Tile.TYPES.WILDCARD || other.type === Tile.TYPES.WILDCARD) return true;
    if (this.type === Tile.TYPES.BOMB || other.type === Tile.TYPES.BOMB) return false;
    if (this.type === Tile.TYPES.MULTIPLIER || other.type === Tile.TYPES.MULTIPLIER) return false;
    if (this.shieldMovesLeft > 0 || other.shieldMovesLeft > 0) return false;
    return this.value === other.value;
  }

  mergeValue(other) {
    if (this.type === Tile.TYPES.WILDCARD && other.type === Tile.TYPES.WILDCARD) return 4;
    if (this.type === Tile.TYPES.WILDCARD) return other.value;
    if (other.type === Tile.TYPES.WILDCARD) return this.value;
    if (this.type === Tile.TYPES.FUSIONCORE && other.type === Tile.TYPES.FUSIONCORE) {
      return this.value * 3;
    }
    if (this.type === Tile.TYPES.FUSIONCORE || other.type === Tile.TYPES.FUSIONCORE) {
      return (this.value + other.value) * 3 / 2;
    }
    return this.value + other.value;
  }

  tickShield() {
    if (this.type === Tile.TYPES.SHIELD && this.shieldMovesLeft > 0) {
      this.shieldMovesLeft--;
      if (this.shieldMovesLeft === 0) {
        this.type = Tile.TYPES.NORMAL;
      }
    }
  }

  clone() {
    const t = new Tile(this.value, this.type, this.row, this.col);
    t.shieldMovesLeft = this.shieldMovesLeft;
    t.id = this.id;
    return t;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Tile };
}
if (typeof global !== 'undefined') {
  global.Tile = Tile;
}
