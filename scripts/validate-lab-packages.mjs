import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readJson = async path => JSON.parse(await readFile(resolve(root, path), "utf8"));
const digest = value => createHash("sha256").update(value, "utf8").digest("hex");
const errors = [];
const base = await readJson("data/challenges.json");
const extras = await readJson("data/lab-extras.json");
const manifest = await readJson("modules/labs/manifest.json");
const all = [...(base.challenges || []), ...(extras.challenges || [])];
const sourceById = new Map();
for (const challenge of all) {
  if (!challenge?.id || sourceById.has(challenge.id)) errors.push("ID de reto vacío o duplicado: " + challenge?.id);
  else sourceById.set(challenge.id, challenge);
  if (!Array.isArray(challenge?.tests) || !challenge.tests.length) errors.push("Reto sin tests: " + challenge?.id);
  if (!Array.isArray(challenge?.hints) || !challenge.hints.length) errors.push("Reto sin pistas: " + challenge?.id);
  if (!challenge?.solutionCode) errors.push("Reto sin solución: " + challenge?.id);
}
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.packages) || manifest.packages.length !== 5) {
  errors.push("El manifiesto debe tener schemaVersion 1 y cinco paquetes.");
}

const packageIds = new Set();
const canonical = [];
let totalChallenges = 0;
const allowedRunners = new Set([
  "react", "vue", "webcomponents", "node-sim", "astro-static", "postgres",
  "mongo-sim", "api-sim", "testing-sim", "docker-static", "terminal-sim", "game-logic"
]);

for (const entry of manifest.packages || []) {
  if (!entry || !/^[a-z0-9-]+$/.test(entry.id || "")) {
    errors.push("ID de paquete inválido.");
    continue;
  }
  if (packageIds.has(entry.id)) errors.push("Paquete duplicado: " + entry.id);
  packageIds.add(entry.id);
  const expectedPath = "modules/labs/packages/" + entry.id + ".json";
  if (entry.path !== expectedPath) errors.push("Ruta inesperada para " + entry.id);
  try {
    const raw = await readFile(resolve(root, expectedPath), "utf8");
    const pack = JSON.parse(raw);
    if (digest(raw) !== entry.sha256) errors.push("SHA-256 no coincide: " + entry.id);
    if (Buffer.byteLength(raw, "utf8") !== entry.sizeBytes) errors.push("Tamaño no coincide: " + entry.id);
    if (pack.schemaVersion !== 1 || pack.id !== entry.id) errors.push("Identidad o esquema inválido: " + entry.id);
    if (!Array.isArray(pack.challenges) || pack.challenges.length !== entry.challengeCount) errors.push("Cantidad de retos inválida: " + entry.id);
    if (!Array.isArray(pack.technologies) || pack.technologies.length !== entry.technologyCount) errors.push("Tecnologías inválidas: " + entry.id);
    const localIds = new Set();
    for (const challenge of pack.challenges || []) {
      if (!challenge.id || localIds.has(challenge.id)) errors.push("Reto duplicado en paquete: " + entry.id + "/" + challenge.id);
      localIds.add(challenge.id);
      totalChallenges++;
      const source = sourceById.get(challenge.id);
      if (!source || JSON.stringify(source) !== JSON.stringify(challenge)) errors.push("El reto del paquete difiere de su fuente: " + challenge.id);
      if (challenge.runner && !allowedRunners.has(challenge.runner)) errors.push("Runner desconocido: " + challenge.id);
    }
    const runners = [...new Set((pack.challenges || []).map(challenge => challenge.runner || "standard"))].sort();
    if (JSON.stringify(runners) !== JSON.stringify(entry.runnerTypes)) errors.push("Tipos de runner no coinciden: " + entry.id);
    if (entry.id === "lab-terminal" && (pack.challenges || []).some(challenge => challenge.runner !== "terminal-sim")) {
      errors.push("El laboratorio de terminal incluye un runner no autorizado.");
    }
    if (entry.id === "lab-games" && (pack.challenges || []).some(challenge => challenge.runner !== "game-logic")) {
      errors.push("El laboratorio de videojuegos incluye un runner no autorizado.");
    }
    canonical.push({
      id: entry.id, path: entry.path, version: entry.version, sha256: entry.sha256,
      sizeBytes: entry.sizeBytes, challengeCount: entry.challengeCount,
      technologyCount: entry.technologyCount, runnerTypes: entry.runnerTypes
    });
  } catch (error) {
    errors.push("No se pudo validar " + expectedPath + ": " + error.message);
  }
}
if (packageIds.size !== 5) errors.push("Se esperaban cinco paquetes de laboratorio.");
if (manifest.manifestVersion !== digest(JSON.stringify(canonical))) errors.push("La huella del manifiesto no coincide.");
if (totalChallenges !== all.length) errors.push("Los paquetes no cubren exactamente todos los retos de origen.");

if (errors.length) {
  console.error("Validación de laboratorios: ERROR");
  errors.forEach(error => console.error(" - " + error));
  process.exitCode = 1;
} else {
  const totalBytes = manifest.packages.reduce((sum, item) => sum + item.sizeBytes, 0);
  console.log("Validación de laboratorios: OK");
  console.log(manifest.packages.length + " paquetes | " + totalChallenges + " ejercicios | " +
    (totalBytes / 1024).toFixed(1) + " KiB sin comprimir.");
}
