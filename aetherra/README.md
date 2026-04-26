# Aetherra: Last Spark

A browser-based 2D side-scrolling platformer about cleaning up a poisoned world, one discarded battery at a time. Pure HTML5 Canvas + WebAudio — no build step, no server, no dependencies.

## Run

Double-click `index.html`. That's it.

The game runs from `file://`, so any modern browser (Chrome, Edge, Firefox, Safari) will play it without a local server.

## Controls

### Keyboard
| Action      | Key                |
| ----------- | ------------------ |
| Move        | `←` `→` (or `A` `D`) |
| Jump        | `Space` (or `↑` / `W`) |
| Sprint      | `Shift`            |
| Interact    | `E`                |
| Pause       | `P`                |
| Fullscreen  | `⛶` button (top-right) |

### Touch (mobile)
On-screen buttons appear automatically on touch devices: ◀ ▶ on the left, ▲ jump and `E` interact on the right. A `⏸/▶` pause button and `⛶` fullscreen button sit at the top-right of the canvas.

## Languages

Three languages are supported, selectable from the title screen via flag buttons:

- **EN** — English
- 🇦🇲 **AM** — Հայերեն (Armenian)
- 🇷🇺 **RU** — Русский (Russian)

The selection is saved to `localStorage` and applied to all UI, dialogs, level names, and ending text.

## How to Play

1. Each level is a self-contained side-scroller.
2. Collect batteries (🔋) to restore the land — fog clears and plants regrow as your % rises.
3. Find the **switch** (red lamp on a stand). Stand on it and press `E` to unlock the door.
4. Reach the green **EXIT** to advance.
5. You have a countdown timer per level. Run out → game ends with whatever you collected.
6. Hearts (❤❤❤) carry over between levels — losing one in level 2 stays lost in level 3.

### Hazards
- **Toxic spills (`^`)** — fire on the ground, damage over time
- **Polluted water (`~`)** — slow, damage over time
- **Mutated creatures** — stomp from above to defeat, otherwise they hurt you
- **Falling debris** — red blocks above drop fireballs when you walk under them
- **Conveyors (`>` `<`)** — push you while you stand on them

## Levels

| # | Name                  | Time | Theme                              |
| - | --------------------- | ---- | ---------------------------------- |
| 1 | 🏙️ Abandoned City     | 60s  | Climbing, intro mechanics          |
| 2 | 🌲 Polluted Forest    | 40s  | Toxic spills, sprint timing        |
| 3 | 🏭 Industrial Ruins   | 40s  | Conveyors push you off-rhythm      |
| 4 | 🕳️ Underground Tunnels | 40s  | Falling fire + restricted vision   |

## Endings

Calculated from total batteries collected across the whole run.

| % Collected      | Ending                |
| ---------------- | --------------------- |
| 100% (all batteries **and** completed level 4 via the exit) | 🌿 Good (perfect)     |
| 85–99%           | 🌿 Good               |
| 40–84%           | 🌫️ Partial           |
| < 40%            | ⚠️ Bad                |

> Note: collecting every battery but failing to finish level 4 (timer runs out, etc.) caps at 95% — still Good, but not perfect.

## Audio

- **SFX** — synthesized via WebAudio (jump, collect, hurt, switch, win, time-warning beeps).
- **Music** — calm A-minor pentatonic loop, mixed well below SFX. Pauses with the game.

## Project layout

```
aetherra/
├── index.html
├── style.css
├── README.md
├── dead_battery.png        # battery sprite
├── forest-level-01.jpg     # level 1 background
├── forest-level-02.jpg     # level 2 background
├── forest-level-03.jpg     # level 3 background
├── game_persone.png        # player sprite (optional; falls back to pixel art)
└── js/
    ├── i18n.js             # translations + language switching
    ├── audio.js            # WebAudio SFX + music engine
    ├── input.js            # keyboard + touch input
    ├── save.js             # localStorage best-score
    ├── levels.js           # ASCII tile maps for all 4 levels
    ├── entities.js         # batteries, switches, creatures, debris emitters, fire
    ├── level.js            # tile parser, collision, rendering
    ├── player.js           # physics, jump, hazards, drawing
    ├── ui.js               # HUD, dialogs, screens
    └── main.js             # game loop, state machine, pause, screen shake
```

## Tile / entity legend (in `levels.js`)

| Char | Meaning                              |
| ---- | ------------------------------------ |
| `.`  | air                                  |
| `#`  | solid wall / floor                   |
| `=`  | one-way platform (jump up through)   |
| `~`  | water (damage over time)             |
| `^`  | toxic spill (damage over time)       |
| `*`  | breakable block (head-bump)          |
| `>` `<` | conveyor belt (right/left)         |
| `d`  | door (locked until switch hit)       |
| `P`  | player spawn                         |
| `X`  | level exit                           |
| `B`  | battery pickup                       |
| `s`  | switch (interact with `E`)           |
| `c`  | creature                             |
| `!`  | falling-debris emitter (fire above)  |

## Saved data

Stored in `localStorage` under:
- `aetherra_save_v1` — best total batteries
- `aetherra_lang_v1` — selected language code (`en` / `hy` / `ru`)

Clear those keys to reset progress / language preference.

## Credits

Game design, code, and pixel art generated for this project. Background images (`forest-level-*.jpg`) and the battery / player photos are user-provided.
