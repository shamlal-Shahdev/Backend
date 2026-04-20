import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserEntity, UserRole } from '../../../../user/entity/user.entity';
import { UserWalletEntity } from '../../../../user-wallet/entity/user-wallet.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
    @InjectRepository(UserWalletEntity)
    private walletRepository: Repository<UserWalletEntity>,
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
      const user = await this.repository.save(
        this.repository.create({
          name: 'John Doe',
          email: 'john.doe@example.com',
          passwordHash: password,
          role: UserRole.USER,
          isVerified: true,
          verificationToken: null,
          resetToken: null,
        }),
      );
      const devAddress = `0x${'a'.repeat(40)}`;
      await this.walletRepository.save(
        this.walletRepository.create({
          userId: user.id,
          address: devAddress,
          encryptedPrivateKey: null,
        }),
      );
    }
  }
}
