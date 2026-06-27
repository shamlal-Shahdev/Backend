import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { PredictionEntity } from '../../prediction/entity/prediction.entity';
@Entity({ name: 'prediction_result' })
export class PredictionResultEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'actual_kwh', type: 'decimal', precision: 15, scale: 4 })
  actualKwh: number;
  @Column({
    name: 'accuracy_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  accuracyPercent: number | null;
  @Column({
    name: 'reward_tokens',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
  })
  rewardTokens: number;
  @Column({ name: 'bonus_awarded', type: 'boolean', default: false })
  bonusAwarded: boolean;
  @Column({ name: 'reward_transaction_id', type: 'int', nullable: true })
  rewardTransactionId: number | null;
  @CreateDateColumn({ name: 'evaluated_at' })
  evaluatedAt: Date;
  @Column({ name: 'prediction_id', type: 'int', unique: true })
  predictionId: number;
  @OneToOne(
    () => PredictionEntity,
    (prediction) => prediction.predictionResult,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'prediction_id' })
  prediction: PredictionEntity;
}
