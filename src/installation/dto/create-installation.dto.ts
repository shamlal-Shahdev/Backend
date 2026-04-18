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
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InstallationType,
  InstallationStatus,
} from '../entity/installation.entity';
import { PropertySegment } from '../property-segment';
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
  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0.01)
  capacityKw: number;
  @ApiProperty({
    enum: PropertySegment,
    example: PropertySegment.RESIDENTIAL_MEDIUM,
    description: 'Property / use-case segment; capacity kW must fall within the allowed range for this segment.',
  })
  @IsEnum(PropertySegment)
  propertySegment: PropertySegment;
  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location: string;
  @ApiProperty({
    required: false,
    example: 24.8607,
    description: 'Optional latitude from map picker (WGS84)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;
  @ApiProperty({
    required: false,
    example: 67.0011,
    description: 'Optional longitude from map picker (WGS84)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
  @ApiProperty({ example: 1, description: 'Vendor ID - User selects vendor from dropdown' })
  @IsNumber()
  @Min(1)
  vendorId: number;
  @ApiProperty({
    example: true,
    description: 'Whether rooftop space is available for solar panels',
  })
  @IsBoolean()
  rooftopAvailable: boolean;
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
