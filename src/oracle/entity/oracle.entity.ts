import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { EnergyReadingEntity } from '../../energy-reading/entity/energy-reading.entity';
import { RewardTransactionEntity } from '../../reward-transaction/entity/reward-transaction.entity';
export enum OracleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
}
@Entity({ name: 'oracle' })
export class OracleEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 255 })
  name: string;
  @Column({
    type: 'enum',
    enum: OracleStatus,
    default: OracleStatus.ACTIVE,
  })
  status: OracleStatus;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @OneToMany(() => EnergyReadingEntity, (energyReading) => energyReading.oracle)
  energyReadings: EnergyReadingEntity[];
  @OneToMany(
    () => RewardTransactionEntity,
    (rewardTransaction) => rewardTransaction.oracle,
  )
  rewardTransactions: RewardTransactionEntity[];
}
