/* Centro de módulos: inventario local y preferencias.
   La descarga de paquetes no se activa en esta etapa: el catálogo la marca explícitamente como futura. */
(() => {
  "use strict";

  const CATALOG_URL = new URL("../modules/catalog.json", document.baseURI);
  const DB_NAME = "webdev-book-modules";
  const DB_VERSION = 1;
  const STORE = {
    modules: "modules",
    files: "files",
    meta: "meta",
    preferences: "preferences"
  };
  const FALLBACK_KEY = "webdevbook.module-preferences.v1";
  const state = {
    catalog: null,
    filter: "all",
    query: "",
    priorities: new Set(),
    db: null,
    dbAvailable: false
  };

  const $ = selector => document.querySelector(selector);

  function openDatabase() {
    if (!("indexedDB" in window)) {
      return Promise.reject(new Error("IndexedDB no está disponible en este entorno."));
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE.modules)) db.createObjectStore(STORE.modules, { keyPath: "id" });
        if (!db.objectStoreNames.contains(STORE.files)) db.createObjectStore(STORE.files, { keyPath: "path" });
        if (!db.objectStoreNames.contains(STORE.meta)) db.createObjectStore(STORE.meta, { keyPath: "key" });
        if (!db.objectStoreNames.contains(STORE.preferences)) db.createObjectStore(STORE.preferences, { keyPath: "id" });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error("No se pudo abrir la base local de módulos."));
      request.onblocked = () => reject(new Error("Cerrá otras pantallas de WebDev Book y volvé a intentar."));
    });
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Falló una operación del almacenamiento local."));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Falló una transacción local."));
      transaction.onabort = () => reject(transaction.error || new Error("Se canceló la transacción local."));
    });
  }

  async function readPrioritiesFromDatabase() {
    const tx = state.db.transaction(STORE.preferences, "readonly");
    const done = transactionDone(tx);
    const records = await requestResult(tx.objectStore(STORE.preferences).getAll());
    await done;
    return records.filter(item => item && item.pinned === true).map(item => item.id);
  }

  function readPrioritiesFromFallback() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FALLBACK_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(id => typeof id === "string") : [];
    } catch {
      return [];
    }
  }

  async function persistPriorities() {
    const ids = Array.from(state.priorities);
    if (state.dbAvailable && state.db) {
      const tx = state.db.transaction(STORE.preferences, "readwrite");
      const done = transactionDone(tx);
      const store = tx.objectStore(STORE.preferences);
      const current = await requestResult(store.getAll());
      current.forEach(record => store.delete(record.id));
      ids.forEach(id => store.put({ id, pinned: true, updatedAt: new Date().toISOString() }));
      await done;
      return;
    }
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(ids));
    } catch (error) {
      throw new Error("No se pudo guardar la preferencia. Revisá el espacio disponible del dispositivo.");
    }
  }

  function showToast(message) {
    const toast = $("#moduleToast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2700);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "No disponible";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KiB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MiB";
  }

  function categoryLabel(category) {
    return ({
      core: "Núcleo",
      foundation: "Fundamentos",
      library: "Biblioteca",
      lab: "Laboratorio",
      media: "Multimedia"
    })[category] || "Módulo";
  }

  function createText(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value ?? "";
    return node;
  }

  function getVisibleModules() {
    const query = state.query.trim().toLocaleLowerCase("es");
    return state.catalog.modules.filter(module => {
      const isIntegrated = module.status === "integrated";
      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "integrated" && isIntegrated) ||
        (state.filter === "library" && module.category === "library") ||
        (state.filter === "lab" && module.category === "lab") ||
        (state.filter === "media" && module.category === "media") ||
        (state.filter === "priority" && state.priorities.has(module.id));
      const searchable = [module.name, module.description, module.details, categoryLabel(module.category)]
        .join(" ").toLocaleLowerCase("es");
      return matchesFilter && (!query || searchable.includes(query));
    });
  }

  function makeActionButton(label, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function renderModule(module, packageStatus = null) {
    const card = document.createElement("article");
    card.className = "module-card";
    card.dataset.moduleId = module.id;

    const isLibrary = module.category === "library";
    const packageState = packageStatus?.state || "missing";
    const installed = packageState === "installed";
    const needsUpdate = packageState === "update";
    const top = document.createElement("div");
    top.className = "module-card-top";
    const badge = isLibrary
      ? (installed ? "Descargado" : needsUpdate ? "Actualización" : packageState === "unavailable" ? "No disponible" : "Descargable")
      : (module.status === "integrated" ? (module.essential ? "Esencial" : "Incluido") : "Etapa " + module.stage);
    const badgeState = isLibrary
      ? (installed ? "status-integrated" : needsUpdate ? "status-planned" : "status-planned")
      : (module.status === "integrated" ? "status-integrated" : "status-planned");
    top.append(
      createText("span", "module-card-category", categoryLabel(module.category)),
      createText("span", "module-card-state " + badgeState, badge)
    );

    const title = createText("h3", "", module.name);
    const description = createText("p", "", module.description);
    const details = createText("p", "module-card-details", module.details || "");
    const meta = document.createElement("div");
    meta.className = "module-card-meta";
    meta.append(createText("span", "", "v" + (isLibrary ? packageStatus?.entry?.version || "—" : module.version)));
    if (isLibrary && packageStatus?.entry) {
      meta.append(createText("span", "", formatBytes(packageStatus.entry.sizeBytes)));
      meta.append(createText("span", "", packageStatus.entry.articleCount + " artículos"));
    } else if (Number.isInteger(module.articleCount)) {
      meta.append(createText("span", "", module.articleCount + " artículos"));
    } else if (module.category === "foundation") {
      meta.append(createText("span", "", "Contenido esencial"));
    }
    if (module.essential) meta.append(createText("span", "", "No desinstalable"));

    const actions = document.createElement("div");
    actions.className = "module-card-actions";

    if (isLibrary) {
      const apiReady = Boolean(window.WebDevLibraries);
      if (installed && module.href) {
        const open = document.createElement("a");
        open.className = "module-card-open";
        open.href = module.href;
        open.textContent = "Abrir biblioteca →";
        actions.append(open);
      } else {
        const label = needsUpdate ? "Actualizar" : "Descargar";
        const action = makeActionButton(label, "module-card-open", async event => {
          action.disabled = true;
          const initial = action.textContent;
          try {
            await window.WebDevLibraries.downloadLibrary(module.id, {
              onProgress(progress) {
                action.textContent = progress.total > 0
                  ? "Descargando " + progress.percent + "%"
                  : "Descargando…";
              }
            });
            showToast(module.name + " quedó disponible sin conexión.");
            await renderCatalog();
            await updateStorage();
          } catch (error) {
            action.textContent = initial;
            action.disabled = false;
            showToast(error?.message || "No se pudo instalar la biblioteca.");
          }
        });
        action.disabled = !apiReady || Boolean(packageStatus?.error) || packageState === "unavailable";
        if (!apiReady) action.title = "El administrador de paquetes no está disponible.";
        actions.append(action);
      }

      if (installed) {
        const remove = makeActionButton("Quitar", "module-priority", async buttonEvent => {
          if (!window.confirm("Se quitará la copia sin conexión de " + module.name + ". No se borrarán tus favoritos, progreso, proyectos ni archivos del editor. ¿Continuar?")) return;
          remove.disabled = true;
          try {
            await window.WebDevLibraries.removeLibrary(module.id);
            showToast(module.name + " se quitó del almacenamiento local.");
            await renderCatalog();
            await updateStorage();
          } catch (error) {
            remove.disabled = false;
            showToast(error?.message || "No se pudo quitar la biblioteca.");
          }
        });
        actions.append(remove);
      }
    } else {
      const open = document.createElement("a");
      open.className = "module-card-open";
      if (module.status === "integrated" && module.href) {
        open.href = module.href;
        open.textContent = module.category === "core" ? "Ir al inicio →" : "Abrir sección →";
      } else {
        open.textContent = "Disponible en etapa " + module.stage;
        open.setAttribute("aria-disabled", "true");
        open.tabIndex = -1;
        open.classList.add("is-future");
      }
      actions.append(open);
    }

    const priority = document.createElement("button");
    priority.type = "button";
    priority.className = "module-priority";
    const isPinned = state.priorities.has(module.id);
    priority.classList.toggle("is-active", isPinned);
    priority.setAttribute("aria-pressed", String(isPinned));
    priority.textContent = isPinned ? "★ Prioritario" : "☆ Priorizar";
    priority.addEventListener("click", async () => {
      const wasPinned = state.priorities.has(module.id);
      if (wasPinned) state.priorities.delete(module.id);
      else state.priorities.add(module.id);
      try {
        await persistPriorities();
        await renderCatalog();
        showToast(wasPinned ? "Se quitó de tus prioridades." : "Módulo agregado a tus prioridades.");
      } catch (error) {
        if (wasPinned) state.priorities.add(module.id);
        else state.priorities.delete(module.id);
        showToast(error.message);
      }
    });

    actions.append(priority);
    card.append(top, title, description, details, meta, actions);
    return card;
  }

  let catalogRenderSequence = 0;
  async function renderCatalog() {
    if (!state.catalog) return;
    const sequence = ++catalogRenderSequence;
    const grid = $("#moduleGrid");
    const empty = $("#moduleEmpty");
    const visible = getVisibleModules();
    const packageEntries = visible.filter(module => module.category === "library");
    const statusPairs = await Promise.all(packageEntries.map(async module => {
      try {
        if (!window.WebDevLibraries?.getPackageStatus) {
          return [module.id, { state: "unavailable", entry: null }];
        }
        return [module.id, await window.WebDevLibraries.getPackageStatus(module.id)];
      } catch (error) {
        console.warn("[WebDev Book] No se pudo consultar " + module.name + ":", error);
        return [module.id, { state: "unavailable", entry: null, error }];
      }
    }));
    if (sequence !== catalogRenderSequence) return;
    const statuses = new Map(statusPairs);
    grid.replaceChildren(...visible.map(module => renderModule(module, statuses.get(module.id))));
    $("#moduleResultCount").textContent = visible.length + (visible.length === 1 ? " módulo" : " módulos");
    empty.hidden = visible.length !== 0;
  }

  function configureFilters() {
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter || "all";
        document.querySelectorAll("[data-filter]").forEach(filter => {
          const active = filter === button;
          filter.classList.toggle("is-active", active);
          filter.setAttribute("aria-pressed", String(active));
        });
        renderCatalog();
      });
    });

    $("#moduleSearch")?.addEventListener("input", event => {
      state.query = event.target.value || "";
      renderCatalog();
    });
  }

  async function updateStorage() {
    const usageEl = $("#storageUsed");
    const quotaEl = $("#storageQuota");
    const persistenceEl = $("#storagePersistence");
    const message = $("#storageMessage");
    const meter = document.querySelector(".storage-meter");
    const fill = $("#storageMeterFill");

    if (!navigator.storage?.estimate) {
      usageEl.textContent = quotaEl.textContent = persistenceEl.textContent = "No disponible";
      message.textContent = "Este entorno no expone la API de estimación. La aplicación seguirá funcionando.";
      return;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const usage = Number(estimate.usage) || 0;
      const quota = Number(estimate.quota) || 0;
      usageEl.textContent = formatBytes(usage);
      quotaEl.textContent = quota ? formatBytes(quota) : "No disponible";
      const percentage = quota > 0 ? Math.min(100, Math.round(usage / quota * 100)) : 0;
      fill.style.width = percentage + "%";
      meter.setAttribute("aria-valuenow", String(percentage));

      let persistent = "No confirmado";
      if (navigator.storage.persisted) {
        persistent = await navigator.storage.persisted() ? "Protegido" : "No persistente";
      }
      persistenceEl.textContent = persistent;
      message.textContent = quota
        ? "Uso aproximado del origen: " + percentage + "%. Incluye otros datos de WebDev Book y cachés del navegador."
        : "El navegador no informó una cuota estimada. No se modificó ni eliminó ningún dato.";
    } catch (error) {
      usageEl.textContent = quotaEl.textContent = persistenceEl.textContent = "No disponible";
      message.textContent = "No se pudo consultar el almacenamiento: " + (error.message || "error desconocido");
    }
  }

  async function requestPersistence() {
    const button = $("#requestPersistence");
    const message = $("#storageMessage");
    if (!navigator.storage?.persist) {
      message.textContent = "Este entorno no ofrece la solicitud de almacenamiento persistente. Tus datos siguen guardándose con las reglas normales del navegador.";
      return;
    }
    button.disabled = true;
    button.textContent = "Consultando…";
    try {
      const granted = await navigator.storage.persist();
      message.textContent = granted
        ? "El navegador concedió almacenamiento persistente. Aun así, exportá una copia de tus proyectos importantes."
        : "El navegador no concedió persistencia. No se borró nada; el almacenamiento continúa sujeto a las reglas normales del dispositivo.";
    } catch (error) {
      message.textContent = "No se pudo solicitar persistencia: " + (error.message || "error desconocido");
    } finally {
      button.disabled = false;
      button.textContent = "Solicitar protección de datos";
      await updateStorage();
    }
  }

  async function loadCatalog() {
    const response = await fetch(CATALOG_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de módulos (HTTP " + response.status + ").");
    const catalog = await response.json();
    if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.modules)) {
      throw new Error("El catálogo de módulos no tiene el formato esperado.");
    }
    const ids = new Set();
    for (const module of catalog.modules) {
      if (!module || typeof module.id !== "string" || !module.id || ids.has(module.id)) {
        throw new Error("El catálogo contiene un identificador vacío o duplicado.");
      }
      ids.add(module.id);
      if (!["core", "foundation", "library", "lab", "media"].includes(module.category)) {
        throw new Error("Categoría no reconocida en el módulo " + module.id + ".");
      }
      if (!["integrated", "planned"].includes(module.status)) {
        throw new Error("Estado no reconocido en el módulo " + module.id + ".");
      }
      if (module.status === "integrated" && module.href) {
        const resolved = new URL(module.href, document.baseURI);
        const appRoot = new URL("../", document.baseURI);
        if (resolved.origin !== appRoot.origin || !resolved.pathname.startsWith(appRoot.pathname)) {
          throw new Error("La ruta local del módulo " + module.id + " no es válida.");
        }
      }
    }
    return catalog;
  }

  async function init() {
    configureFilters();
    $("#refreshStorage")?.addEventListener("click", updateStorage);
    $("#requestPersistence")?.addEventListener("click", requestPersistence);

    try {
      state.db = await openDatabase();
      state.dbAvailable = true;
      $("#catalogStatus").textContent = "Almacenamiento local de módulos listo.";
      state.priorities = new Set(await readPrioritiesFromDatabase());
    } catch (error) {
      console.warn("[WebDev Book] Se usará almacenamiento de respaldo para las preferencias.", error);
      state.priorities = new Set(readPrioritiesFromFallback());
      $("#catalogStatus").textContent = "Catálogo listo; preferencias en modo de respaldo.";
    }

    try {
      state.catalog = await loadCatalog();
      const integrated = state.catalog.modules.filter(module => module.status === "integrated");
      const libraries = state.catalog.modules.filter(module => module.category === "foundation" || module.category === "library").length;
      const planned = state.catalog.modules.filter(module => module.status === "planned").length;
      const articles = state.catalog.modules.reduce((total, module) => total + (Number.isInteger(module.articleCount) ? module.articleCount : 0), 0);

      $("#catalogVersion").textContent = state.catalog.catalogVersion || "—";
      $("#statCore").textContent = state.catalog.modules.some(module => module.category === "core") ? "1" : "0";
      $("#statLibraries").textContent = String(libraries);
      $("#statArticles").textContent = String(articles);
      $("#statPlanned").textContent = String(planned);
      $("#catalogStatus").textContent = integrated.length + " elementos integrados disponibles.";
      renderCatalog();
      await updateStorage();
    } catch (error) {
      $("#catalogStatus").textContent = "No se pudo cargar el catálogo.";
      $("#moduleGrid").replaceChildren(createText("p", "module-empty", error.message || "Error al cargar los módulos."));
      $("#moduleResultCount").textContent = "0 módulos";
    }
  }

  window.WebDevModuleManager = {
    get catalog() { return state.catalog; },
    get priorities() { return Array.from(state.priorities); },
    refreshStorage: updateStorage,
    requestPersistence
  };

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();