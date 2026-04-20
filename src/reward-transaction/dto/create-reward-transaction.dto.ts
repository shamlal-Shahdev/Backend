import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { RewardReason } from '../entity/reward-transaction.entity';
export class CreateRewardTransactionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;
  @ApiProperty({ example: 1 })
  @IsInt()
  installationId: number;
  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0)
  tokensAmount: number;
  @ApiProperty({ example: 0.1 })
  @IsNumber()
  @Min(0)
  tokensPerKwh: number;
  @ApiProperty({ example: 1000.5 })
  @IsNumber()
  @Min(0)
  kwhRewarded: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  txHash?: string;
  @ApiProperty({ enum: RewardReason, example: RewardReason.DAILY_REWARD })
  @IsEnum(RewardReason)
  reason: RewardReason;
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  oracleId?: number;
  @ApiProperty({ required: false, description: 'Vendor usage import batch (audit)' })
  @IsOptional()
  @IsInt()
  vendorUsageBatchId?: number;
  @ApiProperty({ required: false, example: '2026-04' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  usagePeriodYearMonth?: string;
}
