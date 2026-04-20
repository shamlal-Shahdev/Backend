import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../../user/entity/user.entity';
import {
  InstallationEntity,
  InstallationStatus,
} from '../../installation/entity/installation.entity';
import {
  EnergyRequestEntity,
  EnergyRequestStatus,
} from '../../energy-request/entity/energy-request.entity';
import { KycSubmissionStatus } from '../../kyc/kyc-submission-status.enum';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
  ) {}

  private async countUsersWithLatestKycStatus(
    status: KycSubmissionStatus,
  ): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT(u.id)', 'cnt')
      .where('u.role = :role', { role: UserRole.USER })
      .andWhere(
        `(
          SELECT k.status FROM kyc k
          WHERE k.user_id = u.id
          ORDER BY (k.submitted_at IS NULL), k.submitted_at DESC
          LIMIT 1
        ) = :status`,
        { status },
      )
      .getRawOne();
    return parseInt(String(raw?.cnt ?? '0'), 10);
  }

  async getDashboardStats() {
    const pendingKyc = await this.countUsersWithLatestKycStatus(
      KycSubmissionStatus.PENDING,
    );
    const approvedKyc = await this.countUsersWithLatestKycStatus(
      KycSubmissionStatus.APPROVED,
    );
    const rejectedKyc = await this.countUsersWithLatestKycStatus(
      KycSubmissionStatus.REJECTED,
    );
    const inReviewKyc = await this.countUsersWithLatestKycStatus(
      KycSubmissionStatus.IN_REVIEW,
    );
    const submittedInstallations = await this.installationRepository.count({
      where: { status: InstallationStatus.SUBMITTED },
    });
    const assignedInstallations = await this.installationRepository.count({
      where: { status: InstallationStatus.ASSIGNED },
    });
    const inProgressInstallations = await this.installationRepository.count({
      where: { status: InstallationStatus.IN_PROGRESS },
    });
    const completedInstallations = await this.installationRepository.count({
      where: { status: InstallationStatus.COMPLETED },
    });
    const rejectedInstallations = await this.installationRepository.count({
      where: { status: InstallationStatus.REJECTED },
    });
    const pendingEnergy = await this.energyRequestRepository.count({
      where: { status: EnergyRequestStatus.PENDING },
    });
    const approvedEnergy = await this.energyRequestRepository.count({
      where: { status: EnergyRequestStatus.APPROVED },
    });
    const rejectedEnergy = await this.energyRequestRepository.count({
      where: { status: EnergyRequestStatus.REJECTED },
    });
    const rewardGeneratedEnergy = await this.energyRequestRepository.count({
      where: { status: EnergyRequestStatus.REWARD_GENERATED },
    });
    const blockchainFailedEnergy = await this.energyRequestRepository.count({
      where: { status: EnergyRequestStatus.BLOCKCHAIN_FAILED },
    });
    return {
      kyc: {
        pending: pendingKyc,
        inReview: inReviewKyc,
        approved: approvedKyc,
        rejected: rejectedKyc,
      },
      installations: {
        submitted: submittedInstallations,
        assigned: assignedInstallations,
        inProgress: inProgressInstallations,
        completed: completedInstallations,
        rejected: rejectedInstallations,
      },
      energyRequests: {
        pending: pendingEnergy,
        approved: approvedEnergy,
        rejected: rejectedEnergy,
        rewardGenerated: rewardGeneratedEnergy,
        blockchainFailed: blockchainFailedEnergy,
      },
    };
  }
}
