import { GHOST_STATES, RUN_MODES, TILE } from '../constants.js';
import { lerpPosition } from '../utils/grid.js';

const THEMES = {
  classic: {
    background: '#050510',
    wall: '#2d5cff',
    wallGlow: 'rgba(69, 94, 255, 0.24)',
    pellet: '#f8f2d8',
    power: '#ffe84a',
    pacman: '#ffe84a',
    fruitLeaf: '#64ff9b',
    text: '#f7f7ff'
  },
  neon: {
    background: '#090314',
    wall: '#9c58ff',
    wallGlow: 'rgba(156, 88, 255, 0.3)',
    pellet: '#f7fbff',
    power: '#47e0ff',
    pacman: '#ff5ffd',
    fruitLeaf: '#47e0ff',
    text: '#f8efff'
  },
  amber: {
    background: '#120c04',
    wall: '#ff9a1a',
    wallGlow: 'rgba(255, 154, 26, 0.25)',
    pellet: '#ffe2a8',
    power: '#ffd36f',
    pacman: '#ffd36f',
    fruitLeaf: '#fff1cc',
    text: '#fff4d9'
  }
};

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }

  render(snapshot, settings, alpha = 1) {
    const theme = THEMES[settings.theme] ?? THEMES.classic;
    const context = this.context;
    const { maze } = snapshot;
    const tileSize = Math.min(this.canvas.width / maze.width, this.canvas.height / maze.height);
    const boardWidth = tileSize * maze.width;
    const boardHeight = tileSize * maze.height;
    const offsetX = (this.canvas.width - boardWidth) / 2;
    const offsetY = (this.canvas.height - boardHeight) / 2;
    const reducedFlash = settings.effects.reducedFlash || settings.effects.reducedMotion;
    const blinkVisible = reducedFlash ? true : Math.floor(performance.now() / 180) % 2 === 0;

    context.save();
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = theme.background;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawMaze(context, snapshot, theme, tileSize, offsetX, offsetY, blinkVisible);
    this.drawFruit(context, snapshot.fruit, theme, tileSize, offsetX, offsetY);
    this.drawPacman(context, snapshot.pacman, theme, tileSize, offsetX, offsetY, alpha);
    snapshot.ghosts.forEach((ghost) => this.drawGhost(context, ghost, theme, tileSize, offsetX, offsetY, alpha));
    this.drawCornerLabels(context, snapshot, theme, tileSize, offsetX, offsetY);
    this.drawRunModeBadge(context, snapshot, theme);

    context.restore();
  }

  drawMaze(context, snapshot, theme, tileSize, offsetX, offsetY, blinkVisible) {
    context.save();
    context.fillStyle = theme.wallGlow;
    context.strokeStyle = theme.wall;
    context.lineWidth = Math.max(2, tileSize * 0.12);
    context.lineJoin = 'round';

    for (let y = 0; y < snapshot.maze.height; y += 1) {
      for (let x = 0; x < snapshot.maze.width; x += 1) {
        const tile = snapshot.grid[y][x];
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;

        if (tile === TILE.WALL) {
          context.fillStyle = theme.wallGlow;
          context.fillRect(px + tileSize * 0.08, py + tileSize * 0.08, tileSize * 0.84, tileSize * 0.84);
          context.strokeStyle = theme.wall;
          context.strokeRect(px + tileSize * 0.12, py + tileSize * 0.12, tileSize * 0.76, tileSize * 0.76);
          continue;
        }

        if (tile === TILE.DOOR) {
          context.fillStyle = '#f7f7ff';
          context.fillRect(px + tileSize * 0.15, py + tileSize * 0.45, tileSize * 0.7, tileSize * 0.1);
          continue;
        }

        if (tile === TILE.PELLET) {
          context.fillStyle = theme.pellet;
          context.beginPath();
          context.arc(px + tileSize * 0.5, py + tileSize * 0.5, tileSize * 0.1, 0, Math.PI * 2);
          context.fill();
        }

        if (tile === TILE.POWER && blinkVisible) {
          context.fillStyle = theme.power;
          context.beginPath();
          context.arc(px + tileSize * 0.5, py + tileSize * 0.5, tileSize * 0.22, 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    context.restore();
  }

  drawPacman(context, pacman, theme, tileSize, offsetX, offsetY, alpha) {
    const position = lerpPosition(pacman, alpha);
    const px = offsetX + (position.x + 0.5) * tileSize;
    const py = offsetY + (position.y + 0.5) * tileSize;
    const mouth = 0.2 + Math.abs(Math.sin(pacman.mouthTimer * 12)) * 0.24;
    const angle = {
      right: 0,
      left: Math.PI,
      up: -Math.PI / 2,
      down: Math.PI / 2
    }[pacman.lastMoveDirection] ?? 0;

    context.save();
    context.fillStyle = theme.pacman;
    context.beginPath();
    context.moveTo(px, py);
    context.arc(px, py, tileSize * 0.42, angle + mouth, angle + Math.PI * 2 - mouth);
    context.closePath();
    context.fill();
    context.restore();
  }

  drawGhost(context, ghost, theme, tileSize, offsetX, offsetY, alpha) {
    const position = lerpPosition(ghost, alpha);
    const px = offsetX + position.x * tileSize;
    const py = offsetY + position.y * tileSize;
    const bodyWidth = tileSize * 0.84;
    const bodyHeight = tileSize * 0.84;
    const originX = px + tileSize * 0.08;
    const originY = py + tileSize * 0.08;

    if (ghost.state === GHOST_STATES.EATEN) {
      this.drawGhostEyes(context, originX, originY, bodyWidth, bodyHeight, ghost.direction);
      return;
    }

    const isFrightened = ghost.state === GHOST_STATES.FRIGHTENED;
    context.save();
    context.fillStyle = isFrightened ? '#2c64ff' : ghost.color;
    context.beginPath();
    context.moveTo(originX, originY + bodyHeight);
    context.lineTo(originX, originY + bodyHeight * 0.45);
    context.quadraticCurveTo(originX, originY, originX + bodyWidth * 0.5, originY);
    context.quadraticCurveTo(originX + bodyWidth, originY, originX + bodyWidth, originY + bodyHeight * 0.45);
    context.lineTo(originX + bodyWidth, originY + bodyHeight);
    context.lineTo(originX + bodyWidth * 0.78, originY + bodyHeight * 0.82);
    context.lineTo(originX + bodyWidth * 0.58, originY + bodyHeight);
    context.lineTo(originX + bodyWidth * 0.38, originY + bodyHeight * 0.82);
    context.lineTo(originX + bodyWidth * 0.18, originY + bodyHeight);
    context.closePath();
    context.fill();

    this.drawGhostEyes(context, originX, originY, bodyWidth, bodyHeight, ghost.direction);

    if (isFrightened) {
      context.fillStyle = '#ffffff';
      context.fillRect(originX + bodyWidth * 0.2, originY + bodyHeight * 0.62, bodyWidth * 0.6, tileSize * 0.08);
      context.fillStyle = '#cfe1ff';
      context.fillRect(originX + bodyWidth * 0.22, originY + bodyHeight * 0.75, bodyWidth * 0.56, tileSize * 0.08);
    } else {
      context.fillStyle = '#091124';
      context.font = `${Math.max(10, tileSize * 0.28)}px sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(ghost.label, originX + bodyWidth * 0.5, originY + bodyHeight * 0.65);
    }

    context.restore();
  }

  drawGhostEyes(context, originX, originY, bodyWidth, bodyHeight, direction) {
    const eyeOffsetX = direction === 'left' ? -1.4 : direction === 'right' ? 1.4 : 0;
    const eyeOffsetY = direction === 'up' ? -1.2 : direction === 'down' ? 1.2 : 0;
    const leftEyeX = originX + bodyWidth * 0.34;
    const rightEyeX = originX + bodyWidth * 0.66;
    const eyeY = originY + bodyHeight * 0.42;

    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(leftEyeX, eyeY, bodyWidth * 0.12, 0, Math.PI * 2);
    context.arc(rightEyeX, eyeY, bodyWidth * 0.12, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#0b1632';
    context.beginPath();
    context.arc(leftEyeX + eyeOffsetX, eyeY + eyeOffsetY, bodyWidth * 0.055, 0, Math.PI * 2);
    context.arc(rightEyeX + eyeOffsetX, eyeY + eyeOffsetY, bodyWidth * 0.055, 0, Math.PI * 2);
    context.fill();
  }

  drawFruit(context, fruit, theme, tileSize, offsetX, offsetY) {
    if (!fruit.active) {
      return;
    }

    const cx = offsetX + (fruit.spawn.x + 0.5) * tileSize;
    const cy = offsetY + (fruit.spawn.y + 0.5) * tileSize;

    context.save();
    context.fillStyle = fruit.color;
    context.beginPath();
    context.arc(cx, cy, tileSize * 0.22, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = theme.fruitLeaf;
    context.fillRect(cx - tileSize * 0.04, cy - tileSize * 0.28, tileSize * 0.08, tileSize * 0.12);
    context.fillRect(cx + tileSize * 0.02, cy - tileSize * 0.3, tileSize * 0.12, tileSize * 0.05);
    context.restore();
  }

  drawCornerLabels(context, snapshot, theme, tileSize, offsetX, offsetY) {
    context.save();
    context.fillStyle = theme.text;
    context.font = `${Math.max(10, tileSize * 0.26)}px sans-serif`;
    context.textAlign = 'left';
    context.fillText('POWER', offsetX + tileSize * 0.35, offsetY + tileSize * 1.1);
    context.textAlign = 'right';
    context.fillText('POWER', offsetX + tileSize * (snapshot.maze.width - 0.35), offsetY + tileSize * 1.1);
    context.restore();
  }

  drawRunModeBadge(context, snapshot, theme) {
    const labels = {
      [RUN_MODES.NORMAL]: 'Arcade',
      [RUN_MODES.PRACTICE]: 'Practice',
      [RUN_MODES.TUTORIAL]: 'Tutorial',
      [RUN_MODES.DEMO]: 'Demo'
    };

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.08)';
    context.fillRect(18, 18, 124, 34);
    context.fillStyle = theme.text;
    context.font = 'bold 16px sans-serif';
    context.textAlign = 'left';
    context.fillText(labels[snapshot.runMode] ?? 'Arcade', 28, 40);
    context.restore();
  }
}
