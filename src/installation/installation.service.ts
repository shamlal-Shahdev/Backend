import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InstallationEntity,
  InstallationStatus,
} from './entity/installation.entity';
import { CreateInstallationDto } from './dto/create-installation.dto';
import { UpdateInstallationDto } from './dto/update-installation.dto';
import { UserEntity, UserRole } from '../user/entity/user.entity';
import { PropertySegment, validateCapacityForSegment } from './property-segment';
@Injectable()
export class InstallationService {
  constructor(
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async create(
    createInstallationDto: CreateInstallationDto & { userId: number },
  ): Promise<InstallationEntity> {
    const vendor = await this.userRepository.findOne({
      where: { id: createInstallationDto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException(
        `Vendor with ID ${createInstallationDto.vendorId} not found`,
      );
    }
    if (vendor.role !== UserRole.VENDOR) {
      throw new BadRequestException(
        `User with ID ${createInstallationDto.vendorId} is not a vendor`,
      );
    }
    if (!vendor.isVerified) {
      throw new BadRequestException(
        `Vendor with ID ${createInstallationDto.vendorId} is not verified`,
      );
    }
    validateCapacityForSegment(
      createInstallationDto.propertySegment,
      createInstallationDto.capacityKw,
    );
    const existingRejected = await this.installationRepository.findOne({
      where: {
        userId: createInstallationDto.userId,
        status: InstallationStatus.REJECTED,
      },
      order: { registeredAt: 'DESC' },
    });
    if (existingRejected) {
      existingRejected.name = createInstallationDto.name;
      existingRejected.installationType = createInstallationDto.installationType;
      existingRejected.capacityKw = createInstallationDto.capacityKw;
      existingRejected.propertySegment = createInstallationDto.propertySegment;
      existingRejected.location = createInstallationDto.location;
      existingRejected.latitude =
        createInstallationDto.latitude ?? null;
      existingRejected.longitude =
        createInstallationDto.longitude ?? null;
      existingRejected.vendorId = createInstallationDto.vendorId;
      existingRejected.rooftopAvailable = createInstallationDto.rooftopAvailable;
      existingRejected.status = InstallationStatus.SUBMITTED;
      existingRejected.registeredAt = new Date();
      return await this.installationRepository.save(existingRejected);
    }
    const installation = this.installationRepository.create({
      ...createInstallationDto,
      status: createInstallationDto.status || InstallationStatus.SUBMITTED,
    });
    return await this.installationRepository.save(installation);
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: number,
  ): Promise<[InstallationEntity[], number]> {
    const whereCondition = userId ? { userId } : {};
    const [data, total] = await this.installationRepository.findAndCount({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'vendor'],
      order: { registeredAt: 'DESC' },
    });
    return [data, total];
  }
  async findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: InstallationEntity[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.findAll(page, limit, userId);
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
      relations: ['user', 'vendor', 'devices'],
    });
    if (!installation) {
      throw new NotFoundException(`Installation with ID ${id} not found`);
    }
    return installation;
  }
  async update(
    id: number,
    updateInstallationDto: UpdateInstallationDto,
  ): Promise<InstallationEntity> {
    const installation = await this.findOne(id);
    if (
      updateInstallationDto.propertySegment !== undefined ||
      updateInstallationDto.capacityKw !== undefined
    ) {
      const segment = (updateInstallationDto.propertySegment ??
        installation.propertySegment) as PropertySegment;
      const capacity = Number(
        updateInstallationDto.capacityKw ?? installation.capacityKw,
      );
      validateCapacityForSegment(segment, capacity);
    }
    Object.assign(installation, updateInstallationDto);
    return await this.installationRepository.save(installation);
  }
  async remove(id: number): Promise<void> {
    const installation = await this.findOne(id);
    await this.installationRepository.remove(installation);
  }
  async cancelInstallation(id: number, userId: number): Promise<void> {
    const installation = await this.findOne(id);
    if (installation.userId !== userId) {
      throw new NotFoundException('Installation not found');
    }
    if (installation.status !== InstallationStatus.SUBMITTED) {
      throw new BadRequestException(
        'Installation can only be cancelled when status is SUBMITTED',
      );
    }
    await this.installationRepository.remove(installation);
  }
  async getUserInstallations(userId: number): Promise<InstallationEntity[]> {
    try {
      console.log('userId', userId);
      const installations = await this.installationRepository.find({
        where: { userId },
      });
      console.log('installations', installations);
      return installations;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get user installations');
    }
  }
}
