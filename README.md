# lixy-emissor-nf-backend

Backend API for Emissor NF MEI — NestJS 11, TypeORM 1, PostgreSQL.

## Stack

- NestJS 11
- TypeORM 1.x
- PostgreSQL 16
- Swagger at `/docs`

## Modules

| Module | Prefix | Description |
| --- | --- | --- |
| Health | `/api/health` | Service and database health checks |
| Auth | `/api/auth` | MEI registration, login, token refresh |
| Clients | `/api/clients` | Client CRUD (PF/PJ), CEP lookup |
| Fiscal | `/api/fiscal` | Dashboard, DAS/DASN obligations, payment |
| Notifications | `/api/notifications` | In-app alerts, push tokens, DAS reminders |

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

Run migrations (recommended for non-sync environments):

```bash
npm run migration:run
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run migration:generate` | Generate migration |
| `npm run migration:run` | Run migrations |

## Environment

See `.env.example`:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `API_PORT` | HTTP port (default `3009`) |
| `JWT_SECRET` | Access token signing secret (required for auth) |
| `JWT_REFRESH_SECRET` | Refresh token secret (defaults to `JWT_SECRET-refresh`) |
| `TYPEORM_SYNCHRONIZE` | `true` for local dev schema sync |
| `TYPEORM_MIGRATIONS_RUN` | Run pending migrations on boot |
| `TYPEORM_LOGGING` | Enable SQL logging |
| `FIREBASE_*` | FCM push notifications (optional) |
| `SMTP_*` | Email fallback when push fails (optional) |

## Docker

```bash
docker compose up --build
```

API: `http://localhost:3009` — Postgres exposed on host port `5433`.

## CI

GitHub Actions runs lint, typecheck, unit tests, build and e2e on every push/PR to `main`.

## Health

- `GET /api` — service metadata
- `GET /api/health` — database connectivity check

## Auth

- `POST /api/auth/register` — register MEI user (email, password, CNPJ, razão social)
- `POST /api/auth/login` — login with email/password
- `POST /api/auth/refresh` — refresh access token

Protected routes accept `Authorization: Bearer <accessToken>`.
