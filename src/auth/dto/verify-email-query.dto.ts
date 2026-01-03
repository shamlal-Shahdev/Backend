import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailQueryDto {
  @ApiProperty({
    example: 'verification-token-here',
    type: String,
    description: 'Email verification token',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}
