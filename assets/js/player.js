"use strict";

const DEFAULT_EJS_VERSION = "4.2.3";
const DEFAULT_EJS_DATA_PATH = `https://cdn.emulatorjs.org/${DEFAULT_EJS_VERSION}/data/`;

const THREADS_REQUIRED_CORES = new Set([
  "psp",
  "ppsspp",
  "dos",
  "dosbox_pure",
  "3ds",
  "azahar"
]);

const CORE_ALIASES = Object.freeze({
  gbc: "gb",
  mame: "mame2003"
});

const message = document.getElementById("player-message");
let localObjectUrl = "";
let emulatorStarted = false;

function showMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.classList.remove("hidden");
}

function hideMessage() {
  if (!message) return;
  message.classList.add("hidden");
  message.classList.remove("error");
}

function notifyParent(type, detail = {}) {
  if (window.parent === window) return;
  window.parent.postMessage({ type, ...detail }, window.location.origin);
}

function encodeAssetPath(folder, filename) {
  if (typeof filename !== "string" || filename.length === 0) return "";

  const encoded = filename
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");

  return `/data/${folder}/${encoded}`;
}

async function fetchGames() {
  const candidates = ["/data/games.json", "/games.json"];
  let lastError = null;

  for (const path of candidates) {
    try {
      const response = await fetch(`${path}?v=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        lastError = new Error(`${path} returned HTTP ${response.status}.`);
        continue;
      }

      const games = await response.json();
      if (!Array.isArray(games)) {
        throw new Error(`${path} is not an array.`);
      }

      return games;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Could not load games.json.");
}

function resolveDataPath(game) {
  if (typeof game.dataPath === "string" && /^https:\/\//i.test(game.dataPath)) {
    return game.dataPath.endsWith("/") ? game.dataPath : `${game.dataPath}/`;
  }

  if (
    typeof game.ejsVersion === "string" &&
    /^[A-Za-z0-9._-]+$/.test(game.ejsVersion)
  ) {
    return `https://cdn.emulatorjs.org/${game.ejsVersion}/data/`;
  }

  return DEFAULT_EJS_DATA_PATH;
}

function configureOptionalOptions(game) {
  if (game.bios) {
    window.EJS_biosUrl = new URL(
      encodeAssetPath("bios", game.bios),
      window.location.origin
    ).href;
  }

  if (game.gameParent) {
    window.EJS_gameParentUrl = new URL(
      encodeAssetPath("roms", game.gameParent),
      window.location.origin
    ).href;
  }

  if (game.patch) {
    window.EJS_gamePatchUrl = new URL(
      encodeAssetPath("roms", game.patch),
      window.location.origin
    ).href;
  }

  if (
    Number.isInteger(game.videoRotation) &&
    game.videoRotation >= 0 &&
    game.videoRotation <= 3
  ) {
    window.EJS_videoRotation = game.videoRotation;
  }

  if (typeof game.disableCue === "boolean") {
    window.EJS_disableCue = game.disableCue;
  }

  if (typeof game.forceLegacyCores === "boolean") {
    window.EJS_forceLegacyCores = game.forceLegacyCores;
  }
}

function startEmulator(game, gameUrl, requestedThreads) {
  if (emulatorStarted) {
    throw new Error("The emulator has already been started.");
  }

  if (!game || !Number.isInteger(game.id) || !game.core || !game.title) {
    throw new Error("Invalid game configuration.");
  }

  const core = CORE_ALIASES[game.core] || game.core;
  const threadSupport =
    window.crossOriginIsolated === true &&
    typeof window.SharedArrayBuffer === "function";
  const threads = requestedThreads && threadSupport;

  if (THREADS_REQUIRED_CORES.has(game.core) && !threads) {
    throw new Error(
      `${game.core} requires Threads, but SharedArrayBuffer is unavailable.`
    );
  }

  const dataPath = resolveDataPath(game);

  // Keep the player configuration intentionally close to the official EmulatorJS demo.
  window.EJS_player = "#game";
  window.EJS_gameID = game.id;
  window.EJS_gameName = game.title;
  window.EJS_gameUrl = gameUrl;
  window.EJS_core = core;
  window.EJS_pathtodata = dataPath;
  window.EJS_startOnLoaded = true;
  window.EJS_language = "ja-JP";
  window.EJS_threads = threads;
  window.EJS_DEBUG_XX = true;

  configureOptionalOptions(game);

  window.EJS_ready = () => {
    hideMessage();
    notifyParent("retro-vault-player-ready");
  };

  window.EJS_onGameStart = () => {
    hideMessage();
    notifyParent("retro-vault-player-start");
  };

  window.EJS_onExit = () => {
    notifyParent("retro-vault-player-exit");
  };

  const loader = document.createElement("script");
  loader.src = `${dataPath}loader.js`;

  loader.addEventListener("error", () => {
    const text = "Failed to load EmulatorJS loader.js.";
    showMessage(text, true);
    notifyParent("retro-vault-player-error", { message: text });
  });

  emulatorStarted = true;
  document.body.appendChild(loader);
}

async function bootLibraryGame(params, requestedThreads) {
  const gameId = Number(params.get("id"));

  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw new Error("Invalid game id.");
  }

  const games = await fetchGames();
  const game = games.find(item => item.id === gameId);

  if (!game) {
    throw new Error(`Game id ${gameId} was not found.`);
  }

  if (typeof game.rom !== "string" || game.rom.length === 0) {
    throw new Error(`Game id ${gameId} does not have a ROM filename.`);
  }

  // Pass an absolute same-origin URL directly to EmulatorJS.
  // This avoids ambiguity about whether a relative ROM path is resolved
  // against player.html or the CDN-loaded loader.js.
  const gameUrl = new URL(
    encodeAssetPath("roms", game.rom),
    window.location.origin
  ).href;

  startEmulator(game, gameUrl, requestedThreads);
}

function bootLocalGame(requestedThreads) {
  showMessage("WAITING FOR LOCAL ROM...");

  const onMessage = event => {
    if (
      event.origin !== window.location.origin ||
      event.source !== window.parent ||
      event.data?.type !== "retro-vault-local-rom"
    ) {
      return;
    }

    window.removeEventListener("message", onMessage);

    try {
      const file = event.data.file;
      const game = event.data.game;

      if (!(file instanceof Blob) || file.size <= 0) {
        throw new Error("The local ROM file could not be read.");
      }

      localObjectUrl = URL.createObjectURL(file);
      hideMessage();
      startEmulator(game, localObjectUrl, requestedThreads);
    } catch (error) {
      console.error(error);

      const text = error?.message || "Failed to open the local ROM.";
      showMessage(text, true);
      notifyParent("retro-vault-player-error", { message: text });
    }
  };

  window.addEventListener("message", onMessage);
  notifyParent("retro-vault-player-local-ready");
}

async function boot() {
  try {
    hideMessage();

    const params = new URLSearchParams(window.location.search);
    const requestedThreads = params.get("threads") !== "0";

    if (params.get("mode") === "local") {
      bootLocalGame(requestedThreads);
      return;
    }

    await bootLibraryGame(params, requestedThreads);
  } catch (error) {
    console.error(error);

    const text = error?.message || "Failed to start the emulator.";
    showMessage(text, true);
    notifyParent("retro-vault-player-error", { message: text });
  }
}

window.addEventListener("pagehide", () => {
  try {
    if (
      window.EJS_emulator &&
      typeof window.EJS_emulator.exit === "function"
    ) {
      window.EJS_emulator.exit();
    }
  } catch (error) {
    console.debug("Emulator cleanup fallback:", error);
  }

  if (localObjectUrl) {
    URL.revokeObjectURL(localObjectUrl);
    localObjectUrl = "";
  }
});

boot();
