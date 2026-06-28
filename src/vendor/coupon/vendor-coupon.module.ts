import { Module } from '@nestjs/common';
import { VendorCouponController } from './vendor-coupon.controller';
import { CouponModule } from '../../coupon/coupon.module';
import { VendorCompanyProfileModule } from '../company-profile/vendor-company-profile.module';

@Module({
  imports: [CouponModule, VendorCompanyProfileModule],
  controllers: [VendorCouponController],
})
export class VendorCouponModule {}
