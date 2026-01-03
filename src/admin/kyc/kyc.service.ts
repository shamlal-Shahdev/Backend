import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, KycStatus } from '../../user/entity/user.entity';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { EmailService } from '../../email/email.service';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';

@Injectable()
export class AdminKycService {
  private readonly logger = new Logger(AdminKycService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
    private readonly emailService: EmailService,
  ) {}

  async getUsersWithKycStatus() {
    const users = await this.userRepository.find({
      relations: ['kycDocuments'],
      order: { createdAt: 'DESC' },
    });

    // Format response to include user info and their KYC documents
    const usersWithKyc = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      kycDocuments: user.kycDocuments || [],
      kycDocumentsCount: (user.kycDocuments || []).length,
    }));

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

    // Update KYC documents with admin notes and reviewed date
    for (const doc of kycDocuments) {
      doc.reviewedAt = new Date();
      if (dto.note) {
        doc.adminNotes = dto.note;
      }
      await this.kycRepository.save(doc);
    }

    // Update user KYC status
    user.kycStatus = KycStatus.APPROVED;
    await this.userRepository.save(user);

    // TODO: Send approval email when email template is available
    // await this.emailService.sendKycApprovalEmail(user.email, user.name, dto.note);

    this.logger.log(`KYC approved for user ${userId} by admin ${adminId}`);

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

    // Update KYC documents with rejection reason and reviewed date
    for (const doc of kycDocuments) {
      doc.reviewedAt = new Date();
      doc.adminNotes = dto.reason;
      await this.kycRepository.save(doc);
    }

    // Update user KYC status
    user.kycStatus = KycStatus.REJECTED;
    await this.userRepository.save(user);

    // TODO: Send rejection email when email template is available
    // await this.emailService.sendKycRejectionEmail(user.email, user.name, dto.reason);

    this.logger.log(`KYC rejected for user ${userId} by admin ${adminId}`);

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

    // TODO: Send document request email when email template is available
    // await this.emailService.sendKycDocumentRequestEmail(user.email, user.name, dto.documentTypes, dto.message);

    this.logger.log(
      `Document request sent to user ${userId} by admin ${adminId}`,
    );

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
    console.log(kycDocuments);
    console.log(user);

    return {
      documents: kycDocuments,
      userId,
      total: kycDocuments.length,
    };
  }
}
