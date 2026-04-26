window.Game = window.Game || {};
(function(G){
  let ctx = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { ctx = null; }
    }
    return ctx;
  }
  function tone(freq, dur, type, vol) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol || 0.15, a.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.02);
  }
  function slide(f1, f2, dur, type, vol) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f1, a.currentTime);
    o.frequency.linearRampToValueAtTime(f2, a.currentTime + dur);
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol || 0.15, a.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.02);
  }
  G.sfx = {
    resume() { const a = ac(); if (a && a.state === 'suspended') a.resume(); },
    jump()    { slide(420, 720, 0.12, 'square', 0.12); },
    collect() { tone(880, 0.06, 'square', 0.14); setTimeout(()=>tone(1320, 0.08, 'square', 0.12), 60); },
    hurt()    { slide(380, 90, 0.25, 'sawtooth', 0.18); },
    power()   { tone(330, 0.08, 'square', 0.15); setTimeout(()=>tone(440, 0.08, 'square', 0.15), 80); setTimeout(()=>tone(660, 0.16, 'square', 0.15), 160); },
    win()     { tone(523, 0.12, 'square', 0.15); setTimeout(()=>tone(659, 0.12, 'square', 0.15), 120); setTimeout(()=>tone(784, 0.18, 'square', 0.15), 240); setTimeout(()=>tone(1046, 0.30, 'square', 0.15), 420); },
    bad()     { slide(220, 60, 0.6, 'sawtooth', 0.2); },
    step()    { tone(180, 0.03, 'square', 0.05); }
  };
})(window.Game);
