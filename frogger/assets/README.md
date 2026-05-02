# Assets

Sprite sheet images used by the Frogger renderer. The renderer loads these
from `assets/` and falls back to procedural Canvas drawing if a sheet has
not yet loaded.

## Sprite Sheets

| File | Dimensions | Contents |
|------|-----------|----------|
| `frog.png` | 32×128 | 4 frog directions (up, right, down, left) stacked vertically |
| `vehicles.png` | 192×16 | 3 car variants, 1 bulldozer, 2 truck variants arranged horizontally |
| `platforms.png` | 32×96 | 3 log variants, turtle surface, turtle submerged, ladybug stacked vertically |
| `effects.png` | 64×32 | Death splash (left), level-complete star (right) |

## Regenerating

```bash
node assets/generate-sprites.js
```
