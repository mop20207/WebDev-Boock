/* Descarga, verifica y administra laboratorios interactivos.
   Comparte la base de módulos, pero usa claves lab:* para no mezclar bibliotecas. */
(() => {
  "use strict";

  const DB_NAME = "webdev-book-modules";
  const DB_VERSION = 1;
  const FILES = "files";
  const MODULES = "modules";
  const APP_ROOT = new URL("../", document.baseURI);
  const REMOTE_BASE = "https://raw.githubusercontent.com/mop20207/WebDev-Boock/main/";
  const MANIFEST_PATH = "modules/labs/manifest.json";
  const inflight = new Map();
  let dbPromise;
  let manifestPromise;

  const isNative = () => Boolean(window.Capacitor?.isNativePlatform?.());
  const keyFor = id => "lab:" + id;
  const safeId = id => typeof id === "string" && /^[a-z0-9-]+$/.test(id);
  const localUrl = path => new URL(path, APP_ROOT).href;
  const remoteUrl = path => new URL(path, REMOTE_BASE).href;

  function openDatabase() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Este dispositivo no ofrece almacenamiento IndexedDB."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES, { keyPath: "path" });
        if (!db.objectStoreNames.contains(MODULES)) db.createObjectStore(MODULES, { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
        if (!db.objectStoreNames.contains("preferences")) db.createObjectStore("preferences", { keyPath: "id" });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacenamiento local."));
      request.onblocked = () => reject(new Error("Cerrá otras pantallas de WebDev Book y volvé a intentar."));
    });
    return dbPromise;
  }

  function requestValue(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error || new Error("Falló una lectura local."));
    });
  }

  function transactionDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Falló una transacción local."));
      tx.onabort = () => reject(tx.error || new Error("La transacción local fue cancelada."));
    });
  }

  async function readRecord(store, key) {
    const db = await openDatabase();
    const tx = db.transaction(store, "readonly");
    const done = transactionDone(tx);
    const value = await requestValue(tx.objectStore(store).get(key));
    await done;
    return value;
  }

  function hex(buffer) {
    return Array.from(new Uint8Array(buffer), value => value.toString(16).padStart(2, "0")).join("");
  }

  async function sha256(bytes) {
    if (!window.crypto?.subtle) throw new Error("Este dispositivo no permite comprobar integridad SHA-256.");
    return hex(await window.crypto.subtle.digest("SHA-256", bytes));
  }

  async function validateManifest(manifest) {
    if (!manifest || manifest.schemaVersion !== 1 ||
        !/^[a-f0-9]{64}$/i.test(manifest.manifestVersion || "") ||
        !Array.isArray(manifest.packages) || manifest.packages.length !== 5) {
      throw new Error("El manifiesto de laboratorios tiene un formato no reconocido.");
    }
    const ids = new Set();
    const canonical = [];
    for (const entry of manifest.packages) {
      if (!entry || !safeId(entry.id) || ids.has(entry.id)) throw new Error("El manifiesto tiene IDs vacíos o duplicados.");
      ids.add(entry.id);
      if (entry.path !== "modules/labs/packages/" + entry.id + ".json") throw new Error("Ruta no permitida para " + entry.id + ".");
      if (!/^[a-f0-9]{64}$/i.test(entry.sha256 || "") || !/^[a-f0-9]{12}$/i.test(entry.version || "")) {
        throw new Error("La firma del paquete " + entry.id + " no es válida.");
      }
      if (!Number.isInteger(entry.sizeBytes) || entry.sizeBytes < 2 || entry.sizeBytes > 5 * 1024 * 1024 ||
          !Number.isInteger(entry.challengeCount) || entry.challengeCount < 1 ||
          !Number.isInteger(entry.technologyCount) || entry.technologyCount < 1) {
        throw new Error("Los metadatos de " + entry.id + " son inválidos.");
      }
      if (!Array.isArray(entry.runnerTypes) || !entry.runnerTypes.length) throw new Error("Faltan motores de ejecución en " + entry.id + ".");
      canonical.push({
        id: entry.id, path: entry.path, version: entry.version, sha256: entry.sha256,
        sizeBytes: entry.sizeBytes, description: entry.description, challengeCount: entry.challengeCount,
        technologyCount: entry.technologyCount, runnerTypes: entry.runnerTypes
      });
    }
    const expected = await sha256(new TextEncoder().encode(JSON.stringify(canonical)));
    if (expected !== manifest.manifestVersion) throw new Error("La huella global del manifiesto no coincide.");
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
          await validateManifest(manifest);
          return manifest;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("No se pudo consultar el manifiesto de laboratorios.");
    })().catch(error => {
      manifestPromise = null;
      throw error;
    });
    return manifestPromise;
  }

  function validatePackage(pack, entry) {
    if (!pack || pack.schemaVersion !== 1 || pack.id !== entry.id ||
        !Array.isArray(pack.challenges) || !Array.isArray(pack.technologies)) {
      throw new Error("El paquete no corresponde al laboratorio " + entry.id + ".");
    }
    if (pack.challenges.length !== entry.challengeCount || pack.technologies.length !== entry.technologyCount) {
      throw new Error("La cantidad de ejercicios o tecnologías de " + entry.title + " no coincide con el manifiesto.");
    }
    const ids = new Set();
    const allowedRunners = new Set([
      "react", "vue", "webcomponents", "node-sim", "astro-static", "postgres",
      "mongo-sim", "api-sim", "testing-sim", "docker-static", "terminal-sim", "game-logic"
    ]);
    for (const challenge of pack.challenges) {
      const hasTests = Array.isArray(challenge?.tests) && challenge.tests.length > 0;
      const hasTerminalChecks = challenge?.runner === "terminal-sim" &&
        Array.isArray(challenge.terminalChecks) && challenge.terminalChecks.length > 0;
      if (!challenge || typeof challenge.id !== "string" || ids.has(challenge.id) ||
          !challenge.title || !challenge.statement || (!hasTests && !hasTerminalChecks) ||
          !Array.isArray(challenge.hints) || !challenge.hints.length || !challenge.solutionCode) {
        throw new Error("El laboratorio contiene un ejercicio incompleto o duplicado.");
      }
      ids.add(challenge.id);
      if (challenge.runner && !allowedRunners.has(challenge.runner)) {
        throw new Error("El ejercicio " + challenge.id + " utiliza un motor no permitido.");
      }
    }
    const runners = [...new Set(pack.challenges.map(challenge => challenge.runner || "standard"))].sort();
    if (JSON.stringify(runners) !== JSON.stringify(entry.runnerTypes)) {
      throw new Error("Los motores del paquete " + entry.title + " no coinciden con el manifiesto.");
    }
    if (entry.id === "lab-terminal" && pack.challenges.some(challenge => challenge.runner !== "terminal-sim")) {
      throw new Error("El laboratorio de terminal contiene un ejercicio con motor no permitido.");
    }
    if (entry.id === "lab-games" && pack.challenges.some(challenge => challenge.runner !== "game-logic")) {
      throw new Error("El laboratorio de videojuegos contiene un ejercicio con motor no permitido.");
    }
    return pack;
  }

  async function downloadBytes(url, entry, onProgress) {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("No se pudo descargar " + entry.title + " (HTTP " + response.status + ").");
    let bytes;
    if (!response.body?.getReader) {
      bytes = new Uint8Array(await response.arrayBuffer());
      onProgress?.({ loaded: bytes.length, total: entry.sizeBytes, percent: 100 });
    } else {
      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          loaded += value.byteLength;
          if (loaded > entry.sizeBytes) {
            await reader.cancel();
            throw new Error("La descarga superó el tamaño previsto para " + entry.title + ".");
          }
          chunks.push(value);
          onProgress?.({
            loaded, total: entry.sizeBytes,
            percent: Math.min(99, Math.floor(loaded / entry.sizeBytes * 100))
          });
        }
      } catch (error) {
        try { await reader.cancel(); } catch {}
        throw error;
      }
      bytes = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      onProgress?.({ loaded, total: entry.sizeBytes, percent: 100 });
    }
    if (bytes.byteLength !== entry.sizeBytes) throw new Error("El tamaño descargado de " + entry.title + " no coincide.");
    if (await sha256(bytes) !== entry.sha256) throw new Error("La verificación SHA-256 falló para " + entry.title + ".");
    return bytes;
  }

  async function persistPackage(entry, content, installedAt) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FILES, MODULES], "readwrite");
      tx.objectStore(FILES).put({
        path: keyFor(entry.id), content, sha256: entry.sha256,
        version: entry.version, updatedAt: new Date().toISOString()
      });
      tx.objectStore(MODULES).put({
        id: entry.id, kind: "lab", title: entry.title,
        version: entry.version, sha256: entry.sha256,
        sizeBytes: entry.sizeBytes, challengeCount: entry.challengeCount,
        technologyCount: entry.technologyCount,
        installedAt: installedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("No se pudo guardar el laboratorio."));
      tx.onabort = () => reject(tx.error?.name === "QuotaExceededError"
        ? new Error("No hay espacio suficiente. Se conservó la versión anterior del laboratorio.")
        : tx.error || new Error("Se canceló la instalación; se conservó la versión anterior."));
    });
  }

  async function downloadLab(id, options = {}) {
    if (!safeId(id)) throw new Error("El ID del laboratorio no es válido.");
    if (inflight.has(id)) return inflight.get(id);
    const task = (async () => {
      const manifest = await loadManifest();
      const entry = manifest.packages.find(item => item.id === id);
      if (!entry) throw new Error("No existe el laboratorio " + id + ".");
      const old = await readRecord(MODULES, id).catch(() => null);
      const url = isNative() ? remoteUrl(entry.path) : localUrl(entry.path);
      const bytes = await downloadBytes(url, entry, options.onProgress);
      let pack;
      try { pack = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
      catch { throw new Error("El paquete de " + entry.title + " no contiene JSON válido."); }
      validatePackage(pack, entry);
      await persistPackage(entry, JSON.stringify(pack, null, 2) + "\n", old?.installedAt);
      window.dispatchEvent(new CustomEvent("webdev:labs-changed", { detail: { id, status: "installed" } }));
      return pack;
    })().finally(() => inflight.delete(id));
    inflight.set(id, task);
    return task;
  }

  async function getPackageStatus(id) {
    const manifest = await loadManifest();
    const entry = manifest.packages.find(item => item.id === id);
    if (!entry) return { id, state: "unavailable", entry: null, installed: null };
    const installed = await readRecord(MODULES, id).catch(() => null);
    const file = await readRecord(FILES, keyFor(id)).catch(() => null);
    if (!installed || !file || typeof file.content !== "string") return { id, state: "missing", entry, installed: null };
    const state = installed.sha256 === entry.sha256 && file.sha256 === entry.sha256 ? "installed" : "update";
    return { id, state, entry, installed };
  }

  async function getLab(id) {
    if (!safeId(id)) throw new Error("El ID del laboratorio no es válido.");
    const [record, installed] = await Promise.all([
      readRecord(FILES, keyFor(id)).catch(() => null),
      readRecord(MODULES, id).catch(() => null)
    ]);
    let cached = null;
    if (record && installed && typeof record.content === "string") {
      try {
        const localHash = await sha256(new TextEncoder().encode(record.content));
        if (localHash === record.sha256 && localHash === installed.sha256) {
          const parsed = JSON.parse(record.content);
          cached = {
            schemaVersion: 1, id, title: installed.title,
            challengeCount: installed.challengeCount,
            technologyCount: installed.technologyCount,
            runnerTypes: [...new Set(parsed.challenges.map(challenge => challenge.runner || "standard"))].sort(),
            ...parsed
          };
        }
      } catch (error) {
        console.warn("[WebDev Book] La copia local de " + id + " no se pudo validar.", error);
      }
    }

    let manifest;
    try { manifest = await loadManifest(); }
    catch (error) {
      if (cached) return cached;
      throw error;
    }
    const entry = manifest.packages.find(item => item.id === id);
    if (!entry) throw new Error("No existe el laboratorio " + id + ".");
    if (cached && installed.sha256 === entry.sha256 && record.sha256 === entry.sha256) {
      return validatePackage(cached, entry);
    }
    try {
      return await downloadLab(id);
    } catch (error) {
      if (cached) {
        console.warn("[WebDev Book] Se usará la copia instalada de " + id + ".", error);
        return cached;
      }
      throw error;
    }
  }

  async function removeLab(id) {
    if (!safeId(id)) throw new Error("El ID del laboratorio no es válido.");
    const manifest = await loadManifest();
    if (!manifest.packages.some(item => item.id === id)) throw new Error("No se puede quitar un laboratorio desconocido.");
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([FILES, MODULES], "readwrite");
      tx.objectStore(FILES).delete(keyFor(id));
      tx.objectStore(MODULES).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("No se pudo quitar el laboratorio."));
      tx.onabort = () => reject(tx.error || new Error("Se canceló la eliminación."));
    });
    window.dispatchEvent(new CustomEvent("webdev:labs-changed", { detail: { id, status: "missing" } }));
  }

  async function listInstalled() {
    const db = await openDatabase();
    const tx = db.transaction(MODULES, "readonly");
    const done = transactionDone(tx);
    const records = await requestValue(tx.objectStore(MODULES).getAll());
    await done;
    return records.filter(record => record?.kind === "lab");
  }

  window.WebDevLabs = Object.freeze({
    getManifest: loadManifest,
    getPackageStatus,
    downloadLab,
    getLab,
    removeLab,
    listInstalled
  });
})();