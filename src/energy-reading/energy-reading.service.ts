import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyReadingEntity } from './entity/energy-reading.entity';
import { CreateEnergyReadingDto } from './dto/create-energy-reading.dto';
import { UpdateEnergyReadingDto } from './dto/update-energy-reading.dto';
@Injectable()
export class EnergyReadingService {
  constructor(
    @InjectRepository(EnergyReadingEntity)
    private readonly energyReadingRepository: Repository<EnergyReadingEntity>,
  ) {}
  async create(
    createEnergyReadingDto: CreateEnergyReadingDto,
  ): Promise<EnergyReadingEntity> {
    const energyReading = this.energyReadingRepository.create(
      createEnergyReadingDto,
    );
    return await this.energyReadingRepository.save(energyReading);
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[EnergyReadingEntity[], number]> {
    const [data, total] = await this.energyReadingRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['device', 'installation', 'oracle'],
      order: { timestamp: 'DESC' },
    });
    return [data, total];
  }
  async findOne(id: number): Promise<EnergyReadingEntity> {
    const energyReading = await this.energyReadingRepository.findOne({
      where: { id },
      relations: ['device', 'installation', 'oracle'],
    });
    if (!energyReading) {
      throw new NotFoundException(`Energy Reading with ID ${id} not found`);
    }
    return energyReading;
  }
  async update(
    id: number,
    updateEnergyReadingDto: UpdateEnergyReadingDto,
  ): Promise<EnergyReadingEntity> {
    const energyReading = await this.findOne(id);
    Object.assign(energyReading, updateEnergyReadingDto);
    return await this.energyReadingRepository.save(energyReading);
  }
  async remove(id: number): Promise<void> {
    const energyReading = await this.findOne(id);
    await this.energyReadingRepository.remove(energyReading);
  }
}
