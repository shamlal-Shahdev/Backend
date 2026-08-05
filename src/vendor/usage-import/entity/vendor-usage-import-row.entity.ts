import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../utils/relational-entity-helper';
import { InstallationEntity } from '../../../installation/entity/installation.entity';
import { VendorUsageImportBatchEntity } from './vendor-usage-import-batch.entity';

export enum VendorUsageImportRowStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity({ name: 'vendor_usage_import_row' })
export class VendorUsageImportRowEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id', type: 'int' })
  batchId: number;

  @Column({ name: 'row_number', type: 'int' })
  rowNumber: number;

  @Column({ name: 'meter_id', type: 'varchar', length: 255 })
  meterId: string;

  @Column({ name: 'total_kwh', type: 'decimal', precision: 15, scale: 4 })
  totalKwh: number;

  @Column({
    type: 'enum',
    enum: VendorUsageImportRowStatus,
    enumName: 'vendor_usage_import_row_status_enum',
    default: VendorUsageImportRowStatus.PENDING,
  })
  status: VendorUsageImportRowStatus;

  @Column({ name: 'reason_code', type: 'varchar', length: 64, nullable: true })
  reasonCode: string | null;

  @Column({ name: 'installation_id', type: 'int', nullable: true })
  installationId: number | null;

  @Column({ name: 'reward_transaction_id', type: 'int', nullable: true })
  rewardTransactionId: number | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 128, nullable: true })
  txHash: string | null;

  @ManyToOne(() => VendorUsageImportBatchEntity, (batch) => batch.rows, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batch_id' })
  batch: VendorUsageImportBatchEntity;

  @ManyToOne(() => InstallationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'installation_id' })
  installation: InstallationEntity | null;
}
