/**
 * Canvas renderer with pixel-retro style, visual effects, and themes.
 */
const Renderer = (function() {
  let canvas = null;
  let ctx = null;
  let scale = 1;
  let theme = C.THEMES.classic;

  // Visual effects state
  let shakeAmount = 0;
  let shakeDecay = 0.9;
  let flashAlpha = 0;
  let particles = [];
  let scanlineEnabled = false;

  // Offscreen buffer for pixel-retro look
  let pixelCanvas = null;
  let pixelCtx = null;
  const PIXEL_SCALE = 3;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    // Create pixel buffer
    pixelCanvas = document.createElement('canvas');
    pixelCtx = pixelCanvas.getContext('2d');
    pixelCanvas.width = Math.ceil(C.FIELD_WIDTH / PIXEL_SCALE);
    pixelCanvas.height = Math.ceil(C.FIELD_HEIGHT / PIXEL_SCALE);
    pixelCtx.imageSmoothingEnabled = false;
  }

  function resize() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const parentW = parent.clientWidth;
    const parentH = parent.clientHeight;
    const fieldAspect = C.FIELD_WIDTH / C.FIELD_HEIGHT;
    const parentAspect = parentW / parentH;

    if (parentAspect > fieldAspect) {
      canvas.height = parentH;
      canvas.width = parentH * fieldAspect;
    } else {
      canvas.width = parentW;
      canvas.height = parentW / fieldAspect;
    }

    scale = canvas.width / C.FIELD_WIDTH;
    ctx.imageSmoothingEnabled = false;
  }

  function setTheme(themeKey) {
    theme = C.THEMES[themeKey] || C.THEMES.classic;
  }

  function setScanlines(enabled) {
    scanlineEnabled = enabled;
  }

  function addShake(amount) {
    shakeAmount = Math.min(shakeAmount + amount, 10);
  }

  function addFlash(alpha) {
    flashAlpha = Math.min(flashAlpha + alpha, 0.5);
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateEffects() {
    if (shakeAmount > 0.1) shakeAmount *= shakeDecay;
    else shakeAmount = 0;
    if (flashAlpha > 0.01) flashAlpha *= 0.9;
    else flashAlpha = 0;
  }

  // --- Drawing helpers ---
  function drawRect(x, y, w, h, color) {
    pixelCtx.fillStyle = color;
    pixelCtx.fillRect(Math.floor(x / PIXEL_SCALE), Math.floor(y / PIXEL_SCALE),
      Math.ceil(w / PIXEL_SCALE), Math.ceil(h / PIXEL_SCALE));
  }

  function drawText(text, x, y, size, color, align) {
    pixelCtx.fillStyle = color;
    pixelCtx.font = `${Math.ceil(size / PIXEL_SCALE)}px 'Press Start 2P', 'Courier New', monospace`;
    pixelCtx.textAlign = align || 'center';
    pixelCtx.textBaseline = 'middle';
    pixelCtx.fillText(text, Math.floor(x / PIXEL_SCALE), Math.floor(y / PIXEL_SCALE));
  }

  function drawDashedLine(x, y1, y2, color, dashSize) {
    const ds = dashSize || 8;
    let yy = y1;
    while (yy < y2) {
      drawRect(x - 1, yy, 3, ds, color);
      yy += ds * 2;
    }
  }

  // --- Main render ---
  function renderGame(state, gameTime) {
    const t = theme;

    // Update effects
    updateEffects();
    updateParticles();

    // Apply shake
    const shakeX = (Math.random() - 0.5) * shakeAmount * 2;
    const shakeY = (Math.random() - 0.5) * shakeAmount * 2;

    // Clear pixel buffer
    pixelCtx.fillStyle = t.bg;
    pixelCtx.fillRect(0, 0, pixelCanvas.width, pixelCanvas.height);

    pixelCtx.save();
    pixelCtx.translate(shakeX / PIXEL_SCALE, shakeY / PIXEL_SCALE);

    // Center divider
    drawDashedLine(C.FIELD_WIDTH / 2, 0, C.FIELD_HEIGHT, t.divider, 10);

    // Paddles
    drawRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height, t.paddle1);
    drawRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height, t.paddle2);

    // Ball
    drawRect(state.ball.x - C.BALL_SIZE / 2, state.ball.y - C.BALL_SIZE / 2, C.BALL_SIZE, C.BALL_SIZE, t.ball);

    // Particles
    for (const p of particles) {
      pixelCtx.globalAlpha = p.life;
      drawRect(p.x, p.y, p.size, p.size, p.color);
    }
    pixelCtx.globalAlpha = 1;

    pixelCtx.restore();

    // Scale to main canvas
    ctx.drawImage(pixelCanvas, 0, 0,
      canvas.width, canvas.height);

    // Flash overlay
    if (flashAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Scanlines
    if (scanlineEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
    }

    // Scores
    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(24, Math.floor(48 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(state.score1, C.FIELD_WIDTH / 4 * scale, 30 * scale);
    ctx.fillText(state.score2, C.FIELD_WIDTH * 3 / 4 * scale, 30 * scale);

    // Mode indicator
    if (state.isPractice) {
      ctx.fillStyle = t.accent;
      ctx.font = `${Math.max(10, Math.floor(14 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
      ctx.fillText('PRACTICE', C.FIELD_WIDTH / 2 * scale, 30 * scale);
    }
  }

  function renderCountdown(count, state) {
    renderGame(state, 0);
    const t = theme;
    const text = count > 0 ? String(count) : 'GO!';
    const color = count > 0 ? t.fg : t.accent;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color;
    ctx.font = `${Math.max(32, Math.floor(80 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale);
  }

  function renderPaused(state) {
    renderGame(state, 0);
    const t = theme;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(24, Math.floor(48 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale - 30 * scale);

    ctx.font = `${Math.max(10, Math.floor(16 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.fillText('Press ESC to resume', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale + 30 * scale);
    ctx.fillText('Press M to mute', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale + 55 * scale);
  }

  function renderResults(state, winner, stats) {
    const t = theme;

    // Dark background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scanlines
    if (scanlineEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
    }

    const isP1Win = winner === 1;
    const winLabel = state.isPractice ? 'PRACTICE COMPLETE' :
      (state.mode === 'ai' ? (isP1Win ? 'YOU WIN!' : 'AI WINS!') :
        `PLAYER ${winner} WINS!`);

    ctx.fillStyle = t.accent;
    ctx.font = `${Math.max(20, Math.floor(40 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(winLabel, C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale - 60 * scale);

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(16, Math.floor(28 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.fillText(`${state.score1} - ${state.score2}`, C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale - 10 * scale);

    // Stats
    ctx.font = `${Math.max(8, Math.floor(12 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.fillStyle = t.accent;
    const streakText = stats && stats.currentWinStreak > 1 ?
      `Win Streak: ${stats.currentWinStreak}` : '';
    if (streakText) {
      ctx.fillText(streakText, C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale + 30 * scale);
    }

    ctx.fillStyle = t.fg;
    ctx.fillText('Press ENTER for rematch', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale + 60 * scale);
    ctx.fillText('Press ESC for menu', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale + 85 * scale);
  }

  // --- Menu rendering ---
  function renderMainMenu(menuState) {
    const t = theme;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scanlines
    if (scanlineEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
    }

    // Title
    ctx.fillStyle = t.accent;
    ctx.font = `${Math.max(28, Math.floor(56 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PONG', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 3 * scale);

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(8, Math.floor(12 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.fillText('PIXEL RETRO EDITION', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 3 * scale + 30 * scale);

    // Menu items
    const items = ['PLAY', 'STATS', 'SETTINGS', 'DEMO MODE'];
    const startY = C.FIELD_HEIGHT / 2 * scale;
    const itemH = 40 * scale;

    ctx.font = `${Math.max(12, Math.floor(20 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    items.forEach((item, i) => {
      const y = startY + i * itemH;
      const selected = i === menuState.selectedIndex;
      ctx.fillStyle = selected ? t.accent : t.fg;
      const prefix = selected ? '> ' : '  ';
      ctx.fillText(prefix + item, C.FIELD_WIDTH / 2 * scale, y);
    });

    // Mute indicator
    if (menuState.muted) {
      ctx.fillStyle = t.accent;
      ctx.font = `${Math.max(8, Math.floor(10 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
      ctx.textAlign = 'right';
      ctx.fillText('MUTED', (C.FIELD_WIDTH - 20) * scale, 25 * scale);
    }
  }

  function renderModeSelect(menuState) {
    const t = theme;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (scanlineEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
    }

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(16, Math.floor(28 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SELECT MODE', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 4 * scale);

    const items = ['2 PLAYERS', 'VS AI', 'PRACTICE', '< BACK'];
    const startY = C.FIELD_HEIGHT / 2 * scale;
    const itemH = 36 * scale;

    ctx.font = `${Math.max(12, Math.floor(18 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    items.forEach((item, i) => {
      const y = startY + i * itemH;
      const selected = i === menuState.selectedIndex;
      ctx.fillStyle = selected ? t.accent : t.fg;
      const prefix = selected ? '> ' : '  ';
      ctx.fillText(prefix + item, C.FIELD_WIDTH / 2 * scale, y);
    });
  }

  function renderDifficultySelect(menuState) {
    const t = theme;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (scanlineEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
    }

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(16, Math.floor(28 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI DIFFICULTY', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 4 * scale);

    const items = ['EASY', 'MEDIUM', 'HARD', 'IMPOSSIBLE', '< BACK'];
    const startY = C.FIELD_HEIGHT / 2 * scale;
    const itemH = 36 * scale;

    ctx.font = `${Math.max(12, Math.floor(18 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    items.forEach((item, i) => {
      const y = startY + i * itemH;
      const selected = i === menuState.selectedIndex;
      ctx.fillStyle = selected ? t.accent : t.fg;
      const prefix = selected ? '> ' : '  ';
      ctx.fillText(prefix + item, C.FIELD_WIDTH / 2 * scale, y);
    });
  }

  function renderSettings(settings, menuState) {
    const t = theme;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (scanlineEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
    }

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(16, Math.floor(28 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SETTINGS', C.FIELD_WIDTH / 2 * scale, 40 * scale);

    const items = [
      `MUSIC VOL: ${Math.round(settings.musicVolume * 100)}%`,
      `SFX VOL: ${Math.round(settings.sfxVolume * 100)}%`,
      `MATCH: ${settings.winScore === 11 ? 'FULL (11)' : 'SHORT (5)'}`,
      `PADDLE: ${settings.paddleSize.toUpperCase()}`,
      `CRT EFFECT: ${settings.crtEffect ? 'ON' : 'OFF'}`,
      `SCREEN SHAKE: ${settings.screenShake ? 'ON' : 'OFF'}`,
      `REDUCED FLASH: ${settings.reducedFlash ? 'ON' : 'OFF'}`,
      `THEME: ${settings.theme.toUpperCase()}`,
      `PAUSE ON BLUR: ${settings.pauseOnBlur ? 'ON' : 'OFF'}`,
      'CONTROLS',
      'STATS',
      '< BACK',
    ];

    const startY = 90 * scale;
    const itemH = 30 * scale;
    const maxVisible = Math.min(items.length, Math.floor((canvas.height - 120 * scale) / itemH));
    const scrollOffset = Math.max(0, menuState.selectedIndex - Math.floor(maxVisible / 2));

    ctx.font = `${Math.max(9, Math.floor(14 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    items.forEach((item, i) => {
      if (i < scrollOffset || i >= scrollOffset + maxVisible) return;
      const y = startY + (i - scrollOffset) * itemH;
      const selected = i === menuState.selectedIndex;
      ctx.fillStyle = selected ? t.accent : t.fg;
      const prefix = selected ? '> ' : '  ';
      ctx.fillText(prefix + item, C.FIELD_WIDTH / 2 * scale, y);
    });

    // Show sub-options for selected item
    if (menuState.subMode === 'stats') {
      renderStatsScreen(t, scale);
      return;
    }

    if (menuState.subMode) {
      ctx.fillStyle = t.accent;
      ctx.font = `${Math.max(8, Math.floor(12 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
      ctx.fillText(menuState.subHint || '', C.FIELD_WIDTH / 2 * scale, (canvas.height / scale - 40) * scale);
    }
  }

  function renderStatsScreen(t, sc) {
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (scanlineEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }
    }

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(16, Math.floor(28 * sc))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STATISTICS', C.FIELD_WIDTH / 2 * sc, 40 * sc);

    // Get stats from localStorage
    let s = { totalMatches: 0, wins: 0, losses: 0, totalPointsScored: 0, currentWinStreak: 0, bestWinStreak: 0, matchesVsAI: 0, winsVsAI: 0, matches2P: 0, wins2P: 0 };
    try {
      const stored = localStorage.getItem('pong_stats');
      if (stored) s = { ...s, ...JSON.parse(stored) };
    } catch(e) {}

    const lines = [
      `MATCHES: ${s.totalMatches}`,
      `WINS: ${s.wins}  LOSSES: ${s.losses}`,
      `POINTS SCORED: ${s.totalPointsScored}`,
      `WIN STREAK: ${s.currentWinStreak}`,
      `BEST STREAK: ${s.bestWinStreak}`,
      `VS AI: ${s.winsVsAI}/${s.matchesVsAI}`,
      `2P WINS: ${s.wins2P}/${s.matches2P}`,
    ];

    ctx.font = `${Math.max(9, Math.floor(13 * sc))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.fillStyle = t.accent;
    lines.forEach((line, i) => {
      ctx.fillText(line, C.FIELD_WIDTH / 2 * sc, (90 + i * 32) * sc);
    });

    ctx.fillStyle = t.fg;
    ctx.font = `${Math.max(8, Math.floor(11 * sc))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.fillText('Press ENTER to go back', C.FIELD_WIDTH / 2 * sc, (canvas.height / sc - 40) * sc);
  }

  function renderAttract(state) {
    renderGame(state, 0);
    const t = theme;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = t.accent;
    ctx.font = `${Math.max(12, Math.floor(20 * scale))}px 'Press Start 2P', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRESS ENTER TO START', C.FIELD_WIDTH / 2 * scale, C.FIELD_HEIGHT / 2 * scale);
  }

  return {
    init,
    resize,
    setTheme,
    setScanlines,
    addShake,
    addFlash,
    spawnParticles,
    updateParticles,
    renderGame,
    renderCountdown,
    renderPaused,
    renderResults,
    renderMainMenu,
    renderModeSelect,
    renderDifficultySelect,
    renderSettings,
    renderAttract,
  };
})();
