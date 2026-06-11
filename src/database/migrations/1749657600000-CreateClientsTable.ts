import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientsTable1749657600000 implements MigrationInterface {
  name = 'CreateClientsTable1749657600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "client_type_enum" AS ENUM ('PF', 'PJ')`,
    );

    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "document" character varying(18) NOT NULL,
        "type" "client_type_enum" NOT NULL,
        "email" character varying(255),
        "phone" character varying(20),
        "zipCode" character varying(9) NOT NULL,
        "street" character varying(255) NOT NULL,
        "number" character varying(20) NOT NULL,
        "complement" character varying(255),
        "neighborhood" character varying(255) NOT NULL,
        "city" character varying(255) NOT NULL,
        "state" character varying(2) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_clients_document" UNIQUE ("document"),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_clients_document" ON "clients" ("document")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_name" ON "clients" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_deletedAt" ON "clients" ("deletedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_clients_deletedAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_clients_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_clients_document"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TYPE "client_type_enum"`);
  }
}
