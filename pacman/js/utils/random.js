export class SeededRandom {
  constructor(seed = 0x12345678) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  pick(items) {
    if (!items.length) {
      return undefined;
    }
    return items[Math.floor(this.next() * items.length)];
  }
}
