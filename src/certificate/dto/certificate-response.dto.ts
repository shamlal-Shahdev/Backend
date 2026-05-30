import { ApiProperty } from '@nestjs/swagger';
import {
  AchievementLevel,
  CertificateStatus,
  SustainabilityBadge,
} from '../certificate.enums';

export class CertificateResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'POG-2025-03-ABC12345' })
  certificateId: string;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  installationId: number;

  @ApiProperty({ nullable: true })
  vendorId: number | null;

  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' })
  walletAddress: string;

  @ApiProperty({ example: 3 })
  month: number;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({ example: 500 })
  energyGenerated: number;

  @ApiProperty({ example: 410 })
  co2Offset: number;

  @ApiProperty({ example: 100 })
  rewardAmount: number;

  @ApiProperty({ example: 16 })
  treesEquivalent: number;

  @ApiProperty({ enum: AchievementLevel })
  achievementLevel: AchievementLevel;

  @ApiProperty({ enum: SustainabilityBadge })
  badge: SustainabilityBadge;

  @ApiProperty({ example: '0xabc123...' })
  transactionHash: string;

  @ApiProperty({ enum: CertificateStatus })
  status: CertificateStatus;

  @ApiProperty({ nullable: true })
  meterId: string | null;

  @ApiProperty({ nullable: true })
  verifiedAt: Date | null;

  @ApiProperty()
  issueDate: Date;

  @ApiProperty({ nullable: true })
  vendorName: string | null;

  @ApiProperty({ nullable: true })
  installationCapacityKw: number | null;
}
