# lixy-emissor-nf-backend

Backend API for **Emissor NF MEI** — NestJS 11 + TypeORM 1 + PostgreSQL 16.

## Stack

- NestJS 11 (TypeScript strict mode)
- TypeORM 1.x + PostgreSQL 16
- JWT auth (register / login / refresh)
- Swagger (`/docs`)
- Health check (`/health`)
- GitHub Actions CI (lint, typecheck, test, build)

## Módulos

| Módulo | Rota | Descrição |
| --- | --- | --- |
| `auth` | `POST /api/auth/register`, `login`, `refresh` | Autenticação JWT |
| `nfe` | `GET /api/nfe/invoices` | Emissão de notas fiscais |
| `fiscal` | `GET /api/fiscal/obligations` | Obrigações fiscais (DAS/DASN) |
| `clients` | `GET /api/clients` | Cadastro de clientes |
| `notifications` | `GET /api/notifications` | Notificações in-app |

Rotas de domínio (exceto auth/health) exigem header `X-Company-ID` (tenant). Notificações usam `X-User-ID`.

## Setup local

```bash
npm install
cp .env.example .env
```

Crie o banco no Postgres local:

```bash
docker exec postgres psql -U user -d app -c "CREATE DATABASE emissor_nf_db;"
```

Ou use o compose do projeto:

```bash
docker compose up -d postgres
```

## Desenvolvimento

```bash
npm run start:dev
```

- API: `http://localhost:3009/api`
- Swagger: `http://localhost:3009/docs`
- Health: `http://localhost:3009/health`

`TYPEORM_SYNCHRONIZE=true` no `.env` habilita auto-sync de schema em dev.

## Migrations

```bash
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```

## Testes e qualidade

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Entidades principais

- **User** — CNPJ, email, senha, campos Stripe (`stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at`, `subscription_status`)
- **Client** — PF/PJ com endereço e documento validado
- **Invoice** — NF-e por organização (status, chave de acesso, valores)
- **FiscalObligation** — DAS/DASN por período
- **Notification** — alertas por usuário (trial, fiscal, sistema)
