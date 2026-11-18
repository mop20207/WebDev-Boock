// Carga los artículos desde el archivo JSON para mantener el contenido separado de la interfaz.
const categoryNames = {
  estructura: "Estructura del documento",
  etiquetas: "Etiquetas HTML",
  atributos: "Atributos HTML",
  formularios: "Formularios",
  multimedia: "Contenido multimedia"
};

// Escapa texto antes de insertarlo en el HTML generado.
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[char]));

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const title = document.getElementById("articleTitle");
  const body = document.getElementById("articleBody");
  const menu = document.getElementById("articleJump");
  const previousLink = document.getElementById("previousArticle");
  const nextLink = document.getElementById("nextArticle");

  // Carga el catálogo JSON que contiene los 39 artículos nuevos.
  let database;
  try {
    const response = await fetch("../data/html-articulos.json");
    if (!response.ok) throw new Error("No se pudo cargar la base de artículos.");
    database = await response.json();
  } catch (error) {
    title.textContent = "No se pudo cargar el artículo";
    document.getElementById("articleLead").textContent = "Revisá la conexión y volvé a intentarlo.";
    body.innerHTML = '<section class="article-section"><p>La biblioteca de artículos no está disponible en este momento.</p></section>';
    return;
  }

  const articles = database.articles;
  const article = articles[id];

  // El menú permite saltar directamente a cualquiera de los artículos disponibles.
  const grouped = {};
  Object.values(articles).forEach(item => {
    (grouped[item.categoryTitle] ||= []).push(item);
  });
  menu.innerHTML = '<option value="">Ir directamente a una etiqueta o tema…</option>' +
    Object.entries(grouped).map(([group, items]) =>
      '<optgroup label="' + escapeHTML(group) + '">' +
      items.map(item => '<option value="' + escapeHTML(item.id) + '">' +
        escapeHTML(item.title) + '</option>').join("") +
      '</optgroup>'
    ).join("");
  menu.addEventListener("change", () => {
    if (menu.value) location.href = "articulo.html?lenguaje=html&id=" + encodeURIComponent(menu.value);
  });

  if (!article) {
    title.textContent = "Artículo no encontrado";
    document.getElementById("articleLead").textContent = "Este tema todavía no tiene un artículo individual en esta biblioteca.";
    body.innerHTML = '<section class="article-section"><h2>Volver al catálogo</h2><p>Elegí uno de los temas disponibles en las categorías de HTML.</p><a href="html.html">Volver a HTML</a></section>';
    return;
  }

  document.title = article.title + " | HTML | WebDev Book";
  title.textContent = article.title;
  document.getElementById("articleLead").textContent = article.lead;
  document.getElementById("articleKicker").textContent = article.kicker;
  document.getElementById("articleLevel").textContent = "Nivel " + article.level.toLowerCase();
  document.getElementById("articleCrumb").textContent = article.title;

  // Actualiza los enlaces de regreso a la categoría correcta.
  const categoryUrl = "categoria.html?tema=" + encodeURIComponent(article.category);
  const crumb = document.getElementById("categoryCrumb");
  crumb.textContent = article.categoryTitle;
  crumb.href = categoryUrl;
  document.getElementById("backToCategory").href = categoryUrl;
  document.getElementById("footerBack").href = categoryUrl;

  // Construye las secciones de documentación a partir de los campos del JSON.
  const sections = [
    {id:"concepto", title:"¿Qué es y para qué sirve?", html:"<p>" + escapeHTML(article.purpose) + "</p>"},
    {id:"implementacion", title:"¿Cómo se implementa?", html:"<p>" + escapeHTML(article.howTo) + "</p>"},
    {id:"ejemplo", title:"Código: cómo se escribe", html:'<p>Ejemplo de implementación:</p><div class="code-example"><span class="code-caption">CÓDIGO HTML</span><pre><code>' + escapeHTML(article.code) + '</code></pre></div>'},
    {id:"detalles", title:"Detalles importantes", html:"<ul>" + article.details.map(item => "<li>" + escapeHTML(item) + "</li>").join("") + "</ul>"},
    {id:"cuando-no", title:"¿Cuándo no conviene usarlo?", html:'<div class="warning-box">' + escapeHTML(article.avoid) + '</div>'},
    {id:"buenas-practicas", title:"Buenas prácticas", html:'<div class="tip-box"><strong>Consejo:</strong> ' + escapeHTML(article.tip) + '</div><ul><li>Usá el elemento por su significado y no solamente por su apariencia.</li><li>Comprobá que los atributos correspondan al elemento.</li><li>Probá el resultado en distintos tamaños de pantalla y navegadores.</li></ul>'},
    {id:"atributos", title:"Atributos y configuración", html: article.attributes?.length ? '<p>Estos son los atributos y configuraciones más relevantes para este tema. La disponibilidad depende del elemento y de su contexto.</p><div class="attribute-list">' + article.attributes.map(item => '<div class="attribute-item"><code>' + escapeHTML(item.name) + '</code><p>' + escapeHTML(item.description) + '</p></div>').join("") + '</div>' : '<p>Este concepto no tiene atributos propios; revisá los atributos globales y los de los elementos relacionados.</p>'},
    {id:"casos-uso", title:"Cuándo utilizarlo", html:"<ul>" + (article.useCases || []).map(item=>"<li>"+escapeHTML(item)+"</li>").join("") + "</ul>"},
    {id:"errores", title:"Errores frecuentes", html:"<ul>" + (article.pitfalls || []).map(item=>"<li>"+escapeHTML(item)+"</li>").join("") + "</ul>"},
    {id:"accesibilidad", title:"Accesibilidad y compatibilidad", html:"<h3>Accesibilidad</h3><p>"+escapeHTML(article.accessibility || "Evaluá su uso con teclado y tecnologías de asistencia.")+"</p><h3>Compatibilidad</h3><p>"+escapeHTML(article.compatibility || "Verificá el soporte de las funciones avanzadas en los navegadores objetivo.")+"</p>"},
    {id:"relacion", title:"Relación con CSS y JavaScript", html:"<p><strong>HTML:</strong> define la estructura y el significado.</p><p><strong>CSS:</strong> controla la presentación visual.</p><p><strong>JavaScript:</strong> puede leer o modificar el elemento y añadir comportamiento cuando sea necesario.</p>"},
    {id:"relacionados", title:"Temas relacionados", html: article.related?.length ? '<div class="related-list">' + article.related.map(item=>'<a href="articulo.html?lenguaje=html&id='+encodeURIComponent(item.id)+'">'+escapeHTML(item.title)+' <span>↗</span></a>').join("") + '</div>' : '<p>Explorá otros temas del catálogo HTML.</p>'},
    {id:"profundizar", title:"¿Querés profundizar?", html:'<p>Consultá documentación técnica y referencias externas para ampliar este tema.</p><div class="resource-list">' + (article.resources || [{label:"MDN: referencia de elementos HTML",url:"https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements"}]).map(item=>'<a href="'+escapeHTML(item.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(item.label)+' <span>↗</span></a>').join("") + '</div>'}
  ];
  body.innerHTML = sections.map(section =>
    '<section class="article-section" id="' + section.id + '"><h2>' +
    section.title + '</h2>' + section.html + '</section>'
  ).join("");
  document.getElementById("articleToc").innerHTML = sections.map(section =>
    '<a href="#' + section.id + '">' + section.title + '</a>'
  ).join("");

  // Activa navegación secuencial dentro de la categoría actual.
  const go = (link, targetId, label) => {
    if (!targetId || !articles[targetId]) {
      link.hidden = true;
      return;
    }
    link.href = "articulo.html?lenguaje=html&id=" + encodeURIComponent(targetId);
    link.textContent = label + articles[targetId].title;
    link.hidden = false;
  };
  go(previousLink, article.previous, "← Anterior: ");
  go(nextLink, article.next, "Siguiente: → ");
  menu.value = article.id;
});
