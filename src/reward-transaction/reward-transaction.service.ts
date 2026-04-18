import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardTransactionEntity } from './entity/reward-transaction.entity';
import { CreateRewardTransactionDto } from './dto/create-reward-transaction.dto';
import { UpdateRewardTransactionDto } from './dto/update-reward-transaction.dto';
@Injectable()
export class RewardTransactionService {
  constructor(
    @InjectRepository(RewardTransactionEntity)
    private readonly rewardTransactionRepository: Repository<RewardTransactionEntity>,
  ) {}
  async create(
    createRewardTransactionDto: CreateRewardTransactionDto,
  ): Promise<RewardTransactionEntity> {
    const rewardTransaction = this.rewardTransactionRepository.create(
      createRewardTransactionDto,
    );
    return await this.rewardTransactionRepository.save(rewardTransaction);
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[RewardTransactionEntity[], number]> {
    const [data, total] = await this.rewardTransactionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'installation', 'oracle'],
      order: { issuedAt: 'DESC' },
    });
    return [data, total];
  }
  async findOne(id: number): Promise<RewardTransactionEntity> {
    const rewardTransaction = await this.rewardTransactionRepository.findOne({
      where: { id },
      relations: ['user', 'installation', 'oracle', 'tokenMintEvent'],
    });
    if (!rewardTransaction) {
      throw new NotFoundException(`Reward Transaction with ID ${id} not found`);
    }
    return rewardTransaction;
  }
  async update(
    id: number,
    updateRewardTransactionDto: UpdateRewardTransactionDto,
  ): Promise<RewardTransactionEntity> {
    const rewardTransaction = await this.findOne(id);
    Object.assign(rewardTransaction, updateRewardTransactionDto);
    return await this.rewardTransactionRepository.save(rewardTransaction);
  }
  async remove(id: number): Promise<void> {
    const rewardTransaction = await this.findOne(id);
    await this.rewardTransactionRepository.remove(rewardTransaction);
  }
}
