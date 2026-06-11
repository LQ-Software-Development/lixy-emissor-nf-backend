import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1749744001000 implements MigrationInterface {
  name = 'CreateUsersTable1749744001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "cnpj" character varying(14) NOT NULL,
        "email" character varying NOT NULL,
        "razao_social" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "refresh_token_hash" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_cnpj" UNIQUE ("cnpj"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_users_cnpj" ON "users" ("cnpj")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_cnpj"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
