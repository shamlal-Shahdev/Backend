import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycSystem1738500000000 implements MigrationInterface {
  name = 'AddKycSystem1738500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add role column to user table
    await queryRunner.query(`
      ALTER TABLE user 
      ADD COLUMN role VARCHAR(50) DEFAULT 'user'
    `);

    // Create KYC table
    await queryRunner.query(`
      CREATE TABLE kyc (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        city VARCHAR(100) NOT NULL,
        province VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        gender ENUM('male', 'female', 'other') NOT NULL,
        date_of_birth DATE NOT NULL,
        cnic_number VARCHAR(20) NOT NULL UNIQUE,
        phone VARCHAR(20),
        status ENUM('pending', 'in_review', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        reviewed_at TIMESTAMP NULL,
        reviewed_by VARCHAR(36),
        approved_at TIMESTAMP NULL,
        submission_count INT NOT NULL DEFAULT 1,
        blockchain_hash VARCHAR(66),
        blockchain_tx_hash VARCHAR(66),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_kyc_user_id (user_id),
        INDEX idx_cnic_number (cnic_number),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create documents table
    await queryRunner.query(`
      CREATE TABLE documents (
        id VARCHAR(36) PRIMARY KEY,
        kyc_id VARCHAR(36) NOT NULL,
        type ENUM('cnic_front', 'cnic_back', 'selfie', 'additional') NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        s3_bucket VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_document_kyc_id (kyc_id),
        FOREIGN KEY (kyc_id) REFERENCES kyc(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        performed_by VARCHAR(36),
        action VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_user_id (user_id),
        INDEX idx_audit_performed_by (performed_by),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL,
        FOREIGN KEY (performed_by) REFERENCES user(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS audit_logs');
    await queryRunner.query('DROP TABLE IF EXISTS documents');
    await queryRunner.query('DROP TABLE IF EXISTS kyc');
    await queryRunner.query('ALTER TABLE user DROP COLUMN role');
  }
}
