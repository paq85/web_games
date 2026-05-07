# Minesweeper Game Specification

> **Original request:** "create a minesweaper inspider game specification"
> **User clarifications:**
> - Game type: Classic Minesweeper
> - Tech stack: Multi-file project (separate HTML/CSS/JS with Node.js tooling)

## Overview

A classic Minesweeper puzzle game where players reveal cells on a grid, avoiding hidden mines. Numbered cells indicate how many mines are adjacent, allowing logical deduction of safe cells. Features multiple difficulty levels, timer, mine counter, flagging, chord clicking, first-click safety, and recursive cell revealing. Built as a responsive, multi-file web app with automated test coverage.

## Core Gameplay

### Objective

Reveal all non-mine cells on the grid without detonating any mine. Use numbered clues to logically deduce mine locations, mark them with flags, and clear the board efficiently.

### Grid

- The game board is a rectangular grid of cells.
- Each cell is either:
  - **Empty** — contains no mine and shows a number (0-8) indicating adjacent mines, or blank if 0.
  - **Mine** — contains a hidden mine. Revealing it ends the game.
- Cell states:
  - **Hidden** — unrevealed, appears as a covered cell.
  - **Revealed** — shows its number or blank (empty). Cannot be interacted with further.
  - **Flagged** — marked by the player as a suspected mine.
  - **Question-marked** — marked with a question mark (uncertain). Available when Question Mode is enabled.
  - **Misflagged** — shown after game over when a flag was placed on a non-mine cell.

### Difficulty Levels

| Difficulty | Columns | Rows | Mines | Approx. Density |
|-----------|---------|------|-------|-----------------|
| Beginner | 9 | 9 | 10 | ~12% |
| Intermediate | 16 | 16 | 40 | ~16% |
| Expert | 30 | 16 | 99 | ~21% |
| Custom | User-defined (see below) | | | |

#### Custom Difficulty
- Player can set: columns (5-50), rows (5-30), and mine count (1 up to max allowed by board size).
- Max mines = total cells - 9 (ensures at least a 3x3 safe area around first click).
- Custom settings persist in `localStorage`.

### Mine Placement

- Mines are placed **after the first click** (not at game start).
- The first click and all its adjacent cells are guaranteed to be mine-free.
- For empty-cell reveals (cascade), the expanded safe zone includes all cells that will auto-reveal from the first click.
- Mines are randomly distributed among the remaining cells.
- This guarantees the first click always reveals at least one empty cell, starting a cascade.

### Cell Revealing

- **Single click** on a hidden cell reveals it.
  - If the cell contains a mine → **game over (loss)**.
  - If the cell has a number > 0 → shows the number.
  - If the cell is blank (0 adjacent mines) → **recursive reveal**: all adjacent cells are automatically revealed. This cascades through connected blank cells and stops at numbered boundary cells.
- **Chord click** (click or middle-click) on a revealed numbered cell:
  - If the number of adjacent flagged cells equals the cell's number → all adjacent unflagged hidden cells are revealed.
  - If a flagged cell is wrong (no mine behind an adjacent unflagged cell that gets revealed) → game over.
  - If the number of flags does not match → nothing happens.

### Flagging and Marking

- **Right-click** (or long-press on mobile) cycles cell marks: Hidden → Flag → Question Mark → Hidden.
- When Question Mode is disabled: Hidden → Flag → Hidden.
- **Flag:** Marks a cell as a confirmed mine. Contributes to chord logic.
- **Question Mark:** Tentative mark. Does not count toward chord logic.
- The **mine counter** displays: `total_mines - flags_placed`.
  - The counter can go negative if the player places more flags than the mine count.
  - Question marks do not affect the counter.

### Winning

- The player wins when all non-mine cells are revealed.
- On win:
  - All remaining mines are flagged automatically.
  - The timer stops.
  - A win overlay shows the completion time, difficulty, and a "Play Again" button.
  - If the completion time beats the recorded best time for that difficulty, it's highlighted as a new record.

### Losing

- The player loses when they reveal a mine cell.
- On loss:
  - All mines are revealed.
  - The detonated mine is visually distinct (e.g., red background).
  - Misplaced flags are marked with an X overlay.
  - The timer stops.

## Game States

1. **Title Screen** — Game title, difficulty selection, and start instructions.
2. **Playing** — Active gameplay. Timer running, cells being revealed/flagged.
3. **Paused** — Gameplay frozen, board hidden/blurred. Overlay shows "Paused" and resume instruction. Available only after the first click (no pause before mines are placed).
4. **Game Over (Loss)** — Board revealed, mines shown, misplaced flags indicated.
5. **Victory** — All safe cells revealed, time displayed, best time comparison.

## Controls

### Keyboard
- **Enter / Space:** Start game (title screen), restart (game over/victory screen).
- **1 / 2 / 3 / 4:** Select Beginner / Intermediate / Expert / Custom difficulty.
- **P / Escape:** Pause / resume.
- **R:** Restart current game (same difficulty).
- **M:** Toggle mute.
- **Arrow keys:** Navigate cell focus (for keyboard-only play).
- **Enter / Space (on focused cell):** Reveal cell (left-click equivalent).
- **Shift + Enter / Shift + Space:** Flag cycle (right-click equivalent).
- **Ctrl + Enter:** Chord click on focused numbered cell.

### Mouse
- **Left click:** Reveal cell.
- **Right click:** Cycle flag / question mark.
- **Middle click (or left + right simultaneously):** Chord click on numbered cell.
- **Click smiley face (HUD button):** Restart current game.

### Touch (Mobile)
- **Tap:** Reveal cell.
- **Long press (500ms):** Cycle flag / question mark.
- **Two-finger tap:** Chord click on numbered cell.
- **Swipe up:** Pause / resume.
- **Tap settings icon:** Open difficulty selector / settings panel.

### On-Screen Controls (Mobile)
- On screens below 600px, a HUD toolbar appears with:
  - Flag mode toggle button (switches tap behavior between reveal and flag)
  - Pause button
  - Restart button
  - Settings button (difficulty, sound, question mode)
- All touch targets meet 44px minimum size.

## HUD (Heads-Up Display)

The HUD displays above the game board and includes:

- **Mine Counter (left):** Seven-segment display showing remaining mines (`total - flags`).
- **Face Button (center):** Expressive button that restarts the game.
  - Neutral face during normal play.
  - Worried face while left-click is held (cell being revealed).
  - Sunglasses on victory.
  - Dead face (X eyes, open mouth) on loss.
- **Timer (right):** Seven-segment display showing elapsed seconds (0-999).

## Timer

- Starts on the first cell reveal (not on game start).
- Counts up in seconds, capped at 999.
- Stops on win or loss.
- Displayed with seven-segment digit styling.

## Visual Design

### Classic-Inspired Aesthetic
- Cell appearance inspired by the classic Windows Minesweeper with a modern, clean twist.
- **Hidden cells:** Raised 3D button effect (light top-left border, dark bottom-right).
- **Revealed cells:** Flat, sunken appearance (inset border).
- **Flagged cells:** Red flag icon on the hidden cell background.
- **Question-marked cells:** Yellow question mark icon.
- **Mine cells:** Black circle with red dot (classic mine icon).
- **Detonated mine:** Red background cell with mine icon.
- **Misflagged:** Black X overlay on the flag.

### Number Colors
Numbers are displayed in distinct colors matching the classic convention:

| Number | Color |
|--------|-------|
| 1 | Blue (#0000ff) |
| 2 | Green (#008000) |
| 3 | Red (#ff0000) |
| 4 | Dark Blue (#000080) |
| 5 | Dark Red (#800000) |
| 6 | Teal (#008080) |
| 7 | Black (#000000) |
| 8 | Gray (#808080) |

### Seven-Segment Display
- Mine counter and timer use a seven-segment digit font for authentic feel.
- Red digits on black background.
- Each digit is approximately 25px wide on desktop.

### Responsive Layout
- Grid cell size scales to fit the viewport while maintaining square aspect ratio.
- On narrow viewports (<600px):
  - HUD moves above the grid with compact layout.
  - Cell size reduces to maintain board fit.
  - Horizontal scroll appears for Expert difficulty (30 columns).
  - On-screen controls appear below the board.
- Layout is usable on phones, tablets, laptops, and desktops.

## Audio

### Sound Effects
- **Cell reveal:** Short click sound.
- **Empty cell (cascade):** Rapid, light clicks during recursive reveal.
- **Flag place/remove:** Distinct marker sound.
- **Chord reveal:** Slightly deeper click.
- **Mine detonation:** Explosion sound.
- **Game over:** Descending tone sequence.
- **Victory:** Celebratory fanfare.
- **Pause/Resume:** Single tone confirmation.
- **Number reveal (1-8):** Tone pitch proportional to the number value.

### Background Music
- No background music during gameplay — keeps focus on puzzle solving.
- Optional light ambient loop on the title screen (muted by default).

### Mute Toggle
- Button in the HUD / settings panel toggles all audio.
- Mute preference persists in `localStorage`.
- Audio context resumes on first user gesture (autoplay policy compliance).

## Persistent Data

### Best Times
- Stored in `localStorage` under key `minesweeper_best_times`.
- JSON object: `{"beginner": 42, "intermediate": 120, "expert": 345}`.
- Only updated when beaten (lower time is better).
- Displayed on the victory screen and title screen.

### Settings
- Mute state: `minesweeper_audio_muted` (boolean).
- Last selected difficulty: `minesweeper_last_difficulty` (string: "beginner" | "intermediate" | "expert" | "custom").
- Question mode enabled: `minesweeper_question_mode` (boolean, default false).
- Custom difficulty settings: `minesweeper_custom_settings` (JSON: `{cols, rows, mines}`).

## Accessibility

### Keyboard Controls
- Full keyboard operability: arrow key navigation, Enter/Space for reveal, Shift+Enter for flag, Ctrl+Enter for chord.
- Visible focus indicator on the currently navigated cell.
- Tab order: difficulty selector → start button → HUD → grid → settings.

### ARIA Attributes
- Grid uses `role="grid"` with `role="gridcell"` for each cell.
- Cells have `aria-label` describing state (e.g., "Row 3, Column 5, hidden", "Row 3, Column 5, revealed, 3 adjacent mines", "Row 3, Column 5, flagged").
- `aria-pressed` for flagged state.
- HUD mine counter and timer use `role="status"`.

### Live Regions
- `aria-live="polite"` region for score/time updates and cell state changes during keyboard navigation.
- `aria-live="assertive"` region for game state transitions (game started, game over with result, victory with time).

### Screen Reader Support
- Game state announcements: "Game started, beginner difficulty, 9 by 9 grid, 10 mines."
- Game over: "Game over. You hit a mine at row 4, column 7."
- Victory: "You won! All mines cleared in 42 seconds."
- Cell state changes announced on focus during keyboard navigation.

### Reduced Motion
- When `prefers-reduced-motion: reduce` is detected:
  - Cascade reveal animation is skipped (instant reveal).
  - Face button animations are disabled.
  - Victory/loss overlays appear without transition.

### Touch Targets
- All cells have a minimum 44px touch target on mobile (cell size scales up if needed, or scrolling is enabled).
- On-screen buttons meet 44px minimum.

### Color Independence
- Numbers are distinguishable by shape/glyph, not just color.
- Mine vs. safe cell distinction is conveyed by icon, not color alone.
- Sufficient contrast ratio for all text and interactive elements (WCAG AA).

## Technical Details

### Architecture

Multi-file project structure:

```
minesweeper/
  index.html          — Main HTML entry point
  css/
    styles.css        — All game styles
  js/
    main.js           — Entry point, game initialization, event wiring
    game.js           — Game state, win/loss logic, first-click safety
    board.js          — Grid management, mine placement, cell state, recursive reveal
    renderer.js       — DOM rendering, cell updates, HUD updates
    input.js          — Keyboard, mouse, and touch input handling
    audio.js          — Web Audio API sound effects
    storage.js        — localStorage persistence (best times, settings)
    timer.js          — Timer logic (start, stop, display)
  tests/
    game.test.js      — Unit tests for game logic
    board.test.js     — Unit tests for board operations
    e2e/
      setup.js        — Playwright configuration
      play.spec.js    — E2E tests (game flow, win/loss, difficulty)
      controls.spec.js — E2E tests (keyboard, touch, chord)
      accessibility.spec.js — E2E accessibility tests
  package.json        — Dependencies and scripts
  playwright.config.js — Playwright test configuration
```

### Key Algorithms

- **Mine placement:** Shuffle all valid cells (excluding first-click safe zone), pick first N as mines.
- **Recursive reveal (flood fill):** BFS/DFS from the clicked blank cell, revealing all connected blank cells and their numbered neighbors.
- **Chord logic:** Count adjacent flags on a numbered cell; if equal to the number, reveal all adjacent hidden unflagged cells.
- **First-click safety:** On first reveal, compute safe zone (clicked cell + adjacent + cascade), then place mines in remaining cells.

### Rendering Approach
- DOM-based rendering (not Canvas) — each cell is a `<div>` within a `<div role="grid">` container.
- CSS Grid for board layout.
- Cell state reflected via CSS classes (`.hidden`, `.revealed`, `.flagged`, `.mine`, `.detonated`).
- Number displayed as text content with data-attribute-based color styling.

### Game Loop
- No continuous game loop needed — Minesweeper is event-driven.
- Timer uses `setInterval` (1-second tick).
- All state changes are triggered by user input events.

## Running Locally

```bash
cd minesweeper
npx http-server -p 8080
# Open http://localhost:8080/index.html
```

## Testing

### Automated Tests

- **Unit tests** (Node.js with a lightweight test runner) covering:
  - Board initialization and mine placement
  - First-click safety guarantee
  - Recursive reveal (cascade) correctness
  - Chord click logic (correct and incorrect)
  - Win/loss condition detection
  - Flag cycling and mine counter
  - Timer start/stop/reset
  - Difficulty configuration validation
  - Best time persistence and comparison

- **E2E tests** (Playwright with Chromium) covering:
  - Title screen → difficulty selection → game start
  - Cell revealing and number display
  - Flag placement (right-click and long-press)
  - Chord clicking
  - Cascade reveal from blank cells
  - First-click safety (first click never hits mine)
  - Win condition and victory overlay
  - Loss condition and mine reveal
  - Timer behavior
  - Mine counter accuracy
  - Pause/resume
  - Keyboard navigation and controls
  - Touch controls on mobile viewport
  - Custom difficulty settings
  - Best time persistence
  - Mute toggle
  - Responsive layout at various viewports
  - Accessibility: keyboard-only play, ARIA attributes, live region announcements

### Running Tests

```bash
cd minesweeper
npm install
npm test              # Unit tests
npx playwright test   # E2E tests
```
