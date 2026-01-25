import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardResponseDto {
  @ApiProperty()
  kyc: {
    pending: number;
    inReview: number;
    approved: number;
    rejected: number;
  };

  @ApiProperty()
  installations: {
    submitted: number;
    assigned: number;
    inProgress: number;
    completed: number;
    rejected: number;
  };

  @ApiProperty()
  energyRequests: {
    pending: number;
    approved: number;
    rejected: number;
    rewardGenerated: number;
    blockchainFailed: number;
  };
}
