import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  user: User;
}
