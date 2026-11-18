// Base de conocimiento de los artículos nuevos de HTML5 y HTML moderno.
const articles = {
"meta-seo":{title:"Metadatos para SEO",kicker:"DOCUMENTO Y METADATOS",lead:"Los metadatos describen una página para navegadores, buscadores y otros servicios. No reemplazan un buen contenido, pero ayudan a identificarlo y presentarlo.",level:"Básico",category:"estructura",intro:"Los metadatos se colocan normalmente dentro de <head>. Se declaran mediante elementos como <meta> y <title>.",code:`<head>
  <meta charset="UTF-8">
  <meta name="description" content="Guía de HTML moderno">
  <meta name="author" content="WebDev Book">
  <title>Guía de HTML</title>
</head>`,points:["<title> define el título del documento que suele aparecer en la pestaña y puede utilizarse como título en resultados de búsqueda.","name=\"description\" ofrece una descripción breve de la página; el buscador puede elegir mostrarla o generar otro fragmento.","charset=\"UTF-8\" declara la codificación de caracteres.","Los metadatos deben describir el contenido real de esa página, no acumular palabras clave irrelevantes."],tip:"No existe una etiqueta meta keywords que garantice posicionamiento. Priorizá títulos claros, contenido útil y una estructura semántica."},
"open-graph":{title:"Open Graph",kicker:"METADATOS Y REDES",lead:"Open Graph permite definir qué título, descripción e imagen se muestran cuando compartís una página en servicios compatibles.",level:"Básico",category:"estructura",intro:"Se configura en el <head> mediante etiquetas meta con propiedades og:.",code:`<meta property="og:title" content="Aprendé HTML">
<meta property="og:description" content="Una guía práctica de HTML moderno.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://ejemplo.com/html">
<meta property="og:image" content="https://ejemplo.com/img/portada.jpg">`,points:["og:title define el título de la vista previa.","og:description aporta el resumen.","og:image indica una imagen absoluta y accesible públicamente.","og:url identifica la URL canónica que se comparte.","Las plataformas pueden almacenar vistas previas en caché; los cambios no siempre aparecen inmediatamente."],tip:"Usá imágenes con proporciones y dimensiones adecuadas para la plataforma donde se compartirán."},
"favicon":{title:"Favicon",kicker:"IDENTIDAD DEL SITIO",lead:"El favicon es el pequeño icono asociado a un sitio web que puede aparecer en pestañas, marcadores y otras interfaces del navegador.",level:"Básico",category:"estructura",intro:"Se declara con <link> dentro de <head>. Es posible ofrecer distintos formatos o tamaños.",code:`<head>
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/png" href="/icon-32.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>`,points:["rel=\"icon\" identifica el recurso como icono del sitio.","href indica la ruta del archivo; puede ser relativa o absoluta.","type puede declarar el tipo MIME del archivo.","Los navegadores pueden solicitar y almacenar el icono en caché."],tip:"Comprobá que la ruta funcione desde las páginas internas y que el archivo exista en el servidor."},
"preload":{title:"Preload y preconnect",kicker:"CARGA DE RECURSOS",lead:"Las pistas de recursos permiten indicar al navegador qué conexiones o descargas podrían ser importantes durante la carga de una página.",level:"Intermedio",category:"estructura",intro:"Se escriben como elementos <link> dentro de <head>. Cada pista tiene un propósito distinto.",code:`<!-- Anticipa la conexión con otro origen -->
<link rel="preconnect" href="https://fonts.example.com">

<!-- Solicita con prioridad un recurso necesario pronto -->
<link rel="preload" href="/fonts/site.woff2"
      as="font" type="font/woff2" crossorigin>

<!-- Carga una hoja de estilos -->
<link rel="stylesheet" href="/css/site.css">`,points:["preconnect inicia anticipadamente la conexión con un origen externo.","preload solicita pronto un recurso que la página necesitará en breve; as describe su destino.","Las fuentes precargadas suelen requerir crossorigin para reutilizar correctamente la solicitud.","Precargar recursos innecesarios consume ancho de banda y puede perjudicar otras descargas."],tip:"Usá preload solo para recursos críticos que sabés que se utilizarán en la página."},
"async-defer":{title:"async y defer",kicker:"CARGA DE JAVASCRIPT",lead:"Los atributos async y defer permiten descargar scripts externos sin bloquear innecesariamente el análisis del documento.",level:"Intermedio",category:"estructura",intro:"Ambos se usan en elementos <script src>. La diferencia principal está en cuándo se ejecuta el archivo.",code:`<!-- Se ejecuta cuando termina de descargarse -->
<script async src="analytics.js"><\/script>

<!-- Se ejecuta después de analizar el HTML -->
<script defer src="app.js"><\/script>`,points:["async ejecuta el script apenas termina de descargarse; el orden entre varios scripts async no está garantizado.","defer ejecuta el script después de analizar el documento y conserva el orden relativo entre scripts defer clásicos.","Los scripts defer se ejecutan antes del evento DOMContentLoaded.","Estos atributos se aplican a scripts externos con src; los módulos tienen comportamiento diferido por defecto."],tip:"Para el código principal de una página, defer suele ser una opción sencilla cuando necesitás que el DOM ya esté analizado."},
"type-module":{title:"JavaScript como módulo",kicker:"HTML Y JAVASCRIPT",lead:"El atributo type=\"module\" permite cargar un archivo JavaScript como módulo, habilitando importaciones y exportaciones.",level:"Intermedio",category:"estructura",intro:"Los módulos ayudan a dividir un programa en archivos con responsabilidades claras.",code:`<!-- En HTML -->
<script type="module" src="./js/main.js"><\/script>

// En main.js
import { saludar } from "./saludos.js";
saludar("Mundo");

// En saludos.js
export function saludar(nombre) {
  console.log("Hola, " + nombre);
}`,points:["Los módulos usan import y export para compartir funciones, variables y clases.","Se ejecutan en modo estricto automáticamente.","Se difieren de forma predeterminada respecto del análisis del HTML.","En navegadores, los módulos deben servirse mediante HTTP(S) y respetar las reglas de origen cruzado."],tip:"No abras el HTML directamente como archivo file:// para probar módulos; usá un servidor local."},
"text-kbd":{title:"El elemento <kbd>",kicker:"TEXTO Y FORMATO",lead:"<kbd> representa una entrada del usuario, normalmente una combinación o tecla del teclado.",level:"Básico",category:"etiquetas",intro:"Se utiliza dentro de instrucciones, tutoriales y documentación técnica para identificar qué debe pulsar una persona.",code:`<p>Guardá los cambios con <kbd>Ctrl</kbd> + <kbd>S</kbd>.</p>
<p>En macOS, usá <kbd>⌘</kbd> + <kbd>S</kbd>.</p>`,points:["Su función es semántica: identifica una entrada del usuario.","El navegador suele mostrarlo con una apariencia similar a una fuente monoespaciada, pero CSS puede cambiarla.","Puede representar teclas individuales o combinaciones."],tip:"No uses <kbd> para mostrar código fuente; para eso existen <code> y <pre>."},
"text-samp":{title:"El elemento <samp>",kicker:"TEXTO Y FORMATO",lead:"<samp> representa una salida de ejemplo producida por un programa o sistema.",level:"Básico",category:"etiquetas",intro:"Es útil en documentación cuando mostrás qué respuesta puede devolver una terminal, una aplicación o un programa.",code:`<p>El programa responde:</p>
<p><samp>Archivo guardado correctamente.</samp></p>`,points:["Describe una salida generada por una computadora.","Suele presentarse con tipografía monoespaciada.","Puede combinarse con <pre> cuando la salida ocupa varias líneas."],tip:"Distinguí la entrada del usuario (<kbd>) de la salida del sistema (<samp>)."},
"text-cite":{title:"El elemento <cite>",kicker:"TEXTO Y FORMATO",lead:"<cite> identifica el título de una obra creativa mencionada o referenciada.",level:"Básico",category:"etiquetas",intro:"Puede utilizarse para títulos de libros, películas, canciones, obras y otras creaciones.",code:`<p>Estoy leyendo <cite>El principito</cite>.</p>
<p>La película <cite>Blade Runner</cite> se estrenó en 1982.</p>`,points:["Se refiere al título de una obra, no al nombre de cualquier persona citada.","El navegador suele aplicar cursiva por defecto, aunque la presentación puede modificarse con CSS.","Para una cita textual se puede utilizar <blockquote> o <q>, según el contexto."],tip:"No confundas <cite> con <q>: uno identifica una obra y el otro marca una cita textual."},
"text-small":{title:"El elemento <small>",kicker:"TEXTO Y FORMATO",lead:"<small> representa comentarios secundarios, aclaraciones o letra pequeña, como avisos legales y condiciones.",level:"Básico",category:"etiquetas",intro:"No debe elegirse solamente porque se desea que el texto se vea pequeño; su significado debe ser secundario respecto del contenido principal.",code:`<p>Precio: $12.000</p>
<p><small>Impuestos incluidos. Consultar condiciones.</small></p>`,points:["Tiene significado semántico de contenido secundario.","Los navegadores suelen reducir su tamaño de fuente.","No reemplaza CSS cuando solo se busca cambiar el tamaño visual."],tip:"El texto pequeño debe seguir siendo legible y tener contraste suficiente."},
"text-dfn":{title:"El elemento <dfn>",kicker:"TEXTO Y FORMATO",lead:"<dfn> marca el término que se está definiendo dentro de una explicación.",level:"Intermedio",category:"etiquetas",intro:"Es especialmente útil en glosarios, manuales y documentación técnica.",code:`<p><dfn>HTML</dfn> es un lenguaje de marcado
utilizado para estructurar documentos web.</p>`,points:["Marca la instancia donde se introduce o define un término.","El contexto cercano debe permitir comprender la definición.","Puede usar title para aportar el término cuando la definición aparece en otro lugar, siguiendo las reglas del elemento."],tip:"No marques cada repetición de una palabra con <dfn>; utilizalo donde se define el concepto."},
"text-s":{title:"El elemento <s>",kicker:"TEXTO Y FORMATO",lead:"<s> representa contenido que ya no es correcto, exacto o relevante, pero que se mantiene visible.",level:"Básico",category:"etiquetas",intro:"Puede utilizarse para mostrar un precio anterior o información desactualizada. No representa una edición de un documento.",code:`<p>Precio anterior: <s>$15.000</s></p>
<p>Precio actual: $12.000</p>`,points:["El texto permanece en el documento y normalmente se muestra tachado.","Para indicar que un contenido fue eliminado de una revisión, considerá <del>.","No lo uses únicamente para lograr un efecto visual de tachado; CSS es más apropiado para eso."],tip:"<s> y <del> se parecen visualmente, pero expresan significados distintos."},
"text-wbr":{title:"El elemento <wbr>",kicker:"TEXTO Y FORMATO",lead:"<wbr> indica un lugar donde el navegador puede realizar un salto de línea si lo necesita.",level:"Intermedio",category:"etiquetas",intro:"Resulta útil en palabras largas, identificadores o direcciones extensas que podrían desbordar su contenedor.",code:`<p>Identificador:
  superNombreDeArchivo<wbr>ConUnaParteMuyLarga
</p>`,points:["No fuerza un salto de línea; ofrece una oportunidad para hacerlo.","No agrega un guion al dividir la palabra.","Es un elemento vacío: no necesita etiqueta de cierre."],tip:"Para controlar el ajuste general de textos, también existen propiedades CSS como overflow-wrap y word-break."},
"text-data":{title:"El elemento <data>",kicker:"TEXTO Y FORMATO",lead:"<data> vincula un contenido visible para las personas con un valor legible por máquinas.",level:"Intermedio",category:"etiquetas",intro:"Puede servir para asociar un nombre de producto con un identificador interno o un dato estructurado simple.",code:`<p>Producto:
  <data value="SKU-2048">Teclado mecánico</data>
</p>`,points:["El texto dentro del elemento es la presentación humana.","El atributo value contiene la representación legible por máquinas.","Para fechas y horas, <time> suele ser más apropiado.","No sustituye formatos de datos estructurados específicos cuando estos son necesarios."],tip:"El valor de data no se muestra automáticamente; los usuarios ven el contenido interno."},
"table-caption":{title:"El elemento <caption>",kicker:"TABLAS HTML",lead:"<caption> proporciona un título o una descripción breve para una tabla.",level:"Básico",category:"etiquetas",intro:"Se coloca como primer hijo de <table> y ayuda a comprender qué información organiza la tabla.",code:`<table>
  <caption>Resultados del torneo</caption>
  <tr><th>Equipo</th><th>Puntos</th></tr>
  <tr><td>Azul</td><td>12</td></tr>
</table>`,points:["El caption pertenece a la tabla y la identifica.","Debe describir el propósito de la tabla de forma concisa.","CSS puede modificar su ubicación y apariencia."],tip:"No uses una tabla para maquetar una página; reservá las tablas para datos tabulares."},
"table-sections":{title:"<thead>, <tbody> y <tfoot>",kicker:"TABLAS HTML",lead:"Estos elementos agrupan las filas de encabezado, cuerpo y pie de una tabla de datos.",level:"Intermedio",category:"etiquetas",intro:"Separar las secciones mejora la organización del marcado y permite aplicar estilos o comportamientos específicos.",code:`<table>
  <thead>
    <tr><th>Producto</th><th>Precio</th></tr>
  </thead>
  <tbody>
    <tr><td>Mouse</td><td>$8.000</td></tr>
  </tbody>
  <tfoot>
    <tr><td>Total</td><td>$8.000</td></tr>
  </tfoot>
</table>`,points:["<thead> agrupa las filas que contienen encabezados de columna.","<tbody> agrupa las filas principales de datos.","<tfoot> agrupa filas de resumen o pie.","El navegador puede insertar un tbody implícito en ciertas estructuras cuando se omite."],tip:"No confundas estas secciones con <header> y <footer>, que pertenecen a la estructura semántica general."},
"table-row":{title:"El elemento <tr>",kicker:"TABLAS HTML",lead:"<tr> define una fila dentro de una tabla y contiene celdas de encabezado o de datos.",level:"Básico",category:"etiquetas",intro:"Las filas se colocan normalmente dentro de <thead>, <tbody> o <tfoot>.",code:`<table>
  <tr>
    <th>Lenguaje</th>
    <th>Uso</th>
  </tr>
  <tr>
    <td>HTML</td>
    <td>Estructura</td>
  </tr>
</table>`,points:["Cada fila agrupa celdas que pertenecen a la misma línea de datos.","Las celdas se definen con <th> o <td>.","La cantidad de celdas puede variar cuando se usan combinaciones de filas y columnas."],tip:"Una tabla accesible necesita encabezados que permitan entender a qué corresponde cada dato."},
"table-cells":{title:"<th> y <td>",kicker:"TABLAS HTML",lead:"<th> representa una celda de encabezado y <td> una celda que contiene datos.",level:"Intermedio",category:"etiquetas",intro:"La diferencia no es solamente visual: los encabezados aportan relaciones semánticas que ayudan a interpretar las celdas.",code:`<table>
  <tr>
    <th scope="col">Lenguaje</th>
    <th scope="col">Función</th>
  </tr>
  <tr>
    <td>HTML</td>
    <td>Estructura</td>
  </tr>
</table>`,points:["<th> se utiliza para encabezados de fila o columna.","scope=\"col\" indica que el encabezado corresponde a una columna; scope=\"row\" a una fila.","<td> contiene el dato propiamente dicho.","Para tablas complejas pueden requerirse asociaciones más explícitas entre encabezados y celdas."],tip:"No conviertas todos los textos en <th> para que aparezcan en negrita: elegí el elemento por su función."},
"table-columns":{title:"<colgroup> y <col>",kicker:"TABLAS HTML",lead:"<colgroup> y <col> permiten agrupar columnas y asociarles características comunes.",level:"Intermedio",category:"etiquetas",intro:"Se colocan al inicio de la tabla, después de un posible <caption> y antes de las secciones de filas.",code:`<table>
  <colgroup>
    <col>
    <col span="2">
  </colgroup>
  <tr><th>Producto</th><th>Precio</th><th>Stock</th></tr>
  <tr><td>Mouse</td><td>$8.000</td><td>12</td></tr>
</table>`,points:["<colgroup> agrupa una o varias columnas.","<col> representa una o varias columnas mediante span.","Su uso más habitual es aplicar estilos compatibles a columnas concretas.","No reemplazan las celdas ni definen el contenido de la tabla."],tip:"Las propiedades CSS que pueden aplicarse a columnas de tablas son limitadas; no todas las propiedades funcionan como en bloques normales."},
"table-spans":{title:"colspan y rowspan",kicker:"ATRIBUTOS DE TABLAS",lead:"colspan y rowspan permiten que una celda ocupe más de una columna o más de una fila.",level:"Intermedio",category:"etiquetas",intro:"Son atributos de <td> y <th> que modifican cómo se distribuyen las celdas en la cuadrícula de una tabla.",code:`<table>
  <tr>
    <th colspan="2">Datos personales</th>
  </tr>
  <tr>
    <td>Nombre</td>
    <td>Ana</td>
  </tr>
  <tr>
    <th rowspan="2">Contacto</th>
    <td>correo@ejemplo.com</td>
  </tr>
  <tr><td>555-0100</td></tr>
</table>`,points:["colspan indica cuántas columnas ocupa una celda.","rowspan indica cuántas filas ocupa una celda.","Los valores deben ser números enteros positivos válidos para la cuadrícula.","Al combinar celdas, revisá que la estructura de filas siga siendo coherente."],tip:"Las tablas con muchas celdas combinadas pueden ser difíciles de recorrer; mantené el diseño lo más simple posible."},
"template":{title:"El elemento <template>",kicker:"CONTENIDO REUTILIZABLE",lead:"<template> almacena fragmentos de HTML que no se muestran al cargar la página, pero que JavaScript puede clonar e insertar.",level:"Intermedio",category:"etiquetas",intro:"Es útil cuando una interfaz necesita crear varias tarjetas, filas o componentes con una misma estructura.",code:`<template id="card-template">
  <article class="card">
    <h2></h2>
    <p></p>
  </article>
</template>

<script>
const template = document.querySelector("#card-template");
const card = template.content.cloneNode(true);
card.querySelector("h2").textContent = "Hola";
card.querySelector("p").textContent = "Contenido dinámico";
document.body.append(card);
<\/script>`,points:["El contenido del template no se renderiza como parte normal de la página.","Su contenido está disponible mediante la propiedad content.","cloneNode(true) crea una copia del fragmento y sus descendientes.","Los datos externos deben insertarse de forma segura, por ejemplo usando textContent para texto."],tip:"<template> aporta una estructura reutilizable; JavaScript decide cuándo y con qué datos crear instancias."},
"autocomplete":{title:"El atributo autocomplete",kicker:"ATRIBUTOS DE FORMULARIOS",lead:"autocomplete indica si el navegador puede ayudar a completar un campo con información guardada y qué tipo de dato espera.",level:"Intermedio",category:"atributos",intro:"Puede aplicarse al formulario o a controles compatibles. Sus valores semánticos ayudan al navegador a reconocer datos como nombre, correo o dirección.",code:`<form>
  <label for="email">Correo</label>
  <input id="email" name="email"
         type="email" autocomplete="email">

  <label for="given">Nombre</label>
  <input id="given" name="given"
         autocomplete="given-name">
</form>`,points:["autocomplete=\"off\" solicita que no se use autocompletado, aunque los navegadores pueden aplicar sus propias decisiones.","Valores como name, email, username y given-name describen el tipo de información.","Los campos necesitan etiquetas y nombres adecuados para que los datos puedan asociarse correctamente."],tip:"No confundas autocompletado con validación: autocomplete ayuda a completar; required y type participan en la validación."},
"novalidate":{title:"El atributo novalidate",kicker:"ATRIBUTOS DE FORMULARIOS",lead:"novalidate indica que el formulario no debe ejecutar la validación interactiva nativa al enviarse.",level:"Intermedio",category:"atributos",intro:"Se coloca en el elemento <form>. Puede ser útil cuando la aplicación implementa su propio flujo de validación.",code:`<form action="/registro" method="post" novalidate>
  <label for="mail">Correo</label>
  <input id="mail" name="mail" type="email" required>
  <button type="submit">Enviar</button>
</form>`,points:["Es un atributo booleano: su presencia activa el comportamiento.","No elimina los atributos required, min, max o pattern del marcado.","JavaScript puede consultar la validez con la API de validación de restricciones.","El servidor debe validar siempre los datos recibidos."],tip:"Desactivar la validación del navegador no significa que los datos sean confiables."},
"formaction":{title:"El atributo formaction",kicker:"ATRIBUTOS DE FORMULARIOS",lead:"formaction permite que un botón de envío indique una URL distinta de la definida por action en el formulario.",level:"Intermedio",category:"atributos",intro:"Se utiliza en controles de envío como <button> o <input type=\"submit\">.",code:`<form action="/guardar" method="post">
  <input name="titulo" required>
  <button type="submit">Guardar</button>
  <button type="submit" formaction="/vista-previa">
    Vista previa
  </button>
</form>`,points:["El valor de formaction es la URL de destino alternativa.","Solo tiene efecto en controles que envían el formulario.","Permite que distintos botones ejecuten acciones de envío diferentes."],tip:"Si necesitás cambiar también el método o la codificación, revisá formmethod y formenctype."},
"formmethod":{title:"El atributo formmethod",kicker:"ATRIBUTOS DE FORMULARIOS",lead:"formmethod permite que un botón de envío sobrescriba el método HTTP definido por method en el formulario.",level:"Intermedio",category:"atributos",intro:"Los valores habituales son get y post, con el mismo significado general que el atributo method.",code:`<form action="/buscar" method="get">
  <input name="q">
  <button type="submit">Buscar</button>
  <button type="submit" formmethod="post"
          formaction="/guardar-busqueda">
    Guardar búsqueda
  </button>
</form>`,points:["GET suele utilizarse para consultas cuyos datos pueden formar parte de la URL.","POST envía los datos en el cuerpo de la solicitud.","formmethod solo modifica el envío iniciado por ese control."],tip:"POST no cifra por sí mismo la información; para proteger datos durante el transporte se necesita HTTPS."},
"formenctype":{title:"El atributo formenctype",kicker:"ATRIBUTOS DE FORMULARIOS",lead:"formenctype define cómo se codifican los datos al enviar un formulario desde un botón concreto.",level:"Intermedio",category:"atributos",intro:"Es especialmente relevante cuando se envían archivos con controles input type=file.",code:`<form action="/subir" method="post">
  <input type="file" name="archivo">
  <button type="submit"
          formenctype="multipart/form-data">
    Subir archivo
  </button>
</form>`,points:["application/x-www-form-urlencoded es la codificación habitual de formularios simples.","multipart/form-data permite enviar archivos y campos en partes separadas.","text/plain existe, pero no suele ser apropiado para envíos de producción.","formenctype modifica la codificación para el botón que inicia el envío."],tip:"Para subir archivos, el formulario suele necesitar method=\"post\" y enctype=\"multipart/form-data\"."},
"popover":{title:"El atributo popover",kicker:"INTERACTIVIDAD HTML",lead:"popover convierte un elemento en contenido emergente que el navegador puede mostrar u ocultar mediante mecanismos declarativos.",level:"Intermedio",category:"atributos",intro:"Puede utilizarse con botones que incluyen popovertarget, sin necesitar JavaScript para el caso básico.",code:`<button popovertarget="ayuda">Mostrar ayuda</button>

<div id="ayuda" popover>
  <p>Este es un mensaje emergente.</p>
</div>`,points:["popover sin valor o con auto crea un popover automático.","popover=\"manual\" crea uno manual, cuyo cierre debe controlarse explícitamente.","popovertarget relaciona un botón con el elemento emergente.","El navegador gestiona aspectos como la capa superior y el cierre de popovers automáticos."],tip:"Popover no es lo mismo que dialog: elegí dialog cuando el contenido represente una interacción de diálogo."},
"input-search":{title:"input type=search",kicker:"TIPOS DE INPUT",lead:"El tipo search crea un campo destinado a introducir términos de búsqueda.",level:"Básico",category:"formularios",intro:"Se comporta de forma parecida a un campo de texto, pero comunica al navegador el propósito de búsqueda.",code:`<label for="site-search">Buscar artículos</label>
<input type="search" id="site-search"
       name="q" placeholder="Ej. formularios">`,points:["Acepta texto como un input de tipo text.","Algunos navegadores agregan controles visuales para limpiar la búsqueda.","No realiza una búsqueda por sí solo: necesitás un formulario o JavaScript."],tip:"Siempre asociá el campo con un label; el placeholder no lo reemplaza."},
"input-tel":{title:"input type=tel",kicker:"TIPOS DE INPUT",lead:"El tipo tel está pensado para introducir números telefónicos.",level:"Básico",category:"formularios",intro:"El formato de los teléfonos cambia entre países, por eso el navegador no aplica una validación universal estricta.",code:`<label for="telefono">Teléfono</label>
<input type="tel" id="telefono" name="telefono"
       autocomplete="tel"
       placeholder="+54 379 000 0000">`,points:["Puede facilitar la aparición de un teclado telefónico en dispositivos móviles.","No valida automáticamente que el número exista o tenga un formato nacional correcto.","pattern puede utilizarse para una regla de formato concreta, explicada al usuario."],tip:"No impongas un patrón local si tu formulario acepta teléfonos internacionales."},
"input-url":{title:"input type=url",kicker:"TIPOS DE INPUT",lead:"El tipo url permite introducir una dirección web y aplica una validación básica de formato.",level:"Básico",category:"formularios",intro:"Es apropiado para campos que esperan una URL, como la dirección de un sitio personal.",code:`<label for="web">Tu sitio web</label>
<input type="url" id="web" name="web"
       placeholder="https://ejemplo.com">`,points:["El navegador comprueba que el valor tenga una sintaxis compatible con una URL.","No garantiza que el sitio exista, responda o sea seguro.","required puede exigir que el campo no esté vacío."],tip:"La validación del navegador mejora la experiencia, pero el servidor también debe comprobar el valor."},
"input-range":{title:"input type=range",kicker:"TIPOS DE INPUT",lead:"El tipo range presenta un control deslizante para seleccionar un valor dentro de un intervalo.",level:"Básico",category:"formularios",intro:"Se usa cuando la selección aproximada es más importante que escribir un número exacto.",code:`<label for="volumen">Volumen</label>
<input type="range" id="volumen" name="volumen"
       min="0" max="100" value="40" step="5">`,points:["min y max establecen los extremos del intervalo.","step determina el incremento permitido.","value establece el valor inicial.","Para mostrar el valor actual al usuario, podés combinarlo con JavaScript y output."],tip:"Si el usuario necesita introducir un valor exacto, considerá usar también un campo numérico."},
"input-color":{title:"input type=color",kicker:"TIPOS DE INPUT",lead:"El tipo color permite seleccionar un color mediante el selector que ofrece el navegador o el sistema.",level:"Básico",category:"formularios",intro:"El valor habitual se expresa como un color hexadecimal RGB.",code:`<label for="color">Color favorito</label>
<input type="color" id="color" name="color"
       value="#ff986c">`,points:["value establece el color inicial.","El control visual varía según el navegador y el sistema operativo.","JavaScript puede leer el valor para actualizar una interfaz."],tip:"No dependas solamente del selector de color: mostrale al usuario el valor o el resultado elegido cuando sea importante."},
"input-time":{title:"input type=time",kicker:"TIPOS DE INPUT",lead:"El tipo time permite seleccionar una hora sin asociarla necesariamente a una fecha.",level:"Básico",category:"formularios",intro:"El valor enviado suele expresarse en formato de 24 horas, como HH:MM, aunque la interfaz puede variar.",code:`<label for="hora">Hora de la cita</label>
<input type="time" id="hora" name="hora"
       min="09:00" max="18:00" required>`,points:["min y max pueden limitar el rango horario.","step permite controlar el intervalo, expresado en segundos.","La presentación puede adaptarse a las convenciones locales del dispositivo."],tip:"Si necesitás fecha y hora juntas, evaluá datetime-local."},
"input-month":{title:"input type=month",kicker:"TIPOS DE INPUT",lead:"El tipo month permite elegir un mes y un año, sin seleccionar un día concreto.",level:"Básico",category:"formularios",intro:"Es útil para vencimientos, períodos de facturación o reportes mensuales.",code:`<label for="periodo">Período</label>
<input type="month" id="periodo" name="periodo"
       min="2025-01" max="2027-12">`,points:["El valor se representa normalmente como AAAA-MM.","min y max limitan los meses seleccionables.","La interfaz visual depende del navegador."],tip:"No uses date si el dato que necesitás es solamente un mes y un año."},
"input-week":{title:"input type=week",kicker:"TIPOS DE INPUT",lead:"El tipo week permite elegir una semana específica de un año.",level:"Básico",category:"formularios",intro:"El valor se expresa como año y número de semana ISO, por ejemplo 2026-W04.",code:`<label for="semana">Semana de entrega</label>
<input type="week" id="semana" name="semana">`,points:["El formato del valor sigue el sistema de semanas ISO.","La semana puede comenzar en un día distinto según la presentación regional, pero el valor usa la convención ISO.","La compatibilidad visual puede variar entre navegadores."],tip:"Usá este control cuando el dato de negocio sea una semana, no una fecha cualquiera."},
"input-datetime-local":{title:"input type=datetime-local",kicker:"TIPOS DE INPUT",lead:"El tipo datetime-local permite seleccionar una fecha y una hora local, sin incluir una zona horaria.",level:"Intermedio",category:"formularios",intro:"Es útil para programar citas o eventos en la hora local del usuario cuando la zona horaria se gestiona por separado.",code:`<label for="reunion">Fecha y hora</label>
<input type="datetime-local" id="reunion"
       name="reunion" min="2026-01-01T09:00">`,points:["El valor suele expresarse como AAAA-MM-DDTHH:MM.","No contiene información de zona horaria ni un desplazamiento UTC.","min, max y step permiten establecer restricciones."],tip:"Si necesitás coordinar eventos entre zonas horarias, guardá y procesá la zona horaria de forma explícita."},
"media-formats":{title:"Formatos de audio y vídeo",kicker:"MULTIMEDIA",lead:"Los elementos audio y video pueden reproducir distintos formatos, pero la compatibilidad depende del navegador, el sistema y los códecs disponibles.",level:"Intermedio",category:"multimedia",intro:"Podés ofrecer varias fuentes mediante source para que el navegador elija una que pueda reproducir.",code:`<video controls width="640">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  Tu navegador no puede reproducir este vídeo.
</video>

<audio controls>
  <source src="audio.ogg" type="audio/ogg">
  <source src="audio.mp3" type="audio/mpeg">
</audio>`,points:["MP4 suele utilizarse como contenedor de vídeo, a menudo con códec H.264; el contenedor no define por sí solo todos los códecs.","WebM es otro contenedor habitual para vídeo web.","MP3, AAC, Opus y Vorbis son códecs o formatos de audio con soporte variable.","El atributo type puede informar el tipo MIME de cada fuente."],tip:"Probá los archivos en los navegadores que te interesan y ofrecé más de una fuente cuando sea necesario."},
"responsive-images":{title:"Imágenes adaptables",kicker:"IMÁGENES Y RENDIMIENTO",lead:"Las imágenes adaptables permiten ofrecer archivos y tamaños diferentes según el dispositivo, la resolución o las condiciones de visualización.",level:"Intermedio",category:"multimedia",intro:"srcset y sizes son útiles cuando una misma imagen tiene varias resoluciones. picture permite seleccionar fuentes alternativas por condiciones.",code:`<img
  src="foto-800.jpg"
  srcset="foto-400.jpg 400w,
          foto-800.jpg 800w,
          foto-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 800px"
  alt="Paisaje de montaña">

<picture>
  <source media="(max-width: 600px)" srcset="foto-vertical.jpg">
  <img src="foto-horizontal.jpg" alt="Paisaje de montaña">
</picture>`,points:["srcset con descriptores w ofrece varias anchuras disponibles.","sizes informa el ancho que ocupará la imagen según el diseño.","picture permite cambiar de archivo por formato o condición, por ejemplo una composición móvil.","El alt debe describir la función o contenido relevante de la imagen."],tip:"No uses una imagen enorme para todas las pantallas si podés entregar una variante más liviana."},
"media-accessibility":{title:"Accesibilidad multimedia",kicker:"MULTIMEDIA ACCESIBLE",lead:"El contenido audiovisual necesita alternativas para que personas con distintas capacidades puedan acceder a su información.",level:"Intermedio",category:"multimedia",intro:"HTML ofrece mecanismos como track para subtítulos y pistas de texto, pero la accesibilidad también depende de producir transcripciones y descripciones adecuadas.",code:`<video controls>
  <source src="clase.mp4" type="video/mp4">
  <track kind="captions" src="subtitulos-es.vtt"
         srclang="es" label="Español" default>
</video>

<audio controls src="entrevista.mp3"></audio>
<p><a href="transcripcion.html">Leer la transcripción</a></p>`,points:["Los subtítulos captions incluyen diálogos y sonidos relevantes; no son solamente traducciones.","track permite asociar archivos de pistas temporizadas, normalmente WebVTT.","Una transcripción ofrece el contenido hablado en formato textual.","Los vídeos con información visual importante pueden necesitar audiodescripción."],tip:"Revisá que los subtítulos estén sincronizados, sean legibles y describan sonidos relevantes."}
};

const categoryNames={estructura:"Estructura del documento",etiquetas:"Etiquetas HTML",atributos:"Atributos HTML",formularios:"Formularios",multimedia:"Contenido multimedia"};
const esc=value=>String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const codeEsc=value=>esc(value);
document.addEventListener("DOMContentLoaded",()=>{
  const params=new URLSearchParams(location.search);
  const id=params.get("id");
  const article=articles[id];
  const title=document.getElementById("articleTitle");
  const body=document.getElementById("articleBody");
  if(!article){
    title.textContent="Artículo no encontrado";
    document.getElementById("articleLead").textContent="Este artículo todavía no está disponible en el catálogo.";
    body.innerHTML='<section class="article-section"><h2>Volver al catálogo</h2><p>Elegí otro tema desde la categoría HTML.</p></section>';
    return;
  }
  document.title=article.title+" | HTML | WebDev Book";
  title.textContent=article.title;
  document.getElementById("articleLead").textContent=article.lead;
  document.getElementById("articleKicker").textContent=article.kicker;
  document.getElementById("articleLevel").textContent="Nivel "+article.level.toLowerCase();
  document.getElementById("articleCrumb").textContent=article.title;
  const categoryUrl="categoria.html?tema="+encodeURIComponent(article.category);
  const categoryName=categoryNames[article.category]||"Categoría HTML";
  const crumb=document.getElementById("categoryCrumb");
  crumb.textContent=categoryName;crumb.href=categoryUrl;
  document.getElementById("backToCategory").href=categoryUrl;
  document.getElementById("footerBack").href=categoryUrl;
  const sections=[
    {id:"concepto",title:"¿Qué es y para qué sirve?",html:"<p>"+esc(article.intro)+"</p>"},
    {id:"ejemplo",title:"Sintaxis y ejemplo",html:'<p>Este ejemplo muestra una forma habitual de utilizarlo:</p><div class="code-example"><span class="code-caption">EJEMPLO HTML</span><pre><code>'+codeEsc(article.code)+'</code></pre></div>'},
    {id:"detalles",title:"Puntos importantes",html:"<ul>"+article.points.map(p=>"<li>"+esc(p)+"</li>").join("")+"</ul>"},
    {id:"buenas-practicas",title:"Buenas prácticas y errores frecuentes",html:"<ul><li>Usá el elemento o atributo por su significado, no solamente por su apariencia visual.</li><li>Comprobá que el marcado esté bien anidado y que los atributos correspondan al elemento.</li><li>Probá el resultado en más de un navegador y considerá accesibilidad y dispositivos móviles.</li></ul><div class=\"tip-box\"><strong>Consejo:</strong> "+esc(article.tip)+"</div>"},
    {id:"relacion",title:"Relación con CSS y JavaScript",html:"<p><strong>HTML:</strong> define la estructura y el significado del contenido.</p><p><strong>CSS:</strong> controla la presentación visual, el espaciado y la adaptación a diferentes pantallas.</p><p><strong>JavaScript:</strong> puede leer o modificar el elemento, responder a eventos y añadir comportamiento cuando el caso lo requiere.</p>"}
  ];
  body.innerHTML=sections.map(s=>'<section class="article-section" id="'+s.id+'"><h2>'+s.title+'</h2>'+s.html+'</section>').join("");
  document.getElementById("articleToc").innerHTML=sections.map(s=>'<a href="#'+s.id+'">'+s.title+'</a>').join("");
});
