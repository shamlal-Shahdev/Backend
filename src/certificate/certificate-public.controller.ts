import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { CertificateVerifyResponseDto } from './dto/certificate-stats-response.dto';

@ApiTags('Certificates')
@Controller({
  path: 'certificates',
  version: '1',
})
export class CertificatePublicController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('verify/:certificateId')
  @ApiOperation({ summary: 'Public certificate verification' })
  @ApiParam({ name: 'certificateId', type: String })
  @ApiResponse({ status: 200, type: CertificateVerifyResponseDto })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async verify(
    @Param('certificateId') certificateId: string,
  ): Promise<CertificateVerifyResponseDto> {
    return this.certificateService.verifyByPublicId(certificateId);
  }
}
