import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../../user/entity/user.entity';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { EmailService } from '../../email/email.service';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { WalletService } from '../../blockchain/wallet.service';
import { WalletBalanceService } from '../../wallet-balance/wallet-balance.service';
import { UserWalletService } from '../../user-wallet/user-wallet.service';
import { KycSubmissionStatus } from '../../kyc/kyc-submission-status.enum';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '../../audit-log/audit-action.enum';

@Injectable()
export class AdminKycService {
  private readonly logger = new Logger(AdminKycService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
    private readonly emailService: EmailService,
    private readonly walletService: WalletService,
    private readonly walletBalanceService: WalletBalanceService,
    private readonly userWalletService: UserWalletService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getUsersWithKycStatus() {
    const users = await this.userRepository.find({
      where: { role: UserRole.USER },
      relations: ['kycDocuments'],
      order: { createdAt: 'DESC' },
    });
    const usersWithKyc = users.map((user) => {
      const docs = [...(user.kycDocuments || [])].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
      const latest = docs[0];
      const kycStatus =
        latest?.status ?? KycSubmissionStatus.NOT_SUBMITTED;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        kycStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        kycDocuments: user.kycDocuments || [],
        kycDocumentsCount: (user.kycDocuments || []).length,
      };
    });
    this.logger.log(
      `Retrieved ${usersWithKyc.length} users with KYC information`,
    );
    return {
      users: usersWithKyc,
      total: usersWithKyc.length,
    };
  }

  async approveKyc(userId: number, adminId: number, dto: ApproveKycDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const kycDocuments = await this.kycRepository.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
    if (kycDocuments.length === 0) {
      throw new NotFoundException('KYC documents not found for this user');
    }
    const now = new Date();
    for (const doc of kycDocuments) {
      doc.reviewedAt = now;
      doc.status = KycSubmissionStatus.APPROVED;
      doc.rejectionReason = null;
      if (dto.note) {
        doc.adminNotes = dto.note;
      }
    }
    await this.kycRepository.save(kycDocuments);

    let wallet = await this.userWalletService.findByUserId(userId);
    if (!wallet) {
      const { address, encryptedPrivateKey } =
        this.walletService.createWallet();
      wallet = await this.userWalletService.createForUser(
        userId,
        address,
        encryptedPrivateKey,
      );
      this.logger.log(`Created blockchain wallet for user ${userId}: ${address}`);
    }
    await this.walletBalanceService.getOrCreateWalletBalance(userId);
    this.logger.log(`Ensured wallet balance record for user ${userId}`);

    try {
      await this.emailService.sendKycApprovalEmail(
        user.email,
        user.name,
        dto.note,
      );
      this.logger.log(`KYC approval email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send KYC approval email to ${user.email}:`,
        error,
      );
    }
    this.logger.log(`KYC approved for user ${userId} by admin ${adminId}`);
    try {
      await this.auditLogService.append({
        actorUserId: adminId,
        action: AuditAction.KYC_APPROVED,
        entityType: 'user',
        entityId: String(userId),
        metadata: { note: dto.note ?? null },
      });
    } catch (err) {
      this.logger.error('Failed to write audit log for KYC approve', err);
    }
    return {
      message: 'KYC approved successfully',
      userId,
      status: 'approved',
    };
  }

  async rejectKyc(userId: number, adminId: number, dto: RejectKycDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const kycDocuments = await this.kycRepository.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
    if (kycDocuments.length === 0) {
      throw new NotFoundException('KYC documents not found for this user');
    }
    const now = new Date();
    for (const doc of kycDocuments) {
      doc.reviewedAt = now;
      doc.status = KycSubmissionStatus.REJECTED;
      doc.rejectionReason = dto.reason;
      doc.adminNotes = dto.reason;
    }
    await this.kycRepository.save(kycDocuments);

    try {
      await this.emailService.sendKycRejectionEmail(
        user.email,
        user.name,
        dto.reason,
      );
      this.logger.log(`KYC rejection email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send KYC rejection email to ${user.email}:`,
        error,
      );
    }
    this.logger.log(`KYC rejected for user ${userId} by admin ${adminId}`);
    try {
      await this.auditLogService.append({
        actorUserId: adminId,
        action: AuditAction.KYC_REJECTED,
        entityType: 'user',
        entityId: String(userId),
        metadata: { reason: dto.reason },
      });
    } catch (err) {
      this.logger.error('Failed to write audit log for KYC reject', err);
    }
    return {
      message: 'KYC rejected successfully',
      userId,
      status: 'rejected',
      reason: dto.reason,
    };
  }

  async requestDocuments(
    userId: number,
    adminId: number,
    dto: RequestDocumentsDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const kycDocuments = await this.kycRepository.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
    if (kycDocuments.length > 0) {
      for (const doc of kycDocuments) {
        doc.status = KycSubmissionStatus.ADDITIONAL_DOCS_REQUIRED;
      }
      await this.kycRepository.save(kycDocuments);
    }
    this.logger.log(
      `Document request recorded for user ${userId} by admin ${adminId}`,
    );
    try {
      await this.auditLogService.append({
        actorUserId: adminId,
        action: AuditAction.KYC_DOCUMENTS_REQUESTED,
        entityType: 'user',
        entityId: String(userId),
        metadata: { documentTypes: dto.documentTypes },
      });
    } catch (err) {
      this.logger.error('Failed to write audit log for KYC document request', err);
    }
    return {
      message: 'Document request sent successfully',
      userId,
      requestedDocuments: dto.documentTypes,
    };
  }

  async getUserKycDocuments(
    userId: number,
  ): Promise<{ documents: KycEntity[]; userId: number; total: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const kycDocuments = await this.kycRepository.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
      relations: ['user'],
    });
    this.logger.log(
      `Retrieved ${kycDocuments.length} KYC documents for user ${userId}`,
    );
    return {
      documents: kycDocuments,
      userId,
      total: kycDocuments.length,
    };
  }
}
