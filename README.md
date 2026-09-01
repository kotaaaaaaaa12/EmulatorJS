# Retro Vault / EmulatorJS

A small JSON-driven EmulatorJS game library.

## Project layout

```text
EmulatorJS/
├── index.html
├── README.md
├── coi-sw.js
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── player.css
│   └── js/
│       ├── app.js
│       ├── player.js
│       └── coi.js
├── data/
│   ├── games.json
│   ├── roms/
│   ├── thumbs/
│   └── bios/
├── pages/
│   └── player.html
└── docs/
    └── CORE_REFERENCE.md
```

- `index.html` - game library UI entry point
- `assets/css/` - all stylesheets
- `assets/js/` - launcher, player and cross-origin-isolation scripts
- `pages/player.html` - isolated EmulatorJS iframe document
- `data/games.json` - game database
- `data/roms/` - your legally obtained game files
- `data/thumbs/` - thumbnail files
- `data/bios/` - optional BIOS files you are allowed to use
- `docs/CORE_REFERENCE.md` - core/system reference
- `coi-sw.js` - kept at the project root intentionally so its Service Worker scope can cover the whole app

## games.json

Each game needs a unique positive integer `id`.

```json
{
  "id": 100,
  "title": "Example Game",
  "rom": "example.gba",
  "core": "gba",
  "thumbnail": "example.png"
}
```

Optional fields:

```json
{
  "threads": true,
  "bios": "example-bios.bin",
  "gameParent": "extra-data.zip",
  "patch": "example.ips",
  "videoRotation": 0,
  "disableCue": false,
  "forceLegacyCores": false,
  "ejsVersion": "4.2.3",
  "dataPath": "https://example.com/emulatorjs/data/"
}
```

`threads` overrides the site-wide Threads toggle for that one game. If omitted, the site-wide setting is used.

## Local ROMs

Use **OPEN LOCAL ROM** to choose a ROM from the device. The selected file is passed directly to the isolated player as a local `blob:` URL; it is not uploaded to the server.

The launcher auto-selects a system when the extension is distinctive, for example:

- `.nes` / `.fds` -> NES
- `.sfc` / `.smc` -> SNES
- `.gb` / `.gbc` -> Game Boy / Game Boy Color
- `.gba` -> Game Boy Advance
- `.z64` / `.n64` / `.v64` -> Nintendo 64
- `.nds` -> Nintendo DS
- `.md` / `.gen` / `.smd` -> Mega Drive / Genesis
- `.sms` -> Master System
- `.gg` -> Game Gear
- `.32x` -> Sega 32X
- `.a26` / `.a52` / `.a78` -> Atari 2600 / 5200 / 7800
- `.pce` -> PC Engine
- `.ngp` / `.ngc` -> Neo Geo Pocket
- `.ws` / `.wsc` -> WonderSwan
- `.adf` / `.adz` / `.ipf` -> Amiga
- `.wad` -> Doom / PrBoom
- `.3ds` / `.cci` / `.cia` -> Nintendo 3DS nightly

Ambiguous archive/disc extensions such as `.bin`, `.cue`, `.iso`, `.chd`, `.zip`, `.7z`, `.rar`, `.rom`, `.dsk` and `.pbp` intentionally show the system picker instead of guessing.

Multi-file disc games can still require a BIOS and/or a packaged disc set. A single local `.cue` file cannot magically include track files that were not selected.

## Threads

Threads are enabled by default when `SharedArrayBuffer` is available. EmulatorJS requires cross-origin isolation for threaded cores. This project includes a same-origin Service Worker helper for static hosts such as GitHub Pages. Hosts that allow custom headers should preferably send these headers directly:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

PSP requires Threads. DOSBox Pure and experimental 3DS builds should also be treated as threaded-only in this project.

## EmulatorJS version

The default EmulatorJS data path is pinned to `4.2.3` instead of the moving `stable` channel. This avoids an unrelated future release silently changing the site.

A game can explicitly select another EmulatorJS version with `ejsVersion`, for example `latest` or `nightly`. Use moving channels only when you intentionally accept breaking changes.

## Supported system names

The UI recognizes the common EmulatorJS aliases and many explicit core names, including:

- Nintendo: NES, SNES, Game Boy, Game Boy Color, Game Boy Advance, Virtual Boy, Nintendo 64, Nintendo DS
- Sony: PlayStation, PSP
- Sega: Mega Drive / Genesis, Master System, Game Gear, Sega CD, 32X, Saturn
- Atari: 2600, 5200, 7800, Lynx, Jaguar
- Arcade: Arcade / FBNeo, MAME 2003
- NEC / SNK / Bandai: PC Engine, PC-FX, Neo Geo Pocket, WonderSwan
- Other consoles: 3DO, ColecoVision
- Commodore: C64, C128, VIC-20, Plus/4, PET, Amiga
- DOSBox Pure
- Extra cores exposed by the pinned core set: ZX81, ZX Spectrum, Amstrad CPC, Doom / PrBoom and Philips CD-i

Nintendo 3DS appears in the current upstream demo but is not part of the pinned `4.2.3` stable core set. If you intentionally test it, use an appropriate newer channel such as `nightly` per game.

## Why the iframe exists

EmulatorJS mutates the document and owns long-lived resources such as WebAssembly, audio, input listeners and animation loops. Every game is therefore launched inside `pages/player.html`. Closing the modal navigates that iframe to `about:blank`, tearing down the entire emulator document before another game starts.


## Legacy layout compatibility

The app prefers `data/games.json`, `data/roms/`, and `data/thumbs/`. It also automatically falls back to the original root-level `games.json`, `roms/`, and `thumbs/` paths, so the site keeps working while files are being reorganized.

## Cloudflare Pages

This build is ready for Cloudflare Pages. `_headers` is included at the deploy root and enables the COOP/COEP headers required for SharedArrayBuffer/Threads.

The previous automatic COI Service Worker bootstrap has been removed. Cloudflare Pages should provide cross-origin isolation directly through response headers, avoiding first-load reload loops and Safari/iPad Service Worker edge cases.

Deploy the *contents* of this directory as the Pages output root so that `index.html` and `_headers` are both at `/`.
