import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenMintEventEntity } from './entity/token-mint-event.entity';
import { CreateTokenMintEventDto } from './dto/create-token-mint-event.dto';
import { UpdateTokenMintEventDto } from './dto/update-token-mint-event.dto';

@Injectable()
export class TokenMintEventService {
  constructor(
    @InjectRepository(TokenMintEventEntity)
    private readonly tokenMintEventRepository: Repository<TokenMintEventEntity>,
  ) {}

  async create(
    createTokenMintEventDto: CreateTokenMintEventDto,
  ): Promise<TokenMintEventEntity> {
    const existingEvent = await this.tokenMintEventRepository.findOne({
      where: {
        rewardTransactionId: createTokenMintEventDto.rewardTransactionId,
      },
    });

    if (existingEvent) {
      throw new ConflictException(
        'Token mint event for this reward transaction already exists',
      );
    }

    const tokenMintEvent = this.tokenMintEventRepository.create(
      createTokenMintEventDto,
    );
    return await this.tokenMintEventRepository.save(tokenMintEvent);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[TokenMintEventEntity[], number]> {
    const [data, total] = await this.tokenMintEventRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['rewardTransaction'],
      order: { mintedAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<TokenMintEventEntity> {
    const tokenMintEvent = await this.tokenMintEventRepository.findOne({
      where: { id },
      relations: ['rewardTransaction'],
    });

    if (!tokenMintEvent) {
      throw new NotFoundException(`Token Mint Event with ID ${id} not found`);
    }

    return tokenMintEvent;
  }

  async update(
    id: number,
    updateTokenMintEventDto: UpdateTokenMintEventDto,
  ): Promise<TokenMintEventEntity> {
    const tokenMintEvent = await this.findOne(id);

    if (updateTokenMintEventDto.rewardTransactionId) {
      const existingEvent = await this.tokenMintEventRepository.findOne({
        where: {
          rewardTransactionId: updateTokenMintEventDto.rewardTransactionId,
        },
      });

      if (existingEvent && existingEvent.id !== id) {
        throw new ConflictException(
          'Token mint event for this reward transaction already exists',
        );
      }
    }

    Object.assign(tokenMintEvent, updateTokenMintEventDto);
    return await this.tokenMintEventRepository.save(tokenMintEvent);
  }

  async remove(id: number): Promise<void> {
    const tokenMintEvent = await this.findOne(id);
    await this.tokenMintEventRepository.remove(tokenMintEvent);
  }
}
