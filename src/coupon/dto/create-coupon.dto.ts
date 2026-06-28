import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  IsDateString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'Rs. 500 Voucher' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Get Rs. 500 off on your next purchase' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  couponValue: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  tokenCost: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ example: 'Valid for one-time use only.' })
  @IsString()
  @IsNotEmpty()
  termsAndConditions: string;

  @ApiPropertyOptional({ example: 'https://example.com/coupon.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
