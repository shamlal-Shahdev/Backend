import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { CouponService } from './coupon.service';
import { PurchaseCouponDto } from './dto/purchase-coupon.dto';

function parseUserId(req: { user: { id: string | number } }): number {
  return typeof req.user.id === 'string'
    ? parseInt(req.user.id, 10)
    : req.user.id;
}

@ApiTags('Coupons')
@Controller({
  path: 'coupons',
  version: '1',
})
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('purchase')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.user)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase a coupon with tokens' })
  purchase(
    @Request() req: { user: { id: string | number } },
    @Body() dto: PurchaseCouponDto,
  ) {
    return this.couponService.purchaseCoupon(parseUserId(req), dto.couponId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get coupon details by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.findCouponById(id);
  }
}

@ApiTags('User Coupons')
@Controller({
  path: 'user',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UserCouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('my-coupons')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Get purchased coupons for current user' })
  getMyCoupons(@Request() req: { user: { id: string | number } }) {
    return this.couponService.getMyCoupons(parseUserId(req));
  }

  @Post('my-coupons/:id/redeem')
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a purchased coupon' })
  @ApiParam({ name: 'id', type: Number })
  redeem(
    @Request() req: { user: { id: string | number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.couponService.redeemCoupon(parseUserId(req), id);
  }
}
