// Renderiza la documentación completa del tema CSS seleccionado.
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("tema");
  const itemIndex = Number(params.get("item"));
  const title = document.getElementById("articleTitle");
  const lead = document.getElementById("articleLead");
  const body = document.getElementById("articleBody");

  const categoryURL = "css-categoria.html?tema=" + encodeURIComponent(categoryId || "");
  const setBackLinks = (url) => {
    ["backToCategory", "footerBack", "backToTopics"].forEach(id => {
      const link = document.getElementById(id);
      if (link) link.href = url;
    });
  };

  const make = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };

  try {
    const response = await fetch("../data/css-articulos.json");
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de artículos CSS.");
    const database = await response.json();
    const article = database.articles.find(entry =>
      entry.categoryId === categoryId && entry.id === categoryId + "-" + itemIndex
    );

    if (!article) {
      title.textContent = "Tema no encontrado";
      lead.textContent = "Volvé a la categoría y elegí un tema disponible.";
      body.replaceChildren(make("p", "article-error", "No encontramos el contenido solicitado."));
      setBackLinks("css.html");
      return;
    }

    document.title = article.title + " | CSS | WebDev Book";
    title.textContent = article.title;
    lead.textContent = article.summary;
    document.getElementById("categoryCrumb").textContent = article.categoryTitle;
    document.getElementById("categoryCrumb").href = categoryURL;
    document.getElementById("articleCrumb").textContent = article.title;
    setBackLinks(categoryURL);

    const fragment = document.createDocumentFragment();

    // Láminas SVG didácticas: diagramas vectoriales propios, escalables y accesibles.
    const visualByCategory = {
      fundamentos: {title:"Del HTML al resultado visual",desc:"El navegador combina la estructura del documento y las reglas CSS para calcular y dibujar la página.",svg:`<svg viewBox="0 0 760 230" role="img" aria-label="HTML y CSS entran al navegador y producen una página renderizada"><defs><linearGradient id="vblue" x1="0" x2="1"><stop stop-color="#4f8cff"/><stop offset="1" stop-color="#8b72f6"/></linearGradient></defs><rect x="18" y="42" width="170" height="142" rx="16" fill="#17243b" stroke="#4f8cff"/><text x="103" y="78" text-anchor="middle" fill="#8db6ff" font-size="15" font-weight="700">HTML</text><text x="103" y="111" text-anchor="middle" fill="#fff" font-size="12">&lt;h1&gt;Hola&lt;/h1&gt;</text><text x="103" y="135" text-anchor="middle" fill="#aab8cf" font-size="11">Estructura</text><rect x="210" y="42" width="170" height="142" rx="16" fill="#17243b" stroke="#b18cff"/><text x="295" y="78" text-anchor="middle" fill="#c4a8ff" font-size="15" font-weight="700">CSS</text><text x="295" y="111" text-anchor="middle" fill="#fff" font-size="12">h1 { color: blue }</text><text x="295" y="135" text-anchor="middle" fill="#aab8cf" font-size="11">Presentación</text><path d="M190 112H205 M382 112H420" stroke="url(#vblue)" stroke-width="3" stroke-linecap="round"/><path d="M412 104l9 8-9 8" fill="none" stroke="#8b9cff" stroke-width="3"/><rect x="430" y="26" width="310" height="178" rx="18" fill="#111c2e" stroke="#5f789d"/><rect x="430" y="26" width="310" height="27" rx="18" fill="#263752"/><circle cx="448" cy="39" r="4" fill="#ff7b7b"/><circle cx="462" cy="39" r="4" fill="#ffc76b"/><circle cx="476" cy="39" r="4" fill="#68d6a1"/><rect x="455" y="72" width="260" height="111" rx="10" fill="#f4f7fc"/><rect x="474" y="91" width="92" height="10" rx="4" fill="#4f7fe0"/><rect x="474" y="111" width="220" height="7" rx="3" fill="#b9c5d8"/><rect x="474" y="125" width="192" height="7" rx="3" fill="#d0d8e5"/><rect x="474" y="146" width="76" height="22" rx="6" fill="#4f7fe0"/><text x="585" y="218" text-anchor="middle" fill="#aab8cf" font-size="11">Página renderizada</text></svg>`},
      caja: {title:"Las capas del modelo de caja",desc:"El contenido queda rodeado por padding, borde y margen. Cada capa modifica el espacio ocupado.",svg:`<svg viewBox="0 0 700 300" role="img" aria-label="Diagrama de margin, border, padding y content"><rect x="70" y="25" width="560" height="245" rx="12" fill="#f0a85b" fill-opacity=".2" stroke="#e5a34d" stroke-width="2"/><text x="350" y="49" fill="#f3b66c" text-anchor="middle" font-size="14" font-weight="700">MARGIN</text><rect x="125" y="65" width="450" height="170" rx="10" fill="#e4c85d" fill-opacity=".22" stroke="#d7bb4c" stroke-width="2"/><text x="350" y="88" fill="#e2cb68" text-anchor="middle" font-size="13" font-weight="700">BORDER</text><rect x="180" y="105" width="340" height="105" rx="8" fill="#53b9a3" fill-opacity=".2" stroke="#53b9a3" stroke-width="2"/><text x="350" y="128" fill="#69d7bf" text-anchor="middle" font-size="13" font-weight="700">PADDING</text><rect x="235" y="143" width="230" height="48" rx="7" fill="#568de9" fill-opacity=".3" stroke="#75a9ff" stroke-width="2"/><text x="350" y="172" fill="#a8caff" text-anchor="middle" font-size="14" font-weight="700">CONTENT</text></svg>`},
      flexbox: {title:"Los dos ejes de Flexbox",desc:"El eje principal depende de flex-direction. El eje transversal siempre es perpendicular.",svg:`<svg viewBox="0 0 700 260" role="img" aria-label="Eje principal y eje transversal de un contenedor flex"><rect x="120" y="38" width="470" height="178" rx="16" fill="#17243b" stroke="#506b91"/><rect x="155" y="95" width="95" height="72" rx="10" fill="#416fca"/><rect x="275" y="95" width="95" height="72" rx="10" fill="#6d65c9"/><rect x="395" y="95" width="95" height="72" rx="10" fill="#328e88"/><path d="M135 190H555m-12-8 12 8-12 8" stroke="#8fb7ff" stroke-width="3" fill="none"/><text x="345" y="242" fill="#8fb7ff" text-anchor="middle" font-size="13">Eje principal →</text><path d="M105 195V55m-8 12 8-12 8 12" stroke="#65d6be" stroke-width="3" fill="none"/><text x="83" y="125" fill="#65d6be" text-anchor="middle" font-size="12" transform="rotate(-90 83 125)">Eje transversal</text></svg>`},
      grid: {title:"Una cuadrícula en dos dimensiones",desc:"Grid permite definir filas y columnas y ubicar elementos en sus celdas.",svg:`<svg viewBox="0 0 700 260" role="img" aria-label="Cuadrícula CSS Grid de tres columnas y dos filas"><rect x="115" y="25" width="470" height="205" rx="12" fill="#17243b" stroke="#617ca4"/><g fill="#416fca" stroke="#9abaff" stroke-width="1"><rect x="135" y="45" width="130" height="75" rx="8"/><rect x="275" y="45" width="130" height="75" rx="8"/><rect x="415" y="45" width="150" height="75" rx="8"/><rect x="135" y="132" width="130" height="78" rx="8"/><rect x="275" y="132" width="130" height="78" rx="8"/><rect x="415" y="132" width="150" height="78" rx="8"/></g><g fill="#fff" font-size="13" text-anchor="middle"><text x="200" y="88">1</text><text x="340" y="88">2</text><text x="490" y="88">3</text><text x="200" y="177">4</text><text x="340" y="177">5</text><text x="490" y="177">6</text></g></svg>`},
      posicionamiento: {title:"Elementos y sus referencias",desc:"relative conserva su lugar; absolute se referencia a un ancestro adecuado; fixed se ancla al viewport; sticky acompaña el desplazamiento.",svg:`<svg viewBox="0 0 700 270" role="img" aria-label="Comparación visual de posicionamiento CSS"><g font-size="13" text-anchor="middle" fill="#dce8ff"><rect x="25" y="35" width="145" height="185" rx="12" fill="#17243b" stroke="#526b91"/><rect x="55" y="85" width="85" height="55" rx="8" fill="#4778ce"/><text x="97" y="165">relative</text><rect x="190" y="35" width="145" height="185" rx="12" fill="#17243b" stroke="#526b91"/><rect x="220" y="70" width="85" height="115" rx="8" fill="none" stroke="#6c819f" stroke-dasharray="4 4"/><rect x="250" y="55" width="65" height="45" rx="8" fill="#8469cf"/><text x="262" y="205">absolute</text><rect x="355" y="35" width="145" height="185" rx="12" fill="#17243b" stroke="#526b91"/><rect x="375" y="50" width="105" height="28" rx="6" fill="#328e88"/><text x="427" y="165">fixed</text><rect x="520" y="35" width="155" height="185" rx="12" fill="#17243b" stroke="#526b91"/><rect x="540" y="50" width="115" height="28" rx="6" fill="#b07a39"/><path d="M540 100H655M540 125H655M540 150H655" stroke="#647b9d" stroke-width="5"/><text x="597" y="205">sticky</text></g></svg>`},
      responsive: {title:"Un diseño, distintos espacios",desc:"El layout responde al ancho disponible. Los breakpoints se agregan cuando el contenido los necesita.",svg:`<svg viewBox="0 0 700 250" role="img" aria-label="Diseño responsive en móvil, tablet y escritorio"><g fill="#17243b" stroke="#647fa6" stroke-width="2"><rect x="65" y="30" width="105" height="190" rx="15"/><rect x="260" y="48" width="180" height="155" rx="13"/><rect x="500" y="55" width="150" height="145" rx="10"/></g><g fill="#5b88dc"><rect x="78" y="55" width="79" height="18" rx="4"/><rect x="78" y="83" width="79" height="48" rx="5"/><rect x="78" y="140" width="79" height="48" rx="5"/><rect x="274" y="67" width="152" height="20" rx="4"/><rect x="274" y="97" width="70" height="90" rx="5"/><rect x="354" y="97" width="72" height="90" rx="5"/><rect x="514" y="74" width="122" height="18" rx="4"/><rect x="514" y="103" width="55" height="82" rx="5"/><rect x="580" y="103" width="56" height="82" rx="5"/></g><g fill="#b8c7df" font-size="12" text-anchor="middle"><text x="117" y="242">Móvil</text><text x="350" y="224">Tablet</text><text x="575" y="222">Escritorio</text></g></svg>`},
      selectores: {title:"Cómo un selector encuentra elementos",desc:"El navegador compara los selectores con el árbol del documento y aplica las reglas que coinciden.",svg:`<svg viewBox="0 0 700 250" role="img" aria-label="Árbol HTML con selector que coincide con elementos"><g stroke="#7288a9" stroke-width="2" fill="none"><path d="M350 55V90M350 90H170V125M350 90V125M350 90H530V125"/></g><g font-size="13" text-anchor="middle"><rect x="290" y="20" width="120" height="38" rx="8" fill="#315f9f"/><text x="350" y="44" fill="white">.contenedor</text><rect x="110" y="125" width="120" height="45" rx="8" fill="#246f6b"/><text x="170" y="153" fill="white">.tarjeta</text><rect x="290" y="125" width="120" height="45" rx="8" fill="#246f6b"/><text x="350" y="153" fill="white">.tarjeta</text><rect x="470" y="125" width="120" height="45" rx="8" fill="#26364d" stroke="#60738e"/><text x="530" y="153" fill="#b7c4d8">.pie</text><text x="350" y="210" fill="#9fb2ce">.contenedor .tarjeta selecciona las dos tarjetas</text></g></svg>`},
      cascada: {title:"Cómo se resuelve un conflicto",desc:"La cascada evalúa prioridad, origen, capas, especificidad y orden para decidir qué declaración prevalece.",svg:`<svg viewBox="0 0 700 240" role="img" aria-label="Flujo de decisión de la cascada CSS"><g text-anchor="middle" font-size="13"><rect x="230" y="15" width="240" height="38" rx="9" fill="#315f9f"/><text x="350" y="39" fill="white">Declaraciones candidatas</text><path d="M350 53V76" stroke="#91b4ef" stroke-width="2"/><rect x="230" y="76" width="240" height="38" rx="9" fill="#594f9d"/><text x="350" y="100" fill="white">Prioridad e importancia</text><path d="M350 114V137" stroke="#91b4ef" stroke-width="2"/><rect x="230" y="137" width="240" height="38" rx="9" fill="#246f6b"/><text x="350" y="161" fill="white">Capas y especificidad</text><path d="M350 175V196" stroke="#91b4ef" stroke-width="2"/><text x="350" y="220" fill="#a9c2e6">Orden final → valor aplicado</text></g></svg>`},
      variables: {title:"Variables y valores reutilizables",desc:"Definí tokens en :root y reutilizalos en distintos componentes. Los componentes pueden sobrescribirlos.",svg:`<svg viewBox="0 0 700 230" role="img" aria-label="Una variable CSS reutilizada en varios componentes"><rect x="35" y="65" width="190" height="100" rx="14" fill="#17243b" stroke="#8e79df"/><text x="130" y="97" text-anchor="middle" fill="#c6b5ff" font-size="14">:root</text><text x="130" y="123" text-anchor="middle" fill="#fff" font-size="12">--acento: azul</text><path d="M225 115H275M275 45V185M275 45H330M275 115H330M275 185H330" stroke="#8e9fc0" stroke-width="2" fill="none"/><g fill="#315f9f"><rect x="330" y="20" width="150" height="50" rx="9"/><rect x="330" y="90" width="150" height="50" rx="9"/><rect x="330" y="160" width="150" height="50" rx="9"/></g><g fill="white" font-size="12" text-anchor="middle"><text x="405" y="50">Botón</text><text x="405" y="120">Enlace</text><text x="405" y="190">Tarjeta</text></g><text x="560" y="120" fill="#9fb2ce" font-size="12">Mismo token</text></svg>`},
      tipografia: {title:"Jerarquía tipográfica",desc:"Tamaño, peso, ancho de línea y altura de línea ayudan a construir una lectura clara.",svg:`<svg viewBox="0 0 700 220" role="img" aria-label="Ejemplo de jerarquía tipográfica con título, subtítulo y párrafo"><rect x="55" y="22" width="590" height="176" rx="15" fill="#17243b" stroke="#536d94"/><text x="90" y="78" fill="#e5edff" font-size="34" font-weight="700">Título principal</text><text x="90" y="111" fill="#9fbaff" font-size="19" font-weight="600">Subtítulo de sección</text><text x="90" y="145" fill="#c2cede" font-size="13">Un párrafo de lectura cómoda con una altura de línea</text><text x="90" y="166" fill="#c2cede" font-size="13">generosa y un ancho controlado.</text></svg>`},
      colores: {title:"Capas de color y fondo",desc:"Los colores, gradientes, bordes y sombras forman superficies visuales y jerarquías.",svg:`<svg viewBox="0 0 700 220" role="img" aria-label="Muestras de color sólido, gradiente, borde y sombra"><defs><linearGradient id="gradA"><stop stop-color="#3985e8"/><stop offset="1" stop-color="#9a62d9"/></linearGradient></defs><rect x="45" y="55" width="135" height="105" rx="15" fill="#3985e8"/><rect x="205" y="55" width="135" height="105" rx="15" fill="url(#gradA)"/><rect x="365" y="55" width="135" height="105" rx="15" fill="#17243b" stroke="#68c8b6" stroke-width="3"/><rect x="525" y="55" width="135" height="105" rx="15" fill="#17243b" stroke="#526d94" filter="drop-shadow(0 8px 8px #0008)"/><g fill="#c2cee0" font-size="12" text-anchor="middle"><text x="112" y="185">Color</text><text x="272" y="185">Gradiente</text><text x="432" y="185">Borde</text><text x="592" y="185">Sombra</text></g></svg>`},
      transformaciones: {title:"Transformar sin cambiar el flujo",desc:"El elemento cambia visualmente de posición, escala o rotación, pero conserva su espacio original en el layout.",svg:`<svg viewBox="0 0 700 230" role="img" aria-label="Comparación de elemento original y transformado"><rect x="80" y="75" width="120" height="80" rx="12" fill="#526d94" fill-opacity=".3" stroke="#8ca2c4" stroke-dasharray="5 4"/><rect x="285" y="75" width="120" height="80" rx="12" fill="#4e85d8" transform="translate(25 -18) rotate(-8 345 115)"/><path d="M215 115H270m-10-8 10 8-10 8" stroke="#9bb8e7" stroke-width="3" fill="none"/><g fill="#b8c7df" font-size="12" text-anchor="middle"><text x="140" y="185">Original</text><text x="345" y="185">Transformado</text></g></svg>`},
      animaciones: {title:"Una transición entre dos estados",desc:"Una transición interpola los valores cuando un estado cambia, por ejemplo al pasar el cursor o recibir foco.",svg:`<svg viewBox="0 0 700 210" role="img" aria-label="Secuencia de posiciones de un elemento animado"><path d="M65 145H635" stroke="#657b9b" stroke-width="3" stroke-linecap="round"/><g fill="#4e85d8"><circle cx="100" cy="145" r="16"/><circle cx="260" cy="145" r="16" opacity=".75"/><circle cx="420" cy="145" r="16" opacity=".5"/><circle cx="580" cy="145" r="16" opacity=".3"/></g><g fill="#aebfd8" font-size="12" text-anchor="middle"><text x="100" y="185">0%</text><text x="260" y="185">33%</text><text x="420" y="185">66%</text><text x="580" y="185">100%</text></g><text x="350" y="45" fill="#c5d6f1" font-size="15" text-anchor="middle">Estado inicial → Estado final</text></svg>`},
      accesibilidad: {title:"Estados visibles para todas las personas",desc:"Un control debe comunicar su estado con algo más que color y conservar una señal clara al navegar con teclado.",svg:`<svg viewBox="0 0 700 210" role="img" aria-label="Botones con estados normal, hover y foco visible"><g font-size="13" text-anchor="middle"><rect x="60" y="65" width="160" height="65" rx="12" fill="#315f9f"/><text x="140" y="103" fill="white">Normal</text><rect x="270" y="65" width="160" height="65" rx="12" fill="#477bc2"/><text x="350" y="103" fill="white">Hover</text><rect x="480" y="65" width="160" height="65" rx="12" fill="#315f9f" stroke="#8fc2ff" stroke-width="4"/><text x="560" y="103" fill="white">Foco visible</text><text x="350" y="175" fill="#aebfd8">El estado no depende solamente del color</text></g></svg>`}
    };

    const visual = visualByCategory[article.categoryId] || visualByCategory.fundamentos;
    const visualSection = make("section", "article-section article-visual");
    visualSection.append(make("h2", "", visual.title));
    visualSection.append(make("p", "article-paragraph", visual.desc));
    const visualFrame = make("div", "visual-frame");
    visualFrame.innerHTML = visual.svg;
    visualSection.append(visualFrame);
    fragment.append(visualSection);

    // Agrega controles de copia a cada bloque de código.
    const addCopyButtons = (root) => {
      root.querySelectorAll("pre.article-code").forEach(pre => {
        if (pre.querySelector(".code-copy")) return;
        const toolbar = make("div", "code-toolbar");
        const lang = make("span", "code-language", "CSS");
        const copy = make("button", "code-copy", "Copiar código");
        copy.type = "button";
        copy.addEventListener("click", async () => {
          const source = pre.querySelector("code")?.textContent || "";
          try {
            await navigator.clipboard.writeText(source);
            copy.textContent = "¡Copiado!";
            copy.classList.add("is-copied");
          } catch {
            const temporary = make("textarea");
            temporary.value = source;
            document.body.append(temporary);
            temporary.select();
            const ok = document.execCommand("copy");
            temporary.remove();
            copy.textContent = ok ? "¡Copiado!" : "No se pudo copiar";
          }
          setTimeout(() => { copy.textContent = "Copiar código"; copy.classList.remove("is-copied"); }, 1800);
        });
        toolbar.append(lang, copy);
        pre.before(toolbar);
      });
    };

    article.sections.forEach((section, index) => {
      const sectionElement = make("section", "article-section");
      sectionElement.append(make("h2", "", section.title));
      if (section.body) sectionElement.append(make("p", "article-paragraph", section.body));
      if (section.code) {
        const pre = make("pre", "article-code");
        const code = make("code", "language-" + (section.language || "text"), section.code);
        pre.append(code);
        sectionElement.append(pre);
      }
      if (section.list) {
        const list = make("ul", "article-list");
        section.list.forEach(item => list.append(make("li", "", item)));
        sectionElement.append(list);
      }
      fragment.append(sectionElement);
    });

    // Objetivos de aprendizaje, ejemplos alternativos, laboratorio, reto y autoevaluación.
    if (article.learning) {
      const learning = article.learning;

      const goalsSection = make("section", "article-section article-goals");
      goalsSection.append(make("h2", "", "Qué vas a aprender"));
      const goals = make("ul", "article-list");
      learning.goals.forEach(goal => goals.append(make("li", "", goal)));
      goalsSection.append(goals);
      goalsSection.append(make("p", "article-note", "Nivel sugerido: " + learning.level + " · Tiempo estimado: " + learning.estimatedMinutes + " minutos"));
      fragment.append(goalsSection);

      const examplesSection = make("section", "article-section article-examples");
      examplesSection.append(make("h2", "", "Ejemplos para estudiar"));
      learning.exampleVariants.forEach((example, index) => {
        const details = make("details", "example-details");
        const summary = make("summary", "", example.title);
        details.append(summary, make("p", "article-paragraph", example.description));
        const pre = make("pre", "article-code");
        pre.append(make("code", "language-css", example.code));
        details.append(pre);
        examplesSection.append(details);
      });
      fragment.append(examplesSection);

      const labSection = make("section", "article-section article-lab");
      labSection.append(make("h2", "", learning.lab.title));
      labSection.append(make("p", "article-paragraph", learning.lab.instructions));
      const labGrid = make("div", "lab-grid");
      const editorPanel = make("div", "lab-editor-panel");
      editorPanel.append(make("label", "lab-label", "HTML de la demostración"));
      const htmlEditor = make("textarea", "lab-editor lab-html");
      htmlEditor.value = learning.lab.html;
      htmlEditor.spellcheck = false;
      htmlEditor.setAttribute("aria-label", "HTML de demostración");
      editorPanel.append(htmlEditor);
      editorPanel.append(make("label", "lab-label", "CSS editable"));
      const cssEditor = make("textarea", "lab-editor lab-css");
      cssEditor.value = learning.lab.css;
      cssEditor.spellcheck = false;
      cssEditor.setAttribute("aria-label", "Editor CSS");
      editorPanel.append(cssEditor);
      const actions = make("div", "lab-actions");
      const runButton = make("button", "lab-run", "▶ Ejecutar CSS");
      runButton.type = "button";
      const resetButton = make("button", "lab-reset", "Restablecer");
      resetButton.type = "button";
      actions.append(runButton, resetButton);
      editorPanel.append(actions);
      const previewPanel = make("div", "lab-preview-panel");
      previewPanel.append(make("span", "lab-label", "Resultado en vivo"));
      const preview = make("iframe", "lab-preview");
      preview.title = "Vista previa del laboratorio CSS";
      preview.setAttribute("sandbox", "");
      previewPanel.append(preview);
      labGrid.append(editorPanel, previewPanel);
      labSection.append(labGrid);
      const updatePreview = () => {
        preview.srcdoc = "<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>" +
          cssEditor.value.split("</style").join("<\\/style") +
          "</style></head><body>" + htmlEditor.value + "</body></html>";
      };
      runButton.addEventListener("click", updatePreview);
      resetButton.addEventListener("click", () => {
        htmlEditor.value = learning.lab.html;
        cssEditor.value = learning.lab.starterCss;
        updatePreview();
      });
      updatePreview();
      fragment.append(labSection);

      const challengeSection = make("section", "article-section article-challenge");
      challengeSection.append(make("h2", "", learning.challenge.title));
      challengeSection.append(make("p", "article-paragraph", learning.challenge.prompt));
      const hints = make("details", "challenge-hints");
      hints.append(make("summary", "", "Ver pistas"));
      const hintList = make("ul", "article-list");
      learning.challenge.hints.forEach(hint => hintList.append(make("li", "", hint)));
      hints.append(hintList);
      challengeSection.append(hints);
      const solution = make("details", "challenge-solution");
      solution.append(make("summary", "", "Consultar una posible solución"));
      const solutionCode = make("pre", "article-code");
      solutionCode.append(make("code", "language-css", learning.challenge.solution));
      solution.append(solutionCode);
      challengeSection.append(solution);
      fragment.append(challengeSection);

      const quizSection = make("section", "article-section article-quiz");
      quizSection.append(make("h2", "", "Comprobá lo que aprendiste"));
      quizSection.append(make("p", "article-paragraph", learning.quiz.question));
      const quizForm = make("form", "quiz-form");
      const feedback = make("p", "quiz-feedback");
      feedback.setAttribute("aria-live", "polite");
      learning.quiz.options.forEach((option, index) => {
        const label = make("label", "quiz-option");
        const input = make("input");
        input.type = "radio";
        input.name = "css-quiz-answer";
        input.value = String(index);
        input.required = true;
        label.append(input, make("span", "", option));
        quizForm.append(label);
      });
      const checkButton = make("button", "lab-run", "Comprobar respuesta");
      checkButton.type = "submit";
      quizForm.append(checkButton);
      quizForm.addEventListener("submit", event => {
        event.preventDefault();
        const selected = quizForm.querySelector('input[name="css-quiz-answer"]:checked');
        if (!selected) {
          feedback.textContent = "Elegí una respuesta antes de comprobar.";
          feedback.className = "quiz-feedback is-wrong";
          return;
        }
        const correct = Number(selected.value) === learning.quiz.correct;
        feedback.textContent = (correct ? "¡Correcto! " : "Todavía no. ") + learning.quiz.explanation;
        feedback.className = "quiz-feedback " + (correct ? "is-correct" : "is-wrong");
      });
      quizSection.append(quizForm, feedback);
      fragment.append(quizSection);
    }

    const resourcesSection = make("section", "article-section article-resources");
    resourcesSection.append(make("h2", "", "Documentación oficial y recursos"));
    resourcesSection.append(make("p", "article-paragraph", "Consultá estas referencias para ampliar conceptos, revisar sintaxis y comprobar compatibilidad."));
    const resourcesList = make("ul", "article-list");
    article.resources.forEach(url => {
      const li = make("li");
      const link = make("a", "", url.includes("w3.org") ? "Especificación W3C" : "Documentación MDN");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      li.append(link);
      resourcesList.append(li);
    });
    resourcesSection.append(resourcesList);
    fragment.append(resourcesSection);
    body.replaceChildren(fragment);
    addCopyButtons(body);
    if (window.Prism) Prism.highlightAllUnder(body);
  } catch (error) {
    title.textContent = "No se pudo cargar el artículo";
    lead.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    body.replaceChildren(make("p", "article-error", error.message));
    console.error(error);
  }
});
