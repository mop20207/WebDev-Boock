/* Actualizaciones remotas del contenido de WebDev Book para Android/Capacitor. */
(() => {
  "use strict";
  if (!window.Capacitor?.isNativePlatform?.()) {
    window.WebDevContentUpdates = { fetchData: (_path, input, init, fetcher) => fetcher(input, init) };
    return;
  }

  const DB = "webdev-book-content";
  const MANIFEST_URL = "https://raw.githubusercontent.com/mop20207/WebDev-Boock/main/updates/content-manifest.json";
  const RAW_BASE = "https://raw.githubusercontent.com/mop20207/WebDev-Boock/main/";
  const CHECK_INTERVAL = 12 * 60 * 60 * 1000;
  const net = window.__webdevNativeFetch || window.fetch.bind(window);
  let dbPromise;
  let checkPromise = null;
  let pendingApply = false;
  let status = {
    title: "Contenido listo para actualizarse",
    detail: "WebDev Book comprobará si hay contenido nuevo cuando tengas conexión.",
    state: "idle"
  };

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "path" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacenamiento de actualizaciones."));
      request.onblocked = () => reject(new Error("Cerrá otras pantallas de WebDev Book y volvé a intentar."));
    });
    return dbPromise;
  }

  async function read(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("No se pudo leer el almacenamiento local."));
    });
  }

  async function writeMeta(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("meta", "readwrite");
      tx.objectStore("meta").put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("No se pudo guardar el estado de actualización."));
      tx.onabort = () => reject(tx.error || new Error("Se canceló el guardado del estado."));
    });
  }

  async function writeFilesAtomically(records) {
    if (!records.length) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      records.forEach(record => store.put(record));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("No se pudo guardar el paquete de contenido."));
      tx.onabort = () => reject(tx.error || new Error("Se canceló el paquete de contenido."));
    });
  }

  async function meta(key) {
    const record = await read("meta", key);
    return record ? record.value : null;
  }

  async function hashText(value) {
    if (!window.crypto?.subtle) throw new Error("Este dispositivo no permite verificar la integridad del contenido.");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function safePath(path) {
    return typeof path === "string" && path.startsWith("data/") && path.endsWith(".json") &&
      !path.split("/").some(part => !part || part === "." || part === "..");
  }

  async function getManifest() {
    const response = await net(MANIFEST_URL, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("No se pudo consultar GitHub (HTTP " + response.status + ").");
    const manifest = await response.json();
    if (!manifest || !Array.isArray(manifest.files)) throw new Error("El manifiesto remoto no tiene un formato válido.");
    manifest.files = manifest.files.filter(file => file && safePath(file.path));
    if (!manifest.files.length) throw new Error("El manifiesto no contiene archivos de contenido válidos.");
    return manifest;
  }

  async function downloadFile(file) {
    const path = file.path.split("/").map(encodeURIComponent).join("/");
    const response = await net(RAW_BASE + path, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo descargar " + file.path + " (HTTP " + response.status + ").");
    const content = await response.text();
    try { JSON.parse(content); }
    catch { throw new Error(file.path + " no contiene JSON válido. Se conserva la versión anterior."); }
    const sha256 = await hashText(content);
    if (file.sha256 && sha256 !== file.sha256) {
      throw new Error("La verificación de integridad falló en " + file.path + ". Se conserva la versión anterior.");
    }
    return { path: file.path, content, sha256, updatedAt: new Date().toISOString() };
  }

  function updateStatus(title, detail, state = "idle") {
    status = { title, detail, state };
    const titleEl = document.querySelector("[data-update-title]");
    const detailEl = document.querySelector("[data-update-detail]");
    const trigger = document.querySelector(".webdev-update-trigger");
    if (titleEl) titleEl.textContent = title;
    if (detailEl) detailEl.textContent = detail;
    if (trigger) {
      trigger.dataset.updateState = state;
      trigger.title = title;
      trigger.setAttribute("aria-label", title);
    }
    const apply = document.querySelector("[data-update-apply]");
    const check = document.querySelector("[data-update-check]");
    if (apply) apply.hidden = !pendingApply;
    if (check) check.disabled = state === "checking" || state === "downloading";
  }

  async function check(options = {}) {
    if (checkPromise) return checkPromise;
    checkPromise = (async () => {
      if (!options.manual) {
        const last = await meta("lastCheckAt").catch(() => null);
        if (last && Date.now() - last < CHECK_INTERVAL) return { skipped: true, updated: 0 };
      }
      pendingApply = false;
      updateStatus("Buscando actualizaciones…", "Consultando el contenido publicado en GitHub.", "checking");
      try {
        const manifest = await getManifest();
        const pending = [];
        for (const file of manifest.files) {
          const local = await read("files", file.path);
          if (!local || (file.sha256 && local.sha256 !== file.sha256)) pending.push(file);
        }

        if (!pending.length) {
          await writeMeta("manifestVersion", manifest.version || "sin-versión");
          await writeMeta("lastCheckAt", Date.now());
          updateStatus("Ya tenés el contenido más reciente", "No se encontraron cambios en artículos, ejercicios ni catálogos.", "current");
          return { skipped: false, updated: 0 };
        }

        updateStatus("Descargando contenido…", "Se actualizarán " + pending.length + " archivos.", "downloading");
        const records = [];
        for (let i = 0; i < pending.length; i += 3) {
          const batch = await Promise.all(pending.slice(i, i + 3).map(downloadFile));
          records.push(...batch);
          updateStatus("Descargando contenido…", records.length + " de " + pending.length + " archivos recibidos. Verificando paquete…", "downloading");
        }

        // Se guarda el paquete en una sola transacción: nunca se aplica una descarga parcial.
        await writeFilesAtomically(records);
        await writeMeta("manifestVersion", manifest.version || "sin-versión");
        await writeMeta("lastCheckAt", Date.now());
        pendingApply = true;
        updateStatus("¡Hay contenido nuevo listo!", "La descarga terminó. Aplicá los cambios recargando esta pantalla.", "ready");
        window.dispatchEvent(new CustomEvent("webdevcontentupdated", {
          detail: { updated: records.length, version: manifest.version || null }
        }));
        return { skipped: false, updated: records.length };
      } catch (error) {
        await writeMeta("lastCheckAt", Date.now() - CHECK_INTERVAL + 30 * 60 * 1000).catch(() => {});
        updateStatus("No se pudo actualizar el contenido",
          (error?.message || "Error de conexión.") + " Podés seguir usando la última versión guardada.", "error");
        return { skipped: false, updated: 0, error };
      }
    })().finally(() => { checkPromise = null; });
    return checkPromise;
  }

  async function fetchData(path, input, init, fallback) {
    try {
      const record = await read("files", path);
      if (record && typeof record.content === "string") {
        return new Response(record.content, { status: 200, headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-WebDev-Content-Source": "indexeddb"
        }});
      }
    } catch (error) {
      console.warn("[WebDev Book] Se usará el JSON incluido en la APK.", error);
    }
    return fallback(input, init);
  }

  function createUI() {
    if (document.querySelector(".webdev-update-trigger")) return;
    const style = document.createElement("style");
    style.textContent = [
      ".webdev-update-trigger{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;margin-left:9px;padding:9px 12px;border:1px solid var(--line,#334155);border-radius:11px;background:var(--surface,#101827);color:var(--text,#edf3ff);font:600 12px/1.2 'DM Sans',sans-serif;cursor:pointer;position:relative}",
      ".webdev-update-trigger[data-update-state='ready']:after{content:'';position:absolute;width:8px;height:8px;right:5px;top:5px;border-radius:50%;background:#35c98a;box-shadow:0 0 0 2px var(--surface,#101827)}",
      ".webdev-update-dialog{width:min(460px,calc(100vw - 28px));max-width:none;padding:0;border:1px solid var(--line,#334155);border-radius:18px;background:var(--surface,#101827);color:var(--text,#edf3ff);box-shadow:0 24px 80px #0009}",
      ".webdev-update-dialog::backdrop{background:#020617b8;backdrop-filter:blur(4px)}",
      ".webdev-update-content{padding:22px}.webdev-update-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:15px}",
      ".webdev-update-heading h2{font:700 19px/1.2 'Space Grotesk',sans-serif;margin:0}.webdev-update-close{border:0;background:transparent;color:inherit;font-size:24px;cursor:pointer}",
      ".webdev-update-status{padding:15px;border:1px solid var(--line,#334155);border-radius:12px;background:var(--surface-2,#151f31);margin:13px 0}",
      ".webdev-update-status strong{display:block;margin-bottom:5px}.webdev-update-status p{margin:0;color:var(--muted,#8998b2);font-size:13px;overflow-wrap:anywhere}",
      ".webdev-update-meta{display:grid;gap:5px;color:var(--muted,#8998b2);font-size:12px;margin:12px 0 18px}",
      ".webdev-update-actions{display:flex;flex-wrap:wrap;gap:9px}.webdev-update-actions button{border:1px solid var(--line,#334155);border-radius:10px;padding:10px 13px;background:var(--surface-3,#1b2940);color:var(--text,#edf3ff);font-weight:700;cursor:pointer}",
      ".webdev-update-actions button.primary{background:var(--blue-2,#426be5);border-color:var(--blue-2,#426be5);color:#fff}.webdev-update-actions button:disabled{opacity:.55;cursor:wait}.webdev-update-actions button[hidden]{display:none}",
      "@media(max-width:760px){.webdev-update-trigger{padding:9px 10px;margin-left:5px;font-size:16px}.webdev-update-trigger .webdev-update-label{display:none}}",
      "@media(prefers-reduced-motion:no-preference){.webdev-update-trigger[data-update-state='checking'] .webdev-update-icon{animation:webdev-update-spin 1.2s linear infinite}@keyframes webdev-update-spin{to{transform:rotate(360deg)}}}"
    ].join("");
    document.head.appendChild(style);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "webdev-update-trigger";
    trigger.innerHTML = '<span class="webdev-update-icon" aria-hidden="true">↻</span><span class="webdev-update-label">Actualizaciones</span>';
    trigger.setAttribute("aria-label", "Abrir actualizaciones de contenido");
    const host = document.querySelector(".topbar, .detail-page-topbar");
    if (host) {
      const theme = host.querySelector(".top-icon, #topThemeToggle");
      if (theme) host.insertBefore(trigger, theme); else host.appendChild(trigger);
    } else {
      Object.assign(trigger.style, { position: "fixed", right: "16px", bottom: "16px", zIndex: "80" });
      document.body.appendChild(trigger);
    }

    const dialog = document.createElement("dialog");
    dialog.className = "webdev-update-dialog";
    dialog.innerHTML =
      '<div class="webdev-update-content">' +
      '<div class="webdev-update-heading"><h2>Actualizaciones</h2><button class="webdev-update-close" type="button" aria-label="Cerrar">×</button></div>' +
      '<p style="margin:0;color:var(--muted,#8998b2);font-size:13px">Los artículos, ejemplos y ejercicios nuevos se descargan sin reinstalar la APK.</p>' +
      '<div class="webdev-update-status" role="status" aria-live="polite"><strong data-update-title></strong><p data-update-detail></p></div>' +
      '<div class="webdev-update-meta"><span>Contenido sincronizado: <b data-update-version>Consultando…</b></span><span>Última comprobación: <b data-update-last-check>Consultando…</b></span></div>' +
      '<div class="webdev-update-actions"><button class="primary" type="button" data-update-check>Buscar actualizaciones</button><button type="button" data-update-apply hidden>Aplicar ahora</button></div>' +
      '</div>';
    document.body.appendChild(dialog);

    async function refreshMeta() {
      const version = await meta("manifestVersion").catch(() => null);
      const last = await meta("lastCheckAt").catch(() => null);
      dialog.querySelector("[data-update-version]").textContent = version || "Aún sin sincronizar";
      dialog.querySelector("[data-update-last-check]").textContent =
        last ? new Date(last).toLocaleString("es-AR") : "Todavía no se comprobó";
      dialog.querySelector("[data-update-title]").textContent = status.title;
      dialog.querySelector("[data-update-detail]").textContent = status.detail;
      dialog.querySelector("[data-update-apply]").hidden = !pendingApply;
      dialog.querySelector("[data-update-check]").disabled =
        status.state === "checking" || status.state === "downloading";
    }

    trigger.addEventListener("click", async () => {
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
      await refreshMeta();
    });
    dialog.querySelector(".webdev-update-close").addEventListener("click", () => {
      if (dialog.close) dialog.close(); else dialog.removeAttribute("open");
    });
    dialog.querySelector("[data-update-check]").addEventListener("click", async () => {
      await check({ manual: true });
      await refreshMeta();
    });
    dialog.querySelector("[data-update-apply]").addEventListener("click", () => {
      const safe = window.confirm("La actualización ya está guardada. ¿Querés recargar WebDev Book para aplicarla? Guardá antes cualquier código que tengas sin guardar en el editor.");
      if (safe) window.location.reload();
    });
    refreshMeta().catch(() => {});
  }

  window.WebDevContentUpdates = { fetchData, checkForUpdates: check };
  function initialize() {
    createUI();
    setTimeout(() => check({ manual: false }), 1800);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();