import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponPurchaseBlockchainFields1742100000000
  implements MigrationInterface
{
  name = 'AddCouponPurchaseBlockchainFields1742100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE coupon_purchase
        ADD COLUMN tx_hash VARCHAR(255) NULL AFTER tokens_used,
        ADD COLUMN block_number INT NULL AFTER tx_hash
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE coupon_purchase
        DROP COLUMN block_number,
        DROP COLUMN tx_hash
    `);
  }
}
