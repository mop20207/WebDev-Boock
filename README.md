# WebDev Book

Biblioteca interactiva y responsive para aprender desarrollo web y herramientas de trabajo con proyectos.

## Contenido

- **HTML, CSS y JavaScript:** fundamentos, elementos, propiedades, métodos y prácticas.
- **Terminal Linux:** introducción, preparación del entorno, ficheros y carpetas, manejo de la terminal, multimedia, administración y seguridad.
- **Git y GitHub:** fundamentos, primeros pasos, ramas, combinación de cambios y colaboración.
- **NPM y paquetes:** Node.js, gestores de paquetes, dependencias, package.json, scripts y versionado.

El catálogo inicial de herramientas incluye **41 artículos**: 16 de Terminal Linux, 12 de Git/GitHub y 13 de NPM.

## Estructura del proyecto

```text
WebDev-Boock/
├── index.html
├── pages/
│   ├── html.html
│   ├── css.html
│   ├── javascript.html
│   ├── tools.html
│   ├── tools-category.html
│   └── tools-article.html
├── css/
│   ├── global.css
│   ├── home.css
│   └── tools-library.css
├── js/
│   ├── app.js
│   ├── navigation.js
│   ├── theme.js
│   ├── search.js
│   ├── tools-library.js
│   ├── learning-progress.js
│   └── editor.js
├── data/
│   ├── html-articulos.json
│   ├── css-articulos.json
│   ├── js-articulos.json
│   └── tools.json
└── assets/
    ├── icons/
    └── images/
```

## Cómo se organizan las nuevas herramientas

Las tres herramientas comparten una plantilla de páginas y un catálogo JSON:

1. La página de cada herramienta muestra sus categorías.
2. Cada categoría lista los artículos que contiene.
3. Cada artículo tiene una página individual con explicación, sintaxis, ejemplos comentados, buenas prácticas, errores frecuentes, ejercicios y referencias oficiales.

Las nuevas páginas también se integran con el buscador global, los favoritos y el progreso local del navegador.

## Desarrollo

El proyecto es estático y se publica mediante GitHub Pages. Los datos educativos se mantienen separados de la interfaz en archivos JSON.
