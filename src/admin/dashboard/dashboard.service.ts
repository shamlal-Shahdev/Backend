import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, KycStatus, UserRole } from '../../user/entity/user.entity';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count({
      where: { role: UserRole.USER },
    });
    const verifiedUsers = await this.userRepository.count({
      where: { isVerified: true, role: UserRole.USER },
    });

    // Count users by their kycStatus
    const pendingKyc = await this.userRepository.count({
      where: { kycStatus: KycStatus.PENDING, role: UserRole.USER },
    });
    const approvedKyc = await this.userRepository.count({
      where: { kycStatus: KycStatus.APPROVED, role: UserRole.USER },
    });
    const rejectedKyc = await this.userRepository.count({
      where: { kycStatus: KycStatus.REJECTED, role: UserRole.USER },
    });
    const inReviewKyc = await this.userRepository.count({
      where: { kycStatus: KycStatus.IN_REVIEW, role: UserRole.USER },
    });
    console.log('Pending KYC', pendingKyc);
    console.log('Approved KYC', approvedKyc);
    console.log('Rejected KYC', rejectedKyc);
    console.log('In Review KYC', inReviewKyc);

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
}
