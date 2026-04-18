import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionResultService } from './prediction-result.service';
import { PredictionResultController } from './prediction-result.controller';
import { PredictionResultEntity } from './entity/prediction-result.entity';
@Module({
  imports: [TypeOrmModule.forFeature([PredictionResultEntity])],
  controllers: [PredictionResultController],
  providers: [PredictionResultService],
  exports: [PredictionResultService],
})
export class PredictionResultModule {}
