import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddInstallationLatLng1741200000000 implements MigrationInterface {
  name = 'AddInstallationLatLng1741200000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE installation
      ADD COLUMN latitude DECIMAL(10,7) NULL,
      ADD COLUMN longitude DECIMAL(10,7) NULL
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE installation DROP COLUMN longitude`);
    await queryRunner.query(`ALTER TABLE installation DROP COLUMN latitude`);
  }
}
