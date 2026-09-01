"use strict";

const CORE_LABELS = Object.freeze({
  nes: "NES / Famicom",
  fceumm: "NES / Famicom",
  nestopia: "NES / Famicom",
  snes: "SNES / Super Famicom",
  snes9x: "SNES / Super Famicom",
  bsnes: "SNES / Super Famicom",
  gb: "Game Boy / Game Boy Color",
  gbc: "Game Boy Color",
  gambatte: "Game Boy / Game Boy Color",
  gba: "Game Boy Advance",
  mgba: "Game Boy Advance",
  vb: "Virtual Boy",
  beetle_vb: "Virtual Boy",
  n64: "Nintendo 64",
  mupen64plus_next: "Nintendo 64",
  "parallel-n64": "Nintendo 64",
  parallel_n64: "Nintendo 64",
  nds: "Nintendo DS",
  melonds: "Nintendo DS",
  desmume: "Nintendo DS",
  desmume2015: "Nintendo DS",
  psx: "PlayStation",
  pcsx_rearmed: "PlayStation",
  mednafen_psx_hw: "PlayStation",
  psp: "PlayStation Portable",
  ppsspp: "PlayStation Portable",
  segaMD: "Mega Drive / Genesis",
  genesis_plus_gx: "Mega Drive / Genesis",
  genesis_plus_gx_wide: "Mega Drive / Genesis",
  segaMS: "Master System",
  smsplus: "Master System",
  segaGG: "Game Gear",
  segaCD: "Sega CD / Mega CD",
  sega32x: "Sega 32X",
  picodrive: "Sega 32X / Mega Drive",
  segaSaturn: "Sega Saturn",
  yabause: "Sega Saturn",
  atari2600: "Atari 2600",
  stella2014: "Atari 2600",
  atari5200: "Atari 5200",
  a5200: "Atari 5200",
  atari7800: "Atari 7800",
  prosystem: "Atari 7800",
  lynx: "Atari Lynx",
  handy: "Atari Lynx",
  jaguar: "Atari Jaguar",
  virtualjaguar: "Atari Jaguar",
  arcade: "Arcade",
  fbneo: "Arcade",
  fbalpha2012_cps1: "Arcade - CPS1",
  fbalpha2012_cps2: "Arcade - CPS2",
  mame: "MAME",
  mame2003: "MAME 2003",
  mame2003_plus: "MAME 2003 Plus",
  "3do": "3DO",
  opera: "3DO",
  pce: "PC Engine / TurboGrafx-16",
  mednafen_pce: "PC Engine / TurboGrafx-16",
  pcfx: "PC-FX",
  mednafen_pcfx: "PC-FX",
  ngp: "Neo Geo Pocket / Color",
  mednafen_ngp: "Neo Geo Pocket / Color",
  ws: "WonderSwan / Color",
  mednafen_wswan: "WonderSwan / Color",
  coleco: "ColecoVision",
  gearcoleco: "ColecoVision",
  c64: "Commodore 64",
  vice_x64: "Commodore 64",
  vice_x64sc: "Commodore 64",
  c128: "Commodore 128",
  vice_x128: "Commodore 128",
  vic20: "Commodore VIC-20",
  vice_xvic: "Commodore VIC-20",
  plus4: "Commodore Plus/4",
  vice_xplus4: "Commodore Plus/4",
  pet: "Commodore PET",
  vice_xpet: "Commodore PET",
  amiga: "Commodore Amiga",
  puae: "Commodore Amiga",
  dos: "DOSBox Pure",
  dosbox_pure: "DOSBox Pure",
  "81": "Sinclair ZX81",
  fuse: "ZX Spectrum",
  cap32: "Amstrad CPC",
  crocods: "Amstrad CPC",
  prboom: "Doom / PrBoom",
  same_cdi: "Philips CD-i",
  "3ds": "Nintendo 3DS",
  azahar: "Nintendo 3DS"
});

const THREADS_REQUIRED_CORES = new Set(["psp", "ppsspp", "dos", "dosbox_pure", "3ds", "azahar"]);
const STORAGE_KEY = "retro-vault-threads";

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.debug("localStorage read unavailable:", error);
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.debug("localStorage write unavailable:", error);
  }
}

const UPLOAD_CORE_OPTIONS = Object.freeze([
  ["nes", "NES / Famicom"],
  ["snes", "SNES / Super Famicom"],
  ["gb", "Game Boy / Game Boy Color"],
  ["gba", "Game Boy Advance"],
  ["vb", "Virtual Boy"],
  ["n64", "Nintendo 64"],
  ["nds", "Nintendo DS"],
  ["psx", "PlayStation"],
  ["psp", "PlayStation Portable"],
  ["segaMD", "Mega Drive / Genesis"],
  ["segaMS", "Master System"],
  ["segaGG", "Game Gear"],
  ["segaCD", "Sega CD / Mega CD"],
  ["sega32x", "Sega 32X"],
  ["segaSaturn", "Sega Saturn"],
  ["atari2600", "Atari 2600"],
  ["atari5200", "Atari 5200"],
  ["atari7800", "Atari 7800"],
  ["lynx", "Atari Lynx"],
  ["jaguar", "Atari Jaguar"],
  ["arcade", "Arcade / FinalBurn Neo"],
  ["mame2003", "MAME 2003"],
  ["3do", "3DO"],
  ["pce", "PC Engine / TurboGrafx-16"],
  ["pcfx", "PC-FX"],
  ["ngp", "Neo Geo Pocket / Color"],
  ["ws", "WonderSwan / Color"],
  ["coleco", "ColecoVision"],
  ["c64", "Commodore 64"],
  ["c128", "Commodore 128"],
  ["vic20", "Commodore VIC-20"],
  ["plus4", "Commodore Plus/4"],
  ["pet", "Commodore PET"],
  ["amiga", "Commodore Amiga"],
  ["dosbox_pure", "DOSBox Pure"],
  ["81", "Sinclair ZX81"],
  ["fuse", "ZX Spectrum"],
  ["cap32", "Amstrad CPC"],
  ["crocods", "Amstrad CPC / CrocoDS"],
  ["prboom", "Doom / PrBoom"],
  ["same_cdi", "Philips CD-i"],
  ["3ds", "Nintendo 3DS (nightly)"]
]);

// Extensions that identify one system with reasonable confidence.
const DIRECT_EXTENSION_CORES = Object.freeze({
  ".nes": "nes",
  ".fds": "nes",
  ".unif": "nes",
  ".unf": "nes",
  ".smc": "snes",
  ".fig": "snes",
  ".sfc": "snes",
  ".gd3": "snes",
  ".gd7": "snes",
  ".dx2": "snes",
  ".bsx": "snes",
  ".swc": "snes",
  ".gb": "gb",
  ".gbc": "gb",
  ".dmg": "gb",
  ".gba": "gba",
  ".vb": "vb",
  ".z64": "n64",
  ".n64": "n64",
  ".v64": "n64",
  ".nds": "nds",
  ".cso": "psp",
  ".md": "segaMD",
  ".gen": "segaMD",
  ".smd": "segaMD",
  ".sms": "segaMS",
  ".gg": "segaGG",
  ".32x": "sega32x",
  ".a26": "atari2600",
  ".a52": "atari5200",
  ".a78": "atari7800",
  ".lnx": "lynx",
  ".j64": "jaguar",
  ".jag": "jaguar",
  ".pce": "pce",
  ".ngp": "ngp",
  ".ngc": "ngp",
  ".ws": "ws",
  ".wsc": "ws",
  ".col": "coleco",
  ".d64": "c64",
  ".t64": "c64",
  ".prg": "c64",
  ".d71": "c128",
  ".adf": "amiga",
  ".adz": "amiga",
  ".ipf": "amiga",
  ".wad": "prboom",
  ".3ds": "3ds",
  ".cci": "3ds",
  ".cia": "3ds"
});

// Extensions used by several systems. These intentionally require a user choice.
const AMBIGUOUS_EXTENSION_CORES = Object.freeze({
  ".bin": ["psx", "segaCD", "segaSaturn", "3do", "pce", "pcfx", "atari2600", "coleco"],
  ".cue": ["psx", "segaCD", "segaSaturn", "3do", "pcfx", "same_cdi"],
  ".iso": ["psp", "psx", "segaCD", "segaSaturn", "3do", "same_cdi"],
  ".chd": ["psx", "segaCD", "segaSaturn", "3do", "same_cdi", "arcade", "mame2003"],
  ".pbp": ["psx", "psp"],
  ".dsk": ["cap32", "crocods", "fuse", "81", "dosbox_pure"],
  ".tap": ["fuse", "c64"],
  ".crt": ["c64", "coleco"],
  ".img": ["dosbox_pure", "amiga"],
  ".mdf": ["psx", "segaCD", "segaSaturn", "3do"],
  ".ccd": ["psx", "segaCD", "segaSaturn"],
  ".m3u": ["psx", "segaCD", "segaSaturn"],
  ".rom": null,
  ".zip": null,
  ".7z": null,
  ".rar": null
});

const state = {
  games: [],
  activeCore: "all",
  activeSearch: "",
  threadsEnabled: true,
  threadsAvailable: false,
  openGameId: null,
  pendingLocalFile: null,
  pendingLocalCandidates: null,
  localLaunch: null
};

const elements = {
  search: document.getElementById("search"),
  filters: document.getElementById("core-filters"),
  threadsToggle: document.getElementById("threads-toggle"),
  threadsStatus: document.getElementById("threads-status"),
  notice: document.getElementById("notice"),
  loading: document.getElementById("loading"),
  grid: document.getElementById("game-grid"),
  empty: document.getElementById("empty-state"),
  stats: document.getElementById("stats"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modal-title"),
  modalMeta: document.getElementById("modal-meta"),
  close: document.getElementById("close-btn"),
  frame: document.getElementById("emulator-frame"),
  localRomButton: document.getElementById("local-rom-btn"),
  localRomInput: document.getElementById("local-rom-input"),
  corePicker: document.getElementById("core-picker"),
  corePickerFile: document.getElementById("core-picker-file"),
  corePickerHelp: document.getElementById("core-picker-help"),
  corePickerSelect: document.getElementById("core-picker-select"),
  corePickerCancel: document.getElementById("core-picker-cancel"),
  corePickerPlay: document.getElementById("core-picker-play")
};

function coreLabel(core) {
  return CORE_LABELS[core] || String(core || "UNKNOWN").toUpperCase();
}

function canonicalFilterKey(core) {
  const label = coreLabel(core);
  return label.toLowerCase();
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}


function fileExtension(filename) {
  const name = safeText(filename).trim().toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

function localGameTitle(filename) {
  const name = safeText(filename).trim();
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name || "Local ROM";
}

function localGameId(file) {
  const source = `${file.name}\u0000${file.size}\u0000${file.lastModified}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  // Keep local IDs in a high positive range so they do not collide with normal games.json IDs.
  return 1000000000 + ((hash >>> 0) % 1000000000);
}

function coreOption(core) {
  return UPLOAD_CORE_OPTIONS.find(([value]) => value === core) || [core, coreLabel(core)];
}

function populateCorePicker(candidates) {
  const allowed = Array.isArray(candidates) && candidates.length > 0
    ? UPLOAD_CORE_OPTIONS.filter(([core]) => candidates.includes(core))
    : UPLOAD_CORE_OPTIONS;

  elements.corePickerSelect.replaceChildren();
  for (const [core, label] of allowed) {
    const option = document.createElement("option");
    option.value = core;
    option.textContent = label;
    elements.corePickerSelect.appendChild(option);
  }
}

function closeCorePicker() {
  elements.corePicker.classList.remove("open");
  elements.corePicker.setAttribute("aria-hidden", "true");
  state.pendingLocalFile = null;
  state.pendingLocalCandidates = null;
}

function showCorePicker(file, candidates, extension) {
  state.pendingLocalFile = file;
  state.pendingLocalCandidates = candidates;
  elements.corePickerFile.textContent = file.name;
  elements.corePickerHelp.textContent = extension
    ? `${extension} can be used by more than one system, so select the system for this ROM.`
    : "The file extension is not recognized, so select the system for this ROM.";
  populateCorePicker(candidates);
  elements.corePicker.classList.add("open");
  elements.corePicker.setAttribute("aria-hidden", "false");
  elements.corePickerSelect.focus({ preventScroll: true });
}

function detectCoreFromFile(file) {
  const extension = fileExtension(file.name);
  const direct = DIRECT_EXTENSION_CORES[extension];
  if (direct) {
    return { core: direct, extension, candidates: null };
  }

  if (Object.prototype.hasOwnProperty.call(AMBIGUOUS_EXTENSION_CORES, extension)) {
    return { core: null, extension, candidates: AMBIGUOUS_EXTENSION_CORES[extension] };
  }

  return { core: null, extension, candidates: null };
}

function openLocalGame(file, core) {
  const threads = effectiveThreadsForGame({ core });

  if (THREADS_REQUIRED_CORES.has(core) && !threads) {
    setNotice(`${coreLabel(core)} requires Threads, but Threads are unavailable or disabled.`);
    return;
  }

  const game = {
    id: localGameId(file),
    title: localGameTitle(file.name),
    core,
    ejsVersion: core === "3ds" ? "nightly" : undefined
  };

  state.openGameId = game.id;
  state.localLaunch = { file, game };
  elements.modalTitle.textContent = game.title;
  elements.modalMeta.textContent = `${coreLabel(core)} · LOCAL FILE · THREADS ${threads ? "ON" : "OFF"}`;
  elements.modal.classList.add("open");
  elements.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const params = new URLSearchParams({
    mode: "local",
    threads: threads ? "1" : "0",
    session: `${Date.now()}-${Math.random().toString(36).slice(2)}`
  });

  elements.frame.src = `/pages/player.html?${params.toString()}`;
  elements.close.focus({ preventScroll: true });
}

function handleLocalFile(file) {
  if (!(file instanceof File) || file.size <= 0) {
    setNotice("That file is empty or could not be read.");
    return;
  }

  const detected = detectCoreFromFile(file);
  if (detected.core) {
    const [, label] = coreOption(detected.core);
    setNotice(`Detected ${label} from ${detected.extension}. The ROM stays in this browser and is not uploaded.`);
    openLocalGame(file, detected.core);
    return;
  }

  showCorePicker(file, detected.candidates, detected.extension);
}

function setNotice(message) {
  if (!message) {
    elements.notice.hidden = true;
    elements.notice.textContent = "";
    return;
  }
  elements.notice.textContent = message;
  elements.notice.hidden = false;
}

function detectThreadSupport() {
  state.threadsAvailable = window.crossOriginIsolated === true && typeof window.SharedArrayBuffer === "function";

  const saved = storageGet(STORAGE_KEY);
  state.threadsEnabled = saved === null ? true : saved === "true";

  if (!state.threadsAvailable) {
    state.threadsEnabled = false;
    elements.threadsToggle.checked = false;
    elements.threadsToggle.disabled = true;
    elements.threadsStatus.textContent = "UNAVAILABLE";
    elements.threadsStatus.className = "thread-status unavailable";
    setNotice("Threads are unavailable in this browser session. The site will continue in single-threaded mode. On Cloudflare Pages, check that the _headers file is deployed.");
    return;
  }

  elements.threadsToggle.disabled = false;
  elements.threadsToggle.checked = state.threadsEnabled;
  elements.threadsStatus.textContent = "AVAILABLE";
  elements.threadsStatus.className = "thread-status available";
  setNotice("");
}

function validateGame(game, index) {
  const errors = [];

  if (!Number.isInteger(game.id) || game.id <= 0) {
    errors.push(`Game #${index + 1} has an invalid id.`);
  }
  if (!safeText(game.title)) {
    errors.push(`Game #${index + 1} has no title.`);
  }
  if (!safeText(game.rom)) {
    errors.push(`Game #${index + 1} has no rom filename.`);
  }
  if (!safeText(game.core)) {
    errors.push(`Game #${index + 1} has no core.`);
  }

  return errors;
}

async function fetchFirstAvailableJson(paths) {
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        lastError = new Error(`${path} returned HTTP ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No game database could be loaded.");
}

async function loadGames() {
  try {
    // Prefer the organized layout, but keep compatibility with the original root-level games.json.
    const data = await fetchFirstAvailableJson(["/data/games.json", "/games.json", "./data/games.json", "./games.json"]);
    if (!Array.isArray(data)) {
      throw new TypeError("games.json must contain an array.");
    }

    const errors = data.flatMap(validateGame);
    const ids = new Set();
    for (const game of data) {
      if (ids.has(game.id)) {
        errors.push(`Duplicate game id detected: ${game.id}.`);
      }
      ids.add(game.id);
    }

    if (errors.length > 0) {
      console.warn("Game database validation warnings:", errors);
      setNotice(errors.slice(0, 3).join(" "));
    }

    state.games = data.filter(game =>
      Number.isInteger(game.id) &&
      game.id > 0 &&
      safeText(game.title) &&
      safeText(game.rom) &&
      safeText(game.core)
    );
  } catch (error) {
    console.error("Failed to load games.json:", error);
    state.games = [];
    setNotice("The game database could not be loaded. Check games.json and your web server configuration.");
  } finally {
    elements.loading.hidden = true;
    buildFilterButtons();
    renderGrid();
  }
}

function buildFilterButtons() {
  const unique = new Map();

  for (const game of state.games) {
    const key = canonicalFilterKey(game.core);
    if (!unique.has(key)) {
      unique.set(key, {
        key,
        label: coreLabel(game.core)
      });
    }
  }

  const sorted = [...unique.values()].sort((a, b) => a.label.localeCompare(b.label));

  for (const item of sorted) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-btn";
    button.dataset.core = item.key;
    button.textContent = item.label;
    elements.filters.appendChild(button);
  }
}

function getFilteredGames() {
  return state.games.filter(game => {
    const coreMatch = state.activeCore === "all" || canonicalFilterKey(game.core) === state.activeCore;
    const searchMatch = !state.activeSearch || game.title.toLowerCase().includes(state.activeSearch);
    return coreMatch && searchMatch;
  });
}

function createGameCard(game, index) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "game-card";
  card.style.animationDelay = `${Math.min(index * 28, 360)}ms`;
  card.setAttribute("aria-label", `Play ${game.title}`);

  const thumbWrap = document.createElement("div");
  thumbWrap.className = "thumb-wrap";

  const placeholder = document.createElement("div");
  placeholder.className = "no-thumb";
  placeholder.textContent = "NO IMAGE";

  if (game.thumbnail) {
    const image = document.createElement("img");
    const encodedThumbnail = encodeURIComponent(game.thumbnail).replace(/%2F/gi, "/");
    const thumbnailSources = [
      `/data/thumbs/${encodedThumbnail}`,
      `/thumbs/${encodedThumbnail}`
    ];
    let thumbnailIndex = 0;

    image.src = thumbnailSources[thumbnailIndex];
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      thumbnailIndex += 1;
      if (thumbnailIndex < thumbnailSources.length) {
        image.src = thumbnailSources[thumbnailIndex];
        return;
      }
      image.remove();
      if (!thumbWrap.contains(placeholder)) {
        thumbWrap.prepend(placeholder);
      }
    });
    thumbWrap.appendChild(image);
  } else {
    thumbWrap.appendChild(placeholder);
  }

  const overlay = document.createElement("div");
  overlay.className = "play-overlay";
  overlay.setAttribute("aria-hidden", "true");

  const icon = document.createElement("div");
  icon.className = "play-icon";
  icon.textContent = "▶";
  overlay.appendChild(icon);
  thumbWrap.appendChild(overlay);

  const info = document.createElement("div");
  info.className = "card-info";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = game.title;

  const core = document.createElement("div");
  core.className = "card-core";
  core.textContent = coreLabel(game.core);

  info.append(title, core);
  card.append(thumbWrap, info);
  card.addEventListener("click", () => openGame(game));

  return card;
}

function renderGrid() {
  const filtered = getFilteredGames();
  elements.grid.replaceChildren();

  if (filtered.length === 0) {
    elements.empty.hidden = false;
    elements.stats.textContent = state.games.length === 0 ? "" : `0 / ${state.games.length} GAMES`;
    return;
  }

  elements.empty.hidden = true;
  elements.stats.textContent = `${filtered.length} / ${state.games.length} GAMES`;

  const fragment = document.createDocumentFragment();
  filtered.forEach((game, index) => fragment.appendChild(createGameCard(game, index)));
  elements.grid.appendChild(fragment);
}

function effectiveThreadsForGame(game) {
  if (!state.threadsAvailable) {
    return false;
  }
  if (typeof game.threads === "boolean") {
    return game.threads;
  }
  return state.threadsEnabled;
}

function openGame(game) {
  const threads = effectiveThreadsForGame(game);

  if (THREADS_REQUIRED_CORES.has(game.core) && !threads) {
    setNotice(`${coreLabel(game.core)} requires Threads. Enable Threads before launching this game.`);
    elements.threadsToggle.focus();
    return;
  }

  state.openGameId = game.id;
  elements.modalTitle.textContent = game.title;
  elements.modalMeta.textContent = `${coreLabel(game.core)} · THREADS ${threads ? "ON" : "OFF"}`;
  elements.modal.classList.add("open");
  elements.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const params = new URLSearchParams({
    id: String(game.id),
    threads: threads ? "1" : "0",
    session: `${Date.now()}-${Math.random().toString(36).slice(2)}`
  });

  elements.frame.src = `/pages/player.html?${params.toString()}`;
  elements.close.focus({ preventScroll: true });
}

function closeModal() {
  if (!elements.modal.classList.contains("open")) {
    return;
  }

  elements.modal.classList.remove("open");
  elements.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  state.openGameId = null;
  state.localLaunch = null;

  // Replacing the iframe URL tears down the whole emulator document, including WASM, WebAudio and event handlers.
  elements.frame.src = "about:blank";
}

elements.filters.addEventListener("click", event => {
  const button = event.target.closest(".filter-btn");
  if (!button) {
    return;
  }

  state.activeCore = button.dataset.core || "all";
  for (const item of elements.filters.querySelectorAll(".filter-btn")) {
    item.classList.toggle("active", item === button);
  }
  renderGrid();
});

elements.search.addEventListener("input", event => {
  state.activeSearch = event.target.value.trim().toLowerCase();
  renderGrid();
});

elements.threadsToggle.addEventListener("change", event => {
  state.threadsEnabled = Boolean(event.target.checked);
  storageSet(STORAGE_KEY, String(state.threadsEnabled));
});


elements.localRomButton.addEventListener("click", () => {
  elements.localRomInput.value = "";
  elements.localRomInput.click();
});

elements.localRomInput.addEventListener("change", event => {
  const [file] = event.target.files || [];
  if (file) {
    handleLocalFile(file);
  }
});

elements.corePickerCancel.addEventListener("click", closeCorePicker);

elements.corePickerPlay.addEventListener("click", () => {
  const file = state.pendingLocalFile;
  const core = elements.corePickerSelect.value;
  if (!file || !core) {
    return;
  }
  closeCorePicker();
  openLocalGame(file, core);
});

elements.corePicker.addEventListener("click", event => {
  if (event.target === elements.corePicker) {
    closeCorePicker();
  }
});

elements.close.addEventListener("click", closeModal);

elements.modal.addEventListener("click", event => {
  if (event.target === elements.modal) {
    closeModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") {
    return;
  }
  if (elements.corePicker.classList.contains("open")) {
    closeCorePicker();
    return;
  }
  closeModal();
});

window.addEventListener("message", event => {
  if (event.origin !== window.location.origin || event.source !== elements.frame.contentWindow) {
    return;
  }

  if (event.data?.type === "retro-vault-player-local-ready") {
    if (state.localLaunch) {
      elements.frame.contentWindow.postMessage({
        type: "retro-vault-local-rom",
        file: state.localLaunch.file,
        game: state.localLaunch.game
      }, window.location.origin);
    }
    return;
  }

  if (event.data?.type === "retro-vault-player-error") {
    setNotice(event.data.message || "The emulator failed to start.");
  }

  if (event.data?.type === "retro-vault-player-exit") {
    closeModal();
  }
});

detectThreadSupport();
loadGames();


// Remove the inline boot probe only after the main script has initialized successfully.
const bootProbe = document.getElementById("boot-probe");
if (bootProbe) {
  bootProbe.remove();
}
