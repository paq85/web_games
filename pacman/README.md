# Pacman Arcade

A self-contained Pacman-like arcade game built with vanilla JavaScript, HTML5 canvas, and a tiny Node-based static server.

## Run locally

From the `pacman/` directory:

- `npm run start` — start the local HTTP server
- open `http://127.0.0.1:4173`

## Tests

- `npm run test:unit` — run the Node unit tests
- `npm run test:e2e` — run the headless Chromium acceptance tests
- `npm run test` — run both suites

## Controls

### Keyboard

- Move: Arrow keys or WASD
- Confirm/select: Enter or Space
- Pause: Escape
- Mute: M

### Touch

- Use the on-screen D-pad or swipe on the canvas to move
- Tap the touch pause button to pause or resume during play

## Accessibility

- Canvas is focusable and labeled for assistive technologies
- Live regions announce score changes and key events
- Reduced-motion and reduced-effects settings are available
- Touch controls are large enough for mobile use
- All menus are usable from the keyboard

## Notes

- Settings and scores are saved locally in the browser.
- The game opens to the main menu instead of resuming a partial run.
- A test-only API is exposed when the page is opened with `?test=1` for deterministic acceptance coverage.
