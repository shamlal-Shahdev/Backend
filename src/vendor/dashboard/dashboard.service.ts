import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallationEntity, InstallationStatus } from '../../installation/entity/installation.entity';

@Injectable()
export class VendorDashboardService {
  private readonly logger = new Logger(VendorDashboardService.name);

  constructor(
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
  ) {}

  async getDashboardStats(vendorId: number) {
    // Count installations by status for this vendor
    const submitted = await this.installationRepository.count({
      where: { vendorId, status: InstallationStatus.SUBMITTED },
    });
    const assigned = await this.installationRepository.count({
      where: { vendorId, status: InstallationStatus.ASSIGNED },
    });
    const inProgress = await this.installationRepository.count({
      where: { vendorId, status: InstallationStatus.IN_PROGRESS },
    });
    const completed = await this.installationRepository.count({
      where: { vendorId, status: InstallationStatus.COMPLETED },
    });
    const rejected = await this.installationRepository.count({
      where: { vendorId, status: InstallationStatus.REJECTED },
    });

    return {
      installations: {
        submitted,
        assigned,
        inProgress,
        completed,
        rejected,
      },
    };
  }
}
