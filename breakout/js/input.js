/**
 * Input handler - keyboard, mouse, touch
 */

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouseX = null;
    this.touchX = null;
    this.clicked = false;
    this.tapped = false;
    this.pausePressed = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this.canvas.addEventListener('contextmenu', this._onContextMenu);
  }

  unbindEvents() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
  }

  _onKeyDown(e) {
    this.keys[e.code] = true;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      this.pausePressed = true;
    }
    // Prevent default for game keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Escape', 'KeyP'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
  }

  _onMouseDown(e) {
    this.clicked = true;
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
  }

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      this.touchX = ((e.touches[0].clientX - rect.left) / rect.width) * this.canvas.width;
      this.tapped = true;
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      this.touchX = ((e.touches[0].clientX - rect.left) / rect.width) * this.canvas.width;
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    this.touchX = null;
  }

  _onContextMenu(e) {
    e.preventDefault();
  }

  isLeft() {
    return this.keys['ArrowLeft'] || this.keys['KeyA'];
  }

  isRight() {
    return this.keys['ArrowRight'] || this.keys['KeyD'];
  }

  isAction() {
    return this.keys['Space'] || this.keys['Enter'];
  }

  isPause() {
    if (this.keys['Escape'] || this.keys['KeyP']) {
      this.pausePressed = true;
      return true;
    }
    return this.pausePressed;
  }

  consumePause() {
    if (this.pausePressed) {
      this.pausePressed = false;
      return true;
    }
    return false;
  }

  isMute() {
    return this.keys['KeyM'];
  }

  getHorizontalInput() {
    if (this.mouseX !== null) return this.mouseX;
    if (this.touchX !== null) return this.touchX;
    return null;
  }

  consumeClick() {
    if (this.clicked) {
      this.clicked = false;
      return true;
    }
    return false;
  }

  consumeTap() {
    if (this.tapped) {
      this.tapped = false;
      return true;
    }
    return false;
  }

  clear() {
    this.keys = {};
    this.mouseX = null;
    this.touchX = null;
    this.clicked = false;
    this.tapped = false;
    this.pausePressed = false;
  }
}
