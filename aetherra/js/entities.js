window.Game = window.Game || {};
(function(G){
  const TILE = 24;

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  G.rectsOverlap = rectsOverlap;

  // ---------- Battery ----------
  const batteryImg = new Image();
  batteryImg.src = 'dead_battery.png';
  let batteryImgReady = false;
  batteryImg.addEventListener('load',  () => { batteryImgReady = true; });
  batteryImg.addEventListener('error', () => { batteryImgReady = false; });

  G.Battery = class {
    // Portrait-oriented battery: 18 wide x 28 tall
    constructor(cx, cy) {
      this.x = cx - 9; this.y = cy - 14; this.w = 18; this.h = 28;
      this.alive = true; this.t = Math.random() * 6.28;
    }
    update(dt) { this.t += dt * 4; }
    onPlayerOverlap(player, level) {
      if (!this.alive) return;
      this.alive = false;
      level.batteriesGot++;
      G.totalBatteries = (G.totalBatteries||0) + 1;
      G.sfx.collect();
    }
    draw(ctx, camX, camY) {
      const px = this.x - camX, py = this.y - camY + Math.sin(this.t) * 2;
      // soft red glow (intensifies in the time-warning window)
      const warn = !!G.timeWarn;
      const pulse = warn ? (0.55 + Math.sin(this.t * 3) * 0.25) : 0.22;
      const pad = warn ? 6 : 3;
      ctx.fillStyle = `rgba(255,${warn ? 200 : 80},${warn ? 80 : 80},${pulse})`;
      ctx.fillRect(px - pad, py - pad, this.w + pad*2, this.h + pad*2);
      if (batteryImgReady) {
        ctx.drawImage(batteryImg, px, py, this.w, this.h);
      } else {
        // fallback while image loads / if it fails
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(px, py + 2, this.w, this.h - 4);
        ctx.fillStyle = '#222';
        ctx.fillRect(px, py + 2, this.w, 2);
        ctx.fillRect(px, py + this.h - 3, this.w, 2);
        ctx.fillStyle = '#d12a2a';
        ctx.fillRect(px, py + this.h - 10, this.w, 7);
      }
    }
  };

  // ---------- Switch ----------
  G.Switch = class {
    constructor(x, y) {
      this.x = x + 4; this.y = y + 8; this.w = 16; this.h = 16;
      this.activated = false; this.alive = true;
    }
    update() {}
    onPlayerOverlap() {} // requires interact
    interact(player, level) {
      if (this.activated) return false;
      this.activated = true;
      level.doorOpen = true;
      G.sfx.power();
      G.ui.showDialog(G.t('system'), G.t('switch_msg'), { autoHide: 6000, hideHint: true });
      return true;
    }
    draw(ctx, camX, camY) {
      const px = this.x - camX, py = this.y - camY;
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(px, py + 8, 16, 8);
      ctx.fillStyle = this.activated ? '#4ad6a0' : '#d04040';
      ctx.fillRect(px + 4, py + (this.activated ? 6 : 2), 8, 8);
    }
  };

  // ---------- Generator (puzzle target) ----------
  G.Generator = class {
    constructor(x, y) {
      this.x = x; this.y = y - 8; this.w = 24; this.h = 32;
      this.powered = false; this.alive = true; this.t = 0;
    }
    update(dt) { this.t += dt; }
    onPlayerOverlap() {}
    interact(player, level) {
      if (this.powered) return false;
      this.powered = true;
      level.doorOpen = true;
      G.sfx.power();
      level.dialogQueue = { name: 'Generator', text: 'Power restored. The way is open.' };
      return true;
    }
    draw(ctx, camX, camY) {
      const px = this.x - camX, py = this.y - camY;
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(px, py + 8, 24, 24);
      ctx.fillStyle = this.powered ? '#4ad6a0' : '#5a5a5a';
      ctx.fillRect(px + 4, py + 12, 16, 16);
      if (this.powered) {
        const f = Math.sin(this.t * 8) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(122,245,192,${0.4 + f*0.4})`;
        ctx.fillRect(px + 6, py + 14, 12, 12);
      }
      ctx.fillStyle = '#888';
      ctx.fillRect(px + 10, py + 4, 4, 6);
    }
  };

  // ---------- Moving Platform ----------
  G.MovingPlatform = class {
    constructor(x, y, axis) {
      this.x = x; this.y = y; this.w = TILE * 2; this.h = 8;
      this.ox = x; this.oy = y;
      this.axis = axis; // 'h' or 'v'
      this.t = 0; this.alive = true;
      this.prevX = x; this.prevY = y;
    }
    update(dt) {
      this.prevX = this.x; this.prevY = this.y;
      this.t += dt;
      const range = 64;
      const off = Math.sin(this.t * 1.2) * range;
      if (this.axis === 'h') this.x = this.ox + off;
      else this.y = this.oy + off;
    }
    onPlayerOverlap(player) {
      // Carry player if standing on top
      if (player.vy >= 0 && (player.y + player.h) <= this.y + 4 && (player.y + player.h) >= this.y - 2 &&
          player.x + player.w > this.x && player.x < this.x + this.w) {
        player.x += this.x - this.prevX;
        player.y = this.y - player.h - 0.001;
        player.vy = 0; player.onGround = true;
      }
    }
    isSolidTopFor(player) { return true; }
    draw(ctx, camX, camY) {
      const px = this.x - camX, py = this.y - camY;
      ctx.fillStyle = '#7a8498';
      ctx.fillRect(px, py, this.w, this.h);
      ctx.fillStyle = '#aab2c8';
      ctx.fillRect(px, py, this.w, 2);
    }
  };

  // ---------- Creature ----------
  G.Creature = class {
    constructor(x, y) {
      this.x = x; this.y = y + TILE - 16; this.w = 20; this.h = 16;
      this.vx = -28; this.alive = true; this.t = 0;
    }
    update(dt, level) {
      this.t += dt;
      const nx = this.x + this.vx * dt;
      // Turn at wall or ledge
      const checkX = this.vx > 0 ? nx + this.w + 1 : nx - 1;
      const footY = this.y + this.h + 2;
      if (level.isSolidAt(checkX, this.y + this.h/2) || !level.isSolidAt(checkX, footY)) {
        this.vx = -this.vx;
      } else {
        this.x = nx;
      }
    }
    onPlayerOverlap(player) {
      if (!this.alive) return;
      // Stomp from above
      if (player.vy > 60 && (player.y + player.h) - this.y < 10) {
        this.alive = false;
        player.vy = -260;
        G.sfx.power();
      } else {
        player.hurt(1);
      }
    }
    draw(ctx, camX, camY) {
      const px = this.x - camX, py = this.y - camY;
      const bob = Math.sin(this.t*6) * 1;
      ctx.fillStyle = '#a040c0';
      ctx.fillRect(px, py + bob, this.w, this.h);
      ctx.fillStyle = '#ff60aa';
      ctx.fillRect(px + 2, py + 2 + bob, 4, 4);
      ctx.fillRect(px + this.w - 6, py + 2 + bob, 4, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(px + 3, py + 3 + bob, 2, 2);
      ctx.fillRect(px + this.w - 5, py + 3 + bob, 2, 2);
    }
  };

  // ---------- NPC ----------
  const NPC_LINES = {
    forest: {
      helper: 'I marked safe paths with batteries. Follow them — the toxic pools hurt.'
    },
    ruins: {
      opposer: 'You waste your time. This place is dead. Turn back, child.'
    }
  };
  G.NPC = class {
    constructor(x, y, kind, levelId) {
      this.x = x; this.y = y; this.w = TILE; this.h = TILE;
      this.kind = kind; this.alive = true;
      this.line = (NPC_LINES[levelId] && NPC_LINES[levelId][kind]) || 'Hello, traveler.';
      this.spoken = false;
    }
    update() {}
    onPlayerOverlap() {}
    interact(player, level) {
      level.dialogQueue = { name: this.kind === 'helper' ? 'Helper' : 'Opposer', text: this.line };
      this.spoken = true;
      return true;
    }
    draw(ctx, camX, camY) {
      const px = this.x - camX, py = this.y - camY;
      const c = this.kind === 'helper' ? '#4ad6a0' : '#d06060';
      ctx.fillStyle = c;
      ctx.fillRect(px+4, py+8, 16, 16);
      ctx.fillStyle = '#f0d8b0';
      ctx.fillRect(px+6, py+2, 12, 8);
      // exclamation
      if (!this.spoken) {
        ctx.fillStyle = '#ffe070';
        ctx.fillRect(px+10, py-10, 4, 6);
        ctx.fillRect(px+10, py-2, 4, 2);
      }
    }
  };

  // ---------- Falling Debris ----------
  G.FallingDebris = class {
    constructor(x, y) {
      this.x = x; this.y = y; this.w = 14; this.h = 14;
      this.vy = 0; this.alive = true;
    }
    update(dt, level) {
      this.vy += 700 * dt;
      this.y += this.vy * dt;
      if (level.isSolidAt(this.x + 7, this.y + this.h)) this.alive = false;
      if (this.y > level.h * TILE + 200) this.alive = false;
    }
    onPlayerOverlap(player) {
      if (!this.alive) return;
      this.alive = false;
      player.hurt(1);
    }
    draw(ctx, camX, camY) {
      const cx = this.x - camX + this.w / 2;
      const cy = this.y - camY + this.h / 2;
      const t = performance.now() / 60;
      // outer red glow
      ctx.fillStyle = 'rgba(255,80,20,0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();
      // red flame body
      ctx.fillStyle = '#ff2810';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      // orange middle
      ctx.fillStyle = '#ffaa30';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // yellow core
      ctx.fillStyle = '#ffee80';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(t) * 0.6, cy + Math.cos(t) * 0.6, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // flame trail above (the fireball is falling)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(255,${110 + i * 25},${i * 25},${0.55 - i * 0.12})`;
        ctx.beginPath();
        ctx.arc(cx + Math.sin(t + i) * 1.6, cy - 6 - i * 4, 3.5 - i * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // ---------- Debris Emitter ----------
  G.DebrisEmitter = class {
    constructor(x, y) {
      this.x = x; this.y = y; this.w = TILE*4; this.h = TILE*8;
      this.alive = true; this.cd = 1.0 + Math.random()*0.4;
    }
    update(dt, level, player) {
      if (!player) return;
      const pcx = player.x + player.w/2;
      if (Math.abs(pcx - (this.x + TILE/2)) < TILE*3 && player.y > this.y) {
        this.cd -= dt;
        if (this.cd <= 0) {
          this.cd = 1.2 + (Math.random()*0.2 - 0.1);
          level.entities.push(new G.FallingDebris(this.x + 5 + Math.random()*10, this.y));
        }
      }
    }
    onPlayerOverlap() {} // emitter is a detection zone, not a damaging entity
    draw(ctx, camX, camY) {
      const px = this.x - camX, py = this.y - camY;
      const t = performance.now() / 200;
      const flicker = 0.5 + Math.sin(t * 3) * 0.2;
      // dark red base block
      ctx.fillStyle = '#5a0a0a';
      ctx.fillRect(px, py, TILE, TILE);
      // bright red core
      ctx.fillStyle = '#c01010';
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      // glowing inner
      ctx.fillStyle = `rgba(255,80,40,${flicker})`;
      ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
      // hot mouth at the bottom (where fire drops out)
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(px + 6, py + TILE - 6, TILE - 12, 4);
      ctx.fillStyle = `rgba(255,180,40,${flicker})`;
      ctx.fillRect(px + 7, py + TILE - 5, TILE - 14, 2);
    }
  };
})(window.Game);
