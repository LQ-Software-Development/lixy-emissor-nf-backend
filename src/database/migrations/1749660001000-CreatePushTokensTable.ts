import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushTokensTable1749660001000 implements MigrationInterface {
  name = 'CreatePushTokensTable1749660001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "push_platform_enum" AS ENUM ('android', 'ios', 'web')`,
    );

    await queryRunner.query(`
      CREATE TABLE "push_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "token" character varying(512) NOT NULL,
        "platform" "push_platform_enum" NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_tokens_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_push_tokens_userId" ON "push_tokens" ("userId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_push_tokens_userId_token" ON "push_tokens" ("userId", "token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_push_tokens_userId_token"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_push_tokens_userId"`);
    await queryRunner.query(`DROP TABLE "push_tokens"`);
    await queryRunner.query(`DROP TYPE "push_platform_enum"`);
  }
}
