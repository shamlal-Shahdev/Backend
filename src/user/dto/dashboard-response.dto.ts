import { ApiProperty } from '@nestjs/swagger';
export class EnergyTrendData {
  @ApiProperty({ example: '2024-01' })
  month: string;
  @ApiProperty({ example: 125.5 })
  energy: number;
}
export class RewardDistributionData {
  @ApiProperty({ example: 'daily_reward' })
  category: string;
  @ApiProperty({ example: 500 })
  amount: number;
  @ApiProperty({ example: 58.8 })
  percentage: number;
}
export class CarbonReductionTrendData {
  @ApiProperty({ example: '2026-04' })
  month: string;

  @ApiProperty({ example: 42.64 })
  carbonReducedKg: number;
}
export class DashboardResponseDto {
  @ApiProperty({ example: 1250.5 })
  totalEnergyGenerated: number;
  @ApiProperty({ example: 850 })
  totalTokensEarned: number;
  @ApiProperty({ example: 500 })
  tokensRedeemed: number;
  @ApiProperty({ example: 350 })
  tokensAvailable: number;
  @ApiProperty({ example: 10 })
  activePredictions: number;
  @ApiProperty({ example: 3 })
  certificatesEarned: number;
  @ApiProperty({ example: 42.64, description: 'Carbon reduced in current month (kg CO2)' })
  monthlyCarbonReducedKg: number;
  @ApiProperty({ example: 300.22, description: 'Total carbon reduced across returned trend (kg CO2)' })
  totalCarbonReducedKg: number;
  @ApiProperty({ type: [EnergyTrendData], description: 'Energy generation trend by month' })
  energyGenerationTrend: EnergyTrendData[];
  @ApiProperty({ type: [CarbonReductionTrendData], description: 'Carbon reduction trend by month (kg CO2)' })
  carbonReductionTrend: CarbonReductionTrendData[];
  @ApiProperty({ type: [RewardDistributionData], description: 'Rewards distribution by category' })
  rewardsDistribution: RewardDistributionData[];
  @ApiProperty({ isArray: true, description: 'Recent activity array' })
  recentActivity: {
    type: string;
    description: string;
    date: Date;
    amount?: number;
  }[];
  @ApiProperty({ required: false, nullable: true })
  latestCertificate?: {
    id: number;
    certificateId: string;
    month: number;
    year: number;
    energyGenerated: number;
    rewardAmount: number;
    achievementLevel: string;
    issueDate: Date;
  } | null;
}
