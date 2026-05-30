import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  StreamableFile,
  Header,
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
import { CertificateService } from './certificate.service';
import { CertificateListQueryDto } from './dto/certificate-list-query.dto';
import { CertificateResponseDto } from './dto/certificate-response.dto';
import {
  CertificateStatsResponseDto,
  LatestCertificateSummaryDto,
} from './dto/certificate-stats-response.dto';
import { CertificateMonthOverviewDto } from './dto/certificate-month-overview.dto';

type AuthenticatedRequest = {
  user: { id: number | string };
};

function resolveUserId(req: AuthenticatedRequest): number {
  return typeof req.user.id === 'string'
    ? parseInt(req.user.id, 10)
    : req.user.id;
}

@ApiTags('Certificates')
@Controller({
  path: 'certificates',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('me')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Get current user certificates' })
  async findMine(
    @Request() req: AuthenticatedRequest,
    @Query() query: CertificateListQueryDto,
  ): Promise<{ certificates: CertificateResponseDto[]; total: number }> {
    return this.certificateService.findForUser(resolveUserId(req), query);
  }

  @Get('me/months')
  @Roles(RoleEnum.user)
  @ApiOperation({
    summary: 'Get months with verified energy generation and certificate status',
  })
  @ApiResponse({ status: 200, type: [CertificateMonthOverviewDto] })
  async getMyMonthlyOverview(
    @Request() req: AuthenticatedRequest,
  ): Promise<CertificateMonthOverviewDto[]> {
    return this.certificateService.getUserMonthlyOverview(resolveUserId(req));
  }

  @Get('me/stats')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Get current user certificate lifetime statistics' })
  @ApiResponse({ status: 200, type: CertificateStatsResponseDto })
  async getMyStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<CertificateStatsResponseDto> {
    return this.certificateService.getUserStats(resolveUserId(req));
  }

  @Get('me/latest')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Get latest certificate summary for dashboard' })
  async getMyLatest(
    @Request() req: AuthenticatedRequest,
  ): Promise<LatestCertificateSummaryDto | null> {
    return this.certificateService.getLatestForUser(resolveUserId(req));
  }

  @Get('me/:id/download')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Download certificate PDF' })
  @ApiParam({ name: 'id', type: Number })
  @Header('Content-Type', 'application/pdf')
  async downloadMine(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const userId = resolveUserId(req);
    const { buffer, filename } =
      await this.certificateService.getPdfDownloadForUser(userId, id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
