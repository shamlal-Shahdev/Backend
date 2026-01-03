import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApproveKycDto {
  @ApiProperty({ required: false, description: 'Optional approval note' })
  @IsOptional()
  @IsString()
  note?: string;
}
