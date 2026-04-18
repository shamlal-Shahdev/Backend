import { ApiProperty } from '@nestjs/swagger';
export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: number;
  @ApiProperty({ description: 'User full name' })
  name: string;
  @ApiProperty({ description: 'Email address (verified, cannot be changed)' })
  email: string;
  @ApiProperty({ description: 'Phone number', required: false })
  phone: string | null;
  @ApiProperty({ description: 'Wallet address' })
  walletAddress: string;
  @ApiProperty({ description: 'User role' })
  role: string;
  @ApiProperty({ description: 'Email verification status' })
  isVerified: boolean;
  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}
