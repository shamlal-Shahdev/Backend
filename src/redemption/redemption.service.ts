import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedemptionEntity } from './entity/redemption.entity';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { UpdateRedemptionDto } from './dto/update-redemption.dto';
@Injectable()
export class RedemptionService {
  constructor(
    @InjectRepository(RedemptionEntity)
    private readonly redemptionRepository: Repository<RedemptionEntity>,
  ) {}
  async create(
    createRedemptionDto: CreateRedemptionDto,
  ): Promise<RedemptionEntity> {
    const redemption = this.redemptionRepository.create(createRedemptionDto);
    return await this.redemptionRepository.save(redemption);
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[RedemptionEntity[], number]> {
    const [data, total] = await this.redemptionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'marketplaceItem'],
      order: { createdAt: 'DESC' },
    });
    return [data, total];
  }
  async findOne(id: number): Promise<RedemptionEntity> {
    const redemption = await this.redemptionRepository.findOne({
      where: { id },
      relations: ['user', 'marketplaceItem'],
    });
    if (!redemption) {
      throw new NotFoundException(`Redemption with ID ${id} not found`);
    }
    return redemption;
  }
  async update(
    id: number,
    updateRedemptionDto: UpdateRedemptionDto,
  ): Promise<RedemptionEntity> {
    const redemption = await this.findOne(id);
    Object.assign(redemption, updateRedemptionDto);
    return await this.redemptionRepository.save(redemption);
  }
  async remove(id: number): Promise<void> {
    const redemption = await this.findOne(id);
    await this.redemptionRepository.remove(redemption);
  }
}
