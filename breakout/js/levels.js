/**
 * Level definitions - 10 pre-designed levels + procedural generator
 * Matrix values: 0=empty, 1=standard, 2=reinforced, 3=unbreakable
 */

const LEVEL_1 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const LEVEL_2 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const LEVEL_3 = [
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const LEVEL_4 = [
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const LEVEL_5 = [
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const LEVEL_6 = [
  [3,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,2,2,2,2,2,2,2,2,2,2,2,1,1],
  [1,1,2,1,1,1,1,1,1,1,1,1,2,1,1],
  [1,1,2,1,1,1,1,1,1,1,1,1,2,1,1],
  [1,1,2,2,2,2,2,2,2,2,2,2,2,1,1],
  [3,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
];

const LEVEL_7 = [
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0],
  [0,1,1,2,1,1,1,1,1,1,1,2,1,1,0],
  [1,1,1,2,1,3,1,1,1,3,1,2,1,1,1],
  [1,1,1,2,1,1,1,1,1,1,1,2,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const LEVEL_8 = [
  [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
  [2,1,2,1,2,1,2,1,2,1,2,1,2,1,2],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,3,1,1,1,1,1,1,1,1,3,1,1,1],
  [1,1,1,2,2,2,2,2,2,2,2,1,1,1,1],
  [1,1,1,2,1,1,1,1,1,1,2,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const LEVEL_9 = [
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,2,2,2,2,2,2,2,2,2,2,1,1,1],
  [1,2,2,3,3,3,3,3,3,3,3,2,2,2,1],
  [1,2,3,3,1,1,1,1,1,1,3,3,3,2,1],
  [1,2,3,1,1,2,2,2,2,1,1,3,1,2,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const LEVEL_10 = [
  [3,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,3,3,3,3,3,3,3,3,1,1,2,1],
  [1,2,1,3,1,1,1,1,1,1,3,1,1,2,1],
  [1,2,1,3,1,2,2,2,2,1,3,1,1,2,1],
  [1,2,1,3,1,2,1,1,2,1,3,1,1,2,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const PRE_DESIGNED_LEVELS = [
  LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5,
  LEVEL_6, LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10,
];

/**
 * Get level matrix by level number (1-indexed).
 * Returns pre-designed for levels 1-10, procedural for 11+.
 */
export function getLevelMatrix(levelNumber) {
  if (levelNumber >= 1 && levelNumber <= PRE_DESIGNED_LEVELS.length) {
    return PRE_DESIGNED_LEVELS[levelNumber - 1];
  }
  return generateProceduralLevel(levelNumber);
}

/**
 * Procedural level generator - scales complexity with level number
 */
function generateProceduralLevel(levelNumber) {
  const cols = 15;
  const rows = Math.min(5 + Math.floor(levelNumber / 3), 9);

  const matrix = [];
  for (let r = 0; r < rows; r++) {
    matrix.push(new Array(cols).fill(0));
  }

  // Fill with patterns based on level
  const pattern = levelNumber % 5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let brick = 0;

      switch (pattern) {
        case 0: // Checkerboard with density
          if ((r + c) % 2 === 0) brick = 1;
          break;
        case 1: // Horizontal stripes
          if (r % 2 === 0) brick = 1;
          break;
        case 2: // Diagonal pattern
          if ((r + c) % 3 !== 0) brick = 1;
          break;
        case 3: // Diamond shape
          const dx = Math.abs(c - cols / 2);
          const dy = Math.abs(r - rows / 2);
          if (dx + dy <= cols / 2 + 1) brick = 1;
          break;
        case 4: // Random with density
          if (Math.random() < 0.6 + levelNumber * 0.01) brick = 1;
          break;
      }

      // Add reinforced bricks based on level
      if (brick === 1 && levelNumber > 5) {
        const reinforcedChance = Math.min(0.1 + (levelNumber - 5) * 0.05, 0.4);
        if (Math.random() < reinforcedChance) brick = 2;
      }

      // Add unbreakable bricks sparingly
      if (brick === 1 && levelNumber > 8) {
        const unbreakableChance = Math.min(0.02 + (levelNumber - 8) * 0.01, 0.08);
        if (Math.random() < unbreakableChance) brick = 3;
      }

      matrix[r][c] = brick;
    }
  }

  return matrix;
}

/**
 * Get base ball speed for a level
 */
export function getBaseBallSpeed(levelNumber, speedSetting) {
  const base = speedSetting === 'fast' ? 10 : 8;
  return base + (levelNumber - 1) * 0.15;
}

/**
 * Get paddle width multiplier for a level
 */
export function getPaddleSize(levelNumber, sizeSetting) {
  const sizes = { small: 70, normal: 100, large: 130 };
  let width = sizes[sizeSetting] || sizes.normal;
  // Slightly reduce paddle for higher levels
  if (levelNumber > 5) {
    width = Math.max(width - (levelNumber - 5) * 2, width * 0.75);
  }
  return width;
}
