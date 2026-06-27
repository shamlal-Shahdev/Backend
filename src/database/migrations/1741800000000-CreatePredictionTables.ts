import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePredictionTables1741800000000 implements MigrationInterface {
  name = 'CreatePredictionTables1741800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE prediction (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        installation_id INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        predicted_kwh DECIMAL(15, 4) NOT NULL,
        status ENUM('locked', 'evaluated') NOT NULL DEFAULT 'locked',
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_prediction_user_id (user_id),
        INDEX idx_prediction_installation_id (installation_id),
        INDEX idx_prediction_period (year, month),
        UNIQUE KEY uk_user_month_year (user_id, month, year),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (installation_id) REFERENCES installation(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE prediction_result (
        id INT PRIMARY KEY AUTO_INCREMENT,
        prediction_id INT NOT NULL,
        actual_kwh DECIMAL(15, 4) NOT NULL,
        accuracy_percent DECIMAL(5, 2) NULL,
        reward_tokens DECIMAL(18, 8) NOT NULL DEFAULT 0,
        bonus_awarded BOOLEAN NOT NULL DEFAULT FALSE,
        reward_transaction_id INT NULL,
        evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_prediction_result_prediction_id (prediction_id),
        INDEX idx_prediction_result_reward_tx (reward_transaction_id),
        FOREIGN KEY (prediction_id) REFERENCES prediction(id) ON DELETE CASCADE,
        FOREIGN KEY (reward_transaction_id) REFERENCES reward_transaction(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS prediction_result');
    await queryRunner.query('DROP TABLE IF EXISTS prediction');
  }
}
