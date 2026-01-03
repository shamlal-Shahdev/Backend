import { UserEntity as User } from '../../user/entity/user.entity';

export class Session {
  id: number | string;
  user: User;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
