import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
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
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CertificateService } from '../../certificate/certificate.service';
import { AdminCertificateListQueryDto } from '../../certificate/dto/certificate-list-query.dto';
import { CertificateResponseDto } from '../../certificate/dto/certificate-response.dto';
import { CertificateAdminStatsResponseDto } from '../../certificate/dto/certificate-stats-response.dto';
import { CertificateEntity } from '../../certificate/entity/certificate.entity';

@ApiTags('Admin - Certificates')
@Controller({
  path: 'admin/certificates',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminCertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get()
  @ApiOperation({ summary: 'List all certificates with filters' })
  async findAll(
    @Query() query: AdminCertificateListQueryDto,
  ): Promise<{ certificates: CertificateResponseDto[]; total: number }> {
    return this.certificateService.findForAdmin(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Certificate dashboard KPIs' })
  @ApiResponse({ status: 200, type: CertificateAdminStatsResponseDto })
  async getStats(): Promise<CertificateAdminStatsResponseDto> {
    return this.certificateService.getAdminStats();
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a certificate' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: CertificateEntity })
  async revoke(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CertificateEntity> {
    return this.certificateService.revoke(id);
  }
}
