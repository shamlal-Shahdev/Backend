import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceItemEntity } from './entity/marketplace-item.entity';
import { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';

@Injectable()
export class MarketplaceItemService {
  constructor(
    @InjectRepository(MarketplaceItemEntity)
    private readonly marketplaceItemRepository: Repository<MarketplaceItemEntity>,
  ) {}

  async create(
    createMarketplaceItemDto: CreateMarketplaceItemDto,
  ): Promise<MarketplaceItemEntity> {
    const marketplaceItem = this.marketplaceItemRepository.create(
      createMarketplaceItemDto,
    );
    return await this.marketplaceItemRepository.save(marketplaceItem);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[MarketplaceItemEntity[], number]> {
    const [data, total] = await this.marketplaceItemRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<MarketplaceItemEntity> {
    const marketplaceItem = await this.marketplaceItemRepository.findOne({
      where: { id },
    });

    if (!marketplaceItem) {
      throw new NotFoundException(`Marketplace Item with ID ${id} not found`);
    }

    return marketplaceItem;
  }

  async update(
    id: number,
    updateMarketplaceItemDto: UpdateMarketplaceItemDto,
  ): Promise<MarketplaceItemEntity> {
    const marketplaceItem = await this.findOne(id);
    Object.assign(marketplaceItem, updateMarketplaceItemDto);
    return await this.marketplaceItemRepository.save(marketplaceItem);
  }

  async remove(id: number): Promise<void> {
    const marketplaceItem = await this.findOne(id);
    await this.marketplaceItemRepository.remove(marketplaceItem);
  }
}
