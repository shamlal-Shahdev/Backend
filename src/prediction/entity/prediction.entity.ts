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
import { PredictionResultEntity } from '../../prediction-result/entity/prediction-result.entity';

export enum PredictionStatus {
  LOCKED = 'locked',
  EVALUATED = 'evaluated',
}

@Entity({ name: 'prediction' })
export class PredictionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'installation_id', type: 'int' })
  installationId: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ name: 'predicted_kwh', type: 'decimal', precision: 15, scale: 4 })
  predictedKwh: number;

  @Column({
    type: 'enum',
    enum: PredictionStatus,
    default: PredictionStatus.LOCKED,
  })
  status: PredictionStatus;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.predictions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(
    () => InstallationEntity,
    (installation) => installation.predictions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'installation_id' })
  installation: InstallationEntity;

  @OneToOne(
    () => PredictionResultEntity,
    (predictionResult) => predictionResult.prediction,
  )
  predictionResult: PredictionResultEntity;
}
