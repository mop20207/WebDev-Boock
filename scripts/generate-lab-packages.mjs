import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const base = JSON.parse(await readFile(resolve(root, "data/challenges.json"), "utf8"));
const extras = JSON.parse(await readFile(resolve(root, "data/lab-extras.json"), "utf8"));
const outputRoot = resolve(root, "modules/labs");
const packageRoot = resolve(outputRoot, "packages");

if (!Array.isArray(base.challenges) || !Array.isArray(extras.challenges)) {
  throw new Error("Los catálogos de retos deben contener un arreglo challenges.");
}

const definitions = [
  {
    id: "lab-frontend",
    title: "Laboratorio de frontend",
    description: "Prácticas de HTML, CSS, JavaScript, TypeScript, React, Vue y Web Components.",
    technologyIds: ["html-css", "javascript", "typescript", "react", "vuejs", "webcomponents"]
  },
  {
    id: "lab-backend",
    title: "Laboratorio de backend",
    description: "Prácticas de Node.js, Astro, APIs, testing y Docker; distingue simulaciones de servicios reales.",
    technologyIds: ["nodejs", "astro", "apis", "testing", "docker-deploy"]
  },
  {
    id: "lab-databases",
    title: "Laboratorio de bases de datos",
    description: "Consultas PostgreSQL con PGlite y prácticas de MongoDB en un simulador en memoria.",
    technologyIds: ["sql-postgres", "mongodb"]
  },
  {
    id: "lab-terminal",
    title: "Laboratorio de terminal",
    description: "Terminal didáctica con comandos permitidos y un sistema de archivos virtual aislado.",
    technologyIds: ["terminal"],
    extraOnly: true
  },
  {
    id: "lab-games",
    title: "Laboratorio de lógica de videojuegos",
    description: "Movimiento, límites, colisiones, puntuación y oleadas con ejercicios JavaScript deterministas.",
    technologyIds: ["phaser"],
    extraOnly: true
  }
];

const sha256 = value => createHash("sha256").update(value, "utf8").digest("hex");
const writeJson = async (path, value) => {
  const content = JSON.stringify(value, null, 2) + "\n";
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  return content;
};

const allChallenges = [...base.challenges, ...extras.challenges];
const seen = new Set();
for (const challenge of allChallenges) {
  if (!challenge || typeof challenge.id !== "string" || !challenge.id) {
    throw new Error("Se encontró un reto sin identificador.");
  }
  if (seen.has(challenge.id)) throw new Error("ID de reto duplicado: " + challenge.id);
  seen.add(challenge.id);
  if (!challenge.title || !challenge.summary || !challenge.statement || !Array.isArray(challenge.tests) || !challenge.tests.length) {
    throw new Error("El reto " + challenge.id + " no tiene contenido o pruebas suficientes.");
  }
  if (!Array.isArray(challenge.hints) || !challenge.hints.length || !challenge.solutionCode) {
    throw new Error("El reto " + challenge.id + " necesita pistas y solución.");
  }
}

const allowedRunners = new Set([
  "react", "vue", "webcomponents", "node-sim", "astro-static", "postgres",
  "mongo-sim", "api-sim", "testing-sim", "docker-static", "terminal-sim", "game-logic"
]);
for (const challenge of allChallenges) {
  if (challenge.runner && !allowedRunners.has(challenge.runner)) {
    throw new Error("Runner no reconocido en " + challenge.id + ": " + challenge.runner);
  }
}

const records = [];
const summaries = [];
const packageIds = new Set();
for (const definition of definitions) {
  if (packageIds.has(definition.id)) throw new Error("Laboratorio duplicado: " + definition.id);
  packageIds.add(definition.id);
  const technologySet = new Set(definition.technologyIds);
  const challenges = allChallenges.filter(challenge => technologySet.has(challenge.technology));
  if (!challenges.length) throw new Error("El laboratorio " + definition.id + " quedó sin ejercicios.");

  if (definition.id === "lab-terminal" && challenges.some(challenge => challenge.runner !== "terminal-sim")) {
    throw new Error("El laboratorio de terminal solo debe incluir ejercicios terminal-sim.");
  }
  if (definition.id === "lab-games" && challenges.some(challenge => challenge.runner !== "game-logic")) {
    throw new Error("El laboratorio de videojuegos debe usar ejercicios game-logic.");
  }

  const runnerTypes = [...new Set(challenges.map(challenge => challenge.runner || "standard"))].sort();
  const pack = {
    schemaVersion: 1,
    id: definition.id,
    title: definition.title,
    description: definition.description,
    technologies: definition.technologyIds,
    challengeCount: challenges.length,
    runnerTypes,
    challenges
  };
  const content = JSON.stringify(pack, null, 2) + "\n";
  const digest = sha256(content);
  const path = "modules/labs/packages/" + definition.id + ".json";
  await mkdir(packageRoot, { recursive: true });
  await writeFile(resolve(root, path), content, "utf8");

  records.push({
    id: definition.id,
    title: definition.title,
    path,
    version: digest.slice(0, 12),
    sha256: digest,
    sizeBytes: Buffer.byteLength(content, "utf8"),
    description: definition.description,
    challengeCount: challenges.length,
    technologyCount: definition.technologyIds.length,
    runnerTypes
  });
  summaries.push({ id: definition.id, challenges: challenges.length, sizeBytes: Buffer.byteLength(content, "utf8"), runners: runnerTypes });
}

const canonical = records.map(({ id, path, version, sha256: hash, sizeBytes, challengeCount, technologyCount, runnerTypes }) => ({
  id, path, version, sha256: hash, sizeBytes, description, challengeCount, technologyCount, runnerTypes
}));
const manifest = {
  schemaVersion: 1,
  manifestVersion: sha256(JSON.stringify(canonical)),
  source: ["data/challenges.json", "data/lab-extras.json"],
  packages: records
};

await writeJson(resolve(outputRoot, "manifest.json"), manifest);
console.log("Laboratorios generados: " + records.length + " paquetes, " +
  records.reduce((sum, item) => sum + item.challengeCount, 0) + " ejercicios.");
for (const summary of summaries) {
  console.log(" - " + summary.id + ": " + summary.challenges + " ejercicios (" +
    (summary.sizeBytes / 1024).toFixed(1) + " KiB), runners: " + summary.runners.join(", "));
}
