import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientsTable1749662400000 implements MigrationInterface {
  name = 'CreateClientsTable1749662400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "document" character varying(14) NOT NULL,
        "document_type" character varying(4) NOT NULL,
        "email" character varying,
        "phone" character varying(20),
        "cep" character varying(8) NOT NULL,
        "street" character varying NOT NULL,
        "number" character varying,
        "complement" character varying,
        "neighborhood" character varying NOT NULL,
        "city" character varying NOT NULL,
        "state" character varying(2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_clients_org_document"
      ON "clients" ("organization_id", "document")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_clients_org_document"`);
    await queryRunner.query(`DROP TABLE "clients"`);
  }
}
