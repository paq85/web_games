import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLATFORM_TYPES,
  PLATFORM_COLORS,
  POWERUP_TYPES,
  POWERUP_COLORS,
} from './constants.js';
import { player, platforms, collectibles, cameraY, activePowerups, score } from './state.js';
import { getSettings } from './audio.js';

let canvas, ctx;
let paperTextureCanvas = null;

export function initRenderer(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');

  // Set canvas size
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Create paper texture
  createPaperTexture();
}

function createPaperTexture() {
  paperTextureCanvas = document.createElement('canvas');
  paperTextureCanvas.width = CANVAS_WIDTH;
  paperTextureCanvas.height = CANVAS_HEIGHT;
  const pctx = paperTextureCanvas.getContext('2d');

  // Graph paper lines
  pctx.strokeStyle = 'rgba(150, 180, 220, 0.3)';
  pctx.lineWidth = 0.5;

  const spacing = 20;
  for (let x = 0; x <= CANVAS_WIDTH; x += spacing) {
    pctx.beginPath();
    pctx.moveTo(x, 0);
    pctx.lineTo(x, CANVAS_HEIGHT);
    pctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += spacing) {
    pctx.beginPath();
    pctx.moveTo(0, y);
    pctx.lineTo(CANVAS_WIDTH, y);
    pctx.stroke();
  }

  // Red margin line
  pctx.strokeStyle = 'rgba(220, 100, 100, 0.4)';
  pctx.lineWidth = 1.5;
  pctx.beginPath();
  pctx.moveTo(40, 0);
  pctx.lineTo(40, CANVAS_HEIGHT);
  pctx.stroke();
}

function drawSketchRect(x, y, w, h, color, lineWidth) {
  lineWidth = lineWidth || 2;

  // Main stroke
  ctx.strokeStyle = color || '#2c2c2c';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Slightly wobbly rectangle for sketch effect
  const wobble = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + Math.random() * wobble, y + Math.random() * wobble);
  ctx.lineTo(x + w + Math.random() * wobble, y + Math.random() * wobble);
  ctx.lineTo(x + w + Math.random() * wobble, y + h + Math.random() * wobble);
  ctx.lineTo(x + Math.random() * wobble, y + h + Math.random() * wobble);
  ctx.closePath();
  ctx.stroke();

  // Fill
  if (color && color !== '#2c2c2c') {
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawSketchFilledRect(x, y, w, h, fillColor, strokeColor) {
  strokeColor = strokeColor || '#2c2c2c';

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const wobble = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + Math.random() * wobble, y + Math.random() * wobble);
  ctx.lineTo(x + w + Math.random() * wobble, y + Math.random() * wobble);
  ctx.lineTo(x + w + Math.random() * wobble, y + h + Math.random() * wobble);
  ctx.lineTo(x + Math.random() * wobble, y + h + Math.random() * wobble);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBackground() {
  // Background color
  ctx.fillStyle = '#f5f0e1';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const settings = getSettings();
  if (settings.paperTexture) {
    ctx.globalAlpha = 0.6;
    ctx.drawImage(paperTextureCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  const w = player.width;
  const h = player.height;

  ctx.save();

  // Body (oval)
  ctx.fillStyle = '#6db37e';
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes
  const eyeX = x + w / 2 + (player.facing * 6);
  const eyeY = y + h / 2 - 5;

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(eyeX - 5, eyeY, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(eyeX + 5, eyeY, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils
  ctx.fillStyle = '#2c2c2c';
  ctx.beginPath();
  ctx.arc(eyeX - 5 + player.facing * 2, eyeY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eyeX + 5 + player.facing * 2, eyeY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth (smile)
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY + 10, 5, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  if (player.onGround) {
    // Standing legs
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 8, y + h - 2);
    ctx.lineTo(x + w / 2 - 10, y + h + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 8, y + h - 2);
    ctx.lineTo(x + w / 2 + 10, y + h + 5);
    ctx.stroke();
  } else if (player.vy < 0) {
    // Jumping legs (tucked)
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 8, y + h - 2);
    ctx.lineTo(x + w / 2 - 12, y + h + 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 8, y + h - 2);
    ctx.lineTo(x + w / 2 + 4, y + h + 2);
    ctx.stroke();
  } else {
    // Falling legs (spread)
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 8, y + h - 2);
    ctx.lineTo(x + w / 2 - 14, y + h + 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 8, y + h - 2);
    ctx.lineTo(x + w / 2 + 14, y + h + 6);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlatform(platform) {
  if (platform.visible === false) return;
  if (platform.broken && platform.breakTimer !== undefined && platform.breakTimer <= 0) return;

  const x = platform.x;
  const y = platform.y;
  const w = platform.width;
  const h = platform.height;

  ctx.save();

  if (platform.broken) {
    ctx.globalAlpha = platform.breakTimer / 200;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((200 - platform.breakTimer) * 0.01);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  const color = PLATFORM_COLORS[platform.type] || PLATFORM_COLORS.normal;

  if (platform.type === PLATFORM_TYPES.MONSTER) {
    drawMonster(platform);
  } else if (platform.type === PLATFORM_TYPES.VINE) {
    drawVine(platform);
  } else {
    // Normal, moving, breakable, spring platforms
    drawSketchFilledRect(x, y, w, h, color, '#2c2c2c');

    // Spring indicator
    if (platform.type === PLATFORM_TYPES.SPRING && platform.springX !== undefined) {
      const sx = platform.springX;
      const sy = y - 10;
      const sw = platform.springWidth;
      const sh = platform.springHeight;

      ctx.fillStyle = '#e74c3c';
      ctx.strokeStyle = '#2c2c2c';
      ctx.lineWidth = 2;

      // Spring coil
      ctx.beginPath();
      ctx.moveTo(sx + sw / 2, sy + sh);
      ctx.lineTo(sx + sw / 2, sy + sh / 2);
      ctx.stroke();

      // Spring top
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(sx, sy, sw, 4);
      ctx.strokeRect(sx, sy, sw, 4);
    }
  }

  ctx.restore();
}

function drawMonster(platform) {
  const x = platform.x;
  const y = platform.y;
  const w = platform.width;
  const h = platform.height + 10;

  // Monster body
  ctx.fillStyle = '#c0392b';
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Angry eyes
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x + w / 2 - 8, y + h / 2 - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + w / 2 + 8, y + h / 2 - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Angry eyebrows
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 12, y + h / 2 - 9);
  ctx.lineTo(x + w / 2 - 4, y + h / 2 - 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 12, y + h / 2 - 9);
  ctx.lineTo(x + w / 2 + 4, y + h / 2 - 6);
  ctx.stroke();

  // Sharp teeth
  ctx.fillStyle = 'white';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + i * 5 - 2, y + h / 2 + 5);
    ctx.lineTo(x + w / 2 + i * 5 + 2, y + h / 2 + 5);
    ctx.lineTo(x + w / 2 + i * 5, y + h / 2 + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawVine(platform) {
  const x = platform.x + platform.width / 2;
  const y = platform.y;

  ctx.strokeStyle = '#4a7c59';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Draw vine going down
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 60);
  ctx.stroke();

  // Leaves
  ctx.fillStyle = '#6db37e';
  ctx.beginPath();
  ctx.ellipse(x - 8, y + 20, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x + 8, y + 35, 6, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawCollectible(item) {
  if (item.collected || !item.visible) return;

  const x = item.x;
  const y = item.y;
  const w = item.width;
  const h = item.height;

  ctx.save();

  switch (item.type) {
    case POWERUP_TYPES.COIN:
      drawCoin(x, y, w, h);
      break;
    case POWERUP_TYPES.JETPACK:
      drawJetpack(x, y, w, h);
      break;
    case POWERUP_TYPES.UFO:
      drawUFO(x, y, w, h);
      break;
    case POWERUP_TYPES.PAPER:
      drawPaper(x, y, w, h);
      break;
  }

  ctx.restore();
}

function drawCoin(x, y, w, h) {
  ctx.fillStyle = '#f1c40f';
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // $ symbol
  ctx.fillStyle = '#2c2c2c';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', x + w / 2, y + h / 2 + 1);
}

function drawJetpack(x, y, w, h) {
  ctx.fillStyle = '#e74c3c';
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 1.5;

  // Main body
  ctx.fillRect(x + 4, y + 2, w - 8, h - 4);
  ctx.strokeRect(x + 4, y + 2, w - 8, h - 4);

  // Strap
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x + 2, y + 4, 4, h - 8);
  ctx.strokeRect(x + 2, y + 4, 4, h - 8);

  ctx.fillRect(x + w - 6, y + 4, 4, h - 8);
  ctx.strokeRect(x + w - 6, y + 4, 4, h - 8);

  // Label
  ctx.fillStyle = 'white';
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('J', x + w / 2, y + h / 2 + 2);
}

function drawUFO(x, y, w, h) {
  ctx.fillStyle = '#9b59b6';
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 1.5;

  // Dome
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 - 2, w / 3, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Saucer base
  ctx.fillStyle = '#8e44ad';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + 2, w / 2, h / 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lights
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(x + w / 3, y + h / 2 + 3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 + 4, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + w * 2 / 3, y + h / 2 + 3, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaper(x, y, w, h) {
  ctx.fillStyle = '#ecf0f1';
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 1.5;

  // Paper rectangle
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

  // Lines on paper
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 6 + i * 5);
    ctx.lineTo(x + w - 5, y + 6 + i * 5);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = '#2c2c2c';
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('P', x + w / 2, y + h / 2 + 3);
}

function drawPowerupIndicators() {
  const container = document.getElementById('powerup-indicators');
  if (!container) return;

  container.innerHTML = '';

  for (const type in activePowerups) {
    const pu = activePowerups[type];
    const progress = pu.remaining / pu.total;

    const badge = document.createElement('span');
    badge.className = 'powerup-badge';
    badge.style.background = POWERUP_COLORS[type] || '#888';
    badge.textContent = `${type.toUpperCase()} ${Math.ceil(pu.remaining / 1000)}s`;
    badge.title = `${type}: ${Math.ceil(progress * 100)}%`;
    container.appendChild(badge);
  }
}

function drawHUD() {
  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
  }

  drawPowerupIndicators();
}

export function render() {
  if (!ctx) return;

  drawBackground();

  // Draw platforms
  for (const platform of platforms) {
    drawPlatform(platform);
  }

  // Draw collectibles
  for (const item of collectibles) {
    drawCollectible(item);
  }

  // Draw player
  drawPlayer();

  // Draw HUD
  drawHUD();
}

export function resizeCanvas(container) {
  if (!canvas) return;

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const scale = Math.min(
    containerWidth / CANVAS_WIDTH,
    containerHeight / CANVAS_HEIGHT
  );

  canvas.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
}
