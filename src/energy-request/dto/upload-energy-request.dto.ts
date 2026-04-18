import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max } from 'class-validator';
export class UploadEnergyRequestDto {
  @ApiProperty({ example: 'https://example.com/uploads/meter-image.jpg' })
  @IsString()
  meterImageUrl: string;
  @ApiProperty({ example: 1, description: 'Month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
  @ApiProperty({ example: 2024, description: 'Year' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
  @ApiProperty({ required: false, example: 'METER123456', description: 'Meter ID extracted from image (optional)' })
  @IsString()
  meterIdFromImage?: string;
}
