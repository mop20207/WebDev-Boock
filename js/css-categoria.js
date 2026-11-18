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
    list.innerHTML = category.items.map((item,index) =>
      '<a class="css-subtopic" href="css-articulo.html?tema=' + encodeURIComponent(category.id) + '&item=' + index + '">' +
        '<span class="css-subtopic-number">' + String(index+1).padStart(2,"0") + '</span>' +
        '<span class="css-subtopic-copy"><h3>' + item + '</h3><p>Consultar este tema</p></span>' +
        '<span class="css-subtopic-status">VER ARTÍCULO ↗</span>' +
      '</a>'
    ).join("");
  } catch (error) {
    title.textContent = "No se pudo cargar la categoría";
    description.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    list.innerHTML = '<p class="css-subtopic-error">El catálogo de CSS no está disponible en este momento.</p>';
    console.error(error);
  }
});