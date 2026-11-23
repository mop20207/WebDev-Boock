/* Biblioteca compartida de herramientas y tecnologías.
   Las páginas usan una sola plantilla y leen su contenido desde data/tools.json. */
document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  if (!["tools-index", "tools-category", "tools-article"].includes(page)) return;

  const params = new URLSearchParams(location.search);
  const toolId = params.get("tool") || "terminal";
  const categoryId = params.get("category");
  const articleId = params.get("id");
  const root = new URL("../", document.baseURI);
  const urlFor = (path, query = {}) => {
    const url = new URL("pages/" + path, root);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.href;
  };

  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  };
  const makeLink = (text, href, className = "") => {
    const link = node("a", className, text);
    link.href = href;
    return link;
  };
  const setText = (id, text) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text ?? "";
  };
  const appendList = (parent, title, values, className = "tools-detail-list") => {
    if (!Array.isArray(values) || !values.length) return;
    const section = node("section", "tools-article-section");
    const heading = node("h2", "", title);
    const list = node("ul", className);
    values.forEach(value => {
      const item = node("li");
      if (typeof value === "string") item.textContent = value;
      else {
        const strong = node("strong", "", value.name || value.label || "");
        const description = node("span", "", value.description || "");
        item.append(strong, description);
      }
      list.append(item);
    });
    section.append(heading, list);
    parent.append(section);
  };
  const addArticleSection = (parent, toc, id, title) => {
    const section = node("section", "tools-article-section");
    section.id = id;
    section.append(node("h2", "", title));
    parent.append(section);
    toc.append(makeLink(title, "#" + id));
    return section;
  };
  const addCode = (parent, code, caption = "EJEMPLO DE CÓDIGO", language = "plaintext") => {
    const wrapper = node("div", "tools-code-example");
    wrapper.append(node("span", "tools-code-caption", caption));
    const pre = node("pre");
    const codeNode = node("code", "language-" + language, code || "");
    pre.append(codeNode);
    wrapper.append(pre);
    parent.append(wrapper);
    // Highlight.js colorea el código cuando está disponible; el texto sigue
    // siendo legible si la CDN no responde.
    if (window.hljs) window.hljs.highlightElement(codeNode);
  };
  const addResourceLinks = (parent, resources) => {
    if (!Array.isArray(resources) || !resources.length) return;
    const list = node("div", "tools-resource-list");
    resources.forEach(resource => {
      if (!resource.url) return;
      const link = makeLink("", resource.url, "tools-resource-card");
      link.append(node("span", "tools-resource-mark", "↗"));
      const copy = node("span", "tools-resource-copy");
      copy.append(node("strong", "", resource.label || "Recurso externo"), node("small", "", "Abrir documentación o referencia"));
      link.append(copy, node("span", "tools-resource-arrow", "↗"));
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      list.append(link);
    });
    if (list.childElementCount) parent.append(list);
  };



  const makeFlowSteps = (steps, className = "tools-flow-steps") => {
    const list = node("ol", className);
    (steps || []).forEach((step, index) => {
      const item = node("li", "tools-flow-step");
      item.append(
        node("span", "tools-flow-number", String(index + 1).padStart(2, "0")),
        node("span", "tools-flow-copy",
          ""
        )
      );
      const copy = item.querySelector(".tools-flow-copy");
      copy.append(node("strong", "", step.title || ""), node("span", "", step.detail || ""));
      list.append(item);
    });
    return list;
  };

  const renderArchitecture = (root, architecture) => {
    if (!root || !architecture) return;
    root.replaceChildren();
    root.append(
      node("div", "eyebrow", "MAPA VISUAL DE FUNCIONAMIENTO"),
      node("h2", "", architecture.title),
      node("p", "tools-architecture-summary", architecture.summary || ""),
      makeFlowSteps(architecture.steps, "tools-flow-steps"),
      node("p", "tools-architecture-note", architecture.note || "")
    );
    root.hidden = false;
  };

  const renderIntegrations = (root, projects, tools) => {
    if (!root || !Array.isArray(projects) || !projects.length) return;
    root.replaceChildren();
    root.append(
      node("div", "eyebrow", "CONEXIONES ENTRE TECNOLOGÍAS"),
      node("h2", "", "Proyectos integradores"),
      node("p", "tools-integrations-intro", "No son tecnologías aisladas: estos recorridos muestran cómo se conectan para construir aplicaciones completas.")
    );
    const grid = node("div", "tools-integrations-grid");
    projects.forEach(project => {
      const card = node("details", "tools-integration-card");
      const summary = node("summary", "tools-integration-summary");
      summary.append(
        node("span", "tools-integration-level", project.level || "Proyecto"),
        node("span", "tools-integration-title", project.title),
        node("span", "tools-integration-outcome", project.outcome || "Proyecto práctico")
      );
      const body = node("div", "tools-integration-body");
      body.append(node("p", "", project.summary || ""));
      const stackTitle = node("h3", "", "Tecnologías y responsabilidades");
      const stack = node("div", "tools-integration-stack");
      (project.stack || []).forEach(item => {
        const tech = tools.find(candidate => candidate.id === item.tool);
        if (!tech) return;
        const link = makeLink(tech.title, urlFor("tools.html", {tool: tech.id}), "tools-integration-tech");
        link.title = item.role || tech.title;
        link.append(node("small", "", item.role || ""));
        stack.append(link);
      });
      body.append(stackTitle, stack);
      if (project.flow?.length) {
        body.append(node("h3", "", "Arquitectura del proyecto"), makeFlowSteps(project.flow, "tools-flow-steps tools-integration-flow"));
      }
      if (project.milestones?.length) {
        const phases = node("div", "tools-integration-phases");
        phases.append(node("h3", "", "Etapas de construcción"));
        const list = node("ol");
        project.milestones.forEach((milestone, index) => {
          const item = node("li");
          item.append(node("strong", "", (index + 1) + ". " + milestone[0]), node("p", "", milestone[1]));
          list.append(item);
        });
        phases.append(list);
        body.append(phases);
      }
      if (project.dataModel) body.append(node("h3", "", "Modelo de datos"), node("p", "tools-integration-technical", project.dataModel));
      if (project.endpoints) body.append(node("h3", "", "Rutas de ejemplo"), node("p", "tools-integration-technical", project.endpoints));
      card.append(summary, body);
      grid.append(card);
    });
    root.append(grid);
    root.hidden = false;
  };

  const brands = {
    terminal:["#59B99A","SHELL","$ pwd\n$ ls -la\n$ find . -name '*.js'"],
    git:["#F05032","GIT","git status\ngit add .\ngit commit -m \"primer cambio\""],
    npm:["#CB3837","NPM","npm install vite\nnpm run dev\nnpm run build"],
    react:["#61DAFB","JSX · REACT","function Contador() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}"],
    webcomponents:["#E49B58","CUSTOM ELEMENT","class SaludoBox extends HTMLElement {\n  connectedCallback() {\n    this.textContent = 'Hola';\n  }\n}\ncustomElements.define('saludo-box', SaludoBox);"],
    vuejs:["#41B883","VUE · COMPONENT","<script setup>\nimport { ref } from 'vue'\nconst count = ref(0)\n</script>\n\n<button @click=\"count++\">{{ count }}</button>"],
    nodejs:["#68A063","NODE.JS","import { createServer } from 'node:http';\ncreateServer((req, res) => {\n  res.end('Hola desde Node.js');\n}).listen(3000);"],
    astro:["#FF5D01","ASTRO","---\nconst title = 'Mi sitio';\n---\n\n<html lang=\"es\">\n  <h1>{title}</h1>\n</html>"],
    phaser:["#8B5CF6","PHASER","create() {\n  this.add.text(40, 40, 'Mi juego', {\n    fontSize: '28px'\n  });\n}"],
    typescript:["#3178C6","TYPESCRIPT","type Usuario = {\n  id: number;\n  nombre: string;\n};\n\nfunction saludar(user: Usuario) {\n  return 'Hola, ' + user.nombre;\n}"],
    nextjs:["#D9E0EA","NEXT.JS","export default function Page() {\n  return <main><h1>Hola, Next.js</h1></main>;\n}"],
    express:["#A8B2C0","EXPRESS","app.get('/api/saludo', (req, res) => {\n  res.json({ mensaje: 'Hola' });\n});"],
    "sql-postgres":["#6697C8","SQL · POSTGRESQL","SELECT nombre, email\nFROM usuarios\nWHERE activo = TRUE\nORDER BY nombre;"],
    mongodb:["#47A248","MONGODB","db.usuarios.find({ activo: true })\n  .sort({ nombre: 1 })\n  .limit(10);"],
    apis:["#D6A33C","HTTP · API","const response = await fetch('/api/usuarios');\nconst usuarios = await response.json();\nconsole.log(usuarios);"],
    testing:["#38A889","TESTING","test('suma dos valores', () => {\n  expect(sumar(2, 3)).toBe(5);\n});"],
    "docker-deploy":["#2496ED","DOCKER","FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nCMD [\"npm\", \"start\"]"]
  };
  const toolColor = id => brands[id]?.[0] || "#8EA8FF";
  const brandSvg = id => {
    const start = '<svg viewBox="0 0 80 80" aria-hidden="true">';
    const end = '</svg>';
    const icons = {
      react:'<g fill="none" stroke="currentColor" stroke-width="4"><ellipse cx="40" cy="40" rx="34" ry="13"/><ellipse cx="40" cy="40" rx="34" ry="13" transform="rotate(60 40 40)"/><ellipse cx="40" cy="40" rx="34" ry="13" transform="rotate(120 40 40)"/></g><circle cx="40" cy="40" r="5" fill="currentColor"/>',
      vuejs:'<path d="M5 10h22L40 34 53 10h22L40 73z" fill="currentColor"/><path d="m27 10 13 24 13-24H40z" fill="#35495E"/>',
      nodejs:'<path d="M40 5 70 22v36L40 75 10 58V22z" fill="none" stroke="currentColor" stroke-width="5"/><text x="40" y="47" text-anchor="middle" font-size="20" font-weight="800" fill="currentColor">JS</text>',
      typescript:'<rect x="6" y="6" width="68" height="68" rx="10" fill="currentColor"/><text x="40" y="52" text-anchor="middle" font-size="30" font-weight="800" fill="#fff">TS</text>',
      git:'<path d="M35 5a7 7 0 0 1 10 0l30 30a7 7 0 0 1 0 10L45 75a7 7 0 0 1-10 0L5 45a7 7 0 0 1 0-10z" fill="currentColor"/><path d="M27 23v34m0-17h26v17" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="27" cy="23" r="4" fill="#fff"/><circle cx="27" cy="57" r="4" fill="#fff"/><circle cx="53" cy="57" r="4" fill="#fff"/>',
      npm:'<path d="M5 16h70v48H5z" fill="currentColor"/><path d="M15 26h50v28H47V36H35v18H15z" fill="#fff"/>',
      astro:'<path d="m40 4 8 25 27-8-22 19 17 25-26-12-4 22-8-22L5 65l20-25L5 21l27 8z" fill="currentColor"/>',
      phaser:'<path d="M16 24h48a12 12 0 0 1 11 17l-6 15a8 8 0 0 1-13 2L47 49H33l-9 9a8 8 0 0 1-13-2L5 41a12 12 0 0 1 11-17Z" fill="currentColor"/><path d="M22 31v17m-8-8h16m20-4h1m9 9h1" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
      mongodb:'<path d="M42 5C22 25 16 41 27 59c4 7 10 12 15 16 7-11 19-21 18-38C59 23 51 12 42 5Z" fill="currentColor"/><path d="M42 25v49" stroke="#fff" stroke-width="3"/>',
      "sql-postgres":'<ellipse cx="40" cy="17" rx="28" ry="10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M12 17v45c0 6 13 11 28 11s28-5 28-11V17M12 39c0 6 13 11 28 11s28-5 28-11" fill="none" stroke="currentColor" stroke-width="4"/>',
      "docker-deploy":'<g fill="currentColor"><rect x="14" y="31" width="16" height="13" rx="2"/><rect x="34" y="31" width="16" height="13" rx="2"/><rect x="54" y="31" width="16" height="13" rx="2"/><rect x="34" y="14" width="16" height="13" rx="2"/><rect x="54" y="14" width="16" height="13" rx="2"/><path d="M9 48h80C83 64 69 72 49 72 28 72 14 63 9 48Z"/></g>'
    };
    if (icons[id]) return start + icons[id] + end;
    if (id === "webcomponents") return start + '<path d="M40 5 72 23v34L40 75 8 57V23z" fill="none" stroke="currentColor" stroke-width="4"/><path d="m30 29-12 11 12 11m20-22 12 11-12 11" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' + end;
    if (id === "apis") return start + '<circle cx="15" cy="40" r="8" fill="currentColor"/><circle cx="65" cy="18" r="8" fill="currentColor"/><circle cx="65" cy="62" r="8" fill="currentColor"/><path d="m23 37 34-16M23 43l34 16" stroke="currentColor" stroke-width="4"/>' + end;
    if (id === "testing") return start + '<circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" stroke-width="5"/><path d="m23 41 11 11 24-26" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' + end;
    if (id === "express") return start + '<rect x="7" y="7" width="66" height="66" rx="12" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 28h36M22 40h28M22 52h36" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' + end;
    if (id === "nextjs") return start + '<circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" stroke-width="4"/><path d="M25 57V23l31 35V23" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' + end;
    return start + '<rect x="7" y="12" width="66" height="56" rx="12" fill="none" stroke="currentColor" stroke-width="4"/><path d="m22 31 12 10-12 10m20 0h17" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' + end;
  };
  const categorySvg = title => {
    const t = (title || "").toLowerCase();
    if (/estado|state|reactiv|variable/.test(t)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 25h8l5-12 8 23 5-11h6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (/componente|element|template|layout/.test(t)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="7" width="36" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M6 17h36M17 17v24" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
    if (/consulta|query|sql|datos|documento|base/.test(t)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="10" rx="15" ry="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9 10v27c0 4 30 4 30 0V10M9 22c0 5 30 5 30 0" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
    if (/red|petici|http|api|ruta|endpoint/.test(t)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="10" cy="24" r="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="38" cy="10" r="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="38" cy="38" r="5" fill="none" stroke="currentColor" stroke-width="3"/><path d="m15 22 18-10M15 26l18 10" stroke="currentColor" stroke-width="3"/></svg>';
    if (/prueba|test|valid|error/.test(t)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 25 19 35 40 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (/archivo|estructura|directorio|módulo|modulo/.test(t)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 13h14l4 5h16v20H7z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 5 18 10v18L24 43 6 33V15z" fill="none" stroke="currentColor" stroke-width="3"/><path d="m17 19-6 5 6 5m14-10 6 5-6 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };
  const applyToolBrand = tool => {
    const accent = toolColor(tool.id);
    document.querySelector(".tools-content")?.style.setProperty("--tool-accent", accent);
    const symbol = document.getElementById("toolSymbol");
    if (symbol) { symbol.innerHTML = brandSvg(tool.id); symbol.classList.add("tools-symbol-svg"); symbol.setAttribute("aria-hidden", "true"); }
    const art = document.querySelector(".tools-hero-art");
    if (art) {
      art.replaceChildren();
      const mark = node("div", "tools-hero-brand-mark");
      mark.innerHTML = brandSvg(tool.id);
      const panel = node("div", "tools-hero-code-panel");
      const bar = node("div", "tools-hero-code-bar");
      bar.append(node("span", "", tool.title), node("span", "", brands[tool.id]?.[1] || "EJEMPLO"));
      const pre = node("pre");
      pre.append(node("code", "", brands[tool.id]?.[2] || tool.articles?.[0]?.syntax || ""));
      panel.append(bar, pre);
      art.append(mark, panel);
      art.classList.add("tools-hero-brand-art");
    }
  };
  const makeStarter = (tool, article, caption, href) => {
    if (!article) return null;
    const section = node("section", "tools-starter-panel");
    const info = node("div", "tools-starter-copy");
    info.append(node("span", "tools-starter-eyebrow", caption || "EMPEZÁ POR ACÁ"));
    info.append(node("h2", "", article.title));
    info.append(node("p", "", article.summary || article.purpose || tool.description));
    info.append(makeLink("Abrir guía completa ↗", href, "tools-starter-link"));
    const sample = String(article.examples?.[0]?.code || article.syntax || brands[tool.id]?.[2] || "");
    const snippet = sample.length > 650 ? sample.slice(0, 650) + "\n…" : sample;
    const codePanel = node("div", "tools-starter-code");
    const header = node("div", "tools-starter-code-header");
    header.append(node("span", "", "EJEMPLO DE CÓDIGO"), node("span", "", (article.examples?.[0]?.language || article.syntaxLanguage || tool.syntaxLanguage || "code").toUpperCase()));
    const pre = node("pre");
    const code = node("code", "language-" + (article.examples?.[0]?.language || article.syntaxLanguage || tool.syntaxLanguage || "plaintext"), snippet);
    pre.append(code);
    const copy = node("button", "tools-copy-sample", "Copiar código");
    copy.type = "button";
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(snippet); copy.textContent = "Copiado ✓"; }
      catch { copy.textContent = "No disponible"; }
      window.setTimeout(() => { copy.textContent = "Copiar código"; }, 1800);
    });
    codePanel.append(header, pre, copy);
    section.append(info, codePanel);
    if (window.hljs) window.hljs.highlightElement(code);
    return section;
  };
  const insertAfter = (reference, element) => {
    if (reference?.parentNode && element) reference.parentNode.insertBefore(element, reference.nextSibling);
  };

  try {
    const response = await fetch(new URL("data/tools.json", root).href, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar data/tools.json (HTTP " + response.status + ").");
    const database = await response.json();

    // Las bibliotecas agregadas al catálogo también aparecen en la navegación
    // lateral sin tener que duplicar enlaces en cada plantilla HTML.
    const mainNav = document.querySelector(".main-nav");
    if (mainNav) {
      const dynamicTools = [
        { id: "apis", label: "APIs y comunicación web", symbol: "⇄" },
        { id: "testing", label: "Testing", symbol: "✓" },
        { id: "docker-deploy", label: "Docker y despliegue", symbol: "🐳" }
      ];
      dynamicTools.forEach(item => {
        if (mainNav.querySelector('[data-tool-link="' + item.id + '"]')) return;
        const link = node("a", "nav-link");
        link.dataset.toolLink = item.id;
        link.href = urlFor("tools.html", { tool: item.id });
        link.append(node("span", "nav-icon", item.symbol), node("span", "", item.label));
        mainNav.append(link);
      });
    }

    const tool = database.tools?.find(item => item.id === toolId);

    if (!tool) {
      setText("toolTitle", "Sección no encontrada");
      setText("toolDescription", "Volvé al inicio y elegí una herramienta o tecnología disponible.");
      setText("toolsCategoryTitle", "Sección no encontrada");
      setText("toolsCategoryDescription", "No encontramos la sección solicitada.");
      setText("articleTitle", "Artículo no encontrado");
      return;
    }

    if (page === "tools-index") {
      applyToolBrand(tool);
      document.title = tool.title + " | WebDev Book";
      setText("toolBreadcrumb", tool.title);
      setText("toolEyebrow", tool.eyebrow);
      setText("toolSymbol", tool.symbol);
      setText("toolLevel", tool.level);
      setText("toolTitle", tool.title);
      setText("toolDescription", tool.description);
      setText("toolArticleCount", tool.articles.length + (tool.articles.length === 1 ? " artículos" : " artículos"));
      setText("toolCategoryCount", tool.categories.length + (tool.categories.length === 1 ? " categoría" : " categorías"));
      setText("toolsCategorySummary", tool.categories.length + " categorías · " + tool.articles.length + " artículos");
      setText("toolCommand", tool.id === "terminal" ? "terminal" : tool.id === "git" ? "git" : tool.id === "nextjs" ? "next dev" : tool.id === "express" ? "node server.js" : tool.id === "docker-deploy" ? "docker compose" : "npm");

      const grid = document.getElementById("toolsCategoryGrid");
      if (grid) {
        grid.replaceChildren();
        tool.categories.forEach((category, index) => {
          const card = makeLink("", urlFor("tools-category.html", {tool: tool.id, category: category.id}), "tools-category-card tools-accent-" + tool.accent);
          card.style.setProperty("--tool-accent", toolColor(tool.id));
          const top = node("span", "tools-category-card-top");
          const categoryMark = node("span", "tools-category-icon");
          categoryMark.innerHTML = categorySvg(category.title);
          categoryMark.setAttribute("aria-hidden", "true");
          top.append(categoryMark, node("span", "tools-card-arrow", "↗"));
          const copy = node("span", "tools-category-copy");
          copy.append(node("span", "tools-kicker", "CATEGORÍA " + String(index + 1).padStart(2, "0")), node("h3", "", category.title), node("p", "", category.description));
          const bottom = node("span", "tools-category-bottom");
          bottom.append(node("span", "", category.articles.length + (category.articles.length === 1 ? " artículo" : " artículos")), node("b", "", "Explorar →"));
          card.append(top, copy, bottom);
          grid.append(card);
        });
      }
      const firstArticle = tool.articles[0];
      const starter = makeStarter(tool, firstArticle, "EMPEZÁ POR ACÁ", firstArticle ? urlFor("tools-article.html", {tool: tool.id, id: firstArticle.id}) : "#");
      insertAfter(document.querySelector(".tools-categories-section"), starter);
      renderArchitecture(document.getElementById("toolsArchitecture"), tool.architecture);
      renderIntegrations(document.getElementById("toolsIntegrations"), database.integrations, database.tools);
    }

    if (page === "tools-category") {
      const category = tool.categories.find(item => item.id === categoryId);
      if (!category) {
        document.title = "Categoría no encontrada | WebDev Book";
        setText("toolsCategoryTitle", "Categoría no encontrada");
        setText("toolsCategoryDescription", "Volvé a " + tool.title + " y elegí una categoría disponible.");
        return;
      }
      document.title = category.title + " | " + tool.title + " | WebDev Book";
      applyToolBrand(tool);
      document.querySelector(".tools-category-hero")?.style.setProperty("--tool-accent", toolColor(tool.id));
      setText("toolBreadcrumb", tool.title);
      setText("toolsCategoryEyebrow", tool.title.toUpperCase() + " / CATEGORÍA");
      const categorySymbol = document.getElementById("toolsCategorySymbol");
      if (categorySymbol) { categorySymbol.innerHTML = categorySvg(category.title); categorySymbol.classList.add("tools-symbol-svg"); categorySymbol.style.setProperty("--tool-accent", toolColor(tool.id)); categorySymbol.setAttribute("aria-hidden", "true"); }
      setText("toolsCategoryCount", category.articles.length + (category.articles.length === 1 ? " ARTÍCULO" : " ARTÍCULOS"));
      setText("toolsCategoryTitle", category.title);
      setText("toolsCategoryDescription", category.description);
      setText("toolsTopicCount", category.articles.length + (category.articles.length === 1 ? " artículo" : " artículos"));
      setText("toolsCategoryFooterName", tool.title.toUpperCase());
      const indexUrl = urlFor("tools.html", {tool: tool.id});
      const back = document.getElementById("toolsBackToIndex");
      const footerBack = document.getElementById("toolsCategoryFooterBack");
      if (back) back.href = indexUrl;
      if (footerBack) footerBack.href = indexUrl;

      const list = document.getElementById("toolsTopicList");
      if (list) {
        list.replaceChildren();
        category.articles.forEach((id, index) => {
          const article = tool.articles.find(item => item.id === id);
          if (!article) return;
          const link = makeLink("", urlFor("tools-article.html", {tool: tool.id, id: article.id}), "tools-topic-link");
          link.style.setProperty("--tool-accent", toolColor(tool.id));
          const visual = node("span", "tools-topic-art");
          visual.innerHTML = categorySvg(article.title + " " + (article.summary || ""));
          visual.setAttribute("aria-hidden", "true");
          const copy = node("span", "tools-topic-copy");
          copy.append(node("span", "tools-topic-index", "TEMA " + String(index + 1).padStart(2, "0")), node("h3", "", article.title), node("p", "", article.summary));
          link.append(visual, copy, node("span", "tools-topic-open", "LEER GUÍA ↗"));
          list.append(link);
        });
      }
      const firstId = category.articles[0];
      const firstArticle = tool.articles.find(item => item.id === firstId);
      const starter = makeStarter(tool, firstArticle, "PUNTO DE PARTIDA · " + category.title.toUpperCase(), firstArticle ? urlFor("tools-article.html", {tool: tool.id, id: firstArticle.id}) : "#");
      insertAfter(document.querySelector(".tools-category-hero"), starter);
    }

    if (page === "tools-article") {
      const article = tool.articles.find(item => item.id === articleId);
      if (!article) {
        document.title = "Artículo no encontrado | WebDev Book";
        setText("articleTitle", "Artículo no encontrado");
        setText("toolsArticleLead", "Este artículo no está disponible en el catálogo.");
        return;
      }
      const category = tool.categories.find(item => item.id === article.category);
      const categoryUrl = urlFor("tools-category.html", {tool: tool.id, category: article.category});
      document.title = article.title + " | " + tool.title + " | WebDev Book";
      applyToolBrand(tool);
      const articleHero = document.querySelector(".tools-article-hero");
      articleHero?.style.setProperty("--tool-accent", toolColor(tool.id));
      if (articleHero && !articleHero.querySelector(".tools-article-brand-art")) {
        const art = node("div", "tools-article-brand-art");
        art.innerHTML = brandSvg(tool.id);
        art.setAttribute("aria-hidden", "true");
        articleHero.insertBefore(art, document.getElementById("toolsArticleEyebrow"));
      }
      setText("toolBreadcrumb", tool.title);
      setText("toolsArticleEyebrow", tool.title.toUpperCase() + " / DOCUMENTACIÓN");
      setText("toolsArticleKicker", category?.title.toUpperCase() || "GUÍA PRÁCTICA");
      setText("articleTitle", article.title);
      setText("toolsArticleLead", article.summary);
      setText("toolsArticleToolMeta", tool.title);
      setText("toolsArticleCategoryMeta", category?.title || "Categoría");
      setText("toolsArticleLevel", "Nivel " + (article.level || tool.level || "inicial").toLowerCase());
      const back = document.getElementById("toolsArticleBack");
      const footerBack = document.getElementById("toolsArticleFooterBack");
      if (back) back.href = categoryUrl;
      if (footerBack) footerBack.href = categoryUrl;

      const body = document.getElementById("toolsArticleBody");
      const toc = document.getElementById("toolsArticleToc");
      if (!body || !toc) return;
      body.replaceChildren();
      toc.replaceChildren();

      let section = addArticleSection(body, toc, "concepto", "¿Qué es y para qué sirve?");
      section.append(node("p", "", article.purpose));
      if (article.whenToUse) section.append(node("h3", "", "Cuándo utilizarlo"), node("p", "", article.whenToUse));

      if (article.deepDive) {
        section = addArticleSection(body, toc, "profundizacion", "Cómo funciona por dentro");
        section.append(node("p", "tools-deep-model", article.deepDive.model || ""));
        if (article.deepDive.flow?.length) {
          section.append(node("h3", "", "El proceso paso a paso"));
          section.append(makeFlowSteps(article.deepDive.flow, "tools-flow-steps tools-deep-flow"));
        }
        if (article.deepDive.decisions?.length) {
          section.append(node("h3", "", "Decisiones de diseño"));
          const decisions = node("ul", "tools-detail-list");
          article.deepDive.decisions.forEach(item => decisions.append(node("li", "", item)));
          section.append(decisions);
        }
        if (article.deepDive.debugging) {
          section.append(node("h3", "", "Cómo razonar ante un problema"), node("p", "tools-deep-debugging", article.deepDive.debugging));
        }
      }

      const syntaxLanguage = article.syntaxLanguage || tool.syntaxLanguage || ({
        terminal: "bash", git: "bash", npm: "bash",
        react: "javascript", webcomponents: "javascript", vuejs: "xml",
        nodejs: "javascript", astro: "javascript", phaser: "javascript", typescript: "typescript", nextjs: "typescript", express: "javascript",
        "docker-deploy": "dockerfile"
      })[tool.id] || "plaintext";

      section = addArticleSection(body, toc, "sintaxis", "Sintaxis y forma de uso");
      addCode(section, article.syntax, tool.title.toUpperCase() + " / SINTAXIS", syntaxLanguage);

      if (article.parameters?.length) {
        section = addArticleSection(body, toc, "parametros", "Opciones y parámetros");
        const list = node("div", "tools-parameter-list");
        article.parameters.forEach(parameter => {
          const row = node("div", "tools-parameter");
          row.append(node("code", "", parameter.name), node("p", "", parameter.description));
          list.append(row);
        });
        section.append(list);
      }

      section = addArticleSection(body, toc, "ejemplos", "Ejemplos prácticos comentados");
      (article.examples || []).forEach((example, index) => {
        const card = node("div", "tools-example-card");
        card.append(node("h3", "", (index + 1) + ". " + example.title), node("p", "", example.description));
        addCode(card, example.code, tool.title.toUpperCase() + " / EJEMPLO " + (index + 1), example.language || syntaxLanguage);
        card.append(node("p", "tools-example-explanation", example.explanation || ""));
        section.append(card);
      });

      if (article.bestPractices?.length) {
        section = addArticleSection(body, toc, "buenas-practicas", "Buenas prácticas");
        const list = node("ul", "tools-detail-list");
        article.bestPractices.forEach(item => list.append(node("li", "", item)));
        section.append(list);
      }
      if (article.commonMistakes?.length) {
        section = addArticleSection(body, toc, "errores-frecuentes", "Errores frecuentes");
        const list = node("ul", "tools-detail-list");
        article.commonMistakes.forEach(item => list.append(node("li", "", item)));
        section.append(list);
      }
      section = addArticleSection(body, toc, "practica", "Práctica para resolver");
      section.append(node("p", "", article.exercise || "Probá el comando en un entorno de práctica."), node("div", "tools-hint", "Pista: " + (article.hint || "Revisá los ejemplos y consultá la ayuda del comando.")));

      if (article.related?.length) {
        section = addArticleSection(body, toc, "relacionados", "Artículos relacionados");
        const related = node("div", "tools-related-list");
        article.related.forEach(id => {
          // Las relaciones pueden apuntar a otra tecnología (por ejemplo,
          // Git ↔ NPM). Resolverlas en toda la biblioteca evita enlaces perdidos.
          const relatedTool = database.tools.find(candidate =>
            candidate.articles.some(entry => entry.id === id)
          );
          const item = relatedTool?.articles.find(entry => entry.id === id);
          if (item && relatedTool) {
            related.append(makeLink(item.title + " ↗", urlFor("tools-article.html", {tool: relatedTool.id, id: item.id})));
          }
        });
        section.append(related);
      }
      if (article.resources?.length) {
        section = addArticleSection(body, toc, "recursos", "Documentación para profundizar");
        section.append(node("p", "", "Estas referencias oficiales permiten ampliar y verificar el comportamiento de la herramienta."));
        addResourceLinks(section, article.resources);
      }

      const jump = document.getElementById("toolsArticleJump");
      if (jump) {
        jump.replaceChildren();
        tool.categories.forEach(group => {
          const optgroup = document.createElement("optgroup");
          optgroup.label = group.title;
          group.articles.forEach(id => {
            const item = tool.articles.find(entry => entry.id === id);
            if (!item) return;
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.title;
            option.selected = item.id === article.id;
            optgroup.append(option);
          });
          jump.append(optgroup);
        });
        jump.addEventListener("change", () => {
          if (jump.value) location.href = urlFor("tools-article.html", {tool: tool.id, id: jump.value});
        });
      }

      const categoryArticles = category?.articles || [];
      const position = categoryArticles.indexOf(article.id);
      const previous = tool.articles.find(item => item.id === categoryArticles[position - 1]);
      const next = tool.articles.find(item => item.id === categoryArticles[position + 1]);
      const previousLink = document.getElementById("toolsPreviousArticle");
      const nextLink = document.getElementById("toolsNextArticle");
      if (previousLink && previous) {
        previousLink.href = urlFor("tools-article.html", {tool: tool.id, id: previous.id});
        previousLink.textContent = "← Anterior: " + previous.title;
        previousLink.hidden = false;
      }
      if (nextLink && next) {
        nextLink.href = urlFor("tools-article.html", {tool: tool.id, id: next.id});
        nextLink.textContent = "Siguiente: " + next.title + " →";
        nextLink.hidden = false;
      }
    }
  } catch (error) {
    console.error("[WebDev Book] No se pudo cargar la biblioteca de herramientas:", error);
    if (page === "tools-index") {
      setText("toolTitle", "No se pudo cargar la biblioteca");
      setText("toolDescription", error.message || "Revisá tu conexión e intentá nuevamente.");
    } else if (page === "tools-category") {
      setText("toolsCategoryTitle", "No se pudo cargar la categoría");
      setText("toolsCategoryDescription", error.message || "Revisá tu conexión e intentá nuevamente.");
    } else {
      setText("articleTitle", "No se pudo cargar el artículo");
      setText("toolsArticleLead", error.message || "Revisá tu conexión e intentá nuevamente.");
    }
  }
});