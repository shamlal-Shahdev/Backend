import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../user/entity/user.entity';
import { KycSubmissionStatus } from '../../kyc/kyc-submission-status.enum';

/** Sanitized user payload returned from login / vendor login (no secrets). */
export class AuthUserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ required: false, description: 'End-user on-chain address after KYC approval' })
  walletAddress?: string | null;

  @ApiProperty({ enum: KycSubmissionStatus, required: false })
  kycStatus?: KycSubmissionStatus;

  @ApiProperty({ required: false })
  companyName?: string | null;

  @ApiProperty({
    required: false,
    description: 'True when vendor has saved company profile',
  })
  companyProfileComplete?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
