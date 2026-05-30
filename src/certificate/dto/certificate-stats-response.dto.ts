import { ApiProperty } from '@nestjs/swagger';
import {
  AchievementLevel,
  CertificateStatus,
  SustainabilityBadge,
} from '../certificate.enums';

export class CertificateVerifyResponseDto {
  @ApiProperty({ example: 'POG-2025-03-ABC12345' })
  certificateId: string;

  @ApiProperty({ enum: CertificateStatus })
  status: CertificateStatus;

  @ApiProperty({ example: 'John Doe' })
  userName: string;

  @ApiProperty({ example: 3 })
  month: number;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({ example: 500 })
  energyGenerated: number;

  @ApiProperty({ example: 410 })
  co2Offset: number;

  @ApiProperty({ enum: AchievementLevel })
  achievementLevel: AchievementLevel;

  @ApiProperty()
  issueDate: Date;

  @ApiProperty({ example: '0xabc123...' })
  transactionHash: string;

  @ApiProperty({ example: true })
  digitallyVerified: boolean;
}

export class CertificateStatsResponseDto {
  @ApiProperty({ example: 12 })
  totalCertificates: number;

  @ApiProperty({ example: 6500 })
  totalEnergyGenerated: number;

  @ApiProperty({ example: 1500 })
  totalRewardsEarned: number;

  @ApiProperty({ example: 5330 })
  totalCo2OffsetKg: number;

  @ApiProperty({ example: 4.5, description: 'Total CO2 offset in metric tons' })
  totalCo2OffsetTons: number;

  @ApiProperty({ example: 450 })
  previousMonthEnergy: number;

  @ApiProperty({ example: 550 })
  currentMonthEnergy: number;

  @ApiProperty({ example: 22.2 })
  monthOverMonthPercentChange: number;

  @ApiProperty({ enum: SustainabilityBadge, nullable: true })
  currentBadge: SustainabilityBadge | null;
}

export class CertificateAdminStatsResponseDto {
  @ApiProperty({ example: 120 })
  totalCertificatesGenerated: number;

  @ApiProperty({ example: 15 })
  certificatesThisMonth: number;

  @ApiProperty({ example: 45000 })
  totalEnergyCertified: number;

  @ApiProperty({ example: 36900 })
  totalCo2Offset: number;

  @ApiProperty({ example: 12000 })
  totalRewardsDistributed: number;
}

export class LatestCertificateSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'POG-2025-03-ABC12345' })
  certificateId: string;

  @ApiProperty({ example: 3 })
  month: number;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({ example: 500 })
  energyGenerated: number;

  @ApiProperty({ example: 100 })
  rewardAmount: number;

  @ApiProperty({ enum: AchievementLevel })
  achievementLevel: AchievementLevel;

  @ApiProperty()
  issueDate: Date;
}
