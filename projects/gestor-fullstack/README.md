# Gestor de proyectos full-stack

Aplicación con Next.js App Router, TypeScript, Prisma ORM 7 y PostgreSQL.

## Requisitos
- Node.js 22.18 o superior en la línea 22, o Node.js 24.11 o superior.
- PostgreSQL local o administrado.

## Instalación
1. Copiá `.env.example` como `.env` y configurá `DATABASE_URL`.
2. Ejecutá `npm install`.
3. Generá Prisma Client: `npx prisma generate`.
4. Creá las tablas: `npx prisma migrate dev --name init`.
5. Iniciá Next.js con `npm run dev`.

## Arquitectura
- App Router organiza las rutas.
- El Server Component lee los registros desde Prisma en el servidor.
- El Route Handler expone GET y POST.
- Prisma Client 7 usa el adaptador PostgreSQL `@prisma/adapter-pg`.
- `prisma7.config.ts` configura el esquema, migraciones y URL.

## Seguridad y ampliaciones
El ejemplo no incluye autenticación ni permisos por proyecto. Antes de usar datos reales, agregá autorización, validación de límites, pruebas y revisión de la configuración de producción.
