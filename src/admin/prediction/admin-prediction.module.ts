import { Module } from '@nestjs/common';
import { AdminPredictionController } from './admin-prediction.controller';
import { PredictionModule } from '../../prediction/prediction.module';

@Module({
  imports: [PredictionModule],
  controllers: [AdminPredictionController],
})
export class AdminPredictionModule {}
