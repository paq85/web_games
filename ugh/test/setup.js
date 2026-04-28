// Jest setup for game tests
// Mock browser APIs that the game depends on

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.currentTime = 0;
  }

  createGain() {
    return { gain: { value: 0 }, connect: jest.fn() };
  }

  createOscillator() {
    return {
      type: 'square',
      frequency: { value: 440 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }

  createBuffer(numberOfChannels, length, sampleRate) {
    return {
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'bandpass',
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: jest.fn(),
    };
  }

  resume() {}
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
});
Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: MockAudioContext,
});

// Mock performance
Object.defineProperty(window, 'performance', {
  writable: true,
  value: { now: () => Date.now() },
});

// Mock requestAnimationFrame/cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: { maxTouchPoints: 0 },
});
