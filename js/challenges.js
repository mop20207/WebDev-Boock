(() => {
  "use strict";

  const DATA_URL = document.body.dataset.page === "challenge-detail" ? "../../data/challenges.json" : "../data/challenges.json";
  const STORAGE_KEY = "webdevbook.challenges.v1";
  const LEVEL_NAMES = {
    principiante: "Principiante",
    intermedio: "Intermedio",
    avanzado: "Avanzado",
    experto: "Experto"
  };

  const listNode = document.getElementById("challengeList");
  const workspace = document.getElementById("challengeWorkspace");
  const technologyFilter = document.getElementById("technologyFilter");
  const searchInput = document.getElementById("challengeSearch");
  const visibleCount = document.getElementById("challengeVisibleCount");
  const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];

  let challenges = [];
  let activeLabId = null;
  let activeLabTitle = null;
  let activeDifficulty = "all";
  let activeChallenge = null;
  let revealedHints = 0;
  let compilerPromise = null;
  let activeRunner = null;
  let runnerTimeout = null;
  let activeRunnerCleanup = null;
  let progress = readProgress();

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        completed: Array.isArray(saved.completed) ? [...new Set(saved.completed)] : [],
        attempts: saved.attempts && typeof saved.attempts === "object" ? saved.attempts : {}
      };
    } catch (error) {
      console.warn("[WebDev Book] No se pudo leer el progreso de retos.", error);
      return { completed: [], attempts: {} };
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn("[WebDev Book] No se pudo guardar el progreso de retos.", error);
    }
    updateProgressSummary();
    renderList();
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function addItems(parent, items) {
    const list = node("ul");
    (items || []).forEach(item => list.append(node("li", "", item)));
    parent.append(list);
  }

  function createInfoCard(title, items, paragraph) {
    const card = node("section", "challenge-info-card");
    card.append(node("h3", "", title));
    if (paragraph) card.append(node("p", "", paragraph));
    if (items) addItems(card, items);
    return card;
  }

  function updateProgressSummary() {
    const completed = progress.completed.length;
    const total = challenges.length;
    const percent = total ? Math.round(completed / total * 100) : 0;
    const label = document.getElementById("challengeProgressLabel");
    const bar = document.getElementById("challengeProgressBar");
    const heroCompleted = document.getElementById("challengeCompletedHero");
    const heroTotal = document.getElementById("challengeTotal");
    if (label) label.textContent = completed + " de " + total + " retos completados";
    if (bar) bar.style.width = percent + "%";
    if (heroCompleted) heroCompleted.textContent = completed;
    if (heroTotal) heroTotal.textContent = total;
  }

  function populateTechnologyFilter() {
    const technologies = [...new Map(challenges.map(challenge => [
      challenge.technology,
      challenge.technologyName || challenge.technology
    ])).entries()];
    technologies.forEach(([id, label]) => {
      const option = node("option", "", label);
      option.value = id;
      technologyFilter.append(option);
    });
  }

  function filteredChallenges() {
    const query = (searchInput.value || "").trim().toLocaleLowerCase("es");
    const technology = technologyFilter.value;
    return challenges.filter(challenge => {
      const matchesDifficulty = activeDifficulty === "all" || challenge.difficulty === activeDifficulty;
      const matchesTechnology = technology === "all" || challenge.technology === technology;
      const haystack = [
        challenge.title,
        challenge.summary,
        challenge.statement,
        challenge.technologyName,
        challenge.difficulty
      ].join(" ").toLocaleLowerCase("es");
      return matchesDifficulty && matchesTechnology && (!query || haystack.includes(query));
    });
  }

  function renderList() {
    if (!listNode) return;
    const filtered = filteredChallenges();
    listNode.replaceChildren();
    if (visibleCount) visibleCount.textContent = filtered.length;
    if (!filtered.length) {
      listNode.append(node("p", "challenge-list-empty", "No hay retos que coincidan con esos filtros. Probá otra tecnología o dificultad."));
      return;
    }

    filtered.forEach(challenge => {
      const completed = progress.completed.includes(challenge.id);
      const card = node("a", "challenge-card" + (activeChallenge?.id === challenge.id ? " active" : ""));
      if (activeLabId) {
        const target = new URL("challenges.html", document.baseURI);
        target.searchParams.set("lab", activeLabId);
        target.searchParams.set("challenge", challenge.id);
        card.href = target.href;
      } else {
        card.href = "retos/" + challenge.id + ".html";
      }
      card.setAttribute("aria-label", "Abrir reto: " + challenge.title);
      const top = node("div", "challenge-card-top");
      top.append(
        node("span", "challenge-badge level-" + challenge.difficulty, LEVEL_NAMES[challenge.difficulty] || challenge.difficulty),
        node("span", "challenge-card-status", completed ? "✓ COMPLETADO" : "")
      );
      card.append(top, node("h3", "", challenge.title), node("p", "", challenge.summary));
      const meta = node("div", "challenge-card-meta");
      meta.append(node("span", "", challenge.technologyName || challenge.technology));
      meta.append(node("span", "", "· " + (challenge.estimatedMinutes || 15) + " min"));
      card.append(meta);
      listNode.append(card);
    });
  }

  function renderChallenge(id, shouldScroll = false) {
    cancelActiveRunner();
    const challenge = challenges.find(item => item.id === id);
    if (!challenge) return;
    activeChallenge = challenge;
    workspace.classList.add("has-active-challenge");
    revealedHints = 0;
    renderList();
    workspace.replaceChildren();

    const header = node("header", "challenge-detail-header");
    const badges = node("div", "challenge-detail-badges");
    badges.append(
      node("span", "challenge-badge", challenge.technologyName || challenge.technology),
      node("span", "challenge-badge level-" + challenge.difficulty, LEVEL_NAMES[challenge.difficulty] || challenge.difficulty),
      node("span", "challenge-badge", (challenge.estimatedMinutes || 15) + " MIN")
    );
    header.append(badges, node("h2", "", challenge.title), node("p", "", challenge.summary));
    if (progress.completed.includes(challenge.id)) {
      header.append(node("div", "challenge-progress-state", "✓ Este reto ya está completado. Podés volver a practicarlo cuando quieras."));
    } else if (progress.attempts[challenge.id]) {
      header.append(node("div", "challenge-progress-state", "Intentos realizados: " + progress.attempts[challenge.id]));
    }
    workspace.append(header);

    const infoGrid = node("div", "challenge-info-grid");
    infoGrid.append(
      createInfoCard("Descripción del problema", null, challenge.statement),
      createInfoCard("Objetivos de aprendizaje", challenge.objectives),
      createInfoCard("Requisitos", challenge.requirements)
    );
    workspace.append(infoGrid);

    const editorHeading = node("div", "challenge-section-title");
    editorHeading.append(node("h3", "","Tu solución"), node("span", "", "El código se ejecuta en un entorno aislado."));
    workspace.append(editorHeading);

    const isHtmlCss = challenge.language === "htmlcss";
    const hasFrameworkPreview = ["react", "vue", "webcomponents"].includes(challenge.runner);
    const editorShell = node("div", "challenge-editor-shell");
    const toolbar = node("div", "challenge-editor-toolbar");
    const editorLanguage = challenge.runner === "terminal-sim"
      ? "TERMINAL LINUX · SIMULADOR"
      : isHtmlCss
      ? "HTML + CSS · EDITOR"
      : challenge.runner === "react" ? "REACT · JSX EDITOR"
        : challenge.runner === "vue" ? "VUE.JS · EDITOR"
          : challenge.runner === "webcomponents" ? "WEB COMPONENTS · EDITOR"
            : challenge.runner === "node-sim" ? "NODE.JS · SIMULADOR"
              : challenge.runner === "astro-static" ? "ASTRO · VALIDADOR ESTÁTICO"
                : challenge.runner === "postgres" ? "POSTGRESQL · SQL"
                  : challenge.runner === "mongo-sim" ? "MONGODB · SIMULADOR"
                    : challenge.runner === "api-sim" ? "FETCH API · SIMULADOR"
                      : challenge.runner === "testing-sim" ? "TEST RUNNER · EDITOR"
                        : challenge.runner === "docker-static" ? "DOCKERFILE / COMPOSE · VALIDADOR"
                          : challenge.language.toUpperCase() + " · EDITOR";
    toolbar.append(node("span", "challenge-editor-language", editorLanguage));
    const actions = node("div", "challenge-editor-actions");
    const resetButton = node("button", "challenge-action", "Restablecer");
    resetButton.type = "button";
    const runButton = node("button", "challenge-action primary", "▶ Ejecutar pruebas");
    runButton.type = "button";
    actions.append(resetButton, runButton);
    toolbar.append(actions);
    const editor = node("textarea", "challenge-editor");
    editor.id = "challengeEditor";
    editor.spellcheck = false;
    editor.autocapitalize = "off";
    editor.autocomplete = "off";
    editor.autocorrect = "off";
    editor.setAttribute("aria-label", isHtmlCss ? "Editor HTML del reto" : "Editor de código para el reto");
    editor.value = isHtmlCss ? (challenge.htmlCode || "") : (challenge.starterCode || "");
    const editorHelp = node("div", "challenge-editor-help");
    const runnerHelp = challenge.runner === "terminal-sim"
      ? "Terminal didáctica segura: solo acepta comandos permitidos y trabaja en un sistema de archivos virtual, sin acceso al teléfono."
      : challenge.runner === "game-logic"
        ? "Lógica de videojuegos 2D en JavaScript: se prueban funciones puras. No se ejecuta el motor Phaser completo."
      : isHtmlCss
      ? "HTML y CSS se renderizan sin scripts ni acceso a la red."
      : challenge.runner === "node-sim"
        ? "Simulador educativo: APIs de Node.js con datos en memoria; no accede al servidor, red ni archivos reales."
        : challenge.runner === "astro-static"
          ? "Validador estático de componentes Astro: revisa estructura y directivas, pero no compila un proyecto Astro completo."
          : challenge.runner === "postgres"
            ? "PostgreSQL real en WebAssembly mediante PGlite. Se descarga desde CDN; cada ejecución usa una base temporal aislada."
            : challenge.runner === "mongo-sim"
              ? "Simulador en memoria de consultas, CRUD y aggregation. No conecta con un servidor MongoDB real."
              : challenge.runner === "api-sim"
                ? "Fetch simulado con respuestas locales; permite probar métodos, JSON, paginación y errores sin acceder a Internet."
                : challenge.runner === "testing-sim"
                  ? "Mini runner didáctico con test, expect y spies vi.fn; no es una instalación completa de Vitest."
                  : challenge.runner === "docker-static"
                    ? "Validador estático de Dockerfile y Compose. No construye imágenes ni ejecuta un Docker Engine."
                    : hasFrameworkPreview
                      ? "Vista previa aislada. React y Vue se cargan desde CDN; Web Components usa APIs nativas del navegador."
                      : "Tip: leé los requisitos y probá una solución pequeña primero.";
    editorHelp.append(node("span", "", runnerHelp), node("span", "", "Ctrl + Enter para ejecutar"));
    let cssEditor = null;
    let previewFrame = null;
    let terminalOutput = null;
    if (isHtmlCss) {
      cssEditor = node("textarea", "challenge-editor challenge-editor-compact");
      cssEditor.id = "challengeCssEditor";
      cssEditor.setAttribute("aria-label", "Editor CSS del reto");
      cssEditor.value = challenge.cssCode || "";
      const panes = node("div", "challenge-dual-editors");
      const hp = node("div", "challenge-code-pane");
      const cp = node("div", "challenge-code-pane");
      const hl = node("label", "challenge-code-label", "HTML");
      const cl = node("label", "challenge-code-label", "CSS");
      hl.htmlFor = "challengeEditor";
      cl.htmlFor = "challengeCssEditor";
      hp.append(hl, editor);
      cp.append(cl, cssEditor);
      panes.append(hp, cp);
      previewFrame = document.createElement("iframe");
      previewFrame.className = "challenge-live-preview";
      previewFrame.title = "Vista previa HTML y CSS";
      previewFrame.setAttribute("sandbox", "allow-same-origin");
      const updatePreview = () => { previewFrame.srcdoc = htmlCssDocument(editor.value, cssEditor.value, "", ""); };
      editor.addEventListener("input", updatePreview);
      cssEditor.addEventListener("input", updatePreview);
      updatePreview();
      editorShell.append(toolbar, panes, node("div", "challenge-preview-heading", "Vista previa"), previewFrame, editorHelp);
    } else if (hasFrameworkPreview) {
      previewFrame = document.createElement("iframe");
      previewFrame.className = "challenge-live-preview";
      previewFrame.title = "Vista previa aislada de " + challenge.technologyName;
      previewFrame.setAttribute("sandbox", "allow-scripts");
      previewFrame.dataset.persistentPreview = "true";
      previewFrame.srcdoc = "<!doctype html><html lang=\"es\"><body style=\"font:14px sans-serif;padding:16px;color:#64748b\">Ejecutá las pruebas para ver el componente.</body></html>";
      editorShell.append(toolbar, editor, node("div", "challenge-preview-heading", "Vista previa del componente"), previewFrame, editorHelp);
    } else if (challenge.runner === "terminal-sim") {
      const outputHeading = node("div", "challenge-preview-heading", "Salida de la terminal virtual");
      terminalOutput = node("pre", "lab-terminal-output", "La salida de los comandos aparecerá acá.");
      terminalOutput.setAttribute("aria-live", "polite");
      terminalOutput.setAttribute("role", "log");
      editorShell.append(toolbar, editor, outputHeading, terminalOutput, editorHelp);
    } else {
      editorShell.append(toolbar, editor, editorHelp);
    }
    workspace.append(editorShell);

    const results = node("section", "challenge-results");
    results.id = "challengeResults";
    results.setAttribute("aria-live", "polite");
    results.append(node("h4", "", "Resultado de las pruebas"), node("p", "", "Todavía no ejecutaste las pruebas. Cuando estés listo, presioná “Ejecutar pruebas”."));
    workspace.append(results);

    const guidance = node("div", "challenge-guidance-grid");
    const hintCard = node("section", "challenge-guidance-card");
    hintCard.append(node("h3", "", "Pistas progresivas"));
    const hintText = node("p", "", "Las pistas se muestran de a una para ayudarte sin revelar toda la solución.");
    hintText.id = "challengeHintText";
    const hintActions = node("div", "challenge-guidance-actions");
    const hintButton = node("button", "", "Mostrar pista 1 de " + challenge.hints.length);
    hintButton.type = "button";
    hintActions.append(hintButton);
    hintCard.append(hintText, hintActions);

    const solutionCard = node("section", "challenge-guidance-card");
    solutionCard.append(node("h3", "", "Solución comentada"));
    solutionCard.append(node("p", "", "Consultá la solución después de intentar resolver el problema por tu cuenta."));
    const solutionActions = node("div", "challenge-guidance-actions");
    const solutionButton = node("button", "", "Mostrar solución");
    solutionButton.type = "button";
    solutionActions.append(solutionButton);
    const solution = node("div", "challenge-solution");
    solution.hidden = true;
    const solutionCode = node("pre");
    solutionCode.textContent = challenge.solutionCode || "";
    const solutionExplanation = node("p", "", challenge.solutionExplanation || "");
    solution.append(solutionCode, solutionExplanation);
    solutionCard.append(solutionActions, solution);
    guidance.append(hintCard, solutionCard);
    workspace.append(guidance);

    const mistakes = node("section", "challenge-guidance-card");
    mistakes.style.marginTop = "12px";
    mistakes.append(node("h3", "", "Errores habituales"));
    addItems(mistakes, challenge.commonMistakes || []);
    workspace.append(mistakes);

    const completeBanner = node("div", "challenge-complete-banner", "✓ ¡Reto completado! Todas las pruebas pasaron. Tu progreso quedó guardado en este navegador.");
    completeBanner.hidden = !progress.completed.includes(challenge.id);
    workspace.append(completeBanner);

    resetButton.addEventListener("click", () => {
      cancelActiveRunner();
      editor.value = isHtmlCss ? (challenge.htmlCode || "") : (challenge.starterCode || "");
      if (isHtmlCss && cssEditor) { cssEditor.value = challenge.cssCode || ""; previewFrame.srcdoc = htmlCssDocument(editor.value, cssEditor.value, "", ""); }
      if (hasFrameworkPreview && previewFrame) previewFrame.srcdoc = "<!doctype html><html lang=\"es\"><body style=\"font:14px sans-serif;padding:16px;color:#64748b\">Ejecutá las pruebas para ver el componente.</body></html>";
      if (terminalOutput) terminalOutput.textContent = "La salida de los comandos aparecerá acá.";
      results.replaceChildren(node("h4", "", "Resultado de las pruebas"), node("p", "", "Código restablecido. Volvé a ejecutar las pruebas cuando estés listo."));
    });
    runButton.addEventListener("click", () => runChallenge(challenge, editor.value, results, completeBanner, runButton, cssEditor?.value, previewFrame, terminalOutput));
    editor.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runChallenge(challenge, editor.value, results, completeBanner, runButton, cssEditor?.value, previewFrame);
      }
    });
    hintButton.addEventListener("click", () => {
      if (revealedHints >= challenge.hints.length) return;
      hintText.textContent = "Pista " + (revealedHints + 1) + ": " + challenge.hints[revealedHints];
      revealedHints += 1;
      if (revealedHints >= challenge.hints.length) {
        hintButton.textContent = "Todas las pistas mostradas";
        hintButton.disabled = true;
      } else {
        hintButton.textContent = "Mostrar pista " + (revealedHints + 1) + " de " + challenge.hints.length;
      }
    });
    solutionButton.addEventListener("click", () => {
      solution.hidden = !solution.hidden;
      solutionButton.textContent = solution.hidden ? "Mostrar solución" : "Ocultar solución";
    });
    editor.focus({ preventScroll: true });
    if (shouldScroll && window.matchMedia("(max-width: 760px)").matches) {
      workspace.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function loadTypeScript() {
    if (window.ts) return Promise.resolve(window.ts);
    if (compilerPromise) return compilerPromise;
    compilerPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/typescript@5.9.3/lib/typescript.js";
      script.async = true;
      script.onload = () => window.ts ? resolve(window.ts) : reject(new Error("El compilador TypeScript no quedó disponible."));
      script.onerror = () => reject(new Error("No se pudo cargar el compilador TypeScript. Revisá tu conexión e intentá otra vez."));
      document.head.append(script);
    });
    return compilerPromise;
  }

  async function compileCode(challenge, source) {
    if (challenge.language !== "typescript") return source;
    const ts = await loadTypeScript();
    const standardTypes = `
interface Array<T> {
  readonly length: number;
  [index: number]: T;
  find(predicate: (value: T, index: number, array: T[]) => unknown): T | undefined;
  map<U>(callback: (value: T, index: number, array: T[]) => U): U[];
  filter(predicate: (value: T, index: number, array: T[]) => unknown): T[];
  forEach(callback: (value: T, index: number, array: T[]) => void): void;
  includes(searchElement: T): boolean;
  push(...items: T[]): number;
}
interface ReadonlyArray<T> { readonly length: number; readonly [index: number]: T; }
interface String {}
interface Number {}
interface Boolean {}
interface Object {}
interface Function {}
interface IArguments {}
interface RegExp {}
interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
declare const console: { log(...values: unknown[]): void; error(...values: unknown[]): void; };
`;
    const files = {
      "/lib.d.ts": standardTypes,
      "/challenge.ts": source + "\n" + (challenge.typeCheckCode || "")
    };
    const normalize = fileName => String(fileName).replace(/\\/g, "/");
    const host = {
      getSourceFile: (fileName, languageVersion) => {
        const key = normalize(fileName);
        return files[key] === undefined ? undefined : ts.createSourceFile(key, files[key], languageVersion, true);
      },
      getDefaultLibFileName: () => "/lib.d.ts",
      writeFile: () => {},
      getCurrentDirectory: () => "/",
      getDirectories: () => [],
      fileExists: fileName => files[normalize(fileName)] !== undefined,
      readFile: fileName => files[normalize(fileName)],
      getCanonicalFileName: fileName => normalize(fileName),
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n"
    };
    const program = ts.createProgram(
      ["/lib.d.ts", "/challenge.ts"],
      { strict: true, noEmit: true, noLib: true, target: ts.ScriptTarget.ES2020 },
      host
    );
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const errors = diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error);
    if (errors.length) {
      const message = errors.map(item => {
        const position = item.file && item.start !== undefined
          ? item.file.getLineAndCharacterOfPosition(item.start)
          : null;
        const location = position ? "Línea " + (position.line + 1) + ": " : "";
        return location + ts.flattenDiagnosticMessageText(item.messageText, "\n");
      }).join("\n");
      throw new Error("TypeScript encontró errores de tipos o sintaxis:\n" + message);
    }
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None,
        strict: true
      },
      reportDiagnostics: true
    });
    const syntaxErrors = (output.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
    if (syntaxErrors.length) {
      const message = syntaxErrors.map(item => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("\n");
      throw new Error("No se pudo transpilar TypeScript:\n" + message);
    }
    return output.outputText;
  }

  function cancelActiveRunner() {
    if (runnerTimeout) clearTimeout(runnerTimeout);
    runnerTimeout = null;
    if (activeRunnerCleanup) activeRunnerCleanup();
    if (activeRunner && activeRunner.dataset.persistentPreview !== "true") activeRunner.remove();
    activeRunnerCleanup = null;
    activeRunner = null;
  }

  function htmlCssDocument(html, css, testScript, nonce) {
    const policy = testScript
      ? "default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-" + nonce + "' 'unsafe-eval'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"
      : "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
    const cleanHtml = String(html)
      .replace(/<base\b[^>]*>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
    const safeCss = String(css).replace(/<\/style/gi, "");
    const script = testScript ? "<script nonce=\"" + nonce + "\">" + testScript + "</script>" : "";
    return "<!doctype html><html><head><meta charset='utf-8'><meta http-equiv='Content-Security-Policy' content=\"" + policy + "\"><meta name='viewport' content='width=device-width,initial-scale=1'><style>" + safeCss + "</style></head><body>" + cleanHtml + script + "</body></html>";
  }

  function runHtmlCss(challenge, html, css, resultsNode, completeBanner, runButton) {
    cancelActiveRunner();
    const frame = document.createElement("iframe");
    frame.title = "Pruebas HTML y CSS aisladas";
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0";
    activeRunner = frame;
    const nonce = "wd" + Math.random().toString(36).slice(2);
    const tests = JSON.stringify(challenge.tests || []).replace(/</g, "\\u003c");
    const script = "const tests=" + tests + ";const results=tests.map(t=>{try{const actual=(new Function('return ('+t.expression+')'))();return {label:t.label,passed:JSON.stringify(actual)===JSON.stringify(t.expected),actual,expected:t.expected}}catch(e){return {label:t.label,passed:false,error:String(e.message||e)}}});parent.postMessage({source:'webdev-challenges',id:" + JSON.stringify(challenge.id) + ",type:'results',results},'*');";
    const receive = event => {
      if (!activeRunner || event.source !== frame.contentWindow || event.data?.source !== "webdev-challenges" || event.data?.id !== challenge.id || event.data.type !== "results") return;
      if (runnerTimeout) clearTimeout(runnerTimeout);
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      frame.remove();
      activeRunner = null;
      displayResults(challenge, event.data.results || [], resultsNode, completeBanner, runButton);
    };
    window.addEventListener("message", receive);
    activeRunnerCleanup = () => window.removeEventListener("message", receive);
    frame.srcdoc = htmlCssDocument(html, css, script, nonce);
    document.body.append(frame);
    runnerTimeout = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      if (activeRunner === frame) {
        frame.remove();
        activeRunner = null;
        resultsNode.replaceChildren(node("h4", "", "La prueba tardó demasiado"), node("p", "", "Se detuvo el entorno aislado. Revisá tu código e intentá nuevamente."));
        runButton.disabled = false;
        runButton.textContent = "▶ Ejecutar pruebas";
      }
    }, 4000);
  }

  function runInSandbox(challenge, code, resultsNode, completeBanner, runButton) {
    cancelActiveRunner();

    const payload = {
      id: challenge.id,
      code,
      tests: challenge.tests || []
    };
    const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");
    const runner = document.createElement("iframe");
    runner.setAttribute("title", "Entorno aislado de ejecución");
    runner.setAttribute("sandbox", "allow-scripts");
    runner.setAttribute("aria-hidden", "true");
    runner.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0";
    activeRunner = runner;

    const receive = event => {
      if (!activeRunner || event.source !== activeRunner.contentWindow || event.data?.source !== "webdev-challenges" || event.data?.id !== challenge.id) return;
      if (event.data.type !== "results") return;
      if (runnerTimeout) clearTimeout(runnerTimeout);
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      activeRunner.remove();
      activeRunner = null;
      displayResults(challenge, event.data.results || [], resultsNode, completeBanner, runButton);
    };
    window.addEventListener("message", receive);
    activeRunnerCleanup = () => window.removeEventListener("message", receive);

    const runnerDocument = "<!doctype html><html><head><meta charset='utf-8'></head><body><script>" +
      "const payload=" + safePayload + ";" +
      "const send=data=>parent.postMessage({source:'webdev-challenges',id:payload.id,type:'results',...data},'*');" +
      "try{" +
      "const results=payload.tests.map(test=>{" +
      "try{const execute=new Function(payload.code+'\\nreturn ('+test.expression+');');" +
      "const actual=execute();const passed=JSON.stringify(actual)===JSON.stringify(test.expected);" +
      "return {label:test.label,passed,actual,expected:test.expected};" +
      "}catch(error){return {label:test.label,passed:false,error:String(error&&error.message||error)};}" +
      "});send({results});" +
      "}catch(error){send({results:[{label:'Ejecución',passed:false,error:String(error&&error.message||error)}]});}" +
      "<\/script></body></html>";
    runner.srcdoc = runnerDocument;
    document.body.append(runner);

    runnerTimeout = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      if (activeRunner === runner) {
        runner.remove();
        activeRunner = null;
        resultsNode.replaceChildren(
          node("h4", "", "La ejecución tardó demasiado"),
          node("p", "", "Se detuvo el entorno de prueba después de 4 segundos. Revisá si tu código contiene un bucle que no termina.")
        );
        runButton.disabled = false;
        runButton.textContent = "▶ Ejecutar pruebas";
      }
    }, 4000);
  }


  function frameworkRunnerDocument(challenge, code) {
    const nonce = "wd" + Math.random().toString(36).slice(2);
    const payload = JSON.stringify({
      id: challenge.id, runner: challenge.runner, code,
      tests: challenge.tests || [], componentName: challenge.componentName,
      props: challenge.props || {}, fixtureHTML: challenge.fixtureHTML || ""
    }).replace(/</g, "\\u003c");
    const policy = "default-src 'none'; script-src https://unpkg.com 'nonce-" + nonce + "' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src data:; object-src 'none'; base-uri 'none'; form-action 'none'";
    let libraries = "";
    if (challenge.runner === "react") {
      libraries = "<script src=\"https://unpkg.com/react@18.3.1/umd/react.production.min.js\"></script>" +
        "<script src=\"https://unpkg.com/scheduler@0.23.2/umd/scheduler.production.min.js\"></script>" +
        "<script src=\"https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js\"></script>" +
        "<script src=\"https://unpkg.com/@babel/standalone@7.26.10/babel.min.js\"></script>";
    } else if (challenge.runner === "vue") {
      libraries = "<script src=\"https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js\"></script>";
    }
    const script = String.raw`
const payload = __PAYLOAD__;
const send = results => parent.postMessage({ source: "webdev-challenges", id: payload.id, type: "results", results }, "*");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function performStep(step) {
  let element;
  if (step.selector.includes("::shadow")) {
    const [hostSelector, innerSelector] = step.selector.split("::shadow");
    const host = document.querySelector(hostSelector.trim());
    element = host && host.shadowRoot ? host.shadowRoot.querySelector(innerSelector.trim()) : null;
  } else {
    element = document.querySelector(step.selector);
  }
  if (!element) throw new Error("No se encontró el elemento: " + step.selector);
  if (step.action === "click") element.click();
  else if (step.action === "input" || step.action === "change") {
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
    if (descriptor && descriptor.set) descriptor.set.call(element, step.value);
    else element.value = step.value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    if (step.action === "change") element.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (step.action === "attribute") element.setAttribute(step.name, step.value);
  else throw new Error("Acción de prueba desconocida: " + step.action);
}
async function main() {
  try {
    const app = document.getElementById("app");
    if (payload.runner === "react") {
      if (!window.React || !window.ReactDOM || !window.Babel) throw new Error("No se pudieron cargar React o Babel desde el CDN. Revisá la conexión.");
      const compiled = Babel.transform(payload.code, { presets: ["react"] }).code;
      const Component = new Function("React", compiled + "\nreturn " + payload.componentName)(React);
      const root = ReactDOM.createRoot(app);
      root.render(React.createElement(Component, payload.props));
      await wait(80);
    } else if (payload.runner === "vue") {
      if (!window.Vue) throw new Error("No se pudo cargar Vue desde el CDN. Revisá la conexión.");
      const Component = new Function("Vue", payload.code + "\nreturn " + payload.componentName)(Vue);
      Vue.createApp(Component, payload.props).mount(app);
      await wait(50);
    } else if (payload.runner === "webcomponents") {
      app.innerHTML = payload.fixtureHTML;
      new Function("window", "document", "customElements", "HTMLElement", "CustomEvent", "Event", payload.code)(
        window, document, customElements, HTMLElement, CustomEvent, Event
      );
      await wait(30);
      window.__challengeEvents = [];
      for (const eventName of payload.captureEvents || []) {
        app.querySelectorAll("*").forEach(element => element.addEventListener(eventName, event => window.__challengeEvents.push(event.detail)));
      }
    }
    const results = [];
    for (const test of payload.tests) {
      try {
        for (const step of test.steps || []) { performStep(step); await wait(40); }
        const actual = new Function("document", "window", "React", "Vue", "customElements", "return (" + test.expression + ");")(
          document, window, window.React, window.Vue, customElements
        );
        const resolved = await Promise.resolve(actual);
        results.push({ label: test.label, passed: JSON.stringify(resolved) === JSON.stringify(test.expected), actual: resolved, expected: test.expected });
      } catch (error) {
        results.push({ label: test.label, passed: false, error: String(error && error.message || error) });
      }
    }
    send(results);
  } catch (error) {
    send([{ label: "Ejecución del componente", passed: false, error: String(error && error.message || error) }]);
  }
}
main();
`.replace("__PAYLOAD__", payload);
    return "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"" + policy + "\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>body{font:14px system-ui,sans-serif;color:#172033;margin:0;padding:18px;background:#fff}button,input{font:inherit;padding:7px 10px;margin:4px}ul{padding-left:22px}#app{min-height:40px}</style>" + libraries + "</head><body><div id=\"app\"></div><script nonce=\"" + nonce + "\">" + script + "</script></body></html>";
  }

  function runFrameworkChallenge(challenge, code, resultsNode, completeBanner, runButton, previewFrame) {
    cancelActiveRunner();
    if (!previewFrame) {
      resultsNode.replaceChildren(node("h4", "", "No hay vista previa"), node("p", "", "No se encontró el marco de ejecución para esta tecnología."));
      runButton.disabled = false;
      runButton.textContent = "▶ Ejecutar pruebas";
      return;
    }
    const frame = previewFrame;
    frame.dataset.persistentPreview = "true";
    const receive = event => {
      if (event.source !== frame.contentWindow || event.data?.source !== "webdev-challenges" || event.data?.id !== challenge.id || event.data.type !== "results") return;
      if (runnerTimeout) clearTimeout(runnerTimeout);
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      activeRunner = null;
      displayResults(challenge, event.data.results || [], resultsNode, completeBanner, runButton);
    };
    window.addEventListener("message", receive);
    activeRunner = frame;
    activeRunnerCleanup = () => window.removeEventListener("message", receive);
    frame.srcdoc = frameworkRunnerDocument(challenge, code);
    runnerTimeout = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      if (activeRunner === frame) activeRunner = null;
      resultsNode.replaceChildren(node("h4", "", "El entorno no respondió"), node("p", "", "La ejecución superó el límite de tiempo. Verificá el código y la conexión necesaria para cargar la biblioteca."));
      runButton.disabled = false;
      runButton.textContent = "▶ Ejecutar pruebas";
    }, 10000);
  }

  function nodeSimulationDocument(challenge, code) {
    const nonce = "wd" + Math.random().toString(36).slice(2);
    const payload = JSON.stringify({
      id: challenge.id, code, tests: challenge.tests || [],
      environment: challenge.environment || {}, virtualFiles: challenge.virtualFiles || {}
    }).replace(/</g, "\\u003c");
    const policy = "default-src 'none'; script-src 'nonce-" + nonce + "' 'unsafe-eval'; connect-src 'none'; img-src data:; style-src 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'none'";
    const script = String.raw`
const payload = __PAYLOAD__;
const send = results => parent.postMessage({ source: "webdev-challenges", id: payload.id, type: "results", results }, "*");
function normalizePath(value) {
  const absolute = String(value).startsWith("/");
  const parts = [];
  String(value).replace(/\\/g, "/").split("/").forEach(part => {
    if (!part || part === ".") return;
    if (part === "..") { if (parts.length && parts[parts.length - 1] !== "..") parts.pop(); else if (!absolute) parts.push(".."); }
    else parts.push(part);
  });
  return (absolute ? "/" : "") + parts.join("/") || (absolute ? "/" : ".");
}
const path = {
  sep: "/", delimiter: ":",
  normalize: normalizePath,
  isAbsolute: value => String(value).startsWith("/"),
  join: (...parts) => normalizePath(parts.join("/")),
  resolve: (...parts) => normalizePath("/workspace/" + parts.join("/")),
  basename: (value, suffix) => { let name = normalizePath(value).split("/").pop(); if (suffix && name.endsWith(suffix)) name = name.slice(0, -suffix.length); return name; },
  dirname: value => { const name = normalizePath(value); const index = name.lastIndexOf("/"); return index <= 0 ? (name.startsWith("/") ? "/" : ".") : name.slice(0, index); },
  extname: value => { const base = String(value).split("/").pop(); const index = base.lastIndexOf("."); return index <= 0 ? "" : base.slice(index); },
  relative: (from, to) => { const a = normalizePath(from).split("/").filter(Boolean); const b = normalizePath(to).split("/").filter(Boolean); while (a.length && b.length && a[0] === b[0]) { a.shift(); b.shift(); } return [...a.map(() => ".."), ...b].join("/") || ""; }
};
const files = new Map(Object.entries(payload.virtualFiles).map(([key, value]) => [normalizePath(key), String(value)]));
function fsError(code, file) { const error = new Error("ENOENT: no such file or directory, " + file); error.code = code; error.path = file; return error; }
const fsPromises = {
  async mkdir() { return undefined; },
  async writeFile(file, content) { files.set(normalizePath(file), String(content)); },
  async readFile(file, encoding) {
    const key = normalizePath(file);
    if (!files.has(key)) throw fsError("ENOENT", file);
    const content = files.get(key);
    return encoding === "utf8" || encoding === "utf-8" || encoding === "string" ? content : new TextEncoder().encode(content);
  },
  async access(file) { if (!files.has(normalizePath(file))) throw fsError("ENOENT", file); },
  async stat(file) {
    const key = normalizePath(file);
    if (!files.has(key)) throw fsError("ENOENT", file);
    return { isFile: () => true, isDirectory: () => false, size: files.get(key).length };
  },
  async rename(from, to) {
    const source = normalizePath(from), target = normalizePath(to);
    if (!files.has(source)) throw fsError("ENOENT", from);
    files.set(target, files.get(source)); files.delete(source);
  },
  async unlink(file) { if (!files.delete(normalizePath(file))) throw fsError("ENOENT", file); },
  async readdir(directory) {
    const prefix = normalizePath(directory).replace(/\/$/, "") + "/";
    return [...files.keys()].filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length).split("/")[0]).filter((name, index, all) => all.indexOf(name) === index);
  }
};
class EventEmitter {
  constructor() { this._events = Object.create(null); }
  on(name, listener) { (this._events[name] ||= []).push({ listener, once: false }); return this; }
  addListener(name, listener) { return this.on(name, listener); }
  once(name, listener) { (this._events[name] ||= []).push({ listener, once: true }); return this; }
  emit(name, ...args) {
    const entries = this._events[name];
    if (!entries || !entries.length) return false;
    for (const entry of [...entries]) { if (entry.once) this.removeListener(name, entry.listener); entry.listener(...args); }
    return true;
  }
  removeListener(name, listener) { this._events[name] = (this._events[name] || []).filter(entry => entry.listener !== listener); return this; }
  off(name, listener) { return this.removeListener(name, listener); }
  listenerCount(name) { return (this._events[name] || []).length; }
  listeners(name) { return (this._events[name] || []).map(entry => entry.listener); }
}
const process = {
  env: { NODE_ENV: "development", PORT: "3000", ...payload.environment },
  argv: ["node", "app.js"], platform: "linux", version: "v22.0.0",
  versions: { node: "22.0.0" }, cwd: () => "/workspace",
  nextTick: (callback, ...args) => Promise.resolve().then(() => callback(...args))
};
const logs = [];
const consoleShim = { log: (...args) => logs.push(args), error: (...args) => logs.push(args), warn: (...args) => logs.push(args) };
function requireModule(name) {
  if (name === "path" || name === "node:path") return path;
  if (name === "events" || name === "node:events") return { EventEmitter };
  if (name === "fs/promises" || name === "node:fs/promises") return fsPromises;
  if (name === "process" || name === "node:process") return process;
  throw new Error("El simulador no incluye el módulo " + name + ". Módulos disponibles: path, events, fs/promises y process.");
}
(async () => {
  try {
    const module = { exports: {} };
    const exports = module.exports;
    const execute = new Function("require", "module", "exports", "process", "console", "__dirname", "__filename", payload.code);
    execute(requireModule, module, exports, process, consoleShim, "/workspace", "/workspace/app.js");
    const results = [];
    for (const test of payload.tests) {
      try {
        const actual = await new Function("module", "require", "process", "console", "return (async () => (" + test.expression + "))();")(
          module, requireModule, process, consoleShim
        );
        results.push({ label: test.label, passed: JSON.stringify(actual) === JSON.stringify(test.expected), actual, expected: test.expected });
      } catch (error) {
        results.push({ label: test.label, passed: false, error: String(error && error.message || error) });
      }
    }
    send(results);
  } catch (error) {
    send([{ label: "Ejecución Node.js simulada", passed: false, error: String(error && error.message || error) }]);
  }
})();
`.replace("__PAYLOAD__", payload);
    return "<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"" + policy + "\"></head><body><script nonce=\"" + nonce + "\">" + script + "</script></body></html>";
  }

  function runNodeSimulationChallenge(challenge, code, resultsNode, completeBanner, runButton) {
    cancelActiveRunner();
    const frame = document.createElement("iframe");
    frame.title = "Simulador aislado de APIs Node.js";
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0";
    activeRunner = frame;
    const receive = event => {
      if (!activeRunner || event.source !== frame.contentWindow || event.data?.source !== "webdev-challenges" || event.data?.id !== challenge.id || event.data.type !== "results") return;
      if (runnerTimeout) clearTimeout(runnerTimeout);
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      frame.remove();
      activeRunner = null;
      displayResults(challenge, event.data.results || [], resultsNode, completeBanner, runButton);
    };
    window.addEventListener("message", receive);
    activeRunnerCleanup = () => window.removeEventListener("message", receive);
    frame.srcdoc = nodeSimulationDocument(challenge, code);
    document.body.append(frame);
    runnerTimeout = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      if (activeRunner === frame) {
        frame.remove();
        activeRunner = null;
        resultsNode.replaceChildren(node("h4", "", "La simulación tardó demasiado"), node("p", "", "Se detuvo el entorno de pruebas después de 5 segundos. Revisá si hay una operación que no termina."));
        runButton.disabled = false;
        runButton.textContent = "▶ Ejecutar pruebas";
      }
    }, 5000);
  }


  function runDocumentRunner(challenge, documentHtml, resultsNode, completeBanner, runButton, timeoutMs, onExtraResult) {
    cancelActiveRunner();
    const frame = document.createElement("iframe");
    frame.title = "Entorno aislado: " + challenge.technologyName;
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0";
    activeRunner = frame;
    const receive = event => {
      if (!activeRunner || event.source !== frame.contentWindow || event.data?.source !== "webdev-challenges" || event.data?.id !== challenge.id || event.data.type !== "results") return;
      if (runnerTimeout) clearTimeout(runnerTimeout);
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      frame.remove();
      activeRunner = null;
      if (typeof onExtraResult === "function") onExtraResult(event.data.terminal || null);
      displayResults(challenge, event.data.results || [], resultsNode, completeBanner, runButton);
    };
    window.addEventListener("message", receive);
    activeRunnerCleanup = () => window.removeEventListener("message", receive);
    frame.srcdoc = documentHtml;
    document.body.append(frame);
    runnerTimeout = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      activeRunnerCleanup = null;
      if (activeRunner === frame) {
        frame.remove();
        activeRunner = null;
        resultsNode.replaceChildren(node("h4", "", "El entorno superó el tiempo límite"), node("p", "", "Se detuvo la ejecución aislada. Revisá el código e intentá nuevamente."));
        runButton.disabled = false;
        runButton.textContent = "▶ Ejecutar pruebas";
      }
    }, timeoutMs || 8000);
  }

  function staticRulesDocument(challenge, source) {
    const payload = JSON.stringify({ id: challenge.id, source, tests: challenge.tests || [] }).replace(/</g, "\\u003c");
    const script = String.raw`
const payload = __PAYLOAD__;
const results = payload.tests.map(test => {
  try {
    const matched = new RegExp(test.pattern, test.flags || "m").test(payload.source);
    return { label: test.label, passed: test.negative ? !matched : matched, actual: matched, expected: !test.negative };
  } catch (error) {
    return { label: test.label, passed: false, error: String(error && error.message || error) };
  }
});
parent.postMessage({ source: "webdev-challenges", id: payload.id, type: "results", results }, "*");
`.replace("__PAYLOAD__", payload);
    return "<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'nonce-static' 'unsafe-eval'; connect-src 'none'\"></head><body><script nonce=\"static\">" + script + "</script></body></html>";
  }

  function mongoSimulationDocument(challenge, code) {
    const payload = JSON.stringify({ id: challenge.id, code, tests: challenge.tests || [], data: challenge.mongoData || {}, functionNames: challenge.functionNames || [] }).replace(/</g, "\\u003c");
    const script = String.raw`
const payload = __PAYLOAD__;
const send = results => parent.postMessage({ source: "webdev-challenges", id: payload.id, type: "results", results }, "*");
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const getPath = (object, path) => String(path).split(".").reduce((value, key) => value == null ? undefined : value[key], object);
function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function fieldMatches(actual, expected) {
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    for (const [operator, value] of Object.entries(expected)) {
      if (operator === "$gt" && !(actual > value)) return false;
      if (operator === "$gte" && !(actual >= value)) return false;
      if (operator === "$lt" && !(actual < value)) return false;
      if (operator === "$lte" && !(actual <= value)) return false;
      if (operator === "$eq" && !equal(actual, value)) return false;
      if (operator === "$ne" && equal(actual, value)) return false;
      if (operator === "$in" && !value.some(item => Array.isArray(actual) ? actual.some(x => equal(x, item)) : equal(actual, item))) return false;
      if (operator === "$nin" && value.some(item => Array.isArray(actual) ? actual.some(x => equal(x, item)) : equal(actual, item))) return false;
      if (operator === "$exists" && ((actual !== undefined) !== Boolean(value))) return false;
      if (!["$gt","$gte","$lt","$lte","$eq","$ne","$in","$nin","$exists"].includes(operator)) return false;
    }
    return true;
  }
  if (Array.isArray(actual)) return actual.some(item => equal(item, expected));
  return equal(actual, expected);
}
function matches(document, query) {
  return Object.entries(query || {}).every(([field, expected]) => {
    if (field === "$and") return expected.every(part => matches(document, part));
    if (field === "$or") return expected.some(part => matches(document, part));
    if (field === "$nor") return !expected.some(part => matches(document, part));
    return fieldMatches(getPath(document, field), expected);
  });
}
function project(document, projection) {
  if (!projection || !Object.keys(projection).length) return clone(document);
  const included = Object.entries(projection).filter(([key, value]) => key !== "_id" && Boolean(value)).map(([key]) => key);
  if (included.length) {
    const result = {};
    for (const key of included) { const value = getPath(document, key); if (value !== undefined) result[key] = clone(value); }
    if (projection._id !== 0 && document._id !== undefined) result._id = clone(document._id);
    return result;
  }
  const result = clone(document);
  for (const [key, value] of Object.entries(projection)) if (!value) delete result[key];
  return result;
}
function applyUpdate(document, update) {
  if (Object.keys(update).some(key => key.startsWith("$"))) {
    for (const [operator, values] of Object.entries(update)) {
      for (const [field, value] of Object.entries(values)) {
        const current = getPath(document, field);
        if (operator === "$set") document[field] = clone(value);
        else if (operator === "$inc") document[field] = (Number(current) || 0) + Number(value);
        else if (operator === "$push") (document[field] ||= []).push(clone(value));
        else if (operator === "$addToSet") { const array = document[field] ||= []; if (!array.some(item => equal(item, value))) array.push(clone(value)); }
        else if (operator === "$unset") delete document[field];
      }
    }
  } else {
    for (const key of Object.keys(document)) if (key !== "_id") delete document[key];
    Object.assign(document, clone(update));
  }
}
function groupValue(document, expression) {
  if (typeof expression === "string" && expression.startsWith("$")) return getPath(document, expression.slice(1));
  return expression;
}
const collections = Object.fromEntries(Object.entries(payload.data).map(([name, documents]) => [name, clone(documents)]));
function collection(name) {
  const items = collections[name] || (collections[name] = []);
  return {
    find(filter = {}, options = {}) {
      const found = items.filter(document => matches(document, filter)).map(document => project(document, options.projection));
      return { toArray: () => Promise.resolve(clone(found)) };
    },
    findOne(filter = {}, options = {}) {
      const document = items.find(item => matches(item, filter));
      return Promise.resolve(document ? project(document, options.projection) : null);
    },
    async insertOne(document) {
      const created = clone(document);
      if (created._id === undefined) created._id = items.length ? Math.max(...items.map(item => Number(item._id) || 0)) + 1 : 1;
      items.push(created);
      return { acknowledged: true, insertedId: created._id };
    },
    async updateOne(filter, update) {
      const document = items.find(item => matches(item, filter));
      if (!document) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      const before = clone(document);
      applyUpdate(document, update);
      return { acknowledged: true, matchedCount: 1, modifiedCount: equal(before, document) ? 0 : 1 };
    },
    aggregate(pipeline = []) {
      let result = clone(items);
      for (const stage of pipeline) {
        if (stage.$match) result = result.filter(item => matches(item, stage.$match));
        else if (stage.$group) {
          const groups = new Map();
          for (const document of result) {
            const key = groupValue(document, stage.$group._id);
            const bucket = groups.get(JSON.stringify(key)) || { _id: clone(key) };
            for (const [field, expression] of Object.entries(stage.$group)) {
              if (field === "_id") continue;
              if (expression && expression.$sum !== undefined) {
                const amount = expression.$sum === 1 ? 1 : Number(groupValue(document, expression.$sum)) || 0;
                bucket[field] = (bucket[field] || 0) + amount;
              }
            }
            groups.set(JSON.stringify(key), bucket);
          }
          result = [...groups.values()];
        } else if (stage.$sort) {
          const entries = Object.entries(stage.$sort);
          result.sort((a, b) => {
            for (const [key, direction] of entries) {
              const av = getPath(a, key), bv = getPath(b, key);
              if (av < bv) return -1 * direction;
              if (av > bv) return 1 * direction;
            }
            return 0;
          });
        } else if (stage.$limit !== undefined) result = result.slice(0, stage.$limit);
        else if (stage.$project) result = result.map(item => project(item, stage.$project));
      }
      return { toArray: () => Promise.resolve(clone(result)) };
    }
  };
}
const db = { collection };
(async () => {
  try {
    const functions = new Function("db", payload.code + "\nreturn [" + payload.functionNames.join(",") + "]")(db);
    const results = [];
    for (const test of payload.tests) {
      try {
        const actual = await new Function("db", ...payload.functionNames, "return (async () => (" + test.expression + "))()")(db, ...functions);
        results.push({ label: test.label, passed: JSON.stringify(actual) === JSON.stringify(test.expected), actual, expected: test.expected });
      } catch (error) { results.push({ label: test.label, passed: false, error: String(error && error.message || error) }); }
    }
    send(results);
  } catch (error) { send([{ label: "Ejecución MongoDB simulada", passed: false, error: String(error && error.message || error) }]); }
})();
`.replace("__PAYLOAD__", payload);
    return "<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'nonce-mongo' 'unsafe-eval'; connect-src 'none'\"></head><body><script nonce=\"mongo\">" + script + "</script></body></html>";
  }

  function apiSimulationDocument(challenge, code) {
    const payload = JSON.stringify({ id: challenge.id, code, tests: challenge.tests || [], fixtures: challenge.apiFixtures || {}, functionName: challenge.functionName }).replace(/</g, "\\u003c");
    const script = String.raw`
const payload = __PAYLOAD__;
const send = results => parent.postMessage({ source: "webdev-challenges", id: payload.id, type: "results", results }, "*");
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const requests = [];
async function fetchMock(input, options = {}) {
  const url = typeof input === "string" ? input : input.url;
  const normalizedOptions = { method: "GET", ...options };
  requests.push({ url, options: normalizedOptions });
  const fixture = payload.fixtures[url] || { status: 404, body: { message: "Ruta no encontrada" } };
  const status = fixture.status || 200;
  const body = clone(fixture.body);
  return {
    ok: status >= 200 && status < 300, status, statusText: status >= 400 ? "Error" : "OK",
    headers: { get: name => name.toLowerCase() === "content-type" ? "application/json" : null },
    json: async () => clone(body), text: async () => JSON.stringify(body)
  };
}
fetchMock.requests = requests;
(async () => {
  try {
    const fn = new Function("fetch", "AbortController", payload.code + "\nreturn " + payload.functionName)(fetchMock, AbortController);
    const api = { fetch: fetchMock };
    api[payload.functionName] = fn;
    const results = [];
    for (const test of payload.tests) {
      try {
        const actual = await new Function("api", "return (async () => (" + test.expression + "))()")(api);
        results.push({ label: test.label, passed: JSON.stringify(actual) === JSON.stringify(test.expected), actual, expected: test.expected });
      } catch (error) { results.push({ label: test.label, passed: false, error: String(error && error.message || error) }); }
    }
    send(results);
  } catch (error) { send([{ label: "Ejecución de API simulada", passed: false, error: String(error && error.message || error) }]); }
})();
`.replace("__PAYLOAD__", payload);
    return "<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'nonce-api' 'unsafe-eval'; connect-src 'none'\"></head><body><script nonce=\"api\">" + script + "</script></body></html>";
  }

  function testingSimulationDocument(challenge, code) {
    const payload = JSON.stringify({ id: challenge.id, code, requiredTests: challenge.requiredTests || [] }).replace(/</g, "\\u003c");
    const script = String.raw`
const payload = __PAYLOAD__;
const send = results => parent.postMessage({ source: "webdev-challenges", id: payload.id, type: "results", results }, "*");
const registered = [];
function test(name, callback) { registered.push({ name: String(name), callback }); }
const it = test;
function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function viFn(implementation) {
  const spy = function (...args) { spy.mock.calls.push(args); return implementation ? implementation.apply(this, args) : undefined; };
  spy.mock = { calls: [] };
  spy.mockResolvedValue = value => { implementation = () => Promise.resolve(value); return spy; };
  spy.mockImplementation = fn => { implementation = fn; return spy; };
  spy.mockClear = () => { spy.mock.calls = []; return spy; };
  return spy;
}
function expect(actual) {
  const assert = (passed, message) => { if (!passed) throw new Error(message); };
  return {
    toBe(expected) { assert(Object.is(actual, expected), "Esperado " + JSON.stringify(expected) + " y se obtuvo " + JSON.stringify(actual)); },
    toEqual(expected) { assert(equal(actual, expected), "Esperado " + JSON.stringify(expected) + " y se obtuvo " + JSON.stringify(actual)); },
    toBeTruthy() { assert(Boolean(actual), "Se esperaba un valor truthy"); },
    toBeFalsy() { assert(!actual, "Se esperaba un valor falsy"); },
    toContain(expected) { assert(actual != null && typeof actual.includes === "function" && actual.includes(expected), "El valor no contiene " + JSON.stringify(expected)); },
    toHaveLength(expected) { assert(actual != null && actual.length === expected, "Se esperaba longitud " + expected); },
    toHaveBeenCalledTimes(expected) { assert(typeof actual === "function" && actual.mock && actual.mock.calls.length === expected, "Se esperaba que el spy se llamara " + expected + " veces"); },
    toHaveBeenCalledWith(...expected) { assert(typeof actual === "function" && actual.mock && actual.mock.calls.some(args => equal(args, expected)), "El spy no recibió los argumentos esperados " + JSON.stringify(expected)); }
  };
}
const vi = { fn: viFn };
(async () => {
  try {
    new Function("test", "it", "expect", "vi", payload.code)(test, it, expect, vi);
    const results = [];
    for (const entry of registered) {
      try { await entry.callback(); results.push({ label: entry.name, passed: true, actual: "passed", expected: "passed" }); }
      catch (error) { results.push({ label: entry.name, passed: false, error: String(error && error.message || error) }); }
    }
    for (const required of payload.requiredTests) {
      if (!registered.some(entry => entry.name === required)) results.push({ label: required, passed: false, error: "No registraste la prueba requerida." });
    }
    if (!registered.length && !payload.requiredTests.length) results.push({ label: "Suite de pruebas", passed: false, error: "No se registró ninguna prueba." });
    send(results);
  } catch (error) { send([{ label: "Suite de pruebas", passed: false, error: String(error && error.message || error) }]); }
})();
`.replace("__PAYLOAD__", payload);
    return "<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'nonce-test' 'unsafe-eval'; connect-src 'none'\"></head><body><script nonce=\"test\">" + script + "</script></body></html>";
  }

  function postgresRunnerDocument(challenge, source) {
    const payload = JSON.stringify({ id: challenge.id, source, setupSql: challenge.setupSql || "", tests: challenge.tests || [] }).replace(/</g, "\\u003c");
    const script = String.raw`
const payload = __PAYLOAD__;
const send = results => parent.postMessage({ source: "webdev-challenges", id: payload.id, type: "results", results }, "*");
const normalize = rows => rows.map(row => Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))));
function sameValue(actual, expected) {
  if (typeof actual === "number" && typeof expected === "string" && expected.trim() !== "" && Number.isFinite(Number(expected))) return actual === Number(expected);
  if (typeof expected === "number" && typeof actual === "string" && actual.trim() !== "" && Number.isFinite(Number(actual))) return Number(actual) === expected;
  if (Array.isArray(actual) && Array.isArray(expected)) return actual.length === expected.length && actual.every((value, index) => sameValue(value, expected[index]));
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const a = Object.keys(actual).sort(), b = Object.keys(expected).sort();
    return a.length === b.length && a.every((key, index) => key === b[index] && sameValue(actual[key], expected[key]));
  }
  return Object.is(actual, expected);
}
const same = (a, b) => sameValue(normalize(a), normalize(b));
(async () => {
  let db;
  try {
    const { PGlite } = await import("https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js");
    db = new PGlite();
    if (payload.setupSql) await db.exec(payload.setupSql);
    if (!payload.source.trim()) throw new Error("Escribí una consulta SQL antes de ejecutar las pruebas.");
    await db.exec(payload.source);
    const results = [];
    for (const test of payload.tests) {
      try {
        const query = test.useUserQuery ? payload.source.trim().replace(/;+\s*$/, "") : test.sql;
        const response = await db.query(query);
        const actual = normalize(response.rows);
        const expected = normalize(test.expected);
        results.push({ label: test.label, passed: same(actual, expected), actual, expected });
      } catch (error) { results.push({ label: test.label, passed: false, error: String(error && error.message || error) }); }
    }
    await db.close();
    send(results);
  } catch (error) {
    if (db) { try { await db.close(); } catch (_) {} }
    send([{ label: "Motor PostgreSQL en el navegador", passed: false, error: String(error && error.message || error) }]);
  }
})();
`.replace("__PAYLOAD__", payload);
    return "<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'nonce-pg' https://cdn.jsdelivr.net 'wasm-unsafe-eval'; connect-src https://cdn.jsdelivr.net blob:; worker-src blob:; style-src 'unsafe-inline'\"></head><body><script type=\"module\" nonce=\"pg\">" + script + "</script></body></html>";
  }

  function displayResults(challenge, results, resultsNode, completeBanner, runButton) {
    const passed = results.filter(result => result.passed).length;
    const allPassed = results.length > 0 && passed === results.length;
    resultsNode.replaceChildren(
      node("h4", "", allPassed ? "✓ Todas las pruebas pasaron" : passed + " de " + results.length + " pruebas superadas"),
      node("p", "", allPassed ? "Tu solución cumple los casos de prueba definidos para este reto." : "Revisá los casos marcados y compará el resultado esperado con el obtenido.")
    );
    const list = node("div", "challenge-test-list");
    results.forEach(result => {
      const item = node("div", "challenge-test-result " + (result.passed ? "pass" : "fail"));
      item.append(node("b", "", result.passed ? "✓" : "×"));
      let detail = result.label;
      if (result.error) detail += " — " + result.error;
      else if (!result.passed) detail += " — Esperado: " + safeString(result.expected) + " · Obtenido: " + safeString(result.actual);
      item.append(node("span", "", detail));
      list.append(item);
    });
    resultsNode.append(list);

    progress.attempts[challenge.id] = (progress.attempts[challenge.id] || 0) + 1;
    if (allPassed && !progress.completed.includes(challenge.id)) progress.completed.push(challenge.id);
    saveProgress();
    completeBanner.hidden = !progress.completed.includes(challenge.id);
    runButton.disabled = false;
    runButton.textContent = "▶ Ejecutar pruebas";
  }

  function safeString(value) {
    if (value === undefined) return "undefined";
    try { return JSON.stringify(value); } catch (error) { return String(value); }
  }

  async function runChallenge(challenge, source, resultsNode, completeBanner, runButton, cssSource, previewFrame, terminalOutput) {
    if (challenge.language === "htmlcss") { runButton.disabled = true; runButton.textContent = "Ejecutando…"; resultsNode.replaceChildren(node("h4", "", "Ejecutando pruebas HTML y CSS"), node("p", "", "Renderizando la página en un iframe aislado.")); runHtmlCss(challenge, source, cssSource || "", resultsNode, completeBanner, runButton); return; }
    if (challenge.runner === "terminal-sim") { runTerminalSimulationChallenge(challenge, source, resultsNode, completeBanner, runButton, terminalOutput); return; }
    if (challenge.runner === "node-sim") { runButton.disabled = true; runButton.textContent = "Ejecutando…"; resultsNode.replaceChildren(node("h4", "", "Ejecutando simulación de Node.js"), node("p", "", "Se probarán módulos y APIs educativas dentro de un entorno en memoria, sin acceder al servidor.")); runNodeSimulationChallenge(challenge, source, resultsNode, completeBanner, runButton); return; }
    if (challenge.runner === "astro-static" || challenge.runner === "docker-static") { runButton.disabled = true; runButton.textContent = "Analizando…"; resultsNode.replaceChildren(node("h4", "", "Analizando estructura"), node("p", "", "Se revisan reglas y patrones del archivo sin ejecutar el proyecto.")); runDocumentRunner(challenge, staticRulesDocument(challenge, source), resultsNode, completeBanner, runButton, 5000); return; }
    if (challenge.runner === "mongo-sim") { runButton.disabled = true; runButton.textContent = "Simulando…"; resultsNode.replaceChildren(node("h4", "", "Ejecutando operaciones MongoDB"), node("p", "", "Se prueban consultas y operaciones en colecciones temporales en memoria.")); runDocumentRunner(challenge, mongoSimulationDocument(challenge, source), resultsNode, completeBanner, runButton, 7000); return; }
    if (challenge.runner === "api-sim") { runButton.disabled = true; runButton.textContent = "Probando API…"; resultsNode.replaceChildren(node("h4", "", "Ejecutando peticiones simuladas"), node("p", "", "Fetch usa respuestas de prueba locales y no realiza conexiones externas.")); runDocumentRunner(challenge, apiSimulationDocument(challenge, source), resultsNode, completeBanner, runButton, 7000); return; }
    if (challenge.runner === "testing-sim") { runButton.disabled = true; runButton.textContent = "Ejecutando tests…"; resultsNode.replaceChildren(node("h4", "", "Ejecutando suite de pruebas"), node("p", "", "Se ejecutan los tests que escribiste y se verifican los nombres requeridos.")); runDocumentRunner(challenge, testingSimulationDocument(challenge, source), resultsNode, completeBanner, runButton, 7000); return; }
    if (challenge.runner === "postgres") { runButton.disabled = true; runButton.textContent = "Iniciando PostgreSQL…"; resultsNode.replaceChildren(node("h4", "", "Iniciando PostgreSQL en WebAssembly"), node("p", "", "Se prepara una base temporal y se ejecutan las consultas en un iframe aislado. La primera carga puede tardar un poco.")); runDocumentRunner(challenge, postgresRunnerDocument(challenge, source), resultsNode, completeBanner, runButton, 30000); return; }
    if (["react", "vue", "webcomponents"].includes(challenge.runner)) { runButton.disabled = true; runButton.textContent = "Preparando entorno…"; resultsNode.replaceChildren(node("h4", "", "Montando componente"), node("p", "", "Preparando la vista previa aislada y ejecutando los casos de prueba.")); runFrameworkChallenge(challenge, source, resultsNode, completeBanner, runButton, previewFrame); return; }
    runButton.disabled = true;
    runButton.textContent = "Preparando pruebas…";
    resultsNode.replaceChildren(node("h4", "", "Ejecutando"), node("p", "", "Compilando el código y preparando el entorno aislado…"));
    try {
      const compiled = await compileCode(challenge, source);
      runButton.textContent = "Ejecutando…";
      runInSandbox(challenge, compiled, resultsNode, completeBanner, runButton);
    } catch (error) {
      resultsNode.replaceChildren(node("h4", "", "No se pudo ejecutar el reto"), node("p", "", error.message || String(error)));
      runButton.disabled = false;
      runButton.textContent = "▶ Ejecutar pruebas";
    }
  }

  async function init() {
    try {
      const params = new URLSearchParams(window.location.search);
      activeLabId = params.get("lab");
      const requestedId = params.get("challenge") || document.body.dataset.challengeId;
      if (activeLabId) {
        if (!window.WebDevLabs?.getLab) throw new Error("El administrador de laboratorios no está disponible. Actualizá WebDev Book.");
        const lab = await window.WebDevLabs.getLab(activeLabId);
        challenges = Array.isArray(lab.challenges) ? lab.challenges : [];
        if (!challenges.length) throw new Error("El laboratorio instalado no contiene ejercicios.");
        activeLabTitle = lab.title || activeLabId;
        document.title = activeLabTitle + " | Laboratorios · WebDev Book";
        const heading = document.querySelector(".challenges-hero h1");
        const intro = document.querySelector(".challenges-hero > p");
        if (heading) heading.textContent = activeLabTitle + ".";
        if (intro) intro.textContent = "Paquete descargable · " + challenges.length + " ejercicios. Tu progreso se conserva junto con el resto de los retos.";
        const back = document.querySelector(".tools-back-link");
        if (back) {
          back.href = "labs.html";
          back.textContent = "← Volver a laboratorios";
        }
        const hero = document.querySelector(".challenges-hero .eyebrow");
        if (hero) hero.textContent = "WEBDEV BOOK / LABORATORIO INSTALADO";
      } else {
        const response = await fetch(DATA_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar el catálogo de retos.");
        const database = await response.json();
        challenges = Array.isArray(database.challenges) ? database.challenges : [];
      }

      if (!challenges.length) throw new Error("El catálogo de retos está vacío.");
      populateTechnologyFilter();
      updateProgressSummary();
      renderList();
      const requestedChallenge = requestedId && challenges.find(item => item.id === requestedId);
      if (requestedId && !requestedChallenge) throw new Error("No se encontró el ejercicio solicitado dentro de este laboratorio.");
      if (document.body.dataset.page === "challenge-detail") {
        if (!requestedChallenge) throw new Error("No se encontró el reto solicitado.");
        document.title = requestedChallenge.title + " | Retos · WebDev Book";
        const pageHeading = document.getElementById("detailPageHeading");
        if (pageHeading) pageHeading.textContent = requestedChallenge.title;
        renderChallenge(requestedChallenge.id);
      } else {
        renderChallenge(requestedChallenge?.id || challenges[0].id);
      }
    } catch (error) {
      workspace.replaceChildren(node("div", "challenge-empty-state"));
      const message = node("p", "", error.message || "Ocurrió un error al cargar los retos.");
      workspace.firstElementChild.append(node("h2", "", "No se pudieron cargar los retos"), message);
      if (activeLabId) {
        const link = node("a", "challenge-action primary", "Abrir Centro de módulos");
        link.href = "modules.html#module-catalog";
        workspace.firstElementChild.append(link);
      }
    }
  }

  difficultyButtons.forEach(button => button.addEventListener("click", () => {
    activeDifficulty = button.dataset.difficulty;
    difficultyButtons.forEach(item => item.classList.toggle("active", item === button));
    renderList();
  }));
  technologyFilter.addEventListener("change", renderList);
  searchInput.addEventListener("input", renderList);
  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY) return;
    progress = readProgress();
    updateProgressSummary();
    renderList();
  });

  init();
})();