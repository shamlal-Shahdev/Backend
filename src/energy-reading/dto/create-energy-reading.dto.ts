import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsDate,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnergyReadingSource } from '../entity/energy-reading.entity';

export class CreateEnergyReadingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  deviceId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  installationId: number;

  @ApiProperty({ example: 125.5 })
  @IsNumber()
  @Min(0)
  rawKwh: number;

  @ApiProperty({ example: 125.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  verifiedKwh?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  verificationSignature?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  oracleId?: number;

  @ApiProperty({
    enum: EnergyReadingSource,
    default: EnergyReadingSource.DEVICE,
    required: false,
  })
  @IsOptional()
  @IsEnum(EnergyReadingSource)
  source?: EnergyReadingSource;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  receiptTx?: string;
}
