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

## Centro de módulos

La página [Centro de módulos](pages/modules.html) muestra el núcleo, las 20 bibliotecas (HTML, CSS, JavaScript y 17 bibliotecas tecnológicas), laboratorios y recursos multimedia. Permite buscar y filtrar módulos, marcar prioridades, consultar el almacenamiento y administrar cada paquete tecnológico. Los laboratorios y multimedia quedan reservados para las etapas 3 y 4.

El administrador usa IndexedDB `webdev-book-modules` para las preferencias y las instalaciones. Esta base no se mezcla con el actualizador de contenido `webdev-book-content`. La cuota estimada del navegador es orientativa y corresponde al origen completo, no a una medición exclusiva de WebDev Book.
## Bibliotecas descargables por tecnología

Las 17 bibliotecas tecnológicas se distribuyen como paquetes JSON independientes en `modules/libraries/packages/<id>.json`. El manifiesto `modules/libraries/manifest.json` registra para cada paquete su ruta, versión, tamaño UTF-8, cantidad de artículos y hash SHA-256. `modules/libraries/ecosystem.json` conserva metadatos resumidos para relaciones entre tecnologías y proyectos integradores; `modules/libraries/search-index.json` mantiene el buscador global sin cargar todas las bibliotecas completas.

El Centro de módulos permite descargar, actualizar, abrir y quitar la copia local de cada biblioteca. Al abrir una tecnología aún no instalada, se descarga únicamente ese paquete. Antes de instalarlo se comprueban el tamaño esperado, SHA-256, JSON, ID de tecnología, cantidad de artículos y referencias de categorías. La escritura del contenido y del registro de instalación se realiza en una única transacción IndexedDB. Si falla la red, la integridad o el almacenamiento, la versión instalada anterior permanece intacta.

Los paquetes se guardan en `webdev-book-modules`, separados de los favoritos, el progreso y los proyectos. Quitar una biblioteca elimina solo sus archivos de paquete y su registro de instalación; no borra el avance, los artículos favoritos, los archivos del editor ni los proyectos. El buscador usa un índice compacto que conserva términos extraídos de todos los campos de los artículos, incluidos ejemplos, sintaxis y profundizaciones.

Para reducir el tamaño inicial, `data/tools.json` se mantiene como fuente canónica de compilación, pero no se copia a `www/` para Android ni se incluye en el manifiesto de actualizaciones OTA. Los 17 paquetes completos tampoco se incorporan a la APK: se descargan bajo demanda desde GitHub. La aplicación incluye solamente el manifiesto, el índice global y los metadatos compactos. En GitHub Pages los paquetes se descargan desde el mismo sitio; en Android se obtienen desde el contenido publicado en GitHub.

La generación reproducible se realiza con `npm run generate:libraries`; las comprobaciones de hashes, rutas y referencias se ejecutan con `npm run validate:libraries`. Los tamaños del manifiesto son bytes UTF-8 sin compresión de transporte.
Cuando `data/tools.json` cambia en `main`, GitHub Actions regenera y valida los 17 paquetes y publica los archivos generados en un commit separado. El actualizador de contenidos JSON mantiene su manifiesto independiente y omite el antiguo catálogo monolítico.

## Biblioteca de proyectos

La biblioteca reúne **15 proyectos completos y progresivos**: cinco principiantes, cinco intermedios y cinco avanzados. Incluye tarjetas interactivas, formularios validados, calculadora, reloj y temporizador, lista de tareas, buscador de películas, catálogo de productos, clima, panel administrativo, directorio de usuarios de demostración, autenticación segura, tienda online, blog con PostgreSQL, API REST propia y gestor full-stack.

Cada proyecto tiene una carpeta propia en `projects/<id>/`, con archivos fuente reales, README, objetivos, tecnologías, pasos, criterios de comprobación y ampliaciones. La interfaz permite consultar, copiar y descargar archivos, usar vistas previas aisladas para proyectos de frontend y guardar el progreso local. Los ejemplos de backend requieren Node.js y/o base de datos: GitHub Pages solo los documenta, no los ejecuta.

## Retos interactivos

La sección de retos incluye un catálogo filtrable por tecnología y dificultad (principiante, intermedio, avanzado y experto), además de una página HTML independiente para cada ejercicio. Cada reto puede incluir el enunciado, objetivos, requisitos, editor, pruebas, pistas progresivas, solución explicada, errores habituales y seguimiento local del progreso.

La sección incorpora 52 retos: cuatro por tecnología para TypeScript, JavaScript, HTML/CSS, React, Web Components, Vue.js, Node.js, Astro, SQL/PostgreSQL, MongoDB, APIs y comunicación web, Testing, y Docker/despliegue. Cada tecnología tiene un reto en cada nivel de dificultad (principiante, intermedio, avanzado y experto). Los ejercicios incluyen enunciado, objetivos, requisitos, editor, pruebas, pistas progresivas, solución explicada y errores habituales. HTML/CSS dispone de editor doble y vista previa aislada; JavaScript y TypeScript usan un iframe aislado y TypeScript se comprueba con el compilador en el navegador. React se transpila con Babel y se monta con React 18; Vue.js usa Vue 3; Web Components utiliza APIs nativas del navegador. Node.js tiene un simulador educativo en memoria para `process`, `path`, `events` y `fs/promises`. Astro y Docker/Compose se validan estáticamente (no se ejecuta un proyecto Astro ni un Docker Engine). PostgreSQL se ejecuta en el navegador mediante PGlite/WebAssembly y una base temporal por ejercicio. MongoDB, APIs y Testing disponen de simuladores didácticos aislados: colecciones en memoria, `fetch` con respuestas locales y un runner de pruebas reducido, respectivamente; no conectan a servidores externos ni sustituyen una instancia real de MongoDB, Vitest o servicios HTTP. El progreso se guarda en el navegador mediante `localStorage`.

## Páginas individuales de retos

Cada uno de los 52 retos tiene su propio archivo HTML en `pages/retos/`. Las páginas reutilizan el motor de ejecución y el progreso local, pero tienen URL, encabezado y presentación independientes. El catálogo de `pages/challenges.html` enlaza con cada página. Los estilos compartidos están en `css/challenges.css` y `css/challenge-detail.css`.

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
