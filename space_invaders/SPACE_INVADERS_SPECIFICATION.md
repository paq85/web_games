# Space Invaders Specification

## User Request

> "Create a specification of a Space Invaders inspired game."

**Design direction:** Modern arcade shooter — expand significantly beyond the classic with boss fights, multiple stages, enemy formations, weapon upgrades, explosions, and combo scoring.

**Project conventions:** Standard — single `index.html`, HTML5 Canvas, Web Audio API, Playwright e2e tests, responsive/mobile support, `localStorage` persistence, WCAG 2.1 AA accessibility.

---

## Overview

A modern reimagining of the classic Space Invaders arcade experience. The player controls a spaceship at the bottom of the screen, shooting upward at waves of alien formations that descend, fire back, and grow faster each wave. Beyond the classic core, the game adds multiple enemy types with unique behaviors, destructible barricades, power-ups, a combo scoring system, weapon upgrades, boss fights at stage intervals, and escalating difficulty across numbered stages. Built as a standalone, responsive web app with HTML5 Canvas and vanilla JavaScript — no external dependencies or build tools required.

---

## Core Gameplay

### Objective

Destroy all alien invaders in each wave before they reach the player's defensive line. Survive through waves within a stage, defeat a boss at the end of each stage, and progress through increasingly difficult stages. Achieve the highest score possible.

### Playfield

- The game renders on an HTML5 Canvas.
- Logical playfield: **480 x 640 pixels** (internal coordinate space).
- The canvas scales to fit the viewport while maintaining the 3:4 aspect ratio.
- The playfield is conceptually divided into zones:
  - **Sky (top ~400px):** Alien formation area. Aliens move, weave, and fire from this zone.
  - **Mid (middle ~150px):** Barricade zone. Destructible shields sit here.
  - **Ground (bottom ~90px):** Player movement area. HUD above the canvas.
- A horizontal **danger line** exists near the player's zone. If any alien crosses it, the wave ends and the player loses a life.

### Player Ship

- Starts centered at the bottom of the playfield.
- Moves horizontally (left/right) within the playfield bounds.
- Visual: a compact sci-fi ship rendered as a pixel-art-style shape via Canvas primitives.
- **Hitbox:** 24px wide, 20px tall, centered on the ship sprite.
- The player can have only **one bullet on screen** at a time (classic behavior). Shooting a second bullet destroys the first.

### Shooting

- Player fires a single projectile upward at a fixed speed.
- Projectile travels until it hits an enemy, barricade, or goes off-screen.
- A brief cooldown (175ms) between shots prevents machine-gunning.
- When upgraded (see Power-ups), the player can fire double shots or rapid fire.

### Alien Formations

Each wave spawns a grid of aliens arranged in rows and columns. The formation moves as a unit:

1. **Movement pattern:** The formation drifts horizontally, shifts down when it hits an edge, reverses direction, and repeats.
2. **Speed scaling:** The formation moves faster as fewer aliens remain. Base speed starts at 40px/s and increases by 5% per alien destroyed, capped at 200% of base.
3. **Firing:** Aliens in the bottom-most rows of each column periodically fire downward. Fire rate increases with wave number and stage.
4. **Dive attacks (stage 2+):** Occasionally, a single alien breaks from the formation and dives toward the player in a zigzag pattern. Destroying a diving alien awards double points. The diving alien does not respawn in the formation.

### Alien Types

| Type | Row Position | Points | Behavior | Visual |
|------|-------------|--------|----------|--------|
| **Squid** | Top rows | 30 | Standard firing pattern | Octopus-like, purple |
| **Crab** | Middle rows | 20 | Fires more frequently than Squid | Crab-like, cyan |
| **Miner** | Bottom rows | 10 | Basic, no special behavior | Beetle-like, green |
| **Elite** | Rare (waves 4+) | 50 | Fires spread shots (3 projectiles) | Armored, red |

### Barricades

- Each wave starts with **4 barricades** positioned evenly across the mid-zone.
- Barricades are rendered as blocky arch shapes, ~48px wide, ~32px tall.
- **Destructible:** Barricades take damage from both alien and player bullets. Each bullet removes a small chunk (AABB-based pixel destruction on a sub-grid).
- Barricades absorb bullets completely — a bullet that hits a barricade does not pass through.
- Once destroyed, barricades do not regenerate within a stage. New stages restore them.
- Aliens that collide with barricades during formation movement destroy the barricade segment and continue moving.

### Waves

- A **stage** consists of 5 waves of standard alien formations plus a boss fight.
- Each successive wave within a stage:
  - Adds one extra row of aliens (starting at 4 rows, maxing at 8).
  - Increases alien fire rate by 10%.
  - Increases formation base speed by 5%.
- Between waves, a brief interlude shows the wave number and any power-ups that spawn.
- When all aliens in a wave are destroyed, the wave ends with a flash effect and the next wave begins after a 1.5-second pause.

### Stages

| Stage | Theme | New Mechanics |
|-------|-------|---------------|
| **1** | **Deep Space** | Basic aliens, standard formations, intro to barricades |
| **2** | **Asteroid Belt** | Dive attacks, debris particles in background, Elite aliens appear |
| **3** | **Nebula** | Spread-shot aliens, power-up frequency doubles, moving background |
| **4** | **Warp Zone** | Formation weaves in sine-wave patterns, faster fire rates |
| **5** | **Final Fortress** | All mechanics active, maximum alien counts, final boss is harder |

- After defeating a stage's boss, a stage-clear screen shows total stage score, then transitions to the next stage.
- Completing all 5 stages shows a victory screen. The player can continue in **endless mode**, which cycles stages with increasing difficulty (speed +15%, fire rate +15% per cycle).

### Boss Fights

- Each stage ends with a **boss fight** — a large alien mothership that enters from the top.
- **Boss health:** Scales with stage number (Stage 1: 20 HP, +10 HP per stage).
- **Boss attack patterns** (varies by stage):
  - **Single shot:** Fires aimed bullets at the player (all stages).
  - **Spread shot:** 5-bullet fan pattern (stage 2+).
  - **Rapid burst:** 8 bullets in quick succession (stage 3+).
  - **Summon:** Spawns 4 mini-invaders that move independently (stage 4+).
  - **Charge:** Dives down and fires a laser beam the player must dodge (stage 5).
- Boss attacks cycle in a predictable rotation so players can learn patterns.
- When the boss's health reaches 0, it explodes in a multi-phase animation, drops a guaranteed power-up, and awards bonus points.
- **Boss points:** `500 * stage_number`.

### Power-ups

Power-ups spawn randomly from destroyed aliens (10% base chance, 20% in stage 3+) and always from defeated bosses. They fall slowly from the kill position and disappear if they reach the bottom without collection.

| Power-up | Icon | Effect | Duration |
|----------|------|--------|----------|
| **Double Shot** | D | Player fires two bullets side-by-side | 20 seconds |
| **Rapid Fire** | R | Shot cooldown reduced to 80ms | 20 seconds |
| **Shield** | S | Absorbs one hit from alien bullet | One use |
| **Weapon Upgrade** | W | Triple shot (3 bullets in a spread) | 15 seconds |
| **Slow Motion** | M | All alien movement and bullets slowed by 40% | 12 seconds |
| **Extra Life** | + | Grants one additional life | Permanent |

- Only one power-up can be on screen at a time.
- Power-up effects do not stack — collecting the same type refreshes the duration.
- Active timed power-ups are shown as icons with countdown timers in the HUD.

### Combo Scoring

- **Combo counter:** Increases by 1 for each consecutive alien kill without being hit by an alien bullet.
- **Combo multiplier:** `1 + floor(combo / 5) * 0.5` (e.g., 5 kills = 1.5x, 10 kills = 2x, 15 kills = 2.5x).
- **Combo reset:** Being hit by an alien bullet resets the combo to 0. Destroying barricades or being hit by the boss does NOT reset the combo.
- **Combo display:** Shown in the HUD with a color that intensifies at higher multipliers.
- **Combo cap:** Maximum 5x multiplier (requires 20+ consecutive kills).

### Lives

- The player starts with **3 lives**.
- A life is lost when:
  - An alien bullet hits the player ship.
  - An alien formation crosses the danger line.
  - The player is hit by a boss attack.
- When a life is lost, the ship flashes briefly, then reappears centered with a 2-second invulnerability period (ship blinks during invulnerability).
- **Extra lives** are awarded at score milestones: 2000, 5000, 10000, and every 10000 points thereafter.
- When all lives are lost, the game enters Game Over.

### Scoring

| Action | Base Points |
|--------|-------------|
| Destroy Miner | 10 |
| Destroy Crab | 20 |
| Destroy Squid | 30 |
| Destroy Elite | 50 |
| Destroy diving alien | 2x type value |
| Destroy boss | 500 * stage number |
| Power-up collected | 100 |
| Wave clear | 200 |
| Stage clear | 1000 |

- All kill points are multiplied by the current combo multiplier.
- Score is displayed in the HUD with a digit-scroll animation on change.

---

## Game States

1. **Idle** — Title screen with animated alien formation floating in the background, score display, and "Press to Start" prompt.
2. **Stage Intro** — Brief overlay showing the stage name and theme. Fades after 2 seconds.
3. **Playing** — Active gameplay. Aliens move, player shoots, bullets fly, power-ups fall.
4. **Wave Clear** — Brief pause between waves. Shows wave number and score.
5. **Boss Fight** — Boss is active. Standard aliens cleared. Boss patterns cycle.
6. **Stage Clear** — Celebration screen. Shows stage score, total score, and transitions to next stage.
7. **Paused** — Gameplay frozen. Overlay shows "PAUSED" and resume instruction.
8. **Game Over** — All lives lost. Shows final score, high score, stage reached, and restart prompt.
9. **Victory** — All 5 stages completed. Shows total score, high score, and option to continue in endless mode.

---

## Controls

### Keyboard

| Action | Key |
|--------|-----|
| Move left | `ArrowLeft` or `A` |
| Move right | `ArrowRight` or `D` |
| Shoot | `Space` or `ArrowUp` or `W` |
| Start game / restart | `Enter` |
| Pause / resume | `P` or `Escape` |
| Mute toggle | `M` |

### Touch (Mobile)

- **Touch and drag (horizontal):** Move ship left/right.
- **Tap (right half of screen):** Shoot.
- **Tap (left half of screen):** Move ship toward tap position.
- **Double-tap:** Pause / resume during gameplay.
- **Tap overlay button:** Start game, restart after game over.

### On-screen Controls (Mobile)

- **Virtual joystick** appears on the left side of the screen on viewports below 600px width. Drag to move ship.
- **Fire button** appears on the right side. Tap to shoot.
- **Pause button** in the top-right corner of the HUD.
- **Mute button** (speaker icon) in the HUD.
- All touch targets meet the **44px minimum** size.

---

## Visual Design

### Color Scheme

| Element | Color |
|---------|-------|
| Background (stage 1) | Deep space black (#0a0a1a) with star field |
| Background (stage 2) | Dark purple (#1a0a2a) with asteroid particles |
| Background (stage 3) | Nebula gradient (#0a1a2a → #2a0a2a) |
| Background (stage 4) | Warp tunnel effect (#0a0a2a with streak lines) |
| Background (stage 5) | Red-tinged space (#1a0a0a) |
| Player ship | Bright cyan (#00ffff) |
| Player bullet | Yellow (#ffff00) with glow |
| Alien bullet | White (#ffffff) zigzag shape |
| Squid aliens | Purple (#aa44ff) |
| Crab aliens | Cyan (#44ffff) |
| Miner aliens | Green (#44ff44) |
| Elite aliens | Red (#ff4444) with armor highlight |
| Boss | Gold (#ffaa00) with pulsing glow |
| Barricades | Neon green (#00ff88) |
| Power-ups | Color-coded by type (see power-up table) |
| Danger line | Subtle red (#442222) |
| HUD text | White (#ffffff) primary, gray (#888888) secondary |
| Combo counter | Gradient: green → yellow → orange → red (by multiplier) |
| Explosion particles | Orange/yellow/white with fade |

### Rendering

- HTML5 Canvas 2D for all game rendering.
- 60fps render loop via `requestAnimationFrame`.
- Independent game tick timing for movement and logic (separate from render rate).
- **Particle system** for explosions (alien deaths, boss death, barricade destruction).
- **Screen shake** on boss hits and wave clears (2px offset, 100ms duration).
- **Star field** background with parallax scrolling (3 layers, different speeds).
- **Sprite rendering:** All sprites drawn via Canvas primitives (rectangles, circles, lines) — no external image assets.
- **Alien animation:** Two-frame animation that alternates every 0.5 seconds (legs out/in).

### Visual Effects

- **Explosion:** When an alien is destroyed, 8-12 particles emit outward in a burst, fade over 400ms.
- **Boss explosion:** Multi-phase — flash white, then expanding ring of particles, then debris scatter. 1.5-second animation.
- **Power-up collection:** Brief flash ring around the ship, power-up icon flies to HUD.
- **Wave clear:** Full-screen white flash (100ms), then "WAVE CLEAR" text with fade-in/out.
- **Combo indicator:** Pulses and grows slightly at higher multipliers.

### Responsive Layout

- Canvas scales to fit available viewport width, maintaining 3:4 aspect ratio.
- HUD (score, lives, combo, stage, power-up timers) positioned above the canvas.
- On screens below 600px, virtual joystick and fire button appear as overlays.
- Layout functional at 200% zoom.

---

## Audio

### Sound Effects (Web Audio API, procedural — no external files)

| Event | Sound |
|-------|-------|
| Player shoot | Sharp ascending pulse |
| Alien shoot (Miner/Crab) | Low descending blip |
| Alien shoot (Squid) | Mid-tone warble |
| Alien shoot (Elite) | Triple-layered descending burst |
| Alien death (Miner) | Short crackle |
| Alien death (Squid/Elite) | Longer descending explosion |
| Diving alien death | Double explosion |
| Boss hit | Heavy thud |
| Boss death | Multi-layered explosion with bass drop |
| Barricade damage | Brick-like crack |
| Power-up spawn | Descending chime |
| Power-up collect | Ascending sparkle |
| Wave clear | Fanfare (ascending arpeggio) |
| Stage clear | Triumphant melody |
| Game over | Descending mournful tones |
| Life lost | Descending buzz |
| Extra life awarded | Joyful ascending trill |
| Pause | Low single tone |
| Resume | Higher single tone |
| Combo milestone (5x, 10x, etc.) | Bright chime |

### Background Music

- Looping procedural soundtrack during active gameplay.
- Tempo and complexity increase with stage number.
- **Stage 1:** Simple bass line, 100 BPM.
- **Stage 2-3:** Added percussion layer, 110 BPM.
- **Stage 4-5:** Full arrangement with melody, 120 BPM.
- **Boss fight:** Music shifts to a more intense variation (faster tempo, lower register).
- Stops when paused or game over.
- Volume kept low to not mask sound effects.

### Mute Toggle

- Speaker icon button in the HUD toggles all audio (SFX + music).
- Icon switches between muted/unmuted states.
- Mute preference persists in `localStorage` under key `space_invaders_audio_muted`.

### Autoplay Policy

- Audio context is created/resumed on the first user gesture (key press, click, or touch).
- No audio plays before the user interacts with the page.

---

## Persistent Data

### High Score

- Stored in `localStorage` under key `space_invaders_high_score`.
- Persisted across sessions.
- Displayed on game over screen alongside current score.

### Stage Progress

- Highest stage reached stored in `localStorage` under key `space_invaders_highest_stage`.
- Displayed on game over screen.

### Settings

- Mute state persisted in `localStorage` under key `space_invaders_audio_muted`.

---

## Technical Details

### Architecture

- Single `index.html` file with embedded CSS and JavaScript.
- No external dependencies or build step.
- Game logic organized into distinct modules:
  - **GameState** — Manages state transitions (idle, stage intro, playing, wave clear, boss fight, stage clear, paused, game over, victory).
  - **Player** — Ship position, movement, shooting, hitbox, invulnerability, power-up effects.
  - **Bullet** — Projectile class (player and alien bullets). Movement, collision bounds.
  - **AlienFormation** — Grid of aliens, movement pattern, edge detection, speed scaling, animation frames.
  - **Alien** — Individual alien: type, position, health, firing behavior, animation.
  - **DivingAlien** — Breaks from formation, zigzag dive path, double points.
  - **Boss** — Boss ship: health, attack pattern rotation, summoning, phase transitions.
  - **Barricade** — Destructible shield: sub-grid damage tracking, collision absorption.
  - **PowerUp** — Spawn, fall, collection, effect application, timer management.
  - **ParticleSystem** — Explosion effects, debris, star field rendering.
  - **ComboSystem** — Combo counter, multiplier calculation, reset conditions.
  - **Scoring** — Score tracking, combo multiplier, milestone extra lives, high score persistence.
  - **WaveManager** — Wave definitions, spawning, progression, stage transitions.
  - **Renderer** — Canvas drawing for all game elements, HUD, overlays, visual effects.
  - **InputHandler** — Keyboard, touch, drag, swipe, and on-screen button processing.
  - **AudioManager** — Web Audio API sound effects and procedural background music.

### Game Loop

```
requestAnimationFrame drives the render loop.
Accumulated delta time determines game ticks.
Each tick:
  1. Process input (player movement, shooting)
  2. Update player position and invulnerability
  3. Update player bullets (movement, collision checks)
  4. Update alien formation (movement, edge detection, animation)
  5. Update diving aliens (zigzag paths)
  6. Update alien bullets (movement, firing timers)
  7. Update boss (if active: attack patterns, health, summoning)
  8. Update power-ups (falling, collection)
  9. Update barricades (damage from bullets/aliens)
  10. Update particle system
  11. Check all collisions:
      - Player bullets vs aliens, boss, barricades
      - Alien bullets vs player, barricades
      - Aliens vs barricades
      - Aliens vs danger line
      - Player vs power-ups
  12. Update scoring and combo
  13. Update wave/stage progression
  14. Update power-up timers
  15. Render frame
```

### Player Movement

- Ship moves at 250px/s horizontally.
- Movement is continuous while key is held (not discrete steps).
- Ship clamped to playfield bounds (0 to 480 - ship width).
- On mobile, virtual joystick maps drag distance to ship position proportionally.

### Collision Detection

- All collisions use **AABB** (Axis-Aligned Bounding Box).
- Bullet vs alien: bullet hitbox vs alien hitbox.
- Bullet vs barricade: bullet position checked against barricade sub-grid.
- Bullet vs player: bullet hitbox vs player hitbox (only when not invulnerable).
- Alien vs barricade: alien hitbox vs barricade bounding box.
- Player vs power-up: player hitbox vs power-up hitbox.

### Screen Shake

- Applied as a canvas transform offset.
- **Boss hit:** 2px random offset, 100ms duration.
- **Wave clear:** 3px random offset, 200ms duration.
- **Boss death:** 5px random offset, 500ms duration.
- Respects `prefers-reduced-motion` — disabled when reduced motion is preferred.

---

## Accessibility

### Keyboard Controls

- All gameplay actions accessible via keyboard alone.
- Arrow keys and WASD for movement and shooting.
- Enter for start/restart.
- P/Escape for pause/resume.
- M for mute toggle.

### ARIA Attributes

- The game canvas carries `role="application"`, `aria-label="Space Invaders game — use arrow keys or WASD to move, space to shoot"`, and `tabindex="0"`.

### Live Regions

- An `aria-live="polite"` region announces score changes, wave clears, and power-up collections.
- An `aria-live="assertive"` region announces game state transitions (game started, life lost, boss fight starting, stage clear, game over with final score).

### Screen Reader Support

- Game state, score, lives, combo, wave, and stage are communicated through live regions.
- Overlay screens (idle, paused, game over, victory) update the live region with current state and available actions.

### Focus Management

- The canvas is the sole focusable game element (`tabindex="0`).
- Focus is retained on the canvas throughout gameplay.
- A visible focus indicator outlines the canvas when it receives keyboard focus.

### Reduced Motion

- When `prefers-reduced-motion: reduce` is detected:
  - Particle explosions replaced with a simple flash.
  - Screen shake disabled.
  - Star field parallax disabled (static stars).
  - Alien animation frame alternation disabled.
  - Overlay fade animations removed (instant transitions).
  - Combo indicator pulse disabled.

### Touch Controls

- Touch and drag for ship movement.
- Tap to shoot.
- Double-tap for pause/resume.
- On-screen virtual joystick and fire button on narrow viewports.

### Touch Targets

- All interactive buttons (joystick, fire, pause, mute) meet the 44px minimum touch target size.

### Color Contrast

- High contrast between player ship, aliens, bullets, and backgrounds.
- Alien types distinguishable by shape and size, not color alone.
- Power-ups distinguishable by letter icon and shape, not color alone.
- HUD text meets WCAG AA contrast ratios against the background.

---

## Running Locally

```bash
cd space_invaders
npx serve .
# Open http://localhost:3000/index.html
```

---

## Testing

### Automated Tests

- Headless Chrome e2e tests via Playwright covering:
  - Game start from idle screen
  - Player movement (keyboard: arrow keys, WASD)
  - Player shooting (Space, ArrowUp, W)
  - Alien formation movement (horizontal drift, edge shift, descent)
  - Alien firing and bullet collision with player
  - Player bullet destroying aliens
  - Alien death and score increase
  - Barricade destruction (player and alien bullets)
  - Wave clear transition
  - Boss fight activation
  - Boss health reduction and defeat
  - Boss explosion animation
  - Power-up spawn, fall, and collection
  - Power-up effect application (Double Shot, Rapid Fire, Shield, etc.)
  - Combo counter increase, multiplier application, and reset
  - Life loss (alien bullet hit, danger line crossed)
  - Invulnerability period after life loss
  - Extra life award at score milestones
  - Stage progression
  - Pause/resume functionality
  - Game over after losing all lives
  - High score persistence across sessions
  - Mute toggle functionality and persistence
  - Touch controls (drag to move, tap to shoot)
  - Virtual joystick and fire button visibility on mobile viewport
  - Responsive layout at various viewport sizes
  - Reduced motion support
  - Victory screen and endless mode continuation

### Running Tests

```bash
cd space_invaders
npm install
npx playwright test
```

---

## Future Considerations

The following features are not required by this specification but may be considered in future iterations:

1. Co-op multiplayer mode (two players sharing the screen)
2. Custom alien formation editor
3. Daily challenge mode with seeded formations and leaderboards
4. Additional weapon types (homing missiles, laser beam, area-of-effect)
5. Ship customization (skins unlocked by score milestones)
6. Achievement system (first boss kill, perfect wave, 50x combo, etc.)
7. Gamepad/controller support
8. Soundtrack toggle with different procedural music styles
9. New stage themes (underwater, volcanic, cyberpunk)
10. Speedrun mode with split timing
