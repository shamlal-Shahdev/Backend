import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpsertVendorCompanyProfileDto {
  @ApiProperty({ example: 'Solar Installers Ltd' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  companyName: string;

  @ApiProperty({ required: false, example: 'Karachi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @ApiProperty({ required: false, example: 'Sindh' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  province?: string;

  @ApiProperty({ required: false, example: 'Pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  country?: string;

  @ApiProperty({ required: false, example: 'Plot 12, Industrial Area' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine?: string;
}
