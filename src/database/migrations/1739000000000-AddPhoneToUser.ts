import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToUser1739000000000 implements MigrationInterface {
  name = 'AddPhoneToUser1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add phone column to user table
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove phone column from user table
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "phone"`,
    );
  }
}

