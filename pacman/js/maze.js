import { DEFAULT_FRUIT_SPAWN, DEFAULT_PACMAN_START, DIRECTIONS, DIRECTION_ORDER, GRID_HEIGHT, GRID_WIDTH, GHOST_SCATTER_TARGETS, TILE } from './constants.js';

export function createGrid(width = GRID_WIDTH, height = GRID_HEIGHT, fill = TILE.PATH) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

export function getCell(grid, x, y) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
    return TILE.WALL;
  }
  return grid[y][x];
}

export function setCell(grid, x, y, value) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
    return;
  }
  grid[y][x] = value;
}

export function paintRect(grid, x, y, width, height, value = TILE.WALL) {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      setCell(grid, col, row, value);
    }
  }
}

export function paintLine(grid, x1, y1, x2, y2, value = TILE.WALL) {
  if (x1 === x2) {
    const [start, end] = y1 < y2 ? [y1, y2] : [y2, y1];
    for (let row = start; row <= end; row += 1) {
      setCell(grid, x1, row, value);
    }
    return;
  }
  if (y1 === y2) {
    const [start, end] = x1 < x2 ? [x1, x2] : [x2, x1];
    for (let col = start; col <= end; col += 1) {
      setCell(grid, col, y1, value);
    }
  }
}

export function mirrorRect(rect) {
  const mirroredX = GRID_WIDTH - rect.x - rect.width;
  return { ...rect, x: mirroredX };
}

export function applyWallSegments(grid, segments = []) {
  for (const segment of segments) {
    if (segment.type === 'line') {
      paintLine(grid, segment.x1, segment.y1, segment.x2, segment.y2, segment.value || TILE.WALL);
      continue;
    }
    paintRect(grid, segment.x, segment.y, segment.width, segment.height, segment.value || TILE.WALL);
  }
}

export function applySpecialCells(grid, cells = []) {
  for (const cell of cells) {
    setCell(grid, cell.x, cell.y, cell.value);
  }
}

export function createMaze(levelNumber = 1) {
  const blueprint = buildLevelBlueprint(levelNumber);
  const grid = createGrid();

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let col = 0; col < GRID_WIDTH; col += 1) {
      if (row === 0 || row === GRID_HEIGHT - 1 || col === 0 || col === GRID_WIDTH - 1) {
        grid[row][col] = TILE.WALL;
      }
    }
  }

  applyWallSegments(grid, blueprint.walls);
  applySpecialCells(grid, blueprint.specials);

  grid[blueprint.pacmanStart.y][blueprint.pacmanStart.x] = TILE.START;
  for (const spawn of blueprint.ghostSpawns) {
    grid[spawn.y][spawn.x] = TILE.GHOST;
  }
  grid[blueprint.fruitSpawn.y][blueprint.fruitSpawn.x] = grid[blueprint.fruitSpawn.y][blueprint.fruitSpawn.x] === TILE.WALL ? TILE.PATH : grid[blueprint.fruitSpawn.y][blueprint.fruitSpawn.x];

  const pellets = [];
  let remainingPellets = 0;
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const tile = grid[y][x];
      if (tile === TILE.PATH || tile === TILE.POWER) {
        remainingPellets += 1;
        pellets.push({ x, y, power: tile === TILE.POWER });
      }
    }
  }

  return {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    layoutName: blueprint.name,
    grid,
    pellets,
    pelletsRemaining: remainingPellets,
    totalPellets: remainingPellets,
    pacmanStart: { ...blueprint.pacmanStart },
    ghostSpawns: blueprint.ghostSpawns.map((spawn) => ({ ...spawn })),
    ghostHouse: { ...blueprint.ghostHouse },
    fruitSpawn: { ...blueprint.fruitSpawn },
    scatterTargets: { ...GHOST_SCATTER_TARGETS },
    tunnelRow: blueprint.tunnelRow,
    powerPellets: blueprint.specials.filter((cell) => cell.value === TILE.POWER).map(({ x, y }) => ({ x, y }))
  };
}

function createBaseBlueprint() {
  const pacmanStart = { ...DEFAULT_PACMAN_START };
  const ghostSpawns = [
    { x: 9, y: 9 },
    { x: 10, y: 9 },
    { x: 11, y: 9 },
    { x: 10, y: 10 }
  ];
  const ghostHouse = { x: 7, y: 7, width: 7, height: 5, door: { x: 10, y: 7 }, home: { x: 10, y: 9 } };
  const fruitSpawn = { ...DEFAULT_FRUIT_SPAWN };
  const tunnelRow = Math.floor(GRID_HEIGHT / 2);

  const houseWalls = [
    { x: ghostHouse.x, y: ghostHouse.y, width: ghostHouse.width, height: 1 },
    { x: ghostHouse.x, y: ghostHouse.y + ghostHouse.height - 1, width: ghostHouse.width, height: 1 },
    { x: ghostHouse.x, y: ghostHouse.y, width: 1, height: ghostHouse.height },
    { x: ghostHouse.x + ghostHouse.width - 1, y: ghostHouse.y, width: 1, height: ghostHouse.height }
  ];

  const houseInterior = [];
  for (let y = ghostHouse.y + 1; y < ghostHouse.y + ghostHouse.height - 1; y += 1) {
    for (let x = ghostHouse.x + 1; x < ghostHouse.x + ghostHouse.width - 1; x += 1) {
      houseInterior.push({ x, y, value: TILE.HOUSE });
    }
  }
  const doorCell = [{ x: ghostHouse.door.x, y: ghostHouse.door.y, value: TILE.DOOR }];
  const spawnCells = ghostSpawns.map((spawn, index) => ({ x: spawn.x, y: spawn.y, value: index === 0 ? TILE.GHOST : TILE.HOUSE }));

  const leftWalls = [
    { x: 2, y: 2, width: 4, height: 1 },
    { x: 2, y: 3, width: 1, height: 4 },
    { x: 6, y: 5, width: 3, height: 1 },
    { x: 2, y: 7, width: 5, height: 1 },
    { x: 4, y: 12, width: 3, height: 1 },
    { x: 2, y: 13, width: 1, height: 4 },
    { x: 5, y: 16, width: 3, height: 1 }
  ];

  const rightWalls = leftWalls.map((rect) => mirrorRect(rect));
  const centerWalls = [
    { x: 8, y: 2, width: 5, height: 1 },
    { x: 8, y: 4, width: 1, height: 2 },
    { x: 12, y: 4, width: 1, height: 2 },
    { x: 8, y: 15, width: 5, height: 1 },
    { x: 8, y: 17, width: 1, height: 2 },
    { x: 12, y: 17, width: 1, height: 2 }
  ];

  const specials = [
    { x: 1, y: 1, value: TILE.POWER },
    { x: GRID_WIDTH - 2, y: 1, value: TILE.POWER },
    { x: 1, y: GRID_HEIGHT - 2, value: TILE.POWER },
    { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2, value: TILE.POWER },
    { x: pacmanStart.x, y: pacmanStart.y, value: TILE.START },
    { x: fruitSpawn.x, y: fruitSpawn.y, value: TILE.PATH },
    { x: 0, y: tunnelRow, value: TILE.PATH },
    { x: GRID_WIDTH - 1, y: tunnelRow, value: TILE.PATH },
    { x: 1, y: tunnelRow, value: TILE.PATH },
    { x: GRID_WIDTH - 2, y: tunnelRow, value: TILE.PATH }
  ];

  return {
    name: 'Neon Alley',
    pacmanStart,
    ghostSpawns,
    ghostHouse,
    fruitSpawn,
    tunnelRow,
    walls: [...houseWalls, ...leftWalls, ...rightWalls, ...centerWalls],
    specials: [...houseInterior, ...doorCell, ...spawnCells, ...specials]
  };
}

function createSecondBlueprint() {
  const base = createBaseBlueprint();
  return {
    ...base,
    name: 'Electric Loop',
    walls: [
      ...base.walls,
      { x: 2, y: 10, width: 6, height: 1 },
      { x: 13, y: 10, width: 6, height: 1 },
      { x: 8, y: 6, width: 1, height: 3 },
      { x: 12, y: 6, width: 1, height: 3 },
      { x: 8, y: 12, width: 1, height: 2 },
      { x: 12, y: 12, width: 1, height: 2 }
    ],
    specials: base.specials.map((cell) => ({ ...cell }))
  };
}

function createThirdBlueprint() {
  const base = createBaseBlueprint();
  return {
    ...base,
    name: 'Arcade Core',
    walls: [
      ...base.walls,
      { x: 3, y: 4, width: 4, height: 1 },
      { x: 14, y: 4, width: 4, height: 1 },
      { x: 3, y: 15, width: 4, height: 1 },
      { x: 14, y: 15, width: 4, height: 1 },
      { x: 9, y: 4, width: 1, height: 2 },
      { x: 11, y: 4, width: 1, height: 2 },
      { x: 9, y: 14, width: 1, height: 2 },
      { x: 11, y: 14, width: 1, height: 2 }
    ],
    specials: base.specials.map((cell) => ({ ...cell }))
  };
}

const BLUEPRINTS = [createBaseBlueprint(), createSecondBlueprint(), createThirdBlueprint()];

export function buildLevelBlueprint(levelNumber = 1) {
  const index = Math.max(0, levelNumber - 1) % BLUEPRINTS.length;
  return BLUEPRINTS[index];
}

export function isWalkableForPacman(tile) {
  return tile === TILE.PATH || tile === TILE.POWER || tile === TILE.START || tile === TILE.EMPTY;
}

export function isWalkableForGhost(tile) {
  return tile !== TILE.WALL;
}

export function isPelletTile(tile) {
  return tile === TILE.PATH || tile === TILE.POWER;
}

export function wrapTile(maze, x, y) {
  const wrapped = { x, y };
  if (x < 0 && y === maze.tunnelRow) {
    wrapped.x = maze.width - 1;
  }
  if (x >= maze.width && y === maze.tunnelRow) {
    wrapped.x = 0;
  }
  if (y < 0) {
    wrapped.y = maze.height - 1;
  }
  if (y >= maze.height) {
    wrapped.y = 0;
  }
  return wrapped;
}

export function moveTile(maze, tile, direction) {
  const vector = DIRECTIONS[direction] || DIRECTIONS.left;
  const candidate = wrapTile(maze, tile.x + vector.dx, tile.y + vector.dy);
  return candidate;
}

export function getNeighbors(maze, tile, actor = 'pacman') {
  return DIRECTION_ORDER.map((direction) => ({ direction, tile: moveTile(maze, tile, direction) })).filter(({ tile: next }) => {
    const nextTile = getCell(maze.grid, next.x, next.y);
    return actor === 'ghost' ? isWalkableForGhost(nextTile) : isWalkableForPacman(nextTile);
  });
}

export function canEnter(maze, tile, actor = 'pacman') {
  const cell = getCell(maze.grid, tile.x, tile.y);
  return actor === 'ghost' ? isWalkableForGhost(cell) : isWalkableForPacman(cell);
}

export function findShortestPath(maze, start, goal, actor = 'ghost') {
  const startKey = `${start.x},${start.y}`;
  const goalKey = `${goal.x},${goal.y}`;
  const queue = [start];
  const visited = new Map([[startKey, null]]);

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = `${current.x},${current.y}`;
    if (currentKey === goalKey) {
      break;
    }
    for (const { tile: next } of getNeighbors(maze, current, actor)) {
      const nextKey = `${next.x},${next.y}`;
      if (!visited.has(nextKey)) {
        visited.set(nextKey, currentKey);
        queue.push(next);
      }
    }
  }

  if (!visited.has(goalKey)) {
    return null;
  }

  const path = [goal];
  let currentKey = goalKey;
  while (currentKey !== startKey) {
    const previousKey = visited.get(currentKey);
    if (previousKey === null || previousKey === undefined) {
      break;
    }
    const [x, y] = previousKey.split(',').map(Number);
    path.unshift({ x, y });
    currentKey = previousKey;
  }
  return path;
}

export function findShortestDistance(maze, start, goal, actor = 'ghost') {
  const path = findShortestPath(maze, start, goal, actor);
  return path ? path.length - 1 : Number.POSITIVE_INFINITY;
}

export function isCorner(tile, maze) {
  return (tile.x <= 2 || tile.x >= maze.width - 3) && (tile.y <= 2 || tile.y >= maze.height - 3);
}

export function isInGhostHouse(tile, maze) {
  const house = maze.ghostHouse;
  return tile.x >= house.x + 1 && tile.x <= house.x + house.width - 2 && tile.y >= house.y + 1 && tile.y <= house.y + house.height - 2;
}
