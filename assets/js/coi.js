"use strict";

(() => {
  if (window.top !== window.self) {
    return;
  }

  if (!("serviceWorker" in navigator) || !window.isSecureContext || window.crossOriginIsolated) {
    return;
  }

  const reloadKey = "retro-vault-coi-reload-v2";

  function storageGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Storage may be unavailable in private or restricted browsing contexts.
    }
  }

  async function bootstrapCrossOriginIsolation() {
    const scriptUrl = document.currentScript?.src || new URL("./assets/js/coi.js", window.location.href).href;
    const appRoot = new URL("../../", scriptUrl);
    const workerUrl = new URL("coi-sw.js", appRoot);

    try {
      const registration = await navigator.serviceWorker.register(workerUrl, { scope: appRoot.pathname });

      if (navigator.serviceWorker.controller) {
        return;
      }

      if (registration.active && storageGet(reloadKey) !== "1") {
        storageSet(reloadKey, "1");
        window.location.reload();
        return;
      }

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (storageGet(reloadKey) === "1") {
          return;
        }
        storageSet(reloadKey, "1");
        window.location.reload();
      }, { once: true });
    } catch (error) {
      console.warn("Cross-origin isolation service worker registration failed:", error);
    }
  }

  // Do not reload while the initial document is still being parsed/rendered.
  if (document.readyState === "complete") {
    bootstrapCrossOriginIsolation();
  } else {
    window.addEventListener("load", bootstrapCrossOriginIsolation, { once: true });
  }
})();
