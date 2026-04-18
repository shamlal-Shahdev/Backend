import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';
import { DeviceEntity } from '../../device/entity/device.entity';
import { EnergyReadingEntity } from '../../energy-reading/entity/energy-reading.entity';
import { RewardTransactionEntity } from '../../reward-transaction/entity/reward-transaction.entity';
import { CertificateEntity } from '../../certificate/entity/certificate.entity';
import { PredictionEntity } from '../../prediction/entity/prediction.entity';
import { PropertySegment } from '../property-segment';
export enum InstallationType {
  ROOFTOP_SOLAR = 'rooftop_solar',
}
export enum InstallationStatus {
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}
@Entity({ name: 'installation' })
export class InstallationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'user_id', type: 'int' })
  userId: number;
  @Column({ type: 'varchar', length: 255 })
  name: string;
  @Column({
    name: 'installation_type',
    type: 'enum',
    enum: InstallationType,
  })
  installationType: InstallationType;
  @Column({ name: 'capacity_kw', type: 'decimal', precision: 10, scale: 2 })
  capacityKw: number;
  @Column({
    name: 'property_segment',
    type: 'varchar',
    length: 50,
    default: PropertySegment.RESIDENTIAL_SMALL,
  })
  propertySegment: PropertySegment;
  @Column({ type: 'varchar', length: 500 })
  location: string;
  @Column({
    name: 'latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude: number | null;
  @Column({
    name: 'longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude: number | null;
  @Column({ name: 'rooftop_available', type: 'boolean', nullable: true })
  rooftopAvailable: boolean | null;
  @Column({
    type: 'enum',
    enum: InstallationStatus,
    default: InstallationStatus.SUBMITTED,
  })
  status: InstallationStatus;
  @Column({ name: 'vendor_id', type: 'int', nullable: true })
  vendorId: number | null;
  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;
  @CreateDateColumn({ name: 'registered_at' })
  registeredAt: Date;
  @Column({ name: 'verified_at', type: 'datetime', nullable: true })
  verifiedAt: Date | null;
  @ManyToOne(() => UserEntity, (user) => user.installations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: UserEntity | null;
  @OneToMany(() => DeviceEntity, (device) => device.installation)
  devices: DeviceEntity[];
  @OneToMany(
    () => EnergyReadingEntity,
    (energyReading) => energyReading.installation,
  )
  energyReadings: EnergyReadingEntity[];
  @OneToMany(
    () => RewardTransactionEntity,
    (rewardTransaction) => rewardTransaction.installation,
  )
  rewardTransactions: RewardTransactionEntity[];
  @OneToMany(() => CertificateEntity, (certificate) => certificate.installation)
  certificates: CertificateEntity[];
  @OneToMany(() => PredictionEntity, (prediction) => prediction.installation)
  predictions: PredictionEntity[];
}
