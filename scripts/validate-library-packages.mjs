import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readJson = async path => JSON.parse(await readFile(resolve(root, path), "utf8"));
const digest = value => createHash("sha256").update(value, "utf8").digest("hex");
const errors = [];
const source = await readJson("data/tools.json");
const manifest = await readJson("modules/libraries/manifest.json");
const ecosystem = await readJson("modules/libraries/ecosystem.json");
const search = await readJson("modules/libraries/search-index.json");

if (manifest.schemaVersion !== 1) errors.push("Versión de esquema inválida en el manifiesto.");
if (!Array.isArray(manifest.packages) || manifest.packages.length !== 17) errors.push("El manifiesto debe contener 17 paquetes.");
if (!Array.isArray(source.tools) || source.tools.length !== 17) errors.push("La fuente debe contener 17 tecnologías.");

const sourceById = new Map((source.tools || []).map(tool => [tool.id, tool]));
const packageIds = new Set();
const articleKeys = new Set();
let articleCount = 0;
const manifestParts = [];

for (const entry of manifest.packages || []) {
  if (!entry || !/^[a-z0-9-]+$/.test(entry.id || "")) {
    errors.push("Identificador de paquete inválido.");
    continue;
  }
  if (packageIds.has(entry.id)) errors.push("Paquete duplicado: " + entry.id);
  packageIds.add(entry.id);
  const expectedPath = "modules/libraries/packages/" + entry.id + ".json";
  if (entry.path !== expectedPath) errors.push("Ruta de paquete inesperada: " + entry.id);

  try {
    const raw = await readFile(resolve(root, expectedPath), "utf8");
    const tool = JSON.parse(raw);
    const original = sourceById.get(entry.id);
    const actualHash = digest(raw);
    if (actualHash !== entry.sha256) errors.push("SHA-256 no coincide: " + entry.id);
    if (Buffer.byteLength(raw, "utf8") !== entry.sizeBytes) errors.push("Tamaño no coincide: " + entry.id);
    if (!original || JSON.stringify(tool) !== JSON.stringify(original)) errors.push("El paquete no coincide con la fuente: " + entry.id);
    if (tool.id !== entry.id) errors.push("El ID dentro del paquete no coincide: " + entry.id);
    if (tool.articles.length !== entry.articleCount) errors.push("Cantidad de artículos incorrecta: " + entry.id);
    const categories = new Map((tool.categories || []).map(category => [category.id, category]));
    const ids = new Set();
    for (const article of tool.articles || []) {
      if (!article.id || ids.has(article.id)) errors.push("Artículo sin ID o duplicado: " + entry.id + "/" + article.id);
      ids.add(article.id);
      articleCount++;
      if (!categories.has(article.category)) errors.push("Categoría inexistente: " + entry.id + "/" + article.id);
    }
    for (const category of tool.categories || []) {
      for (const id of category.articles || []) {
        if (!ids.has(id)) errors.push("La categoría " + entry.id + "/" + category.id + " apunta a un artículo inexistente: " + id);
      }
    }
    for (const article of tool.articles || []) {
      for (const related of article.related || []) {
        if (!source.tools.some(candidate => candidate.articles?.some(item => item.id === related))) {
          errors.push("Referencia relacionada sin destino: " + entry.id + "/" + article.id + " -> " + related);
        }
      }
    }
  } catch (error) {
    errors.push("No se pudo leer " + expectedPath + ": " + error.message);
  }
  manifestParts.push({
    id: entry.id, path: entry.path, version: entry.version, sha256: entry.sha256,
    sizeBytes: entry.sizeBytes, articleCount: entry.articleCount, categoryCount: entry.categoryCount
  });
}

const expectedManifestVersion = digest(JSON.stringify(manifestParts));
if (manifest.manifestVersion !== expectedManifestVersion) errors.push("La versión del manifiesto no coincide con sus hashes.");
if (ecosystem.schemaVersion !== 1 || ecosystem.tools?.length !== 17) errors.push("El catálogo compacto de tecnologías está incompleto.");
if (search.schemaVersion !== 1 || search.manifestVersion !== manifest.manifestVersion) errors.push("El índice de búsqueda no corresponde al manifiesto.");
if (!Array.isArray(search.entries) || search.entries.length !== 387) errors.push("El índice de búsqueda debe contener 387 artículos.");
const searchKeys = new Set();
for (const entry of search.entries || []) {
  const key = entry.toolId + ":" + entry.articleId;
  if (searchKeys.has(key)) errors.push("Entrada duplicada en el índice de búsqueda: " + key);
  searchKeys.add(key);
  if (!sourceById.get(entry.toolId)?.articles?.some(article => article.id === entry.articleId)) {
    errors.push("El índice apunta a un artículo inexistente: " + key);
  }
  if (typeof entry.searchText !== "string" || !entry.title || !entry.summary) {
    errors.push("Entrada de búsqueda incompleta: " + key);
  }
}
if (articleCount !== 387) errors.push("Se esperaban 387 artículos empaquetados y se encontraron " + articleCount + ".");
if (packageIds.size !== 17) errors.push("Faltan paquetes de tecnología.");

if (errors.length) {
  console.error("Validación de bibliotecas descargables: ERROR");
  errors.forEach(error => console.error(" - " + error));
  process.exitCode = 1;
} else {
  const totalBytes = (manifest.packages || []).reduce((sum, item) => sum + item.sizeBytes, 0);
  console.log("Validación de bibliotecas descargables: OK");
  console.log("17 paquetes | 387 artículos | " + (totalBytes / 1024).toFixed(1) + " KiB de contenido empaquetado.");
}
