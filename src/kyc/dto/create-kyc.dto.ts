import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateKycDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({
    example: 'https://example.com/uploads/kyc/cnic-front.jpg',
    description: 'URL of the CNIC front side image',
  })
  @IsString()
  // @IsUrl()
  CnicFrontUrl: string;

  @ApiProperty({
    example: 'https://example.com/uploads/kyc/cnic-back.jpg',
    description: 'URL of the CNIC back side image',
  })
  @IsString()
  // @IsUrl()
  CnicBackUrl: string;

  @ApiProperty({
    example: 'https://example.com/uploads/kyc/selfie.jpg',
    description: 'URL of the selfie image',
  })
  @IsString()
  // @IsUrl()
  SelfieUrl: string;

  @ApiProperty({
    example: 'https://example.com/uploads/kyc/utility-bill.pdf',
    description: 'URL of the utility bill document',
  })
  @IsString()
  // @IsUrl()
  UtilityBillUrl: string;

  @ApiProperty({ example: 'Karachi' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Sindh' })
  @IsString()
  province: string;

  @ApiProperty({ example: 'Pakistan' })
  @IsString()
  country: string;

  @ApiProperty({
    required: false,
    example: 'Additional notes from admin',
    description: 'Admin notes (optional)',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
