import { MigrationInterface, QueryRunner } from 'typeorm';

export class VendorUsageImportAndMeterId1741400000000
  implements MigrationInterface
{
  name = 'VendorUsageImportAndMeterId1741400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "installation"
      ADD COLUMN IF NOT EXISTS "meter_id" character varying(255) NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_installation_meter_id"
      ON "installation" ("meter_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_installation_vendor_meter"
      ON "installation" ("vendor_id", "meter_id")
      WHERE "vendor_id" IS NOT NULL AND "meter_id" IS NOT NULL
    `);

    await queryRunner.query(`
      DO $enum$
      DECLARE
        typname text;
      BEGIN
        SELECT t.typname INTO typname
        FROM pg_type t
        INNER JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE e.enumlabel = 'daily_reward'
          AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        LIMIT 1;
        IF typname IS NULL THEN
          typname := 'reward_transaction_reason_enum';
        END IF;
        BEGIN
          EXECUTE format('ALTER TYPE %I ADD VALUE %L', typname, 'vendor_monthly_usage');
        EXCEPTION
          WHEN OTHERS THEN NULL;
        END;
      END
      $enum$;
    `);

    await queryRunner.query(`
      CREATE TYPE "vendor_usage_import_batch_status_enum" AS ENUM (
        'pending', 'processing', 'completed', 'failed'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "vendor_usage_import_row_status_enum" AS ENUM (
        'pending', 'accepted', 'rejected'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "vendor_usage_import_batch" (
        "id" SERIAL NOT NULL,
        "vendor_user_id" integer NOT NULL,
        "period_year_month" character varying(7) NOT NULL,
        "original_filename" character varying(512) NOT NULL,
        "file_id" uuid NULL,
        "file_hash" character varying(64) NULL,
        "status" "vendor_usage_import_batch_status_enum" NOT NULL DEFAULT 'pending',
        "summary_json" json NULL,
        "error_message" text NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendor_usage_import_batch" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vendor_usage_import_batch_vendor_user"
          FOREIGN KEY ("vendor_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_vendor_usage_import_batch_file"
          FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_vendor_usage_batch_vendor_period"
      ON "vendor_usage_import_batch" ("vendor_user_id", "period_year_month")
    `);

    await queryRunner.query(`
      CREATE TABLE "vendor_usage_import_row" (
        "id" SERIAL NOT NULL,
        "batch_id" integer NOT NULL,
        "row_number" integer NOT NULL,
        "meter_id" character varying(255) NOT NULL,
        "total_kwh" numeric(15,4) NOT NULL,
        "status" "vendor_usage_import_row_status_enum" NOT NULL DEFAULT 'pending',
        "reason_code" character varying(64) NULL,
        "installation_id" integer NULL,
        "reward_transaction_id" integer NULL,
        CONSTRAINT "PK_vendor_usage_import_row" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vendor_usage_import_row_batch"
          FOREIGN KEY ("batch_id") REFERENCES "vendor_usage_import_batch"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_vendor_usage_import_row_installation"
          FOREIGN KEY ("installation_id") REFERENCES "installation"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_vendor_usage_import_row_reward_tx"
          FOREIGN KEY ("reward_transaction_id") REFERENCES "reward_transaction"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_vendor_usage_import_row_batch_meter"
      ON "vendor_usage_import_row" ("batch_id", "meter_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "reward_transaction"
      ADD COLUMN IF NOT EXISTS "vendor_usage_batch_id" integer NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "reward_transaction"
      ADD COLUMN IF NOT EXISTS "usage_period_year_month" character varying(7) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "reward_transaction"
      ADD CONSTRAINT "FK_reward_transaction_vendor_usage_batch"
      FOREIGN KEY ("vendor_usage_batch_id") REFERENCES "vendor_usage_import_batch"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_reward_tx_install_period_vendor_usage"
      ON "reward_transaction" ("installation_id", "usage_period_year_month")
      WHERE ("reason"::text) = 'vendor_monthly_usage' AND "usage_period_year_month" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_reward_tx_install_period_vendor_usage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_transaction" DROP CONSTRAINT IF EXISTS "FK_reward_transaction_vendor_usage_batch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_transaction" DROP COLUMN IF EXISTS "usage_period_year_month"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_transaction" DROP COLUMN IF EXISTS "vendor_usage_batch_id"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_usage_import_row"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_usage_import_batch"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "vendor_usage_import_row_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "vendor_usage_import_batch_status_enum"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_installation_vendor_meter"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_installation_meter_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "installation" DROP COLUMN IF EXISTS "meter_id"`,
    );
  }
}
