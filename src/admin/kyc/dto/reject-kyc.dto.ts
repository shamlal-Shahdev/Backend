import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
export class RejectKycDto {
  @ApiProperty({
    example: 'Document quality is poor',
    description: 'Reason for rejection',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
