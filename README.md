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
- **Bases relacionales:** SQL y PostgreSQL 19, con diseño relacional, consultas, JOIN, transacciones, JSONB, índices, rendimiento e integración con Node.js.
- **Bases documentales:** MongoDB, con BSON, modelado embebido y referenciado, CRUD, arrays, agregaciones, índices, seguridad, transacciones y driver de Node.js.
- **Comunicación web:** APIs y comunicación web, con HTTP, REST, JSON, Fetch, CORS, autenticación, OpenAPI y webhooks.
- **Calidad de software:** Testing, con pruebas unitarias, integración, componentes, E2E, Vitest, Testing Library, Playwright y CI.
- **Contenedores y publicación:** Docker y despliegue, con Dockerfile, imágenes, Compose, redes, volúmenes, seguridad, GHCR, CI/CD y operación en producción.

El catálogo de herramientas y tecnologías contiene **387 artículos distribuidos en 17 bibliotecas**. TypeScript incorpora 37 artículos, Next.js 44, Express.js 42, SQL y PostgreSQL 42, MongoDB 42, APIs y comunicación web 14, Testing 14 y Docker y despliegue 28. Las bibliotecas más extensas se organizan en siete categorías; APIs y Testing tienen cinco categorías cada una.

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
