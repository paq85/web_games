// Lane configuration for the 15x13 grid
// Row indices: 1 (top/home) to 13 (bottom/spawn)

const LANE_TYPES = {
  SPAWN: 'spawn',
  ROAD: 'road',
  SAFE: 'safe',
  RIVER: 'river',
  HOME: 'home',
};

const VEHICLE_TYPES = {
  CAR: 'car',
  TRUCK: 'truck',
  BULLDOZER: 'bulldozer',
};

const PLATFORM_TYPES = {
  LOG: 'log',
  TURTLE: 'turtle',
};

// Base speeds (pixels per second at level 1, scaled by cell width)
// These are in cells per second — multiplied by cellSize in rendering
const BASE_SPEEDS = {
  car: 3,
  truck: 2,
  bulldozer: 1.5,
  log3: 2,    // 3-tile logs
  turtle: 1.8,
  log2: 2.2,  // 2-tile logs
};

// Obstacle count per lane (initial spawn)
const OBSTACLE_COUNTS = {
  car: 3,
  truck: 2,
  bulldozer: 1,
  log3: 2,
  turtle3: 3,  // groups of 3 turtles
  log2: 2,
  turtle2: 2,  // groups of 2 turtles
};

// Lane definitions (row index 1 = top)
const LANES = [
  { row: 1,  type: LANE_TYPES.HOME,  direction: 0, speed: 0, obstacleType: null },
  { row: 2,  type: LANE_TYPES.SAFE,  direction: 0, speed: 0, obstacleType: null },
  { row: 3,  type: LANE_TYPES.RIVER, direction: 1, speed: BASE_SPEEDS.log2, obstacleType: PLATFORM_TYPES.LOG, obstacleWidth: 2, obstacleCount: OBSTACLE_COUNTS.log2 },
  { row: 4,  type: LANE_TYPES.RIVER, direction: -1, speed: BASE_SPEEDS.turtle, obstacleType: PLATFORM_TYPES.TURTLE, obstacleWidth: 2, obstacleCount: OBSTACLE_COUNTS.turtle2, isDiver: true },
  { row: 5,  type: LANE_TYPES.RIVER, direction: 1, speed: BASE_SPEEDS.log2, obstacleType: PLATFORM_TYPES.LOG, obstacleWidth: 2, obstacleCount: OBSTACLE_COUNTS.log2 },
  { row: 6,  type: LANE_TYPES.RIVER, direction: -1, speed: BASE_SPEEDS.turtle, obstacleType: PLATFORM_TYPES.TURTLE, obstacleWidth: 3, obstacleCount: OBSTACLE_COUNTS.turtle3, isDiver: true },
  { row: 7,  type: LANE_TYPES.RIVER, direction: 1, speed: BASE_SPEEDS.log3, obstacleType: PLATFORM_TYPES.LOG, obstacleWidth: 3, obstacleCount: OBSTACLE_COUNTS.log3, hasLadybugs: true },
  { row: 8,  type: LANE_TYPES.SAFE,  direction: 0, speed: 0, obstacleType: null },
  { row: 9,  type: LANE_TYPES.ROAD,  direction: -1, speed: BASE_SPEEDS.bulldozer, obstacleType: VEHICLE_TYPES.BULLDOZER, obstacleWidth: 3, obstacleCount: OBSTACLE_COUNTS.bulldozer },
  { row: 10, type: LANE_TYPES.ROAD,  direction: 1, speed: BASE_SPEEDS.car, obstacleType: VEHICLE_TYPES.CAR, obstacleWidth: 1, obstacleCount: OBSTACLE_COUNTS.car },
  { row: 11, type: LANE_TYPES.ROAD,  direction: -1, speed: BASE_SPEEDS.truck, obstacleType: VEHICLE_TYPES.TRUCK, obstacleWidth: 2, obstacleCount: OBSTACLE_COUNTS.truck },
  { row: 12, type: LANE_TYPES.ROAD,  direction: 1, speed: BASE_SPEEDS.car, obstacleType: VEHICLE_TYPES.CAR, obstacleWidth: 1, obstacleCount: OBSTACLE_COUNTS.car },
  { row: 13, type: LANE_TYPES.SPAWN, direction: 0, speed: 0, obstacleType: null },
];

export { LANE_TYPES, VEHICLE_TYPES, PLATFORM_TYPES, BASE_SPEEDS, OBSTACLE_COUNTS, LANES };
