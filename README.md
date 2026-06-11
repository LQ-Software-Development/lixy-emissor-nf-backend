# lixy-emissor-nf-backend

Backend API for Emissor NF MEI — NestJS 10, TypeORM, PostgreSQL.

## Stack

- NestJS 10
- TypeORM 0.3
- PostgreSQL 16
- Swagger at `/docs`

## Quick start

```bash
cp .env.example .env
npm install
npm run start:dev
```

Default port: **3009** (`API_PORT`).

Create the database locally (with Docker infra from the Lixy meta-repo):

```bash
docker exec postgres psql -U user -d app -c "CREATE DATABASE emissor_nf_db;"
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run migration:generate` | Generate migration |
| `npm run migration:run` | Run migrations |

## Environment

See `.env.example`:

- `DATABASE_URL` — PostgreSQL connection string (required)
- `API_PORT` — HTTP port (default `3009`)
- `TYPEORM_SYNCHRONIZE` — `true` for local dev schema sync (default `false` in production)
- `TYPEORM_MIGRATIONS_RUN` — run pending migrations on boot
- `JWT_SECRET` — reserved for upcoming auth integration

## Docker

```bash
docker compose up --build
```

API: `http://localhost:3009` — Postgres exposed on host port `5433`.

## Health

- `GET /` — service metadata
- `GET /health` — database connectivity check

## Auth (`/api/auth`)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register MEI user (unique CNPJ, bcrypt password) |
| `POST` | `/api/auth/login` | Login with CNPJ + password |
| `POST` | `/api/auth/refresh` | Renew access token (15 min) using refresh token (7 days) |

Rate limit: **100 requests/minute** per IP (global throttler).

JWT:

- `JWT_SECRET` — access token signing key
- `JWT_REFRESH_SECRET` — refresh token signing key (optional; defaults to `JWT_SECRET-refresh`)

Swagger docs: `http://localhost:3009/docs`
