import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNfeInvoicesTable1749750000000 implements MigrationInterface {
  name = 'CreateNfeInvoicesTable1749750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "nfe_invoice_status_enum" AS ENUM ('draft', 'issued', 'cancelled')`,
    );

    await queryRunner.query(`
      CREATE TABLE "nfe_invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "number" character varying(9) NOT NULL,
        "series" character varying(3) NOT NULL DEFAULT '1',
        "clientId" uuid,
        "amount" numeric(12,2) NOT NULL,
        "status" "nfe_invoice_status_enum" NOT NULL DEFAULT 'draft',
        "accessKey" character varying(44),
        "issuedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nfe_invoices_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_nfe_invoices_status" ON "nfe_invoices" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_nfe_invoices_clientId" ON "nfe_invoices" ("clientId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_nfe_invoices_clientId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_nfe_invoices_status"`);
    await queryRunner.query(`DROP TABLE "nfe_invoices"`);
    await queryRunner.query(`DROP TYPE "nfe_invoice_status_enum"`);
  }
}
