import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminAuditService } from './audit.service';
import { AdminGuard } from '../../auth/guards/admin.guard';

@ApiTags('Admin - Audit')
@Controller({
  path: 'admin/audit-logs',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}
  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  getAuditLogs(
    @Query('userId') userId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    return this.adminAuditService.getAuditLogs(userId, page, limit);
  }
}
