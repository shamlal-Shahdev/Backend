import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { VendorGuard } from '../../auth/guards/vendor.guard';
import { VendorCompanyProfileGuard } from '../../auth/guards/vendor-company-profile.guard';
import { CouponService } from '../../coupon/coupon.service';
import { CreateCouponDto } from '../../coupon/dto/create-coupon.dto';
import { UpdateCouponDto } from '../../coupon/dto/update-coupon.dto';
import { CreateWithdrawalDto } from '../../coupon/dto/create-withdrawal.dto';

function parseVendorId(req: { user: { id: string | number } }): number {
  return typeof req.user.id === 'string'
    ? parseInt(req.user.id, 10)
    : req.user.id;
}

@ApiTags('Vendor - Coupons')
@Controller({
  path: 'vendor',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), VendorGuard, VendorCompanyProfileGuard)
@ApiBearerAuth()
export class VendorCouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('marketplace/stats')
  @ApiOperation({ summary: 'Get vendor marketplace dashboard stats' })
  getDashboardStats(@Request() req: { user: { id: string | number } }) {
    return this.couponService.getVendorDashboardStats(parseVendorId(req));
  }

  @Post('coupons')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and publish a coupon' })
  create(
    @Request() req: { user: { id: string | number } },
    @Body() dto: CreateCouponDto,
  ) {
    return this.couponService.createCoupon(parseVendorId(req), dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get vendor transactions' })
  getTransactions(@Request() req: { user: { id: string | number } }) {
    return this.couponService.getVendorTransactions(parseVendorId(req));
  }

  @Get('coupons')
  @ApiOperation({ summary: 'List vendor coupons' })
  findAll(@Request() req: { user: { id: string | number } }) {
    return this.couponService.findVendorCoupons(parseVendorId(req));
  }

  @Put('coupons/:id')
  @ApiOperation({ summary: 'Update a vendor coupon' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Request() req: { user: { id: string | number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponService.updateVendorCoupon(parseVendorId(req), id, dto);
  }

  @Patch('coupons/:id/disable')
  @ApiOperation({ summary: 'Disable a vendor coupon' })
  @ApiParam({ name: 'id', type: Number })
  disable(
    @Request() req: { user: { id: string | number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.couponService.disableVendorCoupon(parseVendorId(req), id);
  }

  @Delete('coupons/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vendor coupon' })
  @ApiParam({ name: 'id', type: Number })
  async remove(
    @Request() req: { user: { id: string | number } },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.couponService.deleteVendorCoupon(parseVendorId(req), id);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get vendor wallet balance' })
  getWallet(@Request() req: { user: { id: string | number } }) {
    return this.couponService.getVendorWallet(parseVendorId(req));
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a withdrawal request' })
  withdraw(
    @Request() req: { user: { id: string | number } },
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.couponService.createWithdrawalRequest(parseVendorId(req), dto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'List vendor withdrawal requests' })
  getWithdrawals(@Request() req: { user: { id: string | number } }) {
    return this.couponService.getVendorWithdrawals(parseVendorId(req));
  }
}
