import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLog1741600000000 implements MigrationInterface {
  name = 'CreateAuditLog1741600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" SERIAL NOT NULL,
        "actor_user_id" integer NULL,
        "action" character varying(100) NOT NULL,
        "entity_type" character varying(100) NOT NULL,
        "entity_id" character varying(64) NOT NULL,
        "metadata" json NULL,
        "ip" character varying(64) NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_log_actor_user"
          FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_log_created_at" ON "audit_log" ("created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_log_actor_user_id" ON "audit_log" ("actor_user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
  }
}
