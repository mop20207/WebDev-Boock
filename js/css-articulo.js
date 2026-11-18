// Carga el tema individual seleccionado desde el catálogo de CSS.
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("tema");
  const itemIndex = Number(params.get("item"));
  const title = document.getElementById("articleTitle");
  const lead = document.getElementById("articleLead");
  try {
    const response = await fetch("../data/css-categorias.json");
    if (!response.ok) throw new Error("No se pudo cargar el catálogo.");
    const database = await response.json();
    const category = database.categories.find(item => item.id === categoryId);
    const item = Number.isInteger(itemIndex) && itemIndex >= 0 ? category?.items[itemIndex] : null;
    if (!category || !item) {
      title.textContent = "Tema no encontrado";
      lead.textContent = "Volvé al apartado CSS y elegí un tema disponible.";
      document.getElementById("backToCategory").href = "css.html";
      document.getElementById("footerBack").href = "css.html";
      return;
    }
    document.title = item + " | CSS | WebDev Book";
    title.textContent = item;
    lead.textContent = "Este tema forma parte de " + category.title + ".";
    const categoryURL = "css-categoria.html?tema=" + encodeURIComponent(category.id);
    const crumb = document.getElementById("categoryCrumb");
    crumb.textContent = category.title;
    crumb.href = categoryURL;
    document.getElementById("backToCategory").href = categoryURL;
    document.getElementById("footerBack").href = categoryURL;
    document.getElementById("backToTopics").href = categoryURL;
    document.getElementById("articleCrumb").textContent = item;
  } catch (error) {
    title.textContent = "No se pudo cargar el artículo";
    lead.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    console.error(error);
  }
});