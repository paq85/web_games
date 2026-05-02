// === Input Handler ===
import { DIR } from './constants.js';

export class Input {
  constructor() {
    this.currentDir = DIR.NONE;
    this.keys = {};
    this.pauseQueue = 0;
    this.muteQueue = 0;
    this.confirmQueue = 0;
    this.escapeQueue = 0;
    this.swipeDir = DIR.NONE;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.enabled = true;
    this.menuUpQueue = 0;
    this.menuDownQueue = 0;
    this.menuLeftQueue = 0;
    this.menuRightQueue = 0;

    // Custom key bindings
    this.bindings = {
      up: ['ArrowUp', 'KeyW'],
      down: ['ArrowDown', 'KeyS'],
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      confirm: ['Enter', 'Space'],
      pause: ['Escape'],
      mute: ['KeyM'],
    };

    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
    this._boundTouchStart = this._onTouchStart.bind(this);
    this._boundTouchEnd = this._onTouchEnd.bind(this);
    this._boundTouchBtn = this._onTouchBtn.bind(this);
  }

  init(canvas) {
    this.canvas = canvas;
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
    canvas.addEventListener('touchstart', this._boundTouchStart, { passive: false });
    canvas.addEventListener('touchend', this._boundTouchEnd, { passive: false });

    // Touch button listeners
    const btns = document.querySelectorAll('.touch-btn');
    btns.forEach(btn => {
      btn.addEventListener('touchstart', this._boundTouchBtn, { passive: false });
      btn.addEventListener('mousedown', this._boundTouchBtn);
    });
  }

  destroy() {
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this._boundTouchStart);
      this.canvas.removeEventListener('touchend', this._boundTouchEnd);
    }
  }

  _onKeyDown(e) {
    if (!this.enabled) return;

    const code = e.code;
    this.keys[code] = true;

    // Prevent default for game keys
    if (this._isGameKey(code)) {
      e.preventDefault();
    }

    // Direction
    if (this.bindings.up.includes(code)) {
      this.currentDir = DIR.UP;
      this.menuUpQueue++;
    } else if (this.bindings.down.includes(code)) {
      this.currentDir = DIR.DOWN;
      this.menuDownQueue++;
    } else if (this.bindings.left.includes(code)) {
      this.currentDir = DIR.LEFT;
      this.menuLeftQueue++;
    } else if (this.bindings.right.includes(code)) {
      this.currentDir = DIR.RIGHT;
      this.menuRightQueue++;
    }

    // Actions
    if (this.bindings.confirm.includes(code)) {
      this.confirmQueue++;
    }
    if (this.bindings.pause.includes(code)) {
      this.pauseQueue++;
    }
    if (this.bindings.mute.includes(code)) {
      this.muteQueue++;
    }
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  _onTouchStart(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  _onTouchEnd(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) {
      // Tap = confirm in menus
      this.confirmQueue++;
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      this.currentDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
    } else {
      this.currentDir = dy > 0 ? DIR.DOWN : DIR.UP;
    }
  }

  _onTouchBtn(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const dir = btn.dataset.dir;
    const action = btn.dataset.action;

    if (dir === 'up') this.currentDir = DIR.UP;
    else if (dir === 'down') this.currentDir = DIR.DOWN;
    else if (dir === 'left') this.currentDir = DIR.LEFT;
    else if (dir === 'right') this.currentDir = DIR.RIGHT;
    else if (action === 'pause') this.pauseQueue++;
  }

  _isGameKey(code) {
    const allKeys = [
      ...this.bindings.up,
      ...this.bindings.down,
      ...this.bindings.left,
      ...this.bindings.right,
      ...this.bindings.confirm,
      ...this.bindings.pause,
      ...this.bindings.mute,
    ];
    return allKeys.includes(code);
  }

  getDirection() {
    return this.currentDir;
  }

  consumeDirection() {
    const dir = this.currentDir;
    return dir;
  }

  consumePause() {
    if (this.pauseQueue > 0) { this.pauseQueue--; return true; }
    return false;
  }

  consumeMute() {
    if (this.muteQueue > 0) { this.muteQueue--; return true; }
    return false;
  }

  consumeConfirm() {
    if (this.confirmQueue > 0) { this.confirmQueue--; return true; }
    return false;
  }

  consumeEscape() {
    if (this.escapeQueue > 0) { this.escapeQueue--; return true; }
    return false;
  }

  consumeMenuUp() {
    if (this.menuUpQueue > 0) { this.menuUpQueue--; return true; }
    return false;
  }

  consumeMenuDown() {
    if (this.menuDownQueue > 0) { this.menuDownQueue--; return true; }
    return false;
  }

  consumeMenuLeft() {
    if (this.menuLeftQueue > 0) { this.menuLeftQueue--; return true; }
    return false;
  }

  consumeMenuRight() {
    if (this.menuRightQueue > 0) { this.menuRightQueue--; return true; }
    return false;
  }

  setBindings(newBindings) {
    Object.assign(this.bindings, newBindings);
  }
}
