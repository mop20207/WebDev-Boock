(() => {
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const catalogNode = $("#consoleCategoryGrid");
const catalogSection = $(".console-catalog-section");
const articleView = $("#consoleArticleView");
const searchInput = $("#consoleSearch");
const categoryFilter = $("#consoleCategoryFilter");
const resultCount = $("#consoleResultCount");
const statusNode = $("#consoleStatus");
const STORAGE_PROGRESS = "webdevbook.console.progress.v1";
const STORAGE_FAVORITES = "webdevbook.console.favorites.v1";

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
  $("#consoleArticleTotal").textContent = String(articles.length);
  $("#consoleCategoryTotal").textContent = String(categories.length);
  $("#consoleCompletedTotal").textContent = String(done);
  $("#consoleFavoriteTotal").textContent = String(favoriteCount);
  $("#consoleProgressLabel").textContent = done + " de " + articles.length + " artículos completados";
  const progress = Math.round((done / Math.max(articles.length, 1)) * 100);
  $("#consoleProgressLabel").setAttribute("aria-label", "Progreso de lectura: " + progress + "%");
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
  const card = node("article", "console-topic-card");
  const category = categoryFor(article.category);
  const meta = node("div", "console-topic-meta");
  meta.append(
    node("span", "console-topic-level level-" + (article.level || "Inicial").toLowerCase(), article.level || "Inicial"),
    node("span", "console-topic-number", String(articles.indexOf(article) + 1).padStart(2, "0"))
  );
  const heading = node("h3", "", article.title);
  const summary = node("p", "", article.summary);
  const tags = node("div", "console-topic-tags");
  tags.append(node("span", "", category ? category.title : "Consola"));
  if (favorites.has(article.id)) tags.append(node("span", "is-favorite-tag", "★ Favorito"));
  const footer = node("div", "console-topic-footer");
  const state = node("span", "console-topic-state", completed.has(article.id) ? "✓ Completado" : "Pendiente");
  const open = node("button", "console-topic-open", "Estudiar artículo →");
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

    const group = node("section", "console-category-group");
    const heading = node("div", "console-category-heading");
    const titleWrap = node("div", "console-category-title-wrap");
    titleWrap.append(
      node("span", "console-category-icon", category.icon || "▦"),
      node("div", "", "")
    );
    const titleBox = titleWrap.lastElementChild;
    titleBox.append(node("h2", "", category.title), node("p", "", category.description));
    heading.append(titleWrap, node("span", "console-category-count", items.length + (items.length === 1 ? " artículo" : " artículos")));
    const cards = node("div", "console-topic-grid");
    items.forEach(article => cards.append(makeArticleCard(article)));
    group.append(heading, cards);
    catalogNode.append(group);
  });

  resultCount.textContent = visible.length + " de " + articles.length + " artículos";
  if (!visible.length) {
    catalogNode.append(node("p", "console-empty-state", "No encontramos artículos con esos filtros. Probá con otro término o limpiá los filtros."));
  }
  updateProgress();
}

function addSection(parent, id, title, contents) {
  const section = node("section", "console-article-section");
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
  const wrapper = node("div", "console-code-example");
  const toolbar = node("div", "console-code-toolbar");
  toolbar.append(node("span", "console-code-caption", caption || "PYTHON"));
  const actions = node("div", "console-code-actions");
  const copy = node("button", "", "Copiar");
  copy.type = "button";
  copy.addEventListener("click", () => copyText(code, copy));
  const download = node("button", "", "Descargar .js");
  download.type = "button";
  download.addEventListener("click", () => {
    const blob = new Blob([code], { type: "text/x-console;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = node("a");
    anchor.href = url;
    anchor.download = articleId + (index ? "-ejemplo-" + index : "-sintaxis") + ".js";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  actions.append(copy, download);
  toolbar.append(actions);
  const pre = node("pre", "console-code");
  const codeElement = node("code", "language-console", code || "");
  pre.append(codeElement);
  wrapper.append(toolbar, pre);
  parent.append(wrapper);
}

function addListSection(parent, id, title, items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = node("ul", "console-detail-list");
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
  const complete = $("#consoleMarkComplete");
  const favorite = $("#consoleFavorite");
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
    history.pushState({ consoleArticle: article.id }, "", url);
  }

  const category = categoryFor(article.category);
  const header = node("header", "console-article-hero");
  const back = node("button", "console-back-button", "← Volver a los artículos");
  back.type = "button";
  back.addEventListener("click", showCatalog);
  const eyebrow = node("div", "eyebrow", "JAVASCRIPT / " + (category?.title || "DOCUMENTACIÓN").toUpperCase());
  const title = node("h1", "", article.title);
  const lead = node("p", "", article.summary);
  const meta = node("div", "console-article-meta");
  meta.append(node("span", "", article.level), node("span", "", "JavaScript en navegador"), node("span", "", "Ejemplos comentados"));
  const actions = node("div", "console-article-actions");
  const favorite = node("button", "console-action-button", "☆ Guardar favorito");
  favorite.type = "button";
  favorite.id = "consoleFavorite";
  favorite.addEventListener("click", () => toggleFavorite(article.id));
  const complete = node("button", "console-action-button primary", "Marcar como completado");
  complete.type = "button";
  complete.id = "consoleMarkComplete";
  complete.addEventListener("click", () => toggleCompleted(article.id));
  actions.append(favorite, complete);
  header.append(back, eyebrow, title, lead, meta, actions);

  const body = node("div", "console-article-body");
  const purpose = node("div", "console-purpose-copy", article.purpose || "");
  addSection(body, "console-concept", "¿Qué es y para qué sirve?", purpose);

  const syntax = node("div", "console-syntax-content");
  syntax.append(node("p", "", "Esta es la forma básica de escribir el concepto. Revisá la indentación y los nombres antes de adaptar el patrón a tu programa."));
  addCodeBlock(syntax, article.syntax, "SINTAXIS DE REFERENCIA", article.id, 0);
  addSection(body, "console-syntax", "Sintaxis y forma de uso", syntax);

  const examplesSection = node("div", "console-examples");
  (article.examples || []).forEach((example, index) => {
    const card = node("article", "console-example-card");
    card.append(node("h3", "", (index + 1) + ". " + example.title));
    card.append(node("p", "console-example-description", example.description || ""));
    addCodeBlock(card, example.code, "EJEMPLO " + (index + 1), article.id, index + 1);
    card.append(node("p", "console-example-explanation", example.explanation || ""));
    examplesSection.append(card);
  });
  addSection(body, "console-examples-section", "Ejemplos prácticos comentados", examplesSection);

  addListSection(body, "console-best-practices", "Buenas prácticas", article.bestPractices);
  addListSection(body, "console-mistakes", "Errores frecuentes", article.commonMistakes);

  const exercise = node("div", "console-exercise-card");
  exercise.append(node("span", "console-exercise-label", "PONÉ A PRUEBA LO APRENDIDO"));
  exercise.append(node("h3", "", "Práctica para resolver"));
  exercise.append(node("p", "", article.exercise || "Creá un pequeño programa que utilice este concepto."));
  const hintButton = node("button", "console-hint-toggle", "Mostrar pista");
  hintButton.type = "button";
  hintButton.setAttribute("aria-expanded", "false");
  const hint = node("p", "console-hint", "Pista: " + (article.hint || "Revisá los ejemplos anteriores."));
  hint.hidden = true;
  hintButton.addEventListener("click", () => {
    hint.hidden = !hint.hidden;
    hintButton.textContent = hint.hidden ? "Mostrar pista" : "Ocultar pista";
    hintButton.setAttribute("aria-expanded", String(!hint.hidden));
  });
  exercise.append(hintButton, hint);
  addSection(body, "console-exercise", "Práctica", exercise);

  if (Array.isArray(article.resources) && article.resources.length) {
    const resources = node("div", "console-resource-list");
    article.resources.forEach(resource => {
      if (resource.url) resources.append(makeLink(resource.label || resource.url, resource.url));
    });
    addSection(body, "console-resources", "Documentación para profundizar", resources);
  }

  const navigation = node("nav", "console-article-navigation");
  navigation.setAttribute("aria-label", "Navegación entre artículos");
  const categoryArticles = articles.filter(item => item.category === article.category);
  const position = categoryArticles.findIndex(item => item.id === article.id);
  const previous = categoryArticles[position - 1];
  const next = categoryArticles[position + 1];
  const previousButton = node("button", "console-nav-article", previous ? "← " + previous.title : "← Inicio de categoría");
  const nextButton = node("button", "console-nav-article next", next ? next.title + " →" : "Fin de categoría →");
  previousButton.type = nextButton.type = "button";
  previousButton.disabled = !previous;
  nextButton.disabled = !next;
  previousButton.addEventListener("click", () => previous && renderArticle(previous));
  nextButton.addEventListener("click", () => next && renderArticle(next));
  navigation.append(previousButton, nextButton);

  articleView.append(header, body, navigation);
  updateArticleActions();
  articleView.scrollIntoView({ behavior: "smooth", block: "start" });
  document.title = article.title + " | Consola | WebDev Book";
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
  document.title = "Biblioteca de Consola | WebDev Book";
  renderCatalog();
  catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
  announce("Catálogo de Consola.");
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".console-filter").forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderCatalog();
}

function bindEvents() {
  searchInput.addEventListener("input", renderCatalog);
  categoryFilter.addEventListener("change", renderCatalog);
  document.querySelectorAll(".console-filter").forEach(button => {
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
    const response = await fetch("../data/console.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar la biblioteca de Consola (HTTP " + response.status + ").");
    database = await response.json();
    categories = Array.isArray(database.categories) ? database.categories : [];
    articles = Array.isArray(database.articles) ? database.articles : [];
    if (!categories.length || !articles.length) throw new Error("El catálogo de Consola está vacío o incompleto.");

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
    catalogNode.replaceChildren(node("p", "console-empty-state", resultCount.textContent));
    announce(resultCount.textContent);
  }
}

init();
})();