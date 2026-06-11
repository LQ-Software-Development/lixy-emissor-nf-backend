import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendInvoicesForNfe1749750000000 implements MigrationInterface {
  name = 'ExtendInvoicesForNfe1749750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "invoice_status_enum" AS ENUM ('issued', 'cancelled')`,
    );

    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD COLUMN "userId" uuid,
      ADD COLUMN "clientId" uuid,
      ADD COLUMN "description" character varying(500),
      ADD COLUMN "status" "invoice_status_enum" NOT NULL DEFAULT 'issued',
      ADD COLUMN "cancelledAt" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_userId" ON "invoices" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_invoices_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invoices_userId"`);
    await queryRunner.query(`
      ALTER TABLE "invoices"
      DROP COLUMN "cancelledAt",
      DROP COLUMN "status",
      DROP COLUMN "description",
      DROP COLUMN "clientId",
      DROP COLUMN "userId"
    `);
    await queryRunner.query(`DROP TYPE "invoice_status_enum"`);
  }
}
