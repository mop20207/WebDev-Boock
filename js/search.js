/* Buscador global de WebDev Book.
   Busca en los catálogos completos de HTML, CSS y JavaScript. */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("globalSearch");
  if (!input) return;

  const topbar = input.closest(".topbar") || input.parentElement;
  const panel = document.createElement("section");
  panel.className = "global-search-results";
  panel.id = "globalSearchResults";
  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-label", "Resultados de búsqueda");
  panel.hidden = true;
  topbar.append(panel);

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", panel.id);
  input.setAttribute("aria-expanded", "false");

  const inPages = window.location.pathname.includes("/pages/");
  const basePath = inPages ? "../" : "./";
  const normalize = value => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const collectText = (value, output = []) => {
    if (typeof value === "string" || typeof value === "number") {
      output.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(item => collectText(item, output));
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(item => collectText(item, output));
    }
    return output;
  };

  let catalogPromise = null;
  let catalog = [];
  let visibleResults = [];
  let activeIndex = -1;
  let debounceTimer = 0;

  const createEntry = (language, category, article, href, aliases = "") => {
    const title = article.title || "Artículo sin título";
    const summary = article.summary || article.lead || article.purpose || article.description || "";
    const allText = collectText(article).join(" ");
    const searchable = normalize([
      language,
      category,
      aliases,
      article.id,
      title,
      summary,
      allText
    ].join(" "));
    return {
      language,
      category: category || "General",
      title,
      summary,
      href,
      searchable,
      titleSearch: normalize(title),
      categorySearch: normalize(category),
      summarySearch: normalize(summary),
      idSearch: normalize(article.id || "")
    };
  };

  const loadCatalog = async () => {
    if (catalogPromise) return catalogPromise;

    catalogPromise = Promise.all([
      fetch(basePath + "data/html-articulos.json").then(response => {
        if (!response.ok) throw new Error("No se pudo cargar el catálogo HTML.");
        return response.json();
      }),
      fetch(basePath + "data/css-articulos.json").then(response => {
        if (!response.ok) throw new Error("No se pudo cargar el catálogo CSS.");
        return response.json();
      }),
      fetch(basePath + "data/js-articulos.json").then(response => {
        if (!response.ok) throw new Error("No se pudo cargar el catálogo JavaScript.");
        return response.json();
      })
    ]).then(([htmlDb, cssDb, jsDb]) => {
      const entries = [];

      Object.values(htmlDb.articles || {}).forEach(article => {
        const href = "pages/articulo.html?lenguaje=html&id=" + encodeURIComponent(article.id);
        entries.push(createEntry("HTML", article.categoryTitle, article, basePath + href, "html5 etiquetas elementos atributos marcado"));
      });

      (cssDb.articles || []).forEach(article => {
        const categoryId = article.categoryId;
        const itemIndex = Number(article.id.slice((categoryId + "-").length));
        const href = "pages/css-articulo.html?tema=" + encodeURIComponent(categoryId) + "&item=" + itemIndex;
        entries.push(createEntry("CSS", article.categoryTitle, article, basePath + href, "css estilos hojas de estilo propiedades selectores"));
      });

      (jsDb.articles || []).forEach(article => {
        const categoryId = article.categoryId;
        const itemIndex = Number(article.id.slice((categoryId + "-").length));
        const href = "pages/js-articulo.html?tema=" + encodeURIComponent(categoryId) + "&item=" + itemIndex;
        entries.push(createEntry("JavaScript", article.categoryTitle, article, basePath + href, "javascript js ecmascript lenguaje programación métodos funciones"));
      });

      catalog = entries;
      return catalog;
    }).catch(error => {
      catalogPromise = null;
      throw error;
    });

    return catalogPromise;
  };

  const closePanel = () => {
    panel.hidden = true;
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  };

  const setActive = index => {
    activeIndex = index;
    const links = [...panel.querySelectorAll(".search-result")];
    links.forEach((link, position) => {
      const active = position === activeIndex;
      link.dataset.active = String(active);
      link.setAttribute("aria-selected", String(active));
      if (active) link.scrollIntoView({ block: "nearest" });
    });
  };

  const renderMessage = message => {
    panel.replaceChildren();
    const messageNode = document.createElement("p");
    messageNode.className = "search-empty-state";
    messageNode.textContent = message;
    panel.append(messageNode);
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
    activeIndex = -1;
  };

  const renderResults = results => {
    visibleResults = results;
    activeIndex = -1;
    panel.replaceChildren();

    if (!results.length) {
      renderMessage("No encontramos coincidencias. Probá con el nombre de una etiqueta, propiedad, método o concepto.");
      return;
    }

    const heading = document.createElement("div");
    heading.className = "search-results-heading";
    heading.textContent = results.length + (results.length === 1 ? " resultado" : " resultados") + " · HTML, CSS y JavaScript";
    panel.append(heading);

    const list = document.createElement("div");
    list.className = "search-results-list";

    results.forEach(result => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = result.href;
      link.setAttribute("role", "option");
      link.setAttribute("aria-selected", "false");

      const badge = document.createElement("span");
      badge.className = "search-result-language search-result-" + result.language.toLowerCase().replace("javascript", "js");
      badge.textContent = result.language;

      const copy = document.createElement("span");
      copy.className = "search-result-copy";

      const title = document.createElement("strong");
      title.className = "search-result-title";
      title.textContent = result.title;

      const summary = document.createElement("span");
      summary.className = "search-result-summary";
      summary.textContent = result.summary || result.category;

      copy.append(title, summary);

      const category = document.createElement("span");
      category.className = "search-result-category";
      category.textContent = result.category;

      link.append(badge, copy, category);
      link.addEventListener("mouseenter", () => {
        const index = [...list.children].indexOf(link);
        setActive(index);
      });
      list.append(link);
    });

    const footer = document.createElement("div");
    footer.className = "search-results-footer";
    footer.textContent = "↑ ↓ para recorrer · Enter para abrir · Esc para cerrar";

    panel.append(list, footer);
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  const searchCatalog = query => {
    const normalizedQuery = normalize(query);
    const terms = [...new Set(normalizedQuery.split(" ").filter(Boolean))];
    if (!terms.length) return [];

    return catalog.map(entry => {
      if (!terms.every(term => entry.searchable.includes(term))) return null;

      let score = 0;
      const joined = terms.join(" ");

      if (entry.titleSearch === joined) score += 160;
      else if (entry.titleSearch.startsWith(joined)) score += 120;
      else if (entry.titleSearch.includes(joined)) score += 95;

      terms.forEach(term => {
        if (entry.titleSearch.includes(term)) score += 34;
        if (entry.idSearch.includes(term)) score += 24;
        if (entry.summarySearch.includes(term)) score += 18;
        if (entry.categorySearch.includes(term)) score += 14;
        if (entry.language.toLowerCase().includes(term)) score += 12;
        if (entry.searchable.includes(term)) score += 5;
      });

      return { entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "es"))
    .slice(0, 8)
    .map(item => item.entry);
  };

  const runSearch = async () => {
    const query = input.value.trim();
    if (!query) {
      closePanel();
      return;
    }
    if (normalize(query).length < 2) {
      renderMessage("Escribí al menos dos caracteres para buscar.");
      return;
    }

    renderMessage("Buscando en los artículos de HTML, CSS y JavaScript…");
    try {
      await loadCatalog();
      renderResults(searchCatalog(query));
    } catch (error) {
      console.error(error);
      renderMessage("No se pudieron cargar los artículos. Revisá tu conexión e intentá nuevamente.");
    }
  };

  input.addEventListener("input", () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(runSearch, 140);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim()) runSearch();
  });

  input.addEventListener("keydown", event => {
    const links = [...panel.querySelectorAll(".search-result")];

    if (event.key === "ArrowDown" && !panel.hidden && links.length) {
      event.preventDefault();
      setActive(Math.min(activeIndex + 1, links.length - 1));
    } else if (event.key === "ArrowUp" && !panel.hidden && links.length) {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter" && !panel.hidden && links.length) {
      event.preventDefault();
      const target = links[activeIndex] || links[0];
      window.location.href = target.href;
    } else if (event.key === "Escape") {
      closePanel();
      input.blur();
    }
  });

  document.addEventListener("click", event => {
    if (!topbar.contains(event.target)) closePanel();
  });

  const initialQuery = new URLSearchParams(window.location.search).get("buscar");
  if (initialQuery) {
    input.value = initialQuery;
    runSearch();
  }
});