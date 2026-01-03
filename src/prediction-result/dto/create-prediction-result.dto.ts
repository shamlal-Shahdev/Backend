import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreatePredictionResultDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  predictionId: number;

  @ApiProperty({ example: 1050.5 })
  @IsNumber()
  @Min(0)
  actualKwh: number;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  bonusAwarded?: boolean;
}
