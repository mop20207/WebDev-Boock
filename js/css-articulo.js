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
          cssEditor.value.replace(/<\\/style/gi, "<\\\\/style") +
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
  } catch (error) {
    title.textContent = "No se pudo cargar el artículo";
    lead.textContent = "Comprobá tu conexión y volvé a intentarlo.";
    body.replaceChildren(make("p", "article-error", error.message));
    console.error(error);
  }
});
