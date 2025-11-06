import { User } from '../../../users/domain/user';

export type JwtPayloadType = Pick<User, 'id' | 'email'> & {
  iat?: number;
  exp?: number;
};
