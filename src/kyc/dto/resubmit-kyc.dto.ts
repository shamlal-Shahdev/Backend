import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResubmitKycDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'New CNIC front image',
  })
  @IsOptional()
  cnicFront?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'New CNIC back image',
  })
  @IsOptional()
  cnicBack?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'New selfie image',
  })
  @IsOptional()
  selfie?: Express.Multer.File;

  @ApiProperty({ required: false, description: 'Additional notes for resubmission' })
  @IsOptional()
  @IsString()
  notes?: string;
}

