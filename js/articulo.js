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
    {id:"ejemplo", title:"Código: cómo se escribe", html:'<p>Ejemplo de implementación:</p><div class="code-example"><span class="code-caption">CÓDIGO HTML</span><pre><code class="language-markup">' + escapeHTML(article.code) + '</code></pre></div>'},
    {id:"ejemplos-adicionales", title:"Más ejemplos prácticos", html: (article.exampleVariants || []).map(item => '<div class="code-example"><h3>' + escapeHTML(item.title) + '</h3><p>' + escapeHTML(item.description) + '</p><span class="code-caption">CÓDIGO HTML</span><pre><code class="language-markup">' + escapeHTML(item.code) + '</code></pre></div>').join("") || "<p>Este artículo todavía no incluye ejemplos adicionales.</p>"},
    {id:"laboratorio-html", title:"Laboratorio práctico", html:'<p>Modificá el marcado y ejecutá la vista previa. El laboratorio está aislado: el HTML se muestra, pero los scripts del ejemplo no se ejecutan.</p><div class="html-lab-grid"><div class="html-lab-editor"><label for="htmlLabCode">Tu código HTML</label><textarea id="htmlLabCode" spellcheck="false" aria-label="Editor HTML del laboratorio">' + escapeHTML(article.code || "<h1>Hola, web</h1>\\n<p>Mi primera práctica.</p>") + '</textarea><div class="html-lab-actions"><button type="button" id="runHtmlLab">▶ Ejecutar</button><button type="button" id="resetHtmlLab">Restablecer</button><span id="htmlLabStatus" aria-live="polite">Vista previa lista para ejecutar</span></div></div><div class="html-lab-preview"><label>Resultado</label><iframe id="htmlLabFrame" title="Vista previa del laboratorio HTML" sandbox></iframe></div></div><div class="html-practice-task"><strong>Reto de este artículo</strong><p id="htmlPracticeTask"></p><details><summary>Una pista para empezar</summary><p>' + escapeHTML(article.tip || "Cambiá una parte del marcado, guardá una copia y observá cómo cambia el resultado.") + '</p></details><a class="html-open-editor" href="editor.html">Abrir el editor completo ↗</a></div>'},
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
  // Colorea los ejemplos HTML después de insertarlos en el documento.
  if (window.Prism) Prism.highlightAllUnder(body);
  // Laboratorio HTML: el contenido se muestra en un iframe aislado y sin permisos de script.
  const labEditor = document.getElementById("htmlLabCode");
  const labFrame = document.getElementById("htmlLabFrame");
  const labStatus = document.getElementById("htmlLabStatus");
  const task = document.getElementById("htmlPracticeTask");
  const practiceTasks = {
    estructura: "Convertí el fragmento en una página con doctype, html, head y body. Agregá un título de documento y un h1 para el contenido principal.",
    etiquetas: "Usá el elemento que estás estudiando en un contexto real. Completá el contenido y agregá los atributos necesarios para que tenga sentido.",
    atributos: "Probá distintos valores del atributo de este artículo. Observá qué cambia y verificá si el valor elegido es válido para el elemento.",
    formularios: "Construí un formulario pequeño con etiquetas label asociadas a cada control, atributos name y al menos una validación nativa.",
    multimedia: "Agregá un recurso multimedia con una alternativa apropiada: texto alternativo, subtítulos, transcripción o contenido de respaldo.",
    semantica: "Organizá el contenido en header, nav, main, section, article o footer según la función real de cada bloque.",
    accesibilidad: "Revisá nombres accesibles, textos alternativos, etiquetas y orden de lectura. Intentá completar la práctica únicamente con el teclado.",
    retos: "Construí una pequeña página que use el concepto estudiado, tenga estructura semántica y funcione en una pantalla estrecha."
  };
  if (task) task.textContent = practiceTasks[article.category] || ("Partiendo del ejemplo de «" + article.title + "», creá una variante propia, modificá el contenido y comprobá que el marcado siga siendo válido.");
  const runHtmlLab = () => {
    if (!labEditor || !labFrame) return;
    const source = labEditor.value;
    const completeDocument = /<!doctype|<html[\\s>]/i.test(source)
      ? source
      : '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;line-height:1.55;padding:1rem;color:#1e293b}img,video{max-width:100%;height:auto}a{color:#2457c5}</style></head><body>' + source + '</body></html>';
    labFrame.srcdoc = completeDocument;
    if (labStatus) labStatus.textContent = "Vista previa actualizada";
  };
  document.getElementById("runHtmlLab")?.addEventListener("click", runHtmlLab);
  document.getElementById("resetHtmlLab")?.addEventListener("click", () => {
    if (labEditor) labEditor.value = article.code || "";
    runHtmlLab();
    if (labStatus) labStatus.textContent = "Código original restaurado";
  });
  labEditor?.addEventListener("input", () => {
    if (labStatus) labStatus.textContent = "Hay cambios sin ejecutar";
  });
  runHtmlLab();

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
