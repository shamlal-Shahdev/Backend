import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entity/user.entity';
import { FilterUsersDto } from './dto/filter-users.dto';
import { KycSubmissionStatus } from '../../kyc/kyc-submission-status.enum';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getUsers(dto: FilterUsersDto) {
    const { email, kycStatus, page = 1, limit = 10 } = dto;
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    if (email) {
      queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
    }
    if (kycStatus) {
      queryBuilder.andWhere(
        `COALESCE((
          SELECT k2.status FROM kyc k2
          WHERE k2.user_id = user.id
          ORDER BY k2.submitted_at DESC NULLS LAST
          LIMIT 1
        ), :notSubmitted) = :kycStatus`,
        {
          kycStatus,
          notSubmitted: KycSubmissionStatus.NOT_SUBMITTED,
        },
      );
    }
    queryBuilder.leftJoinAndSelect('user.kycDocuments', 'kyc');
    const skip = (page - 1) * limit;
    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const usersWithKyc = users.map((user) => {
      const kycDocs = [...(user.kycDocuments || [])].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
      const latestKyc = kycDocs[0];
      const effectiveKycStatus =
        latestKyc?.status ?? KycSubmissionStatus.NOT_SUBMITTED;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        kycStatus: effectiveKycStatus,
        kycSubmissionCount: kycDocs.length,
        createdAt: user.createdAt,
        latestKycSubmittedAt: latestKyc?.submittedAt || null,
      };
    });
    return {
      users: usersWithKyc,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['kycDocuments'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const kycDocuments = [...(user.kycDocuments || [])].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
    const latest = kycDocuments[0];
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
      kyc: {
        documents: kycDocuments.map((doc) => ({
          id: doc.id,
          CnicFrontUrl: doc.CnicFrontUrl,
          CnicBackUrl: doc.CnicBackUrl,
          SelfieUrl: doc.SelfieUrl,
          UtilityBillUrl: doc.UtilityBillUrl,
          submittedAt: doc.submittedAt,
          reviewedAt: doc.reviewedAt,
          adminNotes: doc.adminNotes,
          status: doc.status,
          rejectionReason: doc.rejectionReason,
        })),
        totalDocuments: kycDocuments.length,
      },
    };
  }
}
