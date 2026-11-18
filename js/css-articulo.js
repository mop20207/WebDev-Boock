// Renderiza la documentación completa del tema CSS seleccionado.
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("tema");
  const itemIndex = Number(params.get("item"));
  const title = document.getElementById("articleTitle");
  const lead = document.getElementById("articleLead");
  const body = document.getElementById("articleBody");

  const categoryURL = "css-categoria.html?tema=" + encodeURIComponent(categoryId || "");
  const setBackLinks = (url) => {
    ["backToCategory", "footerBack", "backToTopics"].forEach(id => {
      const link = document.getElementById(id);
      if (link) link.href = url;
    });
  };

  const make = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };

  try {
    const response = await fetch("../data/css-articulos.json");
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de artículos CSS.");
    const database = await response.json();
    const article = database.articles.find(entry =>
      entry.categoryId === categoryId && entry.id === categoryId + "-" + itemIndex
    );

    if (!article) {
      title.textContent = "Tema no encontrado";
      lead.textContent = "Volvé a la categoría y elegí un tema disponible.";
      body.replaceChildren(make("p", "article-error", "No encontramos el contenido solicitado."));
      setBackLinks("css.html");
      return;
    }

    document.title = article.title + " | CSS | WebDev Book";
    title.textContent = article.title;
    lead.textContent = article.summary;
    document.getElementById("categoryCrumb").textContent = article.categoryTitle;
    document.getElementById("categoryCrumb").href = categoryURL;
    document.getElementById("articleCrumb").textContent = article.title;
    setBackLinks(categoryURL);

    const fragment = document.createDocumentFragment();
    article.sections.forEach((section, index) => {
      const sectionElement = make("section", "article-section");
      sectionElement.append(make("h2", "", section.title));
      if (section.body) sectionElement.append(make("p", "article-paragraph", section.body));
      if (section.code) {
        const pre = make("pre", "article-code");
        const code = make("code", "language-" + (section.language || "text"), section.code);
        pre.append(code);
        sectionElement.append(pre);
      }
      if (section.list) {
        const list = make("ul", "article-list");
        section.list.forEach(item => list.append(make("li", "", item)));
        sectionElement.append(list);
      }
      fragment.append(sectionElement);
    });

    const resourcesSection = make("section", "article-section article-resources");
    resourcesSection.append(make("h2", "", "Documentación oficial y recursos"));
    resourcesSection.append(make("p", "article-paragraph", "Consultá estas referencias para ampliar conceptos, revisar sintaxis y comprobar compatibilidad."));
    const resourcesList = make("ul", "article-list");
    article.resources.forEach(url => {
      const li = make("li");
      const link = make("a", "", url.includes("w3.org") ? "Especificación W3C" : "Documentación MDN");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      li.append(link);
      resourcesList.append(li);
    });
    resourcesSection.append(resourcesList);
    fragment.append(resourcesSection);
    body.replaceChildren(fragment);
  } catch (error) {
    title.textContent = "No se pudo cargar el artículo";
    lead.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    body.replaceChildren(make("p", "article-error", error.message));
    console.error(error);
  }
});
