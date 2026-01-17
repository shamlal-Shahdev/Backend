import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';

export enum EnergyRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REWARD_GENERATED = 'REWARD_GENERATED',
  BLOCKCHAIN_FAILED = 'BLOCKCHAIN_FAILED',
}

@Entity({ name: 'energy_requests' })
@Index(['userId', 'month', 'year'], { unique: true })
@Index(['status'])
export class EnergyRequestEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  @Index()
  userId: number;

  @Column({ name: 'meter_image_url', type: 'varchar', length: 500 })
  meterImageUrl: string;

  @Column({ name: 'meter_id_from_image', type: 'varchar', length: 255, nullable: true })
  meterIdFromImage: string | null;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({
    type: 'enum',
    enum: EnergyRequestStatus,
    default: EnergyRequestStatus.PENDING,
  })
  status: EnergyRequestStatus;

  @Column({ name: 'admin_remark', type: 'text', nullable: true })
  adminRemark: string | null;

  @Column({ name: 'approved_by_admin_id', type: 'int', nullable: true })
  approvedByAdminId: number | null;

  @Column({ name: 'reward_amount', type: 'decimal', precision: 18, scale: 8, nullable: true })
  rewardAmount: number | null;

  @Column({ name: 'blockchain_tx_hash', type: 'varchar', length: 255, nullable: true })
  blockchainTxHash: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.energyRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'approved_by_admin_id' })
  approvedByAdmin: UserEntity | null;
}

