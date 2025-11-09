import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { DocumentEntity } from './document.entity';

export enum KycStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity({ name: 'kyc' })
export class KycEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_kyc_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Personal Information
  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  province: string;

  @Column({ length: 100 })
  country: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  // Identity Information
  @Index('idx_cnic_number')
  @Column({ name: 'cnic_number', unique: true, length: 20 })
  cnicNumber: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  // KYC Status
  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'submission_count', default: 1 })
  submissionCount: number;

  // Blockchain (optional)
  @Column({ name: 'blockchain_hash', nullable: true, length: 66 })
  blockchainHash: string;

  @Column({ name: 'blockchain_tx_hash', nullable: true, length: 66 })
  blockchainTxHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => DocumentEntity, (document) => document.kyc, { cascade: true })
  documents: DocumentEntity[];
}

