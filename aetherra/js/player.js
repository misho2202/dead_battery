window.Game = window.Game || {};
(function(G){
  const playerImg = new Image();
  playerImg.src = 'game_persone.png';
  let playerImgReady = false;
  playerImg.addEventListener('load',  () => { playerImgReady = true; });
  playerImg.addEventListener('error', () => { playerImgReady = false; });

  G.Player = class {
    constructor(x, y) {
      this.x = x; this.y = y; this.w = 16; this.h = 22;
      this.vx = 0; this.vy = 0;
      this.onGround = false;
      this.facing = 1;
      this.health = 3;
      this.maxHealth = 3;
      this.iframes = 0;
      this.hazardCD = 0;
      this.deathT = 0; this.dead = false;
      this.runT = 0;
      this.jumpsLeft = 1;
    }
    hurt(n) {
      if (this.iframes > 0 || this.dead) return;
      this.health -= n;
      this.iframes = 1.0;
      G.sfx.hurt();
      if (this.health <= 0) {
        this.dead = true;
        this.deathT = 0;
      } else {
        this.vy = -260;
        this.vx = -this.facing * 140;
      }
    }
    update(dt, level) {
      if (this.dead) {
        this.deathT += dt;
        this.vy += 900 * dt;
        this.y += this.vy * dt;
        return;
      }

      const I = G.input;
      const sprint = I.sprint();
      const speed = sprint ? 200 : 130;

      let ax = 0;
      if (I.left())  { ax -= 1; this.facing = -1; }
      if (I.right()) { ax += 1; this.facing = 1; }

      // horizontal velocity (snappy)
      const target = ax * speed;
      const accel = this.onGround ? 1400 : 800;
      if (this.vx < target) this.vx = Math.min(this.vx + accel*dt, target);
      else if (this.vx > target) this.vx = Math.max(this.vx - accel*dt, target);
      if (ax === 0 && this.onGround) {
        if (Math.abs(this.vx) < 10) this.vx = 0;
      }

      // jump
      if (I.jump()) {
        if (this.onGround || this.jumpsLeft > 0) {
          if (!this.onGround) this.jumpsLeft--;
          this.vy = -360;
          this.onGround = false;
          G.sfx.jump();
        }
      }

      // gravity
      this.vy += 900 * dt;
      if (this.vy > 700) this.vy = 700;

      // water (~) sinks slowly
      const inWater = level.tileAt(this.x + this.w/2, this.y + this.h - 4) === '~';
      if (inWater) {
        this.vy = Math.min(this.vy, 80);
        this.vx *= 0.95;
      }

      const res = level.move(this, this.vx, this.vy, dt);
      this.x = res.x; this.y = res.y; this.vx = res.vx; this.vy = res.vy;
      this.onGround = res.onGround;
      if (this.onGround) this.jumpsLeft = 1;
      if (res.conveyor) this.x += res.conveyor * dt;

      // Hazard tiles
      let touchingHazard = false;
      const probes = [
        [this.x + 2, this.y + this.h - 2],
        [this.x + this.w - 2, this.y + this.h - 2],
        [this.x + this.w/2, this.y + this.h - 2],
        [this.x + this.w/2, this.y + 4]
      ];
      for (const [px, py] of probes) {
        if (level.isHazardAt(px, py)) { touchingHazard = true; break; }
      }
      if (touchingHazard) {
        this.hazardCD -= dt;
        if (this.hazardCD <= 0) {
          this.hurt(1);
          this.hazardCD = 0.6;
        }
      } else {
        this.hazardCD = 0;
      }

      // Fell off world
      if (this.y > level.h * G.TILE + 200) {
        this.dead = true; this.deathT = 0;
      }

      if (this.iframes > 0) this.iframes -= dt;
      if (Math.abs(this.vx) > 30 && this.onGround) this.runT += dt * 10;
    }
    draw(ctx, camX, camY) {
      const px = Math.round(this.x - camX);
      const py = Math.round(this.y - camY);
      const blink = this.iframes > 0 && Math.floor(this.iframes * 12) % 2 === 0;
      if (blink) return;

      if (playerImgReady) {
        const dw = 16, dh = 28;
        const dx = px + this.w/2 - dw/2;
        const dy = py + this.h - dh;
        if (this.facing < 0) {
          ctx.save();
          ctx.translate(dx + dw, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(playerImg, 0, 0, dw, dh);
          ctx.restore();
        } else {
          ctx.drawImage(playerImg, dx, dy, dw, dh);
        }
        return;
      }

      // body (red shirt)
      ctx.fillStyle = '#d12a2a';
      ctx.fillRect(px+2, py+10, 12, 10);
      // shirt highlight
      ctx.fillStyle = '#ff5c5c';
      ctx.fillRect(px+2, py+10, 12, 2);
      // legs (animate) - dark trousers
      const legSwing = this.onGround && Math.abs(this.vx) > 10 ? Math.sin(this.runT) * 2 : 0;
      ctx.fillStyle = '#2a2230';
      ctx.fillRect(px+3, py+18, 4, 4 + legSwing);
      ctx.fillRect(px+9, py+18, 4, 4 - legSwing);
      // head (skin)
      ctx.fillStyle = '#f0d8b0';
      ctx.fillRect(px+3, py+4, 10, 6);
      // red hat (cap with brim)
      ctx.fillStyle = '#b71414';
      ctx.fillRect(px+3, py+1, 10, 4);            // crown
      ctx.fillStyle = '#e63030';
      ctx.fillRect(px+3, py+1, 10, 1);            // crown highlight
      ctx.fillStyle = '#7a0a0a';
      ctx.fillRect(px + (this.facing > 0 ? 7 : 1), py+4, 6, 1); // brim shadow side
      ctx.fillStyle = '#b71414';
      ctx.fillRect(px + (this.facing > 0 ? 1 : 7), py+4, 6, 1); // brim front
      // eye
      ctx.fillStyle = '#000';
      ctx.fillRect(px + (this.facing > 0 ? 9 : 4), py+7, 2, 2);
      // backpack
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(px + (this.facing > 0 ? 0 : 12), py+11, 4, 6);
    }
  };
})(window.Game);
