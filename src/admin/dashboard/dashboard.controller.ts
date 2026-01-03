import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminDashboardService } from './dashboard.service';

@ApiTags('Admin - Dashboard')
@Controller({
  path: 'admin/dashboard',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getDashboardStats() {
    return this.adminDashboardService.getDashboardStats();
  }
}
