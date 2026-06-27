import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InstallationEntity,
  InstallationStatus,
} from '../../installation/entity/installation.entity';
import { UpdateInstallationStatusDto } from './dto/update-installation-status.dto';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '../../audit-log/audit-action.enum';

@Injectable()
export class VendorInstallationService {
  private readonly logger = new Logger(VendorInstallationService.name);
  constructor(
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    private readonly auditLogService: AuditLogService,
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
    opts?: { clientIp?: string },
  ): Promise<InstallationEntity> {
    const installation = await this.findOne(id, vendorId);
    const previousStatus = installation.status;
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
    if (updateStatusDto.status === InstallationStatus.COMPLETED) {
      const mid = updateStatusDto.meterId?.trim();
      if (!mid) {
        throw new BadRequestException(
          'meterId is required when marking installation as completed',
        );
      }
      const duplicate = await this.installationRepository
        .createQueryBuilder('i')
        .where('i.vendor_id = :vid', { vid: vendorId })
        .andWhere('LOWER(TRIM(i.meter_id)) = LOWER(TRIM(:mid))', { mid })
        .andWhere('i.id != :id', { id: installation.id })
        .getExists();
      if (duplicate) {
        throw new ConflictException(
          'This meter ID is already assigned to another installation for your company.',
        );
      }
      installation.meterId = mid;
      installation.isActive = true;
      if (!installation.verifiedAt) {
        installation.verifiedAt = new Date();
      }
    }
    if (updateStatusDto.status === InstallationStatus.REJECTED) {
      installation.isActive = false;
    }
    const updated = await this.installationRepository.save(installation);
    this.logger.log(
      `Installation ${id} status updated to ${updateStatusDto.status} by vendor ${vendorId}`,
    );
    try {
      await this.auditLogService.append({
        actorUserId: vendorId,
        action: AuditAction.INSTALLATION_STATUS_UPDATED,
        entityType: 'installation',
        entityId: String(id),
        metadata: {
          previousStatus,
          newStatus: updateStatusDto.status,
          meterId: updated.meterId ?? null,
        },
        ip: opts?.clientIp ?? null,
      });
    } catch (err) {
      this.logger.error('Failed to write audit log for installation update', err);
    }
    return updated;
  }
}
