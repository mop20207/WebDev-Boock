"use strict";

const CACHE_VERSION = "webdev-book-v8";
const SHELL_CACHE = CACHE_VERSION + "-shell";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";
const APP_BASE = new URL("/WebDev-Boock/", self.location.origin);
const CORE_FILES = [
  "",
  "index.html",
  "offline.html",
  "manifest.json",
  "assets/icons/icon.svg",
  "assets/icons/icon-maskable.svg",
  "pages/html.html",
  "pages/css.html",
  "pages/javascript.html",
  "pages/editor.html",
  "pages/articulo.html",
  "pages/categoria.html",
  "pages/css-articulo.html",
  "pages/css-categoria.html",
  "pages/js-articulo.html",
  "pages/js-categoria.html",
  "pages/tools.html",
  "pages/tools-category.html",
  "pages/tools-article.html",
  "pages/challenges.html",
  "pages/retos/ts-interface-usuario.html",
  "pages/retos/ts-union-estado-pedido.html",
  "pages/retos/ts-generic-primer-elemento.html",
  "pages/retos/ts-generic-restriction.html",
  "pages/retos/js-funcion-saludo.html",
  "pages/retos/js-filtrar-pares.html",
  "pages/retos/js-total-carrito.html",
  "pages/retos/js-agrupar-tareas.html",
  "pages/retos/html-card-perfil.html",
  "pages/retos/html-formulario-contacto.html",
  "pages/retos/css-layout-flex.html",
  "pages/retos/css-grid-dashboard.html",
  "pages/retos/react-saludo-props.html",
  "pages/retos/react-contador-estado.html",
  "pages/retos/react-lista-filtrable.html",
  "pages/retos/react-carrito-reducer.html",
  "pages/retos/wc-saludo-shadow.html",
  "pages/retos/wc-contador-atributos.html",
  "pages/retos/wc-atributos-observados.html",
  "pages/retos/wc-lista-tareas-eventos.html",
  "pages/retos/vue-saludo-props.html",
  "pages/retos/vue-contador-ref.html",
  "pages/retos/vue-lista-computed.html",
  "pages/retos/vue-carrito-computed.html",
  "pages/retos/node-config-entorno.html",
  "pages/retos/node-path-modulos.html",
  "pages/retos/node-event-emitter.html",
  "pages/retos/node-fs-promises.html",
  "pages/retos/astro-primer-componente.html",
  "pages/retos/astro-lista-dinamica.html",
  "pages/retos/astro-layout-slot.html",
  "pages/retos/astro-islands-seguridad.html",
  "pages/retos/sql-consulta-filtro.html",
  "pages/retos/sql-join-ventas.html",
  "pages/retos/sql-agrupacion-having.html",
  "pages/retos/sql-cte-window-jsonb.html",
  "pages/retos/mongo-find-filtro.html",
  "pages/retos/mongo-crud-stock.html",
  "pages/retos/mongo-aggregate-resumen.html",
  "pages/retos/mongo-arrays-proyeccion.html",
  "pages/retos/api-get-json.html",
  "pages/retos/api-post-json.html",
  "pages/retos/api-paginacion.html",
  "pages/retos/api-auth-timeout-error.html",
  "pages/retos/testing-primeras-aserciones.html",
  "pages/retos/testing-casos-borde.html",
  "pages/retos/testing-asincrono.html",
  "pages/retos/testing-mocks-spies.html",
  "pages/retos/dockerfile-node-basico.html",
  "pages/retos/docker-multistage.html",
  "pages/retos/docker-compose-postgres.html",
  "pages/retos/docker-seguridad-produccion.html",
  "css/global.css",
  "css/home.css",
  "css/tools-library.css",
  "css/challenges.css",
  "css/challenge-detail.css",
  "css/pwa.css",
  "assets/images/html-hero.svg",
  "assets/images/css-hero.svg",
  "assets/images/javascript-hero.svg",
  "css/html.css",
  "css/css.css",
  "css/javascript.css",
  "css/editor-app.css",
  "css/articulo.css",
  "css/categoria.css",
  "css/css-articulo.css",
  "css/css-categoria.css",
  "css/js-articulo.css",
  "css/js-categoria.css",
  "js/theme.js",
  "js/navigation.js",
  "js/search.js",
  "js/editor.js",
  "js/app.js",
  "js/learning-progress.js",
  "js/tools-library.js",
  "js/challenges.js",
  "js/articulo.js",
  "js/categoria.js",
  "js/css-articulo.js",
  "js/css-categoria.js",
  "js/js-articulo.js",
  "js/js-categoria.js",
  "js/editor-app.js",
  "js/pwa.js",
  "data/html-articulos.json",
  "data/css-articulos.json",
  "data/js-articulos.json",
  "data/tools.json",
  "data/challenges.json"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const urls = CORE_FILES.map(path => new URL(path, APP_BASE).href);
    // Una página secundaria que falte no debe impedir instalar toda la PWA.
    await Promise.all(urls.map(async url => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok && (response.type === "basic" || response.type === "default")) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn("[WebDev Book] No se pudo precargar:", url);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith("webdev-book-") && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

const isAppRequest = url => url.origin === APP_BASE.origin && url.pathname.startsWith(APP_BASE.pathname);

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") {
      return (await caches.match(new URL("offline.html", APP_BASE).href)) || Response.error();
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  const update = fetch(request).then(response => {
    if (response && response.ok) {
      caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);
  return cached || await update || Response.error();
}

async function externalAsset(request) {
  const cached = await caches.match(request);
  try {
    const response = await fetch(request);
    // También se pueden guardar respuestas opacas de CDN para reutilizarlas sin conexión.
    if (response && (response.ok || response.type === "opaque")) {
      caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
    }
    return response;
  } catch (error) {
    return cached || Response.error();
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== APP_BASE.origin) {
    if (["style", "script", "font", "image"].includes(request.destination)) {
      event.respondWith(externalAsset(request));
    }
    return;
  }
  if (!isAppRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});