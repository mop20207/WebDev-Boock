// Catálogo de temas y futuros artículos de CSS.
document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch("../data/css-categorias.json");
  if (!response.ok) throw new Error("No se pudo cargar el catálogo de CSS.");
  const database = await response.json();
  const id = new URLSearchParams(location.search).get("tema");
  const category = database.categories.find(item => item.id === id);
  const title = document.getElementById("categoryTitle");
  const description = document.getElementById("categoryDescription");
  const list = document.getElementById("subtopicList");
  if (!category) {
    title.textContent = "Categoría no encontrada";
    description.textContent = "Volvé al apartado CSS y elegí una de las categorías disponibles.";
    list.innerHTML = '<a class="css-subtopic-back" href="css.html">Volver a CSS →</a>';
    return;
  }
  document.title = category.title + " | CSS | WebDev Book";
  title.textContent = category.title;
  description.textContent = category.description;
  document.getElementById("categoryBreadcrumb").textContent = category.title;
  document.getElementById("categoryCount").textContent = category.items.length + " TEMAS";
  list.innerHTML = category.items.map((item,index) =>
    '<article class="css-subtopic"><span class="css-subtopic-number">' + String(index+1).padStart(2,"0") + '</span><div><h3>' + item + '</h3><p>Artículo de esta sección · En preparación</p></div><span class="css-subtopic-status">PRÓXIMAMENTE</span></article>'
  ).join("");
});