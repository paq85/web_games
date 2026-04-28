// Canvas rendering
const Renderer = {
  canvas: null,
  ctx: null,
  scale: 1,
  clouds: [],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    this.initClouds();
  },

  resize() {
    const container = this.canvas.parentElement;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const targetRatio = CONSTANTS.WIDTH / CONSTANTS.HEIGHT;
    const containerRatio = containerW / containerH;

    let drawW, drawH;

    if (containerRatio > targetRatio) {
      drawH = containerH;
      drawW = drawH * targetRatio;
    } else {
      drawW = containerW;
      drawH = drawW / targetRatio;
    }

    this.canvas.width = CONSTANTS.WIDTH;
    this.canvas.height = CONSTANTS.HEIGHT;
    this.canvas.style.width = `${drawW}px`;
    this.canvas.style.height = `${drawH}px`;

    this.scale = drawW / CONSTANTS.WIDTH;
  },

  initClouds() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * CONSTANTS.WIDTH,
        y: Utils.randInt(20, 120),
        width: Utils.randInt(40, 80),
        height: Utils.randInt(15, 25),
        speed: Utils.randFloat(0.2, 0.6),
      });
    }
  },

  // Draw sky gradient
  drawSky(levelId) {
    const colors = Terrain.getSkyColor(levelId);
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CONSTANTS.HEIGHT);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);
  },

  // Draw clouds
  drawClouds(scrollSpeed) {
    this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const cloud of this.clouds) {
      this.ctx.beginPath();
      this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();

      cloud.x -= cloud.speed * scrollSpeed;
      if (cloud.x < -cloud.width) {
        cloud.x = CONSTANTS.WIDTH + cloud.width;
        cloud.y = Utils.randInt(20, 120);
      }
    }
  },

  // Draw terrain
  drawTerrain(terrainPoints, levelId) {
    if (!terrainPoints || terrainPoints.length < 3) return;

    const groundColor = Terrain.getGroundColor(levelId);

    this.ctx.fillStyle = groundColor;
    this.ctx.beginPath();
    this.ctx.moveTo(terrainPoints[0].x, terrainPoints[0].y);
    for (let i = 1; i < terrainPoints.length; i++) {
      this.ctx.lineTo(terrainPoints[i].x, terrainPoints[i].y);
    }
    this.ctx.closePath();
    this.ctx.fill();

    // Terrain outline
    this.ctx.strokeStyle = this.darkenColor(groundColor, 30);
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  },

  // Draw helicopter
  drawHelicopter(heli) {
    if (!heli.alive) return;

    const ctx = this.ctx;
    const x = heli.x;
    const y = heli.y;

    // Blink when invincible
    if (heli.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Body
    ctx.fillStyle = '#666';
    ctx.fillRect(x + 8, y + 10, 30, 14);

    // Cockpit
    ctx.fillStyle = '#88CCFF';
    ctx.fillRect(x + 30, y + 8, 14, 12);

    // Tail
    ctx.fillStyle = '#555';
    ctx.fillRect(x, y + 12, 12, 6);
    ctx.fillRect(x - 4, y + 6, 6, 14);

    // Skids
    ctx.fillStyle = '#444';
    ctx.fillRect(x + 10, y + 24, 26, 3);
    ctx.fillRect(x + 12, y + 20, 3, 5);
    ctx.fillRect(x + 32, y + 20, 3, 5);

    // Rotor
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const rotorY = y + 6;
    const rotorLen = 28 * Math.cos(heli.rotorAngle);
    ctx.moveTo(x + 22 - rotorLen, rotorY);
    ctx.lineTo(x + 22 + rotorLen, rotorY);
    ctx.stroke();

    // Rotor mast
    ctx.fillStyle = '#444';
    ctx.fillRect(x + 20, y + 4, 4, 6);

    // Boost flame
    if (heli.boosting) {
      ctx.fillStyle = '#ff6600';
      const flameH = 8 + Math.random() * 6;
      ctx.fillRect(x + 14, y + 27, 6, flameH);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x + 15, y + 27, 4, flameH - 3);
    }

    // Passenger indicator
    if (heli.carrying) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = '14px monospace';
      ctx.fillText('P', x + 16, y + 22);
    }

    ctx.globalAlpha = 1;
  },

  // Draw passenger
  drawPassenger(p) {
    const ctx = this.ctx;

    // Body
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(p.x + 4, p.y + 8, 12, 14);

    // Head
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(p.x + 6, p.y, 8, 8);

    // SOS sign
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('!', p.x + 6, p.y - 4);

    // Pulsing glow
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(255, 204, 0, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 2, p.y - 6, p.width + 4, p.height + 10);
  },

  // Draw destination
  drawDestination(d) {
    const ctx = this.ctx;

    // Zone marker
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(68, 255, 68, ${pulse * 0.3})`;
    ctx.fillRect(d.x - 4, d.y - 4, d.width + 8, d.height + 8);

    // Landing pad
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(d.x, d.y + 20, d.width, 4);

    // Arrow
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.moveTo(d.x + d.width / 2, d.y);
    ctx.lineTo(d.x + d.width / 2 - 8, d.y + 16);
    ctx.lineTo(d.x + d.width / 2 + 8, d.y + 16);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('DROP', d.x + 2, d.y - 4);
  },

  // Draw hazard
  drawHazard(h) {
    const ctx = this.ctx;

    switch (h.type) {
      case 'tree':
        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(h.x + h.width / 2 - 3, h.y + 10, 6, h.height - 10);
        // Leaves
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(h.x + h.width / 2, h.y + 10, 14, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rock':
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.ellipse(h.x + h.width / 2, h.y + h.height / 2, h.width / 2, h.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath();
        ctx.ellipse(h.x + h.width / 2 - 3, h.y + h.height / 2 - 3, h.width / 4, h.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'bird':
        ctx.fillStyle = '#D32F2F';
        // Wings
        const wingAngle = Math.sin(Date.now() / 100) * 0.4;
        ctx.save();
        ctx.translate(h.x + h.width / 2, h.y + h.height / 2);
        ctx.rotate(wingAngle);
        ctx.fillRect(-10, -2, 20, 4);
        ctx.restore();
        // Body
        ctx.fillRect(h.x + 6, h.y + 4, 8, 8);
        // Beak
        ctx.fillStyle = '#FF8F00';
        ctx.fillRect(h.x + 14, h.y + 5, 4, 3);
        break;

      case 'dinosaur':
        ctx.fillStyle = '#4CAF50';
        // Body
        ctx.fillRect(h.x + 8, h.y + 8, 24, 16);
        // Head
        ctx.fillRect(h.x + 28, h.y, 12, 12);
        // Legs
        ctx.fillRect(h.x + 10, h.y + 24, 4, 12);
        ctx.fillRect(h.x + 22, h.y + 24, 4, 12);
        // Tail
        ctx.fillRect(h.x, h.y + 10, 10, 6);
        // Eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(h.x + 34, h.y + 3, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(h.x + 35, h.y + 4, 2, 2);
        break;

      case 'volcano':
        ctx.fillStyle = '#FF5722';
        const vSize = 6 + Math.sin(Date.now() / 100) * 2;
        ctx.beginPath();
        ctx.arc(h.x + h.width / 2, h.y + h.height / 2, vSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(h.x + h.width / 2, h.y + h.height / 2, vSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'lightning':
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(h.x + 4, h.y);
        ctx.lineTo(h.x + 10, h.y + 15);
        ctx.lineTo(h.x + 6, h.y + 20);
        ctx.lineTo(h.x + 14, h.y + 35);
        ctx.stroke();
        // Glow
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.3)';
        ctx.lineWidth = 8;
        ctx.stroke();
        break;
    }
  },

  // Draw collectible
  drawCollectible(c) {
    const ctx = this.ctx;
    const pulse = Math.sin(Date.now() / 250) * 0.2 + 0.8;

    if (c.type === 'fuel_can') {
      ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
      ctx.fillRect(c.x, c.y, c.width, c.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('F', c.x + 3, c.y + 14);
    } else {
      ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.beginPath();
      ctx.arc(c.x + c.width / 2, c.y + c.height / 2, c.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#B8860B';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('$', c.x + 3, c.y + 13);
    }
  },

  // Draw score popup
  drawScorePopup(x, y, text) {
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.fillText(text, x, y);
  },

  // Darken a hex color
  darkenColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return `rgb(${r},${g},${b})`;
  },

  // Clear canvas
  clear() {
    this.ctx.clearRect(0, 0, CONSTANTS.WIDTH, CONSTANTS.HEIGHT);
  },
};
