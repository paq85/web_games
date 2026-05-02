import { ACTION_LABELS, DEFAULT_KEY_BINDINGS, TOUCH_SWIPE_THRESHOLD } from '../constants.js';

const PREVENT_DEFAULT_CODES = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Escape'
]);

export function formatKeyCode(code) {
  if (code.startsWith('Key')) {
    return code.slice(3);
  }
  if (code.startsWith('Digit')) {
    return code.slice(5);
  }
  if (code === 'Space') {
    return 'Space';
  }
  return code.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function formatBindingLabel(codes) {
  return codes.map(formatKeyCode).join(' / ');
}

export class InputManager {
  constructor({ canvas, touchControls, callbacks }) {
    this.canvas = canvas;
    this.touchControls = touchControls;
    this.callbacks = callbacks;
    this.bindings = structuredClone(DEFAULT_KEY_BINDINGS);
    this.bindingCapture = null;
    this.pointerStart = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    this.canvas?.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
    this.canvas?.addEventListener('pointerup', this.handlePointerUp, { passive: true });

    this.touchControls?.querySelectorAll('[data-direction]').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        this.callbacks.onAnyInput?.();
        this.callbacks.onDirection?.(button.dataset.direction);
      });
    });
  }

  setBindings(bindings) {
    this.bindings = { ...DEFAULT_KEY_BINDINGS, ...bindings };
  }

  startBindingCapture(action, onCapture) {
    this.bindingCapture = { action, onCapture };
  }

  stopBindingCapture() {
    this.bindingCapture = null;
  }

  resolveAction(code) {
    return Object.entries(this.bindings).find(([, codes]) => codes.includes(code))?.[0] ?? null;
  }

  handleKeyDown(event) {
    const code = event.code || event.key;

    if (this.bindingCapture) {
      event.preventDefault();
      const { action, onCapture } = this.bindingCapture;
      this.bindingCapture = null;
      onCapture(action, code);
      return;
    }

    if (PREVENT_DEFAULT_CODES.has(code)) {
      event.preventDefault();
    }

    const action = this.resolveAction(code);
    this.callbacks.onAnyInput?.();

    if (!action) {
      return;
    }

    if (event.repeat && action !== 'up' && action !== 'down' && action !== 'left' && action !== 'right') {
      return;
    }

    if (action === 'mute') {
      this.callbacks.onMute?.();
      return;
    }

    if (action === 'pause') {
      this.callbacks.onPause?.();
      return;
    }

    if (action === 'confirm') {
      this.callbacks.onConfirm?.();
      return;
    }

    this.callbacks.onDirection?.(action);
  }

  handlePointerDown(event) {
    this.pointerStart = { x: event.clientX, y: event.clientY };
  }

  handlePointerUp(event) {
    if (!this.pointerStart) {
      return;
    }

    const dx = event.clientX - this.pointerStart.x;
    const dy = event.clientY - this.pointerStart.y;
    this.pointerStart = null;
    this.callbacks.onAnyInput?.();

    if (Math.abs(dx) < TOUCH_SWIPE_THRESHOLD && Math.abs(dy) < TOUCH_SWIPE_THRESHOLD) {
      this.callbacks.onConfirm?.();
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      this.callbacks.onDirection?.(dx > 0 ? 'right' : 'left');
      return;
    }

    this.callbacks.onDirection?.(dy > 0 ? 'down' : 'up');
  }
}

export { ACTION_LABELS };
