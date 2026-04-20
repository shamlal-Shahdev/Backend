import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EnergyRequestEntity,
  EnergyRequestStatus,
  KycMeterCrosscheck,
} from '../../energy-request/entity/energy-request.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { ApproveEnergyRequestDto } from '../../energy-request/dto/approve-energy-request.dto';
import { RejectEnergyRequestDto } from '../../energy-request/dto/reject-energy-request.dto';
import { EmailService } from '../../email/email.service';
import { TokenService } from '../../blockchain/token.service';
import { WalletBalanceService } from '../../wallet-balance/wallet-balance.service';
import { UserWalletService } from '../../user-wallet/user-wallet.service';

@Injectable()
export class AdminEnergyRequestService {
  private readonly logger = new Logger(AdminEnergyRequestService.name);

  constructor(
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly walletBalanceService: WalletBalanceService,
    private readonly userWalletService: UserWalletService,
  ) {}

  async getAllEnergyRequests(
    status?: EnergyRequestStatus,
  ): Promise<{ requests: EnergyRequestEntity[]; total: number }> {
    const where = status ? { status } : {};
    const [requests, total] = await this.energyRequestRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return { requests, total };
  }

  async getPendingEnergyRequests(): Promise<{
    requests: EnergyRequestEntity[];
    total: number;
  }> {
    const [requests, total] = await this.energyRequestRepository.findAndCount({
      where: { status: EnergyRequestStatus.PENDING },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return { requests, total };
  }

  async getEnergyRequestById(id: number): Promise<EnergyRequestEntity> {
    const request = await this.energyRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!request) {
      throw new NotFoundException(`Energy request ${id} not found`);
    }
    return request;
  }

  private verifyMeterCrosscheck(request: EnergyRequestEntity): boolean {
    if (request.kycMeterCrosscheck === KycMeterCrosscheck.MISMATCH) {
      this.logger.warn(
        `Energy request ${request.id}: KYC utility meter reference does not match OCR/submitted meter ID. Manual review required.`,
      );
      return false;
    }
    if (!request.meterIdFromImage && !request.ocrMeterIdCandidate) {
      this.logger.warn(
        `Energy request ${request.id}: No meter ID extracted or submitted.`,
      );
      return false;
    }
    return true;
  }

  private async verifyWalletAddressForUser(userId: number): Promise<boolean> {
    const addr = await this.userWalletService.getWalletAddressForUser(userId);
    if (!addr || addr.trim().length === 0) {
      return false;
    }
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(addr);
  }

  async approveEnergyRequest(
    requestId: number,
    adminId: number,
    dto: ApproveEnergyRequestDto,
  ): Promise<EnergyRequestEntity> {
    this.logger.log(`Admin ${adminId} attempting to approve request ${requestId}`);
    const request = await this.getEnergyRequestById(requestId);
    if (request.status !== EnergyRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve request with status ${request.status}. Only PENDING requests can be approved.`,
      );
    }
    const user = await this.userRepository.findOne({
      where: { id: request.userId },
    });
    if (!user) {
      throw new NotFoundException(`User ${request.userId} not found`);
    }
    if (request.userId === adminId) {
      throw new ForbiddenException(
        'Cannot approve your own energy request. Please ask another admin to review it.',
      );
    }
    const meterOk = this.verifyMeterCrosscheck(request);
    if (!meterOk) {
      this.logger.warn(
        `Meter verification flags for request ${requestId} require admin attention before relying on automated checks.`,
      );
    }
    const walletValid = await this.verifyWalletAddressForUser(request.userId);
    if (!walletValid) {
      throw new BadRequestException(
        `User ${request.userId} does not have a valid wallet address. Ensure KYC is approved so a wallet exists.`,
      );
    }
    const rewardAmount = dto.rewardAmount || 100;
    const blockchainResult = await this.triggerBlockchainReward(
      request.userId,
      rewardAmount,
    );
    if (blockchainResult.success && blockchainResult.txHash) {
      request.status = EnergyRequestStatus.REWARD_GENERATED;
      request.blockchainTxHash = blockchainResult.txHash;
      request.rewardAmount = rewardAmount;
      this.logger.log(
        `Request ${requestId} approved and reward generated. TX: ${blockchainResult.txHash}`,
      );
      try {
        await this.walletBalanceService.updateBalanceAfterReward(
          request.userId,
          rewardAmount,
        );
        this.logger.log(
          `Updated wallet balance for user ${request.userId} with reward ${rewardAmount}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to update wallet balance for user ${request.userId}:`,
          error,
        );
      }
    } else {
      request.status = EnergyRequestStatus.BLOCKCHAIN_FAILED;
      request.adminRemark = `Blockchain transaction failed: ${blockchainResult.error || 'Unknown error'}. ${dto.remark || ''}`.trim();
      this.logger.error(
        `Request ${requestId} approval failed due to blockchain error: ${blockchainResult.error}`,
      );
    }
    request.approvedByAdminId = adminId;
    if (dto.remark) {
      request.adminRemark =
        (request.adminRemark || '') +
        (request.adminRemark ? ' | ' : '') +
        dto.remark;
    }
    const savedRequest = await this.energyRequestRepository.save(request);
    try {
      if (blockchainResult.success && blockchainResult.txHash) {
        await this.emailService.sendEnergyRewardGeneratedEmail(
          user.email,
          user.name,
          request.month,
          request.year,
          rewardAmount,
          blockchainResult.txHash,
        );
        this.logger.log(`Reward generated email sent to ${user.email}`);
      } else {
        await this.emailService.sendEnergyRequestApprovedEmail(
          user.email,
          user.name,
          request.month,
          request.year,
          dto.remark,
        );
        this.logger.log(
          `Approval email sent to ${user.email} (blockchain pending)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email notification to ${user.email}:`,
        error,
      );
    }
    return savedRequest;
  }

  async rejectEnergyRequest(
    requestId: number,
    adminId: number,
    dto: RejectEnergyRequestDto,
  ): Promise<EnergyRequestEntity> {
    this.logger.log(`Admin ${adminId} attempting to reject request ${requestId}`);
    const request = await this.getEnergyRequestById(requestId);
    if (request.status !== EnergyRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject request with status ${request.status}. Only PENDING requests can be rejected.`,
      );
    }
    request.status = EnergyRequestStatus.REJECTED;
    request.adminRemark = dto.reason;
    request.approvedByAdminId = adminId;
    const savedRequest = await this.energyRequestRepository.save(request);
    this.logger.log(`Request ${requestId} rejected by admin ${adminId}`);
    const user = await this.userRepository.findOne({
      where: { id: request.userId },
    });
    if (user) {
      try {
        await this.emailService.sendEnergyRequestRejectedEmail(
          user.email,
          user.name,
          request.month,
          request.year,
          dto.reason,
        );
        this.logger.log(`Rejection email sent to ${user.email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send rejection email to ${user.email}:`,
          error,
        );
      }
    }
    return savedRequest;
  }

  private async triggerBlockchainReward(
    userId: number,
    rewardAmount: number,
  ): Promise<{ success: boolean; txHash: string | null; error: string | null }> {
    try {
      const walletAddress =
        await this.userWalletService.getWalletAddressForUser(userId);
      if (!walletAddress) {
        return {
          success: false,
          txHash: null,
          error: 'No wallet address for user',
        };
      }
      this.logger.log(
        `Triggering blockchain reward for user ${userId}: ${rewardAmount} tokens to ${walletAddress}`,
      );
      const { txHash } = await this.tokenService.mintTo(
        walletAddress,
        rewardAmount,
      );
      this.logger.log(`Blockchain transaction successful: ${txHash}`);
      return {
        success: true,
        txHash,
        error: null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown blockchain error';
      this.logger.error(`Blockchain error for user ${userId}: ${message}`, error);
      return {
        success: false,
        txHash: null,
        error: message,
      };
    }
  }
}
