import { FIXED_TIMESTEP } from '../constants.js';

export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.accumulator = 0;
    this.lastTime = 0;
    this.rafId = 0;
    this.running = false;
    this.step = this.step.bind(this);
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.step);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  step(now) {
    if (!this.running) {
      return;
    }

    const deltaSeconds = Math.min(0.25, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.accumulator += deltaSeconds;

    while (this.accumulator >= FIXED_TIMESTEP) {
      this.update(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }

    const alpha = this.accumulator / FIXED_TIMESTEP;
    this.render(alpha);
    this.rafId = requestAnimationFrame(this.step);
  }
}
