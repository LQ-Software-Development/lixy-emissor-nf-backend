import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToNfeInvoices1749760000000 implements MigrationInterface {
  name = 'AddDescriptionToNfeInvoices1749760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "nfe_invoices" ADD "description" character varying(500)`,
    );
    await queryRunner.query(
      `UPDATE "nfe_invoices" SET "description" = '' WHERE "description" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "nfe_invoices" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_nfe_invoices_number" ON "nfe_invoices" ("number")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_nfe_invoices_number"`);
    await queryRunner.query(
      `ALTER TABLE "nfe_invoices" DROP COLUMN "description"`,
    );
  }
}
