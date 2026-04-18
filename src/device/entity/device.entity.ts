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
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { EnergyReadingEntity } from '../../energy-reading/entity/energy-reading.entity';
export enum DeviceType {
  SMART_METER = 'smart_meter',
}
export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
}
@Entity({ name: 'device' })
export class DeviceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'installation_id', type: 'int' })
  installationId: number;
  @Column({ name: 'device_uuid', type: 'varchar', length: 255, unique: true })
  deviceUuid: string;
  @Column({
    name: 'device_type',
    type: 'enum',
    enum: DeviceType,
  })
  deviceType: DeviceType;
  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.ACTIVE,
  })
  status: DeviceStatus;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @ManyToOne(() => InstallationEntity, (installation) => installation.devices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'installation_id' })
  installation: InstallationEntity;
  @OneToMany(() => EnergyReadingEntity, (energyReading) => energyReading.device)
  energyReadings: EnergyReadingEntity[];
}
