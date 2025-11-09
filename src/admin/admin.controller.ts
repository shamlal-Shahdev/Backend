import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';

@ApiTags('Admin')
@Controller({
  path: 'admin',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query() dto: FilterUsersDto) {
    return this.adminService.getUsers(dto);
  }

  @Get('users/:userId')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Put('kyc/:userId/approve')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Approve KYC' })
  @ApiResponse({ status: 200, description: 'KYC approved successfully' })
  @ApiResponse({ status: 404, description: 'User or KYC not found' })
  async approveKyc(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req,
    @Body() dto: ApproveKycDto,
  ) {
    return this.adminService.approveKyc(userId, req.user.id, dto);
  }

  @Put('kyc/:userId/reject')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Reject KYC' })
  @ApiResponse({ status: 200, description: 'KYC rejected successfully' })
  @ApiResponse({ status: 404, description: 'User or KYC not found' })
  async rejectKyc(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req,
    @Body() dto: RejectKycDto,
  ) {
    return this.adminService.rejectKyc(userId, req.user.id, dto);
  }

  @Post('kyc/:userId/request-documents')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Request additional documents' })
  @ApiResponse({ status: 200, description: 'Document request sent successfully' })
  @ApiResponse({ status: 404, description: 'User or KYC not found' })
  async requestDocuments(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req,
    @Body() dto: RequestDocumentsDto,
  ) {
    return this.adminService.requestDocuments(userId, req.user.id, dto);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.adminService.getAuditLogs(userId, page, limit);
  }
}

