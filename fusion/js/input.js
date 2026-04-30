const SWIPE_THRESHOLDS = {
  high: 20,
  medium: 30,
  low: 50,
};

class InputHandler {
  constructor(game) {
    this.game = game;
    this.cooldown = 50;
    this.lastInputTime = 0;
    this.enabled = true;
    this.swipeSensitivity = 'medium';
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.mouseDownX = 0;
    this.mouseDownY = 0;
    this.mouseDownTime = 0;
    this.mouseDragging = false;
    this.lastTapTime = 0;
    this.lastTapTarget = null;

    this.onSlide = null;
    this.onPause = null;
    this.onMute = null;
    this.onUndo = null;
    this.onConfirm = null;
    this.onTileTap = null;
    this.onMenuSelect = null;

    this.bindEvents();
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('fusion_input_settings');
      if (saved) {
        const s = JSON.parse(saved);
        this.swipeSensitivity = s.swipeSensitivity || 'medium';
      }
    } catch (e) {
      // ignore
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('fusion_input_settings', JSON.stringify({
        swipeSensitivity: this.swipeSensitivity,
      }));
    } catch (e) {
      // ignore
    }
  }

  setSwipeSensitivity(level) {
    if (SWIPE_THRESHOLDS[level] !== undefined) {
      this.swipeSensitivity = level;
      this.saveSettings();
    }
  }

  getSwipeThreshold() {
    return SWIPE_THRESHOLDS[this.swipeSensitivity] || 30;
  }

  bindEvents() {
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onTouchStart = this.onTouchStart.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onTouchEnd = this.onTouchEnd.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onContextMenu = this.onContextMenu.bind(this);
    this._onWheel = this.onWheel.bind(this);

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('touchstart', this._onTouchStart, { passive: false });
    document.addEventListener('touchmove', this._onTouchMove, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd, { passive: false });
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('contextmenu', this._onContextMenu);
    document.addEventListener('wheel', this._onWheel, { passive: false });
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('touchstart', this._onTouchStart);
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('contextmenu', this._onContextMenu);
    document.removeEventListener('wheel', this._onWheel);
  }

  isInputAllowed() {
    const now = Date.now();
    if (!this.enabled) return false;
    if (now - this.lastInputTime < this.cooldown) return false;
    if (this.game && this.game.isAnimating) return false;
    return true;
  }

  recordInput() {
    this.lastInputTime = Date.now();
  }

  // --- Keyboard ---

  onKeyDown(e) {
    if (this.game && this.game.isMenuOpen && !this.isGameplayKey(e.key)) {
      this.handleMenuKey(e);
      return;
    }

    if (!this.isInputAllowed()) return;

    const handled = this.handleGameplayKey(e);
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      this.recordInput();
    }
  }

  isGameplayKey(key) {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key);
  }

  handleGameplayKey(e) {
    const key = e.key;

    if (key === 'Escape' || key === 'p' || key === 'P') {
      if (this.onPause) this.onPause();
      return true;
    }

    if (key === 'm' || key === 'M') {
      if (this.onMute) this.onMute();
      return true;
    }

    if (key === 'z' || key === 'Z') {
      if (this.onUndo) this.onUndo();
      return true;
    }

    if (key === 'Enter' || key === ' ') {
      if (this.onConfirm) this.onConfirm();
      return true;
    }

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      if (this.onSlide) this.onSlide('up');
      return true;
    }
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      if (this.onSlide) this.onSlide('down');
      return true;
    }
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      if (this.onSlide) this.onSlide('left');
      return true;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (this.onSlide) this.onSlide('right');
      return true;
    }

    return false;
  }

  handleMenuKey(e) {
    if (this.game && this.game.onMenuKey) {
      this.game.onMenuKey(e);
    }
  }

  // --- Touch ---

  onTouchStart(e) {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.mouseDragging = false;
  }

  onTouchMove(e) {
    if (e.target.closest('.fusion-game') || e.target.closest('canvas')) {
      e.preventDefault();
    }
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const threshold = this.getSwipeThreshold();

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (!this.mouseDragging) {
        this.mouseDragging = true;
        if (this.isInputAllowed() && this.onSlide) {
          if (Math.abs(dx) > Math.abs(dy)) {
            this.onSlide(dx > 0 ? 'right' : 'left');
          } else {
            this.onSlide(dy > 0 ? 'down' : 'up');
          }
          this.recordInput();
        }
      }
    }
  }

  onTouchEnd(e) {
    if (!this.mouseDragging) {
      const elapsed = Date.now() - this.touchStartTime;
      if (elapsed < 300) {
        this.handleTap();
      }
    }
    this.mouseDragging = false;
  }

  handleTap() {
    const now = Date.now();
    if (now - this.lastTapTime < 300 && this.lastTapTarget) {
      if (this.onPause) {
        this.onPause();
        this.recordInput();
      }
      this.lastTapTime = 0;
      this.lastTapTarget = null;
    } else {
      this.lastTapTime = now;
      if (this.onTileTap && this.isInputAllowed()) {
        this.onTileTap();
        this.recordInput();
      }
    }
  }

  // --- Mouse ---

  onMouseDown(e) {
    if (e.button === 2) return;
    this.mouseDownX = e.clientX;
    this.mouseDownY = e.clientY;
    this.mouseDownTime = Date.now();
    this.mouseDragging = false;
  }

  onMouseMove(e) {
    if (e.buttons !== 1) return;
    const dx = e.clientX - this.mouseDownX;
    const dy = e.clientY - this.mouseDownY;
    const threshold = this.getSwipeThreshold();

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (!this.mouseDragging) {
        this.mouseDragging = true;
        if (this.isInputAllowed() && this.onSlide) {
          if (Math.abs(dx) > Math.abs(dy)) {
            this.onSlide(dx > 0 ? 'right' : 'left');
          } else {
            this.onSlide(dy > 0 ? 'down' : 'up');
          }
          this.recordInput();
        }
      }
    }
  }

  onMouseUp(e) {
    if (e.button === 2) return;
    if (!this.mouseDragging) {
      const elapsed = Date.now() - this.mouseDownTime;
      if (elapsed < 300) {
        this.handleMouseClick(e);
      }
    }
    this.mouseDragging = false;
  }

  handleMouseClick(e) {
    if (this.onTileTap && this.isInputAllowed()) {
      this.onTileTap(e);
      this.recordInput();
    }
  }

  onContextMenu(e) {
    e.preventDefault();
    if (this.onPause && this.isInputAllowed()) {
      this.onPause();
      this.recordInput();
    }
  }

  onWheel(e) {
    if (e.target.closest('.fusion-game') || e.target.closest('canvas')) {
      e.preventDefault();
    }
  }

  // --- Utility ---

  getTileAtPosition(px, py, canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = px - rect.left;
    const y = py - rect.top;
    const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
    const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    if (this.game && this.game.renderer) {
      const r = this.game.renderer;
      const col = Math.floor((canvasX - r.gridOffsetX) / r.cellSize);
      const row = Math.floor((canvasY - r.gridOffsetY) / r.cellSize);
      if (col >= 0 && col < r.gridSize && row >= 0 && row < r.gridSize) {
        return { col, row };
      }
    }
    return null;
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InputHandler };
}
