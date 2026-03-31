# SFMS Backend (NestJS)

Sports Facility Management System backend API.

## Features

- Modules: `auth`, `users`, `access-control`, `facilities`, `memberships`, `bookings`, `payments`, `audit-logs`, `analytics`
- Postgres + TypeORM
- JWT auth (access + refresh): `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- Role + permission based access control (RBAC)
- Global validation + consistent error responses
- Security: Helmet, CORS allowlist, rate limiting (Throttler)
- Structured logging via `nestjs-pino` (redacts secrets)
- Swagger docs (optional)

## Setup

```bash
cd backend
cp .env.example .env
pnpm install
```

## Environment

Edit `backend/.env`:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGINS` (comma-separated)
- `SWAGGER_ENABLED=true` (optional)

## Run

```bash
# dev
pnpm run start:dev

# prod
pnpm run build
pnpm run start:prod
```

Default base URL:

- `http://localhost:3000/api/v1`

Health check:

- `GET /api/v1/health`

## Swagger

If enabled (`SWAGGER_ENABLED=true`), open:

- `http://localhost:3000/docs`

## Seed (roles/permissions + super admin)

Set:

- `SEED_ENABLED=true`
- `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD`, `SEED_SUPER_ADMIN_NAME`

Run:

```bash
pnpm run db:seed
```

## Notes

- In some sandboxed environments, Jest can fail with `spawn EPERM` (worker processes blocked). The project still builds via `pnpm run build`.
