import { ApiProperty } from '@nestjs/swagger';
import { CertificateMonthStatus } from '../certificate.enums';
import { CertificateResponseDto } from './certificate-response.dto';

export class CertificateMonthOverviewDto {
  @ApiProperty({ example: 5 })
  month: number;

  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 500 })
  energyGeneratedKwh: number;

  @ApiProperty({ example: 100 })
  rewardAmount: number;

  @ApiProperty({ enum: CertificateMonthStatus })
  status: CertificateMonthStatus;

  @ApiProperty({ example: true })
  downloadable: boolean;

  @ApiProperty({ type: CertificateResponseDto, nullable: true })
  certificate: CertificateResponseDto | null;
}
