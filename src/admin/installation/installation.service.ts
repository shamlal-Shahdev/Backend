import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InstallationEntity,
  InstallationStatus,
} from '../../installation/entity/installation.entity';
import { UpdateInstallationDto } from '../../installation/dto/update-installation.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';
import { UserEntity, UserRole } from '../../user/entity/user.entity';
@Injectable()
export class AdminInstallationService {
  private readonly logger = new Logger(AdminInstallationService.name);
  constructor(
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: InstallationEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.installationRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'vendor'],
      order: { registeredAt: 'DESC' },
    });
    this.logger.log(
      `Retrieved ${data.length} installation requests (page ${page}, total: ${total})`,
    );
    return {
      data,
      total,
      page,
      limit,
    };
  }
  async findOne(id: number): Promise<InstallationEntity> {
    const installation = await this.installationRepository.findOne({
      where: { id },
      relations: ['user', 'vendor'],
    });
    if (!installation) {
      throw new NotFoundException(
        `Installation request with ID ${id} not found`,
      );
    }
    return installation;
  }
  async assignVendor(
    id: number,
    assignVendorDto: AssignVendorDto,
  ): Promise<InstallationEntity> {
    const installation = await this.findOne(id);
    const vendor = await this.userRepository.findOne({
      where: { id: assignVendorDto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException(
        `Vendor with ID ${assignVendorDto.vendorId} not found`,
      );
    }
    if (vendor.role !== UserRole.VENDOR) {
      throw new BadRequestException(
        `User with ID ${assignVendorDto.vendorId} is not a vendor`,
      );
    }
    installation.vendorId = assignVendorDto.vendorId;
    installation.status = InstallationStatus.ASSIGNED;
    const updated = await this.installationRepository.save(installation);
    this.logger.log(
      `Installation ${id} assigned to vendor ${assignVendorDto.vendorId}`,
    );
    return updated;
  }
  async update(
    id: number,
    updateInstallationDto: UpdateInstallationDto,
  ): Promise<InstallationEntity> {
    const installation = await this.findOne(id);
    Object.assign(installation, updateInstallationDto);
    if (
      updateInstallationDto.status === InstallationStatus.COMPLETED &&
      !installation.verifiedAt
    ) {
      installation.verifiedAt = new Date();
    }
    const updated = await this.installationRepository.save(installation);
    this.logger.log(`Installation request ${id} updated successfully`);
    return updated;
  }
  async remove(id: number): Promise<void> {
    const installation = await this.findOne(id);
    await this.installationRepository.remove(installation);
    this.logger.log(`Installation request ${id} deleted successfully`);
  }
}
