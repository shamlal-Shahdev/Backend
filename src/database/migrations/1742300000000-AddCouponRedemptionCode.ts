import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponRedemptionCode1742300000000 implements MigrationInterface {
  name = 'AddCouponRedemptionCode1742300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE coupon
      ADD COLUMN redemption_code VARCHAR(64) NOT NULL DEFAULT ''
      AFTER terms_and_conditions
    `);

    await queryRunner.query(`
      ALTER TABLE coupon_purchase DROP INDEX uk_coupon_code
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE coupon DROP COLUMN redemption_code
    `);

    await queryRunner.query(`
      ALTER TABLE coupon_purchase
      ADD UNIQUE KEY uk_coupon_code (coupon_code)
    `);
  }
}
