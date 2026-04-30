# FUSION

A 2048-inspired puzzle game with neon sci-fi theme. Manage energy levels inside a fusion reactor core with special tiles, reactive grid zones, grid mutations, power-ups, and a combo system.

## Features

- **Classic 4×4 sliding-merge gameplay** with 2 → 4 → 8 → … → 2048+ tile progression
- **Special tiles:** Wildcards (★), Bombs (💥), Shields (🛡), Multipliers (×2), Fusion Cores (⚡)
- **Grid zones:** Gravity Wells, Frozen Zones, Boost Zones, Swap Zones
- **Grid mutations:** Row/column shifts and quadrant rotations between moves
- **Power-ups:** Undo, Split, Nuke, Freeze, Swap, Stabilize
- **Combo system:** Streak multipliers and chain reactions
- **Game modes:** Classic, Endless, Challenge, Daily Puzzle
- **Progression:** Levels, achievements, persistent statistics
- **Neon sci-fi visuals** with particle effects, glow, and reactive animations
- **Synth-wave audio** with adaptive background music
- **In-game instructions** accessible from the main menu
- **Full accessibility** per WCAG 2.1 AA

## Controls

### Keyboard
| Action | Key(s) |
|--------|--------|
| Slide up | `ArrowUp` or `W` |
| Slide down | `ArrowDown` or `S` |
| Slide left | `ArrowLeft` or `A` |
| Slide right | `ArrowRight` or `D` |
| Pause | `Escape` or `P` |
| Mute | `M` |
| Undo | `Z` |
| Confirm | `Enter` or `Space` |

### Touch
- Swipe in direction to slide tiles
- Tap power-up slot then tap tile to target
- Double-tap to pause

### Mouse
- Click and drag to slide tiles
- Click power-up slot then click tile to target
- Right-click to pause

## Running Locally

```bash
cd fusion
npm start
# Open http://localhost:3000
```

Or with any static file server:

```bash
npx serve fusion
```

## Testing

```bash
cd fusion
npm test          # Unit tests
npm run test:e2e  # Headless Chrome acceptance tests
```

## Accessibility

- Full keyboard operability
- ARIA attributes on grid, cells, and HUD
- aria-live regions for score and game state announcements
- Focus management with visible focus indicators
- WCAG AA color contrast
- Tile values identifiable by number alone
- Reduced motion support via `prefers-reduced-motion`
- 44px minimum touch targets
- Usable at 200% zoom

## Browser Support

Chrome, Edge, Firefox, Safari (desktop and mobile). Responsive from 320px to 2560px+ width.
