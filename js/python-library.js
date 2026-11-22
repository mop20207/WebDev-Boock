(() => {
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const catalogNode = $("#pythonCategoryGrid");
const catalogSection = $(".python-catalog-section");
const articleView = $("#pythonArticleView");
const searchInput = $("#pythonSearch");
const categoryFilter = $("#pythonCategoryFilter");
const resultCount = $("#pythonResultCount");
const statusNode = $("#pythonStatus");
const STORAGE_PROGRESS = "webdevbook.python.progress.v1";
const STORAGE_FAVORITES = "webdevbook.python.favorites.v1";

let database = null;
let articles = [];
let categories = [];
let activeArticle = null;
let activeFilter = "all";
let completed = readSet(STORAGE_PROGRESS);
let favorites = readSet(STORAGE_FAVORITES);

function readSet(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(value) ? value.filter(item => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

function writeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]));
    return true;
  } catch {
    announce("No se pudo guardar el cambio en este navegador.");
    return false;
  }
}

function announce(message) {
  if (statusNode) statusNode.textContent = message;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

function makeLink(label, url) {
  const link = node("a", "", label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function categoryFor(id) {
  return categories.find(category => category.id === id);
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function updateProgress() {
  const done = articles.filter(article => completed.has(article.id)).length;
  const favoriteCount = articles.filter(article => favorites.has(article.id)).length;
  $("#pythonArticleTotal").textContent = String(articles.length);
  $("#pythonCategoryTotal").textContent = String(categories.length);
  $("#pythonCompletedTotal").textContent = String(done);
  $("#pythonFavoriteTotal").textContent = String(favoriteCount);
  $("#pythonProgressLabel").textContent = done + " de " + articles.length + " artículos completados";
  const progress = Math.round((done / Math.max(articles.length, 1)) * 100);
  $("#pythonProgressLabel").setAttribute("aria-label", "Progreso de lectura: " + progress + "%");
}

function articleMatches(article, query) {
  if (!query) return true;
  const examples = (article.examples || []).map(example =>
    [example.title, example.description, example.code, example.explanation].join(" ")
  );
  const text = [
    article.title, article.summary, article.purpose, article.syntax,
    article.exercise, article.hint, ...(article.bestPractices || []),
    ...(article.commonMistakes || []), ...examples
  ].join(" ");
  return normalize(text).includes(normalize(query));
}

function makeArticleCard(article) {
  const card = node("article", "python-topic-card");
  const category = categoryFor(article.category);
  const meta = node("div", "python-topic-meta");
  meta.append(
    node("span", "python-topic-level level-" + (article.level || "Inicial").toLowerCase(), article.level || "Inicial"),
    node("span", "python-topic-number", String(articles.indexOf(article) + 1).padStart(2, "0"))
  );
  const heading = node("h3", "", article.title);
  const summary = node("p", "", article.summary);
  const tags = node("div", "python-topic-tags");
  tags.append(node("span", "", category ? category.title : "Python"));
  if (favorites.has(article.id)) tags.append(node("span", "is-favorite-tag", "★ Favorito"));
  const footer = node("div", "python-topic-footer");
  const state = node("span", "python-topic-state", completed.has(article.id) ? "✓ Completado" : "Pendiente");
  const open = node("button", "python-topic-open", "Estudiar artículo →");
  open.type = "button";
  open.dataset.article = article.id;
  footer.append(state, open);
  card.append(meta, heading, summary, tags, footer);
  if (completed.has(article.id)) card.classList.add("is-completed");
  return card;
}

function renderCatalog() {
  if (!database) return;
  const query = searchInput.value.trim();
  const selectedCategory = categoryFilter.value;
  const visible = articles.filter(article => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const matchesFilter = activeFilter === "all" ||
      (activeFilter === "pending" && !completed.has(article.id)) ||
      (activeFilter === "favorites" && favorites.has(article.id));
    return matchesCategory && matchesFilter && articleMatches(article, query);
  });

  catalogNode.replaceChildren();
  categories.forEach(category => {
    const items = visible.filter(article => article.category === category.id);
    if (!items.length) return;

    const group = node("section", "python-category-group");
    const heading = node("div", "python-category-heading");
    const titleWrap = node("div", "python-category-title-wrap");
    titleWrap.append(
      node("span", "python-category-icon", category.icon || "▦"),
      node("div", "", "")
    );
    const titleBox = titleWrap.lastElementChild;
    titleBox.append(node("h2", "", category.title), node("p", "", category.description));
    heading.append(titleWrap, node("span", "python-category-count", items.length + (items.length === 1 ? " artículo" : " artículos")));
    const cards = node("div", "python-topic-grid");
    items.forEach(article => cards.append(makeArticleCard(article)));
    group.append(heading, cards);
    catalogNode.append(group);
  });

  resultCount.textContent = visible.length + " de " + articles.length + " artículos";
  if (!visible.length) {
    catalogNode.append(node("p", "python-empty-state", "No encontramos artículos con esos filtros. Probá con otro término o limpiá los filtros."));
  }
  updateProgress();
}

function addSection(parent, id, title, contents) {
  const section = node("section", "python-article-section");
  section.id = id;
  section.append(node("h2", "", title));
  if (contents) section.append(contents);
  parent.append(section);
  return section;
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = node("textarea");
      area.value = text;
      area.setAttribute("aria-hidden", "true");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      if (!copied) throw new Error("Copiar no está disponible");
    }
    button.textContent = "✓ Copiado";
  } catch {
    button.textContent = "No se pudo copiar";
  }
  window.setTimeout(() => { if (button.isConnected) button.textContent = "Copiar"; }, 1800);
}

function addCodeBlock(parent, code, caption, articleId, index) {
  const wrapper = node("div", "python-code-example");
  const toolbar = node("div", "python-code-toolbar");
  toolbar.append(node("span", "python-code-caption", caption || "PYTHON"));
  const actions = node("div", "python-code-actions");
  const copy = node("button", "", "Copiar");
  copy.type = "button";
  copy.addEventListener("click", () => copyText(code, copy));
  const download = node("button", "", "Descargar .py");
  download.type = "button";
  download.addEventListener("click", () => {
    const blob = new Blob([code], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = node("a");
    anchor.href = url;
    anchor.download = articleId + (index ? "-ejemplo-" + index : "-sintaxis") + ".py";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  actions.append(copy, download);
  toolbar.append(actions);
  const pre = node("pre", "python-code");
  const codeElement = node("code", "language-python", code || "");
  pre.append(codeElement);
  wrapper.append(toolbar, pre);
  parent.append(wrapper);
}

function addListSection(parent, id, title, items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = node("ul", "python-detail-list");
  items.forEach(item => list.append(node("li", "", item)));
  addSection(parent, id, title, list);
}

function toggleCompleted(id) {
  if (completed.has(id)) completed.delete(id);
  else completed.add(id);
  writeSet(STORAGE_PROGRESS, completed);
  updateProgress();
  renderCatalog();
  if (activeArticle?.id === id) updateArticleActions();
  announce(completed.has(id) ? "Artículo marcado como completado." : "Se quitó el estado de completado.");
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  writeSet(STORAGE_FAVORITES, favorites);
  updateProgress();
  renderCatalog();
  if (activeArticle?.id === id) updateArticleActions();
  announce(favorites.has(id) ? "Artículo agregado a favoritos." : "Artículo quitado de favoritos.");
}

function updateArticleActions() {
  const complete = $("#pythonMarkComplete");
  const favorite = $("#pythonFavorite");
  if (!activeArticle || !complete || !favorite) return;
  const isDone = completed.has(activeArticle.id);
  const isFavorite = favorites.has(activeArticle.id);
  complete.textContent = isDone ? "✓ Artículo completado" : "Marcar como completado";
  complete.setAttribute("aria-pressed", String(isDone));
  favorite.textContent = isFavorite ? "★ En favoritos" : "☆ Guardar favorito";
  favorite.setAttribute("aria-pressed", String(isFavorite));
}

function renderArticle(article, updateUrl = true) {
  if (!article) return;
  activeArticle = article;
  catalogSection.hidden = true;
  articleView.hidden = false;
  articleView.replaceChildren();
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("id", article.id);
    history.pushState({ pythonArticle: article.id }, "", url);
  }

  const category = categoryFor(article.category);
  const header = node("header", "python-article-hero");
  const back = node("button", "python-back-button", "← Volver a los artículos");
  back.type = "button";
  back.addEventListener("click", showCatalog);
  const eyebrow = node("div", "eyebrow", "PYTHON / " + (category?.title || "DOCUMENTACIÓN").toUpperCase());
  const title = node("h1", "", article.title);
  const lead = node("p", "", article.summary);
  const meta = node("div", "python-article-meta");
  meta.append(node("span", "", article.level), node("span", "", "Python 3"), node("span", "", "Ejemplos comentados"));
  const actions = node("div", "python-article-actions");
  const favorite = node("button", "python-action-button", "☆ Guardar favorito");
  favorite.type = "button";
  favorite.id = "pythonFavorite";
  favorite.addEventListener("click", () => toggleFavorite(article.id));
  const complete = node("button", "python-action-button primary", "Marcar como completado");
  complete.type = "button";
  complete.id = "pythonMarkComplete";
  complete.addEventListener("click", () => toggleCompleted(article.id));
  actions.append(favorite, complete);
  header.append(back, eyebrow, title, lead, meta, actions);

  const body = node("div", "python-article-body");
  const purpose = node("div", "python-purpose-copy", article.purpose || "");
  addSection(body, "python-concept", "¿Qué es y para qué sirve?", purpose);

  const syntax = node("div", "python-syntax-content");
  syntax.append(node("p", "", "Esta es la forma básica de escribir el concepto. Revisá la indentación y los nombres antes de adaptar el patrón a tu programa."));
  addCodeBlock(syntax, article.syntax, "SINTAXIS DE REFERENCIA", article.id, 0);
  addSection(body, "python-syntax", "Sintaxis y forma de uso", syntax);

  const examplesSection = node("div", "python-examples");
  (article.examples || []).forEach((example, index) => {
    const card = node("article", "python-example-card");
    card.append(node("h3", "", (index + 1) + ". " + example.title));
    card.append(node("p", "python-example-description", example.description || ""));
    addCodeBlock(card, example.code, "EJEMPLO " + (index + 1), article.id, index + 1);
    card.append(node("p", "python-example-explanation", example.explanation || ""));
    examplesSection.append(card);
  });
  addSection(body, "python-examples-section", "Ejemplos prácticos comentados", examplesSection);

  addListSection(body, "python-best-practices", "Buenas prácticas", article.bestPractices);
  addListSection(body, "python-mistakes", "Errores frecuentes", article.commonMistakes);

  const exercise = node("div", "python-exercise-card");
  exercise.append(node("span", "python-exercise-label", "PONÉ A PRUEBA LO APRENDIDO"));
  exercise.append(node("h3", "", "Práctica para resolver"));
  exercise.append(node("p", "", article.exercise || "Creá un pequeño programa que utilice este concepto."));
  const hintButton = node("button", "python-hint-toggle", "Mostrar pista");
  hintButton.type = "button";
  hintButton.setAttribute("aria-expanded", "false");
  const hint = node("p", "python-hint", "Pista: " + (article.hint || "Revisá los ejemplos anteriores."));
  hint.hidden = true;
  hintButton.addEventListener("click", () => {
    hint.hidden = !hint.hidden;
    hintButton.textContent = hint.hidden ? "Mostrar pista" : "Ocultar pista";
    hintButton.setAttribute("aria-expanded", String(!hint.hidden));
  });
  exercise.append(hintButton, hint);
  addSection(body, "python-exercise", "Práctica", exercise);

  if (Array.isArray(article.resources) && article.resources.length) {
    const resources = node("div", "python-resource-list");
    article.resources.forEach(resource => {
      if (resource.url) resources.append(makeLink(resource.label || resource.url, resource.url));
    });
    addSection(body, "python-resources", "Documentación para profundizar", resources);
  }

  const navigation = node("nav", "python-article-navigation");
  navigation.setAttribute("aria-label", "Navegación entre artículos");
  const categoryArticles = articles.filter(item => item.category === article.category);
  const position = categoryArticles.findIndex(item => item.id === article.id);
  const previous = categoryArticles[position - 1];
  const next = categoryArticles[position + 1];
  const previousButton = node("button", "python-nav-article", previous ? "← " + previous.title : "← Inicio de categoría");
  const nextButton = node("button", "python-nav-article next", next ? next.title + " →" : "Fin de categoría →");
  previousButton.type = nextButton.type = "button";
  previousButton.disabled = !previous;
  nextButton.disabled = !next;
  previousButton.addEventListener("click", () => previous && renderArticle(previous));
  nextButton.addEventListener("click", () => next && renderArticle(next));
  navigation.append(previousButton, nextButton);

  articleView.append(header, body, navigation);
  updateArticleActions();
  articleView.scrollIntoView({ behavior: "smooth", block: "start" });
  document.title = article.title + " | Python | WebDev Book";
  announce("Artículo abierto: " + article.title);
}

function showCatalog(updateUrl = true) {
  activeArticle = null;
  articleView.hidden = true;
  catalogSection.hidden = false;
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.delete("id");
    history.pushState({}, "", url);
  }
  document.title = "Biblioteca de Python | WebDev Book";
  renderCatalog();
  catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
  announce("Catálogo de Python.");
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".python-filter").forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderCatalog();
}

function bindEvents() {
  searchInput.addEventListener("input", renderCatalog);
  categoryFilter.addEventListener("change", renderCatalog);
  document.querySelectorAll(".python-filter").forEach(button => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });
  catalogNode.addEventListener("click", event => {
    const button = event.target.closest("[data-article]");
    if (!button) return;
    const article = articles.find(item => item.id === button.dataset.article);
    if (article) renderArticle(article);
  });
  window.addEventListener("popstate", () => {
    const id = new URLSearchParams(location.search).get("id");
    const article = articles.find(item => item.id === id);
    if (article) renderArticle(article, false);
    else showCatalog(false);
  });
}

async function init() {
  try {
    const response = await fetch("../data/python.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar la biblioteca de Python (HTTP " + response.status + ").");
    database = await response.json();
    categories = Array.isArray(database.categories) ? database.categories : [];
    articles = Array.isArray(database.articles) ? database.articles : [];
    if (!categories.length || !articles.length) throw new Error("El catálogo de Python está vacío o incompleto.");

    categoryFilter.replaceChildren(node("option", "", "Todas las categorías"));
    categoryFilter.firstElementChild.value = "";
    categories.forEach(category => {
      const option = node("option", "", category.title);
      option.value = category.id;
      categoryFilter.append(option);
    });

    bindEvents();
    renderCatalog();
    const requestedId = new URLSearchParams(location.search).get("id");
    const requestedArticle = articles.find(article => article.id === requestedId);
    if (requestedArticle) renderArticle(requestedArticle, false);
  } catch (error) {
    resultCount.textContent = error.message || "No se pudo cargar el catálogo.";
    catalogNode.replaceChildren(node("p", "python-empty-state", resultCount.textContent));
    announce(resultCount.textContent);
  }
}

init();
})();