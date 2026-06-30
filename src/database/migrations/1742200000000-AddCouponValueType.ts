import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponValueType1742200000000 implements MigrationInterface {
  name = 'AddCouponValueType1742200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE coupon
      ADD COLUMN value_type ENUM('amount', 'percentage') NOT NULL DEFAULT 'amount'
      AFTER coupon_value
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE coupon DROP COLUMN value_type
    `);
  }
}
