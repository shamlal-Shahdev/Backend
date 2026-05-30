import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CertificateEntity } from './entity/certificate.entity';
import { CertificateEligibilityService } from './certificate-eligibility.service';
import { CertificatePdfService } from './certificate-pdf.service';
import { UserCarbonMetricsService } from '../user/user-carbon-metrics.service';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { FilesService } from '../files/files.service';
import { EmailService } from '../email/email.service';
import { UserEntity } from '../user/entity/user.entity';
import {
  InstallationEntity,
} from '../installation/entity/installation.entity';
import { EnergyRequestEntity } from '../energy-request/entity/energy-request.entity';
import { RewardTransactionEntity } from '../reward-transaction/entity/reward-transaction.entity';
import { CertificateStatus } from './certificate.enums';
import {
  generateCertificatePublicId,
  getAchievementLevel,
  getSustainabilityBadge,
  getTreesEquivalent,
} from './certificate-metrics.util';
import { AllConfigType } from '../config/config.type';
import { CertificateMapper } from './certificate.mapper';
import { buildVerifyUrl, parseUsagePeriod, roundToTwoDecimals } from './certificate.util';

export type CertificateGenerationInput = {
  userId: number;
  month: number;
  year: number;
  energyGeneratedKwh: number;
  rewardAmount: number;
  transactionHash: string;
  energyRequestId?: number | null;
  rewardTransactionId?: number | null;
  meterId?: string | null;
  verifiedAt?: Date | null;
};

@Injectable()
export class CertificateGenerationService {
  private readonly logger = new Logger(CertificateGenerationService.name);

  constructor(
    @InjectRepository(CertificateEntity)
    private readonly certificateRepository: Repository<CertificateEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly eligibilityService: CertificateEligibilityService,
    private readonly pdfService: CertificatePdfService,
    private readonly carbonMetricsService: UserCarbonMetricsService,
    private readonly userWalletService: UserWalletService,
    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async tryGenerateFromEnergyRequest(
    request: EnergyRequestEntity,
    energyGeneratedKwh: number,
  ): Promise<CertificateEntity | null> {
    if (!request.blockchainTxHash || !request.rewardAmount) {
      return null;
    }
    return this.tryGenerate({
      userId: request.userId,
      month: request.month,
      year: request.year,
      energyGeneratedKwh,
      rewardAmount: Number(request.rewardAmount),
      transactionHash: request.blockchainTxHash,
      energyRequestId: request.id,
      meterId:
        request.meterIdFromImage ??
        request.ocrMeterIdCandidate ??
        null,
      verifiedAt: request.updatedAt,
    });
  }

  async tryGenerateFromRewardTransaction(
    reward: RewardTransactionEntity,
    installation: InstallationEntity,
  ): Promise<CertificateEntity | null> {
    if (!reward.txHash) {
      return null;
    }
    const parsedPeriod = parseUsagePeriod(reward.usagePeriodYearMonth);
    if (!parsedPeriod) {
      this.logger.warn(
        `Reward ${reward.id} has no usage period; skipping certificate generation.`,
      );
      return null;
    }
    const { year, month } = parsedPeriod;
    return this.tryGenerate({
      userId: reward.userId,
      month,
      year,
      energyGeneratedKwh: Number(reward.kwhRewarded),
      rewardAmount: Number(reward.tokensAmount),
      transactionHash: reward.txHash,
      rewardTransactionId: reward.id,
      meterId: installation.meterId,
      verifiedAt: reward.issuedAt,
    });
  }

  async tryGenerate(
    input: CertificateGenerationInput,
  ): Promise<CertificateEntity | null> {
    try {
      const eligibility = await this.eligibilityService.checkEligibility(
        input.userId,
        input.month,
        input.year,
      );
      if (!eligibility.eligible) {
        this.logger.warn(
          `Certificate skipped for user ${input.userId} (${input.month}/${input.year}): ${eligibility.reason}`,
        );
        return null;
      }

      const user = await this.userRepository.findOne({
        where: { id: input.userId },
      });
      if (!user) {
        return null;
      }

      const installation = await this.loadInstallationWithVendor(
        eligibility.installation.id,
      );
      const walletAddress =
        (await this.userWalletService.getWalletAddressForUser(input.userId)) ??
        '';

      const co2OffsetKg =
        input.energyGeneratedKwh *
        this.carbonMetricsService.getCarbonFactorKgPerKwh();
      const roundedCo2 = roundToTwoDecimals(co2OffsetKg);
      const treesEquivalent = getTreesEquivalent(roundedCo2);
      const achievementLevel = getAchievementLevel(input.energyGeneratedKwh);
      const cumulativeKwh = await this.getCumulativeKwh(
        input.userId,
        input.energyGeneratedKwh,
      );
      const badge = getSustainabilityBadge(cumulativeKwh);
      const certificateId = generateCertificatePublicId(input.year, input.month);
      const issueDate = new Date();
      const verifyUrl = buildVerifyUrl(
        this.configService.getOrThrow('app.frontendUrl', { infer: true }),
        certificateId,
      );

      const pdfBuffer = await this.pdfService.generatePdf(
        CertificateMapper.toPdfInputFromGeneration({
          certificateId,
          issueDate,
          user,
          walletAddress,
          installation,
          month: input.month,
          year: input.year,
          energyGeneratedKwh: input.energyGeneratedKwh,
          meterId: input.meterId ?? installation.meterId,
          verifiedAt: input.verifiedAt ?? issueDate,
          co2OffsetKg: roundedCo2,
          treesEquivalent,
          achievementLevel,
          badge,
          rewardAmount: input.rewardAmount,
          transactionHash: input.transactionHash,
          verifyUrl,
        }),
      );

      const stored = await this.filesService.saveBuffer(
        pdfBuffer,
        'certificates',
        'pdf',
      );

      const certificate = this.certificateRepository.create({
        certificateId,
        userId: input.userId,
        installationId: installation.id,
        vendorId: installation.vendorId,
        walletAddress,
        month: input.month,
        year: input.year,
        totalKwh: input.energyGeneratedKwh,
        totalCo2Offset: roundedCo2,
        rewardAmount: input.rewardAmount,
        treesEquivalent,
        achievementLevel,
        badge,
        transactionHash: input.transactionHash,
        qrCodeUrl: verifyUrl,
        filePath: stored.key,
        status: CertificateStatus.ACTIVE,
        energyRequestId: input.energyRequestId ?? null,
        rewardTransactionId: input.rewardTransactionId ?? null,
        meterId: input.meterId ?? installation.meterId,
        verifiedAt: input.verifiedAt ?? issueDate,
        generatedAt: issueDate,
      });

      const saved = await this.certificateRepository.save(certificate);

      try {
        await this.emailService.sendCertificateGeneratedEmail(
          user.email,
          user.name,
          input.month,
          input.year,
          input.energyGeneratedKwh,
          certificateId,
          verifyUrl,
        );
      } catch (emailError) {
        this.logger.error(
          `Certificate email failed for user ${input.userId}:`,
          emailError,
        );
      }

      this.logger.log(
        `Certificate ${certificateId} generated for user ${input.userId}`,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `Certificate generation failed for user ${input.userId}:`,
        error,
      );
      return null;
    }
  }

  private async loadInstallationWithVendor(
    installationId: number,
  ): Promise<InstallationEntity> {
    const installation = await this.certificateRepository.manager
      .getRepository(InstallationEntity)
      .findOne({
        where: { id: installationId },
        relations: ['vendor'],
      });
    if (!installation) {
      throw new Error(`Installation ${installationId} not found`);
    }
    return installation;
  }

  private async getCumulativeKwh(
    userId: number,
    currentMonthKwh: number,
  ): Promise<number> {
    const result = await this.certificateRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.totalKwh), 0)', 'total')
      .where('c.userId = :userId', { userId })
      .andWhere('c.status = :status', { status: CertificateStatus.ACTIVE })
      .getRawOne<{ total: string }>();
    const previousTotal = parseFloat(result?.total ?? '0');
    return previousTotal + currentMonthKwh;
  }
}
