import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import {
  InstallationType,
  InstallationStatus,
} from '../entity/installation.entity';

export class CreateInstallationDto {
  @ApiProperty({ example: 'Solar Farm Alpha' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    enum: InstallationType,
    example: InstallationType.ROOFTOP_SOLAR,
  })
  @IsEnum(InstallationType)
  installationType: InstallationType;

  @ApiProperty({ example: 50.5 })
  @IsNumber()
  @Min(0)
  capacityKw: number;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location: string;

  @ApiProperty({ example: 1, description: 'Vendor ID - User selects vendor from dropdown' })
  @IsNumber()
  @Min(1)
  vendorId: number;

  @ApiProperty({
    enum: InstallationStatus,
    default: InstallationStatus.SUBMITTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(InstallationStatus)
  status?: InstallationStatus;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
