// Particle system
const Particles = {
  particles: [],
  enabled: true,

  init() {
    this.particles = [];
    this.enabled = !Utils.prefersReducedMotion();
  },

  emit(x, y, count, config) {
    if (!this.enabled) return;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * (config.spread || 10),
        y: y + (Math.random() - 0.5) * (config.spread || 10),
        vx: (Math.random() - 0.5) * (config.speed || 3),
        vy: (Math.random() - 0.5) * (config.speed || 3),
        life: config.life || 30,
        maxLife: config.life || 30,
        color: config.color || '#ff6600',
        size: config.size || 3,
      });
    }
  },

  emitExplosion(x, y) {
    this.emit(x, y, 20, {
      spread: 30,
      speed: 5,
      life: 40,
      color: '#ff4400',
      size: 4,
    });
    this.emit(x, y, 10, {
      spread: 20,
      speed: 3,
      life: 25,
      color: '#ffaa00',
      size: 3,
    });
  },

  emitPickup(x, y) {
    this.emit(x, y, 8, {
      spread: 15,
      speed: 2,
      life: 20,
      color: '#44ff44',
      size: 2,
    });
  },

  emitDelivery(x, y) {
    this.emit(x, y, 15, {
      spread: 25,
      speed: 4,
      life: 35,
      color: '#ffcc00',
      size: 3,
    });
  },

  emitDamage(x, y) {
    this.emit(x, y, 10, {
      spread: 20,
      speed: 4,
      life: 20,
      color: '#ff0000',
      size: 3,
    });
  },

  emitExhaust(x, y) {
    this.emit(x, y, 1, {
      spread: 5,
      speed: 1,
      life: 15,
      color: '#888',
      size: 2,
    });
  },

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // slight gravity
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  render(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  },

  clear() {
    this.particles = [];
  },
};
