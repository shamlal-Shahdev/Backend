import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class SubmitPredictionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  installationId: number;

  @ApiProperty({ example: 550 })
  @IsNumber()
  @Min(0.0001)
  predictedKwh: number;
}
