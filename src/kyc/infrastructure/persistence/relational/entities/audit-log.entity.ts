import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

export enum AuditAction {
  // KYC Actions
  KYC_SUBMITTED = 'kyc_submitted',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  KYC_RESUBMITTED = 'kyc_resubmitted',
  KYC_REVIEWED = 'kyc_reviewed',
  DOCUMENT_REQUESTED = 'document_requested',
  
  // User Actions
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  
  // Email Actions
  EMAIL_VERIFIED = 'email_verified',
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',
  
  // Password Actions
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  PASSWORD_CHANGED = 'password_changed',
  
  // 2FA Actions
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  
  // Admin Actions
  ADMIN_ACTION = 'admin_action',
}

@Entity({ name: 'audit_logs' })
export class AuditLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_audit_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Index('idx_audit_performed_by')
  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performed_by' })
  performer: UserEntity;
}

