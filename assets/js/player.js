"use strict";

const DEFAULT_EJS_VERSION = "4.2.3";
const DEFAULT_EJS_DATA_PATH = `https://cdn.emulatorjs.org/${DEFAULT_EJS_VERSION}/data/`;
const THREADS_REQUIRED_CORES = new Set(["psp", "ppsspp", "dos", "dosbox_pure", "3ds", "azahar"]);
const CORE_ALIASES = Object.freeze({
  gbc: "gb",
  mame: "mame2003"
});

const DATA_ROOT = "../data";
const LEGACY_ROOT = "..";
const message = document.getElementById("player-message");
let localObjectUrl = "";
let emulatorStarted = false;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.classList.remove("hidden");
}

function hideMessage() {
  message.classList.add("hidden");
}

function notifyParent(type, detail = {}) {
  if (window.parent === window) {
    return;
  }
  window.parent.postMessage({ type, ...detail }, window.location.origin);
}

function safeRelativeAsset(folder, filename, root = DATA_ROOT) {
  if (typeof filename !== "string" || filename.length === 0) {
    return "";
  }
  const encoded = filename
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
  return `${root}/${folder}/${encoded}`;
}

async function firstExistingAsset(paths) {
  for (const path of paths) {
    try {
      const response = await fetch(path, {
        method: "GET",
        cache: "no-store",
        headers: { Range: "bytes=0-0" }
      });

      if (!response.ok && response.status !== 206) {
        continue;
      }

      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("text/html")) {
        console.warn("Rejected HTML response while probing ROM:", path);
        continue;
      }

      return path;
    } catch (error) {
      console.debug("Asset probe failed:", path, error);
    }
  }

  throw new Error("ROM file could not be loaded from the configured path.");
}

async function fetchFirstAvailableJson(paths) {
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        lastError = new Error(`${path} returned HTTP ${response.status}.`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No game database could be loaded.");
}

function resolveDataPath(game) {
  if (typeof game.dataPath === "string" && /^https:\/\//i.test(game.dataPath)) {
    return game.dataPath.endsWith("/") ? game.dataPath : `${game.dataPath}/`;
  }

  if (typeof game.ejsVersion === "string" && /^[A-Za-z0-9._-]+$/.test(game.ejsVersion)) {
    return `https://cdn.emulatorjs.org/${game.ejsVersion}/data/`;
  }

  return DEFAULT_EJS_DATA_PATH;
}

function configureOptionalOptions(game) {
  if (game.bios) {
    window.EJS_biosUrl = safeRelativeAsset("bios", game.bios);
  }
  if (game.gameParent) {
    window.EJS_gameParentUrl = safeRelativeAsset("roms", game.gameParent);
  }
  if (game.patch) {
    window.EJS_gamePatchUrl = safeRelativeAsset("roms", game.patch);
  }
  if (Number.isInteger(game.videoRotation) && game.videoRotation >= 0 && game.videoRotation <= 3) {
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
    throw new Error("The emulator has already been started in this player frame.");
  }

  if (!game || !Number.isInteger(game.id) || !game.core || !game.title) {
    throw new Error("Invalid game configuration.");
  }

  const core = CORE_ALIASES[game.core] || game.core;
  const threadSupport = window.crossOriginIsolated === true && typeof window.SharedArrayBuffer === "function";
  const threads = requestedThreads && threadSupport;

  if (THREADS_REQUIRED_CORES.has(game.core) && !threads) {
    throw new Error(`${game.core} requires Threads, but SharedArrayBuffer is unavailable.`);
  }

  const dataPath = resolveDataPath(game);

  window.EJS_player = "#game";
  window.EJS_gameID = game.id;
  window.EJS_gameName = game.title;
  window.EJS_gameUrl = gameUrl;
  window.EJS_core = core;
  window.EJS_pathtodata = dataPath;
  window.EJS_startOnLoaded = false;
  window.EJS_language = "ja-JP";
  window.EJS_threads = threads;
  window.EJS_askBeforeExit = false;
  window.EJS_disableAutoUnload = false;
  window.EJS_CacheLimit = 4096;
  window.EJS_Buttons = {
    playPause: true,
    restart: true,
    mute: true,
    settings: true,
    fullscreen: true,
    saveState: true,
    loadState: true,
    screenRecord: false,
    gamepad: true,
    cheat: false,
    volume: true,
    saveSavFiles: true,
    loadSavFiles: true,
    quickSave: true,
    quickLoad: true,
    screenshot: true,
    cacheManager: false,
    exitEmulation: true
  };

  configureOptionalOptions(game);

  window.EJS_ready = () => {
    hideMessage();
  };

  window.EJS_onGameStart = () => {
    hideMessage();
  };

  window.EJS_onExit = () => {
    notifyParent("retro-vault-player-exit");
  };

  const loader = document.createElement("script");
  loader.src = `${dataPath}loader.js`;
  loader.async = true;
  loader.addEventListener("error", () => {
    const error = new Error("Failed to load EmulatorJS loader.js.");
    showMessage(error.message, true);
    notifyParent("retro-vault-player-error", { message: error.message });
  });

  emulatorStarted = true;
  document.body.appendChild(loader);
}

async function bootLibraryGame(params, requestedThreads) {
  const gameId = Number(params.get("id"));
  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw new Error("Invalid game id.");
  }

  const games = await fetchFirstAvailableJson([`${DATA_ROOT}/games.json`, `${LEGACY_ROOT}/games.json`]);
  if (!Array.isArray(games)) {
    throw new Error("games.json is not an array.");
  }

  const game = games.find(item => item.id === gameId);
  if (!game) {
    throw new Error(`Game id ${gameId} was not found.`);
  }

  // Prefer data/roms, but automatically fall back to the original root-level roms directory.
  const gameUrl = await firstExistingAsset([
    safeRelativeAsset("roms", game.rom, DATA_ROOT),
    safeRelativeAsset("roms", game.rom, LEGACY_ROOT)
  ]);

  startEmulator(game, gameUrl, requestedThreads);
}

function bootLocalGame(requestedThreads) {
  showMessage("WAITING FOR LOCAL ROM...");

  const onMessage = event => {
    if (event.origin !== window.location.origin || event.source !== window.parent) {
      return;
    }
    if (event.data?.type !== "retro-vault-local-rom") {
      return;
    }

    window.removeEventListener("message", onMessage);

    try {
      const file = event.data.file;
      const game = event.data.game;

      if (!(file instanceof Blob) || file.size <= 0) {
        throw new Error("The local ROM file could not be read.");
      }

      // EmulatorJS supports blob: game URLs. EJS_gameName keeps saves tied to the local filename/title.
      localObjectUrl = URL.createObjectURL(file);
      startEmulator(game, localObjectUrl, requestedThreads);
    } catch (error) {
      console.error(error);
      showMessage(error.message || "Failed to open the local ROM.", true);
      notifyParent("retro-vault-player-error", {
        message: error.message || "Failed to open the local ROM."
      });
    }
  };

  window.addEventListener("message", onMessage);
  notifyParent("retro-vault-player-local-ready");
}

async function boot() {
  try {
    const params = new URLSearchParams(window.location.search);
    const requestedThreads = params.get("threads") !== "0";

    if (params.get("mode") === "local") {
      bootLocalGame(requestedThreads);
      return;
    }

    await bootLibraryGame(params, requestedThreads);
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Failed to start the emulator.", true);
    notifyParent("retro-vault-player-error", {
      message: error.message || "Failed to start the emulator."
    });
  }
}

window.addEventListener("pagehide", () => {
  try {
    if (window.EJS_emulator && typeof window.EJS_emulator.exit === "function") {
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
