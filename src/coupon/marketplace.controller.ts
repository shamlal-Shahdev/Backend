import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CouponService } from './coupon.service';

@ApiTags('Marketplace')
@Controller({
  path: 'marketplace',
  version: '1',
})
export class MarketplaceController {
  constructor(private readonly couponService: CouponService) {}

  @Get('coupons')
  @ApiOperation({ summary: 'List active marketplace coupons' })
  @ApiResponse({ status: 200, description: 'Active coupons list' })
  findCoupons() {
    return this.couponService.findMarketplaceCoupons();
  }
}
