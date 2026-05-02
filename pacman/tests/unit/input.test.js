// === Input Unit Tests ===
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Input } from '../../js/input.js';
import { DIR } from '../../js/constants.js';

describe('Input', () => {
  let input;
  let mockCanvas;

  beforeEach(() => {
    mockCanvas = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    document.querySelectorAll = vi.fn(() => []);
    input = new Input();
    input.init(mockCanvas);
  });

  it('starts with no direction', () => {
    expect(input.getDirection()).toBe(DIR.NONE);
  });

  it('responds to arrow up key', () => {
    input._onKeyDown({ code: 'ArrowUp', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.UP);
  });

  it('responds to arrow down key', () => {
    input._onKeyDown({ code: 'ArrowDown', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.DOWN);
  });

  it('responds to arrow left key', () => {
    input._onKeyDown({ code: 'ArrowLeft', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.LEFT);
  });

  it('responds to arrow right key', () => {
    input._onKeyDown({ code: 'ArrowRight', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.RIGHT);
  });

  it('responds to WASD keys', () => {
    input._onKeyDown({ code: 'KeyW', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.UP);

    input._onKeyDown({ code: 'KeyS', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.DOWN);

    input._onKeyDown({ code: 'KeyA', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.LEFT);

    input._onKeyDown({ code: 'KeyD', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.RIGHT);
  });

  it('detects confirm key', () => {
    input._onKeyDown({ code: 'Enter', preventDefault: vi.fn() });
    expect(input.consumeConfirm()).toBe(true);
    expect(input.consumeConfirm()).toBe(false); // consumed
  });

  it('detects pause key', () => {
    input._onKeyDown({ code: 'Escape', preventDefault: vi.fn() });
    expect(input.consumePause()).toBe(true);
    expect(input.consumePause()).toBe(false); // consumed
  });

  it('detects mute key', () => {
    input._onKeyDown({ code: 'KeyM', preventDefault: vi.fn() });
    expect(input.consumeMute()).toBe(true);
    expect(input.consumeMute()).toBe(false); // consumed
  });

  it('menu navigation works', () => {
    input._onKeyDown({ code: 'ArrowUp', preventDefault: vi.fn() });
    expect(input.consumeMenuUp()).toBe(true);
    expect(input.consumeMenuUp()).toBe(false);

    input._onKeyDown({ code: 'ArrowDown', preventDefault: vi.fn() });
    expect(input.consumeMenuDown()).toBe(true);
  });

  it('prevents default for game keys', () => {
    const prevent = vi.fn();
    input._onKeyDown({ code: 'ArrowUp', preventDefault: prevent });
    expect(prevent).toHaveBeenCalled();
  });

  it('does not respond when disabled', () => {
    input.enabled = false;
    input._onKeyDown({ code: 'ArrowUp', preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.NONE);
  });

  it('handles touch swipe right', () => {
    input._onTouchStart({ touches: [{ clientX: 100, clientY: 200 }], preventDefault: vi.fn() });
    input._onTouchEnd({ changedTouches: [{ clientX: 200, clientY: 200 }], preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.RIGHT);
  });

  it('handles touch swipe left', () => {
    input._onTouchStart({ touches: [{ clientX: 200, clientY: 200 }], preventDefault: vi.fn() });
    input._onTouchEnd({ changedTouches: [{ clientX: 100, clientY: 200 }], preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.LEFT);
  });

  it('handles touch swipe down', () => {
    input._onTouchStart({ touches: [{ clientX: 200, clientY: 100 }], preventDefault: vi.fn() });
    input._onTouchEnd({ changedTouches: [{ clientX: 200, clientY: 200 }], preventDefault: vi.fn() });
    expect(input.getDirection()).toBe(DIR.DOWN);
  });

  it('handles touch tap as confirm', () => {
    input._onTouchStart({ touches: [{ clientX: 200, clientY: 200 }], preventDefault: vi.fn() });
    input._onTouchEnd({ changedTouches: [{ clientX: 205, clientY: 205 }], preventDefault: vi.fn() });
    expect(input.consumeConfirm()).toBe(true);
  });
});
