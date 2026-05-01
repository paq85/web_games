// Input handler - keyboard, touch, swipe, and on-screen controls

import { DIRECTIONS } from './frog.js';

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.callbacks = {
      move: null,
      start: null,
      pause: null,
      mute: null,
    };
    this.lastMoveTime = 0;
    this.moveCooldown = 150; // ms between moves
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.lastTapTime = 0;
    this.dpadButtons = {};
    this._boundHandleKey = this.handleKey.bind(this);
    this._boundHandleTouchStart = this.handleTouchStart.bind(this);
    this._boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this._boundHandleDpad = this.handleDpad.bind(this);
  }

  /**
   * Register callback functions.
   */
  setCallbacks(callbacks) {
    Object.assign(this.callbacks, callbacks);
  }

  /**
   * Enable input listeners.
   */
  enable() {
    document.addEventListener('keydown', this._boundHandleKey);
    this.canvas.addEventListener('touchstart', this._boundHandleTouchStart, { passive: false });
    this.canvas.addEventListener('touchend', this._boundHandleTouchEnd, { passive: false });

    // D-pad buttons
    document.querySelectorAll('[data-dpad]').forEach(btn => {
      btn.addEventListener('touchstart', this._boundHandleDpad, { passive: false });
      btn.addEventListener('mousedown', this._boundHandleDpad);
    });
  }

  /**
   * Disable input listeners.
   */
  disable() {
    document.removeEventListener('keydown', this._boundHandleKey);
    this.canvas.removeEventListener('touchstart', this._boundHandleTouchStart);
    this.canvas.removeEventListener('touchend', this._boundHandleTouchEnd);

    document.querySelectorAll('[data-dpad]').forEach(btn => {
      btn.removeEventListener('touchstart', this._boundHandleDpad);
      btn.removeEventListener('mousedown', this._boundHandleDpad);
    });
  }

  /**
   * Handle keyboard input.
   */
  handleKey(e) {
    const now = Date.now();

    // Prevent default for game keys
    const gameKeys = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
      ' ', 'Enter', 'Escape', 'p', 'P', 'm', 'M',
    ]);

    if (gameKeys.has(e.key)) {
      e.preventDefault();
    }

    // Movement
    if (now - this.lastMoveTime < this.moveCooldown) {
      if (e.key === ' ' || e.key === 'Enter') {
        this.callbacks.start?.();
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        this.callbacks.pause?.();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        this.callbacks.mute?.();
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.lastMoveTime = now;
        this.callbacks.move?.(DIRECTIONS.UP);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.lastMoveTime = now;
        this.callbacks.move?.(DIRECTIONS.DOWN);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.lastMoveTime = now;
        this.callbacks.move?.(DIRECTIONS.LEFT);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.lastMoveTime = now;
        this.callbacks.move?.(DIRECTIONS.RIGHT);
        break;
      case ' ':
      case 'Enter':
        this.callbacks.start?.();
        break;
      case 'Escape':
      case 'p':
      case 'P':
        this.callbacks.pause?.();
        break;
      case 'm':
      case 'M':
        this.callbacks.mute?.();
        break;
    }
  }

  /**
   * Handle touch start.
   */
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }

  /**
   * Handle touch end (swipe or tap detection).
   */
  handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const dt = Date.now() - this.touchStartTime;
    const threshold = 20;

    // Tap detection
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      const now = Date.now();

      // Double-tap for pause
      if (now - this.lastTapTime < 300) {
        this.lastTapTime = 0;
        this.callbacks.pause?.();
        return;
      }

      this.lastTapTime = now;
      this.callbacks.start?.();
      return;
    }

    // Swipe detection
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (Math.abs(dx) > threshold) {
        this.callbacks.move?.(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
      }
    } else {
      // Vertical swipe
      if (Math.abs(dy) > threshold) {
        this.callbacks.move?.(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
      }
    }
  }

  /**
   * Handle D-pad button press.
   */
  handleDpad(e) {
    e.preventDefault();
    const action = e.currentTarget.dataset.dpad;
    const now = Date.now();

    if (now - this.lastMoveTime < this.moveCooldown) return;
    this.lastMoveTime = now;

    switch (action) {
      case 'up':
        this.callbacks.move?.(DIRECTIONS.UP);
        break;
      case 'down':
        this.callbacks.move?.(DIRECTIONS.DOWN);
        break;
      case 'left':
        this.callbacks.move?.(DIRECTIONS.LEFT);
        break;
      case 'right':
        this.callbacks.move?.(DIRECTIONS.RIGHT);
        break;
      case 'pause':
        this.callbacks.pause?.();
        break;
    }
  }
}
