import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplaceTables1742000000000
  implements MigrationInterface
{
  name = 'CreateMarketplaceTables1742000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE coupon (
        id INT PRIMARY KEY AUTO_INCREMENT,
        vendor_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        coupon_value DECIMAL(18, 2) NOT NULL,
        token_cost DECIMAL(18, 8) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        expiry_date DATE NOT NULL,
        terms_and_conditions TEXT NOT NULL,
        image_url VARCHAR(500) NULL,
        status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_coupon_vendor_id (vendor_id),
        INDEX idx_coupon_status (status),
        INDEX idx_coupon_expiry (expiry_date),
        FOREIGN KEY (vendor_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE coupon_purchase (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        coupon_id INT NOT NULL,
        vendor_id INT NOT NULL,
        coupon_code VARCHAR(32) NOT NULL,
        tokens_used DECIMAL(18, 8) NOT NULL,
        status ENUM('active', 'used', 'expired') NOT NULL DEFAULT 'active',
        purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP NULL,
        INDEX idx_coupon_purchase_user_id (user_id),
        INDEX idx_coupon_purchase_coupon_id (coupon_id),
        INDEX idx_coupon_purchase_vendor_id (vendor_id),
        UNIQUE KEY uk_coupon_code (coupon_code),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (coupon_id) REFERENCES coupon(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE withdrawal_request (
        id INT PRIMARY KEY AUTO_INCREMENT,
        vendor_id INT NOT NULL,
        amount DECIMAL(18, 8) NOT NULL,
        bank_details TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        INDEX idx_withdrawal_vendor_id (vendor_id),
        INDEX idx_withdrawal_status (status),
        FOREIGN KEY (vendor_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS withdrawal_request');
    await queryRunner.query('DROP TABLE IF EXISTS coupon_purchase');
    await queryRunner.query('DROP TABLE IF EXISTS coupon');
  }
}
