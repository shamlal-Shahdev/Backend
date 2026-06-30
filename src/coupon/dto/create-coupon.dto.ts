import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { CouponValueType } from '../entity/coupon.entity';

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

  @ApiPropertyOptional({
    enum: CouponValueType,
    default: CouponValueType.AMOUNT,
    example: CouponValueType.AMOUNT,
  })
  @IsOptional()
  @IsEnum(CouponValueType)
  valueType?: CouponValueType;

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

  @ApiProperty({ example: 'SOLAR20', description: 'Redemption code shown to buyer after purchase' })
  @IsString()
  @IsNotEmpty()
  redemptionCode: string;

  @ApiPropertyOptional({ example: 'https://example.com/coupon.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
