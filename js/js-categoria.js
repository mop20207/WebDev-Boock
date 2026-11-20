// Carga el índice de temas de una categoría de JavaScript.
document.addEventListener("DOMContentLoaded", async () => {
  const title = document.getElementById("categoryTitle");
  const description = document.getElementById("categoryDescription");
  const list = document.getElementById("subtopicList");
  const breadcrumb = document.getElementById("categoryBreadcrumb");
  const count = document.getElementById("categoryCount");

  try {
    const response = await fetch("../data/js-categorias.json");
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de JavaScript.");

    const database = await response.json();
    const id = new URLSearchParams(location.search).get("tema");
    const category = database.categories.find(item => item.id === id);

    if (!category) {
      title.textContent = "Categoría no encontrada";
      description.textContent = "Volvé al apartado JavaScript y elegí una de las categorías disponibles.";
      count.textContent = "SIN RESULTADOS";
      list.innerHTML = '<a class="js-subtopic-back" href="javascript.html">Volver a JavaScript →</a>';
      return;
    }

    document.title = category.title + " | JavaScript | WebDev Book";
    title.textContent = category.title;
    description.textContent = category.desc;
    breadcrumb.textContent = category.title;
    count.textContent = category.items.length + (category.items.length === 1 ? " TEMA" : " TEMAS");

    const fragment = document.createDocumentFragment();
    category.items.forEach((item, index) => {
      const link = document.createElement("a");
      link.className = "js-subtopic";
      link.href = "js-articulo.html?tema=" + encodeURIComponent(category.id) + "&item=" + index;

      const number = document.createElement("span");
      number.className = "js-subtopic-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const copy = document.createElement("span");
      copy.className = "js-subtopic-copy";
      const heading = document.createElement("h3");
      heading.textContent = item;
      const summary = document.createElement("p");
      summary.textContent = "Leer explicación, ejemplos y práctica";
      copy.append(heading, summary);

      const status = document.createElement("span");
      status.className = "js-subtopic-status";
      status.textContent = "VER ARTÍCULO ↗";
      link.append(number, copy, status);
      fragment.append(link);
    });
    list.replaceChildren(fragment);
  } catch (error) {
    title.textContent = "No se pudo cargar la categoría";
    description.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    list.innerHTML = '<p class="js-subtopic-error">El catálogo de JavaScript no está disponible en este momento.</p>';
    console.error(error);
  }
});