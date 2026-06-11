# lixy-emissor-nf-backend

Backend API for **Emissor NF MEI** — NestJS 10 + TypeORM + PostgreSQL.

## Stack

- NestJS 10
- TypeORM 0.3 + PostgreSQL
- Swagger (`/docs`)
- Health check (`/health`)

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
