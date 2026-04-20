import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';

@Entity({ name: 'audit_log' })
export class AuditLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'actor_user_id', type: 'int', nullable: true })
  actorUserId: number | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 64 })
  entityId: string;

  /** `json` is supported by MySQL and PostgreSQL; `jsonb` is PostgreSQL-only. */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
