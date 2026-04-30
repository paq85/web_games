/**
 * Particle effects for brick destruction, glow, etc.
 */

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 3 + 1;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05; // slight gravity
    this.life -= this.decay;
    if (this.life <= 0) {
      this.alive = false;
    }
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.enabled = true;
  }

  emit(x, y, color, count = 8) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  emitBurst(x, y, colors, count = 16) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(x, y, color));
    }
  }

  update() {
    for (const p of this.particles) {
      p.update();
    }
    this.particles = this.particles.filter(p => p.alive);
  }

  render(ctx) {
    if (!this.enabled) return;
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  clear() {
    this.particles = [];
  }
}
