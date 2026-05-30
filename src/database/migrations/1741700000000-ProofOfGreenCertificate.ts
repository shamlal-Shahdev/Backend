import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProofOfGreenCertificate1741700000000 implements MigrationInterface {
  name = 'ProofOfGreenCertificate1741700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "certificate_status_enum" AS ENUM ('active', 'revoked')
    `);
    await queryRunner.query(`
      CREATE TYPE "achievement_level_enum" AS ENUM ('bronze', 'silver', 'gold', 'platinum')
    `);
    await queryRunner.query(`
      CREATE TYPE "sustainability_badge_enum" AS ENUM (
        'green_starter',
        'solar_champion',
        'clean_energy_advocate',
        'carbon_reducer',
        'sustainability_leader'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "certificate" (
        "id" SERIAL NOT NULL,
        "certificate_id" character varying(64) NOT NULL,
        "user_id" integer NOT NULL,
        "installation_id" integer NOT NULL,
        "vendor_id" integer NULL,
        "wallet_address" character varying(255) NOT NULL,
        "month" integer NOT NULL,
        "year" integer NOT NULL,
        "total_kwh" numeric(15, 4) NOT NULL,
        "total_co2_offset" numeric(15, 4) NOT NULL,
        "reward_amount" numeric(18, 8) NOT NULL DEFAULT 0,
        "trees_equivalent" numeric(10, 2) NOT NULL DEFAULT 0,
        "achievement_level" "achievement_level_enum" NOT NULL,
        "badge" "sustainability_badge_enum" NOT NULL,
        "transaction_hash" character varying(255) NOT NULL,
        "qr_code_url" character varying(500) NULL,
        "file_path" character varying(500) NOT NULL,
        "status" "certificate_status_enum" NOT NULL DEFAULT 'active',
        "energy_request_id" integer NULL,
        "reward_transaction_id" integer NULL,
        "meter_id" character varying(255) NULL,
        "verified_at" TIMESTAMP NULL,
        "generated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_certificate" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_certificate_certificate_id" UNIQUE ("certificate_id"),
        CONSTRAINT "UQ_certificate_user_month_year" UNIQUE ("user_id", "month", "year"),
        CONSTRAINT "FK_certificate_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_certificate_installation" FOREIGN KEY ("installation_id") REFERENCES "installation"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_certificate_vendor" FOREIGN KEY ("vendor_id") REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_certificate_energy_request" FOREIGN KEY ("energy_request_id") REFERENCES "energy_requests"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_certificate_reward_transaction" FOREIGN KEY ("reward_transaction_id") REFERENCES "reward_transaction"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_certificate_user_id" ON "certificate" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_certificate_status" ON "certificate" ("status")
    `);

    await queryRunner.query(`
      ALTER TABLE "energy_requests"
      ADD COLUMN IF NOT EXISTS "energy_generated_kwh" numeric(15, 4) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "energy_requests" DROP COLUMN IF EXISTS "energy_generated_kwh"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "certificate"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sustainability_badge_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "achievement_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "certificate_status_enum"`);
  }
}
