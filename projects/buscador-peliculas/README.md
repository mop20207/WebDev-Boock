# Buscador de películas

Catálogo de datos locales, búsqueda por título y filtro por género. Los datos son de demostración.

## Flujo
El arreglo funciona como fuente de datos. Los controles modifican criterios; `filter()` obtiene el subconjunto y el DOM representa las tarjetas. La siguiente etapa es mover el catálogo a un archivo JSON y cargarlo con `fetch()`.
