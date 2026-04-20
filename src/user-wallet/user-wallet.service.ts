import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWalletEntity } from './entity/user-wallet.entity';

@Injectable()
export class UserWalletService {
  constructor(
    @InjectRepository(UserWalletEntity)
    private readonly userWalletRepository: Repository<UserWalletEntity>,
  ) {}

  async findByUserId(userId: number): Promise<UserWalletEntity | null> {
    return this.userWalletRepository.findOne({ where: { userId } });
  }

  async findByUserIdOrFail(userId: number): Promise<UserWalletEntity> {
    const w = await this.findByUserId(userId);
    if (!w) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }
    return w;
  }

  async createForUser(
    userId: number,
    address: string,
    encryptedPrivateKey: string,
  ): Promise<UserWalletEntity> {
    const existingForUser = await this.findByUserId(userId);
    if (existingForUser) {
      return existingForUser;
    }
    const existingAddress = await this.userWalletRepository.findOne({
      where: { address },
    });
    if (existingAddress) {
      throw new ConflictException('Wallet address already in use');
    }
    const row = this.userWalletRepository.create({
      userId,
      address,
      encryptedPrivateKey,
    });
    return this.userWalletRepository.save(row);
  }

  async getWalletAddressForUser(userId: number): Promise<string | null> {
    const w = await this.findByUserId(userId);
    return w?.address ?? null;
  }

  /** Internal: loads encrypted private key for signing / rewards. */
  async findByUserIdWithPrivateKey(
    userId: number,
  ): Promise<UserWalletEntity | null> {
    return this.userWalletRepository
      .createQueryBuilder('w')
      .addSelect('w.encryptedPrivateKey')
      .where('w.user_id = :userId', { userId })
      .getOne();
  }
}
