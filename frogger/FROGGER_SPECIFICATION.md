# Frogger Specification

## Overview

A faithful recreation of the classic Frogger arcade game. The player guides a frog across a busy road and treacherous river to reach one of five home slots at the top of the screen. Built as a standalone, responsive web app with HTML5 Canvas and vanilla JavaScript — no external dependencies or build tools required.

---

## Core Gameplay

### Objective

Guide the frog from the bottom of the screen to the top, crossing a road full of vehicles and a river with moving logs and turtles, to reach an empty home slot. Fill all five home slots to complete a level.

### Playfield

- The game plays on a grid rendered on an HTML5 Canvas.
- Grid dimensions: **15 columns x 13 rows**.
- Cell size scales to fit the available viewport while maintaining proportions.
- The playfield is divided into distinct zones (bottom to top):

| Row(s) | Zone | Description |
|--------|------|-------------|
| 13 | **Spawn** | Safe starting area. Frog resets here after death. |
| 12 | **Road** | Cars moving right |
| 11 | **Road** | Trucks moving left |
| 10 | **Road** | Cars moving right |
| 9 | **Road** | Bulldozers moving left |
| 8 | **Safe Mid-Zone** | Brief safe area between road and river |
| 7 | **River** | Logs (3-tile) moving right |
| 6 | **River** | Turtles (3-tile groups) moving left |
| 5 | **River** | Logs (2-tile) moving right |
| 4 | **River** | Turtles (2-tile groups) moving left |
| 3 | **River** | Logs (2-tile) moving right |
| 2 | **Safe Zone** | Narrow strip above river, below home |
| 1 | **Home Slots** | Five goal positions (2 tiles each, with gaps between) |

### Frog

- Starts at the center of row 13 (column 7).
- Moves one grid cell per input (up, down, left, right).
- Movement is **discrete** — each input moves exactly one cell.
- The frog cannot move beyond the playfield boundaries.
- The frog's sprite direction changes to face the last movement direction.
- **On a platform:** The frog rides the conveyor (log/turtle) between hops. Each hop resets the frog to the center of its grid cell, so movement is always exactly one cell relative to the platform. The frog can hop freely toward the edge of the platform.
- **Leaving the river:** When the frog hops from a river row to a safe zone or home row, the conveyor offset is cleared so the frog lands cleanly in its grid cell without sliding.
- **Spawn cooldown:** After a death or reaching home, there is a 1.5-second cooldown before the frog can be moved, giving the player time to see the reset and lives update.

### Road Crossing

- Vehicles move horizontally across lanes at constant speeds.
- Each lane has a distinct direction (alternating left/right), speed, and vehicle type.
- **Vehicle types:**
  - **Car** — occupies 1 tile, moderate speed
  - **Truck** — occupies 2 tiles, slower speed
  - **Bulldozer** — occupies 3 tiles, slow speed
- Vehicles wrap around: when one edge goes off-screen, it reappears from the opposite edge.
- Contact with any vehicle results in instant death.

### River Crossing

- The river contains moving platforms (logs and turtles) that carry the frog horizontally.
- **Platform types:**
  - **Log** — static platform, carries the frog at the lane's speed
  - **Turtle** — carries the frog but can dive underwater
- When the frog moves onto a platform, it rides with that platform's movement.
- When the frog moves off a platform onto water, it drowns (instant death).
- **Conveyor mechanics:** While on a platform, the frog drifts horizontally with the platform between hops. Each hop resets the frog's sub-cell offset to zero, centering it in the new grid cell. This ensures every hop is exactly one cell and the frog can hop freely toward the edge of the platform. When the frog hops off the river (to a safe zone or home row), the conveyor offset is cleared so the frog lands cleanly without sliding.
- **Turtle diving:** Turtles periodically submerge (every 3 seconds, on alternating lanes). If the frog is riding a turtle when it dives, the frog dies.
- If a platform carries the frog off the left or right edge of the screen, the frog dies.

### Home Slots

- Five home slots exist on row 1, each 2 tiles wide, separated by 1-tile gaps.
- Positions: columns 1-2, 4-5, 7-8, 10-11, 13-14.
- When the frog enters an **empty** home slot:
  - The slot fills with a frog icon.
  - Score increases by 50 points.
  - The frog resets to the spawn point.
- When the frog enters an **occupied** home slot or a gap between slots — the frog dies.
- Landing on row 1 outside any home slot — the frog dies.

### Bonus Items

- **Ladybugs** may appear on log platforms in the river (row 7).
- Ladybugs bob up and down on the log.
- Collecting a ladybug awards 200 bonus points.
- Ladybugs spawn randomly on logs with a low probability.
- **Bonus goals** may appear in empty home slots, awarding extra points (200) when reached.

### Lives

- The player starts with **3 lives**.
- Each death consumes one life.
- Lives are displayed as frog icons in the HUD.
- When all lives are lost, the game ends.

### Scoring

| Action | Points |
|--------|--------|
| Moving up one row (progress) | 10 |
| Reaching an empty home slot | 50 |
| Collecting a ladybug | 200 |
| Reaching a bonus goal | 200 |
| Completing all 5 home slots | 1000 |
| Time bonus (remaining time on death/reset) | 1 per 10 ticks remaining |

### Levels and Progression

- After filling all 5 home slots, the next level begins.
- Home slots reset to empty.
- All vehicles, logs, and turtles move **faster** (speed increases by 10% per level).
- The countdown timer duration **decreases** by 2 seconds per level (minimum 15 seconds).
- Turtle diving becomes more frequent at higher levels.
- No maximum level — difficulty scales indefinitely.

### Timer

- A countdown timer applies to each frog attempt (from spawn to death or home).
- Default timer: **30 seconds**.
- Timer decreases by 2 seconds per level (minimum 15 seconds).
- Timer is displayed as a horizontal bar at the bottom of the HUD.
- When the timer reaches zero, the frog dies.
- Timer resets when the frog reaches a home slot or dies.

---

## Game States

1. **Idle** — Initial screen with title, animated frog, score display, and "Press to Start" prompt.
2. **Playing** — Active gameplay. Frog moves, obstacles traverse, timer counts down.
3. **Paused** — Gameplay frozen. Overlay shows "PAUSED" and resume instruction.
4. **Death** — Brief death animation (frog splashes/explodes). After animation, frog resets to spawn.
5. **Level Complete** — All home slots filled. Brief celebration, then next level starts.
6. **Game Over** — No lives remaining. Shows final score, high score, and restart prompt.

---

## Controls

### Keyboard

| Action | Key |
|--------|-----|
| Move frog up | `ArrowUp` or `W` |
| Move frog down | `ArrowDown` or `S` |
| Move frog left | `ArrowLeft` or `A` |
| Move frog right | `ArrowRight` or `D` |
| Start game / restart | `Space` or `Enter` |
| Pause / resume | `P` or `Escape` |
| Mute toggle | `M` |

### Touch (Mobile)

- **Swipe** — Move frog in swipe direction (up, down, left, right).
- **Tap** — Start game, restart after game over, confirm in menus.
- **Double-tap** — Pause / resume during gameplay.

### On-screen Controls (Mobile)

- **Directional pad (D-pad)** appears on screens below 600px width.
- D-pad has four directional arrows (up, down, left, right) and a central pause button.
- **Mute button** (speaker icon) in the HUD corner.
- All touch targets meet the **44px minimum** size.

---

## Visual Design

### Color Scheme

| Element | Color |
|---------|-------|
| Background (road) | Dark asphalt (#2d2d2d) |
| Background (river) | Deep blue (#1a3a5c) |
| Background (safe zones) | Dark green (#1a3a1a) |
| Home zone | Moss green (#2a4a2a) |
| Frog | Bright green (#00ff88) |
| Cars | Red (#ff4444), Yellow (#ffcc00), Blue (#4488ff) |
| Trucks | Orange (#ff6633), Purple (#8844cc) |
| Bulldozers | Brown (#885522) |
| Logs | Brown (#664422) |
| Turtles (surface) | Green (#33aa55) |
| Turtles (submerged) | Shell gray (#556655) |
| Ladybugs | Red with black spots |
| Timer bar (safe) | Green (#00ff88) |
| Timer bar (danger) | Red (#ff4444) |
| HUD text | White (#ffffff) primary, Gray (#888888) secondary |
| Death effect | Red flash with particle splash |

### Rendering

- HTML5 Canvas 2D for all game rendering.
- 60fps render loop via `requestAnimationFrame`.
- Independent game tick timing for obstacle movement (separate from render rate).
- Sprite sheets for frog (4 directions), vehicles, logs, turtles, and death effect.
- Smooth platform movement interpolated between grid positions.
- Death animation: brief splash/explode effect before reset.
- Level complete: home slots fill with animated frog icons.

### Responsive Layout

- Canvas scales to fit available viewport width, maintaining playfield proportions.
- HUD (score, lives, timer, level) positioned above the canvas.
- On screens below 600px, D-pad overlay appears below the canvas.
- Layout functional at 200% zoom.

---

## Audio

### Sound Effects (Web Audio API, procedural — no external files)

| Event | Sound |
|-------|-------|
| Frog hop | Short ascending blip |
| Frog death (road) | Crunch — descending noise burst |
| Frog death (river) | Splash — water-like filtered noise |
| Turtle dive | Subtle bubbling sound |
| Home slot reached | Ascending chime |
| Ladybug collected | Bright trill |
| Level complete | Triumphant ascending arpeggio |
| Game over | Descending mournful tones |
| Timer warning (last 5s) | Pulsing beep |
| Pause | Low single tone |
| Resume | Higher single tone |

### Background Music

- Simple looping bass melody during active gameplay.
- Different melody for idle/menu screen.
- Stops when paused or game over.
- Volume kept low to not mask sound effects.

### Mute Toggle

- Speaker icon button in the HUD toggles all audio (SFX + music).
- Icon switches between muted/unmuted states.
- Mute preference persists in `localStorage` under key `frogger_audio_muted`.

### Autoplay Policy

- Audio context is created/resumed on the first user gesture (key press, click, or touch).
- No audio plays before the user interacts with the page.

---

## Persistent Data

### High Score

- Stored in `localStorage` under key `frogger_high_score`.
- Persisted across sessions.
- Displayed on game over screen alongside current score.

### Settings

- Mute state persisted in `localStorage` under key `frogger_audio_muted`.

---

## Technical Details

### Architecture

- Single `index.html` file with embedded CSS and JavaScript.
- No external dependencies or build step.
- Game logic organized into distinct modules:
  - **GameState** — Manages state transitions (idle, playing, paused, death, game over, level complete).
  - **Frog** — Player position, movement validation, direction tracking, death state.
  - **Lane** — Lane definitions, obstacle types, speeds, directions.
  - **Obstacle** — Base class for vehicles, logs, turtles. Handles movement, wrapping, collision bounds.
  - **ObstacleSpawner** — Manages obstacle pools per lane, spawning, and recycling.
  - **CollisionDetector** — AABB collision checks between frog and obstacles.
  - **RiverSystem** — Tracks which platform the frog rides, applies conveyor movement, checks drowning.
  - **TurtleDiveSystem** — Manages turtle dive cycles per lane.
  - **HomeSlots** — Tracks filled/empty state of the 5 home positions.
  - **Timer** — Countdown timer with visual bar rendering.
  - **Scoring** — Score tracking, level progression, high score persistence.
  - **Renderer** — Canvas drawing for all game elements, HUD, overlays.
  - **InputHandler** — Keyboard, touch, swipe, and on-screen button processing.
  - **AudioManager** — Web Audio API sound effects and music.
  - **BonusSystem** — Ladybug spawning on logs, bonus goal spawning in home slots.

### Game Loop

```
requestAnimationFrame drives the render loop.
Accumulated delta time determines game ticks.
Each tick:
  1. Process input (frog movement, with cooldown between inputs and spawn cooldown)
  2. Move all obstacles by their speed * delta
  3. Wrap obstacles that go off-screen
  4. Apply conveyor movement (if frog on platform)
  5. Update turtle dive cycles
  6. Check collisions (frog vs vehicles)
  7. Check river safety (frog on platform or drowning)
  8. Check home slot arrival
  9. Update spawn cooldown
  10. Update timer
  11. Update bonus items (ladybugs, bonus goals)
  12. Render frame
```

**State transitions:** When the death animation completes and the game transitions back to `PLAYING`, the game loop continues via `requestAnimationFrame`. The same applies when a level completes and transitions to the next level.

### Input Cooldown

- A brief cooldown (150ms) between frog inputs prevents accidental double-moves.
- During the death animation, all input is blocked.
- **Spawn cooldown (1.5s):** After the frog resets (from death or reaching home), movement input is blocked for 1.5 seconds. This gives the player time to see the reset and the updated lives display. Progress tracking (`lowestRow`) is also reset so the frog can earn progress points on the next attempt.

---

## Accessibility

### Keyboard Controls

- All gameplay actions accessible via keyboard alone.
- Arrow keys and WASD for frog movement.
- Space/Enter for start/restart.
- P/Escape for pause/resume.
- M for mute toggle.

### ARIA Attributes

- The game canvas carries `role="application"`, `aria-label="Frogger game — use arrow keys or WASD to move the frog"`, and `tabindex="0"`.

### Live Regions

- An `aria-live="polite"` region announces score changes and frog progress.
- An `aria-live="assertive"` region announces game state transitions (game started, frog died, home reached, level complete, game over with final score).

### Screen Reader Support

- Game state, score, lives, and level are communicated through live regions.
- Overlay screens (idle, paused, game over) update the live region with current state and available actions.

### Focus Management

- The canvas is the sole focusable game element (`tabindex="0"`).
- Focus is retained on the canvas throughout gameplay.
- A visible focus indicator outlines the canvas when it receives keyboard focus.

### Reduced Motion

- When `prefers-reduced-motion: reduce` is detected:
  - Death animation is simplified (no particle splash).
  - Ladybug bobbing animation is disabled.
  - Timer bar transition is instant instead of animated.
  - Overlay fade animations are removed.

### Touch Controls

- Swipe gestures for frog movement.
- Tap for start/restart/confirm.
- Double-tap for pause/resume.
- On-screen D-pad with four directional arrows and pause button on narrow viewports.

### Touch Targets

- All interactive buttons (D-pad arrows, pause, mute) meet the 44px minimum touch target size.

### Color Contrast

- High contrast between frog, vehicles, platforms, and backgrounds.
- Essential gameplay information is not conveyed by color alone (vehicle shapes differ, platform types have distinct visual patterns).

---

## Testing

### Automated Tests

- Unit tests via Vitest covering:
  - Frog movement and boundary validation
  - Vehicle collision detection
  - River safety (on platform vs drowning)
  - Turtle diving mechanics
  - Home slot logic (empty, occupied, gap)
  - Scoring calculations
  - Timer countdown and expiration
  - Level progression (speed increase, timer decrease)
  - Obstacle wrapping
  - Conveyor movement application
  - Bonus item spawning and collection

- Headless Chrome acceptance tests via Playwright covering:
  - Game start from idle screen
  - Frog movement in all four directions (keyboard)
  - Frog movement via swipe (touch)
  - Vehicle collision and death animation
  - River drowning and death animation
  - Turtle diving and death
  - Platform riding (conveyor movement)
  - Screen-edge death (carried off by platform)
  - Home slot arrival and score increase
  - Level completion (filling all 5 slots)
  - Timer expiration and death
  - Pause/resume functionality
  - Game over after losing all lives
  - High score persistence across sessions
  - Mute toggle functionality and persistence
  - On-screen D-pad visibility on mobile viewport
  - Responsive layout at various viewport sizes
  - Reduced motion support

### Running Tests

```bash
cd frogger
npm install
npm run test          # Unit tests
npm run test:e2e      # Acceptance tests
npm run test:all      # Both
```

---

## Future Considerations

The following features are not required by this specification but may be considered in future iterations:

1. Multiple frog characters (skins) unlocked by score milestones
2. Additional obstacle types (motorcycles, snakes in home zone)
3. Power-ups (invincibility shield, speed boost, extra life)
4. Multiplayer mode (two frogs competing for home slots)
5. Endless mode with procedurally generated lanes
6. Achievement system (first home, perfect level, high score milestones)
7. Gamepad/controller support
8. Day/night cycle affecting visibility and obstacle patterns
