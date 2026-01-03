import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { PredictionStatus } from '../entity/prediction.entity';

export class CreatePredictionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  installationId: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2024, minimum: 2000 })
  @IsInt()
  @Min(2000)
  year: number;

  @ApiProperty({ example: 1000.5 })
  @IsNumber()
  @Min(0)
  predictedKwh: number;

  @ApiProperty({
    enum: PredictionStatus,
    default: PredictionStatus.LOCKED,
    required: false,
  })
  @IsOptional()
  @IsEnum(PredictionStatus)
  status?: PredictionStatus;
}
