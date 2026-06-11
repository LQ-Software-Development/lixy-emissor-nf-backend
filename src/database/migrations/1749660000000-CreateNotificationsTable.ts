import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1749660000000 implements MigrationInterface {
  name = 'CreateNotificationsTable1749660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "notification_type_enum" AS ENUM ('das_reminder', 'system', 'fiscal', 'push')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_status_enum" AS ENUM ('unread', 'read')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_category_enum" AS ENUM ('das', 'system', 'fiscal')`,
    );

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "body" text NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "status" "notification_status_enum" NOT NULL DEFAULT 'unread',
        "metadata" jsonb,
        "category" "notification_category_enum" NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_userId_status" ON "notifications" ("userId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_userId_category" ON "notifications" ("userId", "category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_deletedAt" ON "notifications" ("deletedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_deletedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_userId_category"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_userId_status"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_category_enum"`);
    await queryRunner.query(`DROP TYPE "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
  }
}
