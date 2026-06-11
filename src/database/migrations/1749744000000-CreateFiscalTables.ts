import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiscalTables1749744000000 implements MigrationInterface {
  name = 'CreateFiscalTables1749744000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "obligation_type_enum" AS ENUM ('DAS', 'DASN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "obligation_status_enum" AS ENUM ('pending', 'paid', 'overdue')`,
    );

    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "number" character varying(50) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_issuedAt" ON "invoices" ("issuedAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE "fiscal_obligations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "companyId" character varying(255),
        "type" "obligation_type_enum" NOT NULL,
        "referencePeriod" character varying(7) NOT NULL,
        "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "status" "obligation_status_enum" NOT NULL DEFAULT 'pending',
        "paidAt" TIMESTAMP WITH TIME ZONE,
        "barcode" character varying(48),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fiscal_obligations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_fiscal_obligations_dueDate" ON "fiscal_obligations" ("dueDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fiscal_obligations_status" ON "fiscal_obligations" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fiscal_obligations_type_status" ON "fiscal_obligations" ("type", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fiscal_obligations_type_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fiscal_obligations_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fiscal_obligations_dueDate"`,
    );
    await queryRunner.query(`DROP TABLE "fiscal_obligations"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invoices_issuedAt"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "obligation_status_enum"`);
    await queryRunner.query(`DROP TYPE "obligation_type_enum"`);
  }
}
