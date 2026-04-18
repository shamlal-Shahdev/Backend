import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddInstallationRooftopAvailable1741300000000
  implements MigrationInterface
{
  name = 'AddInstallationRooftopAvailable1741300000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE installation
      ADD COLUMN rooftop_available BOOLEAN NULL
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE installation DROP COLUMN rooftop_available`,
    );
  }
}
