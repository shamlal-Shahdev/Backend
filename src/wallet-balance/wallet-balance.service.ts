import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletBalanceEntity } from './entity/wallet-balance.entity';
import { CreateWalletBalanceDto } from './dto/create-wallet-balance.dto';
import { UpdateWalletBalanceDto } from './dto/update-wallet-balance.dto';

@Injectable()
export class WalletBalanceService {
  constructor(
    @InjectRepository(WalletBalanceEntity)
    private readonly walletBalanceRepository: Repository<WalletBalanceEntity>,
  ) {}

  async create(
    createWalletBalanceDto: CreateWalletBalanceDto,
  ): Promise<WalletBalanceEntity> {
    const existingBalance = await this.walletBalanceRepository.findOne({
      where: { userId: createWalletBalanceDto.userId },
    });

    if (existingBalance) {
      throw new ConflictException(
        'Wallet balance for this user already exists',
      );
    }

    const walletBalance = this.walletBalanceRepository.create(
      createWalletBalanceDto,
    );
    return await this.walletBalanceRepository.save(walletBalance);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[WalletBalanceEntity[], number]> {
    const [data, total] = await this.walletBalanceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<WalletBalanceEntity> {
    const walletBalance = await this.walletBalanceRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!walletBalance) {
      throw new NotFoundException(`Wallet Balance with ID ${id} not found`);
    }

    return walletBalance;
  }

  async findByUserId(userId: number): Promise<WalletBalanceEntity> {
    const walletBalance = await this.walletBalanceRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!walletBalance) {
      throw new NotFoundException(
        `Wallet Balance for user ID ${userId} not found`,
      );
    }

    return walletBalance;
  }

  async update(
    id: number,
    updateWalletBalanceDto: UpdateWalletBalanceDto,
  ): Promise<WalletBalanceEntity> {
    const walletBalance = await this.findOne(id);
    Object.assign(walletBalance, updateWalletBalanceDto);
    return await this.walletBalanceRepository.save(walletBalance);
  }

  async remove(id: number): Promise<void> {
    const walletBalance = await this.findOne(id);
    await this.walletBalanceRepository.remove(walletBalance);
  }
}
