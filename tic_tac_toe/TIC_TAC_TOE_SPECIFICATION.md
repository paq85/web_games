# Tic Tac Toe — Specification

## Overview
A classic two-player strategy board game with an optional AI opponent. Players take turns marking cells on a 3×3 grid, trying to get three of their marks in a row (horizontal, vertical, or diagonal).

## Game Modes
1. **Local PvP** — Two human players share the same device, taking turns.
2. **Player vs AI** — A human plays against an unbeatable AI that uses the minimax algorithm. The AI always plays as O.

## Rules
- The board is a 3×3 grid, initially empty.
- Player X always goes first.
- On each turn the current player selects one empty cell and places their mark.
- A player wins by placing three of their marks in a row, column, or diagonal.
- If all nine cells are filled and no player has three in a row, the game is a draw.
- After a win or draw the board is frozen until the player chooses to start a new game.

## UI Layout
- **Header**: Game title and current mode indicator.
- **Status bar**: Shows whose turn it is, or displays the game result ("X wins!", "O wins!", "Draw!").
- **Board**: 3×3 grid of square cells. Each cell shows the mark (X or O) or is empty.
- **Scoreboard**: Tracks wins for X, wins for O, and draws.
- **Controls**: "New Game" button and a mode toggle ("PvP" / "vs AI").
- Winning cells are visually highlighted.

## Controls
- **Mouse**: Click an empty cell to place a mark.
- **Touch**: Tap an empty cell (mobile-friendly with large tap targets).
- **Keyboard**: Arrow keys or WASD to move a cursor focus across the grid; Enter or Space to place a mark.
- **Keyboard shortcuts**: "N" starts a new game; "M" toggles game mode.

## AI Behaviour
- The AI uses the minimax algorithm with alpha-beta pruning, making it unbeatable.
- The best the human player can achieve against the AI is a draw.
- The AI responds after a short delay (300ms) to feel natural.

## Responsive Design
- The board scales to fit the viewport. On small screens the cells remain at least 64px wide.
- Controls are stacked vertically on narrow viewports.
- Touch targets are at least 44×44px.

## Accessibility
- Each cell is a focusable button with an `aria-label` describing its position (e.g., "Row 1, Column 1 — empty").
- The status bar uses `role="status"` and `aria-live="polite"` for screen reader announcements.
- Sufficient color contrast on all text and marks.

## Persistence
- Scores are saved to `localStorage` and restored on page load.
