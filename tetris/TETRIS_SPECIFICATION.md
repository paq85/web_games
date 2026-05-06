# Tetris-like Game Specification

## Overview

A modern Tetris-inspired block puzzle game with a neon aesthetic. Players rotate and drop falling tetromino blocks, forming complete horizontal lines to score points. The game features hold piece, ghost piece preview, next piece queue, multiple game modes, and automatic level progression with increasing speed. Built as a standalone, responsive web app with no external dependencies.

## Core Gameplay

### Objective
Clear lines by arranging falling tetromino blocks into complete horizontal rows. Survive as long as possible and achieve the highest score before blocks stack to the top of the playfield.

### Playfield
- Standard grid: 10 columns × 20 rows.
- Cell size scales to fit the available viewport while maintaining proper aspect ratio.
- Grid boundaries are visually distinct from the background.

### Tetromino Pieces
- Standard seven tetromino types: I, O, T, S, Z, J, L.
- Each piece is rendered in its traditional color with neon glow effects:
  - I: Cyan (#00f5ff)
  - O: Yellow (#ffe600)
  - T: Purple (#b84dff)
  - S: Green (#00ff88)
  - Z: Red (#ff3355)
  - J: Blue (#3388ff)
  - L: Orange (#ff8833)
- All pieces are composed of 4 connected unit blocks.
- Piece colors remain consistent across all appearances (active piece, ghost, hold, queue, locked).

### Spawn System
- Pieces spawn from the top center of the playfield.
- Random generation uses a **bag system** (7-bag randomizer): each bag contains exactly one of each tetromino type in randomized order, guaranteeing fair distribution.
- A new piece spawns immediately when the previous piece is locked.
- Spawn position is centered horizontally; I-piece spawns at column 4-5, O-piece at column 4-5, all others at column 4-5 with the pivot cell at column 4-5.

### Rotation
- All pieces support rotation via **Super Rotation System (SRS)** rules.
- Each piece has predefined wall kick tables for left and right rotations.
- Wall kicks attempt offsets in order; the first valid position is used.
- Rotation is instant (no animation) for responsive gameplay.
- O-piece rotation is a no-op (no visible change).

### Movement
- **Left/Right:** Move one column in the indicated direction. Blocked by walls or existing blocks.
- **Soft Drop:** Move down one cell. Awards 1 point per cell.
- **Hard Drop:** Instantly drop to the lowest valid position. Awards 2 points per cell dropped.
- **Gravity:** Pieces descend automatically at the current speed.
- **Dash:** When moving left or right while a piece is falling, the piece moves one cell down instantly instead of waiting for the next gravity tick.

### Hold Piece
- Player can store the current piece in the hold slot.
- The next piece in the queue spawns when hold is activated.
- Holding the same piece again swaps it back with the current piece.
- Hold slot starts empty on the first piece of each game.
- Hold can only be used once per piece lock (reset flag when a piece locks).
- The held piece is visible in the hold display area.

### Ghost Piece
- A semi-transparent preview (opacity 30%) shows where the current piece will land if dropped straight down.
- Ghost piece follows the current piece's horizontal position and rotation.
- Ghost piece respects all block and floor collisions.

### Next Piece Queue
- Displays the next 5 upcoming pieces in the queue.
- Queue updates as pieces are consumed.
- Visual preview of each piece in its correct color.

### Line Clear
- When a horizontal row is fully occupied, it is cleared.
- All rows above the cleared row shift down by one cell.
- Multiple lines cleared simultaneously count as multi-line clears.
- Line clear animation: a brief flash/fade effect (200ms) before rows disappear.

### Scoring

#### Points
- **Soft drop:** 1 point per cell dropped.
- **Hard drop:** 2 points per cell dropped.
- **Line clears (base, before level multiplier):**
  - 1 line: 40 × (level + 1)
  - 2 lines: 100 × (level + 1)
  - 3 lines: 300 × (level + 1)
  - 4 lines (Tetris): 1200 × (level + 1)

#### Combo System
- Consecutive line clears (clearing lines on consecutive piece locks) build a combo.
- Combo bonus: `combo_count × 50 × (level + 1)` added to the score.
- Combo resets if a piece locks without clearing any lines.
- Combo counter is displayed during active combos.

### Level Progression
- Level increases by 1 for every 10 lines cleared.
- Maximum level: 30 (speed caps at level 30).
- Speed formula (in milliseconds): `drop_delay = max(16, 800 - (level * 25))`
  - Level 0: 800ms per drop
  - Level 1: 775ms per drop
  - Level 29: 85ms per drop
  - Level 30: 16ms per drop (maximum speed)
- Level is displayed on the HUD.

### Game Over
- A piece spawns. If no valid position exists for the piece (blocked from above), the game ends.
- Game over screen displays:
  - Final score
  - Level reached
  - Lines cleared
  - High score
  - Restart prompt

## Game States

1. **Title Screen** — Game title, mode selection prompts, and start instructions.
2. **Mode Select** — Choose between Classic, Speed (Ultra), or Marathon mode.
3. **Playing** — Active gameplay. Pieces fall, player manipulates blocks, lines clear.
4. **Paused** — Gameplay frozen. Overlay shows "Paused" and resume instruction.
5. **Game Over** — Final stats, high score comparison, and restart prompt.

## Game Modes

### Classic Single-Player
- Standard Tetris gameplay.
- Normal starting speed (Level 0, 800ms drop delay).
- Level progression based on line clears.
- Game ends when the playfield fills.

### Speed Mode (Ultra)
- Starts at Level 10 (550ms drop delay).
- Speed increases 2× faster: `drop_delay = max(16, 550 - (level * 50))`.
- Score multiplier: all points × 1.5.
- Designed for fast-paced, high-intensity play.
- Displayed differently (e.g., "ULTRA" mode indicator).

### Marathon (Endless)
- Standard speed progression.
- No game over condition from stack overflow.
- When blocks reach the top, the top 5 rows are removed to continue play (with a penalty: score reduced by 100 × current level).
- Score is the only goal — play as long as possible.
- "Marathon" indicator on HUD.
- Tracks survival time as a secondary stat.

## Controls

### Keyboard
- **Left / Right arrows:** Move piece left / right.
- **Up arrow:** Rotate piece clockwise.
- **Down arrow:** Soft drop (move down faster).
- **Space:** Hard drop (instant drop to bottom).
- **C (or Z):** Rotate piece counter-clockwise.
- **X (or Shift):** Hold piece.
- **P / Escape:** Pause / resume.
- **R:** Restart (on game over screen).
- **M:** Toggle mute.

### Touch (Mobile)
- **Swipe left/right:** Move piece.
- **Swipe down:** Soft drop.
- **Flick down (fast swipe):** Hard drop.
- **Tap:** Rotate piece clockwise.
- **Long press (500ms):** Rotate counter-clockwise.
- **Double-tap:** Hold piece.
- **Swipe up:** Pause / resume.

### On-Screen Controls (Mobile)
- On screens below 600px, on-screen touch controls appear:
  - Left / Right / Down / Rotate buttons
  - Hard drop button
  - Hold button
  - Pause button
- Controls are positioned around the playfield for comfortable thumb reach.
- All touch targets meet 44px minimum size requirement.

## Visual Design

### Neon Color Scheme
- Background: deep dark purple (#0a0a1a)
- Grid lines: subtle (#1a1a3a)
- Playfield border: bright neon outline (#4040ff)
- Text: white (#ffffff) for primary, light gray (#cccccc) for secondary
- HUD background: semi-transparent dark (#1a1a2e with 80% opacity)
- Neon glow effects on active piece, line clears, and key UI elements

### Rendering
- HTML5 Canvas for game rendering.
- 60fps render loop with independent game tick timing.
- Neon glow effects using canvas shadowBlur.
- Line clear animation: white flash fading to transparent.
- Active piece has a subtle glow; ghost piece is semi-transparent with no glow.

### Responsive Layout
- Canvas scales to fit available space while maintaining 10:20 (1:2) aspect ratio for the playfield.
- Side panels (hold, queue, score) adapt to available space.
- On narrow viewports (<600px):
  - Side panels move below the playfield
  - On-screen controls appear
  - Font sizes adjust for readability
- Layout is usable on phones, tablets, laptops, and desktops.

## Audio

### Sound Effects
- **Line clear:** ascending chime (bright, celebratory).
- **Tetris (4-line clear):** extended fanfare (longer, more triumphant).
- **Hard drop:** short low thud.
- **Soft drop:** subtle tick per cell.
- **Hold:** quick swap sound.
- **Rotate:** soft click.
- **Game over:** descending tone sequence.
- **Pause/Resume:** single tone confirmation.

### Background Music
- Neon-themed electronic loop during active gameplay.
- Slower ambient loop during menus/title screen.
- Music stops when paused or game over.
- Volume kept low to not mask sound effects.

### Mute Toggle
- Button in the HUD toggles all audio (SFX + music).
- Mute preference persists in `localStorage`.
- Audio context resumes on first user gesture (autoplay policy compliance).

## Persistent Data

### High Score
- Stored in `localStorage` under key `tetris_high_score`.
- Persisted across sessions.
- Displayed on game over screen.

### Settings
- Mute state stored in `localStorage` under key `tetris_audio_muted`.
- Last selected game mode stored for convenience.

## Accessibility

### Keyboard Controls
- All game actions are accessible via keyboard alone.
- No mouse interaction is required for any game function.

### ARIA Attributes
- The game canvas carries `role="application"`, `aria-label="Tetris game"`, and `tabindex="0"`.

### Live Regions
- `aria-live="polite"` region announces score updates and line clears.
- `aria-live="assertive"` region announces game state transitions (game started, paused, game over with final score and level).

### Screen Reader Support
- Game state, score, level, and line count communicated through live regions.
- Game over screen announces final statistics.

### Focus Management
- Canvas is the primary focusable element (`tabindex="0"`).
- Focus remains on canvas during gameplay.
- Visible focus outline when tab-navigated.

### Reduced Motion
- When `prefers-reduced-motion: reduce` is detected:
  - Line clear flash animation is disabled
  - Neon glow effects are minimized
  - Piece spawn animations are disabled
- Game remains fully functional.

### Touch Targets
- All on-screen buttons meet 44px minimum touch target size.
- Adequate spacing between controls to prevent accidental activation.

### Color Independence
- Piece shapes are distinguishable beyond color alone (shape geometry is sufficient).
- Score and HUD information not conveyed by color alone.
- Sufficient contrast ratio for all text and interactive elements.

## Technical Details

### Architecture
- Single `index.html` file with embedded CSS and JavaScript.
- No external dependencies or build step.
- Game logic organized into distinct modules:
  - `GameState` — Manages state transitions and game flow.
  - `Playfield` — Grid management, collision detection, line clearing.
  - `Tetromino` — Piece definition, rotation, wall kicks.
  - `BagRandomizer` — 7-bag piece randomization.
  - `ScoreManager` — Scoring, combos, level progression, persistence.
  - `Renderer` — Canvas drawing, neon effects, animations.
  - `InputHandler` — Keyboard, touch, and button input processing.
  - `AudioManager` — Web Audio API sound effects and music.

### Game Loop
- `requestAnimationFrame` drives the render loop.
- Accumulated delta time determines gravity ticks.
- Input is processed continuously; movements are applied immediately.
- Dash mechanic: horizontal movement triggers immediate downward movement.

## Running Locally

```bash
cd tetris
npx http-server -p 8080
# Open http://localhost:8080/index.html
```

## Testing

### Automated Tests
- Headless Chrome e2e tests via Playwright covering:
  - Game start and piece spawning
  - Piece movement (left, right, rotate)
  - Hard drop and soft drop
  - Line clearing and score increase
  - Hold piece functionality
  - Ghost piece visibility
  - Next piece queue display
  - Level progression
  - Game over condition
  - Pause/resume
  - Touch controls on mobile viewport
  - Speed mode (ultra) behavior
  - Marathon mode row removal
  - High score persistence
  - Mute toggle
  - Responsive layout

### Running Tests
```bash
cd tetris
npm install
npx playwright test
```
