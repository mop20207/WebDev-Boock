import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const catalogPath = resolve(root, "modules/catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const errors = [];

if (catalog.schemaVersion !== 1) errors.push("schemaVersion debe ser 1.");
if (!Array.isArray(catalog.modules) || catalog.modules.length === 0) errors.push("El catálogo debe contener módulos.");

const ids = new Set();
const libraryIds = new Set();
for (const module of catalog.modules || []) {
  if (!module.id || typeof module.id !== "string") errors.push("Se encontró un módulo sin id.");
  else if (ids.has(module.id)) errors.push("Id duplicado: " + module.id);
  else ids.add(module.id);

  if (!["core", "foundation", "library", "lab", "media"].includes(module.category)) {
    errors.push("Categoría inválida en " + module.id);
  }
  if (!["integrated", "planned"].includes(module.status)) errors.push("Estado inválido en " + module.id);
  if (!Number.isInteger(module.stage) || module.stage < 1 || module.stage > 4) errors.push("Etapa inválida en " + module.id);
  if (module.status === "integrated" && module.category !== "core" && typeof module.href !== "string") {
    errors.push("Falta enlace para el módulo integrado " + module.id);
  }
  if (module.category === "library") {
    libraryIds.add(module.id);
    if (!Number.isInteger(module.articleCount) || module.articleCount < 1) {
      errors.push("Cantidad de artículos inválida en " + module.id);
    }
  }
}
if (!ids.has("core")) errors.push("Falta el módulo central.");
if (libraryIds.size !== 17) errors.push("Se esperaban 17 bibliotecas tecnológicas; se encontraron " + libraryIds.size + ".");
const articleCount = (catalog.modules || []).reduce((sum, module) => sum + (module.category === "library" ? module.articleCount : 0), 0);
if (articleCount !== 387) errors.push("El total esperado es 387 artículos tecnológicos; se encontraron " + articleCount + ".");

const page = await readFile(resolve(root, "pages/modules.html"), "utf8");
const script = await readFile(resolve(root, "js/module-manager.js"), "utf8");
const styles = await readFile(resolve(root, "css/module-center.css"), "utf8");
if (!page.includes("../js/module-manager.js")) errors.push("La página no carga el gestor de módulos.");
if (!page.includes("../css/module-center.css")) errors.push("La página no carga sus estilos.");
if (!script.includes("webdev-book-modules")) errors.push("Falta el nombre de la base de datos local.");
if (!styles.includes(".module-grid")) errors.push("Faltan estilos del catálogo de módulos.");

if (errors.length) {
  console.error("Validación del catálogo de módulos: ERROR");
  errors.forEach(error => console.error(" - " + error));
  process.exitCode = 1;
} else {
  console.log("Validación del catálogo de módulos: OK");
  console.log("Módulos: " + catalog.modules.length + " | Bibliotecas: " + libraryIds.size + " | Artículos tecnológicos: " + articleCount);
}