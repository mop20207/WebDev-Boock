import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { resolve } from "node:path";

const source = await readFile(resolve("js/challenges.js"), "utf8");
const functionStart = source.indexOf("function terminalSimulationDocument");
const scriptStart = source.indexOf("const script = ", functionStart);
const literalStart = scriptStart + "const script = ".length;
const literalEnd = source.indexOf('.replace("__PAYLOAD__", payload);', literalStart);
if (functionStart < 0 || scriptStart < 0 || literalEnd < 0) {
  console.error("No se pudo localizar el runtime del simulador terminal.");
  process.exit(1);
}
const runtime = JSON.parse(source.slice(literalStart, literalEnd).trim());
const extras = JSON.parse(await readFile(resolve("data/lab-extras.json"), "utf8"));
const terminalChallenges = extras.challenges.filter(challenge => challenge.runner === "terminal-sim");
const failures = [];

for (const challenge of terminalChallenges) {
  const payload = JSON.stringify({
    id: challenge.id,
    source: challenge.starterCode,
    setup: challenge.terminalSetup || {},
    checks: challenge.terminalChecks || []
  }).replace(/</g, "\\u003c");
  const script = runtime.replace("__PAYLOAD__", payload);
  let message = null;
  runInNewContext(script, {
    parent: { postMessage(data) { message = data; } }
  }, { timeout: 1500, displayErrors: true });

  if (!message || message.source !== "webdev-challenges" || message.id !== challenge.id) {
    failures.push(challenge.id + ": no devolvió un mensaje de resultados.");
    continue;
  }
  if (!Array.isArray(message.results) || message.results.length !== challenge.terminalChecks.length) {
    failures.push(challenge.id + ": cantidad de comprobaciones incorrecta.");
    continue;
  }
  const failed = message.results.filter(result => !result.passed);
  if (failed.length) failures.push(challenge.id + ": " + failed.map(result => result.label + " (" + result.actual + ")").join("; "));
}

const hostilePayload = JSON.stringify({
  id: "terminal-security-check",
  source: "fetch https://example.invalid/\ncd ../../outside\nrm -r /workspace\npwd",
  setup: { cwd: "/workspace" },
  checks: []
});
let securityMessage = null;
runInNewContext(runtime.replace("__PAYLOAD__", hostilePayload), {
  parent: { postMessage(data) { securityMessage = data; } }
}, { timeout: 1500, displayErrors: true });
const securityOutput = securityMessage?.terminal?.output || "";
if (!securityOutput.includes("Comando no permitido: fetch")) failures.push("El comando fetch no fue bloqueado.");
if (!securityOutput.includes("No se puede salir del directorio virtual")) failures.push("La ruta ../ fuera del workspace no fue bloqueada.");
if (!securityOutput.includes("No se puede borrar la raíz")) failures.push("La eliminación de la raíz virtual no fue bloqueada.");
if (!securityOutput.includes("/workspace")) failures.push("El directorio de trabajo de la prueba de seguridad cambió inesperadamente.");

if (failures.length) {
  console.error("Pruebas del simulador de terminal: ERROR");
  failures.forEach(message => console.error(" - " + message));
  process.exitCode = 1;
} else {
  console.log("Pruebas del simulador de terminal: OK");
  console.log(terminalChallenges.length + " escenarios funcionales y 3 controles de seguridad superados.");
}
