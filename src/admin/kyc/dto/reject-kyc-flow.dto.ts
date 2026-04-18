import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class RejectKycFlowDto {
  @ApiProperty({ example: 'Documents are unclear or invalid' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}
