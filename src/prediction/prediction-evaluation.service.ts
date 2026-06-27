import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AllConfigType } from '../config/config.type';
import {
  PredictionEntity,
  PredictionStatus,
} from './entity/prediction.entity';
import { PredictionResultEntity } from '../prediction-result/entity/prediction-result.entity';
import {
  RewardReason,
  RewardTransactionEntity,
} from '../reward-transaction/entity/reward-transaction.entity';
import { TokenMintEventEntity } from '../token-mint-event/entity/token-mint-event.entity';
import { WalletBalanceEntity } from '../wallet-balance/entity/wallet-balance.entity';
import { TokenService } from '../blockchain/token.service';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { EmailService } from '../email/email.service';

export type InstallationActualKwh = {
  installationId: number;
  actualKwh: number;
};

@Injectable()
export class PredictionEvaluationService {
  private readonly logger = new Logger(PredictionEvaluationService.name);

  constructor(
    @InjectRepository(PredictionEntity)
    private readonly predictionRepository: Repository<PredictionEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly tokenService: TokenService,
    private readonly userWalletService: UserWalletService,
    private readonly emailService: EmailService,
  ) {}

  calculateAccuracy(predictedKwh: number, actualKwh: number): number {
    if (actualKwh <= 0) {
      return 0;
    }
    const diff = Math.abs(predictedKwh - actualKwh);
    const accuracy = (1 - diff / actualKwh) * 100;
    return Math.max(0, Math.round(accuracy * 100) / 100);
  }

  getRewardForAccuracy(accuracy: number): number {
    const high = this.configService.get('app.predictionRewardHigh', {
      infer: true,
    })!;
    const medium = this.configService.get('app.predictionRewardMedium', {
      infer: true,
    })!;
    const low = this.configService.get('app.predictionRewardLow', {
      infer: true,
    })!;

    if (accuracy >= 95) {
      return high;
    }
    if (accuracy >= 90) {
      return medium;
    }
    if (accuracy >= 80) {
      return low;
    }
    return 0;
  }

  parsePeriodYearMonth(periodYearMonth: string): { year: number; month: number } {
    const [yearStr, monthStr] = periodYearMonth.split('-');
    return {
      year: parseInt(yearStr, 10),
      month: parseInt(monthStr, 10),
    };
  }

  async evaluateForPeriod(
    periodYearMonth: string,
    rows: InstallationActualKwh[],
  ): Promise<void> {
    const { year, month } = this.parsePeriodYearMonth(periodYearMonth);
    const byInstallation = new Map<number, number>();
    for (const row of rows) {
      if (row.installationId != null) {
        byInstallation.set(row.installationId, row.actualKwh);
      }
    }

    for (const [installationId, actualKwh] of byInstallation) {
      try {
        await this.evaluateInstallationPrediction(
          installationId,
          year,
          month,
          actualKwh,
          periodYearMonth,
        );
      } catch (err) {
        this.logger.error(
          `Failed to evaluate prediction for installation ${installationId} (${periodYearMonth}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  /** When vendor data exists but prediction was submitted later, evaluate on read/submit. */
  async tryEvaluateIfUsageAvailable(
    installationId: number,
    year: number,
    month: number,
  ): Promise<void> {
    const periodYearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const actualKwh = await this.getActualKwhForPeriod(
      installationId,
      periodYearMonth,
    );
    if (actualKwh == null) {
      return;
    }
    await this.evaluateInstallationPrediction(
      installationId,
      year,
      month,
      actualKwh,
      periodYearMonth,
    );
  }

  async reconcileLockedPredictionsForUser(userId: number): Promise<void> {
    const locked = await this.predictionRepository.find({
      where: { userId, status: PredictionStatus.LOCKED },
    });
    for (const prediction of locked) {
      try {
        await this.tryEvaluateIfUsageAvailable(
          prediction.installationId,
          prediction.year,
          prediction.month,
        );
      } catch (err) {
        this.logger.error(
          `Failed to reconcile prediction ${prediction.id} for user ${userId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  private async getActualKwhForPeriod(
    installationId: number,
    periodYearMonth: string,
  ): Promise<number | null> {
    const reward = await this.dataSource
      .getRepository(RewardTransactionEntity)
      .findOne({
        where: {
          installationId,
          usagePeriodYearMonth: periodYearMonth,
          reason: RewardReason.VENDOR_MONTHLY_USAGE,
        },
      });
    if (reward) {
      return Number(reward.kwhRewarded);
    }
    return null;
  }

  private async evaluateInstallationPrediction(
    installationId: number,
    year: number,
    month: number,
    actualKwh: number,
    periodYearMonth: string,
  ): Promise<void> {
    const prediction = await this.predictionRepository.findOne({
      where: {
        installationId,
        year,
        month,
        status: PredictionStatus.LOCKED,
      },
      relations: ['user', 'predictionResult'],
    });

    if (!prediction || prediction.predictionResult) {
      return;
    }

    const predictedKwh = Number(prediction.predictedKwh);
    const accuracy = this.calculateAccuracy(predictedKwh, actualKwh);
    const rewardTokens = this.getRewardForAccuracy(accuracy);
    const bonusAwarded = rewardTokens > 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let rewardTransactionId: number | null = null;
      let txHash: string | null = null;

      if (bonusAwarded) {
        const minted = await this.mintRewardForUser(
          prediction.userId,
          rewardTokens,
        );
        txHash = minted.txHash;

        const reward = queryRunner.manager.create(RewardTransactionEntity, {
          userId: prediction.userId,
          installationId: prediction.installationId,
          tokensAmount: rewardTokens,
          tokensPerKwh: 0,
          kwhRewarded: actualKwh,
          txHash: minted.txHash,
          reason: RewardReason.PREDICTION_BONUS,
          oracleId: null,
          vendorUsageBatchId: null,
          usagePeriodYearMonth: periodYearMonth,
        });
        const savedReward = await queryRunner.manager.save(reward);
        rewardTransactionId = savedReward.id;

        await this.ensureTokenMintEvent(
          queryRunner.manager,
          savedReward.id,
          minted.txHash,
          rewardTokens,
        );

        await this.reconcileWalletBalanceFromRewards(
          queryRunner.manager,
          prediction.userId,
        );
      }

      const result = queryRunner.manager.create(PredictionResultEntity, {
        predictionId: prediction.id,
        actualKwh,
        accuracyPercent: accuracy,
        rewardTokens,
        bonusAwarded,
        rewardTransactionId,
      });
      await queryRunner.manager.save(result);

      prediction.status = PredictionStatus.EVALUATED;
      await queryRunner.manager.save(prediction);

      await queryRunner.commitTransaction();

      if (prediction.user?.email) {
        await this.emailService.sendPredictionBonusEmail(
          prediction.user.email,
          prediction.user.name,
          month,
          year,
          predictedKwh,
          actualKwh,
          accuracy,
          rewardTokens,
          txHash ?? undefined,
        );
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async mintRewardForUser(
    userId: number,
    rewardAmount: number,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const walletAddress =
      await this.userWalletService.getWalletAddressForUser(userId);
    if (!walletAddress?.trim()) {
      throw new Error(`No wallet address found for user ${userId}`);
    }
    return this.tokenService.mintTo(walletAddress, rewardAmount);
  }

  private async ensureTokenMintEvent(
    manager: EntityManager,
    rewardTransactionId: number,
    txHash: string,
    amount: number,
  ): Promise<void> {
    const repo = manager.getRepository(TokenMintEventEntity);
    const existing = await repo.findOne({ where: { rewardTransactionId } });
    if (existing) {
      return;
    }
    await repo.save(
      repo.create({
        rewardTransactionId,
        txHash,
        amount,
      }),
    );
  }

  private async reconcileWalletBalanceFromRewards(
    manager: EntityManager,
    userId: number,
  ): Promise<void> {
    const totalResult = await manager
      .getRepository(RewardTransactionEntity)
      .createQueryBuilder('rt')
      .select('COALESCE(SUM(rt.tokens_amount), 0)', 'total')
      .where('rt.user_id = :userId', { userId })
      .getRawOne<{ total: string | null }>();

    const totalFromRewards = Number(totalResult?.total ?? 0);
    const normalizedTotal =
      Math.round((Number.isFinite(totalFromRewards) ? totalFromRewards : 0) * 1e8) /
      1e8;

    const repo = manager.getRepository(WalletBalanceEntity);
    let wb = await repo.findOne({
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wb) {
      wb = repo.create({ userId, balance: 0 });
    }

    wb.balance = normalizedTotal;
    await repo.save(wb);
  }
}
