// Carga el índice de temas de la categoría CSS y enlaza cada tema con su artículo individual.
document.addEventListener("DOMContentLoaded", async () => {
  const title = document.getElementById("categoryTitle");
  const description = document.getElementById("categoryDescription");
  const list = document.getElementById("subtopicList");
  try {
    const response = await fetch("../data/css-categorias.json");
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de CSS.");
    const database = await response.json();
    const id = new URLSearchParams(location.search).get("tema");
    const category = database.categories.find(item => item.id === id);
    if (!category) {
      title.textContent = "Categoría no encontrada";
      description.textContent = "Volvé al apartado CSS y elegí una de las categorías disponibles.";
      list.innerHTML = '<a class="css-subtopic-back" href="css.html">Volver a CSS →</a>';
      return;
    }
    document.title = category.title + " | CSS | WebDev Book";
    title.textContent = category.title;
    description.textContent = category.desc;
    document.getElementById("categoryBreadcrumb").textContent = category.title;
    document.getElementById("categoryCount").textContent = category.items.length + " TEMAS";
    const fragment = document.createDocumentFragment();
    category.items.forEach((item, index) => {
      const link = document.createElement("a");
      link.className = "css-subtopic";
      link.href = "css-articulo.html?tema=" + encodeURIComponent(category.id) + "&item=" + index;

      const number = document.createElement("span");
      number.className = "css-subtopic-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const copy = document.createElement("span");
      copy.className = "css-subtopic-copy";
      const heading = document.createElement("h3");
      heading.textContent = item;
      const summary = document.createElement("p");
      summary.textContent = "Consultar explicación, ejemplos y práctica";
      copy.append(heading, summary);

      const status = document.createElement("span");
      status.className = "css-subtopic-status";
      status.textContent = "VER ARTÍCULO ↗";
      link.append(number, copy, status);
      fragment.append(link);
    });
    list.replaceChildren(fragment);
  } catch (error) {
    title.textContent = "No se pudo cargar la categoría";
    description.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    list.innerHTML = '<p class="css-subtopic-error">El catálogo de CSS no está disponible en este momento.</p>';
    console.error(error);
  }
});