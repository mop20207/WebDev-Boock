// Catálogo de demostración de artículos para cada categoría HTML.
const categoryContent = {
  fundamentos:{title:"Fundamentos de HTML",description:"Conocé qué es HTML, cómo funciona el lenguaje de marcado y cuáles son sus conceptos esenciales.",items:[
    ["html","¿Qué es HTML?","Comprendé el papel de HTML en la construcción de páginas web.","conceptos"],
    ["elemento-etiqueta","Etiquetas y elementos","Aprendé la diferencia entre etiqueta de apertura, contenido y etiqueta de cierre.","conceptos"],
    ["anatomia-elemento","Anatomía de un elemento","Reconocé las partes que componen un elemento HTML.","conceptos"],
    ["anidamiento","Anidamiento de elementos","Organizá elementos dentro de otros respetando la estructura.","conceptos"],
    ["elementos-vacios","Elementos vacíos","Conocé elementos que no necesitan etiqueta de cierre.","conceptos"],
    ["comentarios-html","Comentarios en HTML","Agregá notas al código que no se muestran en la página.","conceptos"],
    ["doctype","DOCTYPE","Indicá al navegador que el documento utiliza HTML moderno.","elementos"],
    ["primer-documento","Tu primer documento","Construí una página HTML sencilla desde cero.","practica"]
  ]},
  estructura:{title:"Estructura del documento",description:"Descubrí cómo se organiza un documento HTML desde la declaración inicial hasta el contenido visible.",items:[
    ["doctype","DOCTYPE HTML","Declara que el documento utiliza HTML moderno.","conceptos"],
    ["html","<html>","Elemento raíz que envuelve todo el documento.","elementos"],
    ["lang","lang","Define el idioma principal del documento.","atributos"],
    ["head","<head>","Contiene metadatos y referencias a recursos.","elementos"],
    ["meta","<meta>","Define metadatos como codificación, viewport y descripción.","elementos"],
    ["title","<title>","Establece el título de la pestaña del navegador.","elementos"],
    ["link","<link>","Relaciona el documento con hojas de estilo e iconos.","elementos"],
    ["style","<style>","Permite incluir reglas CSS dentro del documento.","elementos"],
    ["base","<base>","Establece la URL base para direcciones relativas.","elementos"],
    ["script","<script>","Incorpora o enlaza código JavaScript.","elementos"],
    ["noscript","<noscript>","Ofrece contenido alternativo si JavaScript no está disponible.","elementos"],
    ["body","<body>","Contiene el contenido visible e interactivo.","elementos"],
    ["viewport","Meta viewport","Configura el área de visualización para diseños adaptables.","conceptos"],
    ["charset","Codificación UTF-8","Permite representar correctamente caracteres y símbolos.","conceptos"],
    ["meta-seo","Metadatos SEO","Configurá descripción, autor y otros datos que ayudan a describir la página.","conceptos"],
    ["open-graph","Open Graph","Definí cómo se presenta una página al compartirla en redes sociales.","conceptos"],
    ["favicon","Favicon","Agregá el icono que identifica tu sitio en pestañas y marcadores.","conceptos"],
    ["preload","Preload y preconnect","Conocé las pistas de recursos que ayudan a preparar conexiones y cargas importantes.","conceptos"],
    ["async-defer","async y defer","Comprendé las diferencias entre las formas de cargar scripts externos.","atributos"],
    ["type-module","Scripts como módulos","Utilizá type=module para trabajar con módulos JavaScript desde HTML.","atributos"],
    ["estructura-completa","Documento HTML completo","Reuní las partes del documento en una estructura funcional.","practica"],
  ]},
  etiquetas:{title:"Etiquetas HTML",description:"Explorá los elementos HTML y aprendé qué función cumple cada uno al estructurar el contenido.",items:[
    ["headings","<h1> a <h6>","Títulos y subtítulos organizados jerárquicamente.","elementos"],
    ["p","<p>","Párrafos de texto.","elementos"],
    ["br","<br>","Salto de línea dentro de un texto.","elementos"],
    ["hr","<hr>","Separación temática entre contenidos.","elementos"],
    ["a","<a>","Enlaces a páginas, archivos o fragmentos.","elementos"],
    ["ul","<ul>","Lista sin orden numérico.","elementos"],
    ["ol","<ol>","Lista ordenada por números o letras.","elementos"],
    ["li","<li>","Elemento individual de una lista.","elementos"],
    ["dl","<dl>, <dt>, <dd>","Lista de términos y descripciones.","elementos"],
    ["div","<div>","Contenedor genérico de bloque sin semántica propia.","elementos"],
    ["span","<span>","Contenedor genérico en línea.","elementos"],
    ["strong","<strong>","Marca contenido de gran importancia.","elementos"],
    ["em","<em>","Marca énfasis en el texto.","elementos"],
    ["blockquote","<blockquote>","Representa una cita extensa.","elementos"],
    ["q","<q>","Representa una cita breve en línea.","elementos"],
    ["pre","<pre>","Conserva espacios y saltos de línea.","elementos"],
    ["code","<code>","Representa fragmentos de código.","elementos"],
    ["figure","<figure> y <figcaption>","Agrupa contenido ilustrativo con su leyenda.","elementos"],
    ["abbr","<abbr>","Representa una abreviatura o acrónimo.","elementos"],
    ["time","<time>","Representa fecha u hora legible por máquinas.","elementos"],
    ["mark","<mark>","Resalta una parte relevante del texto.","elementos"],
    ["del-ins","<del> y <ins>","Representan contenido eliminado o añadido.","elementos"],
    ["sub-sup","<sub> y <sup>","Representan subíndices y superíndices.","elementos"],
    ["table","<table>","Crea una tabla de datos.","elementos"],
    ["img","<img>","Inserta una imagen en el documento.","elementos"],
    ["form","<form>","Agrupa controles para recopilar y enviar datos.","elementos"],
    ["details","<details> y <summary>","Crea un panel desplegable nativo.","elementos"],
    ["progress","<progress>","Representa el progreso de una tarea.","elementos"],
    ["meter","<meter>","Representa una medida dentro de un rango conocido.","elementos"],
    ["text-kbd","<kbd>","Representa una entrada realizada mediante teclado.","elementos"],
    ["text-samp","<samp>","Representa la salida de un programa o sistema.","elementos"],
    ["text-cite","<cite>","Identifica el título de una obra creativa citada.","elementos"],
    ["text-small","<small>","Representa comentarios secundarios o letra pequeña.","elementos"],
    ["text-dfn","<dfn>","Marca el término que se está definiendo.","elementos"],
    ["text-s","<s>","Representa contenido que dejó de ser relevante o correcto.","elementos"],
    ["text-wbr","<wbr>","Indica un posible punto de salto de línea.","elementos"],
    ["text-data","<data>","Asocia un contenido visible con un valor legible por máquinas.","elementos"],
    ["table-caption","<caption>","Añade un título o descripción breve a una tabla.","elementos"],
    ["table-sections","<thead>, <tbody> y <tfoot>","Dividen una tabla en encabezado, cuerpo y pie.","elementos"],
    ["table-row","<tr>","Define una fila dentro de una tabla.","elementos"],
    ["table-cells","<th> y <td>","Crean celdas de encabezado y celdas de datos.","elementos"],
    ["table-columns","<colgroup> y <col>","Permiten agrupar y configurar columnas de una tabla.","elementos"],
    ["template","<template>","Guarda contenido HTML que no se representa hasta que se utiliza.","elementos"], 
    ["table-spans","colspan y rowspan","Permiten que una celda abarque varias columnas o filas.","conceptos"],
  ]},
  atributos:{title:"Atributos HTML",description:"Aprendé a configurar los elementos HTML mediante atributos globales y atributos específicos.",items:[
    ["globales","Atributos globales","Atributos utilizables en la mayoría de elementos HTML.","conceptos"],
    ["id","id","Identificador único dentro del documento.","atributos"],
    ["class","class","Agrupa elementos para aplicar estilos o seleccionarlos.","atributos"],
    ["style","style","Aplica CSS directamente a un elemento.","atributos"],
    ["title","title","Añade información complementaria.","atributos"],
    ["lang","lang","Define el idioma del contenido.","atributos"],
    ["dir","dir","Indica la dirección de escritura.","atributos"],
    ["hidden","hidden","Oculta un elemento del renderizado.","atributos"],
    ["tabindex","tabindex","Controla la participación y el orden del foco.","atributos"],
    ["contenteditable","contenteditable","Permite editar el contenido en el navegador.","atributos"],
    ["draggable","draggable","Indica si un elemento puede arrastrarse.","atributos"],
    ["data","data-*","Almacena datos personalizados.","atributos"],
    ["href","href","Define el destino de un enlace.","atributos"],
    ["target","target","Indica dónde se abre el destino.","atributos"],
    ["rel","rel","Describe la relación con el recurso enlazado.","atributos"],
    ["src","src","Indica la dirección de un recurso.","atributos"],
    ["alt","alt","Proporciona alternativa textual para imágenes.","atributos"],
    ["width-height","width y height","Definen dimensiones de elementos compatibles.","atributos"],
    ["name","name","Identifica datos de controles al enviar formularios.","atributos"],
    ["value","value","Define el valor de un control.","atributos"],
    ["type","type","Determina el tipo de control o recurso.","atributos"],
    ["placeholder","placeholder","Muestra una sugerencia dentro de un campo.","atributos"],
    ["required","required","Indica que un campo debe completarse.","atributos"],
    ["disabled","disabled","Deshabilita un control compatible.","atributos"],
    ["checked","checked","Marca inicialmente controles seleccionables.","atributos"],
    ["readonly","readonly","Impide editar el valor de un control.","atributos"],
    ["multiple","multiple","Permite seleccionar varios valores.","atributos"],
    ["min-max","min y max","Establecen límites numéricos o temporales.","atributos"],
    ["minlength-maxlength","minlength y maxlength","Establecen límites de longitud de texto.","atributos"],
    ["pattern","pattern","Valida un valor mediante una expresión regular.","atributos"],
    ["aria","aria-*","Añade información accesible cuando es necesario.","conceptos"],
    ["booleanos","Atributos booleanos","Se activan por su presencia, sin necesitar true o false.","conceptos"],
    ["autocomplete","autocomplete","Sugiere o permite completar valores de formularios automáticamente.","atributos"],
    ["novalidate","novalidate","Desactiva la validación nativa al enviar un formulario.","atributos"],
    ["formaction","formaction","Sobrescribe la dirección de envío para un botón de formulario.","atributos"],
    ["formmethod","formmethod","Sobrescribe el método HTTP para un botón de envío.","atributos"],
    ["formenctype","formenctype","Sobrescribe la codificación de datos para un botón de envío.","atributos"],
    ["popover","popover","Convierte un elemento en un panel emergente controlable desde HTML.","atributos"],
  ]},
  formularios:{title:"Formularios",description:"Aprendé a crear formularios para recopilar información de los usuarios. Conocé sus controles, atributos, tipos de campos y herramientas de validación.",items:[
    ["form","<form>","Agrupa controles y define cómo se envían los datos.","elementos"],
    ["action","action","Indica la dirección que recibirá los datos.","atributos"],
    ["method","method","Define el método HTTP, normalmente GET o POST.","atributos"],
    ["enctype","enctype","Define cómo se codifican los datos enviados.","atributos"],
    ["input","<input>","Crea campos de entrada de distintos tipos.","elementos"],
    ["input-text","input type=text","Permite introducir texto de una sola línea.","elementos"],
    ["input-email","input type=email","Permite introducir y validar un correo.","elementos"],
    ["input-password","input type=password","Permite introducir texto ocultando caracteres.","elementos"],
    ["input-number","input type=number","Permite introducir un valor numérico.","elementos"],
    ["input-date","input type=date","Permite seleccionar una fecha.","elementos"],
    ["input-search","input type=search","Crea un campo pensado para introducir términos de búsqueda.","elementos"],
    ["input-tel","input type=tel","Crea un campo para introducir números telefónicos.","elementos"],
    ["input-url","input type=url","Crea un campo para introducir y validar direcciones web.","elementos"],
    ["input-range","input type=range","Permite elegir un valor dentro de un intervalo mediante un control deslizante.","elementos"],
    ["input-color","input type=color","Permite seleccionar un color.","elementos"],
    ["input-time","input type=time","Permite seleccionar una hora.","elementos"],
    ["input-month","input type=month","Permite seleccionar un mes y año.","elementos"],
    ["input-week","input type=week","Permite seleccionar una semana de un año.","elementos"],
    ["input-datetime-local","input type=datetime-local","Permite seleccionar fecha y hora local.","elementos"],
    ["input-checkbox","input type=checkbox","Permite activar o desactivar una opción.","elementos"],
    ["input-radio","input type=radio","Permite elegir una opción dentro de un grupo.","elementos"],
    ["input-file","input type=file","Permite seleccionar archivos.","elementos"],
    ["input-submit","input type=submit","Crea un control para enviar el formulario.","elementos"],
    ["label","<label>","Asocia texto descriptivo con un control.","elementos"],
    ["textarea","<textarea>","Permite introducir texto de varias líneas.","elementos"],
    ["select","<select>","Crea una lista de opciones seleccionables.","elementos"],
    ["option","<option>","Define una opción dentro de una lista.","elementos"],
    ["optgroup","<optgroup>","Agrupa opciones relacionadas.","elementos"],
    ["button","<button>","Crea botones para enviar, reiniciar o ejecutar acciones.","elementos"],
    ["fieldset","<fieldset>","Agrupa controles relacionados.","elementos"],
    ["legend","<legend>","Proporciona un título al grupo fieldset.","elementos"],
    ["datalist","<datalist>","Ofrece sugerencias para un campo.","elementos"],
    ["output","<output>","Representa el resultado de un cálculo o acción.","elementos"],
    ["required","required","Hace obligatorio completar un control.","atributos"],
    ["placeholder","placeholder","Muestra una pista sobre el dato esperado.","atributos"],
    ["pattern","pattern","Valida el valor mediante una expresión regular.","atributos"],
    ["min-max","min y max","Establece valores mínimos y máximos permitidos.","atributos"],
    ["validacion","Validación nativa","Conocé las reglas que aplica el navegador.","conceptos"],
    ["formdata","Envío y FormData","Comprendé cómo se agrupan los valores para enviarlos.","conceptos"],
  ]},
  multimedia:{title:"Contenido multimedia",description:"Incorporá imágenes, audio, vídeo y contenido externo para enriquecer tus páginas web.",items:[
    ["img","<img>","Inserta imágenes con una alternativa textual.","elementos"],
    ["alt","Atributo alt","Describe el contenido o propósito de una imagen.","atributos"],
    ["picture","<picture>","Permite elegir imágenes alternativas según condiciones.","elementos"],
    ["source","<source>","Proporciona archivos alternativos para picture, audio o video.","elementos"],
    ["srcset","srcset","Ofrece varias resoluciones o fuentes de imagen.","atributos"],
    ["sizes","sizes","Describe el tamaño previsto para imágenes adaptables.","atributos"],
    ["loading","loading","Permite indicar carga diferida de recursos compatibles.","atributos"],
    ["audio","<audio>","Incorpora audio reproducible en la página.","elementos"],
    ["video","<video>","Incorpora vídeo con controles y opciones de reproducción.","elementos"],
    ["controls","controls","Muestra controles nativos de reproducción.","atributos"],
    ["autoplay","autoplay","Solicita reproducción automática cuando el navegador lo permite.","atributos"],
    ["muted","muted","Inicia el audio silenciado.","atributos"],
    ["loop","loop","Repite el contenido al finalizar.","atributos"],
    ["poster","poster","Define una imagen previa para un vídeo.","atributos"],
    ["track","<track>","Añade subtítulos y pistas de texto temporizadas.","elementos"],
    ["iframe","<iframe>","Incrusta otro documento o contenido externo.","elementos"],
    ["sandbox","sandbox","Aplica restricciones al contenido de un iframe.","atributos"],
    ["figure","<figure>","Agrupa una imagen u otro contenido independiente.","elementos"],
    ["figcaption","<figcaption>","Añade una leyenda a una figura.","elementos"],
    ["map","<map>","Define un mapa de imagen con áreas interactivas.","elementos"],
    ["area","<area>","Define una región interactiva dentro de un mapa de imagen.","elementos"],
    ["embed","<embed>","Incrusta contenido externo compatible.","elementos"],
    ["object","<object>","Representa un recurso externo en el documento.","elementos"],
    ["fallback","Contenido alternativo","Planificá una alternativa cuando el recurso no se pueda mostrar.","conceptos"],
    ["media-formats","Formatos de audio y vídeo","Compará formatos habituales y consideraciones de compatibilidad.","conceptos"],
    ["responsive-images","Imágenes adaptables","Combiná picture, srcset y sizes para servir imágenes apropiadas a cada pantalla.","conceptos"],
    ["media-accessibility","Accesibilidad multimedia","Añadí subtítulos, transcripciones y alternativas para contenido audiovisual.","conceptos"],
  ]},
  svg:{title:"SVG",description:"Aprendé a crear gráficos vectoriales escalables directamente en HTML mediante SVG.",items:[
    ["svg","<svg>","Contenedor raíz para gráficos vectoriales escalables.","elementos"],
    ["namespace","Namespace SVG","Comprendé cómo se integra SVG en documentos HTML y XML.","conceptos"],
    ["viewbox","viewBox","Define el sistema de coordenadas y el área visible.","atributos"],
    ["width-height","width y height","Controlan las dimensiones del viewport SVG.","atributos"],
    ["rect","<rect>","Dibuja rectángulos y cuadrados.","elementos"],
    ["circle","<circle>","Dibuja círculos mediante centro y radio.","elementos"],
    ["ellipse","<ellipse>","Dibuja elipses con radios horizontal y vertical.","elementos"],
    ["line","<line>","Dibuja una línea entre dos puntos.","elementos"],
    ["polyline","<polyline>","Dibuja segmentos conectados.","elementos"],
    ["polygon","<polygon>","Dibuja una forma cerrada de varios lados.","elementos"],
    ["path","<path>","Define trazados mediante comandos de dibujo.","elementos"],
    ["text","<text>","Inserta texto dentro del gráfico vectorial.","elementos"],
    ["tspan","<tspan>","Permite ajustar fragmentos de texto SVG.","elementos"],
    ["g","<g>","Agrupa elementos SVG.","elementos"],
    ["defs","<defs>","Guarda elementos gráficos reutilizables.","elementos"],
    ["use","<use>","Reutiliza elementos SVG definidos previamente.","elementos"],
    ["title-desc","<title> y <desc>","Proporcionan título y descripción al gráfico.","elementos"],
    ["fill","fill","Define el relleno de una forma.","atributos"],
    ["stroke","stroke","Define el contorno de una forma.","atributos"],
    ["gradient","<linearGradient> y <radialGradient>","Crea degradados para las formas.","elementos"],
    ["stop","<stop>","Define puntos de color de un degradado.","elementos"],
    ["clip-path","<clipPath>","Limita qué partes de un gráfico se muestran.","elementos"],
    ["mask","<mask>","Controla la visibilidad de partes del gráfico.","elementos"],
    ["transform","transform","Traslada, rota, escala o inclina elementos.","atributos"],
    ["svg-practica","Construí un icono SVG","Combiná formas, colores y trazados en un icono.","practica"],
  ]},
  semantica:{title:"HTML semántico",description:"Utilizá elementos que describen el significado del contenido y ayudan a organizar mejor cada página.",items:[
    ["semantica","¿Qué es HTML semántico?","Comprendé por qué el significado de los elementos importa.","conceptos"],
    ["header","<header>","Representa la cabecera de una página o sección.","elementos"],
    ["nav","<nav>","Agrupa enlaces de navegación importantes.","elementos"],
    ["main","<main>","Identifica el contenido principal del documento.","elementos"],
    ["section","<section>","Agrupa contenido relacionado bajo un tema.","elementos"],
    ["article","<article>","Representa contenido independiente y reutilizable.","elementos"],
    ["aside","<aside>","Contiene información complementaria.","elementos"],
    ["footer","<footer>","Representa el pie de una página o sección.","elementos"],
    ["address","<address>","Proporciona información de contacto relacionada.","elementos"],
    ["search","<search>","Agrupa controles o contenido relacionado con búsquedas.","elementos"],
    ["hgroup","<hgroup>","Agrupa un encabezado con contenido secundario relacionado.","elementos"],
    ["figure","<figure>","Agrupa contenido ilustrativo o autónomo.","elementos"],
    ["figcaption","<figcaption>","Proporciona una leyenda para una figura.","elementos"],
    ["time","<time>","Representa fechas u horas legibles por máquinas.","elementos"],
    ["details","<details>","Crea un panel que el usuario puede expandir.","elementos"],
    ["summary","<summary>","Define el encabezado visible de details.","elementos"],
    ["dialog","<dialog>","Representa un cuadro de diálogo.","elementos"],
    ["div-vs-section","<div> frente a <section>","Diferenciá un contenedor genérico de una sección temática.","conceptos"],
    ["article-vs-section","<article> frente a <section>","Diferenciá contenido independiente de una agrupación temática.","conceptos"],
    ["landmarks","Regiones de referencia","Organizá la página con landmarks reconocibles.","conceptos"],
    ["outline","Jerarquía de encabezados","Estructurá títulos y subtítulos con sentido lógico.","conceptos"],
  ]},
  accesibilidad:{title:"Accesibilidad",description:"Creá contenido que pueda ser comprendido y utilizado por personas con distintas capacidades y formas de navegación.",items:[
    ["alt-texto","Texto alternativo","Describí imágenes para quienes no pueden verlas.","conceptos"],
    ["label-form","Etiquetas de formularios","Asegurá que los campos tengan nombres comprensibles.","conceptos"],
    ["teclado","Navegación con teclado","Permití recorrer e interactuar con la página sin ratón.","conceptos"],
    ["focus","Foco visible","Mantené visible qué elemento está seleccionado.","conceptos"],
    ["jerarquia","Jerarquía de encabezados","Organizá títulos para facilitar la comprensión y navegación.","conceptos"],
    ["lang","Atributo lang","Indicá el idioma principal del documento.","elementos"],
    ["aria","Atributos ARIA","Añadí información accesible cuando el HTML nativo no alcanza.","conceptos"],
    ["accesibilidad-practica","Revisá la accesibilidad","Detectá problemas comunes en una página sencilla.","practica"]
  ]},
  retos:{title:"Retos de HTML",description:"Poné en práctica lo aprendido construyendo estructuras y componentes reales con HTML.",items:[
    ["reto-perfil","Tarjeta de perfil","Construí una tarjeta con imagen, título, descripción y enlace.","practica"],
    ["reto-lista","Lista de tareas","Representá tareas y estados usando listas y elementos semánticos.","practica"],
    ["reto-navegacion","Menú de navegación","Creá una navegación con enlaces a distintas secciones.","practica"],
    ["reto-formulario","Formulario de contacto","Combiná campos, etiquetas y validación nativa.","practica"],
    ["reto-tabla","Tabla de datos","Organizá información tabular con encabezados y filas.","practica"],
    ["reto-articulo","Artículo de blog","Estructurá una publicación con títulos, párrafos e imágenes.","practica"],
    ["reto-semantico","Página semántica","Combiná header, nav, main, section y footer.","practica"],
    ["reto-completo","Página personal completa","Integrá varias etiquetas para crear una página desde cero.","practica"]
  ]}
};

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("tema") || "formularios";
  const category = categoryContent[id];
  const title = document.getElementById("categoryTitle");
  const description = document.getElementById("categoryDescription");
  const count = document.getElementById("categoryCount");
  const breadcrumb = document.getElementById("breadcrumbCategory");
  const grid = document.getElementById("articleGrid");
  const search = document.getElementById("articleSearch");
  const chips = [...document.querySelectorAll(".filter-chip")];
  const empty = document.getElementById("emptyState");
  let activeFilter = "todos";

  // Si el identificador no existe, volvemos a la categoría de formularios.
  const current = category || categoryContent.formularios;
  document.title = current.title + " | HTML | WebDev Book";
  title.textContent = current.title;
  description.textContent = current.description;
  breadcrumb.textContent = current.title;
  count.textContent = current.items.length + " ARTÍCULOS";
  document.querySelector(".category-search input")?.setAttribute("placeholder", "Buscar en " + current.title + "...");

  // Escapa caracteres especiales para que las etiquetas se muestren como texto y no se interpreten como HTML.
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));

  // Construye las tarjetas a partir del catálogo de la categoría.
  grid.innerHTML = current.items.map(([articleId, articleTitle, summary, type], index) => {
    const label = type === "elementos" ? "ELEMENTO HTML" : type === "practica" ? "RETO PRÁCTICO" : type === "atributos" ? "ATRIBUTO HTML" : "CONCEPTO HTML";
    const displayTitle = escapeHTML(articleTitle);
    const heading = escapeHTML(articleTitle.startsWith("<") ? "Elemento " + articleTitle : articleTitle);
    return '<a class="article-card ' + (index===0 ? "featured-article" : "") + '" href="articulo.html?lenguaje=html&id=' + encodeURIComponent(articleId) + '" data-category="' + escapeHTML(type) + '">' +
      '<div class="article-card-top"><span class="article-type">' + label + '</span><span class="article-arrow">↗</span></div>' +
      '<code>' + displayTitle + '</code><h3>' + heading + '</h3>' +
      '<p>' + escapeHTML(summary) + '</p><div class="article-card-bottom"><span>' + (type==="practica" ? "Práctica" : type==="elementos" ? "Elemento" : type==="atributos" ? "Atributo" : "Concepto") + '</span><b>Ver artículo →</b></div>' +
    '</a>';
  }).join("");

  // Actualiza las tarjetas según el texto y el filtro seleccionado.
  function updateArticles() {
    const term = (search?.value || "").trim().toLocaleLowerCase("es");
    let visible = 0;
    grid.querySelectorAll(".article-card").forEach(card => {
      const show = card.textContent.toLocaleLowerCase("es").includes(term) && (activeFilter === "todos" || card.dataset.category === activeFilter);
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }
  chips.forEach(chip => chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter || "todos";
    chips.forEach(item => item.classList.toggle("active", item === chip));
    updateArticles();
  }));
  search?.addEventListener("input", updateArticles);
});
