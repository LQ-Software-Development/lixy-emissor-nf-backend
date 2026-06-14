# lixy-emissor-nf-backend

Backend API for Emissor NF MEI — NestJS 11, TypeORM 1, PostgreSQL.

## Stack

- NestJS 11 (TypeScript strict mode)
- TypeORM 1.x + PostgreSQL 16
- Swagger at `/docs`
- Husky git hooks + `ci:local` (lint, typecheck, test, build, e2e)

## Módulos

| Módulo | Rota | Descrição |
| --- | --- | --- |
| `auth` | `POST /api/auth/register`, `login`, `refresh` | Registro MEI por CNPJ, login JWT e refresh token |
| `clients` | `GET /api/clients` | Cadastro de clientes (PF/PJ) |
| `fiscal` | `GET /api/fiscal/*` | Dashboard, notas fiscais e obrigações DAS/DASN |
| `notifications` | `GET /api/notifications` | Notificações in-app, push e lembretes DAS |

Rotas de domínio exigem JWT Bearer (`Authorization`) após login/registro.
Auth standalone MEI (não integrado ao `non-saas-auth-service` da plataforma Lixy).

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
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run ci:local` | Full local CI (lint → typecheck → test → build → e2e) |
| `npm run migration:generate` | Generate migration |
| `npm run migration:run` | Run migrations |

## Git hooks (Husky)

| Hook | Command |
| --- | --- |
| `pre-commit` | `lint` → `typecheck` → `test` (unitários) |
| `pre-push` | `npm run ci:local` (build + e2e) |

Para rodar a validação completa manualmente: `npm run ci:local`.

## Environment

See `.env.example`:

- `DATABASE_URL` — PostgreSQL connection string (required)
- `API_PORT` — HTTP port (default `3009`)
- `TYPEORM_SYNCHRONIZE` — `true` for local dev schema sync; use `false` in production
- `TYPEORM_MIGRATIONS_RUN` — run pending migrations on boot (recommended in production)
- `JWT_SECRET` — access token signing (required for auth)
- `JWT_REFRESH_SECRET` — optional; defaults to `{JWT_SECRET}-refresh`

## Docker

```bash
docker compose up --build
```

API: `http://localhost:3009` — Postgres exposed on host port `5433`.

## Health

- `GET /` — service metadata
- `GET /health` — database connectivity check
