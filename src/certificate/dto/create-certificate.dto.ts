import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
export class CreateCertificateDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;
  @ApiProperty({ example: 1 })
  @IsInt()
  installationId: number;
  @ApiProperty({ example: 1, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
  @ApiProperty({ example: 2024, minimum: 2000 })
  @IsInt()
  @Min(2000)
  year: number;
  @ApiProperty({ example: 1000.5 })
  @IsNumber()
  @Min(0)
  totalKwh: number;
  @ApiProperty({ example: 500.25 })
  @IsNumber()
  @Min(0)
  totalCo2Offset: number;
  @ApiProperty({ example: '/uploads/certificates/cert123.pdf' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  filePath: string;
}
