import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallationEntity } from './entity/installation.entity';
import { CreateInstallationDto } from './dto/create-installation.dto';
import { UpdateInstallationDto } from './dto/update-installation.dto';

@Injectable()
export class InstallationService {
  constructor(
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
  ) {}

  async create(
    createInstallationDto: CreateInstallationDto,
  ): Promise<InstallationEntity> {
    const installation = this.installationRepository.create(
      createInstallationDto,
    );
    return await this.installationRepository.save(installation);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[InstallationEntity[], number]> {
    const [data, total] = await this.installationRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
      order: { registeredAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<InstallationEntity> {
    const installation = await this.installationRepository.findOne({
      where: { id },
      relations: ['user', 'devices'],
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
    Object.assign(installation, updateInstallationDto);
    return await this.installationRepository.save(installation);
  }

  async remove(id: number): Promise<void> {
    const installation = await this.findOne(id);
    await this.installationRepository.remove(installation);
  }
}
