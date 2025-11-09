import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { KycEntity } from './kyc.entity';

export enum DocumentType {
  CNIC_FRONT = 'cnic_front',
  CNIC_BACK = 'cnic_back',
  SELFIE = 'selfie',
  ADDITIONAL = 'additional',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity({ name: 'documents' })
export class DocumentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_document_kyc_id')
  @Column({ name: 'kyc_id', type: 'uuid' })
  kycId: string;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({ name: 's3_key', length: 500 })
  s3Key: string;

  @Column({ name: 's3_bucket', length: 100 })
  s3Bucket: string;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  status: DocumentStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => KycEntity, (kyc) => kyc.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kyc_id' })
  kyc: KycEntity;
}

