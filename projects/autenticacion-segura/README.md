# Autenticación segura con Express y PostgreSQL

Backend educativo con registro, login, sesión y logout.

## Requisitos e instalación
- Node.js LTS y PostgreSQL.
- Copiar `.env.example` como `.env` y completar secretos.
- `npm install`.
- Ejecutar `sql/schema.sql`.
- `npm run dev`.

## Rutas
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

## Seguridad
Hash bcrypt, SQL parametrizado, cookie HttpOnly/SameSite, secreto de sesión por entorno y rate limit. Antes de producción agregá CSRF para tu arquitectura, HTTPS, verificación de correo, revisión de dependencias y configuración CORS estricta. El ejemplo no está auditado para producción.
