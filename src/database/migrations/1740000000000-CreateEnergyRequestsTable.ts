import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateEnergyRequestsTable1740000000000 implements MigrationInterface {
  name = 'CreateEnergyRequestsTable1740000000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE energy_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        meter_image_url VARCHAR(500) NOT NULL,
        meter_id_from_image VARCHAR(255) NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED', 'REWARD_GENERATED', 'BLOCKCHAIN_FAILED') NOT NULL DEFAULT 'PENDING',
        admin_remark TEXT NULL,
        approved_by_admin_id INT NULL,
        reward_amount DECIMAL(18, 8) NULL,
        blockchain_tx_hash VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        UNIQUE KEY uk_user_month_year (user_id, month, year),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by_admin_id) REFERENCES user(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS energy_requests');
  }
}
