import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity({ name: 'withdrawal_request' })
export class WithdrawalRequestEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vendor_id', type: 'int' })
  vendorId: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @Column({ name: 'bank_details', type: 'text' })
  bankDetails: string;

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: UserEntity;
}
