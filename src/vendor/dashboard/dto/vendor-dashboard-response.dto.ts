import { ApiProperty } from '@nestjs/swagger';

export class VendorDashboardResponseDto {
  @ApiProperty()
  installations: {
    submitted: number;
    assigned: number;
    inProgress: number;
    completed: number;
    rejected: number;
  };
}
