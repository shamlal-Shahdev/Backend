import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserDomainCleanup1741500000000 implements MigrationInterface {
  name = 'UserDomainCleanup1741500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_wallet" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "address" character varying(255) NOT NULL,
        "encrypted_private_key" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_wallet" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_wallet_user_id" UNIQUE ("user_id"),
        CONSTRAINT "UQ_user_wallet_address" UNIQUE ("address"),
        CONSTRAINT "FK_user_wallet_user"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_wallet_user_id" ON "user_wallet" ("user_id")
    `);

    await queryRunner.query(`
      INSERT INTO "user_wallet" ("user_id", "address", "encrypted_private_key", "created_at", "updated_at")
      SELECT u."id", u."wallet_address", u."encrypted_private_key", now(), now()
      FROM "user" u
      WHERE u."wallet_address" IS NOT NULL
        AND TRIM(u."wallet_address") <> ''
      ON CONFLICT ("user_id") DO NOTHING
    `);

    await queryRunner.query(`
      CREATE TABLE "vendor_company_profile" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "company_name" character varying(255) NOT NULL,
        "city" character varying(255),
        "province" character varying(255),
        "country" character varying(255),
        "address_line" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendor_company_profile" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vendor_company_profile_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_vendor_company_profile_user"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "vendor_company_profile" (
        "user_id", "company_name", "created_at", "updated_at"
      )
      SELECT u."id", u."company_name", now(), now()
      FROM "user" u
      WHERE u."role"::text = 'vendor'
        AND u."company_name" IS NOT NULL
        AND TRIM(u."company_name") <> ''
      ON CONFLICT ("user_id") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc"
      ADD COLUMN IF NOT EXISTS "status" character varying(50) NOT NULL DEFAULT 'not_submitted'
    `);
    await queryRunner.query(`
      ALTER TABLE "kyc"
      ADD COLUMN IF NOT EXISTS "rejection_reason" text
    `);

    await queryRunner.query(`
      UPDATE "kyc" k
      SET "status" = COALESCE(NULLIF(TRIM(u."kyc_status"), ''), 'not_submitted')
      FROM "user" u
      WHERE k."user_id" = u."id"
    `);

    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "wallet_address"
    `);
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "encrypted_private_key"
    `);
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "company_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "kyc_status"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "kyc_status" character varying(255) NOT NULL DEFAULT 'not_submitted'
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "company_name" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "encrypted_private_key" text
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "wallet_address" character varying(255)
    `);

    await queryRunner.query(`
      UPDATE "user" u
      SET "wallet_address" = w."address",
          "encrypted_private_key" = w."encrypted_private_key"
      FROM "user_wallet" w
      WHERE w."user_id" = u."id"
    `);

    await queryRunner.query(`
      UPDATE "user" u
      SET "company_name" = v."company_name"
      FROM "vendor_company_profile" v
      WHERE v."user_id" = u."id"
    `);

    await queryRunner.query(`
      UPDATE "user" u
      SET "kyc_status" = sub."status"
      FROM (
        SELECT DISTINCT ON ("user_id") "user_id", "status"
        FROM "kyc"
        ORDER BY "user_id", "submitted_at" DESC
      ) sub
      WHERE u."id" = sub."user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc" DROP COLUMN IF EXISTS "rejection_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "kyc" DROP COLUMN IF EXISTS "status"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_company_profile"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_wallet"`);
  }
}
