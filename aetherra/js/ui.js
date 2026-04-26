window.Game = window.Game || {};
(function(G){
  const $ = id => document.getElementById(id);

  function levelName(level) {
    if (level && level.def && level.def.id) return G.t('level_' + level.def.id + '_name');
    return level ? level.name : '';
  }
  function levelHint(level) {
    if (level && level.def && level.def.id) return G.t('level_' + level.def.id + '_hint');
    return level ? level.hint : '';
  }

  let dialogId = 0;
  let dialogTimer = null;

  G.ui = {
    levelName, levelHint,
    setHud(level, totalBatteries, best, opts) {
      $('hud-level').textContent = levelName(level);
      $('hud-batteries').textContent = `🔋 ${level.batteriesGot} / ${level.batteriesTotal}`;
      const p = G.player;
      let hearts = '';
      for (let i = 0; i < (p ? p.maxHealth : 3); i++) hearts += i < (p ? p.health : 3) ? '❤' : '·';
      $('hud-health').textContent = hearts;
      $('hud-total').textContent = G.t('hud_total', { t: totalBatteries, b: best });

      // Highlight remaining-batteries counter in the warning window
      const warn = !!(opts && opts.timeWarn) && level.batteriesGot < level.batteriesTotal;
      $('hud-batteries').classList.toggle('hud-warn', warn);
    },
    showDialog(name, text, opts) {
      dialogId++;
      const myId = dialogId;
      if (dialogTimer) { clearTimeout(dialogTimer); dialogTimer = null; }
      $('dialog-name').textContent = name;
      $('dialog-text').textContent = text;
      const showHint = !(opts && opts.hideHint);
      $('dialog-hint').classList.toggle('hidden', !showHint);
      if (showHint) $('dialog-hint').textContent = G.t('dialog_hint');
      $('dialog').classList.remove('hidden');
      if (opts && opts.autoHide) {
        dialogTimer = setTimeout(() => {
          if (dialogId === myId) {
            $('dialog').classList.add('hidden');
            dialogTimer = null;
          }
        }, opts.autoHide);
      }
      return myId;
    },
    hideDialog() {
      if (dialogTimer) { clearTimeout(dialogTimer); dialogTimer = null; }
      dialogId++;
      $('dialog').classList.add('hidden');
    },
    showScreen(title, text, btnLabel, onClick, opts) {
      $('screen-title').textContent = title;
      $('screen-text').textContent = text;
      const btn = $('screen-btn');
      btn.textContent = btnLabel;
      const flags = $('lang-flags');
      if (opts && opts.showFlags) {
        flags.classList.remove('hidden');
        for (const b of flags.querySelectorAll('.flag')) {
          b.classList.toggle('selected', b.dataset.lang === G.i18n.lang);
        }
      } else {
        flags.classList.add('hidden');
      }
      $('screen').classList.remove('hidden');
      btn.onclick = () => { $('screen').classList.add('hidden'); onClick && onClick(); };
    },
    hideScreen() { $('screen').classList.add('hidden'); }
  };
})(window.Game);
