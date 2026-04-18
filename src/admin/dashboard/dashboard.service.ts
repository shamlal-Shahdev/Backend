import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, KycStatus, UserRole } from '../../user/entity/user.entity';
import { InstallationEntity, InstallationStatus } from '../../installation/entity/installation.entity';
import { EnergyRequestEntity, EnergyRequestStatus } from '../../energy-request/entity/energy-request.entity';
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
  async getDashboardStats() {
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
