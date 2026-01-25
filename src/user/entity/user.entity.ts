import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { RewardTransactionEntity } from '../../reward-transaction/entity/reward-transaction.entity';
import { WalletBalanceEntity } from '../../wallet-balance/entity/wallet-balance.entity';
import { RedemptionEntity } from '../../redemption/entity/redemption.entity';
import { CertificateEntity } from '../../certificate/entity/certificate.entity';
import { PredictionEntity } from '../../prediction/entity/prediction.entity';
import { EnergyRequestEntity } from '../../energy-request/entity/energy-request.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  VENDOR = 'vendor',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_REVIEW = 'in_review',
}
@Entity({ name: 'user' })
export class UserEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'wallet_address',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  walletAddress: string;

  @Column({
    name: 'encrypted_private_key',
    type: 'text',
    nullable: true,
  })
  encryptedPrivateKey: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  // Alias for passwordHash for backward compatibility
  get password(): string {
    return this.passwordHash;
  }

  set password(value: string) {
    this.passwordHash = value;
  }

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({
    name: 'verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  verificationToken: string | null;

  @Column({ name: 'reset_token', type: 'varchar', length: 255, nullable: true })
  resetToken: string | null;

  @Column({ name: 'kyc_status', type: 'varchar', length: 255, nullable: false })
  kycStatus: KycStatus;

  // Computed properties for backward compatibility
  get firstName(): string {
    return this.name.split(' ')[0] || '';
  }

  get lastName(): string {
    const parts = this.name.split(' ');
    return parts.slice(1).join(' ') || '';
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations - Excluded from serialization to prevent circular references
  @OneToMany(() => KycEntity, (kycDocument) => kycDocument.user)
  @Exclude({ toPlainOnly: true })
  kycDocuments: KycEntity[];

  @OneToMany(() => InstallationEntity, (installation) => installation.user)
  @Exclude({ toPlainOnly: true })
  installations: InstallationEntity[];

  @OneToMany(
    () => RewardTransactionEntity,
    (rewardTransaction) => rewardTransaction.user,
  )
  @Exclude({ toPlainOnly: true })
  rewardTransactions: RewardTransactionEntity[];

  @OneToOne(() => WalletBalanceEntity, (walletBalance) => walletBalance.user)
  @Exclude({ toPlainOnly: true })
  walletBalance: WalletBalanceEntity;

  @OneToMany(() => RedemptionEntity, (redemption) => redemption.user)
  @Exclude({ toPlainOnly: true })
  redemptions: RedemptionEntity[];

  @OneToMany(() => CertificateEntity, (certificate) => certificate.user)
  @Exclude({ toPlainOnly: true })
  certificates: CertificateEntity[];

  @OneToMany(() => PredictionEntity, (prediction) => prediction.user)
  @Exclude({ toPlainOnly: true })
  predictions: PredictionEntity[];

  @OneToMany(() => EnergyRequestEntity, (energyRequest) => energyRequest.user)
  @Exclude({ toPlainOnly: true })
  energyRequests: EnergyRequestEntity[];
}
