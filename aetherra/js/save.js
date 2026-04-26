window.Game = window.Game || {};
(function(G){
  const KEY = 'aetherra_save_v1';
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch(e) { return {}; }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e) {}
  }
  G.save = {
    getBest() { return load().best || 0; },
    setBest(n) { const d = load(); if (n > (d.best||0)) { d.best = n; save(d); } }
  };
})(window.Game);
