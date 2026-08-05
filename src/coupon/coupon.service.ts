import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThan, In } from 'typeorm';
import {
  CouponEntity,
  CouponStatus,
  CouponValueType,
} from './entity/coupon.entity';
import {
  CouponPurchaseEntity,
  CouponPurchaseStatus,
} from './entity/coupon-purchase.entity';
import {
  WithdrawalRequestEntity,
  WithdrawalStatus,
} from './entity/withdrawal-request.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WalletBalanceService } from '../wallet-balance/wallet-balance.service';
import { VendorCompanyProfileEntity } from '../vendor/company-profile/entity/vendor-company-profile.entity';
import { UserEntity, UserRole } from '../user/entity/user.entity';
import { TokenService } from '../blockchain/token.service';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { WalletService } from '../blockchain/wallet.service';

const WITHDRAWAL_MINIMUM = 5000;

const ACTIVE_WITHDRAWAL_STATUSES = [
  WithdrawalStatus.PENDING,
  WithdrawalStatus.IN_PROGRESS,
];

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    @InjectRepository(CouponPurchaseEntity)
    private readonly purchaseRepository: Repository<CouponPurchaseEntity>,
    @InjectRepository(WithdrawalRequestEntity)
    private readonly withdrawalRepository: Repository<WithdrawalRequestEntity>,
    @InjectRepository(VendorCompanyProfileEntity)
    private readonly vendorProfileRepository: Repository<VendorCompanyProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly walletBalanceService: WalletBalanceService,
    private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
    private readonly userWalletService: UserWalletService,
    private readonly walletService: WalletService,
  ) {}

  private async ensureOnChainWallet(userId: number): Promise<string> {
    const wallet = await this.userWalletService.findByUserId(userId);
    if (!wallet || !wallet.address) {
      throw new BadRequestException(
        'No connected wallet found. Please connect your MetaMask wallet in the Wallet section first.',
      );
    }
    return wallet.address;
  }


  private async getVendorName(vendorId: number): Promise<string> {
    const profile = await this.vendorProfileRepository.findOne({
      where: { userId: vendorId },
    });
    if (profile?.companyName) {
      return profile.companyName;
    }
    const user = await this.userRepository.findOne({ where: { id: vendorId } });
    return user?.name ?? 'Unknown Vendor';
  }

  private formatCouponListItem(coupon: CouponEntity, vendorName: string) {
    return {
      id: coupon.id,
      title: coupon.title,
      description: coupon.description,
      couponValue: parseFloat(coupon.couponValue.toString()),
      valueType: coupon.valueType ?? 'amount',
      tokenCost: parseFloat(coupon.tokenCost.toString()),
      quantity: coupon.quantity,
      expiryDate: coupon.expiryDate,
      termsAndConditions: coupon.termsAndConditions,
      imageUrl: coupon.imageUrl,
      vendorName,
      vendorId: coupon.vendorId,
      status: coupon.status,
      createdAt: coupon.createdAt,
    };
  }

  private resolvePurchaseStatus(
    purchase: CouponPurchaseEntity,
    expiryDate: Date,
  ): CouponPurchaseStatus {
    if (purchase.status === CouponPurchaseStatus.USED) {
      return CouponPurchaseStatus.USED;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(23, 59, 59, 999);
    if (expiry < today) {
      return CouponPurchaseStatus.EXPIRED;
    }
    return CouponPurchaseStatus.ACTIVE;
  }

  async createCoupon(
    vendorId: number,
    dto: CreateCouponDto,
  ): Promise<CouponEntity> {
    const valueType = dto.valueType ?? CouponValueType.AMOUNT;
    if (
      valueType === CouponValueType.PERCENTAGE &&
      (dto.couponValue < 1 || dto.couponValue > 100)
    ) {
      throw new BadRequestException('Percentage must be between 1 and 100');
    }

    const coupon = this.couponRepository.create({
      vendorId,
      title: dto.title,
      description: dto.description,
      couponValue: dto.couponValue,
      valueType,
      tokenCost: dto.tokenCost,
      quantity: dto.quantity,
      expiryDate: new Date(dto.expiryDate),
      termsAndConditions: dto.termsAndConditions,
      redemptionCode: dto.redemptionCode.trim(),
      imageUrl: dto.imageUrl ?? null,
      status: CouponStatus.ACTIVE,
    });
    return this.couponRepository.save(coupon);
  }

  async findMarketplaceCoupons(): Promise<unknown[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const coupons = await this.couponRepository.find({
      where: {
        status: CouponStatus.ACTIVE,
        quantity: MoreThan(0),
      },
      order: { createdAt: 'DESC' },
    });

    const active = coupons.filter((c) => new Date(c.expiryDate) >= today);

    return Promise.all(
      active.map(async (coupon) => {
        const vendorName = await this.getVendorName(coupon.vendorId);
        return this.formatCouponListItem(coupon, vendorName);
      }),
    );
  }

  async findCouponById(id: number): Promise<unknown> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    const vendorName = await this.getVendorName(coupon.vendorId);
    return this.formatCouponListItem(coupon, vendorName);
  }

  async purchaseCoupon(
    userId: number,
    couponId: number,
  ): Promise<{
    purchase: {
      id: number;
      tokensUsed: number;
      purchaseDate: Date;
      status: CouponPurchaseStatus;
      txHash: string | null;
      blockNumber: number | null;
    };
    remainingBalance: number;
    vendorName: string;
    expiryDate: Date;
    txHash: string;
    blockNumber: number;
  }> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${couponId} not found`);
    }
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('Coupon is not active');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(coupon.expiryDate) < today) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.quantity <= 0) {
      throw new BadRequestException('Coupon is out of stock');
    }
    const redemptionCode = coupon.redemptionCode?.trim();
    if (!redemptionCode) {
      throw new BadRequestException('Coupon is not available for purchase');
    }

    const tokenCost = parseFloat(coupon.tokenCost.toString());

    const userBalance =
      await this.walletBalanceService.reconcileOnChainWithLedger(userId);
    if (parseFloat(userBalance.balance.toString()) < tokenCost) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    await this.ensureOnChainWallet(userId);
    const vendorAddress = await this.ensureOnChainWallet(coupon.vendorId);

    const { txHash, blockNumber } = await this.tokenService.transferFromUser(
      userId,
      vendorAddress,
      tokenCost,
    );

    return this.dataSource.transaction(async (manager) => {
      const lockedCoupon = await manager.findOne(CouponEntity, {
        where: { id: couponId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedCoupon || lockedCoupon.quantity <= 0) {
        throw new BadRequestException('Coupon is out of stock');
      }
      const lockedCode = lockedCoupon.redemptionCode?.trim();
      if (!lockedCode) {
        throw new BadRequestException('Coupon is not available for purchase');
      }

      const userWallet = await this.walletBalanceService.deductBalance(
        userId,
        tokenCost,
      );
      await this.walletBalanceService.addBalance(coupon.vendorId, tokenCost);

      lockedCoupon.quantity -= 1;
      await manager.save(lockedCoupon);

      const purchase = manager.create(CouponPurchaseEntity, {
        userId,
        couponId: lockedCoupon.id,
        vendorId: lockedCoupon.vendorId,
        couponCode: lockedCode,
        tokensUsed: tokenCost,
        txHash,
        blockNumber,
        status: CouponPurchaseStatus.ACTIVE,
      });
      const savedPurchase = await manager.save(purchase);

      const vendorName = await this.getVendorName(lockedCoupon.vendorId);

      this.logger.log(
        `Coupon purchase complete: user=${userId} coupon=${couponId} tx=${txHash} block=${blockNumber}`,
      );

      return {
        purchase: {
          id: savedPurchase.id,
          tokensUsed: parseFloat(savedPurchase.tokensUsed.toString()),
          purchaseDate: savedPurchase.purchaseDate,
          status: savedPurchase.status,
          txHash: savedPurchase.txHash,
          blockNumber: savedPurchase.blockNumber,
        },
        remainingBalance: parseFloat(userWallet.balance.toString()),
        vendorName,
        expiryDate: lockedCoupon.expiryDate,
        txHash,
        blockNumber,
      };
    });
  }

  async getMyCoupons(userId: number): Promise<unknown[]> {
    const purchases = await this.purchaseRepository.find({
      where: { userId },
      relations: ['coupon'],
      order: { purchaseDate: 'DESC' },
    });

    return Promise.all(
      purchases.map(async (purchase) => {
        const vendorName = await this.getVendorName(purchase.vendorId);
        const status = this.resolvePurchaseStatus(
          purchase,
          purchase.coupon.expiryDate,
        );
        if (status !== purchase.status && purchase.status !== CouponPurchaseStatus.USED) {
          purchase.status = status;
          await this.purchaseRepository.save(purchase);
        }
        return {
          id: purchase.id,
          couponId: purchase.couponId,
          couponTitle: purchase.coupon.title,
          couponValue: parseFloat(purchase.coupon.couponValue.toString()),
          valueType: purchase.coupon.valueType ?? 'amount',
          vendorName,
          couponCode: purchase.couponCode,
          purchaseDate: purchase.purchaseDate,
          expiryDate: purchase.coupon.expiryDate,
          status,
          tokensUsed: parseFloat(purchase.tokensUsed.toString()),
        };
      }),
    );
  }

  async redeemCoupon(userId: number, purchaseId: number): Promise<unknown> {
    const purchase = await this.purchaseRepository.findOne({
      where: { id: purchaseId, userId },
      relations: ['coupon'],
    });
    if (!purchase) {
      throw new NotFoundException('Coupon purchase not found');
    }
    const status = this.resolvePurchaseStatus(
      purchase,
      purchase.coupon.expiryDate,
    );
    if (status === CouponPurchaseStatus.EXPIRED) {
      throw new BadRequestException('Coupon has expired');
    }
    if (status === CouponPurchaseStatus.USED) {
      throw new BadRequestException('Coupon has already been used');
    }
    purchase.status = CouponPurchaseStatus.USED;
    purchase.usedAt = new Date();
    await this.purchaseRepository.save(purchase);
    return {
      id: purchase.id,
      couponCode: purchase.couponCode,
      status: purchase.status,
      usedAt: purchase.usedAt,
    };
  }

  async findVendorCoupons(vendorId: number): Promise<unknown[]> {
    const coupons = await this.couponRepository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
    const soldCounts = await Promise.all(
      coupons.map(async (c) => {
        const count = await this.purchaseRepository.count({
          where: { couponId: c.id },
        });
        return count;
      }),
    );
    return coupons.map((coupon, i) => ({
      id: coupon.id,
      title: coupon.title,
      description: coupon.description,
      couponValue: parseFloat(coupon.couponValue.toString()),
      valueType: coupon.valueType ?? 'amount',
      tokenCost: parseFloat(coupon.tokenCost.toString()),
      quantity: coupon.quantity,
      sold: soldCounts[i],
      expiryDate: coupon.expiryDate,
      status: coupon.status,
      imageUrl: coupon.imageUrl,
      termsAndConditions: coupon.termsAndConditions,
      redemptionCode: coupon.redemptionCode,
      createdAt: coupon.createdAt,
    }));
  }

  async updateVendorCoupon(
    vendorId: number,
    couponId: number,
    dto: UpdateCouponDto,
  ): Promise<CouponEntity> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId, vendorId },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    if (dto.title !== undefined) coupon.title = dto.title;
    if (dto.description !== undefined) coupon.description = dto.description;
    if (dto.couponValue !== undefined) coupon.couponValue = dto.couponValue;
    if (dto.valueType !== undefined) coupon.valueType = dto.valueType;
    if (dto.tokenCost !== undefined) coupon.tokenCost = dto.tokenCost;
    if (dto.quantity !== undefined) coupon.quantity = dto.quantity;
    if (dto.expiryDate !== undefined) {
      coupon.expiryDate = new Date(dto.expiryDate);
    }
    if (dto.termsAndConditions !== undefined) {
      coupon.termsAndConditions = dto.termsAndConditions;
    }
    if (dto.redemptionCode !== undefined) {
      coupon.redemptionCode = dto.redemptionCode.trim();
    }
    if (dto.imageUrl !== undefined) coupon.imageUrl = dto.imageUrl ?? null;
    if (dto.status !== undefined) coupon.status = dto.status;

    const valueType = coupon.valueType ?? CouponValueType.AMOUNT;
    if (
      valueType === CouponValueType.PERCENTAGE &&
      (coupon.couponValue < 1 || coupon.couponValue > 100)
    ) {
      throw new BadRequestException('Percentage must be between 1 and 100');
    }

    return this.couponRepository.save(coupon);
  }

  async deleteVendorCoupon(vendorId: number, couponId: number): Promise<void> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId, vendorId },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    const purchaseCount = await this.purchaseRepository.count({
      where: { couponId },
    });
    if (purchaseCount > 0) {
      throw new BadRequestException(
        'Cannot delete coupon with existing purchases. Disable it instead.',
      );
    }
    await this.couponRepository.remove(coupon);
  }

  async disableVendorCoupon(
    vendorId: number,
    couponId: number,
  ): Promise<CouponEntity> {
    return this.updateVendorCoupon(vendorId, couponId, {
      status: CouponStatus.DISABLED,
    });
  }

  async getVendorDashboardStats(vendorId: number): Promise<unknown> {
    const coupons = await this.couponRepository.find({ where: { vendorId } });
    const totalCoupons = coupons.length;
    const totalSold = await this.purchaseRepository.count({
      where: { vendorId },
    });
    const wallet = await this.walletBalanceService.getOrCreateWalletBalance(
      vendorId,
    );
    const pendingWithdrawals = await this.withdrawalRepository.count({
      where: {
        vendorId,
        status: In(ACTIVE_WITHDRAWAL_STATUSES),
      },
    });
    return {
      totalCoupons,
      totalCouponsSold: totalSold,
      walletBalance: parseFloat(wallet.balance.toString()),
      pendingWithdrawals,
    };
  }

  async getVendorWallet(vendorId: number): Promise<unknown> {
    const wallet = await this.walletBalanceService.getOrCreateWalletBalance(
      vendorId,
    );
    const balance = parseFloat(wallet.balance.toString());
    const activeWithdrawals = await this.withdrawalRepository.find({
      where: {
        vendorId,
        status: In(ACTIVE_WITHDRAWAL_STATUSES),
      },
      order: { createdAt: 'DESC' },
    });
    const hasActiveWithdrawal = activeWithdrawals.length > 0;
    return {
      balance,
      canWithdraw: balance >= WITHDRAWAL_MINIMUM && !hasActiveWithdrawal,
      withdrawalMinimum: WITHDRAWAL_MINIMUM,
      hasActiveWithdrawal,
      pendingWithdrawals: activeWithdrawals,
    };
  }

  async createWithdrawalRequest(
    vendorId: number,
    dto: CreateWithdrawalDto,
  ): Promise<WithdrawalRequestEntity> {
    const wallet = await this.walletBalanceService.getOrCreateWalletBalance(
      vendorId,
    );
    const balance = parseFloat(wallet.balance.toString());
    if (balance < WITHDRAWAL_MINIMUM) {
      throw new BadRequestException(
        `Insufficient balance. Minimum ${WITHDRAWAL_MINIMUM.toLocaleString()} tokens required for withdrawal`,
      );
    }
    if (dto.amount > balance) {
      throw new BadRequestException('Insufficient balance for this withdrawal amount');
    }
    const active = await this.withdrawalRepository.count({
      where: {
        vendorId,
        status: In(ACTIVE_WITHDRAWAL_STATUSES),
      },
    });
    if (active > 0) {
      throw new BadRequestException(
        'You already have an active withdrawal request in progress',
      );
    }
    const request = this.withdrawalRepository.create({
      vendorId,
      amount: dto.amount,
      bankDetails: dto.bankDetails,
      status: WithdrawalStatus.PENDING,
    });
    return this.withdrawalRepository.save(request);
  }

  async getVendorWithdrawals(vendorId: number): Promise<WithdrawalRequestEntity[]> {
    return this.withdrawalRepository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAdminMarketplaceStats(): Promise<unknown> {
    const totalCoupons = await this.couponRepository.count();
    const totalVendors = await this.userRepository.count({
      where: { role: UserRole.VENDOR },
    });
    const couponsSold = await this.purchaseRepository.count();
    const tokensRedeemed = await this.purchaseRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.tokens_used), 0)', 'total')
      .getRawOne();
    const pendingWithdrawRequests = await this.withdrawalRepository.count({
      where: { status: In(ACTIVE_WITHDRAWAL_STATUSES) },
    });
    return {
      totalCoupons,
      totalVendors,
      couponsSold,
      tokensRedeemed: parseFloat(tokensRedeemed?.total ?? '0'),
      pendingWithdrawRequests,
    };
  }

  async getAllCouponsForAdmin(): Promise<unknown[]> {
    const coupons = await this.couponRepository.find({
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      coupons.map(async (coupon) => {
        const vendorName = await this.getVendorName(coupon.vendorId);
        const sold = await this.purchaseRepository.count({
          where: { couponId: coupon.id },
        });
        return {
          ...this.formatCouponListItem(coupon, vendorName),
          sold,
          termsAndConditions: coupon.termsAndConditions,
        };
      }),
    );
  }

  async adminDisableCoupon(couponId: number): Promise<CouponEntity> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    coupon.status = CouponStatus.DISABLED;
    return this.couponRepository.save(coupon);
  }

  async getAllWithdrawals(): Promise<unknown[]> {
    const requests = await this.withdrawalRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['vendor'],
    });
    return Promise.all(
      requests.map(async (req) => {
        const vendorName = await this.getVendorName(req.vendorId);
        return {
          id: req.id,
          vendorId: req.vendorId,
          vendorName,
          vendorEmail: req.vendor?.email,
          amount: parseFloat(req.amount.toString()),
          bankDetails: req.bankDetails,
          status: req.status,
          createdAt: req.createdAt,
          processedAt: req.processedAt,
        };
      }),
    );
  }

  async getVendorTransactions(vendorId: number): Promise<unknown[]> {
    const transactions = await this.purchaseRepository.find({
      where: { vendorId },
      relations: ['user', 'coupon'],
      order: { purchaseDate: 'DESC' },
    });
    
    return transactions.map(t => ({
      id: t.id,
      purchaseDate: t.purchaseDate,
      userName: t.user?.name ?? 'Unknown User',
      couponTitle: t.coupon?.title ?? 'Unknown Coupon',
      tokensUsed: parseFloat(t.tokensUsed.toString()),
      txHash: t.txHash,
      status: t.status,
    }));
  }

  async processWithdrawal(
    withdrawalId: number,
    status:
      | WithdrawalStatus.IN_PROGRESS
      | WithdrawalStatus.APPROVED
      | WithdrawalStatus.REJECTED,
  ): Promise<WithdrawalRequestEntity> {
    const request = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
    });
    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    const allowedTransitions: Partial<
      Record<WithdrawalStatus, WithdrawalStatus[]>
    > = {
      [WithdrawalStatus.PENDING]: [
        WithdrawalStatus.IN_PROGRESS,
        WithdrawalStatus.REJECTED,
      ],
      [WithdrawalStatus.IN_PROGRESS]: [
        WithdrawalStatus.APPROVED,
        WithdrawalStatus.REJECTED,
      ],
    };

    const nextStatuses = allowedTransitions[request.status] ?? [];
    if (!nextStatuses.includes(status)) {
      throw new BadRequestException(
        `Cannot change status from ${request.status} to ${status}`,
      );
    }

    if (status === WithdrawalStatus.APPROVED) {
      const amount = parseFloat(request.amount.toString());
      await this.walletBalanceService.deductBalance(request.vendorId, amount);
      request.processedAt = new Date();
    }

    if (status === WithdrawalStatus.REJECTED) {
      request.processedAt = new Date();
    }

    request.status = status;
    return this.withdrawalRepository.save(request);
  }
}
