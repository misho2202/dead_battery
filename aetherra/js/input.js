window.Game = window.Game || {};
(function(G){
  const keys = {};
  const pressedThisFrame = {};
  const pressedQueue = {};

  window.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
    if (!keys[e.code]) pressedQueue[e.code] = true;
    keys[e.code] = true;
    G.sfx && G.sfx.resume();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Touch buttons
  function bindTouch() {
    const buttons = document.querySelectorAll('#touch button');
    buttons.forEach(b => {
      const code = b.dataset.key;
      const down = e => { e.preventDefault(); if (!keys[code]) pressedQueue[code] = true; keys[code] = true; G.sfx && G.sfx.resume(); };
      const up   = e => { e.preventDefault(); keys[code] = false; };
      b.addEventListener('touchstart', down, {passive:false});
      b.addEventListener('touchend', up,    {passive:false});
      b.addEventListener('touchcancel', up, {passive:false});
      b.addEventListener('mousedown', down);
      b.addEventListener('mouseup', up);
      b.addEventListener('mouseleave', up);
    });
    // Show touch UI on touch device
    if ('ontouchstart' in window) {
      document.getElementById('touch').classList.remove('hidden');
    }
  }
  document.addEventListener('DOMContentLoaded', bindTouch);

  G.input = {
    isDown(code) { return !!keys[code]; },
    pressed(code) { return !!pressedThisFrame[code]; },
    beginFrame() {
      // copy pressedQueue into pressedThisFrame, clear queue
      for (const k in pressedThisFrame) delete pressedThisFrame[k];
      for (const k in pressedQueue) { pressedThisFrame[k] = true; delete pressedQueue[k]; }
    },
    left()   { return keys['ArrowLeft']  || keys['KeyA']; },
    right()  { return keys['ArrowRight'] || keys['KeyD']; },
    jump()   { return !!pressedThisFrame['Space'] || !!pressedThisFrame['ArrowUp'] || !!pressedThisFrame['KeyW']; },
    sprint() { return keys['ShiftLeft'] || keys['ShiftRight']; },
    interact(){ return !!pressedThisFrame['KeyE']; }
  };
})(window.Game);
