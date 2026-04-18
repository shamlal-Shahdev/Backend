import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
export class CreateWalletBalanceDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;
  @ApiProperty({ example: 0, default: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
