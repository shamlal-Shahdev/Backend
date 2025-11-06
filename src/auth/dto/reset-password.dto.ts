import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-here', type: String })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'newpassword123', type: String })
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

