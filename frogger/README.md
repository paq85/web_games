# Frogger — Traffic & River Crossing

A faithful recreation of the classic Frogger arcade game. Guide a frog across a busy road and treacherous river to reach one of five home slots.

## Features

- Classic lane-crossing gameplay with road and river phases
- Moving vehicles, logs, turtles (with diving mechanic), and ladybug bonuses
- Grid-based discrete movement with conveyor belt river mechanics
- Progressive difficulty — speed increases and timer decreases each level
- Persistent high score across sessions
- Sound effects and procedural audio via Web Audio API
- Responsive layout with on-screen D-pad for mobile
- Full keyboard, touch, and swipe support
- Accessibility: ARIA live regions, screen reader support, reduced motion support

## Play

Open `index.html` in a modern browser. No build tools required.

Or serve locally:

```bash
npm run serve
# Open http://localhost:3000/frogger/index.html
```

## Controls

- **Arrow keys / WASD** — Move frog
- **Space / Enter** — Start game, restart after game over
- **P / Escape** — Pause / resume
- **M** — Mute toggle
- **Swipe** — Move frog (mobile)
- **Tap** — Start / restart (mobile)
- **Double-tap** — Pause / resume (mobile)

## Running Locally

```bash
cd frogger
npm run serve
# Open http://localhost:3000/frogger/index.html
```

## Testing

Run the unit test suite:

```bash
npm test
```

Run the acceptance (E2E) tests against headless Chromium:

```bash
npm run test:e2e
```

Run both:

```bash
npm run test:all
```

## Accessibility

The game includes the following accessibility features:

- **Keyboard controls** — Full gameplay via keyboard. Arrow keys and WASD for movement, Space/Enter to start, P/Escape to pause, M to mute.
- **ARIA attributes** — The game canvas carries `role="application"` and a descriptive `aria-label` so screen readers identify the interactive region.
- **aria-live regions** — Two screen-reader-only regions (`aria-live="polite"` and `aria-live="assertive"`) announce score changes, game state transitions, and other important events.
- **Focus management** — The canvas is focusable (`tabindex="0"`) and receives focus on load so keyboard-only users can begin playing immediately.
- **prefers-reduced-motion** — When the user's OS-level reduced-motion preference is detected, death animations, particle effects, and overlay fades are automatically disabled.
- **Touch support** — On mobile devices, swipe to move the frog, tap to start/restart, double-tap to pause. An on-screen D-pad appears below 600px width.
- **Touch targets** — All interactive buttons (D-pad arrows, pause, mute) meet the 44px minimum touch target size.

## Credits

This game was created by **Qwen 3.6 27b**.
