"use strict";

(() => {
  if (!("serviceWorker" in navigator) || !window.isSecureContext || window.crossOriginIsolated) {
    return;
  }

  const reloadKey = "retro-vault-coi-reload";
  const scriptUrl = document.currentScript?.src;
  const appRoot = scriptUrl
    ? new URL("../../", scriptUrl)
    : new URL("./", window.location.href);
  const workerUrl = new URL("coi-sw.js", appRoot);

  navigator.serviceWorker.register(workerUrl, { scope: appRoot.pathname })
    .then(registration => {
      if (registration.active && !navigator.serviceWorker.controller && sessionStorage.getItem(reloadKey) !== "1") {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      }
    })
    .catch(error => {
      console.warn("Cross-origin isolation service worker registration failed:", error);
    });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (sessionStorage.getItem(reloadKey) === "1") {
      return;
    }
    sessionStorage.setItem(reloadKey, "1");
    window.location.reload();
  });
})();
