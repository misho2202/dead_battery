window.Game = window.Game || {};
(function(G){
  const KEY = 'aetherra_lang_v1';

  const DICT = {
    en: {
      title:                'Aetherra: Last Spark',
      intro:                'The world is poisoned by discarded batteries.\nCollect them, restore the land, save Aetherra.\n\nMove: ← →   Jump: Space   Sprint: Shift   Interact: E\nBest run: {best} batteries',
      start_btn:            'Start',
      play_again:           'Play Again',
      next_level:           'Next Level',
      system:               'System',
      switch_msg:           'Switch activated. Door unlocked!',
      dialog_hint:          'Press E / tap to continue',
      exit_label:           'EXIT',
      hud_total:            'Total: {t}  Best: {b}',
      cleared_title:        '{name} — Cleared',
      cleared_text:         'Batteries: {got} / {total}  ({pct}% restored)\nTotal collected so far: {tot}',
      ending_good_title:    '🌿 Good Ending',
      ending_good_text:     'Aetherra is reborn. The fog lifts, plants regrow, the wildlife returns.\n\nYou collected {got} of {total} batteries ({pct}%).\nBatteries are not waste — they are a responsibility.',
      ending_partial_title: '🌫️ Partial Ending',
      ending_partial_text:  'Some regions begin to heal, but corruption lingers.\n\nYou collected {got} of {total} batteries ({pct}%).\nThere is still hope, if more is gathered.',
      ending_bad_title:     '⚠️ Bad Ending',
      ending_bad_text:      'The damage was too great. Aetherra fades into silence.\n\nYou collected {got} of {total} batteries ({pct}%).\nTry again — the world depends on it.',
      level_city_name:      '🏙️ Abandoned City',
      level_city_hint:      'Climb up the platforms. Find the switch (s) and press E. Then reach the exit.',
      level_forest_name:    '🌲 Polluted Forest',
      level_forest_hint:    'Find the switch (s) and press E. Sprint and jump over toxic spills.',
      level_ruins_name:     '🏭 Industrial Ruins',
      level_ruins_hint:     'Conveyors push you. Climb to the switch (s) and press E to open the door.',
      level_tunnels_name:   '🕳️ Underground Tunnels',
      level_tunnels_hint:   'Fire falls from the red blocks above. Find the switch (s) and press E to open the door.',
      paused:               'Paused',
      paused_hint:          'Press P or tap ▶ to resume'
    },
    hy: {
      title:                'Աեթերրա․ Վերջին Կայծը',
      intro:                'Աշխարհը թունավորվել է թափված մարտկոցներով։\nՀավաքիր դրանք, վերականգնիր երկիրը, փրկիր Աեթերրան։\n\nՇարժում՝ ← →   Ցատկ՝ Space   Արագ՝ Shift   Փոխազդեցություն՝ E\nԼավագույն արդյունք՝ {best} մարտկոց',
      start_btn:            'Սկսել',
      play_again:           'Խաղալ կրկին',
      next_level:           'Հաջորդ մակարդակ',
      system:               'Համակարգ',
      switch_msg:           'Անջատիչը միացված է։ Դուռը բացված է։',
      dialog_hint:          'Սեղմիր E / հպիր շարունակելու համար',
      exit_label:           'ԵԼՔ',
      hud_total:            'Ընդամենը՝ {t}  Լավագույն՝ {b}',
      cleared_title:        '{name} — Անցավ',
      cleared_text:         'Մարտկոցներ՝ {got} / {total}  ({pct}% վերականգնված)\nԸնդհանուր հավաքված՝ {tot}',
      ending_good_title:    '🌿 Լավ ավարտ',
      ending_good_text:     'Աեթերրան վերածնվում է։ Մառախուղը ցրվում է, բույսերը վերադառնում են, կենդանիները՝ նույնպես։\n\nԴու հավաքեցիր {got} մարտկոց {total}-ից ({pct}%)։\nՄարտկոցները աղբ չեն, դրանք պատասխանատվություն են։',
      ending_partial_title: '🌫️ Մասնակի ավարտ',
      ending_partial_text:  'Որոշ տարածքներ սկսում են ապաքինվել, սակայն ապականությունը մնում է։\n\nԴու հավաքեցիր {got} մարտկոց {total}-ից ({pct}%)։\nԴեռ կա հույս, եթե հավաքվի ավելին։',
      ending_bad_title:     '⚠️ Վատ ավարտ',
      ending_bad_text:      'Վնասը չափազանց մեծ էր։ Աեթերրան լռության մեջ խամրում է։\n\nԴու հավաքեցիր {got} մարտկոց {total}-ից ({pct}%)։\nՓորձիր կրկին, աշխարհը կախված է քեզնից։',
      level_city_name:      '🏙️ Լքված քաղաք',
      level_city_hint:      'Բարձրացիր հարթակներով։ Գտիր անջատիչը (s) և սեղմիր E։ Հետո հասիր ելքին։',
      level_forest_name:    '🌲 Աղտոտված անտառ',
      level_forest_hint:    'Գտիր անջատիչը (s) և սեղմիր E։ Վազիր և ցատկիր թունավոր ճաթերի վրայով։',
      level_ruins_name:     '🏭 Արդյունաբերական ավերակներ',
      level_ruins_hint:     'Փոխադրիչները հրում են քեզ։ Բարձրացիր անջատիչին (s) և սեղմիր E՝ դուռը բացելու համար։',
      level_tunnels_name:   '🕳️ Ստորգետնյա թունելներ',
      level_tunnels_hint:   'Կրակը թափվում է վերևի կարմիր բլոկներից։ Գտիր անջատիչը (s) և սեղմիր E։',
      paused:               'Դադար',
      paused_hint:          'Սեղմիր P կամ ▶՝ շարունակելու համար'
    },
    ru: {
      title:                'Этерра: Последняя Искра',
      intro:                'Мир отравлен выброшенными батарейками.\nСобери их, восстанови землю, спаси Этерру.\n\nДвижение: ← →   Прыжок: Space   Бег: Shift   Действие: E\nЛучший результат: {best} батареек',
      start_btn:            'Начать',
      play_again:           'Играть снова',
      next_level:           'Следующий уровень',
      system:               'Система',
      switch_msg:           'Переключатель активирован. Дверь открыта!',
      dialog_hint:          'Нажми E / коснись, чтобы продолжить',
      exit_label:           'ВЫХОД',
      hud_total:            'Всего: {t}  Лучший: {b}',
      cleared_title:        '{name} — Пройден',
      cleared_text:         'Батарейки: {got} / {total}  ({pct}% восстановлено)\nВсего собрано: {tot}',
      ending_good_title:    '🌿 Хорошая концовка',
      ending_good_text:     'Этерра возрождается. Туман рассеивается, растения растут, животные возвращаются.\n\nТы собрал {got} из {total} батареек ({pct}%).\nБатарейки — не мусор, а ответственность.',
      ending_partial_title: '🌫️ Частичная концовка',
      ending_partial_text:  'Некоторые регионы начинают исцеляться, но порча остаётся.\n\nТы собрал {got} из {total} батареек ({pct}%).\nЕсть надежда, если собрать больше.',
      ending_bad_title:     '⚠️ Плохая концовка',
      ending_bad_text:      'Ущерб был слишком велик. Этерра погружается в тишину.\n\nТы собрал {got} из {total} батареек ({pct}%).\nПопробуй снова — мир зависит от этого.',
      level_city_name:      '🏙️ Заброшенный город',
      level_city_hint:      'Поднимайся по платформам. Найди переключатель (s) и нажми E. Затем доберись до выхода.',
      level_forest_name:    '🌲 Загрязнённый лес',
      level_forest_hint:    'Найди переключатель (s) и нажми E. Беги и прыгай через ядовитые лужи.',
      level_ruins_name:     '🏭 Промышленные руины',
      level_ruins_hint:     'Конвейеры толкают тебя. Доберись до переключателя (s) и нажми E, чтобы открыть дверь.',
      level_tunnels_name:   '🕳️ Подземные туннели',
      level_tunnels_hint:   'Огонь падает с красных блоков сверху. Найди переключатель (s) и нажми E.',
      paused:               'Пауза',
      paused_hint:          'Нажми P или ▶, чтобы продолжить'
    }
  };

  let lang = 'en';
  try { const v = localStorage.getItem(KEY); if (v && DICT[v]) lang = v; } catch(e) {}

  function format(s, vars) {
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars) ? vars[k] : '{'+k+'}');
  }

  G.i18n = {
    get lang() { return lang; },
    setLang(code) {
      if (!DICT[code]) return;
      lang = code;
      try { localStorage.setItem(KEY, code); } catch(e) {}
      if (G.onLangChange) G.onLangChange();
    },
    languages: ['en', 'hy', 'ru']
  };
  G.t = function(key, vars) {
    const d = DICT[lang] || DICT.en;
    const s = (key in d) ? d[key] : (DICT.en[key] || key);
    return format(s, vars);
  };
})(window.Game);
