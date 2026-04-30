class UI {
  constructor(rootEl) {
    this.root = rootEl;
    this.screens = {};
    this.currentScreen = null;
    this.hud = null;
    this.achievementToasts = [];
    this.focusTrapStack = [];
  }

  init() {
    this._buildScreens();
    this._bindButtons();
    this._bindKeyboard();
    this.showScreen('splash');
  }

  _buildScreens() {
    const fragment = document.createDocumentFragment();

    const screenDefs = [
      { id: 'splash', role: 'dialog', label: 'FUSION splash screen' },
      { id: 'main_menu', role: 'dialog', label: 'Main menu' },
      { id: 'mode_select', role: 'dialog', label: 'Select game mode' },
      { id: 'pause', role: 'dialog', label: 'Pause menu' },
      { id: 'game_over', role: 'dialog', label: 'Game over' },
      { id: 'win', role: 'dialog', label: 'You won' },
      { id: 'challenges', role: 'dialog', label: 'Challenge list' },
      { id: 'daily_puzzle', role: 'dialog', label: 'Daily puzzle' },
      { id: 'settings', role: 'dialog', label: 'Settings' },
      { id: 'statistics', role: 'dialog', label: 'Statistics' },
      { id: 'achievements', role: 'dialog', label: 'Achievements' },
      { id: 'hud', role: 'status', label: 'Game HUD' },
    ];

    screenDefs.forEach(def => {
      const el = document.createElement('div');
      el.id = `screen-${def.id}`;
      el.className = `screen screen-${def.id}`;
      el.setAttribute('role', def.role);
      el.setAttribute('aria-label', def.label);
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';

      if (def.id === 'hud') {
        el.setAttribute('aria-live', 'polite');
      }

      fragment.appendChild(el);
      this.screens[def.id] = el;
    });

    this._buildSplash();
    this._buildMainMenu();
    this._buildModeSelect();
    this._buildPause();
    this._buildGameOver();
    this._buildWin();
    this._buildChallenges();
    this._buildDailyPuzzle();
    this._buildSettings();
    this._buildStatistics();
    this._buildAchievements();
    this._buildHUD();

    fragment.appendChild(this._buildAchievementToastContainer());
    this.root.appendChild(fragment);
  }

  _buildSplash() {
    const el = this.screens.splash;
    el.innerHTML = `
      <div class="splash-content">
        <h1 class="splash-title">FUSION</h1>
        <p class="splash-subtitle">Reactor Core Puzzle</p>
        <button class="btn btn-primary" data-action="start">START</button>
      </div>`;
  }

  _buildMainMenu() {
    const el = this.screens.main_menu;
    el.innerHTML = `
      <h2 class="screen-title">FUSION</h2>
      <nav class="menu-nav" aria-label="Main menu">
        <ul class="menu-list">
          <li><button class="btn btn-menu" data-action="play">Play</button></li>
          <li><button class="btn btn-menu" data-action="challenges">Challenges</button></li>
          <li><button class="btn btn-menu" data-action="daily">Daily Puzzle</button></li>
          <li><button class="btn btn-menu" data-action="achievements">Achievements</button></li>
          <li><button class="btn btn-menu" data-action="statistics">Statistics</button></li>
          <li><button class="btn btn-menu" data-action="settings">Settings</button></li>
        </ul>
      </nav>`;
  }

  _buildModeSelect() {
    const el = this.screens.mode_select;
    el.innerHTML = `
      <h2 class="screen-title">Select Mode</h2>
      <nav class="menu-nav" aria-label="Game mode selection">
        <ul class="menu-list">
          <li><button class="btn btn-mode" data-mode="classic">Classic</button></li>
          <li><button class="btn btn-mode" data-mode="endless">Endless</button></li>
          <li><button class="btn btn-mode" data-mode="challenge">Challenge</button></li>
        </ul>
      </nav>
      <button class="btn btn-back" data-action="back">Back</button>`;
  }

  _buildPause() {
    const el = this.screens.pause;
    el.innerHTML = `
      <h2 class="screen-title">Paused</h2>
      <nav class="menu-nav" aria-label="Pause menu">
        <ul class="menu-list">
          <li><button class="btn btn-menu" data-action="resume">Resume</button></li>
          <li><button class="btn btn-menu" data-action="restart">Restart</button></li>
          <li><button class="btn btn-menu" data-action="settings">Settings</button></li>
          <li><button class="btn btn-menu" data-action="menu">Main Menu</button></li>
        </ul>
      </nav>`;
  }

  _buildGameOver() {
    const el = this.screens.game_over;
    el.innerHTML = `
      <h2 class="screen-title">Game Over</h2>
      <div class="game-over-stats" aria-live="assertive">
        <div class="stat-row"><span class="stat-label">Score:</span><span class="stat-value" id="go-score">0</span></div>
        <div class="stat-row"><span class="stat-label">Best:</span><span class="stat-value" id="go-best">0</span></div>
        <div class="stat-row"><span class="stat-label">Highest Tile:</span><span class="stat-value" id="go-highest">2</span></div>
        <div class="stat-row"><span class="stat-label">Best Streak:</span><span class="stat-value" id="go-streak">0</span></div>
        <div class="stat-row"><span class="stat-label">Merges:</span><span class="stat-value" id="go-merges">0</span></div>
      </div>
      <div class="menu-buttons">
        <button class="btn btn-primary" data-action="retry">Retry</button>
        <button class="btn btn-secondary" data-action="menu">Main Menu</button>
      </div>`;
  }

  _buildWin() {
    const el = this.screens.win;
    el.innerHTML = `
      <h2 class="screen-title">FUSION ACHIEVED!</h2>
      <div class="win-stats" aria-live="assertive">
        <div class="stat-row"><span class="stat-label">Score:</span><span class="stat-value" id="win-score">0</span></div>
        <div class="stat-row"><span class="stat-label">Highest Tile:</span><span class="stat-value" id="win-highest">2048</span></div>
        <div class="stat-row"><span class="stat-label">Best Streak:</span><span class="stat-value" id="win-streak">0</span></div>
      </div>
      <div class="menu-buttons">
        <button class="btn btn-primary" data-action="continue">Continue Playing</button>
        <button class="btn btn-secondary" data-action="menu">Main Menu</button>
      </div>`;
  }

  _buildChallenges() {
    const el = this.screens.challenges;
    el.innerHTML = `
      <h2 class="screen-title">Challenges</h2>
      <div class="challenge-list" id="challenge-list" role="list" aria-label="Available challenges"></div>
      <button class="btn btn-back" data-action="back">Back</button>`;
  }

  _buildDailyPuzzle() {
    const el = this.screens.daily_puzzle;
    el.innerHTML = `
      <h2 class="screen-title">Daily Puzzle</h2>
      <div class="daily-info" id="daily-info">
        <div class="stat-row"><span class="stat-label">Date:</span><span class="stat-value" id="daily-date">-</span></div>
        <div class="stat-row"><span class="stat-label">Target:</span><span class="stat-value" id="daily-target">-</span></div>
        <div class="stat-row"><span class="stat-label">Attempts Left:</span><span class="stat-value" id="daily-attempts">3</span></div>
      </div>
      <div class="menu-buttons">
        <button class="btn btn-primary" data-action="start-daily">Play</button>
      </div>
      <div class="daily-leaderboard" id="daily-leaderboard" aria-label="Daily leaderboard"></div>
      <button class="btn btn-back" data-action="back">Back</button>`;
  }

  _buildSettings() {
    const el = this.screens.settings;
    el.innerHTML = `
      <h2 class="screen-title">Settings</h2>
      <div class="settings-group" id="settings-group"></div>
      <div class="menu-buttons">
        <button class="btn btn-danger" data-action="reset-data">Reset All Data</button>
        <button class="btn btn-back" data-action="back">Back</button>
      </div>`;
  }

  _buildStatistics() {
    const el = this.screens.statistics;
    el.innerHTML = `
      <h2 class="screen-title">Statistics</h2>
      <div class="stats-grid" id="stats-grid" aria-live="polite"></div>
      <button class="btn btn-back" data-action="back">Back</button>`;
  }

  _buildAchievements() {
    const el = this.screens.achievements;
    el.innerHTML = `
      <h2 class="screen-title">Achievements</h2>
      <div class="achievements-grid" id="achievements-grid" role="list" aria-label="Achievement list"></div>
      <button class="btn btn-back" data-action="back">Back</button>`;
  }

  _buildHUD() {
    const el = this.screens.hud;
    this.hud = el;
    el.innerHTML = `
      <div class="hud-top">
        <div class="hud-score-box">
          <div class="hud-label">SCORE</div>
          <div class="hud-value" id="hud-score" aria-live="polite">0</div>
        </div>
        <div class="hud-score-box">
          <div class="hud-label">BEST</div>
          <div class="hud-value" id="hud-best">0</div>
        </div>
        <div class="hud-streak-box">
          <div class="hud-label">STREAK</div>
          <div class="hud-value" id="hud-streak">0</div>
        </div>
        <div class="hud-level-box">
          <div class="hud-label">LEVEL</div>
          <div class="hud-value" id="hud-level">1</div>
        </div>
      </div>
      <div class="hud-powerups" id="hud-powerups" role="group" aria-label="Power-up charges">
        <button class="hud-powerup" data-powerup="undo" aria-label="Undo power-up, 0 charges" title="Undo">↩ <span class="hud-charge">0</span></button>
        <button class="hud-powerup" data-powerup="split" aria-label="Split power-up, 0 charges" title="Split">✂ <span class="hud-charge">0</span></button>
        <button class="hud-powerup" data-powerup="nuke" aria-label="Nuke power-up, 0 charges" title="Nuke">☢ <span class="hud-charge">0</span></button>
        <button class="hud-powerup" data-powerup="freeze" aria-label="Freeze power-up, 0 charges" title="Freeze">❄ <span class="hud-charge">0</span></button>
        <button class="hud-powerup" data-powerup="swap" aria-label="Swap power-up, 0 charges" title="Swap">⇄ <span class="hud-charge">0</span></button>
        <button class="hud-powerup" data-powerup="stabilize" aria-label="Stabilize power-up, 0 charges" title="Stabilize">⚓ <span class="hud-charge">0</span></button>
      </div>
      <button class="hud-pause" data-action="pause" aria-label="Pause game">⏸</button>`;
  }

  _buildAchievementToastContainer() {
    const container = document.createElement('div');
    container.id = 'achievement-toasts';
    container.className = 'achievement-toasts';
    container.setAttribute('aria-live', 'assertive');
    container.setAttribute('aria-atomic', 'false');
    return container;
  }

  _bindButtons() {
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action], [data-mode], [data-powerup], [data-setting]');
      if (!btn) return;

      const action = btn.dataset.action;
      const mode = btn.dataset.mode;
      const powerup = btn.dataset.powerup;
      const setting = btn.dataset.setting;

      if (action && this._handlers[action]) {
        this._handlers[action](btn);
      } else if (mode && this._handlers['mode']) {
        this._handlers['mode'](mode);
      } else if (powerup && this._handlers['powerup']) {
        this._handlers['powerup'](powerup);
      } else if (setting && this._handlers['setting']) {
        this._handlers['setting'](setting, btn);
      }
    });
  }

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this.currentScreen) return;

      if (e.key === 'Escape') {
        if (this.currentScreen === 'pause') {
          this._emit('resume');
        } else if (this.currentScreen !== 'splash' && this.currentScreen !== 'hud' &&
                   this.currentScreen !== 'game_over' && this.currentScreen !== 'win') {
          this._emit('back');
        }
        e.preventDefault();
      }

      if (this.currentScreen === 'hud' || this.currentScreen === null) {
        if (e.key === 'p' || e.key === 'P') {
          this._emit('pause');
          e.preventDefault();
        }
        if (e.key === 'm' || e.key === 'M') {
          this._emit('mute');
          e.preventDefault();
        }
        if (e.key === 'z' || e.key === 'Z') {
          this._emit('powerup', 'undo');
        }
      }
    });
  }

  on(event, callback) {
    if (!this._handlers) this._handlers = {};
    this._handlers[event] = callback;
  }

  _emit(event, data) {
    if (this._handlers && this._handlers[event]) {
      this._handlers[event](data);
    }
  }

  showScreen(name) {
    const prev = this.currentScreen;
    const el = this.screens[name];
    if (!el) return;

    if (prev && prev !== name) {
      const prevEl = this.screens[prev];
      if (prevEl) {
        prevEl.classList.add('screen-exit');
        prevEl.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          prevEl.style.display = 'none';
          prevEl.classList.remove('screen-exit');
        }, 250);
      }
    }

    el.style.display = 'flex';
    el.classList.remove('screen-exit');
    el.classList.add('screen-enter');
    el.setAttribute('aria-hidden', 'false');

    setTimeout(() => el.classList.remove('screen-enter'), 250);

    this.currentScreen = name;
    this._manageFocus(name);
  }

  hideScreen(name) {
    const el = this.screens[name];
    if (!el) return;
    el.classList.add('screen-exit');
    el.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('screen-exit');
    }, 250);
    if (this.currentScreen === name) {
      this.currentScreen = null;
    }
  }

  _manageFocus(screenName) {
    const screen = this.screens[screenName];
    if (!screen) return;

    const focusable = screen.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    setTimeout(() => {
      if (focusable) {
        focusable.focus();
      } else {
        screen.setAttribute('tabindex', '-1');
        screen.focus();
      }
    }, 260);
  }

  updateHUD(state) {
    if (!this.hud) return;

    const scoreEl = this.hud.querySelector('#hud-score');
    const bestEl = this.hud.querySelector('#hud-best');
    const streakEl = this.hud.querySelector('#hud-streak');
    const levelEl = this.hud.querySelector('#hud-level');

    if (scoreEl) scoreEl.textContent = state.score ?? 0;
    if (bestEl) bestEl.textContent = state.best ?? 0;
    if (streakEl) streakEl.textContent = state.streak ?? 0;
    if (levelEl) levelEl.textContent = state.level ?? 1;

    const powerups = state.powerups || {};
    const types = ['undo', 'split', 'nuke', 'freeze', 'swap', 'stabilize'];
    types.forEach(type => {
      const btn = this.hud.querySelector(`[data-powerup="${type}"]`);
      if (!btn) return;
      const charge = btn.querySelector('.hud-charge');
      const count = powerups[type] || 0;
      if (charge) charge.textContent = count;
      btn.setAttribute('aria-label', `${type} power-up, ${count} charges`);
      btn.disabled = count <= 0;
      btn.classList.toggle('powerup-empty', count <= 0);
      btn.classList.toggle('powerup-ready', count > 0);
    });
  }

  showGameOver(stats) {
    const scoreEl = this.screens.game_over.querySelector('#go-score');
    const bestEl = this.screens.game_over.querySelector('#go-best');
    const highestEl = this.screens.game_over.querySelector('#go-highest');
    const streakEl = this.screens.game_over.querySelector('#go-streak');
    const mergesEl = this.screens.game_over.querySelector('#go-merges');

    if (scoreEl) scoreEl.textContent = stats.score ?? 0;
    if (bestEl) bestEl.textContent = stats.best ?? 0;
    if (highestEl) highestEl.textContent = stats.highest ?? 2;
    if (streakEl) streakEl.textContent = stats.streak ?? 0;
    if (mergesEl) mergesEl.textContent = stats.merges ?? 0;

    this.showScreen('game_over');
  }

  showWin(stats) {
    const scoreEl = this.screens.win.querySelector('#win-score');
    const highestEl = this.screens.win.querySelector('#win-highest');
    const streakEl = this.screens.win.querySelector('#win-streak');

    if (scoreEl) scoreEl.textContent = stats.score ?? 0;
    if (highestEl) highestEl.textContent = stats.highest ?? 2048;
    if (streakEl) streakEl.textContent = stats.streak ?? 0;

    this.showScreen('win');
  }

  showPause() {
    this.showScreen('pause');
  }

  showSettings(settingsManager) {
    const group = this.screens.settings.querySelector('#settings-group');
    if (group && settingsManager) {
      this._renderSettings(group, settingsManager);
    }
    this.showScreen('settings');
  }

  _renderSettings(container, settingsManager) {
    const allSettings = settingsManager.getAll ? settingsManager.getAll() : settingsManager;
    if (!allSettings) return;

    const categories = {
      audio: 'Audio',
      visuals: 'Visuals',
      gameplay: 'Gameplay',
      controls: 'Controls',
      data: 'Data'
    };

    const grouped = {};
    Object.entries(allSettings).forEach(([key, info]) => {
      const cat = info.category || 'gameplay';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ key, ...info });
    });

    container.innerHTML = '';

    Object.entries(grouped).forEach(([cat, items]) => {
      const section = document.createElement('fieldset');
      section.className = 'settings-section';
      section.innerHTML = `<legend class="settings-section-title">${categories[cat] || cat}</legend>`;

      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'setting-row';

        const label = document.createElement('label');
        label.className = 'setting-label';
        label.setAttribute('for', `setting-${item.key}`);
        label.textContent = item.label || item.key;

        if (item.type === 'range') {
          const control = document.createElement('input');
          control.type = 'range';
          control.min = item.min || 0;
          control.max = item.max || 100;
          control.value = item.value;
          control.id = `setting-${item.key}`;
          control.setAttribute('data-setting', item.key);
          control.addEventListener('input', (e) => {
            settingsManager.set(item.key, parseInt(e.target.value));
            const valSpan = row.querySelector('.setting-value-display');
            if (valSpan) valSpan.textContent = e.target.value + '%';
          });
          row.appendChild(label);
          row.appendChild(control);
          const valSpan = document.createElement('span');
          valSpan.className = 'setting-value-display';
          valSpan.textContent = item.value + '%';
          row.appendChild(valSpan);
        } else if (item.type === 'toggle') {
          const control = document.createElement('select');
          control.id = `setting-${item.key}`;
          control.setAttribute('data-setting', item.key);
          ['On', 'Off'].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt === 'On';
            o.textContent = opt;
            o.selected = (opt === 'On') === !!item.value;
            control.appendChild(o);
          });
          control.addEventListener('change', (e) => {
            settingsManager.set(item.key, e.target.value === 'true');
          });
          row.appendChild(label);
          row.appendChild(control);
        } else if (item.type === 'tristate') {
          const control = document.createElement('select');
          control.id = `setting-${item.key}`;
          control.setAttribute('data-setting', item.key);
          (item.options || []).forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            o.selected = opt === item.value;
            control.appendChild(o);
          });
          control.addEventListener('change', (e) => {
            settingsManager.set(item.key, e.target.value);
          });
          row.appendChild(label);
          row.appendChild(control);
        }

        section.appendChild(row);
      });

      container.appendChild(section);
    });
  }

  showStats(stats) {
    const grid = this.screens.statistics.querySelector('#stats-grid');
    if (grid && stats) {
      grid.innerHTML = '';
      Object.entries(stats).forEach(([key, value]) => {
        const row = document.createElement('div');
        row.className = 'stat-row';
        const label = document.createElement('span');
        label.className = 'stat-label';
        label.textContent = this._formatStatKey(key);
        const val = document.createElement('span');
        val.className = 'stat-value';
        val.textContent = typeof value === 'number' ? value.toLocaleString() : String(value);
        row.appendChild(label);
        row.appendChild(val);
        grid.appendChild(row);
      });
    }
    this.showScreen('statistics');
  }

  _formatStatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ');
  }

  showAchievements(achievements) {
    const grid = this.screens.achievements.querySelector('#achievements-grid');
    if (grid && achievements) {
      grid.innerHTML = '';
      achievements.forEach(ach => {
        const card = document.createElement('div');
        card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
          <div class="achievement-icon">${ach.unlocked ? '★' : '☆'}</div>
          <div class="achievement-info">
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.description}</div>
            <div class="achievement-progress">${ach.progress ?? ''} / ${ach.target ?? ''}</div>
          </div>`;
        grid.appendChild(card);
      });
    }
    this.showScreen('achievements');
  }

  showChallenges(challenges) {
    const list = this.screens.challenges.querySelector('#challenge-list');
    if (list && challenges) {
      list.innerHTML = '';
      challenges.forEach(ch => {
        const item = document.createElement('div');
        item.className = `challenge-item ${ch.unlocked ? 'unlocked' : 'locked'} ${ch.completed ? 'completed' : ''}`;
        item.setAttribute('role', 'listitem');
        item.innerHTML = `
          <div class="challenge-header">
            <span class="challenge-name">${ch.name}</span>
            <span class="challenge-stars">${'★'.repeat(ch.stars || 0)}${'☆'.repeat(3 - (ch.stars || 0))}</span>
          </div>
          <div class="challenge-desc">${ch.description}</div>
          <div class="challenge-meta">
            <span>Moves: ${ch.moveLimit ?? '∞'}</span>
            <span>${ch.completed ? 'Completed' : ch.unlocked ? 'Available' : 'Locked'}</span>
          </div>`;
        if (ch.unlocked && !ch.completed) {
          item.querySelector('.challenge-name').parentElement.style.cursor = 'pointer';
          item.addEventListener('click', () => this._emit('select-challenge', ch.id));
        }
        list.appendChild(item);
      });
    }
    this.showScreen('challenges');
  }

  showDailyPuzzle(daily) {
    if (daily) {
      const dateEl = this.screens.daily_puzzle.querySelector('#daily-date');
      const targetEl = this.screens.daily_puzzle.querySelector('#daily-target');
      const attemptsEl = this.screens.daily_puzzle.querySelector('#daily-attempts');
      if (dateEl) dateEl.textContent = daily.date || '-';
      if (targetEl) targetEl.textContent = daily.target || '-';
      if (attemptsEl) attemptsEl.textContent = daily.attemptsLeft ?? 3;

      const lb = this.screens.daily_puzzle.querySelector('#daily-leaderboard');
      if (lb && daily.leaderboard && daily.leaderboard.length) {
        lb.innerHTML = '<h3>Top Scores</h3>' + daily.leaderboard
          .map((entry, i) => `<div class="stat-row"><span class="stat-label">#${i + 1}</span><span class="stat-value">${entry.score}</span></div>`)
          .join('');
      }
    }
    this.showScreen('daily_puzzle');
  }

  notifyAchievement(achievement) {
    const container = this.root.querySelector('#achievement-toasts');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-icon">★</div>
      <div class="toast-content">
        <div class="toast-title">Achievement Unlocked</div>
        <div class="toast-name">${achievement.name}</div>
      </div>`;

    container.appendChild(toast);
    toast.classList.add('toast-enter');

    const removeToast = () => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    };

    setTimeout(removeToast, 3000);
  }

  showHUD() {
    this.showScreen('hud');
  }

  hideHUD() {
    this.hideScreen('hud');
  }

  hideAll() {
    Object.values(this.screens).forEach(el => {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
      el.classList.remove('screen-enter', 'screen-exit');
    });
    this.currentScreen = null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UI };
}
