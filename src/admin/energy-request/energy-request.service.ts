import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyRequestEntity, EnergyRequestStatus } from '../../energy-request/entity/energy-request.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { ApproveEnergyRequestDto } from '../../energy-request/dto/approve-energy-request.dto';
import { RejectEnergyRequestDto } from '../../energy-request/dto/reject-energy-request.dto';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { EmailService } from '../../email/email.service';
import { TokenService } from '../../blockchain/token.service';
import { WalletBalanceService } from '../../wallet-balance/wallet-balance.service';

@Injectable()
export class AdminEnergyRequestService {
  private readonly logger = new Logger(AdminEnergyRequestService.name);

  constructor(
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly walletBalanceService: WalletBalanceService,
  ) {}

  /**
   * Get all pending energy requests
   */
  async getPendingEnergyRequests(): Promise<{
    requests: EnergyRequestEntity[];
    total: number;
  }> {
    const requests = await this.energyRequestRepository.find({
      where: { status: EnergyRequestStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    this.logger.log(`Retrieved ${requests.length} pending energy requests`);

    return {
      requests,
      total: requests.length,
    };
  }

  /**
   * Get all energy requests with optional status filter
   */
  async getAllEnergyRequests(status?: EnergyRequestStatus): Promise<{
    requests: EnergyRequestEntity[];
    total: number;
  }> {
    const where = status ? { status } : {};
    const requests = await this.energyRequestRepository.find({
      where,
      relations: ['user', 'approvedByAdmin'],
      order: { createdAt: 'DESC' },
    });

    return {
      requests,
      total: requests.length,
    };
  }

  /**
   * Get energy request by ID
   */
  async getEnergyRequestById(id: number): Promise<EnergyRequestEntity> {
    const request = await this.energyRequestRepository.findOne({
      where: { id },
      relations: ['user', 'approvedByAdmin'],
    });

    if (!request) {
      throw new NotFoundException(`Energy request with ID ${id} not found`);
    }

    return request;
  }

  /**
   * Verify meter ID from image matches utility bill meter ID
   */
  private async verifyMeterId(userId: number, meterIdFromImage: string | null): Promise<boolean> {
    if (!meterIdFromImage) {
      // If meter ID not provided, we can't verify - this is a soft check
      // In a real implementation, you might use OCR to extract from utility bill
      return false;
    }

    // Get user's KYC documents to check utility bill
    const kycDocuments = await this.kycRepository.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });

    if (kycDocuments.length === 0) {
      this.logger.warn(`User ${userId} has no KYC documents for meter ID verification`);
      return false;
    }

    // In a real implementation, you would:
    // 1. Extract meter ID from utility bill image (using OCR)
    // 2. Compare with meterIdFromImage
    // For now, we'll just log that verification would happen here
    this.logger.log(
      `Meter ID verification needed: Image=${meterIdFromImage}, User=${userId}`,
    );

    // Placeholder: return true if meter ID is provided (actual verification would use OCR)
    return true;
  }

  /**
   * Verify user wallet address exists and is valid
   */
  private async verifyWalletAddress(user: UserEntity): Promise<boolean> {
    if (!user.walletAddress || user.walletAddress.trim().length === 0) {
      return false;
    }

    // Basic validation: Ethereum address format (0x followed by 40 hex characters)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(user.walletAddress);
  }

  /**
   * Approve energy request and generate reward
   */
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

    // Get user with relations
    const user = await this.userRepository.findOne({
      where: { id: request.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${request.userId} not found`);
    }

    // Prevent admin from approving their own request
    if (request.userId === adminId) {
      throw new ForbiddenException('Cannot approve your own energy request. Please ask another admin to review it.');
    }

    // Verify meter ID from image matches utility bill meter ID
    const meterIdVerified = await this.verifyMeterId(
      request.userId,
      request.meterIdFromImage || null,
    );

    if (!meterIdVerified && request.meterIdFromImage) {
      this.logger.warn(
        `Meter ID verification failed for request ${requestId}. Admin should manually verify.`,
      );
      // Don't block approval - admin can override
    }

    // Verify user wallet address exists and is valid
    const walletValid = await this.verifyWalletAddress(user);

    if (!walletValid) {
      throw new BadRequestException(
        `User ${request.userId} does not have a valid wallet address. Please update the wallet address before approving.`,
      );
    }

    // Calculate reward amount (use provided amount or default calculation)
    const rewardAmount = dto.rewardAmount || 100; // Default reward amount

    // Trigger smart contract to generate reward
    const blockchainResult = await this.triggerBlockchainReward(user, rewardAmount);

    // Update request based on blockchain result
    if (blockchainResult.success && blockchainResult.txHash) {
      request.status = EnergyRequestStatus.REWARD_GENERATED;
      request.blockchainTxHash = blockchainResult.txHash;
      request.rewardAmount = rewardAmount;
      this.logger.log(
        `Request ${requestId} approved and reward generated. TX: ${blockchainResult.txHash}`,
      );

      // Update wallet balance in database
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
        // Don't throw - reward was already minted on blockchain
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
      request.adminRemark = (request.adminRemark || '') + (request.adminRemark ? ' | ' : '') + dto.remark;
    }

    const savedRequest = await this.energyRequestRepository.save(request);

    // Send email notification based on outcome
    try {
      if (blockchainResult.success && blockchainResult.txHash) {
        // Reward generated successfully
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
        // Approved but blockchain failed
        await this.emailService.sendEnergyRequestApprovedEmail(
          user.email,
          user.name,
          request.month,
          request.year,
          dto.remark,
        );
        this.logger.log(`Approval email sent to ${user.email} (blockchain pending)`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email notification to ${user.email}:`,
        error,
      );
      // Don't throw error - approval should succeed even if email fails
    }

    return savedRequest;
  }

  /**
   * Reject energy request
   */
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

    // Send rejection email notification
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
        // Don't throw error - rejection should succeed even if email fails
      }
    }

    return savedRequest;
  }

    /**
   * Trigger smart contract to generate reward
   */
    private async triggerBlockchainReward(
      user: UserEntity,
      rewardAmount: number,
    ): Promise<{ success: boolean; txHash: string | null; error: string | null }> {
      try {
        this.logger.log(
          `Triggering blockchain reward for user ${user.id}: ${rewardAmount} tokens to ${user.walletAddress}`,
        );
  
        const { txHash } = await this.tokenService.mintTo(
          user.walletAddress,
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
  
        this.logger.error(
          `Blockchain error for user ${user.id}: ${message}`,
          error,
        );
  
        return {
          success: false,
          txHash: null,
          error: message,
        };
      }
    }
}

