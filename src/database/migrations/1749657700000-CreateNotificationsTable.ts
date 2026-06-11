import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1749657700000 implements MigrationInterface {
  name = 'CreateNotificationsTable1749657700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM ('push', 'email', 'sms')
    `);

    // Create notification status enum
    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM ('unread', 'read')
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "type" "notification_type_enum" NOT NULL DEFAULT 'push',
        "status" "notification_status_enum" NOT NULL DEFAULT 'unread',
        "metadata" jsonb,
        "category" varchar(50),
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        "deleted_at" timestamptz
      )
    `);

    // Create indexes for notifications
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_status" ON "notifications" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_category" ON "notifications" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_created_at" ON "notifications" ("created_at")
    `);

    // Create push platform enum
    await queryRunner.query(`
      CREATE TYPE "push_platform_enum" AS ENUM ('ios', 'android', 'web')
    `);

    // Create push_tokens table
    await queryRunner.query(`
      CREATE TABLE "push_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token" varchar(500) NOT NULL,
        "platform" "push_platform_enum" NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for push_tokens
    await queryRunner.query(`
      CREATE INDEX "idx_push_tokens_user_id" ON "push_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_push_tokens_token" ON "push_tokens" ("token")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_push_tokens_user_token" ON "push_tokens" ("user_id", "token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "push_tokens"`);
    await queryRunner.query(`DROP TYPE "push_platform_enum"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
  }
}
