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

  // ---------- Background music (ambient arpeggio, low volume) ----------
  let musicTimer = null;
  let musicGain = null;
  let musicOn = false;
  // A minor pentatonic ascending+descending — calm, fits eco theme
  const MUSIC_NOTES = [
    220.00, 261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63
  ];
  const MUSIC_BASS  = [110.00, 110.00, 130.81, 130.81];
  const NOTE_MS = 480;

  function startMusic() {
    const a = ac(); if (!a || musicOn) return;
    musicOn = true;
    musicGain = a.createGain();
    musicGain.gain.value = 0.05; // music sits well below SFX (~0.15)
    musicGain.connect(a.destination);
    let i = 0;
    function step() {
      if (!musicOn || !musicGain) return;
      const a2 = ac(); if (!a2) return;
      const t = a2.currentTime;
      // Lead note (sine, soft)
      {
        const o = a2.createOscillator();
        const g = a2.createGain();
        o.type = 'sine';
        o.frequency.value = MUSIC_NOTES[i % MUSIC_NOTES.length];
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.6, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        o.connect(g); g.connect(musicGain);
        o.start(t); o.stop(t + 0.6);
      }
      // Bass note every other step (triangle)
      if (i % 2 === 0) {
        const o = a2.createOscillator();
        const g = a2.createGain();
        o.type = 'triangle';
        o.frequency.value = MUSIC_BASS[(i / 2) % MUSIC_BASS.length];
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.5, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        o.connect(g); g.connect(musicGain);
        o.start(t); o.stop(t + 0.9);
      }
      i++;
      musicTimer = setTimeout(step, NOTE_MS);
    }
    step();
  }
  function stopMusic() {
    musicOn = false;
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
    if (musicGain) { try { musicGain.disconnect(); } catch(e){} musicGain = null; }
  }
  function setMusicVolume(v) {
    if (musicGain) musicGain.gain.value = Math.max(0, Math.min(1, v));
  }

  G.sfx = {
    resume() { const a = ac(); if (a && a.state === 'suspended') a.resume(); },
    jump()    { slide(420, 720, 0.12, 'square', 0.12); },
    collect() { tone(880, 0.06, 'square', 0.14); setTimeout(()=>tone(1320, 0.08, 'square', 0.12), 60); },
    hurt()    { slide(380, 90, 0.25, 'sawtooth', 0.18); },
    power()   { tone(330, 0.08, 'square', 0.15); setTimeout(()=>tone(440, 0.08, 'square', 0.15), 80); setTimeout(()=>tone(660, 0.16, 'square', 0.15), 160); },
    win()     { tone(523, 0.12, 'square', 0.15); setTimeout(()=>tone(659, 0.12, 'square', 0.15), 120); setTimeout(()=>tone(784, 0.18, 'square', 0.15), 240); setTimeout(()=>tone(1046, 0.30, 'square', 0.15), 420); },
    bad()     { slide(220, 60, 0.6, 'sawtooth', 0.2); },
    step()    { tone(180, 0.03, 'square', 0.05); },
    warn()    { tone(880, 0.10, 'square', 0.18); },
    warnFinal(){ tone(1320, 0.16, 'square', 0.22); },
    music: { start: startMusic, stop: stopMusic, setVolume: setMusicVolume }
  };
})(window.Game);
