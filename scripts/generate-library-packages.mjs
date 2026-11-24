import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const sourcePath = resolve(root, "data/tools.json");
const outputRoot = resolve(root, "modules/libraries");
const packageRoot = resolve(outputRoot, "packages");

const source = JSON.parse(await readFile(sourcePath, "utf8"));
if (!Array.isArray(source.tools) || source.tools.length !== 17) {
  throw new Error("Se esperaban exactamente 17 bibliotecas en data/tools.json.");
}

const sha256 = value => createHash("sha256").update(value, "utf8").digest("hex");
const writeJson = async (path, value) => {
  const content = JSON.stringify(value, null, 2) + "\n";
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  return content;
};
const collectText = value => {
  const parts = [];
  const visit = item => {
    if (typeof item === "string" || typeof item === "number") parts.push(String(item));
    else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === "object") Object.values(item).forEach(visit);
  };
  visit(value);
  return parts;
};
const normalizeSearchText = value => String(value ?? "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

// El buscador anterior recorría todos los campos del artículo. Conservamos
// esa cobertura, pero almacenamos cada palabra una sola vez por artículo para
// no duplicar ejemplos y explicaciones completas en el índice inicial.
const collectSearchText = (article, tool, categoryTitle) => {
  const words = new Set();
  [tool.title, tool.shortTitle || "", categoryTitle, ...collectText(article)].forEach(value => {
    normalizeSearchText(value).split(" ").filter(Boolean).forEach(word => words.add(word));
  });
  return Array.from(words).join(" ");
};

const packageRecords = [];
const ecosystemTools = [];
const searchEntries = [];
const seenToolIds = new Set();
const seenArticleIds = new Set();

for (const tool of source.tools) {
  if (!tool || !/^[a-z0-9-]+$/.test(tool.id || "") || seenToolIds.has(tool.id)) {
    throw new Error("Identificador de tecnología inválido o duplicado: " + tool?.id);
  }
  seenToolIds.add(tool.id);
  if (!Array.isArray(tool.categories) || !Array.isArray(tool.articles)) {
    throw new Error("La biblioteca " + tool.id + " no tiene categorías y artículos válidos.");
  }

  const packageContent = JSON.stringify(tool, null, 2) + "\n";
  const digest = sha256(packageContent);
  const packagePath = "modules/libraries/packages/" + tool.id + ".json";
  await mkdir(packageRoot, { recursive: true });
  await writeFile(resolve(root, packagePath), packageContent, "utf8");

  packageRecords.push({
    id: tool.id,
    title: tool.title,
    path: packagePath,
    version: digest.slice(0, 12),
    sha256: digest,
    sizeBytes: Buffer.byteLength(packageContent, "utf8"),
    articleCount: tool.articles.length,
    categoryCount: tool.categories.length,
    description: tool.description || ""
  });

  ecosystemTools.push({
    id: tool.id,
    title: tool.title,
    shortTitle: tool.shortTitle || "",
    accent: tool.accent || "",
    symbol: tool.symbol || "",
    eyebrow: tool.eyebrow || "",
    level: tool.level || "",
    syntaxLanguage: tool.syntaxLanguage || "",
    description: tool.description || "",
    articles: tool.articles.map(article => ({
      id: article.id,
      title: article.title,
      summary: article.summary || "",
      category: article.category || ""
    }))
  });

  const categories = new Map(tool.categories.map(category => [category.id, category.title]));
  for (const article of tool.articles) {
    const key = tool.id + ":" + article.id;
    if (!article.id || seenArticleIds.has(key)) throw new Error("Artículo duplicado o sin ID: " + key);
    seenArticleIds.add(key);
    const categoryTitle = categories.get(article.category) || "General";
    searchEntries.push({
      toolId: tool.id,
      toolTitle: tool.title,
      toolShortTitle: tool.shortTitle || "",
      categoryTitle,
      articleId: article.id,
      title: article.title,
      summary: article.summary || article.purpose || "",
      searchText: collectSearchText(article, tool, categoryTitle)
    });
  }
}

const manifestFiles = packageRecords.map(({ id, path, version, sha256: hash, sizeBytes, articleCount, categoryCount }) => ({
  id, path, version, sha256: hash, sizeBytes, articleCount, categoryCount
}));
const manifestVersion = sha256(JSON.stringify(manifestFiles));
const manifest = {
  schemaVersion: 1,
  manifestVersion,
  source: "data/tools.json",
  generatedAt: "",
  packages: packageRecords
};
const ecosystem = {
  schemaVersion: 1,
  tools: ecosystemTools,
  integrations: source.integrations || []
};
const searchIndex = {
  schemaVersion: 1,
  manifestVersion,
  entries: searchEntries
};

await writeJson(resolve(outputRoot, "manifest.json"), manifest);
await writeJson(resolve(outputRoot, "ecosystem.json"), ecosystem);
await writeJson(resolve(outputRoot, "search-index.json"), searchIndex);

console.log(
  "Paquetes de bibliotecas generados: " + packageRecords.length +
  " tecnologías, " + searchEntries.length + " artículos, manifiesto " + manifestVersion + "."
);
