# Pong — Pixel Retro Edition

A polished Pong arcade game for desktop web browsers with pixel-retro presentation.

## Features

- Local two-player on a shared keyboard
- Player-versus-AI with multiple difficulty tiers
- Persistent player settings and cumulative match statistics
- Sound effects and music
- Configurable gameplay, audio, visual, and accessibility settings

## Play

Open `index.html` in a modern browser. No build tools required.

## Controls

- **W / S** — Player 1
- **↑ / ↓** — Player 2
- **ESC** — Pause
- **M** — Mute

## Running Locally

```bash
npm install
npm run dev
```

Or serve the files statically:

```bash
npm run serve
```

Then open `http://localhost:8080` in your browser.

## Testing

Run the unit test suite:

```bash
npm test
```

Run the acceptance (E2E) tests against headless Chromium:

```bash
npm run test:acceptance
```

Run both:

```bash
npm run test:all
```

## Accessibility

The game includes the following accessibility features:

- **Keyboard controls** — Full gameplay and menu navigation via keyboard. Player 1 uses `W`/`S`, Player 2 uses `ArrowUp`/`ArrowDown`, `Enter`/`Space` confirms selections, `Escape` pauses, and `M` toggles mute.
- **ARIA attributes** — The game canvas carries `role="application"` and a descriptive `aria-label` so screen readers identify the interactive region.
- **aria-live regions** — Two screen-reader-only regions (`aria-live="polite"` and `aria-live="assertive"`) announce score changes, game state transitions, and other important events.
- **Focus management** — The canvas is focusable (`tabindex="0"`) and receives focus on load so keyboard-only users can begin playing immediately.
- **prefers-reduced-motion** — When the user's OS-level reduced-motion preference is detected, visual effects such as screen shake and animations are automatically disabled.
- **Touch support** — On mobile devices, touch the left half of the screen to control Player 1's paddle and the right half to control Player 2's paddle.

## Credits

This game was created by **Qwen 3.6 27b**.
