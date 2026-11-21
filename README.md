# WebDev Book

Biblioteca interactiva y responsive para aprender desarrollo web, herramientas y tecnologías mediante explicaciones, ejemplos comentados y prácticas.

## Contenido

- **HTML, CSS y JavaScript:** fundamentos, elementos, propiedades, métodos y prácticas.
- **Herramientas:** Terminal Linux, Git/GitHub y NPM.
- **Frontend:** React, Web Components, Vue.js y Astro.
- **Backend y entorno:** Node.js.
- **Desarrollo de juegos:** Phaser.
- **Tipado estático:** TypeScript, desde los fundamentos hasta genéricos, módulos, configuración e integración con DOM, React y Node.js.
- **Framework full-stack:** Next.js, con App Router, Server/Client Components, caché, Server Actions, Route Handlers, seguridad, pruebas y despliegue.
- **Backend HTTP:** Express.js 5, con rutas, middleware, APIs REST, validación, autenticación, seguridad, TypeScript, pruebas y despliegue.

El catálogo de herramientas y tecnologías contiene **247 artículos**. TypeScript incorpora 37 artículos, Next.js 44 artículos y Express.js 42 artículos, cada tecnología distribuida en siete categorías.

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

## Cómo se organizan las tecnologías

Las tecnologías comparten una plantilla de páginas y un catálogo JSON:

1. La página de cada tecnología muestra sus categorías.
2. Cada categoría lista los artículos que contiene.
3. Cada artículo tiene una página individual con explicación, sintaxis, ejemplos comentados, buenas prácticas, errores frecuentes, una práctica y documentación de referencia.

Las páginas se integran con el buscador global, los favoritos y el progreso local del navegador. Los ejemplos utilizan resaltado de sintaxis cuando la biblioteca está disponible.

## Desarrollo

El proyecto es estático y se publica mediante GitHub Pages. Los datos educativos se mantienen separados de la interfaz en archivos JSON.
