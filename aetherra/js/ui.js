window.Game = window.Game || {};
(function(G){
  const $ = id => document.getElementById(id);

  G.ui = {
    setHud(level, totalBatteries, best) {
      $('hud-level').textContent = level.name;
      $('hud-batteries').textContent = `🔋 ${level.batteriesGot} / ${level.batteriesTotal}`;
      const p = G.player;
      let hearts = '';
      for (let i = 0; i < (p ? p.maxHealth : 3); i++) hearts += i < (p ? p.health : 3) ? '❤' : '·';
      $('hud-health').textContent = hearts;
      $('hud-total').textContent = `Total: ${totalBatteries}  Best: ${best}`;
    },
    showDialog(name, text) {
      $('dialog-name').textContent = name;
      $('dialog-text').textContent = text;
      $('dialog').classList.remove('hidden');
    },
    hideDialog() { $('dialog').classList.add('hidden'); },
    showScreen(title, text, btnLabel, onClick) {
      $('screen-title').textContent = title;
      $('screen-text').textContent = text;
      const btn = $('screen-btn');
      btn.textContent = btnLabel;
      $('screen').classList.remove('hidden');
      btn.onclick = () => { $('screen').classList.add('hidden'); onClick && onClick(); };
    },
    hideScreen() { $('screen').classList.add('hidden'); }
  };
})(window.Game);
