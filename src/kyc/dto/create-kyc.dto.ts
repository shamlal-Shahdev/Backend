import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, MaxLength } from 'class-validator';
export class CreateKycDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;
  @ApiProperty({
    example: 'https://example.com/uploads/kyc/cnic-front.jpg',
    description: 'URL of the CNIC front side image',
  })
  @IsString()
  CnicFrontUrl: string;
  @ApiProperty({
    example: 'https://example.com/uploads/kyc/cnic-back.jpg',
    description: 'URL of the CNIC back side image',
  })
  @IsString()
  CnicBackUrl: string;
  @ApiProperty({
    example: 'https://example.com/uploads/kyc/selfie.jpg',
    description: 'URL of the selfie image',
  })
  @IsString()
  SelfieUrl: string;
  @ApiProperty({
    example: 'https://example.com/uploads/kyc/utility-bill.pdf',
    description: 'URL of the utility bill document',
  })
  @IsString()
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
    example: '12345678901',
    description: 'Consumer number / meter reference as printed on the utility bill (optional; used to cross-check smart meter uploads)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  utilityMeterReference?: string;
  @ApiProperty({
    required: false,
    example: 'Additional notes from admin',
    description: 'Admin notes (optional)',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
