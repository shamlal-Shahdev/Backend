import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateTokenMintEventDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  rewardTransactionId: number;

  @ApiProperty({ example: '0x1234567890abcdef...' })
  @IsString()
  @MaxLength(255)
  txHash: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0)
  amount: number;
}
