import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ isArray: true, description: 'Recent activity array' })
  recentActivity: {
    type: string;
    description: string;
    date: Date;
  }[];
}
