import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { KycRepository } from '../kyc/infrastructure/persistence/relational/repositories/kyc.repository';
import { AuditLogRepository } from '../kyc/infrastructure/persistence/relational/repositories/audit-log.repository';
import { EmailService } from '../email/email.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { KycStatus, AuditAction } from '../kyc/infrastructure/persistence/relational/entities';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly kycRepository: KycRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly emailService: EmailService,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const verifiedUsers = await this.userRepository.count({
      where: { isVerified: true },
    });

    const allKyc = await this.kycRepository.findAll();
    const pendingKyc = allKyc.filter((k) => k.status === KycStatus.PENDING).length;
    const inReviewKyc = allKyc.filter((k) => k.status === KycStatus.IN_REVIEW).length;
    const approvedKyc = allKyc.filter((k) => k.status === KycStatus.APPROVED).length;
    const rejectedKyc = allKyc.filter((k) => k.status === KycStatus.REJECTED).length;

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
      },
      kyc: {
        pending: pendingKyc,
        inReview: inReviewKyc,
        approved: approvedKyc,
        rejected: rejectedKyc,
      },
    };
  }

  async getUsers(dto: FilterUsersDto) {
    const { email, cnicNumber, kycStatus, page = 1, limit = 10 } = dto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (email) {
      queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
    }

    // Join KYC for filtering
    queryBuilder.leftJoinAndSelect('user.id', 'kycId');

    const skip = (page - 1) * limit;
    const [users, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    // Get KYC data for each user
    const usersWithKyc = await Promise.all(
      users.map(async (user) => {
        const kyc = await this.kycRepository.findOneByUserId(user.id);
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified,
          kycStatus: kyc?.status,
          kycSubmissionCount: kyc?.submissionCount,
          createdAt: user.createdAt,
        };
      }),
    );

    // Filter by KYC status if provided
    let filteredUsers = usersWithKyc;
    if (kycStatus) {
      filteredUsers = usersWithKyc.filter((u) => u.kycStatus === kycStatus);
    }

    // Filter by CNIC if provided
    if (cnicNumber) {
      const kycWithCnic = await this.kycRepository.findOneByCnic(cnicNumber);
      if (kycWithCnic) {
        filteredUsers = filteredUsers.filter((u) => u.id === kycWithCnic.userId);
      } else {
        filteredUsers = [];
      }
    }

    return {
      users: filteredUsers,
      pagination: {
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const kyc = await this.kycRepository.findOneByUserId(userId);
    const auditLogs = await this.auditLogRepository.findByUserId(userId, 1, 20);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      kyc: kyc
        ? {
            id: kyc.id,
            status: kyc.status,
            city: kyc.city,
            province: kyc.province,
            country: kyc.country,
            gender: kyc.gender,
            dateOfBirth: kyc.dateOfBirth,
            cnicNumber: kyc.cnicNumber,
            rejectionReason: kyc.rejectionReason,
            submissionCount: kyc.submissionCount,
            reviewedAt: kyc.reviewedAt,
            approvedAt: kyc.approvedAt,
            documents: kyc.documents.map((doc) => ({
              id: doc.id,
              type: doc.type,
              status: doc.status,
              fileName: doc.fileName,
              createdAt: doc.createdAt,
            })),
          }
        : null,
      auditLogs: auditLogs[0].slice(0, 20).map((log) => ({
        action: log.action,
        description: log.description,
        createdAt: log.createdAt,
      })),
    };
  }

  async approveKyc(userId: string, adminId: string, dto: ApproveKycDto) {
    const kyc = await this.kycRepository.findOneByUserId(userId);

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    if (kyc.status === KycStatus.APPROVED) {
      return {
        success: true,
        message: 'KYC already approved',
      };
    }

    await this.kycRepository.update(kyc.id, {
      status: KycStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      approvedAt: new Date(),
      rejectionReason: undefined,
    });

    // Send email notification
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      // You can customize this email notification
      this.logger.log(`KYC approved for user ${user.email}`);
    }

    // Create audit log
    await this.auditLogRepository.create({
      userId,
      performedBy: adminId,
      action: AuditAction.KYC_APPROVED,
      description: 'KYC approved by admin',
      metadata: { note: dto.note },
    });

    this.logger.log(`KYC approved for user ${userId} by admin ${adminId}`);

    return {
      success: true,
      message: 'KYC approved successfully',
    };
  }

  async rejectKyc(userId: string, adminId: string, dto: RejectKycDto) {
    const kyc = await this.kycRepository.findOneByUserId(userId);

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    await this.kycRepository.update(kyc.id, {
      status: KycStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      rejectionReason: dto.reason,
    });

    // Send email notification
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      this.logger.log(`KYC rejected for user ${user.email}`);
    }

    // Create audit log
    await this.auditLogRepository.create({
      userId,
      performedBy: adminId,
      action: AuditAction.KYC_REJECTED,
      description: 'KYC rejected by admin',
      metadata: { reason: dto.reason },
    });

    this.logger.log(`KYC rejected for user ${userId} by admin ${adminId}`);

    return {
      success: true,
      message: 'KYC rejected successfully',
    };
  }

  async requestDocuments(userId: string, adminId: string, dto: RequestDocumentsDto) {
    const kyc = await this.kycRepository.findOneByUserId(userId);

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    await this.kycRepository.update(kyc.id, {
      status: KycStatus.IN_REVIEW,
    });

    // Send email notification
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      this.logger.log(`Documents requested from user ${user.email}`);
    }

    // Create audit log
    await this.auditLogRepository.create({
      userId,
      performedBy: adminId,
      action: AuditAction.DOCUMENT_REQUESTED,
      description: 'Additional documents requested by admin',
      metadata: { documentTypes: dto.documentTypes, message: dto.message },
    });

    this.logger.log(`Documents requested for user ${userId} by admin ${adminId}`);

    return {
      success: true,
      message: 'Document request sent successfully',
    };
  }

  async getAuditLogs(userId?: string, page: number = 1, limit: number = 50) {
    if (userId) {
      const [logs, total] = await this.auditLogRepository.findByUserId(userId, page, limit);
      return {
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          description: log.description,
          createdAt: log.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const [logs, total] = await this.auditLogRepository.findAll(page, limit);
    return {
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        createdAt: log.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

