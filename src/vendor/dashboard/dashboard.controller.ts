import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VendorGuard } from '../../auth/guards/vendor.guard';
import { VendorCompanyProfileGuard } from '../../auth/guards/vendor-company-profile.guard';
import { VendorDashboardService } from './dashboard.service';
import { VendorDashboardResponseDto } from './dto/vendor-dashboard-response.dto';
@ApiTags('Vendor - Dashboard')
@Controller({
  path: 'vendor/dashboard',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), VendorGuard, VendorCompanyProfileGuard)
@ApiBearerAuth()
export class VendorDashboardController {
  constructor(private readonly vendorDashboardService: VendorDashboardService) {}
  @Get('stats')
  @ApiOperation({ summary: 'Get vendor dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: VendorDashboardResponseDto,
  })
  async getDashboardStats(@Request() req): Promise<VendorDashboardResponseDto> {
    const vendorId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.vendorDashboardService.getDashboardStats(vendorId);
  }
}
