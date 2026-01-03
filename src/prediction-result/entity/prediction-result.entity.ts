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

  @Column({ name: 'bonus_awarded', type: 'boolean', default: false })
  bonusAwarded: boolean;

  @CreateDateColumn({ name: 'evaluated_at' })
  evaluatedAt: Date;

  @OneToOne(
    () => PredictionEntity,
    (prediction) => prediction.predictionResult,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'prediction_id' })
  prediction: PredictionEntity;
}
