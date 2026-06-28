import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletBalanceEntity } from './entity/wallet-balance.entity';
import { CreateWalletBalanceDto } from './dto/create-wallet-balance.dto';
import { UpdateWalletBalanceDto } from './dto/update-wallet-balance.dto';
import { TokenService } from '../blockchain/token.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserWalletService } from '../user-wallet/user-wallet.service';

@Injectable()
export class WalletBalanceService {
  private readonly logger = new Logger(WalletBalanceService.name);

  constructor(
    @InjectRepository(WalletBalanceEntity)
    private readonly walletBalanceRepository: Repository<WalletBalanceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly tokenService: TokenService,
    private readonly userWalletService: UserWalletService,
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

  async getOrCreateWalletBalance(userId: number): Promise<WalletBalanceEntity> {
    let walletBalance = await this.walletBalanceRepository.findOne({
      where: { userId },
    });
    if (!walletBalance) {
      walletBalance = this.walletBalanceRepository.create({
        userId,
        balance: 0,
      });
      walletBalance = await this.walletBalanceRepository.save(walletBalance);
      this.logger.log(`Created wallet balance for user ${userId}`);
    }
    return walletBalance;
  }

  async syncBalanceFromBlockchain(userId: number): Promise<WalletBalanceEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const walletAddress =
      await this.userWalletService.getWalletAddressForUser(userId);
    if (!walletAddress) {
      throw new NotFoundException(
        `User ${userId} does not have an on-chain wallet yet`,
      );
    }
    const blockchainBalance = await this.tokenService.getUserBalance(
      walletAddress,
    );
    let walletBalance = await this.walletBalanceRepository.findOne({
      where: { userId },
    });
    if (!walletBalance) {
      walletBalance = this.walletBalanceRepository.create({
        userId,
        balance: parseFloat(blockchainBalance.formatted),
      });
    } else {
      walletBalance.balance = parseFloat(blockchainBalance.formatted);
    }
    walletBalance = await this.walletBalanceRepository.save(walletBalance);
    this.logger.log(
      `Synced balance for user ${userId}: ${blockchainBalance.formatted} WATT`,
    );
    return walletBalance;
  }

  async updateBalanceAfterReward(
    userId: number,
    rewardAmount: number,
  ): Promise<WalletBalanceEntity> {
    const walletBalance = await this.getOrCreateWalletBalance(userId);
    const currentBalance = parseFloat(walletBalance.balance.toString());
    walletBalance.balance = currentBalance + rewardAmount;
    return await this.walletBalanceRepository.save(walletBalance);
  }

  async deductBalance(
    userId: number,
    amount: number,
  ): Promise<WalletBalanceEntity> {
    const walletBalance = await this.getOrCreateWalletBalance(userId);
    const currentBalance = parseFloat(walletBalance.balance.toString());
    if (currentBalance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    walletBalance.balance = currentBalance - amount;
    return await this.walletBalanceRepository.save(walletBalance);
  }

  async addBalance(
    userId: number,
    amount: number,
  ): Promise<WalletBalanceEntity> {
    const walletBalance = await this.getOrCreateWalletBalance(userId);
    const currentBalance = parseFloat(walletBalance.balance.toString());
    walletBalance.balance = currentBalance + amount;
    return await this.walletBalanceRepository.save(walletBalance);
  }
}
