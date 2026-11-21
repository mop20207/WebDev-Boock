/* Favoritos y progreso de aprendizaje de WebDev Book.
   Los datos se guardan localmente en el navegador, sin cuenta ni servidor. */
document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "webdevbook.learning.v1";
  const TOTALS = { html: 242, css: 106, javascript: 146, tools: 41, react: 6, webcomponents: 6, vuejs: 15, nodejs: 18, astro: 20, phaser: 6 };
  const LANGUAGE_NAMES = { html: "HTML", css: "CSS", javascript: "JavaScript", tools: "Herramientas", react: "React", webcomponents: "Web Components", vuejs: "Vue.js", nodejs: "Node.js", astro: "Astro", phaser: "Phaser" };

  const emptyState = () => ({ favorites: [], completed: [], articles: {} });
  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        favorites: Array.isArray(saved.favorites) ? [...new Set(saved.favorites)] : [],
        completed: Array.isArray(saved.completed) ? [...new Set(saved.completed)] : [],
        articles: saved.articles && typeof saved.articles === "object" ? saved.articles : {}
      };
    } catch (error) {
      console.warn("No se pudo leer el progreso guardado.", error);
      return emptyState();
    }
  };

  let state = readState();
  let currentArticle = null;
  let favoriteButton = null;
  let completeButton = null;
  let actionStatus = null;

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      updateInterface();
      window.dispatchEvent(new CustomEvent("webdevbook:learning-updated"));
      return true;
    } catch (error) {
      console.error("No se pudo guardar el progreso en este navegador.", error);
      if (actionStatus) actionStatus.textContent = "No se pudo guardar. Revisá el espacio disponible del navegador.";
      return false;
    }
  };

  const updateFavoriteButton = () => {
    if (!favoriteButton || !currentArticle) return;
    const saved = state.favorites.includes(currentArticle.key);
    favoriteButton.classList.toggle("is-active", saved);
    favoriteButton.setAttribute("aria-pressed", String(saved));
    favoriteButton.textContent = saved ? "★ En favoritos" : "☆ Guardar en favoritos";
  };

  const updateCompleteButton = () => {
    if (!completeButton || !currentArticle) return;
    const done = state.completed.includes(currentArticle.key);
    completeButton.classList.toggle("is-active", done);
    completeButton.setAttribute("aria-pressed", String(done));
    completeButton.textContent = done ? "✓ Artículo aprendido" : "○ Marcar como aprendido";
  };

  const updateActionStatus = () => {
    if (!actionStatus || !currentArticle) return;
    const favorite = state.favorites.includes(currentArticle.key);
    const complete = state.completed.includes(currentArticle.key);
    if (favorite && complete) actionStatus.textContent = "Guardado en favoritos y marcado como aprendido en este navegador.";
    else if (favorite) actionStatus.textContent = "Guardado en tus favoritos de este navegador.";
    else if (complete) actionStatus.textContent = "Tu progreso quedó guardado en este navegador.";
    else actionStatus.textContent = "Tus cambios se guardan localmente en este navegador.";
  };

  const createArticleControls = () => {
    const header = document.querySelector(".article-hero, .css-article-hero, .js-article-hero");
    if (!header || document.getElementById("articleLearningActions")) return;

    const toolbar = document.createElement("div");
    toolbar.className = "article-learning-actions";
    toolbar.id = "articleLearningActions";

    favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "learning-action favorite-action";
    favoriteButton.addEventListener("click", () => {
      if (!currentArticle) return;
      state.articles[currentArticle.key] = currentArticle;
      const index = state.favorites.indexOf(currentArticle.key);
      if (index >= 0) state.favorites.splice(index, 1);
      else state.favorites.push(currentArticle.key);
      saveState();
    });

    completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.className = "learning-action complete-action";
    completeButton.addEventListener("click", () => {
      if (!currentArticle) return;
      state.articles[currentArticle.key] = currentArticle;
      const index = state.completed.indexOf(currentArticle.key);
      if (index >= 0) state.completed.splice(index, 1);
      else state.completed.push(currentArticle.key);
      saveState();
    });

    actionStatus = document.createElement("span");
    actionStatus.className = "learning-action-status";
    actionStatus.setAttribute("aria-live", "polite");

    toolbar.append(favoriteButton, completeButton, actionStatus);
    const meta = header.querySelector(".article-meta, .css-article-meta, .js-article-meta");
    if (meta) meta.after(toolbar);
    else header.append(toolbar);

    updateFavoriteButton();
    updateCompleteButton();
    updateActionStatus();
  };

  const articleRoute = (language, id, categoryId, itemIndex) => {
    if (language === "tools") {
      const [toolId, articleId] = String(id).split(":");
      return "pages/tools-article.html?tool=" + encodeURIComponent(toolId) + "&id=" + encodeURIComponent(articleId);
    }
    if (language === "html") return "pages/articulo.html?lenguaje=html&id=" + encodeURIComponent(id);
    if (language === "css") return "pages/css-articulo.html?tema=" + encodeURIComponent(categoryId) + "&item=" + itemIndex;
    return "pages/js-articulo.html?tema=" + encodeURIComponent(categoryId) + "&item=" + itemIndex;
  };

  const loadCurrentArticle = async () => {
    const page = document.body.dataset.page;

    // Artículos de Terminal Linux, Git y NPM usan una ruta y un catálogo compartidos.
    if (page === "tools-article") {
      const params = new URLSearchParams(window.location.search);
      const toolId = params.get("tool");
      const articleId = params.get("id");
      if (!toolId || !articleId) return;

      try {
        const response = await fetch("../data/tools.json", { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar el catálogo de herramientas.");
        const database = await response.json();
        const tool = database.tools?.find(item => item.id === toolId);
        const article = tool?.articles?.find(item => item.id === articleId);
        const category = tool?.categories?.find(item => item.id === article?.category);
        if (!tool || !article) return;

        currentArticle = {
          key: "tools:" + toolId + ":" + articleId,
          language: "tools",
          languageName: LANGUAGE_NAMES.tools,
          id: toolId + ":" + articleId,
          title: article.title,
          category: tool.title + " · " + (category?.title || "Herramientas"),
          url: articleRoute("tools", toolId + ":" + articleId)
        };
        state.articles[currentArticle.key] = currentArticle;
        createArticleControls();
        updateInterface();
      } catch (error) {
        console.warn("No se pudo cargar el estado del artículo de herramientas.", error);
      }
      return;
    }

    const language = page === "articulo" ? "html" : page === "articulo-css" ? "css" : page === "articulo-javascript" ? "javascript" : null;
    if (!language) return;

    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get("tema");
    const itemIndex = Number(params.get("item"));
    const id = language === "html" ? params.get("id") : categoryId + "-" + itemIndex;
    if (!id || id === "null-NaN") return;

    const basePath = window.location.pathname.includes("/pages/") ? "../" : "./";
    const meta = {
      key: language + ":" + id,
      language,
      languageName: LANGUAGE_NAMES[language],
      id,
      title: document.getElementById("articleTitle")?.textContent || id,
      category: "",
      url: articleRoute(language, id, categoryId, itemIndex)
    };

    try {
      const file = language === "html" ? "html-articulos.json" : language === "css" ? "css-articulos.json" : "js-articulos.json";
      const response = await fetch(basePath + "data/" + file);
      if (!response.ok) throw new Error("No se pudo cargar la ficha del artículo.");
      const database = await response.json();
      const article = language === "html"
        ? database.articles?.[id]
        : database.articles?.find(entry => entry.id === id);

      if (article) {
        meta.title = article.title || meta.title;
        meta.category = article.categoryTitle || article.category || "";
      }
    } catch (error) {
      console.warn("Se usará la información visible del artículo.", error);
    }

    currentArticle = meta;
    state.articles[meta.key] = meta;
    createArticleControls();
    updateInterface();
  };

  const renderFavorites = () => {
    const list = document.getElementById("favoritesList");
    const count = document.getElementById("favoriteCount");
    if (!list) return;

    const favorites = state.favorites
      .map(key => state.articles[key])
      .filter(Boolean);

    if (count) count.textContent = favorites.length + (favorites.length === 1 ? " guardado" : " guardados");
    list.replaceChildren();

    if (!favorites.length) {
      const empty = document.createElement("p");
      empty.className = "favorites-empty";
      empty.textContent = "Todavía no guardaste artículos. Abrí un tema y elegí “Guardar en favoritos” para tenerlo a mano.";
      list.append(empty);
      return;
    }

    favorites.forEach(article => {
      const card = document.createElement("article");
      card.className = "favorite-item";

      const link = document.createElement("a");
      link.className = "favorite-item-link";
      link.href = article.url || "#";

      const badge = document.createElement("span");
      badge.className = "favorite-language favorite-" + article.language + (article.language === "tools" ? " favorite-tools" : "");
      badge.textContent = article.languageName || LANGUAGE_NAMES[article.language] || article.language;

      const copy = document.createElement("span");
      copy.className = "favorite-item-copy";
      const title = document.createElement("strong");
      title.textContent = article.title || article.id;
      const category = document.createElement("small");
      category.textContent = article.category || "Artículo guardado";
      copy.append(title, category);
      link.append(badge, copy);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "favorite-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Quitar " + (article.title || article.id) + " de favoritos");
      remove.addEventListener("click", () => {
        state.favorites = state.favorites.filter(key => key !== article.key);
        saveState();
      });

      card.append(link, remove);
      list.append(card);
    });
  };

  const renderDashboard = () => {
    const languageCards = {
      html: document.querySelector(".language-card.html-card"),
      css: document.querySelector(".language-card.css-card"),
      javascript: document.querySelector(".language-card.js-card")
    };

    Object.entries(languageCards).forEach(([language, card]) => {
      if (!card) return;
      const count = state.completed.filter(key => key.startsWith(language + ":")).length;
      const total = TOTALS[language];
      const percent = total ? Math.round(count / total * 100) : 0;
      const value = card.querySelector(".progress-info b");
      const bar = card.querySelector(".progress-track i");
      if (value) value.textContent = percent + "%";
      if (bar) bar.style.width = percent + "%";
      const label = card.querySelector(".progress-info span");
      if (label) label.textContent = count + " de " + total + " artículos";
    });

    // Progreso independiente de cada biblioteca nueva.
    document.querySelectorAll(".tools-home-card[data-tool]").forEach(card => {
      const toolId = card.dataset.tool;
      const total = Number(card.dataset.total) || 0;
      const count = state.completed.filter(key => key.startsWith("tools:" + toolId + ":")).length;
      const percent = total ? Math.round(count / total * 100) : 0;
      const label = card.querySelector(".tools-home-progress > span");
      const value = card.querySelector(".tools-home-progress > b");
      const bar = card.querySelector(".tools-progress-track i");
      if (label) label.textContent = count + " de " + total + " artículos";
      if (value) value.textContent = percent + "%";
      if (bar) bar.style.width = percent + "%";
    });

    const completed = state.completed.length;
    const totalArticles = Object.values(TOTALS).reduce((sum, value) => sum + value, 0);
    const overallPercent = totalArticles ? Math.round(completed / totalArticles * 100) : 0;
    const overall = document.querySelector("#learning-progress .overall-progress b");
    const track = document.querySelector("#learning-progress .overall-track i");
    const paragraph = document.querySelector("#learning-progress > p");

    if (overall) overall.textContent = completed + " de " + totalArticles + " artículos";
    if (track) track.style.width = overallPercent + "%";
    if (paragraph) {
      paragraph.textContent = completed
        ? "Completaste " + completed + " artículos y guardaste " + state.favorites.length + " favoritos. Tu avance queda guardado en este navegador."
        : "Todavía no marcaste artículos como aprendidos. Empezá por un tema y registrá tu avance desde su página.";
    }

    renderFavorites();
  };

  const updateInterface = () => {
    updateFavoriteButton();
    updateCompleteButton();
    updateActionStatus();
    renderDashboard();
  };

  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY) return;
    state = readState();
    updateInterface();
  });
  window.addEventListener("webdevbook:learning-updated", () => {
    state = readState();
    updateInterface();
  });

  updateInterface();
  loadCurrentArticle();
});