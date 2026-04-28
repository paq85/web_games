// Input handling: keyboard, pointer, touch
const Input = {
  keys: {},
  touchButtons: { up: false, down: false, left: false, right: false, action: false },
  isMobile: false,
  paused: false,

  init() {
    this.isMobile = Utils.isTouchDevice();

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Prevent scrolling with game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

      // Pause toggle - directly call game pause/resume
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (typeof Game !== 'undefined') {
          if (Game.state === CONSTANTS.STATE.PLAYING) {
            Game.pause();
          } else if (Game.state === CONSTANTS.STATE.PAUSED) {
            Game.resume();
          }
        }
        return;
      }

      // Enter for menu actions
      if (e.code === 'Enter') {
        return 'menu_confirm';
      }

      return null;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch events for mobile controls
    if (this.isMobile) {
      this.setupTouchControls();
    }

    // Detect resize
    window.addEventListener('resize', () => {
      this.isMobile = Utils.isTouchDevice() || window.innerWidth < 768;
      if (this.isMobile) {
        this.setupTouchControls();
      }
    });
  },

  setupTouchControls() {
    const buttons = {
      'btn-up': 'up',
      'btn-down': 'down',
      'btn-left': 'left',
      'btn-right': 'right',
      'btn-action': 'action',
    };

    for (const [id, key] of Object.entries(buttons)) {
      const el = document.getElementById(id);
      if (!el) continue;

      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchButtons[key] = true;
      }, { passive: false });

      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.touchButtons[key] = false;
      }, { passive: false });

      el.addEventListener('touchcancel', (e) => {
        this.touchButtons[key] = false;
      });
    }

    // Pause button
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof Game !== 'undefined') {
          if (Game.state === CONSTANTS.STATE.PLAYING) {
            Game.pause();
          } else if (Game.state === CONSTANTS.STATE.PAUSED) {
            Game.resume();
          }
        }
      }, { passive: false });
    }
  },

  // Check if a key is pressed (keyboard or touch equivalent)
  isPressed(action) {
    switch (action) {
      case 'up':
        return this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchButtons.up;
      case 'down':
        return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchButtons.down;
      case 'left':
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchButtons.left;
      case 'right':
        return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchButtons.right;
      case 'action':
        return this.keys['Space'] || this.touchButtons.action;
      case 'pause':
        return this.paused;
      default:
        return false;
    }
  },

  reset() {
    this.keys = {};
    this.touchButtons = { up: false, down: false, left: false, right: false, action: false };
    this.paused = false;
  },
};
