/**
 * Pacman UI Module
 *
 * Handles all canvas rendering for menus, HUD, overlays, animations,
 * score popups, visual audio feedback, and screen transitions.
 *
 * Vanilla JS — ES module export. No dependencies.
 */

// ---------------------------------------------------------------------------
// Screen constants
// ---------------------------------------------------------------------------
export const SCREENS = {
  ATTRACT: 'ATTRACT',
  MAIN_MENU: 'MAIN_MENU',
  DIFFICULTY_SELECT: 'DIFFICULTY_SELECT',
  COUNTDOWN: 'COUNTDOWN',
  PAUSE: 'PAUSE',
  GAME_OVER: 'GAME_OVER',
  HIGH_SCORES: 'HIGH_SCORES',
  SETTINGS: 'SETTINGS',
  TUTORIAL: 'TUTORIAL',
  ACHIEVEMENTS: 'ACHIEVEMENTS',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
};

// ---------------------------------------------------------------------------
// Difficulty constants
// ---------------------------------------------------------------------------
export const DIFFICULTIES = ['easy', 'medium', 'hard'];

// ---------------------------------------------------------------------------
// Pixel text rendering helper
// ---------------------------------------------------------------------------

/**
 * 5x5 pixel font bitmap (uppercase letters, numbers, and symbols).
 * Each character is a 5x5 grid of 0/1 bits.
 */
const PIXEL_FONT = {
  'A': [0b01000, 0b10100, 0b10100, 0b11111, 0b10100],
  'B': [0b11110, 0b10010, 0b11100, 0b10010, 0b11110],
  'C': [0b01111, 0b10000, 0b10000, 0b10000, 0b01111],
  'D': [0b11110, 0b10001, 0b10010, 0b10100, 0b11000],
  'E': [0b11111, 0b10000, 0b11110, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b11110, 0b10000, 0b10000],
  'G': [0b01110, 0b10000, 0b10111, 0b10010, 0b01100],
  'H': [0b10100, 0b10100, 0b11111, 0b10100, 0b10100],
  'I': [0b11111, 0b00100, 0b00100, 0b00100, 0b11111],
  'J': [0b00001, 0b00001, 0b00001, 0b10001, 0b01110],
  'K': [0b10100, 0b10010, 0b10001, 0b10010, 0b10100],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10100, 0b11111, 0b10101, 0b10100, 0b10100],
  'N': [0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10010, 0b11100, 0b10000, 0b10000],
  'Q': [0b01110, 0b10011, 0b10101, 0b11001, 0b01110],
  'R': [0b11110, 0b10010, 0b11100, 0b10010, 0b10001],
  'S': [0b01111, 0b10000, 0b01110, 0b00001, 0b11110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10100, 0b10100, 0b10100, 0b10100, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10101, 0b11011, 0b00100],
  'X': [0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
  'Y': [0b10001, 0b01010, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00010, 0b00100, 0b01000, 0b11111],
  '0': [0b01110, 0b10011, 0b10101, 0b11001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10010, 0b00110, 0b01010, 0b11111],
  '3': [0b11110, 0b00010, 0b01110, 0b00010, 0b11110],
  '4': [0b10010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b11110],
  '6': [0b01110, 0b10000, 0b11110, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b00100],
  '8': [0b01110, 0b10001, 0b01110, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b01111, 0b00001, 0b01110],
  ':': [0b00000, 0b01000, 0b00000, 0b01000, 0b00000],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b01000],
  '!': [0b01000, 0b01000, 0b01000, 0b00000, 0b01000],
  '?': [0b01110, 0b10010, 0b01001, 0b00010, 0b00000],
  '-': [0b00000, 0b00000, 0b11111, 0b00000, 0b00000],
  ',': [0b00000, 0b00000, 0b00000, 0b01000, 0b00100],
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
};

/**
 * Render pixel-art text onto a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text - Text to render
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} scale - Pixel scale factor
 * @param {string} color - Fill color for text
 */
export function renderPixelText(ctx, text, x, y, scale, color = '#FFFFFF') {
  ctx.fillStyle = color;
  const chars = text.toUpperCase();
  let cursorX = x;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const bitmap = PIXEL_FONT[ch];
    if (!bitmap) {
      cursorX += 6 * scale;
      continue;
    }

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (bitmap[row] & (0b10000 >> col)) {
          ctx.fillRect(cursorX + col * scale, y + row * scale, scale, scale);
        }
      }
    }
    cursorX += 6 * scale;
  }
}

/**
 * Measure pixel text width.
 * @param {string} text
 * @param {number} scale
 * @returns {number}
 */
function measurePixelTextWidth(text, scale) {
  return text.length * 6 * scale;
}

// ---------------------------------------------------------------------------
// UI class
// ---------------------------------------------------------------------------
export class UI {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // ── Current screen state ──
    this.screen = null;

    // ── Menu state ──
    this._menuItems = [];
    this._menuIndex = 0;
    this._menuTitle = '';

    // ── HUD data ──
    this._score = 0;
    this._level = 1;
    this._lives = 3;
    this._highScore = 0;
    this._difficulty = 'medium';
    this._practiceMode = false;

    // ── Countdown ──
    this._countdownValue = 3;

    // ── Visual effects ──
    this._flashes = [];
    this._visualAudios = [];
    this._scorePopups = [];
    this._comboDisplays = [];
    this._achievementNotifications = [];

    // ── High scores / achievements / settings ──
    this._highScores = [];
    this._achievements = [];
    this._settings = null;
    this._settingsChanges = null;
    this._settingsScroll = 0;
  }

  // ════════════════════════════════════════════════════════════════════════
  // Screen management
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Set the current screen and initialize menu items.
   * @param {string|null} screen
   */
  setScreen(screen) {
    this.screen = screen;
    this._menuIndex = 0;
    this._menuItems = [];
    this._settingsScroll = 0;

    switch (screen) {
      case SCREENS.ATTRACT:
        this._menuTitle = 'PAC-MAN';
        this._menuItems = ['PRESS ENTER TO START'];
        break;

      case SCREENS.MAIN_MENU:
        this._menuTitle = 'PAC-MAN';
        this._menuItems = ['PLAY', 'PRACTICE', 'HIGH SCORES', 'ACHIEVEMENTS', 'SETTINGS', 'TUTORIAL'];
        break;

      case SCREENS.DIFFICULTY_SELECT:
        this._menuTitle = 'SELECT DIFFICULTY';
        this._menuItems = ['EASY', 'MEDIUM', 'HARD'];
        // Pre-select current difficulty
        const idx = DIFFICULTIES.indexOf(this._difficulty);
        if (idx >= 0) this._menuIndex = idx;
        break;

      case SCREENS.PAUSE:
        this._menuTitle = 'PAUSED';
        this._menuItems = ['RESUME', 'SETTINGS', 'QUIT'];
        break;

      case SCREENS.GAME_OVER:
        this._menuTitle = 'GAME OVER';
        this._menuItems = ['RESTART', 'MAIN MENU'];
        break;

      case SCREENS.COUNTDOWN:
        this._menuItems = [];
        break;

      case SCREENS.HIGH_SCORES:
        this._menuTitle = 'HIGH SCORES';
        this._menuItems = ['BACK'];
        break;

      case SCREENS.SETTINGS:
        this._menuTitle = 'SETTINGS';
        this._menuItems = ['BACK'];
        this._settingsScroll = 0;
        break;

      case SCREENS.TUTORIAL:
        this._menuTitle = 'TUTORIAL';
        this._menuItems = ['BACK'];
        break;

      case SCREENS.ACHIEVEMENTS:
        this._menuTitle = 'ACHIEVEMENTS';
        this._menuItems = ['BACK'];
        break;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Menu handling
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Navigate menu selection up or down.
   * @param {string} direction - 'up', 'down', or 'select'
   */
  handleMenuNavigate(direction) {
    if (this._menuItems.length === 0) return;

    if (direction === 'up') {
      this._menuIndex = (this._menuIndex - 1 + this._menuItems.length) % this._menuItems.length;
    } else if (direction === 'down') {
      this._menuIndex = (this._menuIndex + 1) % this._menuItems.length;
    }
  }

  /**
   * Handle menu selection. Returns the index of the selected item.
   * @returns {number}
   */
  handleMenuSelect() {
    return this._menuIndex;
  }

  // ════════════════════════════════════════════════════════════════════════
  // HUD setters
  // ════════════════════════════════════════════════════════════════════════

  setScore(score) { this._score = score; }
  setLevel(level) { this._level = level; }
  setLives(lives) { this._lives = lives; }
  setHighScore(highScore) { this._highScore = highScore; }
  setCountdown(value) { this._countdownValue = value; }
  setDifficulty(difficulty) { this._difficulty = difficulty; }
  getDifficulty() { return this._difficulty; }
  setPracticeMode(enabled) { this._practiceMode = enabled; }

  // ════════════════════════════════════════════════════════════════════════
  // Visual effects
  // ════════════════════════════════════════════════════════════════════════

  addFlash(color, duration) {
    this._flashes.push({ color, remaining: duration, total: duration });
  }

  addVisualAudio(text) {
    this._visualAudios.push({ text, remaining: 1.5, total: 1.5 });
  }

  addScorePopup(text, x, y) {
    this._scorePopups.push({ text, x, y, remaining: 1.0, total: 1.0 });
  }

  addComboDisplay(combo, x, y) {
    this._comboDisplays.push({ text: `${combo}x COMBO!`, x, y, remaining: 1.5, total: 1.5 });
  }

  addAchievementNotification(achievement) {
    this._achievementNotifications.push({
      ...achievement,
      remaining: 3.0,
      total: 3.0,
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // Data setters
  // ════════════════════════════════════════════════════════════════════════

  setHighScores(scores) { this._highScores = scores || []; }
  setAchievements(achievements) { this._achievements = achievements || []; }

  setSettings(settings) {
    this._settings = settings;
    this._settingsChanges = JSON.parse(JSON.stringify(settings));
  }

  getSettingsChanges() {
    const changes = this._settingsChanges;
    this._settingsChanges = null;
    return changes;
  }

  // ════════════════════════════════════════════════════════════════════════
  // Update (called every frame)
  // ════════════════════════════════════════════════════════════════════════

  update(dt) {
    // Decay flashes
    this._flashes = this._flashes.filter(f => {
      f.remaining -= dt;
      return f.remaining > 0;
    });

    // Decay visual audio indicators
    this._visualAudios = this._visualAudios.filter(v => {
      v.remaining -= dt;
      return v.remaining > 0;
    });

    // Decay score popups
    this._scorePopups = this._scorePopups.filter(p => {
      p.remaining -= dt;
      p.y -= dt * 30; // float upward
      return p.remaining > 0;
    });

    // Decay combo displays
    this._comboDisplays = this._comboDisplays.filter(c => {
      c.remaining -= dt;
      c.y -= dt * 20;
      return c.remaining > 0;
    });

    // Decay achievement notifications
    this._achievementNotifications = this._achievementNotifications.filter(a => {
      a.remaining -= dt;
      return a.remaining > 0;
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // Main render
  // ════════════════════════════════════════════════════════════════════════

  render(ctx, w, h, time) {
    // Background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, w, h);

    switch (this.screen) {
      case SCREENS.ATTRACT:
        this._renderAttract(ctx, w, h, time);
        break;
      case SCREENS.MAIN_MENU:
        this._renderMainMenu(ctx, w, h);
        break;
      case SCREENS.DIFFICULTY_SELECT:
        this._renderMenu(ctx, w, h, this._menuTitle, this._menuItems);
        break;
      case SCREENS.COUNTDOWN:
        this._renderCountdown(ctx, w, h);
        break;
      case SCREENS.PAUSE:
        this._renderMenu(ctx, w, h, this._menuTitle, this._menuItems);
        break;
      case SCREENS.GAME_OVER:
        this._renderGameOver(ctx, w, h);
        break;
      case SCREENS.HIGH_SCORES:
        this._renderHighScores(ctx, w, h);
        break;
      case SCREENS.SETTINGS:
        this._renderSettings(ctx, w, h);
        break;
      case SCREENS.TUTORIAL:
        this._renderTutorial(ctx, w, h);
        break;
      case SCREENS.ACHIEVEMENTS:
        this._renderAchievements(ctx, w, h);
        break;
    }

    // Render flashes on top
    for (const flash of this._flashes) {
      const alpha = (flash.remaining / flash.total) * 0.3;
      ctx.fillStyle = flash.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      // Handle hex colors
      if (flash.color.startsWith('#')) {
        const r = parseInt(flash.color.slice(1, 3), 16);
        const g = parseInt(flash.color.slice(3, 5), 16);
        const b = parseInt(flash.color.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      ctx.fillRect(0, 0, w, h);
    }

    // Render visual audio indicators
    let vaY = h - 20;
    for (const va of this._visualAudios) {
      const alpha = va.remaining / va.total;
      ctx.globalAlpha = alpha;
      renderPixelText(ctx, va.text, w / 2 - measurePixelTextWidth(va.text, 2) / 2, vaY, 2, '#FFFF00');
      ctx.globalAlpha = 1;
      vaY -= 20;
    }

    // Render score popups
    for (const popup of this._scorePopups) {
      const alpha = popup.remaining / popup.total;
      ctx.globalAlpha = alpha;
      renderPixelText(ctx, popup.text, popup.x, popup.y, 2, '#FFFFFF');
      ctx.globalAlpha = 1;
    }

    // Render combo displays
    for (const combo of this._comboDisplays) {
      const alpha = combo.remaining / combo.total;
      ctx.globalAlpha = alpha;
      renderPixelText(ctx, combo.text, combo.x - 20, combo.y, 2, '#FF69B4');
      ctx.globalAlpha = 1;
    }

    // Render achievement notifications
    let aY = 80;
    for (const a of this._achievementNotifications) {
      const alpha = Math.min(1, a.remaining / 0.5, (a.total - a.remaining) / 0.5);
      ctx.globalAlpha = alpha;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(w / 2 - 150, aY, 300, 35);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 150, aY, 300, 35);

      // Icon + text
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(`${a.icon} ${a.name}: ${a.description}`, w / 2, aY + 22);

      ctx.globalAlpha = 1;
      aY += 45;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // HUD render
  // ════════════════════════════════════════════════════════════════════════

  renderHUD(ctx, w, h, frightenedTimer, difficulty) {
    const hudHeight = 40;

    // HUD background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, w, hudHeight);

    // Score
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SCORE: ${this._score}`, 10, hudHeight / 2);

    // High Score
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFB89E';
    ctx.fillText(`HI: ${this._highScore}`, w / 2, hudHeight / 2);

    // Level
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`LEVEL: ${this._level}`, w - 10, hudHeight / 2);

    // Lives (render as small Pacman icons)
    for (let i = 0; i < this._lives; i++) {
      const lx = 10 + i * 20;
      const ly = hudHeight + 10;
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(lx + 6, ly, 6, 0.3 * Math.PI, 2 * Math.PI - 0.3 * Math.PI);
      ctx.lineTo(lx + 6, ly);
      ctx.fill();
    }

    // Frightened timer indicator
    if (frightenedTimer > 0) {
      const barWidth = Math.min(w - 20, 200);
      const maxTimer = 12; // max possible
      const fill = (frightenedTimer / maxTimer) * barWidth;
      const barX = (w - barWidth) / 2;
      const barY = hudHeight + 2;

      ctx.fillStyle = 'rgba(33, 33, 222, 0.5)';
      ctx.fillRect(barX, barY, barWidth, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(barX, barY, fill, 4);
    }

    // Practice mode indicator
    if (this._practiceMode) {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#00FF00';
      ctx.textAlign = 'center';
      ctx.fillText('PRACTICE MODE', w / 2, hudHeight + 15);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Screen renderers
  // ════════════════════════════════════════════════════════════════════════

  _renderAttract(ctx, w, h, time) {
    // Title
    const titleScale = 4;
    const titleW = measurePixelTextWidth('PAC-MAN', titleScale);
    const titleX = (w - titleW) / 2;
    const titleY = h * 0.3;

    // Title glow
    const glowAlpha = 0.5 + 0.5 * Math.sin(time / 300);
    ctx.globalAlpha = glowAlpha;
    renderPixelText(ctx, 'PAC-MAN', titleX - 2, titleY - 2, titleScale, '#FFD700');
    ctx.globalAlpha = 1;
    renderPixelText(ctx, 'PAC-MAN', titleX, titleY, titleScale, '#FFFF00');

    // Subtitle
    const subScale = 2;
    const subText = 'PRESS ENTER TO START';
    const subW = measurePixelTextWidth(subText, subScale);
    const subX = (w - subW) / 2;
    const subY = h * 0.55;

    const blink = Math.sin(time / 500) > 0;
    if (blink) {
      renderPixelText(ctx, subText, subX, subY, subScale, '#FFFFFF');
    }

    // Decorative Pacman
    const pacX = w / 2;
    const pacY = h * 0.7;
    const pacR = 20;
    const mouthAngle = (Math.sin(time / 200) * 0.3 + 0.3) * Math.PI;
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(pacX, pacY, pacR, mouthAngle, 2 * Math.PI - mouthAngle);
    ctx.lineTo(pacX, pacY);
    ctx.fill();

    // Ghost decorations
    const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
    for (let i = 0; i < 4; i++) {
      const gx = w * 0.2 + i * (w * 0.6 / 3);
      const gy = h * 0.82;
      const bob = Math.sin(time / 400 + i) * 3;
      this._drawMiniGhost(ctx, gx, gy + bob, 12, ghostColors[i]);
    }
  }

  _drawMiniGhost(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.15, size, Math.PI, 0, false);
    ctx.lineTo(x + size, y + size * 0.7);
    ctx.lineTo(x + size * 0.6, y + size * 0.4);
    ctx.lineTo(x + size * 0.3, y + size * 0.7);
    ctx.lineTo(x, y + size * 0.4);
    ctx.lineTo(x - size * 0.3, y + size * 0.7);
    ctx.lineTo(x - size * 0.6, y + size * 0.4);
    ctx.lineTo(x - size, y + size * 0.7);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.15, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y - size * 0.15, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2121DE';
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderMainMenu(ctx, w, h) {
    // Title
    const titleScale = 4;
    const titleW = measurePixelTextWidth('PAC-MAN', titleScale);
    const titleX = (w - titleW) / 2;
    const titleY = h * 0.12;
    renderPixelText(ctx, 'PAC-MAN', titleX, titleY, titleScale, '#FFFF00');

    // Render menu items
    this._renderMenu(ctx, w, h, '', this._menuItems, h * 0.35);
  }

  _renderMenu(ctx, w, h, title, items, startY) {
    const baseY = startY || h * 0.35;
    const itemHeight = 30;
    const scale = 2;

    if (title) {
      const titleW = measurePixelTextWidth(title, scale);
      const titleX = (w - titleW) / 2;
      renderPixelText(ctx, title, titleX, baseY - 30, scale, '#FFD700');
    }

    for (let i = 0; i < items.length; i++) {
      const y = baseY + i * itemHeight;
      const isSelected = i === this._menuIndex;

      if (isSelected) {
        // Highlight background
        ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        ctx.fillRect(w / 2 - 120, y - 12, 240, itemHeight);

        // Arrow indicator
        ctx.fillStyle = '#FFFF00';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶', w / 2 - 30, y + itemHeight / 2);
      }

      const textW = measurePixelTextWidth(items[i], scale);
      const textX = (w - textW) / 2 + 10;
      const textY = y;

      renderPixelText(
        ctx,
        items[i],
        textX,
        textY,
        scale,
        isSelected ? '#FFFF00' : '#FFFFFF'
      );
    }
  }

  _renderCountdown(ctx, w, h) {
    let text;
    if (this._countdownValue > 0) {
      text = String(this._countdownValue);
    } else {
      text = 'GO!';
    }

    const scale = 6;
    const textW = measurePixelTextWidth(text, scale);
    const textX = (w - textW) / 2;
    const textY = h / 2 - 15;

    // Pulse effect
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-w / 2, -h / 2);

    renderPixelText(ctx, text, textX, textY, scale, '#FFFF00');
    ctx.restore();
  }

  _renderGameOver(ctx, w, h) {
    const scale = 4;
    const titleW = measurePixelTextWidth('GAME OVER', scale);
    const titleX = (w - titleW) / 2;
    renderPixelText(ctx, 'GAME OVER', titleX, h * 0.15, scale, '#FF0000');

    // Score display
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FINAL SCORE: ${this._score}`, w / 2, h * 0.35);
    ctx.fillText(`LEVEL: ${this._level}`, w / 2, h * 0.42);

    if (this._highScore > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`HIGH SCORE: ${this._highScore}`, w / 2, h * 0.49);
    }

    // Menu items
    const itemHeight = 30;
    const baseY = h * 0.6;
    const menuScale = 2;

    for (let i = 0; i < this._menuItems.length; i++) {
      const y = baseY + i * itemHeight;
      const isSelected = i === this._menuIndex;

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        ctx.fillRect(w / 2 - 120, y - 12, 240, itemHeight);
        ctx.fillStyle = '#FFFF00';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('▶', w / 2 - 30, y + itemHeight / 2);
      }

      const textW = measurePixelTextWidth(this._menuItems[i], menuScale);
      const textX = (w - textW) / 2 + 10;
      renderPixelText(
        ctx,
        this._menuItems[i],
        textX,
        y,
        menuScale,
        isSelected ? '#FFFF00' : '#FFFFFF'
      );
    }
  }

  _renderHighScores(ctx, w, h) {
    const scale = 3;
    const titleW = measurePixelTextWidth('HIGH SCORES', scale);
    const titleX = (w - titleW) / 2;
    renderPixelText(ctx, 'HIGH SCORES', titleX, 20, scale, '#FFD700');

    // Score entries
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const startY = 70;
    const entryHeight = 22;

    if (this._highScores.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'center';
      ctx.fillText('No scores yet', w / 2, startY);
    } else {
      for (let i = 0; i < Math.min(10, this._highScores.length); i++) {
        const entry = this._highScores[i];
        const y = startY + i * entryHeight;

        ctx.fillStyle = i < 3 ? '#FFD700' : '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${entry.score}`, 30, y);

        ctx.fillStyle = '#AAAAAA';
        ctx.textAlign = 'right';
        ctx.fillText(`Lv.${entry.level}`, w - 30, y);
      }
    }

    // Back prompt
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    const blink = Math.sin(Date.now() / 500) > 0;
    if (blink) {
      ctx.fillText('Press ENTER to go back', w / 2, h - 30);
    }
  }

  _renderSettings(ctx, w, h) {
    const scale = 3;
    const titleW = measurePixelTextWidth('SETTINGS', scale);
    const titleX = (w - titleW) / 2;
    renderPixelText(ctx, 'SETTINGS', titleX, 10, scale, '#FFD700');

    if (!this._settings) return;

    const settings = this._settings;
    const changes = this._settingsChanges;

    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let y = 55;
    const lineH = 20;

    // Volume controls
    this._renderSettingSlider(ctx, w, 'MASTER VOL', settings.masterVolume,
      changes, 'masterVolume', y);
    y += lineH + 5;

    this._renderSettingSlider(ctx, w, 'MUSIC VOL', settings.musicVolume,
      changes, 'musicVolume', y);
    y += lineH + 5;

    this._renderSettingSlider(ctx, w, 'SFX VOL', settings.effectsVolume,
      changes, 'effectsVolume', y);
    y += lineH + 10;

    // Toggle settings
    const toggles = [
      { label: 'CRT OVERLAY', key: 'crtOverlay' },
      { label: 'SCREEN SHAKE', key: 'screenShake' },
      { label: 'PARTICLES', key: 'particles' },
      { label: 'REDUCED FLASH', key: 'reducedFlash' },
      { label: 'REDUCED MOTION', key: 'reducedMotion' },
    ];

    for (const toggle of toggles) {
      const val = changes[toggle.key] ?? settings[toggle.key];
      const state = val ? '[ON]' : '[OFF]';
      ctx.fillStyle = '#AAAAAA';
      ctx.fillText(toggle.label, 30, y);
      ctx.fillStyle = val ? '#00FF00' : '#FF4444';
      ctx.textAlign = 'right';
      ctx.fillText(state, w - 30, y);
      ctx.textAlign = 'left';
      y += lineH;
    }

    y += 10;

    // Mute toggle
    const muted = changes.muted ?? settings.muted;
    const muteState = muted ? '[MUTED]' : '[UNMUTED]';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('MUTE', 30, y);
    ctx.fillStyle = muted ? '#FF4444' : '#00FF00';
    ctx.textAlign = 'right';
    ctx.fillText(muteState, w - 30, y);
    ctx.textAlign = 'left';

    // Back prompt
    y = h - 30;
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    const blink = Math.sin(Date.now() / 500) > 0;
    if (blink) {
      ctx.fillText('Press ENTER to save & go back', w / 2, y);
    }
  }

  _renderSettingSlider(ctx, w, label, value, changes, key, y) {
    const val = changes[key] ?? value;
    const pct = Math.round(val * 100);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, 30, y);

    // Draw slider bar
    const barX = 160;
    const barW = w - 240;
    const barH = 8;
    const barY = y + 2;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = '#4488FF';
    ctx.fillRect(barX, barY, barW * val, barH);

    // Percentage
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${pct}%`, w - 30, y);
    ctx.textAlign = 'left';
  }

  _renderTutorial(ctx, w, h) {
    const scale = 3;
    const titleW = measurePixelTextWidth('TUTORIAL', scale);
    const titleX = (w - titleW) / 2;
    renderPixelText(ctx, 'TUTORIAL', titleX, 15, scale, '#FFD700');

    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';

    const lines = [
      '',
      'Arrow Keys / WASD - Move Pacman',
      'Enter / Space     - Confirm',
      'Escape            - Pause',
      'M                 - Mute Toggle',
      '',
      'Eat all dots to complete each level.',
      'Power pellets make ghosts vulnerable.',
      'Eat frightened ghosts for bonus points!',
      'Collect bonus fruits for extra points.',
      '',
      'Ghost behaviors:',
      '  Red    - Chases you directly',
      '  Pink   - Tries to ambush ahead',
      '  Cyan   - Unpredictable movement',
      '  Orange - Chases or scatters',
    ];

    let y = 60;
    for (const line of lines) {
      ctx.fillText(line, 30, y);
      y += 18;
    }

    // Back prompt
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    const blink = Math.sin(Date.now() / 500) > 0;
    if (blink) {
      ctx.fillText('Press ENTER to go back', w / 2, h - 30);
    }
  }

  _renderAchievements(ctx, w, h) {
    const scale = 3;
    const titleW = measurePixelTextWidth('ACHIEVEMENTS', scale);
    const titleX = (w - titleW) / 2;
    renderPixelText(ctx, 'ACHIEVEMENTS', titleX, 15, scale, '#FFD700');

    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let y = 55;
    const lineH = 22;

    for (const a of this._achievements) {
      const icon = a.icon || '🏆';
      const status = a.unlocked ? '✓' : '🔒';
      const color = a.unlocked ? '#FFD700' : '#666666';

      ctx.fillStyle = color;
      ctx.fillText(`${icon} ${status} ${a.name}`, 30, y);

      ctx.fillStyle = '#AAAAAA';
      ctx.font = '11px monospace';
      ctx.fillText(`  ${a.description}`, 50, y + 12);
      ctx.font = '12px monospace';

      y += lineH + 14;
    }

    // Back prompt
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    const blink = Math.sin(Date.now() / 500) > 0;
    if (blink) {
      ctx.fillText('Press ENTER to go back', w / 2, h - 30);
    }
  }
}
