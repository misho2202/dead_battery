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
  G.totalBatteries = 0;
  let totalPossible = 0;
  for (const def of G.LEVELS) {
    for (const r of def.rows) for (const c of r) if (c === 'B') totalPossible++;
  }

  function startTitle() {
    state = 'title';
    G.ui.showScreen(
      'Aetherra: Last Spark',
      'The world is poisoned by discarded batteries.\n' +
      'Collect them, restore the land, save Aetherra.\n\n' +
      'Move: ← →   Jump: Space   Sprint: Shift   Interact: E\n' +
      `Best run: ${G.save.getBest()} batteries`,
      'Start',
      () => loadLevel(0)
    );
  }

  function loadLevel(i) {
    levelIdx = i;
    level = new G.Level(G.LEVELS[i]);
    player = new G.Player(level.spawn.x, level.spawn.y);
    G.player = player;
    camX = 0; camY = 0;
    state = 'playing';
    G.ui.hideScreen();
    G.ui.hideDialog();
    G.ui.showDialog(level.name, level.hint);
    setTimeout(() => { if (state === 'playing') G.ui.hideDialog(); }, 3500);
  }

  function respawn() {
    // Restore health, return to spawn, keep batteries collected
    player = new G.Player(level.spawn.x, level.spawn.y);
    G.player = player;
  }

  function nextLevel() {
    if (levelIdx + 1 < G.LEVELS.length) {
      loadLevel(levelIdx + 1);
    } else {
      finishGame();
    }
  }

  function finishGame() {
    state = 'ending';
    G.save.setBest(G.totalBatteries);
    const pct = totalPossible > 0 ? G.totalBatteries / totalPossible : 0;
    let title, text;
    if (pct >= 0.85) {
      title = '🌿 Good Ending';
      text = `Aetherra is reborn. The fog lifts, plants regrow, the wildlife returns.\n\nYou collected ${G.totalBatteries} of ${totalPossible} batteries (${Math.round(pct*100)}%).\nBatteries are not waste — they are a responsibility.`;
      G.sfx.win();
    } else if (pct >= 0.40) {
      title = '🌫️ Partial Ending';
      text = `Some regions begin to heal, but corruption lingers.\n\nYou collected ${G.totalBatteries} of ${totalPossible} batteries (${Math.round(pct*100)}%).\nThere is still hope, if more is gathered.`;
      G.sfx.win();
    } else {
      title = '⚠️ Bad Ending';
      text = `The damage was too great. Aetherra fades into silence.\n\nYou collected ${G.totalBatteries} of ${totalPossible} batteries (${Math.round(pct*100)}%).\nTry again — the world depends on it.`;
      G.sfx.bad();
    }
    G.ui.showScreen(title, text, 'Play Again', () => {
      G.totalBatteries = 0;
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

    if (state === 'dialog') {
      if (G.input.interact() || G.input.jump()) {
        state = 'playing';
        G.ui.hideDialog();
      }
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

    // Drain dialog queue
    if (level.dialogQueue) {
      G.ui.showDialog(level.dialogQueue.name, level.dialogQueue.text);
      state = 'dialog';
      level.dialogQueue = null;
    }

    // Exit reached
    if (level.exitRect && G.rectsOverlap(playerRect, level.exitRect)) {
      G.sfx.power();
      if (levelIdx + 1 >= G.LEVELS.length) {
        finishGame();
        return;
      }
      state = 'levelComplete';
      const pct = level.batteriesTotal > 0 ? Math.round(level.batteriesGot / level.batteriesTotal * 100) : 100;
      G.ui.showScreen(
        `${level.name} — Cleared`,
        `Batteries: ${level.batteriesGot} / ${level.batteriesTotal}  (${pct}% restored)\nTotal collected so far: ${G.totalBatteries}`,
        'Next Level',
        () => nextLevel()
      );
    }

    updateCamera();
  }

  function draw() {
    if (!level) return;
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

    G.ui.setHud(level, G.totalBatteries, G.save.getBest());
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

  startTitle();
  requestAnimationFrame(now => { lastT = now; frame(now); });
})(window.Game);
