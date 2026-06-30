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
import { RewardTransactionEntity } from '../reward-transaction/entity/reward-transaction.entity';
import { CouponPurchaseEntity } from '../coupon/entity/coupon-purchase.entity';
import {
  WithdrawalRequestEntity,
  WithdrawalStatus,
} from '../coupon/entity/withdrawal-request.entity';
import {
  EnergyRequestEntity,
  EnergyRequestStatus,
} from '../energy-request/entity/energy-request.entity';

@Injectable()
export class WalletBalanceService {
  private readonly logger = new Logger(WalletBalanceService.name);

  constructor(
    @InjectRepository(WalletBalanceEntity)
    private readonly walletBalanceRepository: Repository<WalletBalanceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RewardTransactionEntity)
    private readonly rewardTransactionRepository: Repository<RewardTransactionEntity>,
    @InjectRepository(CouponPurchaseEntity)
    private readonly couponPurchaseRepository: Repository<CouponPurchaseEntity>,
    @InjectRepository(WithdrawalRequestEntity)
    private readonly withdrawalRepository: Repository<WithdrawalRequestEntity>,
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
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

  async getLedgerBalance(userId: number): Promise<number> {
    const rewardsResult = await this.rewardTransactionRepository
      .createQueryBuilder('rt')
      .select('COALESCE(SUM(rt.tokens_amount), 0)', 'total')
      .where('rt.user_id = :userId', { userId })
      .getRawOne<{ total: string | null }>();

    const purchasesResult = await this.couponPurchaseRepository
      .createQueryBuilder('cp')
      .select('COALESCE(SUM(cp.tokens_used), 0)', 'total')
      .where('cp.user_id = :userId', { userId })
      .getRawOne<{ total: string | null }>();

    const salesResult = await this.couponPurchaseRepository
      .createQueryBuilder('cp')
      .select('COALESCE(SUM(cp.tokens_used), 0)', 'total')
      .where('cp.vendor_id = :userId', { userId })
      .getRawOne<{ total: string | null }>();

    const withdrawalsResult = await this.withdrawalRepository
      .createQueryBuilder('wr')
      .select('COALESCE(SUM(wr.amount), 0)', 'total')
      .where('wr.vendor_id = :userId', { userId })
      .andWhere('wr.status = :status', { status: WithdrawalStatus.APPROVED })
      .getRawOne<{ total: string | null }>();

    const energyRewardsResult = await this.energyRequestRepository
      .createQueryBuilder('er')
      .select('COALESCE(SUM(er.reward_amount), 0)', 'total')
      .where('er.user_id = :userId', { userId })
      .andWhere('er.status = :status', {
        status: EnergyRequestStatus.REWARD_GENERATED,
      })
      .getRawOne<{ total: string | null }>();

    const rewards = Number(rewardsResult?.total ?? 0);
    const energyRewards = Number(energyRewardsResult?.total ?? 0);
    const purchases = Number(purchasesResult?.total ?? 0);
    const sales = Number(salesResult?.total ?? 0);
    const withdrawals = Number(withdrawalsResult?.total ?? 0);

    const ledger =
      (Number.isFinite(rewards) ? rewards : 0) +
      (Number.isFinite(energyRewards) ? energyRewards : 0) +
      (Number.isFinite(sales) ? sales : 0) -
      (Number.isFinite(purchases) ? purchases : 0) -
      (Number.isFinite(withdrawals) ? withdrawals : 0);

    return Math.round((Number.isFinite(ledger) ? ledger : 0) * 1e8) / 1e8;
  }

  async refreshBalanceFromLedger(
    userId: number,
  ): Promise<WalletBalanceEntity> {
    const ledgerBalance = await this.getLedgerBalance(userId);
    const walletBalance = await this.getOrCreateWalletBalance(userId);
    walletBalance.balance = ledgerBalance;
    return this.walletBalanceRepository.save(walletBalance);
  }

  /**
   * Ensures on-chain WATT matches the ledger (rewards − purchases ± vendor flows).
   * Re-mints when the chain was reset but reward records still exist.
   */
  async reconcileOnChainWithLedger(
    userId: number,
  ): Promise<WalletBalanceEntity> {
    const walletBalance = await this.refreshBalanceFromLedger(userId);
    const ledgerBalance = parseFloat(walletBalance.balance.toString());

    const walletAddress =
      await this.userWalletService.getWalletAddressForUser(userId);
    if (!walletAddress) {
      return walletBalance;
    }

    const onChain = await this.tokenService.getUserBalance(walletAddress);
    const onChainBalance = parseFloat(onChain.formatted);

    if (onChainBalance + 1e-8 < ledgerBalance) {
      const toMint =
        Math.round((ledgerBalance - onChainBalance) * 1e8) / 1e8;
      if (toMint > 0) {
        this.logger.log(
          `Re-minting ${toMint} WATT for user ${userId} (ledger=${ledgerBalance}, on-chain=${onChainBalance})`,
        );
        await this.tokenService.mintTo(walletAddress, toMint);
      }
    }

    return walletBalance;
  }

  async syncBalanceFromBlockchain(userId: number): Promise<WalletBalanceEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.reconcileOnChainWithLedger(userId);
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
