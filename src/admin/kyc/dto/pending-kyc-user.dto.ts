import { ApiProperty } from '@nestjs/swagger';

export class PendingKycUserDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string | null;

  @ApiProperty()
  submittedAt: Date;

  @ApiProperty({ isArray: true, description: 'Array of KYC documents' })
  documents: {
    id: number;
    docType: string;
    filePath: string;
    submittedAt: Date;
  }[];
}
