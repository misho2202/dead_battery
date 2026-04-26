window.Game = window.Game || {};
(function(G){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const VW = canvas.width, VH = canvas.height;
  ctx.imageSmoothingEnabled = false;

  let state = 'title';        // title | playing | dialog | levelComplete | ending
  let levelIdx = 0;
  let level = null;
  let player = null;
  let camX = 0, camY = 0;
  let levelTimer = 40;
  const DEFAULT_LEVEL_TIME = 40;
  let carriedHealth = 3;
  let paused = false;
  let shakeT = 0, shakeMag = 0;
  let lastWarnSec = -1; // last whole second at which we played the timer beep
  G.timeWarn = false;
  G.shake = function(mag, dur) {
    shakeMag = Math.max(shakeMag, mag);
    shakeT   = Math.max(shakeT, dur);
  };
  G.totalBatteries = 0;
  let totalPossible = 0;
  for (const def of G.LEVELS) {
    for (const r of def.rows) for (const c of r) if (c === 'B') totalPossible++;
  }

  function startTitle() {
    state = 'title';
    G.ui.showScreen(
      G.t('title'),
      G.t('intro', { best: G.save.getBest() }),
      G.t('start_btn'),
      () => loadLevel(0),
      { showFlags: true }
    );
  }

  // Flag click handlers (set up once)
  for (const b of document.querySelectorAll('#lang-flags .flag')) {
    b.addEventListener('click', () => {
      G.i18n.setLang(b.dataset.lang);
    });
  }
  G.onLangChange = function() {
    if (state === 'title') startTitle();
  };

  function loadLevel(i) {
    levelIdx = i;
    level = new G.Level(G.LEVELS[i]);
    player = new G.Player(level.spawn.x, level.spawn.y);
    player.health = carriedHealth;
    G.player = player;
    camX = 0; camY = 0;
    levelTimer = (G.LEVELS[i].time != null) ? G.LEVELS[i].time : DEFAULT_LEVEL_TIME;
    lastWarnSec = -1;
    state = 'playing';
    paused = false;
    setPauseBtnIcon();
    G.ui.hideScreen();
    G.ui.hideDialog();
    G.ui.showDialog(G.ui.levelName(level), G.ui.levelHint(level), { autoHide: 6000, hideHint: true });
    G.sfx.music.start();
  }

  function respawn() {
    // Return to spawn, keep batteries collected and remaining hearts
    const h = player.health;
    player = new G.Player(level.spawn.x, level.spawn.y);
    player.health = h;
    G.player = player;
  }

  function nextLevel() {
    if (levelIdx + 1 < G.LEVELS.length) {
      carriedHealth = player.health;
      loadLevel(levelIdx + 1);
    } else {
      finishGame();
    }
  }

  function finishGame(viaExit) {
    state = 'ending';
    G.timeWarn = false;
    G.sfx.music.stop();
    G.save.setBest(G.totalBatteries);
    const allCollected = totalPossible > 0 && G.totalBatteries >= totalPossible;
    const finishedLastLevel = !!viaExit;
    let pct = totalPossible > 0 ? G.totalBatteries / totalPossible : 0;
    if (allCollected && !finishedLastLevel) pct = 0.95;
    else if (allCollected && finishedLastLevel) pct = 1.0;
    const pctRound = Math.round(pct*100);
    const vars = { got: G.totalBatteries, total: totalPossible, pct: pctRound };
    let title, text;
    if (pct >= 0.85) {
      title = G.t('ending_good_title');
      text = G.t('ending_good_text', vars);
      G.sfx.win();
    } else if (pct >= 0.40) {
      title = G.t('ending_partial_title');
      text = G.t('ending_partial_text', vars);
      G.sfx.win();
    } else {
      title = G.t('ending_bad_title');
      text = G.t('ending_bad_text', vars);
      G.sfx.bad();
    }
    G.ui.showScreen(title, text, G.t('play_again'), () => {
      G.totalBatteries = 0;
      carriedHealth = 3;
      startTitle();
    });
  }

  // Update camera smoothly to follow player
  function updateCamera() {
    const targetX = Math.max(0, Math.min(level.w * G.TILE - VW, player.x + player.w/2 - VW/2));
    const targetY = Math.max(0, Math.min(level.h * G.TILE - VH, player.y + player.h/2 - VH/2));
    camX += (targetX - camX) * 0.15;
    camY += (targetY - camY) * 0.15;
  }

  function step(dt) {
    G.input.beginFrame();

    if (state !== 'playing' && state !== 'dialog') return;

    // Pause toggle (works during dialog/playing)
    if (G.input.pressed('KeyP')) togglePause();
    if (paused) return;

    if (state === 'dialog') {
      if (G.input.interact() || G.input.jump()) {
        state = 'playing';
        G.ui.hideDialog();
      }
      return;
    }

    // Level countdown timer
    levelTimer -= dt;

    // Time-warning beeps & flag (≤10s)
    G.timeWarn = levelTimer <= 10;
    const sec = Math.ceil(Math.max(0, levelTimer));
    if (G.timeWarn && sec !== lastWarnSec && sec > 0) {
      if (sec === 10 || (sec >= 1 && sec <= 5)) {
        if (sec <= 3) G.sfx.warnFinal(); else G.sfx.warn();
      }
      lastWarnSec = sec;
    }

    if (levelTimer <= 0) {
      levelTimer = 0;
      finishGame();
      return;
    }

    // Player update
    player.update(dt, level);

    // Death handling: out of hearts -> game over (with ending),
    // otherwise (e.g. fell off the map) just respawn at level start.
    if (player.dead && player.deathT > 1.2) {
      if (player.health <= 0) {
        finishGame();
        return;
      }
      respawn();
    }

    // Entity updates + interactions
    const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    let interactTarget = null;
    for (const e of level.entities) {
      if (!e.alive) continue;
      e.update(dt, level, player);
      if (e.alive && G.rectsOverlap(playerRect, e)) {
        if (e.onPlayerOverlap) e.onPlayerOverlap(player, level);
        if (e.interact && (e instanceof G.Switch || e instanceof G.Generator || e instanceof G.NPC)) {
          interactTarget = e;
        }
      }
    }
    // Cull dead
    level.entities = level.entities.filter(e => e.alive || e instanceof G.DebrisEmitter);

    if (interactTarget && G.input.interact()) {
      interactTarget.interact(player, level);
    }

    // Drain dialog queue (blocking dialogs from entities)
    if (level.dialogQueue) {
      G.ui.showDialog(level.dialogQueue.name, level.dialogQueue.text);
      state = 'dialog';
      level.dialogQueue = null;
    }

    // Decay screen shake
    if (shakeT > 0) {
      shakeT -= dt;
      if (shakeT <= 0) { shakeT = 0; shakeMag = 0; }
    }

    // Exit reached
    if (level.exitRect && G.rectsOverlap(playerRect, level.exitRect)) {
      G.sfx.power();
      if (levelIdx + 1 >= G.LEVELS.length) {
        finishGame(true);
        return;
      }
      state = 'levelComplete';
      const pct = level.batteriesTotal > 0 ? Math.round(level.batteriesGot / level.batteriesTotal * 100) : 100;
      G.ui.showScreen(
        G.t('cleared_title', { name: G.ui.levelName(level) }),
        G.t('cleared_text', { got: level.batteriesGot, total: level.batteriesTotal, pct, tot: G.totalBatteries }),
        G.t('next_level'),
        () => nextLevel()
      );
    }

    updateCamera();
  }

  function draw() {
    if (!level) return;

    // Apply screen shake by translating the canvas
    const shakeOn = shakeT > 0 && shakeMag > 0;
    let sx = 0, sy = 0;
    if (shakeOn) {
      const k = Math.min(1, shakeT / 0.35);
      sx = (Math.random() - 0.5) * 2 * shakeMag * k;
      sy = (Math.random() - 0.5) * 2 * shakeMag * k;
    }
    ctx.save();
    if (shakeOn) ctx.translate(sx, sy);

    level.drawBackground(ctx, camX, camY, VW, VH);
    level.drawTiles(ctx, camX, camY, VW, VH);

    for (const e of level.entities) {
      if (e.alive !== false) e.draw(ctx, camX, camY);
    }

    level.drawFog(ctx, VW, VH);
    level.drawDarkness(ctx, VW, VH, player.x - camX + player.w/2, player.y - camY + player.h/2);

    // Draw player on top so the fog/darkness overlays never tint the character
    player.draw(ctx, camX, camY);

    // Interact prompt
    const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const e of level.entities) {
      if (!e.alive) continue;
      if ((e instanceof G.Switch || e instanceof G.Generator || e instanceof G.NPC) && G.rectsOverlap(playerRect, e)) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[E]', e.x - camX + e.w/2, e.y - camY - 4);
        break;
      }
    }

    ctx.restore(); // end shake transform — HUD + timer should never shake

    G.ui.setHud(level, G.totalBatteries, G.save.getBest(), { timeWarn: G.timeWarn });

    // Countdown timer (top-right)
    const t = Math.ceil(Math.max(0, levelTimer));
    const warn = t <= 10;
    const pulse = warn ? (1 + Math.sin(performance.now() / 90) * 0.18) : 1;
    ctx.save();
    ctx.font = `bold ${Math.round(22 * pulse)}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = warn ? '#ff5050' : '#ffffff';
    const tx = VW - 56, ty = 10;
    ctx.strokeText(`${t}s`, tx, ty);
    ctx.fillText(`${t}s`, tx, ty);
    if (warn) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ff8080';
      ctx.fillText('TIME!', tx, ty + Math.round(22 * pulse) + 2);
    }
    ctx.restore();

    // Pause overlay tint (over everything)
    if (paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, VW, VH);
      ctx.restore();
    }
  }

  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // Click-anywhere on screen to also resume audio
  document.addEventListener('click', () => G.sfx.resume(), { passive: true });
  document.addEventListener('touchstart', () => G.sfx.resume(), { passive: true });

  // Pause toggle (button + key)
  const pauseBtn = document.getElementById('pause-btn');
  function setPauseBtnIcon() {
    if (pauseBtn) pauseBtn.textContent = paused ? '▶' : '⏸';
  }
  function togglePause() {
    if (state !== 'playing' && state !== 'dialog') return;
    paused = !paused;
    setPauseBtnIcon();
    if (paused) {
      G.sfx.music.stop();
      G.ui.showDialog(G.t('paused'), G.t('paused_hint'), { hideHint: true });
    } else {
      G.ui.hideDialog();
      G.sfx.music.start();
    }
  }
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

  // Fullscreen toggle (mobile-friendly)
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      const el = document.documentElement;
      const inFs = document.fullscreenElement || document.webkitFullscreenElement;
      if (!inFs) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (req) req.call(el);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exit) exit.call(document);
      }
    });
  }

  startTitle();
  requestAnimationFrame(now => { lastT = now; frame(now); });
})(window.Game);
