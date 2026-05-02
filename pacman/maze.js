/**
 * Pacman Maze Module
 *
 * Classic 28x31 maze layout with wall rendering, dots, power pellets,
 * ghost house, and warp tunnels. Vanilla JS — no dependencies.
 */

// ── Grid dimensions ──────────────────────────────────────────────────────────
export const MAZE_WIDTH = 28;
export const MAZE_HEIGHT = 31;

// ── Cell type enum ───────────────────────────────────────────────────────────
export const CELL_TYPES = {
  WALL: 'wall',
  PATH: 'path',
  DOT: 'dot',
  POWER_PELLET: 'power_pellet',
  GHOST_HOUSE: 'ghost_house',
  TUNNEL: 'tunnel',
};

// ── Raw maze layout (classic Pacman pattern) ────────────────────────────────
// Shorter rows are padded with walls on the right by parseMaze().
const RAW_LAYOUT = [
  '############################',
  '#o........##........o#....#',
  '#....##.##.##.##.##.##.##.#',
  '#....#..#.....#..#..#.#..#',
  '#.##.##.###.###.###.##.##.#',
  '#....#......#.#.........#.#',
  '####.######.###.######.##.#',
  '####.######...........##.#',
  '####..................##.#',
  '##..#.##.###.##.##..#.#..#',
  '##..#.##.#G#G#G.##..#.#..#',
  '####.##.#.##.#.##.######.#',
  '####.##.#....#.##.######.#',
  '####.##.######.##.######.#',
  '####.##.#....#.##.######.#',
  '####.##.######.##.######.#',
  '####.##.#....#.##.######.#',
  '####.##.######.##.######.#',
  '##..#.##.##.##.##.##..#..#',
  '##..#...........#.....#..#',
  '##..#.##.####.##.##..#..#',
  '####.##.#....#.##.######.#',
  '####.##.######.##.######.#',
  '####..................##.#',
  '####.######.###.######.##.#',
  '#....#......#.#.........#.#',
  '#.##.##.###.###.##.##.##.##',
  '#....#....#.....#....#....#',
  '#o.##..#.#########.##.##.##',
  '#........##........#......#',
  '############################',
];

// ── Parse raw layout into structured data ────────────────────────────────────
let _parsedMaze = null;
let _dotCount = 0;

function parseMaze() {
  if (_parsedMaze) return _parsedMaze;

  _parsedMaze = [];
  _dotCount = 0;

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    const row = [];
    let line = RAW_LAYOUT[y] || '';
    // Pad shorter rows with walls on the right
    while (line.length < MAZE_WIDTH) line += '#';
    for (let x = 0; x < MAZE_WIDTH; x++) {
      const ch = line[x] || '#';
      let type;
      switch (ch) {
        case '#': type = CELL_TYPES.WALL; break;
        case '.': type = CELL_TYPES.DOT; _dotCount++; break;
        case 'o': type = CELL_TYPES.POWER_PELLET; _dotCount++; break;
        case 'G': type = CELL_TYPES.GHOST_HOUSE; break;
        case 'T': type = CELL_TYPES.TUNNEL; break;
        default:  type = CELL_TYPES.PATH; break;
      }
      row.push({ type, x, y });
    }
    _parsedMaze.push(row);
  }

  return _parsedMaze;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the raw 2D character grid (read-only strings).
 */
export function getMazeLayout() {
  return RAW_LAYOUT;
}

/**
 * Returns the parsed maze with cell type objects.
 */
export function getMazeData() {
  return parseMaze();
}

/**
 * Returns the cell type at a given grid position.
 */
export function getCell(x, y) {
  const maze = parseMaze();
  if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) {
    return CELL_TYPES.WALL;
  }
  return maze[y][x].type;
}

/**
 * Checks if a grid position is walkable (not a wall).
 */
export function isWalkable(x, y) {
  const type = getCell(x, y);
  return type !== CELL_TYPES.WALL;
}

/**
 * Returns total number of dots (including power pellets).
 */
export function getDotCount() {
  parseMaze(); // ensure parsed
  return _dotCount;
}

/**
 * Returns tunnel position info for warp tunnels on left/right edges.
 */
export function getTunnelBounds() {
  // Tunnel row is row 19 (0-indexed), spanning columns 0-1 on each edge
  return {
    y: 19,
    left: { xStart: 0, xEnd: 1 },
    right: { xStart: MAZE_WIDTH - 2, xEnd: MAZE_WIDTH - 1 },
  };
}

// ── Rendering ────────────────────────────────────────────────────────────────

const WALL_COLOR = '#2121DE';
const DOT_COLOR = '#FFB8ae';
const PELLET_COLOR = '#FFB89E';
const WALL_GLOW_COLOR = 'rgba(33, 33, 222, 0.15)';

/**
 * Render the full maze onto the given canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cellSize - pixel size of one grid cell
 * @param {number} offsetX - x offset for maze top-left
 * @param {number} offsetY - y offset for maze top-left
 * @param {number} time - elapsed time in ms (used for power pellet flash)
 */
export function renderMaze(ctx, cellSize, offsetX, offsetY, time) {
  const maze = parseMaze();

  // Draw walls first
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (maze[y][x].type === CELL_TYPES.WALL) {
        drawWallCell(ctx, x, y, cellSize, offsetX, offsetY);
      }
    }
  }

  // Draw dots
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      const cell = maze[y][x];
      if (cell.type === CELL_TYPES.DOT) {
        drawDot(ctx, x, y, cellSize, offsetX, offsetY);
      } else if (cell.type === CELL_TYPES.POWER_PELLET) {
        drawPowerPellet(ctx, x, y, cellSize, offsetX, offsetY, time);
      }
    }
  }
}

/**
 * Draw a single wall cell using pixel-retro blue double-line style.
 */
function drawWallCell(ctx, gx, gy, cellSize, ox, oy) {
  const x = ox + gx * cellSize;
  const y = oy + gy * cellSize;

  // Determine which neighbors are also walls to build connected segments
  const maze = parseMaze();
  const isWall = (nx, ny) => {
    if (nx < 0 || nx >= MAZE_WIDTH || ny < 0 || ny >= MAZE_HEIGHT) return true;
    return maze[ny][nx].type === CELL_TYPES.WALL;
  };

  const top = isWall(gx, gy - 1);
  const bottom = isWall(gx, gy + 1);
  const left = isWall(gx - 1, gy);
  const right = isWall(gx + 1, gy);

  // Semi-transparent fill for glow effect
  ctx.fillStyle = WALL_GLOW_COLOR;
  ctx.fillRect(x, y, cellSize, cellSize);

  // Solid wall background
  ctx.fillStyle = WALL_COLOR;
  ctx.fillRect(x, y, cellSize, cellSize);

  // Double-line border effect — draw inner lighter rectangle
  const pad = cellSize * 0.25;
  const innerPad = cellSize * 0.12;

  // Draw connecting segments based on neighbors
  const segW = cellSize * 0.5;
  const segH = cellSize * 0.5;
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;

  // Center dot
  ctx.fillStyle = WALL_COLOR;
  ctx.fillRect(cx - innerPad, cy - innerPad, innerPad * 2, innerPad * 2);

  // Horizontal bar
  if (left || right) {
    ctx.fillRect(
      cx - (left ? segW : 0),
      cy - innerPad * 0.6,
      (left ? segW : 0) + (right ? segW : 0) + innerPad * 2,
      innerPad * 1.2
    );
  }

  // Vertical bar
  if (top || bottom) {
    ctx.fillRect(
      cx - innerPad * 0.6,
      cy - (top ? segW : 0),
      innerPad * 1.2,
      (top ? segW : 0) + (bottom ? segW : 0) + innerPad * 2
    );
  }

  // Inner highlight for retro feel
  ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
  ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
}

/**
 * Draw a small dot pellet.
 */
function drawDot(ctx, gx, gy, cellSize, ox, oy) {
  const cx = ox + gx * cellSize + cellSize / 2;
  const cy = oy + gy * cellSize + cellSize / 2;
  const r = cellSize * 0.1;

  ctx.fillStyle = DOT_COLOR;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a power pellet with flashing animation.
 */
function drawPowerPellet(ctx, gx, gy, cellSize, ox, oy, time) {
  const cx = ox + gx * cellSize + cellSize / 2;
  const cy = oy + gy * cellSize + cellSize / 2;

  // Flash every 400ms — alternate between full size and smaller
  const flash = Math.floor(time / 400) % 2 === 0;
  const r = flash ? cellSize * 0.35 : cellSize * 0.15;

  ctx.fillStyle = PELLET_COLOR;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}
