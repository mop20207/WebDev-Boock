import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = process.cwd();
const read = async path => readFile(resolve(root, path), "utf8");
const json = async path => JSON.parse(await read(path));
const hash = value => createHash("sha256").update(value).digest("hex");
const errors = [];
const source = await json("data/challenges.json");
const definitions = await json("data/labs/catalog.json");
const manifest = await json("modules/labs/manifest.json");
const catalog = await json("modules/labs/catalog.json");
const sourceIds = new Set(source.challenges.map(item => item.id));
const seen = new Set();
if (manifest.schemaVersion !== 1 || catalog.schemaVersion !== 1) errors.push("Versión de esquema no compatible.");
if (manifest.packages.length !== definitions.labs.length) errors.push("Cantidad de paquetes distinta al catálogo.");
const canonical = [];
for (const entry of manifest.packages) {
  const path = "modules/labs/packages/" + entry.id + ".json";
  if (entry.path !== path) errors.push("Ruta inesperada: " + entry.id);
  try {
    const raw = await read(path);
    const pack = JSON.parse(raw);
    if (hash(raw) !== entry.sha256) errors.push("SHA-256 incorrecto: " + entry.id);
    if (Buffer.byteLength(raw) !== entry.sizeBytes) errors.push("Tamaño incorrecto: " + entry.id);
    if (pack.id !== entry.id || pack.schemaVersion !== 1 || !Array.isArray(pack.challenges)) errors.push("Estructura inválida: " + entry.id);
    if (pack.challenges.length !== entry.challengeCount) errors.push("Cantidad de retos incorrecta: " + entry.id);
    for (const challenge of pack.challenges) {
      if (!sourceIds.has(challenge.id)) errors.push("Reto no existe en la fuente: " + challenge.id);
      if (seen.has(challenge.id)) errors.push("Reto duplicado entre laboratorios: " + challenge.id);
      seen.add(challenge.id);
      if (!Array.isArray(challenge.tests) || !challenge.tests.length) errors.push("Reto sin pruebas: " + challenge.id);
      if (!challenge.starterCode && !challenge.htmlCode) errors.push("Reto sin código inicial: " + challenge.id);
    }
  } catch (error) { errors.push("No se pudo validar " + path + ": " + error.message); }
  canonical.push({id:entry.id,path:entry.path,version:entry.version,sha256:entry.sha256,sizeBytes:entry.sizeBytes,challengeCount:entry.challengeCount});
}
if (seen.size !== source.challenges.length) errors.push("La cobertura de retos no coincide: " + seen.size + "/" + source.challenges.length);
if (hash(JSON.stringify(canonical)) !== manifest.manifestVersion) errors.push("La huella del manifiesto no coincide.");
if (catalog.labs.length !== manifest.packages.length) errors.push("El catálogo visible no coincide con los paquetes.");
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log("Laboratorios OK: " + manifest.packages.length + " paquetes; " + seen.size + " retos; cobertura completa.");
