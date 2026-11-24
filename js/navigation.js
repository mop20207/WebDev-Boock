/* Navegación responsiva y sistema visual de marcas de WebDev Book. */
(() => {
  "use strict";

  // En Android, el interceptor permite leer desde IndexedDB los JSON que ya
  // se actualizaron. El resto de las peticiones conserva fetch sin cambios.
  if (window.Capacitor?.isNativePlatform?.() && typeof window.fetch === "function") {
    const originalFetch = window.fetch.bind(window);
    window.__webdevNativeFetch = originalFetch;
    let resolveUpdater;
    const updaterReady = new Promise(resolve => { resolveUpdater = resolve; });
    const loader = document.createElement("script");
    const currentScript = document.currentScript;
    loader.src = new URL("content-updates.js", currentScript?.src || document.baseURI).href;
    loader.onload = () => resolveUpdater(true);
    loader.onerror = () => resolveUpdater(false);
    document.head.appendChild(loader);

    window.fetch = function (input, init) {
      let contentPath = "";
      try {
        const source = typeof input === "string" || input instanceof URL ? input : input.url;
        const url = new URL(source, document.baseURI);
        const marker = url.pathname.lastIndexOf("/data/");
        if (marker >= 0) contentPath = decodeURIComponent(url.pathname.slice(marker + 1));
      } catch {
        return originalFetch(input, init);
      }

      const isContentJson = contentPath.startsWith("data/") &&
        contentPath.endsWith(".json") &&
        !contentPath.split("/").some(part => !part || part === "." || part === "..");
      if (!isContentJson) return originalFetch(input, init);

      return updaterReady.then(loaded => {
        const updater = window.WebDevContentUpdates;
        if (loaded && updater?.fetchData) {
          return updater.fetchData(contentPath, input, init, originalFetch);
        }
        return originalFetch(input, init);
      }).catch(() => originalFetch(input, init));
    };
  }

  const toolMeta = {
    terminal: { label: "Terminal Linux", accent: "#71C9A8", language: "SHELL", snippet: "$ pwd\n$ ls -la" },
    git: { label: "Git y GitHub", accent: "#F05032", language: "GIT", snippet: "$ git status\n$ git add ." },
    npm: { label: "NPM", accent: "#CB3837", language: "NPM", snippet: "$ npm install vite\n$ npm run dev" },
    react: { label: "React", accent: "#61DAFB", language: "JSX", snippet: "function App() {\n  return <h1>Hola</h1>;\n}" },
    webcomponents: { label: "Web Components", accent: "#E49B58", language: "JAVASCRIPT", snippet: "customElements.define(\n  \"saludo-box\", SaludoBox\n);" },
    vuejs: { label: "Vue.js", accent: "#41B883", language: "VUE", snippet: "<script setup>\nconst count = ref(0)\n</script>" },
    nodejs: { label: "Node.js", accent: "#539E43", language: "JAVASCRIPT", snippet: "createServer((req, res) => {\n  res.end(\"Hola\");\n});" },
    astro: { label: "Astro", accent: "#FF5D01", language: "ASTRO", snippet: "---\nconst title = \"Mi sitio\";\n---\n<h1>{title}</h1>" },
    phaser: { label: "Phaser", accent: "#8B5CF6", language: "JAVASCRIPT", snippet: "this.add.text(120, 80, \"¡Hola!\", {\n  fontSize: \"24px\"\n});" },
    typescript: { label: "TypeScript", accent: "#3178C6", language: "TYPESCRIPT", snippet: "type Usuario = {\n  id: number;\n  nombre: string;\n};" },
    nextjs: { label: "Next.js", accent: "#111827", language: "TSX", snippet: "export default function Page() {\n  return <main>Inicio</main>;\n}" },
    express: { label: "Express.js", accent: "#777777", language: "JAVASCRIPT", snippet: "app.get(\"/api\", (req, res) => {\n  res.json({ ok: true });\n});" },
    "sql-postgres": { label: "SQL y PostgreSQL", accent: "#4169E1", language: "SQL", snippet: "SELECT nombre, email\nFROM usuarios\nWHERE activo = true;" },
    mongodb: { label: "MongoDB", accent: "#47A248", language: "MONGOSH", snippet: "db.usuarios.find({ activo: true })\n  .sort({ nombre: 1 });" },
    apis: { label: "APIs y comunicación web", accent: "#E7A52D", language: "JAVASCRIPT", snippet: "const response = await fetch(\"/api/users\");\nconst data = await response.json();" },
    testing: { label: "Testing", accent: "#22A179", language: "TEST", snippet: "expect(sumar(2, 3)).toBe(5);\nexpect(sumar(1, 1)).toBe(2);" },
    "docker-deploy": { label: "Docker y despliegue", accent: "#2496ED", language: "DOCKERFILE", snippet: "FROM node:22-alpine\nWORKDIR /app\nCOPY . ." }
  };

  const brandIcons = {
    react: '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#61DAFB" stroke-width="5"><ellipse cx="50" cy="50" rx="43" ry="16"/><ellipse cx="50" cy="50" rx="43" ry="16" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="43" ry="16" transform="rotate(120 50 50)"/></g><circle cx="50" cy="50" r="6" fill="#61DAFB"/></svg>',
    vuejs: '<svg viewBox="0 0 256 221" aria-hidden="true"><path fill="#41B883" d="M204.8 0H256L128 220.8 0 0h97.92L128 51.2 157.44 0z"/><path fill="#41B883" d="m0 0 128 220.8L256 0h-51.2L128 132.48 50.56 0z"/><path fill="#35495E" d="M50.56 0 128 133.12 204.8 0h-47.36L128 51.2 97.92 0z"/></svg>',
    git: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#F05032" d="M22 3.8a3 3 0 0 1 4.2 0l18 18a3 3 0 0 1 0 4.2l-18 18a3 3 0 0 1-4.2 0l-18-18a3 3 0 0 1 0-4.2z"/><path d="M16 15v18m0-9h12v9" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="16" cy="15" r="3" fill="#fff"/><circle cx="16" cy="33" r="3" fill="#fff"/><circle cx="28" cy="33" r="3" fill="#fff"/></svg>',
    terminal: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="5" width="42" height="38" rx="9" fill="#173A31"/><path d="m12 17 8 7-8 7M25 31h11" fill="none" stroke="#71C9A8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    npm: '<svg viewBox="0 0 64 48" aria-hidden="true"><path fill="#CB3837" d="M2 5h60v38H2z"/><path fill="#fff" d="M10 13h44v23H38V20H26v16H10zm9 7v9h3v-9zm24 0v9h3v-9z"/></svg>',
    webcomponents: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3 43 13.5v21L24 45 5 34.5v-21z" fill="none" stroke="#E49B58" stroke-width="3"/><path d="m18 17-7 7 7 7m12-14 7 7-7 7" fill="none" stroke="#E49B58" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    nodejs: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 3 18 10v22L24 45 6 35V13z" fill="#539E43"/><text x="24" y="28" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">JS</text></svg>',
    astro: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2 29 17 46 13 33 24 44 37 28 31 24 47 19 31 3 37 15 24 2 13 19 17z" fill="#FF5D01"/><circle cx="24" cy="24" r="5" fill="#fff"/></svg>',
    phaser: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 18h28a7 7 0 0 1 6.4 9.8l-3 7a5 5 0 0 1-8.3 1.4l-5-5.2h-8.2l-5 5.2a5 5 0 0 1-8.3-1.4l-3-7A7 7 0 0 1 10 18Z" fill="#8B5CF6"/><path d="M15 24v8m-4-4h8m13-3h.1m5 6h.1" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    typescript: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="7" fill="#3178C6"/><text x="24" y="31" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">TS</text></svg>',
    nextjs: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="#111827"/><path d="M14 34V14l20 21V14" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    express: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="8" fill="#6B7280"/><text x="24" y="30" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">Ex</text></svg>',
    "sql-postgres": '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="10" rx="16" ry="6" fill="#4169E1"/><path d="M8 10v25c0 4 7 7 16 7s16-3 16-7V10" fill="#4169E1"/><path d="M8 21c0 4 7 7 16 7s16-3 16-7M8 31c0 4 7 7 16 7s16-3 16-7" fill="none" stroke="#DCE6FF" stroke-width="2"/></svg>',
    mongodb: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M25 3c-9 10-15 18-12 28 2 7 8 11 12 14 4-5 10-10 11-18C37 17 31 9 25 3Z" fill="#47A248"/><path d="M25 13v31" stroke="#DFF5D8" stroke-width="2" stroke-linecap="round"/></svg>',
    apis: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#E7A52D" stroke-width="3"><path d="M12 13 35 24 12 36"/></g><g fill="#E7A52D"><circle cx="11" cy="12" r="6"/><circle cx="36" cy="24" r="6"/><circle cx="11" cy="36" r="6"/></g></svg>',
    testing: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#22A179"/><path d="m13 24 7 7 15-16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "docker-deploy": '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="#2496ED"><rect x="7" y="20" width="8" height="7" rx="1"/><rect x="17" y="20" width="8" height="7" rx="1"/><rect x="27" y="20" width="8" height="7" rx="1"/><rect x="17" y="11" width="8" height="7" rx="1"/><rect x="27" y="11" width="8" height="7" rx="1"/><path d="M5 29h39c-2 9-9 13-20 13C13 42 7 37 5 29Z"/></g><path d="M4 25c-3 6 0 9 4 10" fill="none" stroke="#2496ED" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  const labels = {
    home: "Inicio", html: "HTML", css: "CSS", javascript: "JavaScript", editor: "Editor",
    terminal: "Terminal Linux", git: "Git y GitHub", npm: "NPM", react: "React",
    webcomponents: "Web Components", vuejs: "Vue.js", nodejs: "Node.js", astro: "Astro",
    phaser: "Phaser", typescript: "TypeScript", nextjs: "Next.js", express: "Express.js",
    "sql-postgres": "SQL y PostgreSQL", mongodb: "MongoDB", apis: "APIs y comunicación web",
    testing: "Testing", "docker-deploy": "Docker y despliegue", challenges: "Retos interactivos",
    projects: "Biblioteca de proyectos", exercises: "Ejercicios", favorites: "Favoritos",
    resources: "Recursos", progress: "Mi progreso", tools: "Biblioteca de tecnologías"
  };
  const accents = {
    home: "#8EA8FF", html: "#F07845", css: "#3988E8", javascript: "#D9B735", editor: "#8B7CF6",
    challenges: "#8B70F4", projects: "#E6A34A", modules: "#8EA8FF", exercises: "#4C9BDE", favorites: "#D6A43B",
    resources: "#7D9FE8", progress: "#37A98B", tools: "#8EA8FF"
  };
  Object.keys(toolMeta).forEach(key => { accents[key] = toolMeta[key].accent; });

  const glyphs = {
    home: "⌂", html: "5", css: "✳", javascript: "JS", editor: "</>",
    challenges: "⌁", projects: "▦", modules: "⬡", exercises: "✎", favorites: "☆",
    resources: "▣", progress: "◴", tools: "▦"
  };

  function routeFromLink(link) {
    const url = new URL(link.getAttribute("href") || "", document.baseURI);
    const tool = url.searchParams.get("tool");
    if (tool) return tool;
    const hash = url.hash.replace("#", "");
    if (hash === "ejercicios") return "exercises";
    if (hash === "proyectos") return "projects";
    if (hash === "favoritos") return "favorites";
    if (hash === "quick-access") return "resources";
    if (hash === "learning-progress") return "progress";
    const file = url.pathname.split("/").pop().toLowerCase();
    const files = {
      "index.html": "home", "html.html": "html", "css.html": "css",
      "javascript.html": "javascript", "editor.html": "editor",
      "challenges.html": "challenges", "projects.html": "projects",
      "modules.html": "modules", "tools.html": "tools"
    };
    return files[file] || "other";
  }

  function ensureModuleCenterLink(nav) {
    if (nav.querySelector("[data-module-center-link]")) return;
    const link = document.createElement("a");
    link.className = "nav-link";
    link.dataset.moduleCenterLink = "true";
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink?.href) {
      const appRoot = new URL("./", manifestLink.href);
      link.href = new URL("pages/modules.html", appRoot).href;
    } else {
      link.href = "pages/modules.html";
    }
    link.textContent = "Centro de módulos";
    const insertionPoint = nav.querySelector("[data-challenges-link]");
    if (insertionPoint) nav.insertBefore(link, insertionPoint);
    else nav.append(link);
  }

  function normalizeNavLink(link) {
    if (!link || !link.classList || !link.classList.contains("nav-link")) return;
    const key = routeFromLink(link);
    const previousLabel = Array.from(link.childNodes)
      .filter(node => !(node.nodeType === 1 && node.classList.contains("nav-icon")))
      .map(node => node.textContent || "")
      .join(" ").replace(/\s+/g, " ").trim();
    const label = labels[key] || previousLabel || "Abrir sección";
    const icon = document.createElement("span");
    icon.className = "nav-icon";
    icon.setAttribute("aria-hidden", "true");
    if (brandIcons[key]) icon.innerHTML = brandIcons[key];
    else icon.textContent = glyphs[key] || "›";
    const caption = document.createElement("span");
    caption.className = "nav-label";
    caption.textContent = label;
    link.replaceChildren(icon, caption);
    link.dataset.navKey = key;
    link.style.setProperty("--nav-accent", accents[key] || "#8EA8FF");
    if (toolMeta[key]) link.dataset.toolLink = key;
    link.addEventListener("click", closeMenu);
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    const menu = document.getElementById("mobileMenu");
    if (menu) menu.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const menu = document.getElementById("mobileMenu");
    const backdrop = document.getElementById("sidebarBackdrop");
    const mainNav = document.querySelector(".main-nav");

    if (mainNav) {
      ensureModuleCenterLink(mainNav);
      mainNav.querySelectorAll(".nav-link").forEach(normalizeNavLink);
      const observer = new MutationObserver(records => {
        records.forEach(record => record.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(".nav-link")) normalizeNavLink(node);
          node.querySelectorAll && node.querySelectorAll(".nav-link").forEach(normalizeNavLink);
        }));
      });
      observer.observe(mainNav, { childList: true });
    }

    menu?.setAttribute("aria-expanded", "false");
    menu?.addEventListener("click", () => {
      const open = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", open);
      menu.setAttribute("aria-expanded", String(open));
    });
    backdrop?.addEventListener("click", closeMenu);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    const page = document.body.dataset.page || "";
    const toolId = new URLSearchParams(window.location.search).get("tool");
    document.querySelectorAll(".nav-link").forEach(link => {
      const key = link.dataset.navKey || routeFromLink(link);
      const active = (page === "home" && key === "home") ||
        (page === "projects" && key === "projects") ||
        ((page === "challenges" || page === "challenge-detail") && key === "challenges") ||
        (["html", "css", "javascript", "editor"].includes(page) && key === page) ||
        (page === "modules" && key === "modules") ||
        (toolId && key === toolId);
      if (active) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });

    // Las miniaturas y muestras de código se agregan sin modificar el contenido ni los enlaces.
    document.querySelectorAll(".tools-home-card[data-tool]").forEach(card => {
      const key = card.dataset.tool;
      const meta = toolMeta[key];
      if (!meta || card.dataset.designEnhanced === "true") return;
      card.dataset.designEnhanced = "true";
      card.style.setProperty("--tool-accent", meta.accent);
      const icon = card.querySelector(".tools-home-icon");
      if (icon) {
        icon.innerHTML = brandIcons[key] || "";
        icon.setAttribute("aria-hidden", "true");
        icon.title = meta.label;
      }
      const preview = document.createElement("div");
      preview.className = "tools-home-preview";
      const previewLabel = document.createElement("span");
      previewLabel.className = "tools-preview-label";
      previewLabel.textContent = "EJEMPLO · " + meta.language;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = meta.snippet;
      pre.append(code);
      preview.append(previewLabel, pre);
      const insertionPoint = card.querySelector(".tools-home-progress") || card.querySelector(".tools-progress-track") || card.querySelector(".tools-home-cta");
      if (insertionPoint) card.insertBefore(preview, insertionPoint);
      else card.append(preview);
    });

    const exerciseArt = {
      "exercise-html": '<svg viewBox="0 0 100 72" aria-hidden="true"><path d="M27 8h34l15 15v42H27z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M61 8v16h15M39 38l-9 7 9 7m22-14 9 7-9 7m-7-20-7 26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      "exercise-css": '<svg viewBox="0 0 100 72" aria-hidden="true"><path d="M20 54 48 12l29 42H20Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="48" cy="39" r="9" fill="none" stroke="currentColor" stroke-width="3"/><path d="M48 2v7M15 23l7 4M81 23l-7 4M12 61h72" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
      "exercise-js": '<svg viewBox="0 0 100 72" aria-hidden="true"><rect x="19" y="8" width="62" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="3"/><path d="M37 27 28 36l9 9m26-18 9 9-9 9m-6-24-8 30" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      "exercise-challenges": '<svg viewBox="0 0 100 72" aria-hidden="true"><circle cx="49" cy="36" r="27" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="49" cy="36" r="15" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="49" cy="36" r="4" fill="currentColor"/><path d="m53 32 22-22m-11 0h11v11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    document.querySelectorAll(".exercise-hub-card").forEach(card => {
      const kind = Object.keys(exerciseArt).find(name => card.classList.contains(name));
      if (!kind || card.querySelector(".exercise-visual")) return;
      const art = document.createElement("div");
      art.className = "exercise-visual";
      art.innerHTML = exerciseArt[kind];
      art.setAttribute("aria-hidden", "true");
      card.prepend(art);
    });

    const projectArt = [
      '<svg viewBox="0 0 150 90" aria-hidden="true"><rect x="18" y="9" width="114" height="72" rx="10" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="51" cy="36" r="12" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 67c3-13 35-13 38 0M81 30h34M81 43h25M81 57h30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
      '<svg viewBox="0 0 150 90" aria-hidden="true"><path d="M42 32h66l-5 48H47z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M58 32c0-12 7-19 17-19s17 7 17 19M61 50h28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="110" cy="22" r="10" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
      '<svg viewBox="0 0 150 90" aria-hidden="true"><rect x="34" y="7" width="82" height="76" rx="9" fill="none" stroke="currentColor" stroke-width="3"/><path d="M52 28h46M52 43h46M52 58h25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="93" cy="61" r="11" fill="none" stroke="currentColor" stroke-width="3"/><path d="m88 61 4 4 7-8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    ];
    document.querySelectorAll(".mini-project-card").forEach((card, index) => {
      if (card.querySelector(".mini-project-art")) return;
      const art = document.createElement("div");
      art.className = "mini-project-art";
      art.innerHTML = projectArt[index % projectArt.length];
      art.setAttribute("aria-hidden", "true");
      card.prepend(art);
    });
  });
})();