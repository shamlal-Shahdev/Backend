import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { EnergyRequestEntity } from '../../energy-request/entity/energy-request.entity';
import { RewardTransactionEntity } from '../../reward-transaction/entity/reward-transaction.entity';
import {
  AchievementLevel,
  CertificateStatus,
  SustainabilityBadge,
} from '../certificate.enums';

@Entity({ name: 'certificate' })
@Index(['userId', 'month', 'year'], { unique: true })
export class CertificateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'certificate_id', type: 'varchar', length: 64, unique: true })
  certificateId: string;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'installation_id', type: 'int' })
  installationId: number;

  @Column({ name: 'vendor_id', type: 'int', nullable: true })
  vendorId: number | null;

  @Column({ name: 'wallet_address', type: 'varchar', length: 255 })
  walletAddress: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ name: 'total_kwh', type: 'decimal', precision: 15, scale: 4 })
  totalKwh: number;

  @Column({
    name: 'total_co2_offset',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  totalCo2Offset: number;

  @Column({
    name: 'reward_amount',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
  })
  rewardAmount: number;

  @Column({
    name: 'trees_equivalent',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  treesEquivalent: number;

  @Column({
    name: 'achievement_level',
    type: 'enum',
    enum: AchievementLevel,
  })
  achievementLevel: AchievementLevel;

  @Column({
    type: 'enum',
    enum: SustainabilityBadge,
  })
  badge: SustainabilityBadge;

  @Column({ name: 'transaction_hash', type: 'varchar', length: 255 })
  transactionHash: string;

  @Column({ name: 'qr_code_url', type: 'varchar', length: 500, nullable: true })
  qrCodeUrl: string | null;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;

  @Column({
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.ACTIVE,
  })
  status: CertificateStatus;

  @Column({ name: 'energy_request_id', type: 'int', nullable: true })
  energyRequestId: number | null;

  @Column({ name: 'reward_transaction_id', type: 'int', nullable: true })
  rewardTransactionId: number | null;

  @Column({ name: 'meter_id', type: 'varchar', length: 255, nullable: true })
  meterId: string | null;

  @Column({ name: 'verified_at', type: 'datetime', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.certificates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(
    () => InstallationEntity,
    (installation) => installation.certificates,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'installation_id' })
  installation: InstallationEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: UserEntity | null;

  @ManyToOne(() => EnergyRequestEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'energy_request_id' })
  energyRequest: EnergyRequestEntity | null;

  @ManyToOne(() => RewardTransactionEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reward_transaction_id' })
  rewardTransaction: RewardTransactionEntity | null;
}
