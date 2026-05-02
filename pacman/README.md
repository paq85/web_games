# Pacman Game

A classic Pacman arcade game with pixel-retro style, built with HTML5 Canvas and vanilla JavaScript. Navigate the maze, eat all the dots, and avoid four uniquely intelligent ghosts — all with procedural audio and full accessibility support.

## Play

- **Live demo:** [Play](https://paq85.github.io/web_games/pacman/)
- **Local:** Open [`index.html`](index.html) in any modern browser. No build tools or server required.

## Features

- **Classic maze navigation** with animated Pacman character
- **Four ghost opponents** with unique AI behaviors:
  - **Blinky** (Red) — Directly chases Pacman (aggressive)
  - **Pinky** (Pink) — Ambushes by targeting ahead of Pacman
  - **Inky** (Cyan) — Unpredictable, uses both Blinky and Pacman positions
  - **Clyde** (Orange) — Switches between chasing and retreating
- **Power pellets** that make ghosts vulnerable for bonus points (200 → 400 → 800 → 1600)
- **Bonus fruits** that appear periodically for extra points
- **Multiple difficulty levels** (Easy, Medium, Hard) with progressive challenge
- **Persistent high scores and statistics** saved across sessions
- **Responsive design** for desktop and mobile devices
- **Pixel-retro arcade presentation** with CRT-style visual effects
- **Procedural audio** — all sound effects and music generated with Web Audio API (no external files)
- **Settings** with audio/visual controls (volume, CRT overlay, screen shake, particles)
- **Tutorial mode** explaining controls and mechanics
- **Practice mode** with unlimited lives and no time pressure

## Controls

### Desktop (Keyboard)

| Action | Keys |
|--------|------|
| Move Up | ArrowUp / W |
| Move Down | ArrowDown / S |
| Move Left | ArrowLeft / A |
| Move Right | ArrowRight / D |
| Confirm / Select | Enter / Space |
| Pause | Escape |
| Mute Toggle | M |

### Mobile (Touch)

- Virtual joystick or swipe gestures for directional movement
- Tap to confirm/select in menus
- On-screen pause button during gameplay

## Accessibility

This game follows WCAG 2.1 AA standards:

- **Keyboard operability** — all functions accessible via keyboard alone
- **ARIA attributes** — canvas uses `role="application"` with descriptive `aria-label`
- **aria-live regions** — polite region for score changes, assertive region for critical events (life lost, game over)
- **Focus management** — game canvas is focusable and initially focused for keyboard users
- **prefers-reduced-motion** — animations and visual effects automatically disabled when system preference is set
- **High contrast** — clear visual distinction between Pacman, ghosts, dots, and walls
- **Reduced effects options** — toggles for CRT overlay, screen shake, and particle effects
- **Color independence** — essential information not conveyed by color alone
- **44px minimum touch targets** — all touch controls meet minimum size requirements
- **Visual feedback** — all important audio cues have corresponding visual indicators

## How to Run

```bash
# From the pacman directory
npx serve .
```

Then open http://localhost:3000/ in your browser.

## Testing

```bash
# Run unit tests
cd pacman
node tests/unit/game_logic.test.js
```

## Specification

See [`PACMAN_SPECIFICATION.md`](PACMAN_SPECIFICATION.md) for detailed product requirements, gameplay mechanics, accessibility features, and acceptance criteria.

## License

MIT — see [../LICENSE](../LICENSE) for details.
