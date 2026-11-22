(() => {
  "use strict";

  const DATA_URL = "../data/challenges.json";
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
      const card = node("button", "challenge-card" + (activeChallenge?.id === challenge.id ? " active" : ""));
      card.type = "button";
      card.setAttribute("aria-pressed", String(activeChallenge?.id === challenge.id));
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
      card.addEventListener("click", () => renderChallenge(challenge.id));
      listNode.append(card);
    });
  }

  function renderChallenge(id) {
    cancelActiveRunner();
    const challenge = challenges.find(item => item.id === id);
    if (!challenge) return;
    activeChallenge = challenge;
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
    toolbar.append(node("span", "challenge-editor-language", isHtmlCss ? "HTML + CSS · EDITOR" : challenge.language.toUpperCase() + " · EDITOR"));
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
    const runnerHelp = isHtmlCss
      ? "HTML y CSS se renderizan sin scripts ni acceso a la red."
      : challenge.runner === "node-sim"
        ? "Simulador educativo: APIs de Node.js con datos en memoria; no accede al servidor, red ni archivos reales."
        : hasFrameworkPreview
          ? "Vista previa aislada. React y Vue se cargan desde CDN; Web Components usa APIs nativas del navegador."
          : "Tip: leé los requisitos y probá una solución pequeña primero.";
    editorHelp.append(node("span", "", runnerHelp), node("span", "", "Ctrl + Enter para ejecutar"));
    let cssEditor = null;
    let previewFrame = null;
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
      results.replaceChildren(node("h4", "", "Resultado de las pruebas"), node("p", "", "Código restablecido. Volvé a ejecutar las pruebas cuando estés listo."));
    });
    runButton.addEventListener("click", () => runChallenge(challenge, editor.value, results, completeBanner, runButton, cssEditor?.value, previewFrame));
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

  async function runChallenge(challenge, source, resultsNode, completeBanner, runButton, cssSource, previewFrame) {
    if (challenge.language === "htmlcss") { runButton.disabled = true; runButton.textContent = "Ejecutando…"; resultsNode.replaceChildren(node("h4", "", "Ejecutando pruebas HTML y CSS"), node("p", "", "Renderizando la página en un iframe aislado.")); runHtmlCss(challenge, source, cssSource || "", resultsNode, completeBanner, runButton); return; }
    if (challenge.runner === "node-sim") { runButton.disabled = true; runButton.textContent = "Ejecutando…"; resultsNode.replaceChildren(node("h4", "", "Ejecutando simulación de Node.js"), node("p", "", "Se probarán módulos y APIs educativas dentro de un entorno en memoria, sin acceder al servidor.")); runNodeSimulationChallenge(challenge, source, resultsNode, completeBanner, runButton); return; }
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
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo cargar el catálogo de retos.");
      const database = await response.json();
      challenges = Array.isArray(database.challenges) ? database.challenges : [];
      if (!challenges.length) throw new Error("El catálogo de retos está vacío.");
      populateTechnologyFilter();
      updateProgressSummary();
      renderList();
      renderChallenge(challenges[0].id);
    } catch (error) {
      workspace.replaceChildren(node("div", "challenge-empty-state"));
      const message = node("p", "", error.message || "Ocurrió un error al cargar los retos.");
      workspace.firstElementChild.append(node("h2", "", "No se pudieron cargar los retos"), message);
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