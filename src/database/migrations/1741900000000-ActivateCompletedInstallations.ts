import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActivateCompletedInstallations1741900000000
  implements MigrationInterface
{
  name = 'ActivateCompletedInstallations1741900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE installation
      SET is_active = 1
      WHERE status = 'completed' AND is_active = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE installation
      SET is_active = 0
      WHERE status = 'completed'
    `);
  }
}
