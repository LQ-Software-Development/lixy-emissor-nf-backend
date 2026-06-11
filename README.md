# lixy-emissor-nf-backend

Backend API for Emissor NF MEI — NestJS + TypeORM + PostgreSQL.

## Setup

```bash
cp .env.example .env
npm install
```

Create database:

```bash
docker exec postgres psql -U user -d app -c "CREATE DATABASE emissor_nf_db;"
```

## Development

```bash
npm run start:dev   # http://localhost:3009
```

Swagger: `http://localhost:3009/docs`

## Fiscal module

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/fiscal/dashboard` | Faturamento mensal, limite MEI, próximo DAS, total NFs |
| GET | `/api/fiscal/obligations` | Listar obrigações DAS/DASN |
| PATCH | `/api/fiscal/obligations/:id/pay` | Marcar obrigação como paga |

Cron diário (`06:00 America/Sao_Paulo`) atualiza obrigações vencidas para `overdue`.

## Tests

```bash
npm test
npm run test:cov
npm run test:e2e
```
