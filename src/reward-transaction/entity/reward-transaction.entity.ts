import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { OracleEntity } from '../../oracle/entity/oracle.entity';
import { TokenMintEventEntity } from '../../token-mint-event/entity/token-mint-event.entity';
import { VendorUsageImportBatchEntity } from '../../vendor/usage-import/entity/vendor-usage-import-batch.entity';
export enum RewardReason {
  DAILY_REWARD = 'daily_reward',
  PREDICTION_BONUS = 'prediction_bonus',
  /** kWh for calendar month from vendor CSV/Excel import (see usage_period_year_month). */
  VENDOR_MONTHLY_USAGE = 'vendor_monthly_usage',
}
@Entity({ name: 'reward_transaction' })
export class RewardTransactionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'user_id', type: 'int' })
  userId: number;
  @Column({ name: 'installation_id', type: 'int' })
  installationId: number;
  @Column({ name: 'tokens_amount', type: 'decimal', precision: 18, scale: 8 })
  tokensAmount: number;
  @Column({ name: 'tokens_per_kwh', type: 'decimal', precision: 10, scale: 4 })
  tokensPerKwh: number;
  @Column({ name: 'kwh_rewarded', type: 'decimal', precision: 15, scale: 4 })
  kwhRewarded: number;
  @Column({ name: 'tx_hash', type: 'varchar', length: 255, nullable: true })
  txHash: string | null;
  @Column({
    type: 'enum',
    enum: RewardReason,
  })
  reason: RewardReason;
  @Column({ name: 'oracle_id', type: 'int', nullable: true })
  oracleId: number | null;
  @Column({ name: 'vendor_usage_batch_id', type: 'int', nullable: true })
  vendorUsageBatchId: number | null;
  @Column({
    name: 'usage_period_year_month',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  usagePeriodYearMonth: string | null;
  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;
  @ManyToOne(() => UserEntity, (user) => user.rewardTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @ManyToOne(
    () => InstallationEntity,
    (installation) => installation.rewardTransactions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'installation_id' })
  installation: InstallationEntity;
  @ManyToOne(() => OracleEntity, (oracle) => oracle.rewardTransactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'oracle_id' })
  oracle: OracleEntity | null;
  @ManyToOne(() => VendorUsageImportBatchEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vendor_usage_batch_id' })
  vendorUsageBatch: VendorUsageImportBatchEntity | null;
  @OneToOne(
    () => TokenMintEventEntity,
    (tokenMintEvent) => tokenMintEvent.rewardTransaction,
  )
  tokenMintEvent: TokenMintEventEntity;
}
