import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { KycSubmissionStatus } from '../../../kyc/kyc-submission-status.enum';

export class FilterUsersDto {
  @ApiProperty({
    required: false,
    example: 'user@example.com',
    description: 'Filter by email',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    required: false,
    example: '42101-1234567-1',
    description: 'Filter by CNIC number',
  })
  @IsOptional()
  @IsString()
  cnicNumber?: string;

  @ApiProperty({
    required: false,
    enum: KycSubmissionStatus,
    description: 'Filter by latest KYC submission status',
  })
  @IsOptional()
  @IsEnum(KycSubmissionStatus)
  kycStatus?: KycSubmissionStatus;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    example: 10,
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
