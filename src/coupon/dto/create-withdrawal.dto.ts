import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Bank: HBL, Account: 1234567890, Name: ABC Vendor' })
  @IsString()
  @IsNotEmpty()
  bankDetails: string;
}
