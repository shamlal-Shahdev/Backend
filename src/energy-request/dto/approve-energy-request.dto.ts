import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
export class ApproveEnergyRequestDto {
  @ApiProperty({ required: false, example: 'Meter ID verified. Reward generated successfully.' })
  @IsOptional()
  @IsString()
  remark?: string;
  @ApiProperty({ required: false, example: 100.5, description: 'Reward amount in tokens' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardAmount?: number;
}
