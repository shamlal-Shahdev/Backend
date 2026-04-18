import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InstallationEntity,
  InstallationStatus,
} from '../../installation/entity/installation.entity';
import { UpdateInstallationStatusDto } from './dto/update-installation-status.dto';
@Injectable()
export class VendorInstallationService {
  private readonly logger = new Logger(VendorInstallationService.name);
  constructor(
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
  ) {}
  async findAll(vendorId: number, page: number = 1, limit: number = 10) {
    const [data, total] = await this.installationRepository.findAndCount({
      where: { vendorId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'vendor'],
      order: { registeredAt: 'DESC' },
    });
    this.logger.log(
      `Retrieved ${data.length} installations for vendor ${vendorId} (page ${page}, total: ${total})`,
    );
    return {
      data,
      total,
      page,
      limit,
    };
  }
  async findOne(id: number, vendorId: number): Promise<InstallationEntity> {
    const installation = await this.installationRepository.findOne({
      where: { id, vendorId },
      relations: ['user', 'vendor'],
    });
    if (!installation) {
      throw new NotFoundException(
        `Installation with ID ${id} not found or not assigned to this vendor`,
      );
    }
    return installation;
  }
  async updateStatus(
    id: number,
    vendorId: number,
    updateStatusDto: UpdateInstallationStatusDto,
  ): Promise<InstallationEntity> {
    const installation = await this.findOne(id, vendorId);
    if (
      updateStatusDto.status !== InstallationStatus.IN_PROGRESS &&
      updateStatusDto.status !== InstallationStatus.COMPLETED &&
      updateStatusDto.status !== InstallationStatus.REJECTED
    ) {
      throw new ForbiddenException(
        'Vendors can only update status to IN_PROGRESS, COMPLETED, or REJECTED',
      );
    }
    if (
      installation.status === InstallationStatus.SUBMITTED &&
      updateStatusDto.status === InstallationStatus.COMPLETED
    ) {
      throw new ForbiddenException(
        'Cannot mark installation as COMPLETED from SUBMITTED status. Must be IN_PROGRESS first.',
      );
    }
    if (
      installation.status === InstallationStatus.COMPLETED &&
      updateStatusDto.status === InstallationStatus.IN_PROGRESS
    ) {
      throw new ForbiddenException(
        'Cannot change status from COMPLETED back to IN_PROGRESS',
      );
    }
    if (
      installation.status === InstallationStatus.REJECTED &&
      updateStatusDto.status !== InstallationStatus.REJECTED
    ) {
      throw new ForbiddenException(
        'Cannot change status from REJECTED. Installation is permanently rejected.',
      );
    }
    if (
      installation.status === InstallationStatus.COMPLETED &&
      updateStatusDto.status === InstallationStatus.REJECTED
    ) {
      throw new ForbiddenException(
        'Cannot reject an installation that is already COMPLETED',
      );
    }
    installation.status = updateStatusDto.status;
    if (
      updateStatusDto.status === InstallationStatus.COMPLETED &&
      !installation.verifiedAt
    ) {
      installation.verifiedAt = new Date();
    }
    const updated = await this.installationRepository.save(installation);
    this.logger.log(
      `Installation ${id} status updated to ${updateStatusDto.status} by vendor ${vendorId}`,
    );
    return updated;
  }
}
