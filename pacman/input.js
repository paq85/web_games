/**
 * Pacman Input Handler Module
 *
 * Keyboard + touch input with direction buffering, control rebinding,
 * swipe/tap detection, and virtual D-pad overlay. Vanilla JS — no dependencies.
 */

// ── Direction constants ────────────────────────────────────────────────────────

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

// Opposite direction lookup
const OPPOSITE = {
  [DIRECTIONS.UP]: DIRECTIONS.DOWN,
  [DIRECTIONS.DOWN]: DIRECTIONS.UP,
  [DIRECTIONS.LEFT]: DIRECTIONS.RIGHT,
  [DIRECTIONS.RIGHT]: DIRECTIONS.LEFT,
};

// ── Default key bindings (JS key codes) ────────────────────────────────────────

const DEFAULT_BINDINGS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'Space'],
  pause: ['Escape'],
  mute: ['KeyM'],
};

// Keys that should never fire default browser behaviour during gameplay
const PREVENT_DEFAULT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'Enter', 'Escape',
]);

// ── Touch / swipe thresholds ──────────────────────────────────────────────────

const SWIPE_THRESHOLD = 30;    // px movement to count as a swipe
const TAP_THRESHOLD = 10;      // max px movement for a tap
const TAP_TIMEOUT = 300;       // ms max between touchstart & touchend for a tap

// ── D-pad rendering constants ──────────────────────────────────────────────────

const DPAD_SIZE_RATIO = 0.28;  // D-pad area as fraction of canvas height
const DPAD_BTN_GAP = 0.04;     // gap between buttons (fraction of D-pad size)
const DPAD_COLOR = 'rgba(255, 255, 255, 0.15)';
const DPAD_COLOR_ACTIVE = 'rgba(255, 255, 255, 0.35)';

// ── InputHandler ───────────────────────────────────────────────────────────────

export class InputHandler {
  /**
   * @param {HTMLCanvasElement} canvas - canvas to attach event listeners on
   */
  constructor(canvas) {
    this._canvas = canvas;

    // ── State ────────────────────────────────────────────────────────────────
    this._bindings = this._cloneBindings(DEFAULT_BINDINGS);
    this._keysDown = new Set();

    // Current + queued direction (buffering)
    this._currentDirection = null;
    this._queuedDirection = null;

    // ── Callbacks ────────────────────────────────────────────────────────────
    this._onDirection = null;
    this._onConfirm = null;
    this._onPause = null;
    this._onMute = null;
    this._onMenuNavigate = null;

    // ── Touch state ──────────────────────────────────────────────────────────
    this._touchEnabled = false;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchStartTime = 0;
    this._touchActive = false;
    this._isTouchDeviceDetected = false;

    // D-pad active button tracking
    this._dpadActive = null;

    // ── Bind methods ─────────────────────────────────────────────────────────
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    // ── Attach listeners ─────────────────────────────────────────────────────
    this._canvas.addEventListener('keydown', this._onKeyDown);
    this._canvas.addEventListener('keyup', this._onKeyUp);
    this._canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this._canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this._canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });

    // Detect touch capability globally
    this._detectTouchDevice();
  }

  // ── Callback setters ───────────────────────────────────────────────────────

  /**
   * @param {(dir: string) => void} cb
   */
  onDirectionCallback(cb) {
    this._onDirection = cb;
  }

  /**
   * @param {() => void} cb
   */
  onConfirmCallback(cb) {
    this._onConfirm = cb;
  }

  /**
   * @param {() => void} cb
   */
  onPauseCallback(cb) {
    this._onPause = cb;
  }

  /**
   * @param {() => void} cb
   */
  onMuteCallback(cb) {
    this._onMute = cb;
  }

  /**
   * @param {(action: 'up' | 'down' | 'select') => void} cb
   */
  onMenuNavigateCallback(cb) {
    this._onMenuNavigate = cb;
  }

  // ── Direction queries ──────────────────────────────────────────────────────

  /**
   * Returns the last direction pressed (or null).
   */
  getCurrentDirection() {
    return this._currentDirection;
  }

  /**
   * Returns the next queued direction, consuming it (or null).
   * The game should call this when Pacman reaches a cell centre.
   */
  getQueuedDirection() {
    const queued = this._queuedDirection;
    this._queuedDirection = null;
    return queued;
  }

  // ── Control bindings ───────────────────────────────────────────────────────

  /**
   * Set custom keyboard bindings.
   * @param {object} bindings - same shape as DEFAULT_BINDINGS
   */
  setControlBindings(bindings) {
    this._bindings = this._cloneBindings(bindings);
  }

  /**
   * Returns a copy of current bindings.
   */
  getControlBindings() {
    return this._cloneBindings(this._bindings);
  }

  // ── Touch controls ─────────────────────────────────────────────────────────

  /** Show virtual D-pad overlay. */
  enableTouchControls() {
    this._touchEnabled = true;
  }

  /** Hide virtual D-pad overlay. */
  disableTouchControls() {
    this._touchEnabled = false;
    this._dpadActive = null;
  }

  /**
   * Returns whether a touch device has been detected.
   */
  isTouchDevice() {
    return this._isTouchDeviceDetected;
  }

  /**
   * Render the virtual D-pad onto the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width - canvas width
   * @param {number} height - canvas height
   */
  renderTouchControls(ctx, width, height) {
    if (!this._touchEnabled) return;

    const padSize = Math.min(width, height) * DPAD_SIZE_RATIO;
    const gap = padSize * DPAD_BTN_GAP;
    const btnSize = (padSize - gap) / 2;

    // Position at bottom-centre
    const baseX = (width - padSize) / 2;
    const baseY = height - padSize - 10;

    // Button centres
    const centres = {
      [DIRECTIONS.UP]:    { x: baseX + padSize / 2,         y: baseY + btnSize / 2 },
      [DIRECTIONS.LEFT]:  { x: baseX + btnSize / 2,         y: baseY + padSize / 2 },
      [DIRECTIONS.DOWN]:  { x: baseX + padSize / 2,         y: baseY + btnSize + gap + btnSize / 2 },
      [DIRECTIONS.RIGHT]: { x: baseX + btnSize + gap + btnSize / 2, y: baseY + padSize / 2 },
    };

    for (const dir of Object.values(DIRECTIONS)) {
      const c = centres[dir];
      const isActive = this._dpadActive === dir;
      ctx.fillStyle = isActive ? DPAD_COLOR_ACTIVE : DPAD_COLOR;
      ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;

      const r = btnSize * 0.1; // corner radius
      this._roundRect(ctx, c.x - btnSize / 2, c.y - btnSize / 2, btnSize, btnSize, r);
      ctx.fill();
      ctx.stroke();

      // Arrow indicator
      ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.6)';
      ctx.font = `${btnSize * 0.45}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const arrows = { up: '▲', down: '▼', left: '◀', right: '▶' };
      ctx.fillText(arrows[dir], c.x, c.y);
    }

    // Pause button (top-right corner)
    const pauseSize = btnSize * 0.7;
    const pauseX = width - pauseSize - 10;
    const pauseY = 10;
    ctx.fillStyle = DPAD_COLOR;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, pauseX, pauseY, pauseSize, pauseSize, pauseSize * 0.15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `${pauseSize * 0.35}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏸', pauseX + pauseSize / 2, pauseY + pauseSize / 2);

    // Store layout for hit-testing
    this._dpadLayout = { centres, pauseX, pauseY, pauseSize };
  }

  /**
   * Process a swipe gesture direction.
   * @param {string} direction - one of DIRECTIONS values
   */
  handleSwipe(direction) {
    if (direction === this._currentDirection) return;

    if (this._currentDirection === null) {
      this._currentDirection = direction;
    } else {
      // Queue the new direction
      this._queuedDirection = direction;
    }

    if (this._onDirection) {
      this._onDirection(direction);
    }
  }

  /**
   * Process a tap event (for menu confirmation).
   * @param {number} x - canvas-relative x
   * @param {number} y - canvas-relative y
   */
  handleTap(x, y) {
    // Check pause button hit first
    if (this._dpadLayout) {
      const { pauseX, pauseY, pauseSize } = this._dpadLayout;
      if (x >= pauseX && x <= pauseX + pauseSize && y >= pauseY && y <= pauseY + pauseSize) {
        if (this._onPause) this._onPause();
        return;
      }

      // Check D-pad button hits
      const { centres } = this._dpadLayout;
      const padSize = Math.min(this._canvas.width, this._canvas.height) * DPAD_SIZE_RATIO;
      const gap = padSize * DPAD_BTN_GAP;
      const btnSize = (padSize - gap) / 2;
      const half = btnSize / 2;

      for (const [dir, c] of Object.entries(centres)) {
        if (x >= c.x - half && x <= c.x + half && y >= c.y - half && y <= c.y + half) {
          this.handleSwipe(dir);
          return;
        }
      }
    }

    // Tap anywhere else → confirm / select
    if (this._onConfirm) {
      this._onConfirm();
    }
    if (this._onMenuNavigate) {
      this._onMenuNavigate('select');
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  /** Remove all event listeners and free references. */
  destroy() {
    this._canvas.removeEventListener('keydown', this._onKeyDown);
    this._canvas.removeEventListener('keyup', this._onKeyUp);
    this._canvas.removeEventListener('touchstart', this._onTouchStart);
    this._canvas.removeEventListener('touchmove', this._onTouchMove);
    this._canvas.removeEventListener('touchend', this._onTouchEnd);

    this._onDirection = null;
    this._onConfirm = null;
    this._onPause = null;
    this._onMute = null;
    this._onMenuNavigate = null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Resolve a physical key code to a game action string.
   */
  _resolveAction(code) {
    for (const [action, keys] of Object.entries(this._bindings)) {
      if (keys.includes(code)) return action;
    }
    return null;
  }

  /**
   * Key-down handler.
   */
  _onKeyDown(e) {
    // Prevent browser defaults for game keys
    if (PREVENT_DEFAULT_KEYS.has(e.code)) {
      e.preventDefault();
    }

    const action = this._resolveAction(e.code);
    if (!action) return;

    // Avoid repeat events
    if (this._keysDown.has(e.code)) return;
    this._keysDown.add(e.code);

    switch (action) {
      case 'up':
      case 'down':
      case 'left':
      case 'right': {
        const dir = action; // maps directly to DIRECTIONS values
        if (this._currentDirection === null) {
          this._currentDirection = dir;
        } else {
          this._queuedDirection = dir;
        }
        if (this._onDirection) this._onDirection(dir);
        // Also handle menu navigation via directional keys
        if (this._onMenuNavigate) {
          if (dir === DIRECTIONS.UP) this._onMenuNavigate('up');
          else if (dir === DIRECTIONS.DOWN) this._onMenuNavigate('down');
        }
        break;
      }
      case 'confirm':
        if (this._onConfirm) this._onConfirm();
        if (this._onMenuNavigate) this._onMenuNavigate('select');
        break;
      case 'pause':
        if (this._onPause) this._onPause();
        break;
      case 'mute':
        if (this._onMute) this._onMute();
        break;
    }
  }

  /**
   * Key-up handler — clear the key so it can fire again.
   */
  _onKeyUp(e) {
    this._keysDown.delete(e.code);
  }

  // ── Touch handlers ─────────────────────────────────────────────────────────

  _onTouchStart(e) {
    e.preventDefault();
    this._isTouchDeviceDetected = true;

    const touch = e.changedTouches[0];
    const rect = this._canvas.getBoundingClientRect();
    this._touchStartX = touch.clientX - rect.left;
    this._touchStartY = touch.clientY - rect.top;
    this._touchStartTime = Date.now();
    this._touchActive = true;

    // If D-pad is enabled, check immediate button press
    if (this._touchEnabled && this._dpadLayout) {
      const { centres, pauseX, pauseY, pauseSize } = this._dpadLayout;
      const padSize = Math.min(this._canvas.width, this._canvas.height) * DPAD_SIZE_RATIO;
      const gap = padSize * DPAD_BTN_GAP;
      const btnSize = (padSize - gap) / 2;
      const half = btnSize / 2;
      const tx = this._touchStartX;
      const ty = this._touchStartY;

      // Pause button
      if (tx >= pauseX && tx <= pauseX + pauseSize && ty >= pauseY && ty <= pauseY + pauseSize) {
        if (this._onPause) this._onPause();
        return;
      }

      // D-pad buttons
      for (const [dir, c] of Object.entries(centres)) {
        if (tx >= c.x - half && tx <= c.x + half && ty >= c.y - half && ty <= c.y + half) {
          this._dpadActive = dir;
          this.handleSwipe(dir);
          return;
        }
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (!this._touchActive) return;

    const touch = e.changedTouches[0];
    const rect = this._canvas.getBoundingClientRect();
    const cx = touch.clientX - rect.left;
    const cy = touch.clientY - rect.top;

    const dx = cx - this._touchStartX;
    const dy = cy - this._touchStartY;

    // If movement is large enough, determine swipe direction
    if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.handleSwipe(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
      } else {
        this.handleSwipe(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
      }
      // Reset start so repeated swipes work
      this._touchStartX = cx;
      this._touchStartY = cy;
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const rect = this._canvas.getBoundingClientRect();
    const ex = touch.clientX - rect.left;
    const ey = touch.clientY - rect.top;

    const dx = ex - this._touchStartX;
    const dy = ey - this._touchStartY;
    const elapsed = Date.now() - this._touchStartTime;

    this._touchActive = false;
    this._dpadActive = null;

    // Tap detection: little movement + short duration
    if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD && elapsed < TAP_TIMEOUT) {
      this.handleTap(ex, ey);
    }
  }

  /**
   * Detect touch capability via a one-time touch event or maxTouchPoints.
   */
  _detectTouchDevice() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this._isTouchDeviceDetected = true;
    } else {
      // Fallback: listen for first touch event
      const handler = () => {
        this._isTouchDeviceDetected = true;
        window.removeEventListener('touchstart', handler);
      };
      window.addEventListener('touchstart', handler, { once: true });
    }
  }

  /** Deep-clone a bindings object. */
  _cloneBindings(src) {
    const out = {};
    for (const [k, v] of Object.entries(src)) {
      out[k] = [...v];
    }
    return out;
  }

  /** Draw a rounded rectangle path (does not fill/stroke). */
  _roundRect(ctx, x, y, w, h, r) {
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
}
