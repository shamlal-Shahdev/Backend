import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserEntity, UserRole } from '../../../../user/entity/user.entity';
@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}
  async run() {
    const countAdmin = await this.repository.count({
      where: {
        email: 'admin@example.com',
      },
    });
    if (!countAdmin) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);
      await this.repository.save(
        this.repository.create({
          name: 'Super Admin',
          email: 'admin@example.com',
          passwordHash: password,
          walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          role: UserRole.ADMIN,
          isVerified: true,
          verificationToken: null,
          resetToken: null,
        }),
      );
    }
    const countUser = await this.repository.count({
      where: {
        email: 'john.doe@example.com',
      },
    });
    if (!countUser) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);
      await this.repository.save(
        this.repository.create({
          name: 'John Doe',
          email: 'john.doe@example.com',
          passwordHash: password,
          walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          role: UserRole.USER,
          isVerified: true,
          verificationToken: null,
          resetToken: null,
        }),
      );
    }
  }
}
