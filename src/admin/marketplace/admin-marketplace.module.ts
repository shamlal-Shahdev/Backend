import { Module } from '@nestjs/common';
import { AdminMarketplaceController } from './admin-marketplace.controller';
import { CouponModule } from '../../coupon/coupon.module';

@Module({
  imports: [CouponModule],
  controllers: [AdminMarketplaceController],
})
export class AdminMarketplaceModule {}
