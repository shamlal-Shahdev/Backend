import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AdminEnergyRequestService } from './energy-request.service';
import { ApproveEnergyRequestDto } from '../../energy-request/dto/approve-energy-request.dto';
import { RejectEnergyRequestDto } from '../../energy-request/dto/reject-energy-request.dto';
import { EnergyRequestResponseDto } from '../../energy-request/dto/energy-request-response.dto';
import { EnergyRequestStatus } from '../../energy-request/entity/energy-request.entity';
@ApiTags('Admin - Energy Requests')
@Controller({
  path: 'admin/energy-requests',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminEnergyRequestController {
  constructor(
    private readonly adminEnergyRequestService: AdminEnergyRequestService,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Get all energy requests (optionally filtered by status)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EnergyRequestStatus,
    description: 'Filter by status (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Energy requests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        requests: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnergyRequestResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getAllEnergyRequests(
    @Query('status') status?: EnergyRequestStatus,
  ): Promise<{ requests: EnergyRequestResponseDto[]; total: number }> {
    return this.adminEnergyRequestService.getAllEnergyRequests(status);
  }
  @Get('pending')
  @ApiOperation({ summary: 'Get all pending energy requests' })
  @ApiResponse({
    status: 200,
    description: 'Pending energy requests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        requests: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnergyRequestResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getPendingEnergyRequests(): Promise<{
    requests: EnergyRequestResponseDto[];
    total: number;
  }> {
    return this.adminEnergyRequestService.getPendingEnergyRequests();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get energy request by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Energy request ID' })
  @ApiResponse({
    status: 200,
    description: 'Energy request retrieved successfully',
    type: EnergyRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Energy request not found' })
  async getEnergyRequestById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnergyRequestResponseDto> {
    return this.adminEnergyRequestService.getEnergyRequestById(id);
  }
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve energy request and generate reward' })
  @ApiParam({ name: 'id', type: Number, description: 'Energy request ID' })
  @ApiResponse({
    status: 200,
    description: 'Energy request approved and reward generated successfully',
    type: EnergyRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or wallet address' })
  @ApiResponse({ status: 404, description: 'Energy request not found' })
  async approveEnergyRequest(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: ApproveEnergyRequestDto,
  ): Promise<EnergyRequestResponseDto> {
    const adminId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.adminEnergyRequestService.approveEnergyRequest(id, adminId, dto);
  }
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject energy request' })
  @ApiParam({ name: 'id', type: Number, description: 'Energy request ID' })
  @ApiResponse({
    status: 200,
    description: 'Energy request rejected successfully',
    type: EnergyRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request status' })
  @ApiResponse({ status: 404, description: 'Energy request not found' })
  async rejectEnergyRequest(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: RejectEnergyRequestDto,
  ): Promise<EnergyRequestResponseDto> {
    const adminId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.adminEnergyRequestService.rejectEnergyRequest(id, adminId, dto);
  }
}
