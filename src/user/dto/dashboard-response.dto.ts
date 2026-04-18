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
  @ApiProperty({ type: [EnergyTrendData], description: 'Energy generation trend by month' })
  energyGenerationTrend: EnergyTrendData[];
  @ApiProperty({ type: [RewardDistributionData], description: 'Rewards distribution by category' })
  rewardsDistribution: RewardDistributionData[];
  @ApiProperty({ isArray: true, description: 'Recent activity array' })
  recentActivity: {
    type: string;
    description: string;
    date: Date;
    amount?: number;
  }[];
}
