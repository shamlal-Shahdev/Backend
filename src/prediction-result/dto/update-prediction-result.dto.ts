import { PartialType } from '@nestjs/swagger';
import { CreatePredictionResultDto } from './create-prediction-result.dto';
export class UpdatePredictionResultDto extends PartialType(
  CreatePredictionResultDto,
) {}
