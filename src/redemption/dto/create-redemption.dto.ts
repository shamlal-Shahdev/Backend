import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { RedemptionStatus } from '../entity/redemption.entity';

export class CreateRedemptionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  marketplaceItemId: number;

  @ApiProperty({ example: 1, default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    enum: RedemptionStatus,
    default: RedemptionStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(RedemptionStatus)
  status?: RedemptionStatus;
}
