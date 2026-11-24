(() => {
  "use strict";

  // En la aplicación Android, Capacitor administra el contenedor nativo y no
  // debemos registrar el service worker de GitHub Pages (su ruta base es distinta).
  if (window.Capacitor?.isNativePlatform?.()) return;

  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (!("serviceWorker" in navigator) || !manifestLink) return;

  const appRoot = new URL("./", new URL(manifestLink.href, document.baseURI));
  const installButton = document.createElement("button");
  installButton.type = "button";
  installButton.className = "pwa-install-cta";
  installButton.textContent = "⇩  Instalar WebDev Book";
  installButton.setAttribute("aria-label", "Instalar WebDev Book en este dispositivo");
  installButton.hidden = true;
  document.body.appendChild(installButton);

  let deferredInstallPrompt = null;

  const showInstallButton = () => {
    installButton.hidden = !deferredInstallPrompt;
  };

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      console.info("[WebDev Book] No se completó la instalación.", error);
    }
    deferredInstallPrompt = null;
    showInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showInstallButton();
    installButton.remove();
  });

  navigator.serviceWorker.register(new URL("service-worker.js", appRoot), {
    scope: appRoot.pathname,
    updateViaCache: "none"
  }).then(registration => {
    registration.update().catch(() => {});
    console.info("[WebDev Book] Aplicación preparada para uso sin conexión.");
  }).catch(error => {
    console.warn("[WebDev Book] No se pudo activar el modo sin conexión.", error);
  });
})();