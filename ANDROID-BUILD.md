# WebDev Book para Android

La aplicación Android se compila en GitHub Actions; no hace falta instalar Android Studio en la computadora.

## Crear un APK de prueba

1. Abrí la pestaña **Actions** del repositorio.
2. Elegí **Build Android APK**.
3. Presioná **Run workflow** y confirmá.
4. Esperá a que el trabajo termine con estado verde.
5. Entrá en la ejecución y descargá el artefacto **webdev-book-debug-apk**.
6. Descomprimí el ZIP y transferí `app-debug.apk` al teléfono para instalarlo.

Este flujo genera un APK de depuración para pruebas. No es todavía una versión firmada de publicación (release/AAB).

## Estructura

- El código web original permanece en sus carpetas actuales.
- `scripts/prepare-web.mjs` crea una copia de distribución en `www/`.
- Capacitor empaqueta esa copia dentro de Android.
- El service worker de GitHub Pages no se registra dentro de la aplicación nativa.

## Actualizaciones de contenido dentro de Android

La APK incluye un sincronizador de contenido. En las pantallas de la biblioteca aparece el botón **Actualizaciones**:

- Comprueba automáticamente cada 12 horas si hay contenido nuevo publicado en la rama `main`.
- También permite iniciar una comprobación manual.
- Descarga catálogos JSON (artículos, herramientas, retos y proyectos) y los guarda en IndexedDB.
- Comprueba el formato JSON y los hashes SHA-256 publicados en el manifiesto.
- Guarda el paquete completo en una transacción; si una descarga o validación falla, conserva los datos anteriores.
- Permite aplicar el contenido descargado recargando la pantalla. Antes de recargar, el usuario debe guardar cualquier código que tenga abierto en el editor.

El workflow **Publish content update manifest** genera los hashes automáticamente cuando cambian archivos `data/**/*.json` en `main`. Así, esos cambios de contenido no requieren generar ni instalar otra APK.

**Límite:** los cambios de código de la aplicación (HTML, CSS, JavaScript de funcionamiento, Capacitor o funciones nativas) siguen necesitando una nueva compilación APK. El sincronizador actualiza los datos JSON publicados, no reemplaza ejecutables ni código de la aplicación.

## Laboratorios interactivos descargables (etapa 3)

La aplicación incluye un centro en `pages/labs.html` y cinco paquetes independientes:

- **Frontend:** ejercicios de HTML/CSS, JavaScript, TypeScript, React, Vue y Web Components.
- **Backend:** Node.js simulado, Astro estático, APIs, testing y validación estática de Docker.
- **Bases de datos:** PostgreSQL con PGlite WebAssembly y prácticas MongoDB en memoria.
- **Terminal:** comandos educativos en un sistema de archivos virtual aislado.
- **Videojuegos:** lógica 2D determinista para movimiento, límites, colisiones, puntuación y oleadas.

Los paquetes se instalan con verificación SHA-256 y se guardan en IndexedDB como registros `lab:<id>`; no se mezclan con los paquetes de bibliotecas `library:<id>`. Se pueden actualizar o quitar desde Laboratorios o el Centro de módulos. El progreso de los ejercicios se conserva con la clave existente `webdevbook.challenges.v1`.

**Límites de ejecución:** la terminal es un simulador de comandos permitidos, no una shell Android ni Linux real. MongoDB y Fetch son simuladores locales. Docker y Astro se validan estáticamente; no se ejecutan Docker Engine ni un proyecto Astro completo. React/Vue y PGlite pueden descargar su runtime desde CDN la primera vez. Los ejercicios Phaser enseñan lógica de juego, pero no instalan el motor Phaser completo.

El workflow **Publish interactive lab packages** genera `modules/labs/manifest.json` y los cinco JSON cuando cambian `data/challenges.json`, `data/lab-extras.json` o los scripts del generador. Para comprobar localmente:
```bash
npm run generate:labs
npm run validate:labs
```
