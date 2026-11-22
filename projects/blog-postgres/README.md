# Blog con PostgreSQL

API de publicaciones con GET, POST, PATCH y DELETE.

## Instalación
Ejecutá `sql/schema.sql`, copiá `.env.example` como `.env`, ejecutá `npm install` y `npm run dev`.

## Endpoints
GET /api/posts, GET /api/posts/:id, POST /api/posts, PATCH /api/posts/:id y DELETE /api/posts/:id.

El ejemplo no incluye autenticación/autorización. No expongas sus operaciones de escritura en producción sin agregar esos controles.
