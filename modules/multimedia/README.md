# Biblioteca multimedia de WebDev Book
La APK incluye página, estilos, gestor y catálogos pequeños, pero no incluye los archivos de `assets/`. Se descargan bajo demanda y se guardan en Cache Storage `webdev-media-assets-v1`.
## Estructura
- `catalog.json`: metadatos, texto alternativo, licencia, atribución, etiquetas y enlaces internos.
- `manifest.json`: rutas, MIME, tamaños y huellas SHA-256.
- `assets/`: SVG/WebP/PNG/JPEG, MP4/WebM y MP3/OGG.
## Incorporar recursos
Añadí el archivo con nombre estable y registralo en catalog.json. Cada recurso requiere altText, caption, license y attribution. Los videos con diálogo deben incluir subtítulos WebVTT; el audio debe incluir transcripción. Ejecutá `npm run generate:multimedia` y `npm run validate:multimedia`. Solo incorporá materiales propios o con licencia compatible. Se rechazan scripts y referencias externas en SVG.
Quitar una copia local no modifica favoritos, progreso, proyectos ni archivos del editor.