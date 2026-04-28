# UGH! - Prehistoric Transport

A browser-based adaptation of the classic 1992 arcade game UGH!. Pilot a stone-age helicopter through dangerous prehistoric environments, pick up passengers, and deliver them safely.

## How to Play

### Objective
Pick up stranded passengers and deliver them to drop zones while avoiding hazards like dinosaurs, birds, volcanic rocks, lightning, trees, and rocks. Manage your fuel supply and health across 10 increasingly difficult levels.

### Controls

**Desktop:**
- Arrow Keys or WASD: Move helicopter (up, down, left, right)
- Space: Boost (consumes extra fuel)
- Escape or P: Pause/Resume
- Enter: Confirm menu selections

**Mobile/Tablet:**
- On-screen directional buttons: Move helicopter
- Action button (⚡): Boost
- Pause button (⏸): Pause/Resume

### Game Modes
- **1 Player**: Single-player campaign through all 10 levels
- **2 Players**: Local same-device multiplayer, players alternate levels
- **Hotseat**: Pass-and-play mode with turn indicators

### Scoring
- Passenger delivery: 100 points
- Fuel can pickup: 10 points + 25 fuel
- Score item pickup: 50 points
- Level completion bonus: 500 points
- Survival: 1 point per second

### Hazards
- **Trees & Rocks**: Stationary obstacles on terrain
- **Birds**: Flying hazards that move erratically
- **Dinosaurs**: Ground-based predators
- **Volcanic Rocks**: Fast-moving projectiles
- **Lightning**: Strikes from above

### Levels
1. The Savannah - Introduction with trees and rocks
2. Rocky Hills - Rougher terrain
3. Bird Valley - Flying hazards introduced
4. Dinosaur Plains - Ground predators appear
5. Mountain Pass - Narrow mountain terrain
6. Volcanic Zone - Volcanic rock hazards
7. Stormy Skies - Lightning strikes
8. Jungle River - Multiple hazard types
9. Ice Caves - Slippery mountain terrain
10. Final Frontier - All hazards combined

## Running Locally

```bash
cd ugh
npm install
npm run serve
```

Then open http://localhost:9090 in your browser.

## Testing

```bash
# Unit tests
npm test

# End-to-end acceptance tests (Playwright/Chromium)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## Features

- 10 levels with increasing difficulty
- 3 game modes (single-player, 2-player, hotseat)
- Fuel and health management
- Multiple hazard types
- Collectible fuel cans and score items
- Level codes for progress sharing
- Local progress persistence (localStorage)
- Audio feedback (Web Audio API)
- Responsive design for desktop, tablet, and mobile
- Touch controls for mobile devices
- Reduced motion accessibility option
- Settings for sound and music

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari
- Mobile browsers (iOS Safari, Android Chrome)

## Technical Details

- Pure HTML/CSS/JavaScript, no frameworks
- Canvas-based rendering
- Web Audio API for sound effects and music
- localStorage for persistence
- Jest for unit testing
- Playwright for end-to-end testing
