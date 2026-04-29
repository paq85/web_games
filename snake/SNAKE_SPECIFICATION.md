# SNAKE SPECIFICATION

## Overview

A modern take on the classic Snake arcade game. The player guides a growing snake across a grid, collecting food to increase score. The game ends when the snake collides with itself or the walls. Built as a standalone, responsive web app with no external dependencies.

## Core Gameplay

### Objective
Guide the snake to eat food items, growing longer with each one consumed. Survive as long as possible and achieve the highest score.

### Grid
- The game plays on a fixed-size grid rendered on an HTML canvas.
- Default grid: 20x20 cells.
- Cell size scales to fit the available viewport while maintaining aspect ratio.

### Snake
- Starts at the center of the grid with a length of 3 segments.
- Initial direction: right.
- Each segment occupies exactly one grid cell.
- The head is visually distinct from the body.

### Movement
- The snake moves one cell per game tick in the current direction.
- Direction changes are queued and applied at the next tick.
- The snake cannot reverse direction (e.g., cannot go left while moving right).

### Food
- One food item appears at a time on an empty random cell.
- When the snake's head occupies the same cell as food:
  - The snake grows by one segment.
  - Score increases (see Scoring).
  - A new food item spawns.

### Collision
- **Wall collision:** The game ends if the snake's head moves beyond the grid boundary.
- **Self collision:** The game ends if the snake's head occupies a cell already part of its body.

### Scoring
- Each food eaten awards points based on the current level.
- Base points: 10 per food.
- Level multiplier: `1 + floor(score / 100) * 0.5` (increments every 100 base points).
- Displayed score is the total accumulated points.

### Speed
- Base tick interval: 150ms.
- Speed increases with score: interval decreases by 2ms per food eaten, minimum 60ms.

## Game States

1. **Idle** - Initial screen with title, instructions, and "Start" prompt.
2. **Playing** - Active gameplay. Snake moves, food is collected, score updates.
3. **Paused** - Gameplay frozen. Overlay shows "Paused" and resume instruction.
4. **Game Over** - Final screen shows final score, high score, and restart prompt.

## Controls

### Keyboard
- **Arrow keys / WASD:** Change direction.
- **Space / Enter:** Start game, restart after game over.
- **P / Escape:** Pause / resume during gameplay.

### HUD Buttons
- **Mute button (speaker icon):** Toggle all sound on/off.

### Touch (Mobile)
- **Swipe:** Change direction (up, down, left, right).
- **Tap:** Start game, restart after game over.
- **Double-tap:** Pause / resume during gameplay.

### On-screen Buttons (Mobile)
- Directional pad (D-pad) appears on screens below 600px width.
- Pause button in the top-right corner.

## Visual Design

### Color Scheme
- Background: dark charcoal (#1a1a2e)
- Grid lines: subtle (#2a2a3e)
- Snake head: bright green (#00ff88)
- Snake body: gradient green fading to teal (#00cc6a -> #00aa55)
- Food: orange (#ff6b35) with subtle pulse animation
- Text: white (#ffffff) for primary, gray (#888888) for secondary

### Rendering
- HTML5 Canvas for game rendering.
- 60fps render loop with independent game tick timing.
- Smooth visual transitions for food pulse effect.

### Responsive Layout
- Canvas scales to fit available space while maintaining square aspect ratio.
- On screens below 600px, a D-pad overlay replaces keyboard controls.
- Score and controls UI adapt to available width.

## Persistent Data

### High Score
- Stored in `localStorage` under key `snake_high_score`.
- Persisted across sessions.
- Displayed on game over screen alongside current score.

## Technical Details

### Architecture
- Single `index.html` file with embedded CSS and JavaScript.
- No external dependencies or build step.
- Game logic separated into distinct modules within the file:
  - `GameState` - Manages state transitions and game flow.
  - `Snake` - Manages snake position, growth, and collision detection.
  - `Food` - Manages food placement and collection.
  - `Renderer` - Handles canvas drawing.
  - `InputHandler` - Processes keyboard, touch, and button input.
  - `ScoreManager` - Handles scoring, speed, and persistence.

### Game Loop
- `requestAnimationFrame` drives the render loop.
- Accumulated delta time determines when game ticks occur.
- Input is processed continuously; direction changes are queued for next tick.

### Audio
- Procedural sound effects and background music via the Web Audio API (no external files).
- All audio is generated inline to maintain the single-file architecture.

#### Sound Effects
- **Eat food** — short ascending chirp (three quick notes).
- **Game over** — descending buzz (four descending sawtooth tones).
- **Game start** — brief ascending arpeggio (four ascending square-wave notes).
- **Pause** — low single triangle tone.
- **Resume** — higher single triangle tone.

#### Background Music
- Simple looping bass melody plays during active gameplay.
- Stops when the game is paused or ends.
- Resumes when unpaused or restarted.
- Volume is kept low so it does not mask sound effects.

#### Mute Toggle
- Speaker icon button in the HUD toggles all audio (SFX + music).
- Icon switches between muted and unmuted states.
- Mute preference persists in `localStorage` under key `snake_audio_muted`.

#### Autoplay Policy
- Audio context is created/resumed on the first user gesture (key press, click, or touch).
- No audio plays before the user interacts with the page.

## Accessibility

### Keyboard Controls
- **Arrow keys / WASD:** Change snake direction.
- **Space / Enter:** Start game from idle screen, restart after game over.
- **P / Escape:** Pause and resume during active gameplay.
- All game actions are reachable via keyboard alone; no mouse interaction is required.

### ARIA Attributes
- The game canvas carries `role="application"`, `aria-label="Snake game"`, and `tabindex="0"` to establish it as the interactive focus target and convey its purpose to assistive technologies.

### Live Regions
- An `aria-live="polite"` region announces score changes after food is collected.
- An `aria-live="assertive"` region announces game state transitions (game started, paused, game over with final score) so screen reader users stay informed without manual navigation.

### Screen Reader Support
- Game state, score, and instructions are communicated through live regions and ARIA attributes.
- Overlay screens (idle, paused, game over) update the live region with relevant text so screen readers announce the current state and available actions.

### Focus Management
- The canvas is the sole focusable game element (`tabindex="0"`).
- Focus is retained on the canvas throughout gameplay; no focus traversal occurs during play.
- A visible focus indicator outlines the canvas when it receives keyboard focus.

### Reduced Motion
- When `prefers-reduced-motion: reduce` is detected, the food pulse animation and overlay fade animations are disabled.
- The game remains fully playable with static visuals for food and overlays.

### Touch Controls
- **Swipe:** Change direction (up, down, left, right).
- **Tap:** Start game, restart after game over.
- **Double-tap:** Pause / resume during gameplay.
- On-screen D-pad and pause button appear on narrow viewports for tap-based control.

### Touch Targets
- All interactive buttons (D-pad arrows, pause, mute) meet the 44px minimum touch target size for reliable finger activation.

## Running Locally

```bash
cd snake
npm run serve
# Open http://localhost:8080/snake/index.html
```

## Testing

### Automated Tests
- Headless Chrome e2e tests via Playwright covering:
  - Game start and basic movement
  - Food collection and score increase
  - Wall collision and game over
  - Self collision and game over
  - Pause/resume functionality
  - Touch/swipe controls
  - Responsive layout on mobile viewport
  - High score persistence
  - Mute toggle functionality and persistence

### Running Tests
```bash
cd snake
npm install
npx playwright test
```
