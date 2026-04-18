import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { DeviceEntity } from '../../device/entity/device.entity';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { OracleEntity } from '../../oracle/entity/oracle.entity';
export enum EnergyReadingSource {
  DEVICE = 'device',
  BACKEND = 'backend',
  SIMULATED = 'simulated',
}
@Entity({ name: 'energy_reading' })
export class EnergyReadingEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'device_id', type: 'int' })
  deviceId: number;
  @Column({ name: 'installation_id', type: 'int' })
  installationId: number;
  @Column({ name: 'raw_kwh', type: 'decimal', precision: 15, scale: 4 })
  rawKwh: number;
  @Column({
    name: 'verified_kwh',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  verifiedKwh: number | null;
  @Column({ type: 'datetime' })
  timestamp: Date;
  @Column({ type: 'boolean', default: false })
  verified: boolean;
  @Column({
    name: 'verification_signature',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  verificationSignature: string | null;
  @Column({ name: 'oracle_id', type: 'int', nullable: true })
  oracleId: number | null;
  @Column({
    type: 'enum',
    enum: EnergyReadingSource,
    default: EnergyReadingSource.DEVICE,
  })
  source: EnergyReadingSource;
  @Column({ name: 'receipt_tx', type: 'varchar', length: 255, nullable: true })
  receiptTx: string | null;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @ManyToOne(() => DeviceEntity, (device) => device.energyReadings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: DeviceEntity;
  @ManyToOne(
    () => InstallationEntity,
    (installation) => installation.energyReadings,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'installation_id' })
  installation: InstallationEntity;
  @ManyToOne(() => OracleEntity, (oracle) => oracle.energyReadings, {
    nullable: true,
  })
  @JoinColumn({ name: 'oracle_id' })
  oracle: OracleEntity | null;
}
