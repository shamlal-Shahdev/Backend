import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AllConfigType } from '../../config/config.type';
import { FilesService } from '../../files/files.service';
import {
  InstallationEntity,
  InstallationStatus,
} from '../../installation/entity/installation.entity';
import {
  RewardReason,
  RewardTransactionEntity,
} from '../../reward-transaction/entity/reward-transaction.entity';
import { TokenMintEventEntity } from '../../token-mint-event/entity/token-mint-event.entity';
import { WalletBalanceEntity } from '../../wallet-balance/entity/wallet-balance.entity';
import { TokenService } from '../../blockchain/token.service';
import { WalletService } from '../../blockchain/wallet.service';
import { UserWalletService } from '../../user-wallet/user-wallet.service';
import { CertificateGenerationService } from '../../certificate/certificate-generation.service';
import { PredictionEvaluationService } from '../../prediction/prediction-evaluation.service';
import { VendorUsageImportParserService } from './vendor-usage-import-parser.service';
import {
  VendorUsageImportBatchEntity,
  VendorUsageImportBatchStatus,
} from './entity/vendor-usage-import-batch.entity';
import {
  VendorUsageImportRowEntity,
  VendorUsageImportRowStatus,
} from './entity/vendor-usage-import-row.entity';

type PendingCertificateJob = {
  rewardTransactionId: number;
  installationId: number;
};

@Injectable()
export class VendorUsageImportService {
  private readonly logger = new Logger(VendorUsageImportService.name);

  constructor(
    @InjectRepository(VendorUsageImportBatchEntity)
    private readonly batchRepository: Repository<VendorUsageImportBatchEntity>,
    @InjectRepository(VendorUsageImportRowEntity)
    private readonly rowRepository: Repository<VendorUsageImportRowEntity>,
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly filesService: FilesService,
    private readonly parser: VendorUsageImportParserService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly tokenService: TokenService,
    private readonly walletService: WalletService,
    private readonly userWalletService: UserWalletService,
    private readonly certificateGenerationService: CertificateGenerationService,
    private readonly predictionEvaluationService: PredictionEvaluationService,
  ) {}

  getTokensPerKwh(): number {
    return this.configService.get('app.vendorUsageTokensPerKwh', {
      infer: true,
    })!;
  }

  private getCurrentPeriodYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  async createFromUpload(
    vendorUserId: number,
    periodYearMonth: string,
    file: Express.Multer.File,
  ): Promise<VendorUsageImportBatchEntity> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    const currentPeriod = this.getCurrentPeriodYearMonth();
    if (periodYearMonth !== currentPeriod) {
      throw new BadRequestException(
        `Only usage for the current month (${currentPeriod}) can be uploaded.`,
      );
    }
    const ext = this.extensionOf(file.originalname);
    if (ext !== 'csv' && ext !== 'xlsx') {
      throw new BadRequestException('Only .csv and .xlsx files are allowed');
    }

    const existingActive = await this.batchRepository.findOne({
      where: {
        vendorUserId,
        periodYearMonth,
        status: In([
          VendorUsageImportBatchStatus.COMPLETED,
          VendorUsageImportBatchStatus.PROCESSING,
        ]),
      },
    });
    if (existingActive) {
      if (existingActive.status === VendorUsageImportBatchStatus.COMPLETED) {
        throw new ConflictException(
          `Usage for ${periodYearMonth} is already finalized. Contact support to replace a file.`,
        );
      } else {
        throw new ConflictException(
          `Usage for ${periodYearMonth} is currently processing. Please wait.`,
        );
      }
    }

    await this.batchRepository.delete({
      vendorUserId,
      periodYearMonth,
      status: In([
        VendorUsageImportBatchStatus.PENDING,
        VendorUsageImportBatchStatus.FAILED,
      ]),
    });

    const fileHash = createHash('sha256').update(file.buffer).digest('hex');
    const uploaded = await this.filesService.uploadFile(
      file,
      'vendor-usage-imports',
    );

    const batch = this.batchRepository.create({
      vendorUserId,
      periodYearMonth,
      originalFilename: file.originalname,
      fileId: uploaded.id,
      fileHash,
      status: VendorUsageImportBatchStatus.PENDING,
    });
    const saved = await this.batchRepository.save(batch);

    try {
      const parsed = await this.parser.parseBuffer(file.buffer, ext);
      const rows: VendorUsageImportRowEntity[] = [];
      for (const p of parsed) {
        const installation = await this.findInstallationForMeter(
          vendorUserId,
          p.meterId,
        );
        if (!installation) {
          rows.push(
            this.rowRepository.create({
              batchId: saved.id,
              rowNumber: p.rowNumber,
              meterId: p.meterId.trim(),
              totalKwh: p.totalKwh,
              status: VendorUsageImportRowStatus.REJECTED,
              reasonCode: 'UNKNOWN_METER',
              installationId: null,
            }),
          );
        } else if (installation.status !== InstallationStatus.COMPLETED) {
          rows.push(
            this.rowRepository.create({
              batchId: saved.id,
              rowNumber: p.rowNumber,
              meterId: p.meterId.trim(),
              totalKwh: p.totalKwh,
              status: VendorUsageImportRowStatus.REJECTED,
              reasonCode: 'INSTALLATION_NOT_COMPLETED',
              installationId: installation.id,
            }),
          );
        } else {
          rows.push(
            this.rowRepository.create({
              batchId: saved.id,
              rowNumber: p.rowNumber,
              meterId: p.meterId.trim(),
              totalKwh: p.totalKwh,
              status: VendorUsageImportRowStatus.ACCEPTED,
              reasonCode: null,
              installationId: installation.id,
            }),
          );
        }
      }
      await this.rowRepository.save(rows);
    } catch (err) {
      saved.status = VendorUsageImportBatchStatus.FAILED;
      saved.errorMessage =
        err instanceof Error ? err.message : 'Failed to parse file';
      await this.batchRepository.save(saved);
      throw err;
    }

    await this.processBatch(saved.id, vendorUserId);
    return this.findOneForVendor(saved.id, vendorUserId);
  }

  private extensionOf(name: string): 'csv' | 'xlsx' | 'other' {
    const n = name.toLowerCase();
    if (n.endsWith('.csv')) {
      return 'csv';
    }
    if (n.endsWith('.xlsx')) {
      return 'xlsx';
    }
    return 'other';
  }

  private async findInstallationForMeter(
    vendorUserId: number,
    meterId: string,
  ): Promise<InstallationEntity | null> {
    const trimmed = meterId.trim();
    if (!trimmed) {
      return null;
    }
    return this.installationRepository
      .createQueryBuilder('i')
      .where('i.vendor_id = :vid', { vid: vendorUserId })
      .andWhere('LOWER(TRIM(i.meter_id)) = LOWER(TRIM(:mid))', {
        mid: trimmed,
      })
      .getOne();
  }

  /**
   * Processes accepted rows by minting tokens on-chain first, then persisting reward rows.
   * Idempotent: skips batches already COMPLETED and rows already linked to rewards.
   */
  async processBatch(
    batchId: number,
    vendorUserId?: number,
  ): Promise<VendorUsageImportBatchEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const batch = await queryRunner.manager.findOne(
        VendorUsageImportBatchEntity,
        {
          where: { id: batchId },
          lock: { mode: 'pessimistic_write' },
        },
      );
      if (!batch) {
        throw new NotFoundException(`Batch ${batchId} not found`);
      }
      if (vendorUserId != null && batch.vendorUserId !== vendorUserId) {
        throw new NotFoundException(`Batch ${batchId} not found`);
      }
      if (batch.status === VendorUsageImportBatchStatus.COMPLETED) {
        await queryRunner.commitTransaction();
        return batch;
      }

      batch.status = VendorUsageImportBatchStatus.PROCESSING;
      await queryRunner.manager.save(batch);

      const tokensPerKwh = this.getTokensPerKwh();
      const rows = await queryRunner.manager.find(VendorUsageImportRowEntity, {
        where: { batchId },
        order: { rowNumber: 'ASC' },
      });
      const affectedUserIds = new Set<number>();

      let acceptedCredited = 0;
      let acceptedSkipped = 0;
      let rejected = 0;
      let mintFailed = 0;
      const pendingCertificates: PendingCertificateJob[] = [];

      for (const row of rows) {
        if (row.status === VendorUsageImportRowStatus.REJECTED) {
          rejected++;
          continue;
        }
        if (row.rewardTransactionId) {
          acceptedSkipped++;
          continue;
        }
        if (
          row.status !== VendorUsageImportRowStatus.ACCEPTED ||
          !row.installationId
        ) {
          rejected++;
          continue;
        }

        const installation = await queryRunner.manager.findOne(
          InstallationEntity,
          { where: { id: row.installationId } },
        );
        if (!installation) {
          await this.markRowRejected(
            queryRunner.manager,
            row,
            'INSTALLATION_MISSING',
          );
          rejected++;
          continue;
        }

        const existingReward = await queryRunner.manager.findOne(
          RewardTransactionEntity,
          {
            where: {
              installationId: installation.id,
              usagePeriodYearMonth: batch.periodYearMonth,
              reason: RewardReason.VENDOR_MONTHLY_USAGE,
            },
          },
        );
        if (existingReward) {
          if (!existingReward.txHash) {
            try {
              const minted = await this.mintRewardForUser(
                installation.userId,
                Number(existingReward.tokensAmount),
              );
              existingReward.txHash = minted.txHash;
              await queryRunner.manager.save(existingReward);
              await this.ensureTokenMintEvent(
                queryRunner.manager,
                existingReward.id,
                minted.txHash,
                Number(existingReward.tokensAmount),
              );
            } catch (mintErr) {
              await this.markRowRejected(
                queryRunner.manager,
                row,
                'BLOCKCHAIN_MINT_FAILED',
              );
              rejected++;
              mintFailed++;
              this.logger.error(
                `Batch ${batchId} row ${row.rowNumber}: failed to mint existing reward ${existingReward.id}: ${
                  mintErr instanceof Error ? mintErr.message : String(mintErr)
                }`,
              );
              continue;
            }
          }
          row.rewardTransactionId = existingReward.id;
          row.txHash = existingReward.txHash;
          await queryRunner.manager.save(row);
          affectedUserIds.add(installation.userId);
          acceptedSkipped++;
          
          pendingCertificates.push({
            rewardTransactionId: existingReward.id,
            installationId: installation.id,
          });

          continue;
        }

        const kwh = Number(row.totalKwh);
        const tokensAmount = Math.round(kwh * tokensPerKwh * 1e8) / 1e8;

        let mintTxHash: string;
        try {
          const minted = await this.mintRewardForUser(
            installation.userId,
            tokensAmount,
          );
          mintTxHash = minted.txHash;
        } catch (mintErr) {
          await this.markRowRejected(
            queryRunner.manager,
            row,
            'BLOCKCHAIN_MINT_FAILED',
          );
          rejected++;
          mintFailed++;
          this.logger.error(
            `Batch ${batchId} row ${row.rowNumber}: mint failed for user ${installation.userId}: ${
              mintErr instanceof Error ? mintErr.message : String(mintErr)
            }`,
          );
          continue;
        }

        const reward = queryRunner.manager.create(RewardTransactionEntity, {
          userId: installation.userId,
          installationId: installation.id,
          tokensAmount,
          tokensPerKwh,
          kwhRewarded: kwh,
          txHash: mintTxHash,
          reason: RewardReason.VENDOR_MONTHLY_USAGE,
          oracleId: null,
          vendorUsageBatchId: batch.id,
          usagePeriodYearMonth: batch.periodYearMonth,
        });
        const savedReward = await queryRunner.manager.save(reward);

        await this.ensureTokenMintEvent(
          queryRunner.manager,
          savedReward.id,
          mintTxHash,
          tokensAmount,
        );
        affectedUserIds.add(installation.userId);

        row.rewardTransactionId = savedReward.id;
        row.txHash = mintTxHash;
        await queryRunner.manager.save(row);
        pendingCertificates.push({
          rewardTransactionId: savedReward.id,
          installationId: installation.id,
        });
        acceptedCredited++;
      }

      for (const userId of affectedUserIds) {
        await this.reconcileWalletBalanceFromRewards(queryRunner.manager, userId);
      }

      batch.status = VendorUsageImportBatchStatus.COMPLETED;
      batch.summaryJson = {
        acceptedCredited,
        acceptedSkipped,
        rejected,
        mintFailed,
        totalRows: rows.length,
      };
      batch.errorMessage = null;
      await queryRunner.manager.save(batch);

      await queryRunner.commitTransaction();
      try {
        await this.generateCertificatesForBatch(pendingCertificates);
      } catch (err) {
        this.logger.error(`Batch ${batchId}: failed to generate certificates: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        const evaluationRows = rows
          .filter(
            (row) =>
              row.installationId &&
              row.status !== VendorUsageImportRowStatus.REJECTED,
          )
          .map((row) => ({
            installationId: row.installationId!,
            actualKwh: Number(row.totalKwh),
          }));
        if (evaluationRows.length > 0) {
          await this.predictionEvaluationService.evaluateForPeriod(
            batch.periodYearMonth,
            evaluationRows,
          );
        }
      } catch (err) {
        this.logger.error(`Batch ${batchId}: failed to evaluate predictions: ${err instanceof Error ? err.message : String(err)}`);
      }

      this.logger.log(
        `Vendor usage batch ${batchId} completed: credited=${acceptedCredited} skipped=${acceptedSkipped} rejected=${rejected} mintFailed=${mintFailed}`,
      );
      return batch;
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      const batch = await this.batchRepository.findOne({
        where: { id: batchId },
      });
      if (batch) {
        batch.status = VendorUsageImportBatchStatus.FAILED;
        batch.errorMessage = e instanceof Error ? e.message : String(e);
        await this.batchRepository.save(batch);
      }
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateCertificatesForBatch(
    jobs: PendingCertificateJob[],
  ): Promise<void> {
    for (const job of jobs) {
      const reward = await this.dataSource
        .getRepository(RewardTransactionEntity)
        .findOne({ where: { id: job.rewardTransactionId } });
      const installation = await this.installationRepository.findOne({
        where: { id: job.installationId },
      });
      if (!reward || !installation || !reward.txHash) {
        continue;
      }
      await this.certificateGenerationService.tryGenerateFromRewardTransaction(
        reward,
        installation,
      );
    }
  }

  private async markRowRejected(
    manager: EntityManager,
    row: VendorUsageImportRowEntity,
    reasonCode: string,
  ): Promise<void> {
    row.status = VendorUsageImportRowStatus.REJECTED;
    row.reasonCode = reasonCode;
    await manager.save(row);
  }

  private async mintRewardForUser(
    userId: number,
    rewardAmount: number,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const wallet = await this.userWalletService.getOrCreateWalletForUser(
      userId,
      () => this.walletService.createWallet(),
    );
    return this.tokenService.mintTo(wallet.address, rewardAmount);
  }

  private async ensureTokenMintEvent(
    manager: EntityManager,
    rewardTransactionId: number,
    txHash: string,
    amount: number,
  ): Promise<void> {
    const repo = manager.getRepository(TokenMintEventEntity);
    const existing = await repo.findOne({
      where: { rewardTransactionId },
    });
    if (existing) {
      return;
    }
    const mintEvent = repo.create({
      rewardTransactionId,
      txHash,
      amount,
    });
    await repo.save(mintEvent);
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

  async findAllForVendor(
    vendorUserId: number,
    page = 1,
    limit = 10,
  ): Promise<{
    data: VendorUsageImportBatchEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.batchRepository.findAndCount({
      where: { vendorUserId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['rows'],
    });
    return { data, total, page, limit };
  }

  async findOneForVendor(
    id: number,
    vendorUserId: number,
  ): Promise<VendorUsageImportBatchEntity> {
    const batch = await this.batchRepository.findOne({
      where: { id, vendorUserId },
      relations: ['rows'],
    });
    if (!batch) {
      throw new NotFoundException(`Import batch ${id} not found`);
    }
    return batch;
  }

  async processPendingBatchesForCron(): Promise<void> {
    const pending = await this.batchRepository.find({
      where: { status: VendorUsageImportBatchStatus.PENDING },
      select: ['id', 'vendorUserId'],
    });
    for (const b of pending) {
      try {
        await this.processBatch(b.id, b.vendorUserId);
      } catch (e) {
        this.logger.error(
          `Cron: failed processing batch ${b.id}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
  }

  getCsvTemplate(): string {
    return [
      'meter_id,total_kwh',
      '# total_kwh = kWh consumed in the selected calendar month (not cumulative register)',
    ].join('\n');
  }
}
