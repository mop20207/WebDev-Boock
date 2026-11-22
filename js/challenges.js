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

    const editorShell = node("div", "challenge-editor-shell");
    const toolbar = node("div", "challenge-editor-toolbar");
    toolbar.append(node("span", "challenge-editor-language", challenge.language.toUpperCase() + " · EDITOR"));
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
    editor.setAttribute("aria-label", "Editor de código para el reto");
    editor.value = challenge.starterCode || "";
    const editorHelp = node("div", "challenge-editor-help");
    editorHelp.append(node("span", "", "Tip: leé los requisitos y probá una solución pequeña primero."), node("span", "", "Ctrl + Enter para ejecutar"));
    editorShell.append(toolbar, editor, editorHelp);
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
      editor.value = challenge.starterCode || "";
      results.replaceChildren(node("h4", "", "Resultado de las pruebas"), node("p", "", "Código restablecido. Volvé a ejecutar las pruebas cuando estés listo."));
    });
    runButton.addEventListener("click", () => runChallenge(challenge, editor.value, results, completeBanner, runButton));
    editor.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runChallenge(challenge, editor.value, results, completeBanner, runButton);
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
    if (activeRunner) activeRunner.remove();
    activeRunnerCleanup = null;
    activeRunner = null;
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

  async function runChallenge(challenge, source, resultsNode, completeBanner, runButton) {
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