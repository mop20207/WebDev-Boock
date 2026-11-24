/* Descarga, verificación y administración de bibliotecas independientes.
   Usa la base local creada por el Centro de módulos y nunca toca proyectos ni progreso. */
(() => {
  "use strict";

  const DB_NAME = "webdev-book-modules";
  const DB_VERSION = 1;
  const FILES_STORE = "files";
  const MODULES_STORE = "modules";
  const APP_ROOT = new URL("../", document.baseURI);
  const REMOTE_BASE = "https://raw.githubusercontent.com/mop20207/WebDev-Boock/main/";
  const MANIFEST_PATH = "modules/libraries/manifest.json";
  const ECOSYSTEM_PATH = "modules/libraries/ecosystem.json";
  const inflight = new Map();
  let dbPromise;
  let manifestPromise;
  let ecosystemPromise;

  const isNative = () => Boolean(window.Capacitor?.isNativePlatform?.());
  const packageKey = id => "library:" + id;
  const safeId = id => typeof id === "string" && /^[a-z0-9-]+$/.test(id);

  function localUrl(path) {
    return new URL(path, APP_ROOT).href;
  }

  function remoteUrl(path) {
    return new URL(path, REMOTE_BASE).href;
  }

  function openDatabase() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Este entorno no dispone de almacenamiento IndexedDB."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FILES_STORE)) db.createObjectStore(FILES_STORE, { keyPath: "path" });
        if (!db.objectStoreNames.contains(MODULES_STORE)) db.createObjectStore(MODULES_STORE, { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
        if (!db.objectStoreNames.contains("preferences")) db.createObjectStore("preferences", { keyPath: "id" });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacenamiento de bibliotecas."));
      request.onblocked = () => reject(new Error("Cerrá otras pantallas de WebDev Book y volvé a intentar."));
    });
    return dbPromise;
  }

  function requestValue(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error || new Error("Falló una lectura del almacenamiento local."));
    });
  }

  function transactionComplete(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Falló una transacción local."));
      tx.onabort = () => reject(tx.error || new Error("La transacción local se canceló."));
    });
  }

  async function readRecord(storeName, key) {
    const db = await openDatabase();
    const tx = db.transaction(storeName, "readonly");
    const done = transactionComplete(tx);
    const record = await requestValue(tx.objectStore(storeName).get(key));
    await done;
    return record;
  }

  async function loadManifest() {
    if (manifestPromise) return manifestPromise;
    manifestPromise = (async () => {
      const urls = isNative()
        ? [remoteUrl(MANIFEST_PATH), localUrl(MANIFEST_PATH)]
        : [localUrl(MANIFEST_PATH)];
      let lastError;
      for (const url of urls) {
        try {
          const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error("HTTP " + response.status + " al consultar el manifiesto.");
          const manifest = await response.json();
          validateManifest(manifest);
          return manifest;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("No se pudo consultar el manifiesto de bibliotecas.");
    })().catch(error => {
      manifestPromise = null;
      throw error;
    });
    return manifestPromise;
  }

  function validateManifest(manifest) {
    if (!manifest || manifest.schemaVersion !== 1 ||
        !/^[a-f0-9]{64}$/i.test(manifest.manifestVersion || "") ||
        !Array.isArray(manifest.packages)) {
      throw new Error("El manifiesto de bibliotecas tiene un formato no reconocido.");
    }
    const ids = new Set();
    for (const entry of manifest.packages) {
      if (!entry || !safeId(entry.id) || ids.has(entry.id)) {
        throw new Error("El manifiesto contiene un ID vacío o duplicado.");
      }
      ids.add(entry.id);
      if (entry.path !== "modules/libraries/packages/" + entry.id + ".json") {
        throw new Error("La ruta del paquete " + entry.id + " no está permitida.");
      }
      if (!/^[a-f0-9]{64}$/i.test(entry.sha256 || "")) {
        throw new Error("El hash SHA-256 de " + entry.id + " no es válido.");
      }
      if (!/^[a-f0-9]{12}$/i.test(entry.version || "") ||
          !Number.isInteger(entry.sizeBytes) || entry.sizeBytes <= 0 || entry.sizeBytes > 10 * 1024 * 1024 ||
          !Number.isInteger(entry.articleCount) || entry.articleCount < 1) {
        throw new Error("Los metadatos de " + entry.id + " están incompletos.");
      }
    }
  }

  async function loadEcosystem() {
    if (ecosystemPromise) return ecosystemPromise;
    ecosystemPromise = (async () => {
      const url = localUrl(ECOSYSTEM_PATH);
      const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("No se pudo cargar el índice de tecnologías (HTTP " + response.status + ").");
      const ecosystem = await response.json();
      if (!ecosystem || ecosystem.schemaVersion !== 1 || !Array.isArray(ecosystem.tools)) {
        throw new Error("El índice de tecnologías tiene un formato inválido.");
      }
      return ecosystem;
    })().catch(error => {
      ecosystemPromise = null;
      throw error;
    });
    return ecosystemPromise;
  }

  function validatePackage(tool, entry) {
    if (!tool || tool.id !== entry.id || !Array.isArray(tool.categories) || !Array.isArray(tool.articles)) {
      throw new Error("El paquete descargado no corresponde a " + entry.id + ".");
    }
    if (tool.articles.length !== entry.articleCount) {
      throw new Error("La cantidad de artículos de " + entry.id + " no coincide con el manifiesto.");
    }
    const articleIds = new Set();
    const categories = new Map(tool.categories.map(category => [category.id, category]));
    for (const article of tool.articles) {
      if (!article || typeof article.id !== "string" || articleIds.has(article.id) || !categories.has(article.category)) {
        throw new Error("El paquete " + entry.id + " contiene un artículo duplicado o una categoría inválida.");
      }
      articleIds.add(article.id);
    }
    for (const category of tool.categories) {
      if (!Array.isArray(category.articles)) {
        throw new Error("La categoría " + category.id + " no tiene una lista de artículos válida.");
      }
      for (const articleId of category.articles) {
        if (!articleIds.has(articleId)) {
          throw new Error("La categoría " + category.id + " apunta a un artículo inexistente.");
        }
      }
    }
    return tool;
  }

  function hex(buffer) {
    return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  async function sha256(bytes) {
    if (!window.crypto?.subtle) {
      throw new Error("Este dispositivo no permite verificar la integridad SHA-256 de las descargas.");
    }
    return hex(await window.crypto.subtle.digest("SHA-256", bytes));
  }

  async function readResponse(response, expectedBytes, onProgress) {
    if (!response.body?.getReader) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      onProgress?.({ loaded: bytes.byteLength, total: expectedBytes, percent: 100 });
      return bytes;
    }
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.byteLength;
        const percent = expectedBytes > 0 ? Math.min(99, Math.floor(total / expectedBytes * 100)) : 0;
        onProgress?.({ loaded: total, total: expectedBytes, percent });
      }
    } catch (error) {
      try { await reader.cancel(); } catch {}
      throw error;
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    onProgress?.({ loaded: total, total: expectedBytes, percent: 100 });
    return bytes;
  }

  function emitChange(id, status) {
    window.dispatchEvent(new CustomEvent("webdev:libraries-changed", { detail: { id, status } }));
  }

  async function persistPackage(entry, content, installedAt) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FILES_STORE, MODULES_STORE], "readwrite");
      tx.objectStore(FILES_STORE).put({
        path: packageKey(entry.id),
        content,
        sha256: entry.sha256,
        version: entry.version,
        updatedAt: new Date().toISOString()
      });
      tx.objectStore(MODULES_STORE).put({
        id: entry.id,
        kind: "library",
        title: entry.title,
        version: entry.version,
        sha256: entry.sha256,
        sizeBytes: entry.sizeBytes,
        articleCount: entry.articleCount,
        installedAt: installedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("No se pudo guardar el paquete."));
      tx.onabort = () => {
        const error = tx.error;
        reject(error?.name === "QuotaExceededError"
          ? new Error("No hay espacio suficiente para guardar esta biblioteca. Liberá espacio o quitá otro paquete.")
          : error || new Error("La instalación se canceló; se conserva la versión anterior."));
      };
    });
  }

  async function downloadLibrary(id, options = {}) {
    if (!safeId(id)) throw new Error("La tecnología solicitada no es válida.");
    if (inflight.has(id)) return inflight.get(id);
    const task = (async () => {
      const manifest = await loadManifest();
      const entry = manifest.packages.find(item => item.id === id);
      if (!entry) throw new Error("No existe un paquete descargable para " + id + ".");

      const oldModule = await readRecord(MODULES_STORE, id).catch(() => null);
      const url = isNative() ? remoteUrl(entry.path) : localUrl(entry.path);
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("No se pudo descargar " + entry.title + " (HTTP " + response.status + ").");

      const bytes = await readResponse(response, entry.sizeBytes, options.onProgress);
      if (bytes.byteLength !== entry.sizeBytes) {
        throw new Error("El tamaño descargado de " + entry.title + " no coincide con el manifiesto.");
      }
      const actualHash = await sha256(bytes);
      if (actualHash !== entry.sha256) {
        throw new Error("La verificación SHA-256 falló para " + entry.title + ". No se instaló el archivo.");
      }

      const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      let tool;
      try { tool = JSON.parse(content); }
      catch { throw new Error("El paquete " + entry.title + " no contiene JSON válido."); }
      validatePackage(tool, entry);

      try {
        await persistPackage(entry, content, oldModule?.installedAt);
      } catch (error) {
        if (error?.name === "QuotaExceededError") {
          throw new Error("El dispositivo no tiene espacio suficiente. No se modificó la biblioteca que ya tenías.");
        }
        throw error;
      }
      emitChange(id, "installed");
      return tool;
    })().finally(() => inflight.delete(id));
    inflight.set(id, task);
    return task;
  }

  async function getPackageStatus(id) {
    const manifest = await loadManifest();
    const entry = manifest.packages.find(item => item.id === id);
    if (!entry) return { id, state: "unavailable", entry: null, installed: null };
    const installed = await readRecord(MODULES_STORE, id).catch(() => null);
    const file = await readRecord(FILES_STORE, packageKey(id)).catch(() => null);
    if (!installed || !file || typeof file.content !== "string") {
      return { id, state: "missing", entry, installed: null };
    }
    const state = installed.sha256 === entry.sha256 && file.sha256 === entry.sha256 ? "installed" : "update";
    return { id, state, entry, installed };
  }

  async function getLibrary(id) {
    const manifest = await loadManifest();
    const entry = manifest.packages.find(item => item.id === id);
    if (!entry) throw new Error("No existe la biblioteca " + id + ".");
    const record = await readRecord(FILES_STORE, packageKey(id)).catch(() => null);
    const installed = await readRecord(MODULES_STORE, id).catch(() => null);
    if (record && installed && typeof record.content === "string") {
      try {
        const cached = validatePackage(JSON.parse(record.content), {
          ...entry,
          articleCount: installed.articleCount || entry.articleCount
        });
        if (installed.sha256 === entry.sha256 && record.sha256 === entry.sha256) return cached;
        try { return await downloadLibrary(id); }
        catch (error) {
          console.warn("[WebDev Book] La actualización de " + id + " no pudo descargarse; se usará la copia instalada.", error);
          return cached;
        }
      } catch (error) {
        console.warn("[WebDev Book] La copia local de " + id + " no superó la validación; se intentará descargar otra vez.", error);
      }
    }
    return downloadLibrary(id);
  }

  async function removeLibrary(id) {
    if (!safeId(id)) throw new Error("La tecnología solicitada no es válida.");
    const manifest = await loadManifest();
    if (!manifest.packages.some(item => item.id === id)) throw new Error("No se puede quitar un paquete desconocido.");
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([FILES_STORE, MODULES_STORE], "readwrite");
      tx.objectStore(FILES_STORE).delete(packageKey(id));
      tx.objectStore(MODULES_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("No se pudo quitar la biblioteca."));
      tx.onabort = () => reject(tx.error || new Error("La eliminación se canceló."));
    });
    emitChange(id, "missing");
  }

  async function listInstalled() {
    const db = await openDatabase();
    const tx = db.transaction(MODULES_STORE, "readonly");
    const done = transactionComplete(tx);
    const records = await requestValue(tx.objectStore(MODULES_STORE).getAll());
    await done;
    return records.filter(record => record?.kind === "library");
  }

  window.WebDevLibraries = Object.freeze({
    getManifest: loadManifest,
    getEcosystem: loadEcosystem,
    getPackageStatus,
    downloadLibrary,
    getLibrary,
    removeLibrary,
    listInstalled
  });
})();