import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entity/user.entity';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { FilterUsersDto } from './dto/filter-users.dto';
@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
  ) {}
  async getUsers(dto: FilterUsersDto) {
    const { email, kycStatus, page = 1, limit = 10 } = dto;
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    if (email) {
      queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
    }
    if (kycStatus) {
      queryBuilder.andWhere('user.kycStatus = :kycStatus', { kycStatus });
    }
    queryBuilder.leftJoinAndSelect('user.kycDocuments', 'kyc');
    const skip = (page - 1) * limit;
    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const usersWithKyc = users.map((user) => {
      const kycDocs = user.kycDocuments || [];
      const latestKyc = kycDocs.length > 0 ? kycDocs[0] : null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus || 'not_submitted',
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
    const kycDocuments = user.kycDocuments || [];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      kycStatus: user.kycStatus,
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
        })),
        totalDocuments: kycDocuments.length,
      },
    };
  }
}
