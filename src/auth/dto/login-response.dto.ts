import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './auth-user-response.dto';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}
