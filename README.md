# lixy-emissor-nf-backend

Backend API for **Emissor NF MEI** — NestJS 11 + TypeORM + PostgreSQL 16.

## Stack

- NestJS 11 (TypeScript strict mode)
- TypeORM 0.3 + PostgreSQL 16
- Swagger (`/docs`)
- Health check (`/health`)

## Módulos

| Módulo | Rota | Descrição |
| --- | --- | --- |
| `nfe` | `GET /nfe/invoices` | Emissão de notas fiscais |
| `fiscal` | `GET /fiscal/obligations` | Obrigações fiscais (DAS/DASN) |
| `clients` | `GET /clients` | Cadastro de clientes |

Todas as rotas de domínio exigem header `X-Company-ID` (tenant).

## Setup local

```bash
npm install
cp .env.example .env
```

Crie o banco no Postgres local:

```bash
docker exec postgres psql -U user -d app -c "CREATE DATABASE emissor_nf_db;"
```

## Desenvolvimento

```bash
npm run start:dev
```

- API: `http://localhost:3009`
- Swagger: `http://localhost:3009/docs`
- Health: `http://localhost:3009/health`

`TYPEORM_SYNCHRONIZE=true` no `.env` habilita auto-sync de schema em dev.

## Migrations

```bash
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```

## Testes

```bash
npm run test
npm run test:e2e
npm run build
```
