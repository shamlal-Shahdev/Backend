import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardResponseDto {
  @ApiProperty()
  users: {
    total: number;
    verified: number;
  };

  @ApiProperty()
  kyc: {
    pending: number;
    inReview: number;
    approved: number;
    rejected: number;
  };
}
