const TILE_COLORS = {
  2: '#4fc3f7',
  4: '#00e5ff',
  8: '#00bfa5',
  16: '#69f0ae',
  32: '#b2ff59',
  64: '#eeff41',
  128: '#ffd740',
  256: '#ffab40',
  512: '#ff6e40',
  1024: '#ff5252',
  2048: '#ff1744',
};

const RENDERER_SPECIAL_COLORS = {
  wildcard: '#00e5ff',
  bomb: '#ff1744',
  shield: '#69f0ae',
  multiplier: '#ffd740',
  fusionCore: '#e040fb',
};

const RENDERER_SPECIAL_ICONS = {
  wildcard: '\u2605',
  bomb: '\uD83D\uDCA5',
  shield: '\uD83D\uDEE1',
  multiplier: '\u00D72',
  fusionCore: '\u26A1',
};

const RENDERER_ZONE_COLORS = {
  gravityWell: 'rgba(30, 0, 60, 0.4)',
  frozen: 'rgba(0, 150, 255, 0.25)',
  boost: 'rgba(255, 140, 0, 0.25)',
  swap: 'rgba(200, 0, 200, 0.25)',
};

class Particle {
  constructor(x, y, color, vx, vy, life, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size || 3;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 120 * dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class AnimatedTile {
  constructor(col, row, value, type) {
    this.col = col;
    this.row = row;
    this.value = value;
    this.type = type || 'normal';
    this.targetCol = col;
    this.targetRow = row;
    this.renderCol = col;
    this.renderRow = row;
    this.scale = 1;
    this.targetScale = 1;
    this.merging = false;
    this.merged = false;
    this.spawnAnim = 0;
    this.shieldMovesLeft = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
}

class Renderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config || {};
    this.gridSize = this.config.gridSize || 4;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.gridPixels = 0;
    this.cellSize = 0;
    this.padding = 0;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    this.tileSize = 0;

    this.tiles = [];
    this.particles = [];
    this.zones = [];
    this.score = 0;
    this.bestScore = 0;
    this.streak = 0;
    this.level = 1;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.comboFlash = 0;
    this.comboIntensity = 0;
    this.mutationFlash = 0;
    this.bgHue = 0;
    this.lastTime = 0;
    this.running = false;
    this.animFrameId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    mql.addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const maxW = parent.clientWidth;
    const maxH = parent.clientHeight;
    const size = Math.min(maxW, maxH, 600);
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.gridPixels = size;
    this.padding = size * 0.03;
    this.cellSize = (this.gridPixels - this.padding * 2) / this.gridSize;
    this.tileSize = this.cellSize * 0.88;
    this.gridOffsetX = this.padding;
    this.gridOffsetY = this.padding;
  }

  setScore(score) {
    this.score = score;
  }

  setBestScore(best) {
    this.bestScore = best;
  }

  setStreak(streak) {
    this.streak = streak;
  }

  setLevel(level) {
    this.level = level;
  }

  setTiles(tileData) {
    const used = new Set();
    const newTiles = [];

    for (const t of tileData) {
      // Find best matching existing tile (same value + type, not yet used, closest render position)
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < this.tiles.length; i++) {
        if (used.has(i)) continue;
        const existing = this.tiles[i];
        if (existing.value === t.value && existing.type === t.type && !existing.merging) {
          // Use render positions (current visual position) for distance, not target positions
          const dist = Math.abs(existing.renderCol - t.col) + Math.abs(existing.renderRow - t.row);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }
      }

      if (bestIdx >= 0) {
        // Reuse existing tile, update target for animation
        const existing = this.tiles[bestIdx];
        existing.targetCol = t.col;
        existing.targetRow = t.row;
        existing.shieldMovesLeft = t.shieldMovesLeft || 0;
        used.add(bestIdx);
      } else {
        // New tile - create with spawn animation
        const at = new AnimatedTile(t.col, t.row, t.value, t.type);
        if (t.shieldMovesLeft) at.shieldMovesLeft = t.shieldMovesLeft;
        at.spawnAnim = 1;
        at.scale = 0;
        newTiles.push(at);
      }
    }

    // Keep unused tiles for fade-out effect (e.g. tiles consumed by merges)
    const kept = this.tiles.filter((_, i) => !used.has(i));
    this.tiles = this.tiles.filter((_, i) => used.has(i)).concat(newTiles, kept);
  }

  setZones(zones) {
    this.zones = zones || [];
  }

  spawnTile(col, row, value, type) {
    const tile = new AnimatedTile(col, row, value, type || 'normal');
    tile.spawnAnim = 1;
    tile.scale = 0;
    this.tiles.push(tile);
    return tile;
  }

  removeTile(value, type) {
    const idx = this.tiles.findIndex(t => t.value === value && t.type === type && !t.merged);
    if (idx !== -1) {
      this.tiles.splice(idx, 1);
    }
  }

  removeTilesAt(col, row) {
    this.tiles = this.tiles.filter(t => !(t.col === col && t.row === row));
  }

  slideTiles(moves) {
    moves.forEach(m => {
      const tile = this.tiles.find(t => t.value === m.tileValue && t.type === m.tileType && t.col === m.fromCol && t.row === m.fromRow);
      if (tile) {
        tile.targetCol = m.toCol;
        tile.targetRow = m.toRow;
      }
    });
  }

  mergeTiles(fromA, fromB, toCol, toRow, newValue, newType) {
    const tileA = this.tiles.find(t => t.value === fromA.value && t.type === fromA.type && t.col === fromA.col && t.row === fromA.row);
    const tileB = this.tiles.find(t => t.value === fromB.value && t.type === fromB.type && t.col === fromB.col && t.row === fromB.row);
    if (tileA) {
      tileA.targetCol = toCol;
      tileA.targetRow = toRow;
      tileA.merging = true;
    }
    if (tileB) {
      tileB.targetCol = toCol;
      tileB.targetRow = toRow;
      tileB.merging = true;
    }
    const merged = new AnimatedTile(toCol, toRow, newValue, newType || 'normal');
    merged.merged = true;
    merged.spawnAnim = 1;
    merged.scale = 0;
    this.tiles.push(merged);
    this.emitMergeParticles(toCol, toRow, newValue);
    if (newValue >= 128 && !this.reducedMotion) {
      this.shakeIntensity = Math.min(8, 2 + Math.log2(newValue) * 0.5);
      this.shakeDuration = 0.2;
    }
    if (this.streak >= 5) {
      this.comboFlash = 1;
      this.comboIntensity = Math.min(1, this.streak / 10);
    }
  }

  emitMergeParticles(col, row, value) {
    if (this.reducedMotion) return;
    const cx = this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
    const cy = this.gridOffsetY + row * this.cellSize + this.cellSize / 2;
    const color = this.getTileColor(value);
    const count = Math.min(40, 8 + Math.log2(value) * 4);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 0.4 + Math.random() * 0.5;
      const size = 2 + Math.random() * 3;
      this.particles.push(new Particle(cx, cy, color, vx, vy, life, size));
    }
    if (this.particles.length > 200) {
      this.particles = this.particles.slice(this.particles.length - 200);
    }
  }

  emitBombParticles(col, row) {
    if (this.reducedMotion) return;
    const cx = this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
    const cy = this.gridOffsetY + row * this.cellSize + this.cellSize / 2;
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      const colors = ['#ff1744', '#ff6e40', '#ffd740', '#fff'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(cx, cy, color, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.3 + Math.random() * 0.4, 2 + Math.random() * 4));
    }
  }

  triggerMutationFlash() {
    this.mutationFlash = 1;
  }

  getTileColor(value) {
    const log2 = Math.round(Math.log2(Math.max(2, value)));
    if (TILE_COLORS[value]) return TILE_COLORS[value];
    if (log2 >= 12) return '#e040fb';
    const idx = Math.min(log2 - 1, TILE_COLORS.length - 1);
    const keys = Object.keys(TILE_COLORS).map(Number).sort((a, b) => a - b);
    return TILE_COLORS[keys[Math.max(0, idx)]] || '#4fc3f7';
  }

  getTextColor(value) {
    if (value >= 8) return '#1a1a2e';
    return '#ffffff';
  }

  getFontSize(value) {
    if (value < 10) return this.tileSize * 0.45;
    if (value < 100) return this.tileSize * 0.38;
    if (value < 1000) return this.tileSize * 0.32;
    if (value < 10000) return this.tileSize * 0.26;
    return this.tileSize * 0.22;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.update(dt);
    this.draw();
    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const animSpeed = this.reducedMotion ? 8 : 1;

    this.tiles.forEach(tile => {
      const lerpFactor = 12 * dt * animSpeed;
      tile.renderCol += (tile.targetCol - tile.renderCol) * Math.min(1, lerpFactor);
      tile.renderRow += (tile.targetRow - tile.renderRow) * Math.min(1, lerpFactor);

      if (tile.merging) {
        tile.scale = Math.max(0, tile.scale - 3 * dt);
      } else if (tile.spawnAnim > 0) {
        tile.spawnAnim -= 2.5 * dt * animSpeed;
        const t = Math.max(0, 1 - tile.spawnAnim);
        const bounce = t < 0.7 ? 1 + 0.15 * Math.sin((t / 0.7) * Math.PI) : 1;
        tile.scale = t * bounce;
        if (tile.spawnAnim <= 0) tile.scale = 1;
      } else {
        tile.scale += (tile.targetScale - tile.scale) * 5 * dt;
      }

      tile.pulsePhase += dt * 3;
    });

    this.tiles = this.tiles.filter(t => !(t.merging && t.scale <= 0));

    this.particles.forEach(p => p.update(dt));
    this.particles = this.particles.filter(p => p.alive);

    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.reducedMotion) {
        this.shakeX = 0;
        this.shakeY = 0;
      } else {
        this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
        this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      }
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    if (this.comboFlash > 0) {
      this.comboFlash -= dt * 1.5;
    }

    if (this.mutationFlash > 0) {
      this.mutationFlash -= dt * 2;
    }

    this.bgHue += dt * 5;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    this.drawParticles(ctx);
    this.drawComboFlash(ctx);
    this.drawMutationFlash(ctx);

    ctx.restore();
  }

  drawBackground(ctx) {
    // Intentionally left empty - DOM grid handles main background rendering.
    // Canvas only overlays particles and flash effects on top of the DOM.
  }

  drawGrid(ctx) {
    // Intentionally left empty - DOM grid handles main grid rendering.
    // Canvas only overlays particles and flash effects.
  }

  drawTiles(ctx) {
    // Intentionally left empty - DOM grid handles main tile rendering.
    // Canvas only overlays particles and flash effects.
  }

  drawGrid(ctx) {
    ctx.fillStyle = '#16213e';
    const radius = this.cellSize * 0.1;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const x = this.gridOffsetX + c * this.cellSize + this.padding * 0.3;
        const y = this.gridOffsetY + r * this.cellSize + this.padding * 0.3;
        const w = this.cellSize - this.padding * 0.6;
        const h = this.cellSize - this.padding * 0.6;
        this.roundRect(ctx, x, y, w, h, radius);
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(100, 120, 200, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.gridSize; i++) {
      const pos = this.gridOffsetX + i * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, this.gridOffsetY);
      ctx.lineTo(pos, this.gridOffsetY + this.gridSize * this.cellSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.gridOffsetX, pos);
      ctx.lineTo(this.gridOffsetX + this.gridSize * this.cellSize, pos);
      ctx.stroke();
    }
  }

  drawZones(ctx) {
    this.zones.forEach(zone => {
      const color = RENDERER_ZONE_COLORS[zone.type] || 'rgba(100,100,100,0.2)';
      const pulse = 0.5 + 0.5 * Math.sin(this.bgHue * 2);

      ctx.save();
      ctx.globalAlpha = 0.3 + 0.15 * pulse;

      zone.cells.forEach(cell => {
        const x = this.gridOffsetX + cell.col * this.cellSize + this.padding * 0.3;
        const y = this.gridOffsetY + cell.row * this.cellSize + this.padding * 0.3;
        const w = this.cellSize - this.padding * 0.6;
        const h = this.cellSize - this.padding * 0.6;

        ctx.fillStyle = color;
        this.roundRect(ctx, x, y, w, h, this.cellSize * 0.1);
        ctx.fill();
      });

      ctx.globalAlpha = 0.6 + 0.3 * pulse;
      ctx.font = `${this.cellSize * 0.25}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (zone.cells.length > 0) {
        const cx = this.gridOffsetX + zone.cells[0].col * this.cellSize + this.cellSize / 2;
        const cy = this.gridOffsetY + zone.cells[0].row * this.cellSize + this.cellSize / 2;
        const icons = { gravityWell: '\u2B07', frozen: '\u2744', boost: '\u25B2', swap: '\u21C4' };
        ctx.fillStyle = '#fff';
        ctx.fillText(icons[zone.type] || '?', cx, cy);
      }

      ctx.restore();
    });
  }

  drawTiles(ctx) {
    this.tiles.forEach(tile => {
      if (tile.scale <= 0.01) return;

      const x = this.gridOffsetX + tile.renderCol * this.cellSize + this.padding * 0.3 + (this.cellSize - this.tileSize) * 0.15;
      const y = this.gridOffsetY + tile.renderRow * this.cellSize + this.padding * 0.3 + (this.cellSize - this.tileSize) * 0.15;
      const cx = x + this.tileSize / 2;
      const cy = y + this.tileSize / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(tile.scale, tile.scale);
      ctx.translate(-cx, -cy);

      const color = tile.type !== 'normal' ? RENDERER_SPECIAL_COLORS[tile.type] : this.getTileColor(tile.value);
      const glowColor = color;
      const isHighValue = tile.value >= 2048;
      const isSpecial = tile.type !== 'normal';

      if (isHighValue || isSpecial) {
        const pulse = 0.5 + 0.5 * Math.sin(tile.pulsePhase);
        const glowSize = isHighValue ? 12 + 6 * pulse : 8 + 4 * pulse;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowSize;
      }

      if (tile.value >= 4096) {
        const auraAngle = tile.pulsePhase * 0.5;
        const auraGrad = ctx.createConicGradient(auraAngle, cx, cy);
        auraGrad.addColorStop(0, 'rgba(224, 64, 251, 0.3)');
        auraGrad.addColorStop(0.5, 'rgba(100, 0, 200, 0.1)');
        auraGrad.addColorStop(1, 'rgba(224, 64, 251, 0.3)');
        ctx.fillStyle = auraGrad;
        this.roundRect(ctx, x - 2, y - 2, this.tileSize + 4, this.tileSize + 4, this.tileSize * 0.2);
        ctx.fill();
      }

      ctx.fillStyle = color;
      this.roundRect(ctx, x, y, this.tileSize, this.tileSize, this.tileSize * 0.18);
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.fillStyle = this.getTextColor(tile.value);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isSpecial) {
        const icon = RENDERER_SPECIAL_ICONS[tile.type] || '?';
        ctx.font = `bold ${this.tileSize * 0.4}px sans-serif`;
        ctx.fillText(icon, cx, cy - this.tileSize * 0.05);
        if (tile.type !== 'multiplier') {
          ctx.font = `bold ${this.tileSize * 0.22}px monospace`;
          ctx.fillText(tile.value, cx, cy + this.tileSize * 0.3);
        }
      } else {
        ctx.font = `bold ${this.getFontSize(tile.value)}px monospace`;
        ctx.fillText(tile.value, cx, cy);
      }

      if (tile.type === 'shield' && tile.shieldMovesLeft > 0) {
        ctx.strokeStyle = '#69f0ae';
        ctx.lineWidth = 2;
        const progress = tile.shieldMovesLeft / 1;
        ctx.beginPath();
        ctx.arc(cx, cy, this.tileSize * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  drawParticles(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  drawHUD(ctx) {
    const hudY = this.gridOffsetY + this.gridSize * this.cellSize + 8;
    if (hudY + 60 > this.gridPixels) return;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(100, 120, 200, 0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('SCORE', 8, hudY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(this.score.toLocaleString(), 8, hudY + 14);

    ctx.fillStyle = 'rgba(100, 120, 200, 0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('BEST', 8, hudY + 40);
    ctx.fillStyle = '#ffd740';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(this.bestScore.toLocaleString(), 8, hudY + 52);

    const centerX = this.gridPixels / 2;
    ctx.textAlign = 'center';
    if (this.streak > 0) {
      const mult = this.getStreakMultiplier(this.streak);
      const pulse = 0.8 + 0.2 * Math.sin(this.bgHue * 4);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = this.streak >= 5 ? '#ff1744' : '#ffd740';
      ctx.font = `bold ${14 + Math.min(this.streak, 5)}px monospace`;
      ctx.fillText(`${this.streak}x STREAK`, centerX, hudY + 10);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(100, 120, 200, 0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('LEVEL', this.gridPixels - 8, hudY);
    ctx.fillStyle = '#69f0ae';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(this.level.toString(), this.gridPixels - 8, hudY + 14);
  }

  drawComboFlash(ctx) {
    if (this.comboFlash <= 0) return;
    const alpha = this.comboFlash * this.comboIntensity;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 215, 64, ${alpha})`;
    ctx.lineWidth = 3 + this.comboIntensity * 4;
    ctx.shadowColor = '#ffd740';
    ctx.shadowBlur = 10 * this.comboIntensity;
    ctx.strokeRect(1, 1, this.gridPixels - 2, this.gridPixels - 2);
    ctx.restore();
  }

  drawMutationFlash(ctx) {
    if (this.mutationFlash <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(224, 64, 251, ${this.mutationFlash * 0.15})`;
    ctx.fillRect(0, 0, this.gridPixels, this.gridPixels);
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  getStreakMultiplier(streak) {
    if (streak >= 5) return 5;
    if (streak === 4) return 3;
    if (streak === 3) return 2;
    if (streak === 2) return 1.5;
    return 1;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Renderer };
}
