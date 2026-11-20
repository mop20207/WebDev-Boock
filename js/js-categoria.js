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

    list.innerHTML = category.items.map((item, index) => `
      <article class="js-subtopic">
        <span class="js-subtopic-number">${String(index + 1).padStart(2, "0")}</span>
        <div class="js-subtopic-copy">
          <h3>${item}</h3>
          <p>Contenido incluido en esta categoría</p>
        </div>
        <span class="js-subtopic-status">EN EL ÍNDICE</span>
      </article>
    `).join("");
  } catch (error) {
    title.textContent = "No se pudo cargar la categoría";
    description.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    list.innerHTML = '<p class="js-subtopic-error">El catálogo de JavaScript no está disponible en este momento.</p>';
    console.error(error);
  }
});