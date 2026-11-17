// Filtros y búsqueda local de artículos para la vista de categoría.
document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("articleSearch");
  const cards = [...document.querySelectorAll(".article-card")];
  const chips = [...document.querySelectorAll(".filter-chip")];
  const empty = document.getElementById("emptyState");
  let activeFilter = "todos";

  // Muestra únicamente las tarjetas que coinciden con el filtro y el texto.
  function updateArticles() {
    const term = (search?.value || "").trim().toLocaleLowerCase("es");
    let visible = 0;
    cards.forEach(card => {
      const matchesText = card.textContent.toLocaleLowerCase("es").includes(term);
      const matchesFilter = activeFilter === "todos" || card.dataset.category === activeFilter;
      const show = matchesText && matchesFilter;
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }

  // Activa el filtro elegido y vuelve a dibujar el catálogo.
  chips.forEach(chip => chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter || "todos";
    chips.forEach(item => item.classList.toggle("active", item === chip));
    updateArticles();
  }));

  search?.addEventListener("input", updateArticles);
});
