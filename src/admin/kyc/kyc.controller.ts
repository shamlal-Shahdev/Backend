import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminKycService } from './kyc.service';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { UserEntity } from '../../user/entity/user.entity';

@ApiTags('Admin - KYC')
@Controller({
  path: 'admin/kyc',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminKycController {
  constructor(private readonly adminKycService: AdminKycService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users with KYC status' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserEntity],
  })
  async getUsersWithKycStatus() {
    return this.adminKycService.getUsersWithKycStatus();
  }
  @Get(':userId/documents')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Get all KYC documents submitted by a user' })
  @ApiResponse({
    status: 200,
    description: 'KYC documents retrieved successfully',
    type: [KycEntity],
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserKycDocuments(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ documents: KycEntity[]; userId: number; total: number }> {
    return this.adminKycService.getUserKycDocuments(userId);
  }

  @Put(':userId/approve')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Approve KYC' })
  @ApiResponse({ status: 200, description: 'KYC approved successfully' })
  @ApiResponse({ status: 404, description: 'User or KYC not found' })
  async approveKyc(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
    @Body() dto: ApproveKycDto,
  ) {
    return this.adminKycService.approveKyc(userId, req.user.id, dto);
  }

  @Put(':userId/reject')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Reject KYC' })
  @ApiResponse({ status: 200, description: 'KYC rejected successfully' })
  @ApiResponse({ status: 404, description: 'User or KYC not found' })
  async rejectKyc(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
    @Body() dto: RejectKycDto,
  ) {
    return this.adminKycService.rejectKyc(userId, req.user.id, dto);
  }

  @Post(':userId/request-documents')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Request additional documents' })
  @ApiResponse({
    status: 200,
    description: 'Document request sent successfully',
  })
  @ApiResponse({ status: 404, description: 'User or KYC not found' })
  async requestDocuments(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
    @Body() dto: RequestDocumentsDto,
  ) {
    return this.adminKycService.requestDocuments(userId, req.user.id, dto);
  }
}
