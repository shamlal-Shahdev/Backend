import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CouponStatus } from '../entity/coupon.entity';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @ApiPropertyOptional({ enum: CouponStatus })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}
