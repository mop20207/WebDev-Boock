import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const root = process.cwd();
const dataRoot = resolve(root, "data");
const outputDir = resolve(root, "updates");
const outputFile = resolve(outputDir, "content-manifest.json");

async function collectJson(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJson(absolutePath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      files.push(absolutePath);
    }
  }
  return files;
}

const paths = (await collectJson(dataRoot)).sort();
const files = [];
for (const absolutePath of paths) {
  const bytes = await readFile(absolutePath);
  const path = relative(root, absolutePath).split(sep).join("/");
  files.push({
    path,
    sha256: createHash("sha256").update(bytes).digest("hex")
  });
}

const manifest = {
  schemaVersion: 1,
  version: process.env.GITHUB_SHA || "local-" + Date.now(),
  generatedAt: new Date().toISOString(),
  files
};

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log("Manifiesto generado: " + files.length + " archivos JSON de contenido.");
