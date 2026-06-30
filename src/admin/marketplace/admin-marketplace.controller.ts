import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CouponService } from '../../coupon/coupon.service';
import { ProcessWithdrawalDto } from '../../coupon/dto/process-withdrawal.dto';
import { WithdrawalStatus } from '../../coupon/entity/withdrawal-request.entity';

@ApiTags('Admin - Marketplace')
@Controller({
  path: 'admin',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminMarketplaceController {
  constructor(private readonly couponService: CouponService) {}

  @Get('marketplace/stats')
  @ApiOperation({ summary: 'Get marketplace KPIs' })
  getStats() {
    return this.couponService.getAdminMarketplaceStats();
  }

  @Get('marketplace/coupons')
  @ApiOperation({ summary: 'List all coupons for monitoring' })
  getCoupons() {
    return this.couponService.getAllCouponsForAdmin();
  }

  @Patch('marketplace/coupons/:id/disable')
  @ApiOperation({ summary: 'Disable an inappropriate coupon' })
  @ApiParam({ name: 'id', type: Number })
  disableCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.adminDisableCoupon(id);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'List all withdrawal requests' })
  getWithdrawals() {
    return this.couponService.getAllWithdrawals();
  }

  @Post('withdraw/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a withdrawal request' })
  @ApiParam({ name: 'id', type: Number })
  processWithdrawal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessWithdrawalDto,
  ) {
    const allowed = [
      WithdrawalStatus.IN_PROGRESS,
      WithdrawalStatus.APPROVED,
      WithdrawalStatus.REJECTED,
    ];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException('Invalid withdrawal status');
    }
    return this.couponService.processWithdrawal(id, dto.status);
  }
}
