import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddPropertySegmentOcrUtilityMeterRef1741100000000
  implements MigrationInterface
{
  name = 'AddPropertySegmentOcrUtilityMeterRef1741100000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE installation
      ADD COLUMN property_segment VARCHAR(50) NOT NULL DEFAULT 'residential_small'
    `);
    await queryRunner.query(`
      ALTER TABLE energy_requests
      ADD COLUMN ocr_raw_text TEXT NULL,
      ADD COLUMN ocr_avg_confidence DECIMAL(5,2) NULL,
      ADD COLUMN ocr_meter_id_candidate VARCHAR(255) NULL,
      ADD COLUMN kyc_meter_crosscheck VARCHAR(30) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE kyc
      ADD COLUMN utility_meter_reference VARCHAR(255) NULL
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE kyc DROP COLUMN utility_meter_reference`,
    );
    await queryRunner.query(
      `ALTER TABLE energy_requests DROP COLUMN kyc_meter_crosscheck`,
    );
    await queryRunner.query(
      `ALTER TABLE energy_requests DROP COLUMN ocr_meter_id_candidate`,
    );
    await queryRunner.query(
      `ALTER TABLE energy_requests DROP COLUMN ocr_avg_confidence`,
    );
    await queryRunner.query(
      `ALTER TABLE energy_requests DROP COLUMN ocr_raw_text`,
    );
    await queryRunner.query(
      `ALTER TABLE installation DROP COLUMN property_segment`,
    );
  }
}
