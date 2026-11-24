import { cp, mkdir, rm } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'www');
const excluded = new Set([
  '.git',
  '.github',
  'android',
  'node_modules',
  'www',
  'scripts'
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const { readdir } = await import('node:fs/promises');
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  if (entry.name === 'package.json' || entry.name === 'package-lock.json' ||
      entry.name === 'capacitor.config.ts') continue;

  await cp(
    resolve(root, entry.name),
    resolve(output, entry.name),
    {
      recursive: true,
      force: true,
      filter(sourcePath) {
        const relativePath = relative(root, sourcePath).split(sep).join("/");
        // El catálogo monolítico y los paquetes completos viven en GitHub,
        // no dentro de la APK. El núcleo incluye solo manifiestos e índices.
        if (relativePath === "data/tools.json") return false;
        if (relativePath.startsWith("modules/libraries/packages/")) return false;
        return true;
      }
    }
  );
}

console.log('WebDev Book preparado en www/ para Capacitor.');
