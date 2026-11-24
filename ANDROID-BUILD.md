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
