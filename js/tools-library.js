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
      const link = makeLink(resource.label || resource.url, resource.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      list.append(link);
    });
    if (list.childElementCount) parent.append(list);
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
        { id: "testing", label: "Testing", symbol: "✓" }
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
      setText("toolCommand", tool.id === "terminal" ? "terminal" : tool.id === "git" ? "git" : tool.id === "nextjs" ? "next dev" : tool.id === "express" ? "node server.js" : "npm");

      const grid = document.getElementById("toolsCategoryGrid");
      if (grid) {
        grid.replaceChildren();
        tool.categories.forEach((category, index) => {
          const card = makeLink("", urlFor("tools-category.html", {tool: tool.id, category: category.id}), "tools-category-card tools-accent-" + tool.accent);
          const top = node("span", "tools-category-card-top");
          top.append(node("span", "tools-category-icon", category.icon || "▦"), node("span", "tools-card-arrow", "↗"));
          const copy = node("span", "tools-category-copy");
          copy.append(node("span", "tools-kicker", "CATEGORÍA " + String(index + 1).padStart(2, "0")), node("h3", "", category.title), node("p", "", category.description));
          const bottom = node("span", "tools-category-bottom");
          bottom.append(node("span", "", category.articles.length + (category.articles.length === 1 ? " artículo" : " artículos")), node("b", "", "Explorar →"));
          card.append(top, copy, bottom);
          grid.append(card);
        });
      }
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
      setText("toolBreadcrumb", tool.title);
      setText("toolsCategoryEyebrow", tool.title.toUpperCase() + " / CATEGORÍA");
      setText("toolsCategorySymbol", category.icon || tool.symbol);
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
          link.append(node("span", "tools-topic-number", String(index + 1).padStart(2, "0")));
          const copy = node("span", "tools-topic-copy");
          copy.append(node("h3", "", article.title), node("p", "", article.summary));
          link.append(copy, node("span", "tools-topic-open", "LEER ARTÍCULO ↗"));
          list.append(link);
        });
      }
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

      const syntaxLanguage = article.syntaxLanguage || tool.syntaxLanguage || ({
        terminal: "bash", git: "bash", npm: "bash",
        react: "javascript", webcomponents: "javascript", vuejs: "xml",
        nodejs: "javascript", astro: "javascript", phaser: "javascript", typescript: "typescript", nextjs: "typescript", express: "javascript"
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