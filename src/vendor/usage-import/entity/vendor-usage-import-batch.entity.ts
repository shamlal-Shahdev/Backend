import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../utils/relational-entity-helper';
import { UserEntity } from '../../../user/entity/user.entity';
import { FileEntity } from '../../../files/infrastructure/persistence/relational/entities/file.entity';
import { VendorUsageImportRowEntity } from './vendor-usage-import-row.entity';

export enum VendorUsageImportBatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'vendor_usage_import_batch' })
export class VendorUsageImportBatchEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vendor_user_id', type: 'int' })
  vendorUserId: number;

  @Column({ name: 'period_year_month', type: 'varchar', length: 7 })
  periodYearMonth: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 512 })
  originalFilename: string;

  @Column({ name: 'file_id', type: 'uuid', nullable: true })
  fileId: string | null;

  @Column({ name: 'file_hash', type: 'varchar', length: 64, nullable: true })
  fileHash: string | null;

  @Column({
    type: 'enum',
    enum: VendorUsageImportBatchStatus,
    enumName: 'vendor_usage_import_batch_status_enum',
    default: VendorUsageImportBatchStatus.PENDING,
  })
  status: VendorUsageImportBatchStatus;

  @Column({ name: 'summary_json', type: 'json', nullable: true })
  summaryJson: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_user_id' })
  vendorUser: UserEntity;

  @ManyToOne(() => FileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'file_id' })
  file: FileEntity | null;

  @OneToMany(() => VendorUsageImportRowEntity, (row) => row.batch)
  rows: VendorUsageImportRowEntity[];
}
