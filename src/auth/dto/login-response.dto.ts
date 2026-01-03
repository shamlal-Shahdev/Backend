import { ApiProperty } from '@nestjs/swagger';
import { UserEntity as User } from '../../user/entity/user.entity';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  user: User;
}
