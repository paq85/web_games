# Pac-Man

A standalone pixel-retro Pac-Man style arcade game built with HTML5 canvas, CSS, and vanilla JavaScript.

## Planned feature coverage

- Classic pellet-clearing maze gameplay
- Four ghosts with distinct chase behaviors
- Power pellets, frightened mode, and ghost score chaining
- Bonus fruits, level progression, high scores, and achievements
- Desktop keyboard and mobile touch controls
- Audio controls, accessibility options, and persistent settings
- Automated unit and headless browser tests

## Included modes and features

- Arcade mode with automatic level progression
- Practice mode with unlimited lives and adjustable pace
- Tutorial panel with guided practice start
- Attract/demo mode with instant takeover into a playable run
- Persistent high scores, cumulative stats, achievements, and theme preferences
- Alternate themes: classic, neon, and amber
- Settings for audio, visual effects, reduced flash, and control rebinding

## Local development

Install dependencies:

- `npm install`

Start the local server:

- `npm run start`

Run the test suite:

- `npm run test`

Run unit tests only:

- `npm run test:unit`

Run end-to-end tests only:

- `npm run test:e2e`

## Controls

Default keyboard bindings:

- Move up: `ArrowUp` / `W`
- Move down: `ArrowDown` / `S`
- Move left: `ArrowLeft` / `A`
- Move right: `ArrowRight` / `D`
- Confirm / select: `Enter` / `Space`
- Pause: `Escape`
- Mute: `M`

Touch support includes swipe movement, a directional pad overlay, and a visible pause button.

## Accessibility

The game is being implemented to support:

- Full keyboard operability
- Live region updates for score and critical events
- Reduced-motion and reduced-effects options
- Sound captions and visual feedback for audio cues
- High-contrast readable UI and 44px touch targets

Implemented highlights:

- Focusable gameplay canvas with `role="application"`
- Polite and assertive `aria-live` regions
- Keyboard-only access to menus, pause flow, and settings
- Touch controls with swipe input and large directional buttons
- Theme and reduced-effects options persisted in local storage

## Persistence

The game stores settings, high scores, achievements, and cumulative statistics in local storage. In-progress runs are intentionally not restored after a page reload.
