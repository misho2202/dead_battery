window.Game = window.Game || {};
(function(G){
  const TILE = 24;
  G.TILE = TILE;

  // Tile classification
  // '#', '*', '>', '<', 'd'(closed) are full solids.
  // '=' is a one-way platform (collide only when falling onto from above).
  const SOLID_CHARS  = '#*><';
  const HAZARD_CHARS = '~^';

  function isSolidChar(ch, doorOpen) {
    if (ch === 'd') return !doorOpen;
    return SOLID_CHARS.indexOf(ch) !== -1;
  }
  function isPlatformChar(ch) { return ch === '='; }

  // Cache background images so each level only loads its image once
  const _bgImageCache = {};
  function getBgImage(src) {
    if (!src) return null;
    if (!_bgImageCache[src]) {
      const img = new Image();
      img.src = src;
      img.addEventListener('load',  () => { img._ready = true; });
      img.addEventListener('error', () => { img._ready = false; });
      _bgImageCache[src] = img;
    }
    return _bgImageCache[src];
  }

  G.Level = class Level {
    constructor(def) {
      this.def = def;
      this.name = def.name;
      this.palette = def.palette;
      this.bg = def.bg;
      this.hint = def.hint;
      this.bgImage = getBgImage(def.bgImage);

      // Pad rows to equal width
      const w = Math.max.apply(null, def.rows.map(r => r.length));
      this.h = def.rows.length;
      this.w = w;
      this.tiles = def.rows.map(r => {
        let s = r;
        while (s.length < w) s += '.';
        return s.split('');
      });

      this.doorOpen = false;
      this.batteriesTotal = 0;
      this.batteriesGot = 0;
      this.spawn = { x: 1*TILE, y: 1*TILE };
      this.exitRect = null;
      this.entities = [];
      this.dialogQueue = null;

      // Extract entities, replace tile with air where appropriate
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          const ch = this.tiles[y][x];
          if (ch === 'P') {
            this.spawn = { x: x*TILE, y: y*TILE };
            this.tiles[y][x] = '.';
          } else if (ch === 'X') {
            this.exitRect = { x: x*TILE, y: y*TILE - TILE, w: TILE, h: TILE*2 };
            this.tiles[y][x] = '.';
          } else if (ch === 'B') {
            this.entities.push(new G.Battery(x*TILE+TILE/2, y*TILE+TILE/2));
            this.batteriesTotal++;
            this.tiles[y][x] = '.';
          } else if (ch === 's') {
            this.entities.push(new G.Switch(x*TILE, y*TILE));
            this.tiles[y][x] = '.';
          } else if (ch === 'g') {
            this.entities.push(new G.Generator(x*TILE, y*TILE));
            this.tiles[y][x] = '.';
          } else if (ch === 'm') {
            this.entities.push(new G.MovingPlatform(x*TILE, y*TILE, 'h'));
            this.tiles[y][x] = '.';
          } else if (ch === 'v') {
            this.entities.push(new G.MovingPlatform(x*TILE, y*TILE, 'v'));
            this.tiles[y][x] = '.';
          } else if (ch === 'c') {
            this.entities.push(new G.Creature(x*TILE, y*TILE));
            this.tiles[y][x] = '.';
          } else if (ch === 'n') {
            this.entities.push(new G.NPC(x*TILE, y*TILE, 'helper', def.id));
            this.tiles[y][x] = '.';
          } else if (ch === 'o') {
            this.entities.push(new G.NPC(x*TILE, y*TILE, 'opposer', def.id));
            this.tiles[y][x] = '.';
          } else if (ch === '!') {
            this.entities.push(new G.DebrisEmitter(x*TILE, y*TILE));
            this.tiles[y][x] = '.';
          }
        }
      }
    }

    restoration() {
      if (this.batteriesTotal === 0) return 1;
      return this.batteriesGot / this.batteriesTotal;
    }

    tileAt(px, py) {
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      if (ty < 0 || ty >= this.h) return '.';
      if (tx < 0 || tx >= this.w) return '#';
      return this.tiles[ty][tx];
    }

    isSolidAt(px, py) {
      const ch = this.tileAt(px, py);
      return isSolidChar(ch, this.doorOpen);
    }

    isHazardAt(px, py) {
      const ch = this.tileAt(px, py);
      return HAZARD_CHARS.indexOf(ch) !== -1;
    }

    // Check if there's a one-way platform top within range during a downward move.
    platformLandY(left, right, prevBottom, newBottom) {
      if (newBottom <= prevBottom) return null;
      const tyStart = Math.floor(prevBottom / TILE);
      const tyEnd   = Math.floor(newBottom / TILE);
      for (let ty = tyStart; ty <= tyEnd; ty++) {
        const tileTop = ty * TILE;
        if (tileTop < prevBottom - 0.001) continue;
        if (tileTop > newBottom) break;
        const txL = Math.floor(left / TILE);
        const txR = Math.floor((right) / TILE);
        for (let tx = txL; tx <= txR; tx++) {
          if (tx < 0 || tx >= this.w) continue;
          if (this.tiles[ty] && this.tiles[ty][tx] === '=') {
            return tileTop;
          }
        }
      }
      return null;
    }

    // AABB sweep against tile grid. Returns new {x, y, vx, vy, onGround, hitCeiling, conveyor}
    move(rect, vx, vy, dt) {
      let x = rect.x, y = rect.y, w = rect.w, h = rect.h;
      const prevBottom = y + h;
      let onGround = false, hitCeiling = false, conveyor = 0;

      // Move X
      let dx = vx * dt;
      x += dx;
      if (dx > 0) {
        const right = x + w;
        const top = y, bot = y + h - 1;
        for (let py = top; py <= bot; py += TILE) {
          if (this.isSolidAt(right, py)) {
            x = Math.floor(right / TILE) * TILE - w - 0.001;
            vx = 0; break;
          }
        }
        if (this.isSolidAt(x + w, bot)) {
          x = Math.floor((x + w) / TILE) * TILE - w - 0.001;
          vx = 0;
        }
      } else if (dx < 0) {
        const left = x;
        const top = y, bot = y + h - 1;
        for (let py = top; py <= bot; py += TILE) {
          if (this.isSolidAt(left, py)) {
            x = (Math.floor(left / TILE) + 1) * TILE + 0.001;
            vx = 0; break;
          }
        }
        if (this.isSolidAt(x, bot)) {
          x = (Math.floor(x / TILE) + 1) * TILE + 0.001;
          vx = 0;
        }
      }

      // Move Y
      let dy = vy * dt;
      y += dy;
      if (dy > 0) {
        const bot = y + h;
        const left = x, right = x + w - 1;
        let collided = false;
        for (let px = left; px <= right; px += TILE) {
          if (this.isSolidAt(px, bot)) { collided = true; break; }
        }
        if (!collided && this.isSolidAt(right, bot)) collided = true;
        if (collided) {
          y = Math.floor(bot / TILE) * TILE - h - 0.001;
          vy = 0; onGround = true;
        } else {
          // One-way platform: land if we crossed a '=' tile top this frame
          const landY = this.platformLandY(left, right, prevBottom, y + h);
          if (landY !== null) {
            y = landY - h - 0.001;
            vy = 0; onGround = true;
          }
        }
        if (onGround) {
          const fy = y + h + 1;
          const cl = this.tileAt(left, fy);
          const cr = this.tileAt(right, fy);
          if (cl === '>' || cr === '>') conveyor = 60;
          if (cl === '<' || cr === '<') conveyor = -60;
        }
      } else if (dy < 0) {
        const top = y;
        const left = x, right = x + w - 1;
        let collided = false, bumpX = -1, bumpY = -1;
        for (let px = left; px <= right; px += TILE) {
          if (this.isSolidAt(px, top)) {
            collided = true;
            bumpX = Math.floor(px / TILE);
            bumpY = Math.floor(top / TILE);
            break;
          }
        }
        if (!collided && this.isSolidAt(right, top)) {
          collided = true;
          bumpX = Math.floor(right / TILE);
          bumpY = Math.floor(top / TILE);
        }
        if (collided) {
          y = (Math.floor(top / TILE) + 1) * TILE + 0.001;
          vy = 0; hitCeiling = true;
          // Break breakable above
          if (bumpX >= 0 && bumpY >= 0 && this.tiles[bumpY] && this.tiles[bumpY][bumpX] === '*') {
            this.tiles[bumpY][bumpX] = '.';
            G.sfx.power();
          }
        }
      }

      return { x, y, vx, vy, onGround, hitCeiling, conveyor };
    }

    // ---------- RENDER ----------
    drawBackground(ctx, camX, camY, vw, vh) {
      const p = this.palette;
      // sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, vh);
      grad.addColorStop(0, p.skyTop);
      grad.addColorStop(1, p.sky);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, vw, vh);

      // Custom background image (parallax-scrolled, tiled horizontally)
      if (this.bgImage && this.bgImage._ready) {
        const img = this.bgImage;
        const scale = vh / img.height;
        const drawW = img.width * scale;
        const offset = (camX * 0.4) % drawW;
        for (let dx = -offset; dx < vw; dx += drawW) {
          ctx.drawImage(img, dx, 0, drawW, vh);
        }
        return; // skip procedural silhouettes when a custom image is provided
      }

      // Parallax silhouettes
      const r = this.restoration();
      ctx.save();
      ctx.globalAlpha = 0.55;
      const layer1 = -camX * 0.2;
      ctx.fillStyle = p.solid;
      for (let i = 0; i < 12; i++) {
        const bx = (i * 140 + layer1) % (vw + 280) - 140;
        if (this.bg === 'city') {
          ctx.fillRect(bx, vh - 160, 60, 160);
          ctx.fillRect(bx + 70, vh - 200, 50, 200);
        } else if (this.bg === 'forest') {
          ctx.beginPath();
          ctx.moveTo(bx, vh);
          ctx.lineTo(bx + 50, vh - 110 - (i%3)*20);
          ctx.lineTo(bx + 100, vh);
          ctx.fill();
        } else if (this.bg === 'ruins') {
          ctx.fillRect(bx, vh - 180, 80, 180);
          ctx.fillRect(bx + 40, vh - 210, 18, 30);
        } else { // tunnels
          ctx.fillRect(bx, vh - 80, 120, 80);
        }
      }
      ctx.restore();

      // Restoration: plants/glow returning
      if (r > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.7, r * 0.7);
        ctx.fillStyle = p.accent;
        const layer2 = -camX * 0.4;
        for (let i = 0; i < 16; i++) {
          const bx = (i * 90 + layer2) % (vw + 180) - 90;
          ctx.fillRect(bx, vh - 40, 6, 14 + (i%4)*4);
          ctx.fillRect(bx + 12, vh - 32, 6, 8 + (i%3)*4);
        }
        ctx.restore();
      }
    }

    drawTiles(ctx, camX, camY, vw, vh) {
      const p = this.palette;
      const startX = Math.max(0, Math.floor(camX / TILE) - 1);
      const endX   = Math.min(this.w, Math.ceil((camX + vw) / TILE) + 1);
      const startY = Math.max(0, Math.floor(camY / TILE) - 1);
      const endY   = Math.min(this.h, Math.ceil((camY + vh) / TILE) + 1);
      const r = this.restoration();

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const ch = this.tiles[y][x];
          const px = x*TILE - camX, py = y*TILE - camY;
          if (ch === '#') {
            ctx.fillStyle = p.solid;
            ctx.fillRect(px, py, TILE, TILE);
            // top highlight if no solid above
            const above = y > 0 ? this.tiles[y-1][x] : '.';
            if (above !== '#' && above !== '=' && above !== '*' && above !== 'd' && above !== '>' && above !== '<') {
              ctx.fillStyle = p.solidTop;
              ctx.fillRect(px, py, TILE, 4);
            }
          } else if (ch === '=') {
            ctx.fillStyle = p.plat;
            ctx.fillRect(px, py + 4, TILE, TILE - 8);
            ctx.fillStyle = p.solidTop;
            ctx.fillRect(px, py + 4, TILE, 3);
          } else if (ch === '*') {
            ctx.fillStyle = p.plat;
            ctx.fillRect(px+2, py+2, TILE-4, TILE-4);
            ctx.fillStyle = p.solidTop;
            ctx.strokeStyle = p.solidTop;
            ctx.strokeRect(px+2, py+2, TILE-4, TILE-4);
          } else if (ch === '>' || ch === '<') {
            ctx.fillStyle = '#555a66';
            ctx.fillRect(px, py + 4, TILE, TILE - 8);
            ctx.fillStyle = '#aab2c8';
            const t = (performance.now()/100) % TILE;
            const dir = ch === '>' ? 1 : -1;
            for (let i = -1; i < 3; i++) {
              const bx = px + ((i*8 + dir*t + TILE) % TILE);
              ctx.fillRect(bx, py + 8, 5, 4);
            }
          } else if (ch === 'd') {
            if (!this.doorOpen) {
              ctx.fillStyle = '#a06030';
              ctx.fillRect(px+2, py, TILE-4, TILE);
              ctx.fillStyle = '#ffd060';
              ctx.fillRect(px+TILE-8, py+TILE/2-2, 4, 4);
            }
          } else if (ch === '~') {
            const wob = Math.sin((px + performance.now()/200) * 0.1) * 2;
            // tint by restoration: cleaner water if restored
            const clean = r;
            const dirty = 1 - clean;
            ctx.fillStyle = `rgb(${Math.round(60*dirty + 60*clean)},${Math.round(100*dirty + 160*clean)},${Math.round(120*dirty + 220*clean)})`;
            ctx.fillRect(px, py + 4 + wob, TILE, TILE - 4);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(px, py + 4 + wob, TILE, 2);
          } else if (ch === '^') {
            // animated fire flames at the bottom of the tile
            const t = performance.now() / 100;
            // hot ember bed at floor level
            ctx.fillStyle = '#aa1810';
            ctx.fillRect(px, py + TILE - 4, TILE, 4);
            ctx.fillStyle = '#ff5020';
            ctx.fillRect(px, py + TILE - 3, TILE, 2);
            // three flickering flames
            const flames = [{dx: 5, ph: 0}, {dx: 12, ph: 1.3}, {dx: 19, ph: 2.7}];
            for (const f of flames) {
              const h = 13 + Math.sin(t + f.ph) * 4;
              const w = 4 + Math.cos(t * 1.3 + f.ph) * 0.7;
              // outer red
              ctx.fillStyle = '#ff2810';
              ctx.beginPath();
              ctx.moveTo(px + f.dx - w, py + TILE - 1);
              ctx.quadraticCurveTo(px + f.dx, py + TILE - h, px + f.dx + w, py + TILE - 1);
              ctx.fill();
              // inner orange
              ctx.fillStyle = '#ffaa30';
              ctx.beginPath();
              ctx.moveTo(px + f.dx - w * 0.6, py + TILE - 1);
              ctx.quadraticCurveTo(px + f.dx, py + TILE - h * 0.7, px + f.dx + w * 0.6, py + TILE - 1);
              ctx.fill();
              // yellow core
              ctx.fillStyle = '#ffee80';
              ctx.beginPath();
              ctx.moveTo(px + f.dx - w * 0.3, py + TILE - 1);
              ctx.quadraticCurveTo(px + f.dx, py + TILE - h * 0.4, px + f.dx + w * 0.3, py + TILE - 1);
              ctx.fill();
            }
          }
        }
      }

      // Exit door
      if (this.exitRect) {
        const ex = this.exitRect.x - camX;
        const ey = this.exitRect.y - camY;
        ctx.fillStyle = '#4ad6a0';
        ctx.fillRect(ex+2, ey+2, this.exitRect.w-4, this.exitRect.h-4);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(G.t('exit_label'), ex + this.exitRect.w/2, ey + this.exitRect.h/2 + 4);
      }
    }

    // Toxic fog overlay (fades as restoration increases)
    drawFog(ctx, vw, vh) {
      const r = this.restoration();
      const fog = Math.max(0, 1 - r);
      if (fog <= 0.02) return;
      ctx.save();
      ctx.globalAlpha = 0.35 * fog;
      ctx.fillStyle = this.palette.toxic;
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }

    drawDarkness(ctx, vw, vh, playerScreenX, playerScreenY) {
      // Vignette for tunnels level
      if (this.bg !== 'tunnels') return;
      const r = this.restoration();
      const visRadius = 120 + r * 80;
      const grad = ctx.createRadialGradient(playerScreenX, playerScreenY, visRadius*0.4, playerScreenX, playerScreenY, visRadius*2.2);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, vw, vh);
    }
  };
})(window.Game);
