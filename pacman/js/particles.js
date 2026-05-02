// === Particle Effects System ===

export class Particles {
  constructor() {
    this.particles = [];
    this.enabled = true;
  }

  emit(x, y, color, count = 8) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 30 + Math.random() * 50;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        decay: 1.5 + Math.random() * 1.0,
        size: 2 + Math.random() * 3,
      });
    }
  }

  emitScore(x, y, points) {
    this.particles.push({
      x, y,
      vx: 0,
      vy: -20,
      color: '#00FFFF',
      life: 1.0,
      decay: 0.8,
      size: 0,
      text: points.toString(),
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      ctx.globalAlpha = alpha;
      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
