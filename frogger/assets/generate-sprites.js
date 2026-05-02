// Generate sprite sheet PNGs using only Node.js built-ins (zlib + Buffer)
// Run: node generate-sprites.js

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- Minimal PNG encoder ----

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len); // 4 (length) + 4 (type) + data + 4 (crc)
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type), data]));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPNG(width, height, pixels) {
  // pixels[y][x] = [r, g, b, a]  (a defaults to 255)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — raw image data with filter byte 0 per row
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter type: None
    for (let x = 0; x < width; x++) {
      const c = pixels[y][x] || [0, 0, 0, 0];
      raw.push(c[0], c[1], c[2], c[3] !== undefined ? c[3] : 255);
    }
  }
  const compressed = deflateSync(Buffer.from(raw), { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', compressed),
    writeChunk('IEND', iend),
  ]);
}

// ---- Color helpers ----

function rgba(r, g, b, a = 255) { return [r, g, b, a]; }
function transparent() { return [0, 0, 0, 0]; }

// ---- Sprite: Frog (4 directions) ----
// Each frog sprite: 32x32, sprite sheet: 32x128 (4 directions stacked vertically)
function generateFrogSprite() {
  const W = 32, H = 32;
  const frames = [];

  // Frog body colors
  const body = rgba(0, 255, 136);
  const dark = rgba(0, 204, 106);
  const eye = rgba(255, 255, 255);
  const pupil = rgba(17, 17, 17);
  const leg = rgba(0, 255, 136);

  for (let dir = 0; dir < 4; dir++) {
    // dir: 0=up, 1=right, 2=down, 3=left
    const frame = [];
    for (let y = 0; y < H; y++) {
      frame[y] = [];
      for (let x = 0; x < W; x++) {
        frame[y][x] = transparent();
      }
    }

    // Body ellipse (centered)
    const cx = W / 2, cy = H / 2;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x - cx) / (W * 0.3);
        const dy = (y - cy) / (H * 0.35);
        const dist = dx * dx + dy * dy;
        if (dist < 1) {
          frame[y][x] = body;
        }
        if (dist < 0.5) {
          frame[y][x] = dark;
        }
      }
    }

    // Eyes (position based on direction)
    const eyeOffsets = [
      [[-3, -5], [3, -5]],   // up
      [[5, -3], [5, 3]],     // right
      [[-3, 5], [3, 5]],     // down
      [[-5, -3], [-5, 3]],   // left
    ];
    const off = eyeOffsets[dir];
    for (const [ex, ey] of off) {
      // Eye white
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx * dx + dy * dy <= 4) {
            frame[cy + ey + dy][cx + ex + dx] = eye;
          }
        }
      }
      // Pupil (shifted toward direction)
      const px = dir === 0 ? 0 : dir === 1 ? 1 : dir === 2 ? 0 : -1;
      const py = dir === 0 ? -1 : dir === 1 ? 0 : dir === 2 ? 1 : 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx * dx + dy * dy <= 1) {
            frame[cy + ey + dy + py][cx + ex + dx + px] = pupil;
          }
        }
      }
    }

    // Legs (simple lines extending outward)
    const legOffsets = [
      [[-5, 4], [5, 4]],     // up: legs below
      [[4, -5], [4, 5]],     // right: legs right
      [[-5, -4], [5, -4]],   // down: legs above
      [[-4, -5], [-4, 5]],   // left: legs left
    ];
    for (const [lx, ly] of legOffsets[dir]) {
      frame[cy + ly][cx + lx] = leg;
      frame[cy + ly][cx + lx + (lx > 0 ? 1 : lx < 0 ? -1 : 0)] = leg;
      frame[cy + ly + (ly > 0 ? 1 : ly < 0 ? -1 : 0)][cx + lx] = leg;
    }

    frames.push(frame);
  }

  // Stack vertically: 32x128
  const sheet = [];
  for (let y = 0; y < H * 4; y++) {
    sheet[y] = [];
    const frameIdx = Math.floor(y / H);
    const localY = y % H;
    for (let x = 0; x < W; x++) {
      sheet[y][x] = frames[frameIdx][localY][x];
    }
  }
  return createPNG(W, H * 4, sheet);
}

// ---- Sprite: Vehicles ----
// Car (32x16), Truck (64x16), Bulldozer (96x16) — arranged horizontally: 192x16
function generateVehiclesSprite() {
  const W = 192, H = 16;
  const pixels = [];
  for (let y = 0; y < H; y++) {
    pixels[y] = [];
    for (let x = 0; x < W; x++) {
      pixels[y][x] = transparent();
    }
  }

  // Car at x=0, 32x16, red
  const carColors = [rgba(255, 68, 68), rgba(255, 204, 0), rgba(68, 136, 255)];
  for (let i = 0; i < 3; i++) {
    const ox = i * 32;
    const col = carColors[i];
    // Body
    for (let y = 2; y < 14; y++) {
      for (let x = 2; x < 30; x++) {
        pixels[y][ox + x] = col;
      }
    }
    // Windshield
    for (let y = 4; y < 12; y++) {
      for (let x = 20; x < 26; x++) {
        pixels[y][ox + x] = rgba(170, 221, 255);
      }
    }
    // Wheels
    for (let x = 6; x < 12; x++) {
      pixels[1][ox + x] = rgba(34, 34, 34);
      pixels[14][ox + x] = rgba(34, 34, 34);
    }
    for (let x = 20; x < 26; x++) {
      pixels[1][ox + x] = rgba(34, 34, 34);
      pixels[14][ox + x] = rgba(34, 34, 34);
    }
  }

  // Truck at x=96, 64x16, orange
  const truckColors = [rgba(255, 102, 51), rgba(136, 68, 204)];
  for (let i = 0; i < 2; i++) {
    const ox = 96 + i * 64;
    const col = truckColors[i];
    // Body
    for (let y = 2; y < 14; y++) {
      for (let x = 2; x < 62; x++) {
        pixels[y][ox + x] = col;
      }
    }
    // Cab
    for (let y = 2; y < 14; y++) {
      for (let x = 46; x < 60; x++) {
        pixels[y][ox + x] = rgba(51, 51, 51);
      }
    }
    // Windshield
    for (let y = 4; y < 12; y++) {
      for (let x = 50; x < 56; x++) {
        pixels[y][ox + x] = rgba(170, 221, 255);
      }
    }
    // Wheels
    for (const wx of [8, 28, 50]) {
      for (let x = wx; x < wx + 6; x++) {
        pixels[1][ox + x] = rgba(34, 34, 34);
        pixels[14][ox + x] = rgba(34, 34, 34);
      }
    }
  }

  // Bulldozer at x=32, 96x16, brown
  const bulldozerColors = [rgba(136, 85, 34)];
  for (let i = 0; i < 1; i++) {
    const ox = 32 + i * 96;
    const col = bulldozerColors[i];
    // Body
    for (let y = 2; y < 14; y++) {
      for (let x = 2; x < 94; x++) {
        pixels[y][ox + x] = col;
      }
    }
    // Track lines
    for (let x = 4; x < 92; x += 4) {
      pixels[2][ox + x] = rgba(85, 51, 17);
      pixels[13][ox + x] = rgba(85, 51, 17);
    }
    // Blade
    for (let y = 3; y < 13; y++) {
      for (let x = 78; x < 90; x++) {
        pixels[y][ox + x] = rgba(170, 136, 68);
      }
    }
  }

  return createPNG(W, H, pixels);
}

// ---- Sprite: Platforms ----
// Log (32x16) x3 variants, Turtle surface (32x16), Turtle submerged (32x16) — arranged vertically: 32x96
function generatePlatformsSprite() {
  const W = 32, H = 96;
  const pixels = [];
  for (let y = 0; y < H; y++) {
    pixels[y] = [];
    for (let x = 0; x < W; x++) {
      pixels[y][x] = transparent();
    }
  }

  // Log variants at y=0, y=16, y=32 (3 rows)
  const logColors = [
    rgba(102, 68, 34),
    rgba(136, 102, 51),
    rgba(85, 59, 28),
  ];
  for (let i = 0; i < 3; i++) {
    const oy = i * 16;
    const col = logColors[i];
    for (let y = 2; y < 14; y++) {
      for (let x = 2; x < 30; x++) {
        pixels[oy + y][x] = col;
      }
    }
    // Texture lines
    for (let x = 8; x < 24; x += 4) {
      for (let y = 3; y < 13; y++) {
        pixels[oy + y][x] = rgba(136, 102, 51);
      }
    }
  }

  // Turtle surface at y=48
  const turtleOy = 48;
  for (let y = 2; y < 14; y++) {
    for (let x = 2; x < 30; x++) {
      pixels[turtleOy + y][x] = rgba(34, 136, 68);
    }
  }
  // Shell pattern
  for (let y = 5; y < 11; y++) {
    for (let x = 10; x < 22; x++) {
      pixels[turtleOy + y][x] = rgba(51, 170, 85);
    }
  }
  // Head
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy <= 4) {
        pixels[turtleOy + 8 + dy][28 + dx] = rgba(51, 170, 85);
      }
    }
  }

  // Turtle submerged at y=64
  const subOy = 64;
  for (let y = 3; y < 13; y++) {
    for (let x = 3; x < 29; x++) {
      pixels[subOy + y][x] = rgba(85, 102, 85);
    }
  }
  // Shell outline
  for (let y = 5; y < 11; y++) {
    for (let x = 10; x < 22; x++) {
      pixels[subOy + y][x] = rgba(68, 85, 68);
    }
  }

  // Ladybug at y=80
  const ladyOy = 80;
  // Body
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      if (dx * dx + dy * dy <= 36) {
        pixels[ladyOy + 8 + dy][16 + dx] = rgba(255, 51, 51);
      }
    }
  }
  // Spots
  for (let dy = -2; dy <= 0; dy++) {
    for (let dx = -2; dx <= 0; dx++) {
      if (dx * dx + dy * dy <= 2) {
        pixels[ladyOy + 5 + dy][13 + dx] = rgba(34, 34, 34);
      }
    }
  }
  // Head
  for (let dy = -2; dy <= 0; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy <= 4) {
        pixels[ladyOy + 1 + dy][16 + dx] = rgba(34, 34, 34);
      }
    }
  }

  return createPNG(W, H, pixels);
}

// ---- Sprite: Effects ----
// Death splash (32x32), Level complete star (32x32) — arranged: 64x32
function generateEffectsSprite() {
  const W = 64, H = 32;
  const pixels = [];
  for (let y = 0; y < H; y++) {
    pixels[y] = [];
    for (let x = 0; x < W; x++) {
      pixels[y][x] = transparent();
    }
  }

  // Death splash at x=0 — red flash with X mark
  for (let y = 4; y < 28; y++) {
    for (let x = 4; x < 28; x++) {
      pixels[y][x] = rgba(255, 0, 0, 128);
    }
  }
  // X mark
  for (let i = 4; i < 28; i++) {
    pixels[i][i] = rgba(255, 255, 255, 200);
    pixels[i][28 - i] = rgba(255, 255, 255, 200);
  }

  // Level complete star at x=32
  const cx = 48, cy = 16;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ox = Math.round(cx + Math.cos(angle) * 12);
    const oy = Math.round(cy + Math.sin(angle) * 12);
    pixels[oy][ox] = rgba(255, 204, 0);
  }
  // Fill star center
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (dx * dx + dy * dy <= 16) {
        pixels[cy + dy][cx + dx] = rgba(255, 204, 0);
      }
    }
  }

  // Splash particles at x=32, y=32+ (need more height)
  // Actually let's keep it simple — death splash + star is enough

  return createPNG(W, H, pixels);
}

// ---- Generate all ----

const outDir = join(__dirname);
writeFileSync(join(outDir, 'frog.png'), generateFrogSprite());
writeFileSync(join(outDir, 'vehicles.png'), generateVehiclesSprite());
writeFileSync(join(outDir, 'platforms.png'), generatePlatformsSprite());
writeFileSync(join(outDir, 'effects.png'), generateEffectsSprite());

console.log('Sprite sheets generated:');
console.log('  frog.png       — 32x128 (4 directions)');
console.log('  vehicles.png   — 192x16 (3 car variants, 2 truck variants, 1 bulldozer)');
console.log('  platforms.png  — 32x96 (3 log variants, turtle surface, turtle submerged, ladybug)');
console.log('  effects.png    — 64x32 (death splash, level complete star)');