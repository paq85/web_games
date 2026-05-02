const LAYOUTS = [
  {
    id: 'arcade-alpha',
    name: 'Arcade Alpha',
    rows: [
      '#####################',
      '#o...#.....#.....#o.#',
      '#.#.#.###.#.###.#.#.#',
      '#.#.....#.#.#.....#.#',
      '#.#####.#.#.#.#####.#',
      '#.......#...#.......#',
      '###.#.####.####.#.###',
      '#...#....===....#...#',
      '#.###.#.     .#.###.#',
      '#.....#.#   #.#.....#',
      '.###.#.#   #.#.#.###.',
      '#.....#.#####.#.....#',
      '#.###.#.......#.###.#',
      '#.#...###.#.###...#.#',
      '#.#.#.....#.....#.#.#',
      '#...#.###.#.###.#...#',
      '###.#.#.......#.#.###',
      '#.....#.#####.#.....#',
      '#.###.#...#...#.###.#',
      '#o....###.#.###....o#',
      '#####################'
    ],
    pacmanSpawn: { x: 9, y: 15, direction: 'left' },
    fruitSpawn: { x: 10, y: 12 },
    houseDoor: { x: 10, y: 7 },
    houseCenter: { x: 10, y: 9 },
    tunnelRows: [10],
    ghostSpawns: {
      blinky: { x: 10, y: 6, direction: 'left', outside: true },
      pinky: { x: 10, y: 9, direction: 'up', outside: false },
      inky: { x: 9, y: 9, direction: 'up', outside: false },
      clyde: { x: 11, y: 9, direction: 'up', outside: false }
    }
  },
  {
    id: 'arcade-beta',
    name: 'Arcade Beta',
    rows: [
      '#####################',
      '#o..#...#...#...#..o#',
      '#.#.#.#.#.#.#.#.#.#.#',
      '#.#...#...#...#...#.#',
      '#.###.###.#.###.###.#',
      '#.....#...#...#.....#',
      '###.#.#.#####.#.#.###',
      '#...#....===....#...#',
      '#.#####.     .#####.#',
      '#.....#.#   #.#.....#',
      '.###.#.#   #.#.#.###.',
      '#.....#.#####.#.....#',
      '#.###.#.......#.###.#',
      '#...#.#.#####.#.#...#',
      '#.#.#...#...#...#.#.#',
      '#.#.###.#.#.#.###.#.#',
      '#.#.....#.#.#.....#.#',
      '#.#####.#.#.#.#####.#',
      '#.....#...#...#.....#',
      '#o###.###.#.###.###o#',
      '#####################'
    ],
    pacmanSpawn: { x: 9, y: 15, direction: 'left' },
    fruitSpawn: { x: 10, y: 12 },
    houseDoor: { x: 10, y: 7 },
    houseCenter: { x: 10, y: 9 },
    tunnelRows: [10],
    ghostSpawns: {
      blinky: { x: 10, y: 6, direction: 'left', outside: true },
      pinky: { x: 10, y: 9, direction: 'up', outside: false },
      inky: { x: 9, y: 9, direction: 'up', outside: false },
      clyde: { x: 11, y: 9, direction: 'up', outside: false }
    }
  }
];

function normalizeRows(rows) {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => row.padEnd(width, '#').split(''));
}

export function getMazeDefinition(level = 1) {
  const base = LAYOUTS[(Math.max(1, level) - 1) % LAYOUTS.length];
  const grid = normalizeRows(base.rows);
  return {
    ...base,
    width: grid[0].length,
    height: grid.length,
    rows: grid.map((row) => [...row]),
    scatterTargets: {
      blinky: { x: grid[0].length - 2, y: 0 },
      pinky: { x: 1, y: 0 },
      inky: { x: grid[0].length - 2, y: grid.length - 1 },
      clyde: { x: 1, y: grid.length - 1 }
    }
  };
}
