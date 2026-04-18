import { ApiProperty } from '@nestjs/swagger';
import { KycStatus } from '../../user/entity/user.entity';
export class KycStatusResponseDto {
  @ApiProperty({ enum: KycStatus, example: KycStatus.PENDING })
  status: KycStatus;
  @ApiProperty({ example: 1 })
  userId: number;
  @ApiProperty({
    required: false,
    nullable: true,
    example:
      'Documents are unclear. Please resubmit with better quality images.',
    description:
      'Rejection reason or admin feedback (only present if KYC was rejected)',
  })
  rejectionReason?: string | null;
  @ApiProperty({
    required: false,
    type: [Object],
    description:
      'List of submitted KYC documents with their status and admin notes',
  })
  documents?: Array<{
    id: number;
    docType: string;
    status: string;
    submittedAt: Date;
    adminNotes?: string | null;
  }>;
}
