import { ApiProperty } from '@nestjs/swagger';
import { KycSubmissionStatus } from '../kyc-submission-status.enum';

export class KycStatusResponseDto {
  @ApiProperty({ enum: KycSubmissionStatus, example: KycSubmissionStatus.PENDING })
  status: KycSubmissionStatus;

  @ApiProperty()
  userId: number;

  @ApiProperty({ required: false })
  rejectionReason?: string | null;

  @ApiProperty({ required: false, type: 'array' })
  documents?: Array<{
    id: number;
    docType: string;
    status: string;
    submittedAt: Date;
    adminNotes?: string | null;
  }>;
}
