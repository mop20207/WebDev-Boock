import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(await readFile(resolve(root, "data/labs/catalog.json"), "utf8"));
const source = JSON.parse(await readFile(resolve(root, "data/challenges.json"), "utf8"));
if (definitions.schemaVersion !== 1 || !Array.isArray(definitions.labs) || !Array.isArray(source.challenges)) {
  throw new Error("El catálogo de laboratorios o los retos tienen un formato inválido.");
}
const hash = value => createHash("sha256").update(value).digest("hex");
const writeJson = async (path, value) => {
  const content = JSON.stringify(value, null, 2) + "\n";
  await mkdir(dirname(path), { recursive: true });
  await writeFile(resolve(root, path), content, "utf8");
  return content;
};
const seenLabs = new Set();
const seenChallenges = new Set();
const records = [];
const summaries = [];
for (const lab of definitions.labs) {
  if (!/^[a-z0-9-]+$/.test(lab.id || "") || seenLabs.has(lab.id)) throw new Error("ID de laboratorio inválido o duplicado: " + lab.id);
  seenLabs.add(lab.id);
  if (!Array.isArray(lab.technologies) || !lab.technologies.length) throw new Error("El laboratorio " + lab.id + " no tiene tecnologías.");
  const challenges = source.challenges.filter(challenge => lab.technologies.includes(challenge.technology));
  if (!challenges.length) throw new Error("El laboratorio " + lab.id + " quedó sin retos.");
  for (const challenge of challenges) {
    if (seenChallenges.has(challenge.id)) throw new Error("El reto " + challenge.id + " está asignado a más de un laboratorio.");
    seenChallenges.add(challenge.id);
  }
  const pack = {
    schemaVersion: 1,
    id: lab.id,
    title: lab.title,
    description: lab.description,
    technologies: lab.technologies,
    challengeCount: challenges.length,
    challenges
  };
  const path = "modules/labs/packages/" + lab.id + ".json";
  const content = JSON.stringify(pack, null, 2) + "\n";
  await writeJson(path, pack);
  records.push({ id: lab.id, path, version: hash(content).slice(0, 12), sha256: hash(content), sizeBytes: Buffer.byteLength(content), challengeCount: challenges.length });
  summaries.push({ id: lab.id, title: lab.title, subtitle: lab.subtitle, description: lab.description, icon: lab.icon, accent: lab.accent, technologies: lab.technologies, outcomes: lab.outcomes, challengeCount: challenges.length });
}
if (seenChallenges.size !== source.challenges.length) {
  const missing = source.challenges.filter(challenge => !seenChallenges.has(challenge.id)).map(challenge => challenge.id);
  throw new Error("Hay retos sin laboratorio: " + missing.join(", "));
}
const canonical = JSON.stringify(records);
const manifest = { schemaVersion: 1, manifestVersion: hash(canonical), packages: records };
const catalog = { schemaVersion: 1, catalogVersion: definitions.catalogVersion || "1.0.0", labs: summaries };
await writeJson("modules/labs/manifest.json", manifest);
await writeJson("modules/labs/catalog.json", catalog);
console.log("Laboratorios generados: " + records.length + "; retos distribuidos: " + seenChallenges.size + "; manifiesto: " + manifest.manifestVersion);
