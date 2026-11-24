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

  // Resolver la raíz desde la ubicación real de este archivo evita errores
  // cuando GitHub Pages publica el proyecto dentro de una subcarpeta.
  const searchScript = [...document.scripts].find(script => {
    try { return new URL(script.src, document.baseURI).pathname.endsWith("/js/search.js"); }
    catch { return false; }
  });
  const dataRoot = searchScript
    ? new URL("../", new URL(searchScript.src, document.baseURI))
    : new URL(window.location.pathname.includes("/pages/") ? "../" : "./", document.baseURI);
  const catalogWarnings = [];
  const normalize = value => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  // Equivalencias español ↔ inglés para buscar el mismo artículo
  // aunque la persona escriba el término en otro idioma.
  const termAliases = {
    function: ["funcion", "funciones"],
    functions: ["funcion", "funciones"],
    funcion: ["function", "functions"],
    funciones: ["function", "functions"],
    method: ["metodo", "metodos"],
    methods: ["metodo", "metodos"],
    metodo: ["method", "methods"],
    metodos: ["method", "methods"],
    property: ["propiedad", "propiedades"],
    properties: ["propiedad", "propiedades"],
    propiedad: ["property", "properties"],
    propiedades: ["property", "properties"],
    tag: ["etiqueta", "etiquetas", "element"],
    tags: ["etiqueta", "etiquetas", "element"],
    etiqueta: ["tag", "tags", "element"],
    etiquetas: ["tag", "tags", "element"],
    element: ["elemento", "elementos", "tag"],
    elements: ["elemento", "elementos", "tag"],
    elemento: ["element", "elements", "tag"],
    elementos: ["element", "elements", "tag"],
    attribute: ["atributo", "atributos"],
    attributes: ["atributo", "atributos"],
    atributo: ["attribute", "attributes"],
    atributos: ["attribute", "attributes"],
    selector: ["selector", "selectores"],
    selectors: ["selectores"],
    selectores: ["selectors"],
    variable: ["variable", "variables"],
    variables: ["variable"],
    loop: ["bucle", "bucles", "iteracion", "iteraciones"],
    loops: ["bucle", "bucles", "iteracion", "iteraciones"],
    bucle: ["loop", "loops", "iteracion"],
    bucles: ["loop", "loops", "iteraciones"],
    array: ["arreglo", "arrays", "arreglos", "matriz"],
    arrays: ["arreglo", "arreglos", "array"],
    object: ["objeto", "objetos"],
    objects: ["objeto", "objetos"],
    objeto: ["object", "objects"],
    objetos: ["object", "objects"],
    event: ["evento", "eventos"],
    events: ["evento", "eventos"],
    evento: ["event", "events"],
    eventos: ["event", "events"],
    string: ["cadena", "cadenas", "texto"],
    strings: ["cadena", "cadenas", "texto"],
    cadena: ["string", "strings"],
    cadenas: ["string", "strings"],
    class: ["clase", "clases"],
    classes: ["clase", "clases"],
    clase: ["class", "classes"],
    clases: ["class", "classes"],
    async: ["asincrono", "asincronia", "asynchronous"],
    asynchronous: ["asincrono", "asincronia", "async"],
    asincrono: ["async", "asynchronous"],
    asincronia: ["async", "asynchronous"],
    promise: ["promesa", "promesas"],
    promises: ["promesa", "promesas"],
    promesa: ["promise", "promises"],
    promesas: ["promise", "promises"],
    fetch: ["solicitud", "peticion", "requests"],
    request: ["solicitud", "peticion", "requests"],
    requests: ["solicitud", "peticion", "request"],
    solicitud: ["request", "requests", "fetch"],
    peticion: ["request", "requests", "fetch"],
    storage: ["almacenamiento", "localstorage", "sessionstorage"],
    almacenamiento: ["storage", "localstorage", "sessionstorage"],
    loop: ["bucle", "bucles"]
  };

  Object.assign(termAliases, {
    arrow: ["flecha", "arrow functions"],
    flecha: ["arrow", "arrow functions"],
    declaration: ["declaracion"],
    declaracion: ["declaration"],
    expression: ["expresion", "expresiones"],
    expressions: ["expresion", "expresiones"],
    expresion: ["expression", "expressions"],
    parameter: ["parametro", "parametros"],
    parameters: ["parametro", "parametros"],
    parametro: ["parameter", "parameters"],
    parametros: ["parameter", "parameters"],
    argument: ["argumento", "argumentos"],
    arguments: ["argumento", "argumentos"],
    argumento: ["argument", "arguments"],
    argumentos: ["argument", "arguments"],
    return: ["retorno", "devolver"],
    scope: ["alcance", "ambito"],
    closure: ["closure", "clausura"],
    clausura: ["closure"],
    inheritance: ["herencia"],
    herencia: ["inheritance"],
    constructor: ["constructor", "constructores"],
    prototype: ["prototipo", "prototipos"],
    prototipo: ["prototype"],
    condition: ["condicion", "condiciones"],
    conditions: ["condicion", "condiciones"],
    condicion: ["condition", "conditions"],
    conditional: ["condicional", "condicionales"],
    condicional: ["conditional"],
    callback: ["funcion callback", "funcion de retorno"],
    callbacks: ["funciones callback"],
    loop: ["bucle", "bucles", "iteracion", "iteraciones"],
    iteration: ["iteracion", "iteraciones", "bucle"],
    iteration: ["iteracion", "iteraciones", "bucle"],
    iteracion: ["iteration", "loop"],
    iteraciones: ["iterations", "loops"],
    grid: ["cuadricula", "rejilla", "css grid"],
    cuadricula: ["grid", "rejilla"],
    flexbox: ["flex", "caja flexible"],
    layout: ["diseno", "maquetacion", "distribucion"],
    maquetacion: ["layout", "diseno"],
    transition: ["transicion", "transiciones"],
    transitions: ["transicion", "transiciones"],
    transicion: ["transition", "transitions"],
    animation: ["animacion", "animaciones"],
    animations: ["animacion", "animaciones"],
    animacion: ["animation", "animations"],
    responsive: ["adaptable", "adaptativo", "diseno adaptable"],
    adaptable: ["responsive"],
    "media": ["media query", "consulta de medios"],
    form: ["formulario", "formularios"],
    forms: ["formulario", "formularios"],
    formulario: ["form", "forms"],
    formularios: ["form", "forms"],
    image: ["imagen", "imagenes"],
    images: ["imagen", "imagenes"],
    imagen: ["image", "images"],
    imagenes: ["image", "images"],
    link: ["enlace", "enlaces", "anchor"],
    links: ["enlace", "enlaces"],
    enlace: ["link", "links", "anchor"],
    button: ["boton", "botones"],
    buttons: ["boton", "botones"],
    boton: ["button", "buttons"],
    heading: ["encabezado", "titulo"],
    headings: ["encabezados", "titulos"],
    encabezado: ["heading", "headings"],
    font: ["fuente", "tipografia"],
    fonts: ["fuentes", "tipografia"],
    fuente: ["font", "fonts"],
    color: ["color", "colores"],
    background: ["fondo", "background color"],
    fondo: ["background"],
    border: ["borde", "bordes"],
    borders: ["borde", "bordes"],
    borde: ["border", "borders"],
    margin: ["margen", "margenes"],
    margen: ["margin"],
    padding: ["relleno", "espaciado interno"],
    relleno: ["padding"],
    box: ["caja", "modelo de caja"],
    caja: ["box", "box model"]
  });
  const equivalents = term => [term, ...(termAliases[term] || [])];

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
      idSearch: normalize(article.id || ""),
      searchWords: new Set(searchable.split(" ").filter(Boolean)),
      titleWords: normalize(title).split(" ").filter(Boolean),
      categoryWords: normalize(category).split(" ").filter(Boolean),
      summaryWords: normalize(summary).split(" ").filter(Boolean)
    };
  };

  const loadCatalog = async () => {
    if (catalogPromise) return catalogPromise;

    const fetchCatalog = async (fileName, language) => {
      const url = new URL("data/" + fileName, dataRoot);
      const response = await fetch(url.href, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(language + ": HTTP " + response.status + " al cargar " + url.pathname);
      }
      const data = await response.json();
      if (!data || !data.articles) {
        throw new Error(language + ": el archivo no contiene la estructura de artículos esperada.");
      }
      return data;
    };

    catalogPromise = Promise.allSettled([
      fetchCatalog("html-articulos.json", "HTML"),
      fetchCatalog("css-articulos.json", "CSS"),
      fetchCatalog("js-articulos.json", "JavaScript"),
      fetch(new URL("modules/libraries/search-index.json", dataRoot).href, { cache: "no-store" }).then(response => {
        if (!response.ok) throw new Error("Herramientas: HTTP " + response.status + " al cargar el índice de bibliotecas.");
        return response.json();
      })
    ]).then(results => {
      const entries = [];
      catalogWarnings.length = 0;
      const [htmlResult, cssResult, jsResult, toolsResult] = results;

      if (htmlResult.status === "fulfilled") {
        const articles = Array.isArray(htmlResult.value.articles)
          ? htmlResult.value.articles
          : Object.values(htmlResult.value.articles || {});
        articles.forEach(article => {
          const href = new URL("pages/articulo.html?lenguaje=html&id=" + encodeURIComponent(article.id), dataRoot).href;
          entries.push(createEntry("HTML", article.categoryTitle, article, href, "html5 etiquetas elementos atributos marcado"));
        });
      } else {
        catalogWarnings.push("HTML: " + htmlResult.reason.message);
      }

      if (cssResult.status === "fulfilled") {
        cssResult.value.articles.forEach(article => {
          const categoryId = article.categoryId;
          const itemIndex = Number(String(article.id).slice((categoryId + "-").length));
          const href = new URL("pages/css-articulo.html?tema=" + encodeURIComponent(categoryId) + "&item=" + itemIndex, dataRoot).href;
          entries.push(createEntry("CSS", article.categoryTitle, article, href, "css estilos hojas de estilo propiedades selectores"));
        });
      } else {
        catalogWarnings.push("CSS: " + cssResult.reason.message);
      }

      if (jsResult.status === "fulfilled") {
        jsResult.value.articles.forEach(article => {
          const categoryId = article.categoryId;
          const itemIndex = Number(String(article.id).slice((categoryId + "-").length));
          const href = new URL("pages/js-articulo.html?tema=" + encodeURIComponent(categoryId) + "&item=" + itemIndex, dataRoot).href;
          entries.push(createEntry("JavaScript", article.categoryTitle, article, href, "javascript js ecmascript lenguaje programación métodos funciones"));
        });
      } else {
        catalogWarnings.push("JavaScript: " + jsResult.reason.message);
      }

      if (toolsResult.status === "fulfilled" && Array.isArray(toolsResult.value.entries)) {
        toolsResult.value.entries.forEach(item => {
          const article = {
            id: item.articleId,
            title: item.title,
            summary: item.summary,
            searchText: item.searchText
          };
          const href = new URL(
            "pages/tools-article.html?tool=" + encodeURIComponent(item.toolId) + "&id=" + encodeURIComponent(item.articleId),
            dataRoot
          ).href;
          const searchCategory = item.toolTitle + " · " + item.categoryTitle;
          const aliases = item.toolTitle + " " + (item.toolShortTitle || "") + " " + item.categoryTitle +
            " terminal linux consola shell comandos control de versiones git github npm node paquetes dependencias";
          entries.push(createEntry("Herramientas", searchCategory, article, href, aliases));
        });
      } else {
        catalogWarnings.push("Herramientas: " + (toolsResult.reason?.message || "el índice de búsqueda no tiene una estructura válida."));
      }

      if (!entries.length) {
        throw new Error(catalogWarnings.join(" | ") || "No se pudo cargar ningún catálogo.");
      }
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
    const allResults = results;
    activeIndex = -1;
    panel.replaceChildren();

    if (!allResults.length) {
      renderMessage("No encontramos coincidencias. Probá con el nombre de una etiqueta, propiedad, método o concepto.");
      return;
    }

    const heading = document.createElement("div");
    heading.className = "search-results-heading";

    const filters = document.createElement("div");
    filters.className = "search-filter-row";

    const makeFilter = (labelText, className) => {
      const label = document.createElement("label");
      label.className = "search-filter";
      const caption = document.createElement("span");
      caption.textContent = labelText;
      const select = document.createElement("select");
      select.className = className;
      label.append(caption, select);
      return { label, select };
    };

    const languageFilter = makeFilter("Lenguaje", "search-language-filter");
    const categoryFilter = makeFilter("Categoría", "search-category-filter");

    const addOption = (select, value, label) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    };

    addOption(languageFilter.select, "", "Todos");
    ["HTML", "CSS", "JavaScript", "Herramientas"].forEach(language => addOption(languageFilter.select, language, language));
    addOption(categoryFilter.select, "", "Todas");

    const updateCategoryOptions = () => {
      const selectedLanguage = languageFilter.select.value;
      categoryFilter.select.replaceChildren();
      addOption(categoryFilter.select, "", "Todas");
      const categories = [...new Set(catalog
        .filter(item => !selectedLanguage || item.language === selectedLanguage)
        .map(item => item.language + "|" + item.category))]
        .sort((a, b) => a.localeCompare(b, "es"));
      categories.forEach(value => {
        const [language, category] = value.split("|");
        addOption(categoryFilter.select, value, language + " · " + category);
      });
    };

    updateCategoryOptions();

    const list = document.createElement("div");
    list.className = "search-results-list";
    list.id = "globalSearchOptions";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Artículos encontrados");
    input.setAttribute("aria-controls", list.id);

    const footer = document.createElement("div");
    footer.className = "search-results-footer";

    const addResult = result => {
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
    };

    const renderFilteredResults = () => {
      const selectedLanguage = languageFilter.select.value;
      const selectedCategory = categoryFilter.select.value;
      const filtered = allResults.filter(result => {
        if (selectedLanguage && result.language !== selectedLanguage) return false;
        if (selectedCategory && (result.language + "|" + result.category) !== selectedCategory) return false;
        return true;
      });

      visibleResults = filtered.slice(0, 8);
      activeIndex = -1;
      list.replaceChildren();

      if (!filtered.length) {
        const empty = document.createElement("p");
        empty.className = "search-filter-empty";
        empty.textContent = "No hay coincidencias con estos filtros. Elegí otro lenguaje o categoría.";
        list.append(empty);
      } else {
        visibleResults.forEach(addResult);
      }

      heading.textContent = filtered.length + (filtered.length === 1 ? " coincidencia" : " coincidencias");
      footer.textContent = filtered.length > 8
        ? "Se muestran 8 de " + filtered.length + " · ↑ ↓ para recorrer · Enter para abrir · Esc para cerrar"
        : "↑ ↓ para recorrer · Enter para abrir · Esc para cerrar";
    };

    // Registrar los eventos después de inicializar renderFilteredResults.
    // Evita el error temporal de inicialización (TDZ) al construir el panel.
    languageFilter.select.addEventListener("change", () => {
      categoryFilter.select.value = "";
      updateCategoryOptions();
      renderFilteredResults();
    });
    categoryFilter.select.addEventListener("change", renderFilteredResults);

    filters.append(languageFilter.label, categoryFilter.label);
    if (catalogWarnings.length) {
      const warning = document.createElement("p");
      warning.className = "search-empty-state";
      warning.textContent = "Algunos artículos no pudieron cargarse: " + catalogWarnings.join(" · ");
      panel.append(warning);
    }
    panel.append(heading, filters, list, footer);
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
    renderFilteredResults();
  };

  const searchCatalog = query => {
    const normalizedQuery = normalize(query);
    const terms = [...new Set(normalizedQuery.split(" ").filter(Boolean))];
    if (!terms.length) return [];

    return catalog.map(entry => {
      const matchesTerm = term => {
        const options = equivalents(term);
        return options.some(option =>
          entry.searchWords.has(option) ||
          (option.length >= 3 && entry.titleWords.some(word => word.startsWith(option))) ||
          (option.length >= 3 && entry.categoryWords.some(word => word.startsWith(option)))
        );
      };
      if (!terms.every(matchesTerm)) return null;

      let score = 0;
      const joined = terms.join(" ");
      const titleHasAllTerms = terms.every(term =>
        equivalents(term).some(option => entry.titleWords.includes(option))
      );

      if (entry.titleSearch === joined) score += 160;
      else if (entry.titleSearch.startsWith(joined)) score += 120;
      else if (entry.titleSearch.includes(joined)) score += 95;
      if (titleHasAllTerms) score += 90;

      terms.forEach(term => {
        const options = equivalents(term);
        if (options.some(option => entry.titleWords.includes(option))) score += 36;
        else if (options.some(option => entry.titleWords.some(word => word.startsWith(option)))) score += 24;
        if (options.some(option => entry.idSearch.split(" ").includes(option))) score += 24;
        if (options.some(option => entry.summaryWords.includes(option))) score += 18;
        if (options.some(option => entry.categoryWords.includes(option))) score += 14;
        if (options.some(option => entry.searchWords.has(option))) score += 5;
        if (entry.language.toLowerCase().includes(term)) score += 12;
      });

      return { entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "es"))
    .map(item => item.entry);
  };

  const runSearch = async () => {
    const query = input.value.trim();
    if (!query) {
      closePanel();
      return;
    }
    const normalizedQuery = normalize(query);
    const shortTerms = new Set(["a", "p", "b", "i", "u", "q", "s", "br", "hr", "em", "li", "ol", "ul", "dt", "dd", "th", "td", "tr", "h1", "h2", "h3", "h4", "h5", "h6"]);
    if (normalizedQuery.length < 2 && !shortTerms.has(normalizedQuery)) {
      renderMessage("Escribí al menos dos caracteres. También podés buscar etiquetas cortas como <a> o <p>.");
      return;
    }

    renderMessage("Buscando en los artículos de HTML, CSS y JavaScript…");
    try {
      await loadCatalog();
      renderResults(searchCatalog(query));
    } catch (error) {
      console.error("[WebDev Book] Error del buscador:", error);
      const detail = error && error.message ? error.message : String(error);
      renderMessage("No se pudieron cargar los artículos. Detalle: " + detail + " · Ruta base: " + dataRoot.href);
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