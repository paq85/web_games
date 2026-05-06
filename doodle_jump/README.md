# Doodle Jump

An endless climbing game with a hand-drawn sketch-style presentation. Climb as high as you can by bouncing on platforms, collecting items, and avoiding monsters.

## Features

- **Endless climbing gameplay** with procedurally generated platforms
- **6 platform types**: Normal, Moving, Breakable, Spring, Vine, and Monster
- **Collectibles and power-ups**: Coins, Jetpack, UFO, and Paper
- **Hand-drawn sketch aesthetic** with graph paper background
- **Persistent high scores** and cumulative player statistics
- **Configurable settings**: Volume controls, accessibility options, control rebinding
- **Full accessibility support**: Keyboard operability, ARIA attributes, live regions, reduced motion
- **Responsive design** working on desktop and mobile browsers
- **Touch controls** for mobile devices

## Controls

### Keyboard
| Action | Key |
|--------|-----|
| Move left | ArrowLeft or A |
| Move right | ArrowRight or D |
| Pause | Escape or P |
| Mute | M |

### Mouse
- Click and hold on the left half of the screen to move left
- Click and hold on the right half of the screen to move right

### Touch (Mobile)
- Touch and hold on the left half of the screen to move left
- Touch and hold on the right half of the screen to move right

## Platform Types

| Platform | Behavior |
|----------|----------|
| Normal | Standard solid platform - bounce upward on contact |
| Moving | Moves horizontally - bounce upward on contact |
| Breakable | Crumbles when landed on (unless Paper power-up is active) |
| Spring | Launches player significantly higher |
| Vine | Climb upward by holding direction |
| Monster | Avoid - contact ends the run |

## Power-ups

| Power-up | Effect |
|----------|--------|
| Coin | Adds bonus points to score |
| Jetpack | Sustained upward flight for a few seconds |
| UFO | Enhanced horizontal mobility briefly |
| Paper | Makes breakable platforms temporarily solid |

## Accessibility

This game follows WCAG 2.1 AA guidelines:

- **Full keyboard operability** - All menus and gameplay accessible via keyboard
- **ARIA attributes** - Semantic markup with `role="application"` and descriptive labels
- **Live regions** - Score changes and game events announced to screen readers
- **Focus management** - Visible focus indicators and proper tab order
- **Reduced motion** - Respects `prefers-reduced-motion` and has a settings toggle
- **Touch targets** - Full-width touch zones (50% each side) on mobile
- **High contrast** - Clear visual distinction between game elements

## Settings

The game includes configurable settings accessible from the main menu:

- **Master Volume** - Overall audio volume
- **Music Volume** - Background music volume
- **Sound Effects Volume** - Game SFX volume
- **Mute** - Toggle all audio
- **Reduced Motion** - Minimize animations
- **Reduced Effects** - Minimize particle effects
- **Paper Texture** - Toggle graph paper background
- **Control Rebinding** - Customize keyboard bindings

## Running Locally

### Using the dev server
```bash
npm run dev
```
Then open http://localhost:8080 in your browser.

### Using http-server
```bash
npm run serve
```
Then open http://localhost:8080 in your browser.

### Direct file open
Simply open `index.html` in a browser. Note that some features (like localStorage) may require serving via HTTP.

## Testing

### Unit Tests
```bash
npm test
```

### Acceptance Tests (Headless Chrome)
```bash
npm run test:acceptance
```

### All Tests
```bash
npm run test:all
```

## Game Structure

```
doodle_jump/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Game styles
├── js/
│   ├── constants.js        # Game constants and configuration
│   ├── state.js            # Game state management
│   ├── persistence.js      # localStorage persistence
│   ├── physics.js          # Physics and collision detection
│   ├── platforms.js        # Platform generation and management
│   ├── collectibles.js     # Collectible items and power-ups
│   ├── input.js            # Keyboard, mouse, and touch input
│   ├── audio.js            # Web Audio API sound effects and music
│   ├── renderer.js         # Canvas rendering
│   ├── ui.js               # UI and menu management
│   └── main.js             # Game loop and initialization
├── tests/
│   ├── run-tests.js        # Unit test runner
│   ├── game-logic.test.js  # Unit tests
│   ├── acceptance/
│   │   └── game.spec.js    # Playwright acceptance tests
│   └── playwright.config.js
├── package.json
├── dev-server.js           # Development HTTP server
├── README.md
└── DOODLE_JUMP_SPECIFICATION.md
```

## Browser Support

- Chrome (latest)
- Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT
