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
    ["doctype","<!DOCTYPE html>","La declaración que indica el estándar HTML del documento.","elementos"],
    ["html","<html>","El elemento raíz que contiene todo el documento.","elementos"],
    ["head","<head>","La sección que reúne metadatos y recursos del documento.","elementos"],
    ["body","<body>","El contenedor del contenido que se presenta en la página.","elementos"],
    ["title","<title>","Definí el título que aparece en la pestaña del navegador.","elementos"],
    ["meta","<meta>","Configurá metadatos como codificación y viewport.","elementos"],
    ["link","<link>","Vinculá hojas de estilo y otros recursos externos.","elementos"],
    ["documento-base","Estructura HTML completa","Un ejemplo explicado de un documento HTML bien formado.","practica"]
  ]},
  etiquetas:{title:"Etiquetas HTML",description:"Explorá los elementos HTML y aprendé qué función cumple cada uno al estructurar el contenido.",items:[
    ["encabezados","<h1> a <h6>","Organizá títulos y subtítulos por niveles jerárquicos.","elementos"],
    ["parrafo","<p>","Agrupá bloques de texto en párrafos.","elementos"],
    ["enlaces","<a>","Creá enlaces hacia páginas, archivos o secciones.","elementos"],
    ["listas","<ul>, <ol> y <li>","Representá listas ordenadas y desordenadas.","elementos"],
    ["div","<div>","Agrupá contenido sin añadir significado semántico propio.","elementos"],
    ["span","<span>","Agrupá texto o contenido en línea.","elementos"],
    ["citas","<blockquote> y <q>","Marcá citas extensas y citas breves.","elementos"],
    ["texto-semantico","<strong>, <em> y más","Expresá importancia y énfasis en el contenido.","elementos"]
  ]},
  atributos:{title:"Atributos HTML",description:"Aprendé a configurar los elementos HTML mediante atributos globales y atributos específicos.",items:[
    ["atributos-globales","Atributos globales","Conocé atributos que pueden utilizarse en muchos elementos.","conceptos"],
    ["id","id","Identificá de forma única un elemento dentro del documento.","elementos"],
    ["class","class","Agrupá elementos para aplicar estilos o seleccionarlos con JavaScript.","elementos"],
    ["href","href","Indicá el destino de un enlace.","elementos"],
    ["src","src","Especificá la ubicación de un recurso externo.","elementos"],
    ["alt","alt","Proporcioná una alternativa textual para las imágenes.","elementos"],
    ["data","data-*","Guardá datos personalizados en los elementos.","elementos"],
    ["booleanos","Atributos booleanos","Entendé atributos cuya presencia activa una opción.","conceptos"]
  ]},
  formularios:{title:"Formularios",description:"Aprendé a crear formularios para recopilar información de los usuarios. Conocé sus controles, atributos, tipos de campos y herramientas de validación.",items:[
    ["form","<form>","El elemento que agrupa controles y permite enviar información del usuario.","elementos"],
    ["input","<input>","Conocé los distintos tipos de campos para introducir datos.","elementos"],
    ["label","<label>","Asociá un texto descriptivo con su control de formulario.","elementos"],
    ["textarea","<textarea>","Permití escribir mensajes y textos de varias líneas.","elementos"],
    ["select","<select>","Ofrecé un conjunto de opciones para que el usuario elija.","elementos"],
    ["button","<button>","Creá controles para enviar formularios o ejecutar acciones.","elementos"],
    ["required","required","Indicá qué campos deben completarse antes del envío.","conceptos"],
    ["validacion","Validación de formularios","Comprendé cómo el navegador comprueba los datos ingresados.","conceptos"]
  ]},
  multimedia:{title:"Contenido multimedia",description:"Incorporá imágenes, audio, vídeo y contenido externo para enriquecer tus páginas web.",items:[
    ["img","<img>","Insertá imágenes y configurá su alternativa textual.","elementos"],
    ["picture","<picture>","Ofrecé distintas fuentes de imagen según el contexto.","elementos"],
    ["audio","<audio>","Incorporá archivos de sonido con controles de reproducción.","elementos"],
    ["video","<video>","Mostrá vídeos directamente en el documento.","elementos"],
    ["source","<source>","Proporcioná fuentes alternativas para audio, vídeo o imágenes.","elementos"],
    ["track","<track>","Añadí subtítulos y pistas de texto a contenido multimedia.","elementos"],
    ["iframe","<iframe>","Incrustá otra página o contenido externo.","elementos"],
    ["figure","<figure> y <figcaption>","Agrupá contenido visual con su descripción o leyenda.","elementos"]
  ]},
  svg:{title:"SVG",description:"Aprendé a crear gráficos vectoriales escalables directamente en HTML mediante SVG.",items:[
    ["svg-element","<svg>","El contenedor principal de un gráfico vectorial.","elementos"],
    ["viewbox","viewBox","Definí el sistema de coordenadas y el área visible del SVG.","conceptos"],
    ["rect","<rect>","Dibujá rectángulos y cuadrados.","elementos"],
    ["circle","<circle>","Dibujá círculos mediante su centro y radio.","elementos"],
    ["line","<line>","Trazá líneas entre dos puntos.","elementos"],
    ["path","<path>","Creá formas y trazados vectoriales complejos.","elementos"],
    ["fill-stroke","fill y stroke","Configurá el relleno y el contorno de las formas.","conceptos"],
    ["svg-practica","Construí un icono SVG","Combiná formas básicas para crear un icono sencillo.","practica"]
  ]},
  semantica:{title:"HTML semántico",description:"Utilizá elementos que describen el significado del contenido y ayudan a organizar mejor cada página.",items:[
    ["header","<header>","Representá la cabecera de una página o sección.","elementos"],
    ["nav","<nav>","Agrupá los enlaces principales de navegación.","elementos"],
    ["main","<main>","Identificá el contenido principal del documento.","elementos"],
    ["section","<section>","Agrupá contenido relacionado bajo un mismo tema.","elementos"],
    ["article","<article>","Representá contenido independiente y reutilizable.","elementos"],
    ["aside","<aside>","Marcá contenido complementario o relacionado.","elementos"],
    ["footer","<footer>","Definí el pie de una página o sección.","elementos"],
    ["semantica-vs-div","Semántica frente a <div>","Elegí elementos según el significado del contenido.","conceptos"]
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

  // Construye las tarjetas a partir del catálogo de la categoría.
  grid.innerHTML = current.items.map(([articleId, articleTitle, summary, type], index) => {
    const codeLike = articleTitle.startsWith("<") || articleTitle.includes("id") || articleTitle.includes("class") || articleTitle.includes("href") || articleTitle.includes("src") || articleTitle.includes("alt") || articleTitle.includes("required") || articleTitle.includes("viewBox") || articleTitle.includes("fill") || articleTitle.includes("stroke");
    const label = type === "elementos" ? "ELEMENTO HTML" : type === "practica" ? "RETO PRÁCTICO" : "CONCEPTO HTML";
    const visualTitle = codeLike ? articleTitle : articleTitle;
    return `<a class="article-card ${index===0?"featured-article":""}" href="articulo.html?lenguaje=html&id=${encodeURIComponent(articleId)}" data-category="${type}">
      <div class="article-card-top"><span class="article-type">${label}</span><span class="article-arrow">↗</span></div>
      <code>${visualTitle}</code><h3>${articleTitle.startsWith("<") ? "Elemento " + articleTitle : articleTitle}</h3>
      <p>${summary}</p><div class="article-card-bottom"><span>${type==="practica"?"Práctica":type==="elementos"?"Elemento":"Concepto"}</span><b>Ver artículo →</b></div>
    </a>`;
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
