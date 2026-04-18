import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
export class RejectEnergyRequestDto {
  @ApiProperty({ example: 'Meter ID does not match utility bill or image quality is insufficient.' })
  @IsString()
  @MinLength(10)
  reason: string;
}
