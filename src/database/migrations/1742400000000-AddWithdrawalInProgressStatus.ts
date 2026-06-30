import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWithdrawalInProgressStatus1742400000000
  implements MigrationInterface
{
  name = 'AddWithdrawalInProgressStatus1742400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE withdrawal_request
      MODIFY COLUMN status ENUM('pending', 'in_progress', 'approved', 'rejected')
      NOT NULL DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE withdrawal_request SET status = 'pending' WHERE status = 'in_progress'
    `);
    await queryRunner.query(`
      ALTER TABLE withdrawal_request
      MODIFY COLUMN status ENUM('pending', 'approved', 'rejected')
      NOT NULL DEFAULT 'pending'
    `);
  }
}
