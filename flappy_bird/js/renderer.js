/**
 * Canvas renderer for Flappy Bird.
 */
window.Renderer = (function() {
  let canvas = null;
  let ctx = null;
  let scale = 1;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
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
    ctx.imageSmoothingEnabled = true;
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, C.COLORS.sky);
    grad.addColorStop(1, C.COLORS.skyDark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGround(offset) {
    const groundH = C.GROUND_HEIGHT * scale;
    const groundY = (C.FIELD_HEIGHT - C.GROUND_HEIGHT) * scale;
    const off = (offset || 0) * scale;

    ctx.fillStyle = C.COLORS.ground;
    ctx.fillRect(0, groundY, canvas.width, groundH);

    // Top edge
    ctx.fillStyle = C.COLORS.groundStripe;
    ctx.fillRect(0, groundY, canvas.width, 3 * scale);

    // Stripes
    ctx.fillStyle = C.COLORS.groundDark;
    const stripeW = 24 * scale;
    for (let x = -off; x < canvas.width; x += 48 * scale) {
      ctx.fillRect(x, groundY + 3 * scale, stripeW, groundH - 3 * scale);
    }
  }

  function drawPipe(pipe) {
    const x = pipe.x * scale;
    const w = C.PIPE_WIDTH * scale;
    const groundY = (C.FIELD_HEIGHT - C.GROUND_HEIGHT) * scale;
    const gapTop = pipe.gapTop * scale;
    const gapBottom = pipe.gapBottom * scale;
    const capH = 24 * scale;
    const capOverhang = 4 * scale;

    // Top pipe body
    ctx.fillStyle = C.COLORS.pipe;
    ctx.fillRect(x, 0, w, gapTop);

    // Top pipe highlight
    ctx.fillStyle = C.COLORS.pipeLight;
    ctx.fillRect(x + 4 * scale, 0, 6 * scale, gapTop);

    // Top pipe shadow
    ctx.fillStyle = C.COLORS.pipeDark;
    ctx.fillRect(x + w - 8 * scale, 0, 8 * scale, gapTop);

    // Top pipe border
    ctx.strokeStyle = C.COLORS.pipeBorder;
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, 0, w, gapTop);

    // Top pipe cap
    ctx.fillStyle = C.COLORS.pipe;
    ctx.fillRect(x - capOverhang, gapTop - capH, w + capOverhang * 2, capH);
    ctx.fillStyle = C.COLORS.pipeLight;
    ctx.fillRect(x - capOverhang + 3 * scale, gapTop - capH, 6 * scale, capH);
    ctx.strokeStyle = C.COLORS.pipeBorder;
    ctx.strokeRect(x - capOverhang, gapTop - capH, w + capOverhang * 2, capH);

    // Bottom pipe body
    ctx.fillStyle = C.COLORS.pipe;
    ctx.fillRect(x, gapBottom, w, groundY - gapBottom);

    // Bottom pipe highlight
    ctx.fillStyle = C.COLORS.pipeLight;
    ctx.fillRect(x + 4 * scale, gapBottom, 6 * scale, groundY - gapBottom);

    // Bottom pipe shadow
    ctx.fillStyle = C.COLORS.pipeDark;
    ctx.fillRect(x + w - 8 * scale, gapBottom, 8 * scale, groundY - gapBottom);

    // Bottom pipe border
    ctx.strokeStyle = C.COLORS.pipeBorder;
    ctx.strokeRect(x, gapBottom, w, groundY - gapBottom);

    // Bottom pipe cap
    ctx.fillStyle = C.COLORS.pipe;
    ctx.fillRect(x - capOverhang, gapBottom, w + capOverhang * 2, capH);
    ctx.fillStyle = C.COLORS.pipeLight;
    ctx.fillRect(x - capOverhang + 3 * scale, gapBottom, 6 * scale, capH);
    ctx.strokeStyle = C.COLORS.pipeBorder;
    ctx.strokeRect(x - capOverhang, gapBottom, w + capOverhang * 2, capH);
  }

  function drawBird(bird) {
    const bx = bird.x * scale;
    const by = bird.y * scale;
    const bw = C.BIRD_WIDTH * scale;
    const bh = C.BIRD_HEIGHT * scale;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(bird.rotation);

    // Body
    ctx.fillStyle = C.COLORS.birdBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = C.COLORS.birdBelly;
    ctx.beginPath();
    ctx.ellipse(2 * scale, 3 * scale, bw / 3, bh / 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    const wingOffsets = [-2, -4, -1];
    const wingY = wingOffsets[bird.wingFrame] * scale;
    ctx.fillStyle = C.COLORS.birdWing;
    ctx.beginPath();
    ctx.ellipse(-4 * scale, wingY, bw / 3, bh / 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye white
    ctx.fillStyle = C.COLORS.birdEye;
    ctx.beginPath();
    ctx.arc(8 * scale, -4 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = C.COLORS.birdPupil;
    ctx.beginPath();
    ctx.arc(10 * scale, -4 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = C.COLORS.birdBeak;
    ctx.beginPath();
    ctx.moveTo(12 * scale, -1 * scale);
    ctx.lineTo(20 * scale, 2 * scale);
    ctx.lineTo(12 * scale, 5 * scale);
    ctx.closePath();
    ctx.fill();

    // Outline
    ctx.strokeStyle = C.COLORS.birdDark;
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawScore(score, offsetX, offsetY) {
    const x = (C.FIELD_WIDTH / 2 + (offsetX || 0)) * scale;
    const y = (50 + (offsetY || 0)) * scale;

    ctx.font = `bold ${Math.max(16, Math.floor(48 * scale))}px 'Arial Black', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Shadow
    ctx.fillStyle = C.COLORS.textShadow;
    ctx.fillText(String(score), x + 2 * scale, y + 2 * scale);

    // Main text
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.strokeStyle = C.COLORS.textShadow;
    ctx.lineWidth = 3 * scale;
    ctx.strokeText(String(score), x, y);
    ctx.fillText(String(score), x, y);
  }

  function drawStartScreen() {
    drawBackground();

    // Title
    const titleY = 120 * scale;
    ctx.font = `bold ${Math.max(18, Math.floor(42 * scale))}px 'Arial Black', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = C.COLORS.textShadow;
    ctx.fillText('Flappy Bird', C.FIELD_WIDTH / 2 * scale + 2 * scale, titleY + 2 * scale);

    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.strokeStyle = C.COLORS.textShadow;
    ctx.lineWidth = 3 * scale;
    ctx.strokeText('Flappy Bird', C.FIELD_WIDTH / 2 * scale, titleY);
    ctx.fillText('Flappy Bird', C.FIELD_WIDTH / 2 * scale, titleY);

    // Floating bird preview
    const previewBird = {
      x: C.FIELD_WIDTH / 2,
      y: 230 * scale / scale,
      vy: 0,
      rotation: 0,
      wingFrame: Math.floor(Date.now() / 300) % 3,
      wingTimer: 0,
    };
    drawBird(previewBird);

    // Instructions
    const instrY = 380 * scale;
    ctx.font = `bold ${Math.max(11, Math.floor(18 * scale))}px 'Arial Black', 'Arial', sans-serif`;
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.strokeStyle = C.COLORS.textShadow;
    ctx.lineWidth = 2.5 * scale;

    const lines = ['TAP', 'CLICK', 'or press SPACE'];
    lines.forEach((line, i) => {
      const y = instrY + i * 28 * scale;
      ctx.strokeText(line, C.FIELD_WIDTH / 2 * scale, y);
      ctx.fillText(line, C.FIELD_WIDTH / 2 * scale, y);
    });

    // Pulsing start indicator
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.font = `bold ${Math.max(10, Math.floor(14 * scale))}px 'Arial', sans-serif`;
    ctx.fillStyle = C.COLORS.birdBody;
    ctx.fillText('>>> PRESS TO START <<<', C.FIELD_WIDTH / 2 * scale, 470 * scale);
    ctx.globalAlpha = 1;

    drawGround(0);
  }

  function drawGameOverScreen(state) {
    drawBackground();

    // Draw pipes in background
    for (const pipe of state.pipes) {
      drawPipe(pipe);
    }

    // Death flash
    drawBird(state.bird);

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Game Over panel
    const panelW = 300 * scale;
    const panelH = 220 * scale;
    const panelX = (C.FIELD_WIDTH - panelW / scale) / 2 * scale;
    const panelY = 140 * scale;

    // Panel background
    ctx.fillStyle = C.COLORS.ground;
    ctx.strokeStyle = C.COLORS.pipeBorder;
    ctx.lineWidth = 3 * scale;
    roundRect(ctx, panelX, panelY, panelW, panelH, 10 * scale);
    ctx.fill();
    ctx.stroke();

    // Inner panel
    const innerPad = 15 * scale;
    ctx.fillStyle = C.COLORS.groundDark;
    roundRect(ctx, panelX + innerPad, panelY + innerPad, panelW - innerPad * 2, panelH - innerPad * 2, 6 * scale);
    ctx.fill();

    // "GAME OVER" text
    ctx.font = `bold ${Math.max(14, Math.floor(32 * scale))}px 'Arial Black', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = C.COLORS.textShadow;
    ctx.fillText('GAME OVER', C.FIELD_WIDTH / 2 * scale + 2 * scale, panelY + 22 * scale + 2 * scale);
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.strokeStyle = C.COLORS.textShadow;
    ctx.lineWidth = 2.5 * scale;
    ctx.strokeText('GAME OVER', C.FIELD_WIDTH / 2 * scale, panelY + 22 * scale);
    ctx.fillText('GAME OVER', C.FIELD_WIDTH / 2 * scale, panelY + 22 * scale);

    // Score
    const scoreY = panelY + 75 * scale;
    ctx.font = `bold ${Math.max(10, Math.floor(14 * scale))}px 'Arial', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.COLORS.textShadow;
    ctx.fillText('SCORE', panelX + 30 * scale, scoreY);
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.fillText('SCORE', panelX + 30 * scale, scoreY - 2 * scale);

    ctx.textAlign = 'right';
    ctx.font = `bold ${Math.max(12, Math.floor(22 * scale))}px 'Arial Black', 'Arial', sans-serif`;
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.fillText(String(state.score), panelX + panelW - 30 * scale, scoreY + 4 * scale);

    // Best
    const bestY = scoreY + 40 * scale;
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.max(10, Math.floor(14 * scale))}px 'Arial', sans-serif`;
    ctx.fillStyle = C.COLORS.textShadow;
    ctx.fillText('BEST', panelX + 30 * scale, bestY);
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.fillText('BEST', panelX + 30 * scale, bestY - 2 * scale);

    ctx.textAlign = 'right';
    ctx.font = `bold ${Math.max(12, Math.floor(22 * scale))}px 'Arial Black', 'Arial', sans-serif`;
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.fillText(String(state.bestScore), panelX + panelW - 30 * scale, bestY + 4 * scale);

    // New badge if score equals best and score > 0
    if (state.score === state.bestScore && state.score > 0) {
      ctx.font = `bold ${Math.max(8, Math.floor(10 * scale))}px 'Arial', sans-serif`;
      ctx.fillStyle = '#ff4444';
      ctx.textAlign = 'center';
      ctx.fillText('NEW!', panelX + panelW - 55 * scale, bestY - 4 * scale);
    }

    // Medal
    const medal = getMedal(state.score);
    if (medal) {
      const medalColors = {
        platinum: C.COLORS.medalPlatinum,
        gold: C.COLORS.medalGold,
        silver: C.COLORS.medalSilver,
        bronze: C.COLORS.medalBronze,
      };
      const medalX = panelX + 50 * scale;
      const medalY = bestY + 10 * scale;
      const medalR = 18 * scale;

      ctx.fillStyle = medalColors[medal];
      ctx.beginPath();
      ctx.arc(medalX, medalY, medalR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Star
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = `${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2605', medalX, medalY);
    }

    // Restart button
    const btnW = 160 * scale;
    const btnH = 40 * scale;
    const btnX = (C.FIELD_WIDTH - btnW / scale) / 2 * scale;
    const btnY = panelY + panelH - 60 * scale;

    ctx.fillStyle = C.COLORS.pipe;
    ctx.strokeStyle = C.COLORS.pipeBorder;
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, btnX, btnY, btnW, btnH, 6 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${Math.max(11, Math.floor(16 * scale))}px 'Arial Black', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.COLORS.textPrimary;
    ctx.strokeStyle = C.COLORS.textShadow;
    ctx.lineWidth = 2 * scale;
    ctx.strokeText('PLAY AGAIN', C.FIELD_WIDTH / 2 * scale, btnY + btnH / 2);
    ctx.fillText('PLAY AGAIN', C.FIELD_WIDTH / 2 * scale, btnY + btnH / 2);

    drawGround(state.groundOffset);
  }

  function drawPlaying(state) {
    drawBackground();

    // Draw pipes
    for (const pipe of state.pipes) {
      drawPipe(pipe);
    }

    // Draw ground
    drawGround(state.groundOffset);

    // Draw bird
    drawBird(state.bird);

    // Draw score
    drawScore(state.score);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return {
    init,
    resize,
    drawStartScreen,
    drawPlaying,
    drawGameOverScreen,
  };
})();
