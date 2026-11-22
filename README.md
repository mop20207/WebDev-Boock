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

## Biblioteca de proyectos

La biblioteca reúne **15 proyectos completos y progresivos**: cinco principiantes, cinco intermedios y cinco avanzados. Incluye tarjetas interactivas, formularios validados, calculadora, reloj y temporizador, lista de tareas, buscador de películas, catálogo de productos, clima, panel administrativo, directorio de usuarios de demostración, autenticación segura, tienda online, blog con PostgreSQL, API REST propia y gestor full-stack.

Cada proyecto tiene una carpeta propia en `projects/<id>/`, con archivos fuente reales, README, objetivos, tecnologías, pasos, criterios de comprobación y ampliaciones. La interfaz permite consultar, copiar y descargar archivos, usar vistas previas aisladas para proyectos de frontend y guardar el progreso local. Los ejemplos de backend requieren Node.js y/o base de datos: GitHub Pages solo los documenta, no los ejecuta.

## Retos interactivos

La sección de retos incluye un catálogo filtrable por tecnología y dificultad (principiante, intermedio, avanzado y experto), además de una página HTML independiente para cada ejercicio. Cada reto puede incluir el enunciado, objetivos, requisitos, editor, pruebas, pistas progresivas, solución explicada, errores habituales y seguimiento local del progreso.

La sección incorpora 52 retos: cuatro por tecnología para TypeScript, JavaScript, HTML/CSS, React, Web Components, Vue.js, Node.js, Astro, SQL/PostgreSQL, MongoDB, APIs y comunicación web, Testing, y Docker/despliegue. Cada tecnología tiene un reto en cada nivel de dificultad (principiante, intermedio, avanzado y experto). Los ejercicios incluyen enunciado, objetivos, requisitos, editor, pruebas, pistas progresivas, solución explicada y errores habituales. HTML/CSS dispone de editor doble y vista previa aislada; JavaScript y TypeScript usan un iframe aislado y TypeScript se comprueba con el compilador en el navegador. React se transpila con Babel y se monta con React 18; Vue.js usa Vue 3; Web Components utiliza APIs nativas del navegador. Node.js tiene un simulador educativo en memoria para `process`, `path`, `events` y `fs/promises`. Astro y Docker/Compose se validan estáticamente (no se ejecuta un proyecto Astro ni un Docker Engine). PostgreSQL se ejecuta en el navegador mediante PGlite/WebAssembly y una base temporal por ejercicio. MongoDB, APIs y Testing disponen de simuladores didácticos aislados: colecciones en memoria, `fetch` con respuestas locales y un runner de pruebas reducido, respectivamente; no conectan a servidores externos ni sustituyen una instancia real de MongoDB, Vitest o servicios HTTP. El progreso se guarda en el navegador mediante `localStorage`.

## Páginas individuales de retos

Cada uno de los 52 retos tiene su propio archivo HTML en `pages/retos/`. Las páginas reutilizan el motor de ejecución y el progreso local, pero tienen URL, encabezado y presentación independientes. El catálogo de `pages/challenges.html` enlaza con cada página. Los estilos compartidos están en `css/challenges.css` y `css/challenge-detail.css`.

## Parte 3 · Bloque A: Laboratorio de juegos educativos

El laboratorio incorpora seis juegos ejecutables directamente en el navegador: Snake, Pong, Tetris, un laberinto inspirado en Pac-Man, memoria de parejas y un rompecabezas numérico deslizante. Cada juego explica sus objetivos, reglas, controles y conceptos de programación relacionados.

Las experiencias utilizan JavaScript y Canvas 2D o elementos HTML nativos, sin dependencias externas ni servidor. Se adaptan a controles de teclado y, cuando corresponde, a botones táctiles. El avance y las mejores marcas se guardan localmente en el navegador. La página y sus archivos principales se incluyen en la precarga de la PWA.

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
│   ├── tools.json
│   └── challenges.json
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
