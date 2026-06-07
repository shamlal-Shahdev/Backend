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
    /** When set, only that user's rewards (non-admin API). */
    filterUserId?: number,
  ): Promise<{
    items: RewardTransactionEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.rewardTransactionRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.installation', 'installation')
      .leftJoinAndSelect('r.oracle', 'oracle')
      .orderBy('r.issuedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (filterUserId !== undefined) {
      qb.andWhere('r.user_id = :filterUserId', { filterUserId });
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
  async findUsersWithRewards(
    page: number = 1,
    limit: number = 25,
  ): Promise<{
    items: Array<{
      userId: number;
      user: { id: number; name: string; email: string };
      transactionCount: number;
      totalTokens: number;
      totalKwh: number;
      lastIssuedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const items = await this.rewardTransactionRepository
      .createQueryBuilder('r')
      .innerJoin('r.user', 'user')
      .select('r.user_id', 'userId')
      .addSelect('user.id', 'user_id')
      .addSelect('user.name', 'user_name')
      .addSelect('user.email', 'user_email')
      .addSelect('COUNT(r.id)', 'transactionCount')
      .addSelect('SUM(r.tokens_amount)', 'totalTokens')
      .addSelect('SUM(r.kwh_rewarded)', 'totalKwh')
      .addSelect('MAX(r.issued_at)', 'lastIssuedAt')
      .groupBy('r.user_id')
      .addGroupBy('user.id')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .orderBy('MAX(r.issued_at)', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const countResult = await this.rewardTransactionRepository
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.user_id)', 'count')
      .getRawOne<{ count: string }>();

    return {
      items: items.map((row) => ({
        userId: Number(row.userId),
        user: {
          id: Number(row.user_id),
          name: row.user_name,
          email: row.user_email,
        },
        transactionCount: Number(row.transactionCount),
        totalTokens: Number(row.totalTokens),
        totalKwh: Number(row.totalKwh),
        lastIssuedAt: row.lastIssuedAt,
      })),
      total: Number(countResult?.count ?? 0),
      page,
      limit,
    };
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
